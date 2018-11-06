#!/usr/bin/env node

import * as gaze from 'gaze';
import * as htmlparser from 'htmlparser';
import * as juice from 'juice';
import * as fs from 'mz/fs';
import { renderSync } from 'node-sass';
import { extname, parse as parseFileName, relative } from 'path';
import { renderFile } from 'pug';
import { compile, extractImports } from './compiler';
import { Widget } from './models/flutter-model';
import { Element } from './models/html-model';
import { renderDartFile } from './renderer';
import { merge, multiline, clone } from './tools';
import * as removeEmptyChildren from './plugins/remove-empty-children';
import { Block, Tag, Attribute, Text } from './models/pug-model'
import * as pugparse from 'pug-parser'
import * as puglex from 'pug-lexer'
import * as pugcodegen from 'pug-code-gen'
import * as pugwrap from 'pug-runtime/wrap'
import * as pugload from 'pug-load'
import * as puglinker from 'pug-linker'

export interface RenderPlugin {
	transformWidget(widget: Widget, options: Options) : Widget
}

export interface Options {
	indentation: 2, // the indentation of the code to generate
	plugins?: string[],
	imports: string[], // a list of imports to put in every generated file
	tagClasses: { // a map of tags with their asociated classes
		div: string, // the class to represent a div in dart code
		text: string // the class to represent text in dart code
		span: string, // the class to represent a span element in dart code
		button: string, // the class to represent a button element in dart code
		backgroundUrlImg: string, // the class to represent a background url image
		backgroundAssetImg: string // the class to represent a background asset image
	}, 
	multiChildClasses: string[], // a list of classes that have a children constructor parameter

	autowrapChildren?: true, // use a wrapper child if a tag without a children parameter has multiple children in the template
	autowrapChildrenClass?: string, // the class to use as the child wrapper
	showPugLineNumbers?: boolean // show Pug line numbers in the dart file?
	showCommentsInDart?: boolean // show html classes and ids as comment lines in the dart file?
	reportErrorsInDart?: boolean, // should errors also be reported in the dart file?
	propagateDelete?: boolean, // should genenerated dart file be deleted if the pug/html file with the same name is deleted?
	debug?: { // some debugging settings
		logHTML?: boolean, // log the generated merged style html
		logHtmlAST?: boolean, // log the generated AST from the parsed html
		logDartPreAST?: boolean, // log the generated AST from compiling the html AST
		logDartPostAST?: boolean, // log the generated AST after applying the plugins on the generated AST
		logCode?: boolean, // log the generated code
		logErrorStack?: boolean // log the full error stracktrace when an error occurs
	}
}

const defaultOptions: Options = {
	indentation: 2,
	plugins: [
		"./plugins/add-constructor-params",
		"./plugins/styles-to-params",
		"./plugins/process-display-params",
		"./plugins/process-theme-style",
		"./plugins/process-duration-params",
		"./plugins/process-scoped-animation-tag",
		"./plugins/process-scoped-tag",
		"./plugins/process-reactive-tag",
		"./plugins/process-assign-tag",
		"./plugins/process-builder-tag",
		"./plugins/process-as-param",
		"./plugins/process-array-tag",
		"./plugins/automatic-columns",
		"./plugins/process-container-text-style",
		"./plugins/process-container-style",
		"./plugins/process-layout-style",
		"./plugins/process-color-style",
		"./plugins/process-positioned-tag",
		"./plugins/process-axis-alignment",
		"./plugins/process-text",
		"./plugins/process-number-properties",
		"./plugins/process-boolean-properties"
	],
	imports: [
		'package:flutter/material.dart',
		'package:flutter/cupertino.dart'
	],
	tagClasses: {
		text: 'Text',
		div: 'Container',
		span: 'Wrap',
		button: 'RaisedButton',
		backgroundAssetImg: 'ExactAssetImage',
		backgroundUrlImg: 'NetworkImage'
	},
	multiChildClasses: [
		'Row',
		'Column',
		'Stack',
		'IndexedStack',
		'GridView',
		'Flow',
		'Table',
		'Wrap',
		'ListBody',
		'ListView',
		'CustomMultiChildLayout'
	],
	autowrapChildren: true,
	autowrapChildrenClass: 'Column',
	showPugLineNumbers: true,
	showCommentsInDart: true,
	reportErrorsInDart: true,
	propagateDelete: true,
	debug: {
		logHTML: false,
		logHtmlAST: false,
		logDartPreAST: false,
		logDartPostAST: false,
		logCode: false,
		logErrorStack: false
	}
}

export function startWatching(dir: string, configFileName: string, watch: boolean) {

	let options: Options
	let plugins: RenderPlugin[]

	function loadOptions() {
		options = clone(defaultOptions)
		if(fs.existsSync(configFileName)) {
			const loadedOptions = JSON.parse(fs.readFileSync(configFileName).toString())
			options = merge(options, loadedOptions)
		}
		plugins = []
		if(options && options.plugins) {
			for(let plugin of options.plugins) {
				try {
					const pluginFn = require(plugin)
					plugins.push(pluginFn)
				} catch(e) {
					console.error(`error loading ${plugin}`, e)
				}
			}
		}
	}

	loadOptions()

	gaze('**/*.+(pug|htm|html|sass|css)', { cwd: dir }, (err, watcher) => {

		function processAllWatched() {
			const dirs = watcher.watched()
			for(var dir of Object.keys(dirs)) {
				for(var sourceFile of dirs[dir]) {
					if(extname(sourceFile).length > 0) {
						processFile(sourceFile, false)
							.then(dartFile=>{if(dartFile) console.log('updated', relative(process.cwd(), dartFile))})
							.catch(error=>reportError(sourceFile, error, options))
					}
				}
			}
		}

		// process all watched files once
		processAllWatched()

		// stop if we do not want to keep watching
		if(!watch) {
			watcher.close()
			return
		}
		
		// process again if flutter-view updates
		gaze('flutter-view.json', (err, watcher) => {
			watcher.on('changed', sourceFile => {
				console.log('flutter-view updated')
				loadOptions()
				processAllWatched()
			})
		})
	
		// watch for changes
		watcher.on('added', sourceFile => {
			processFile(sourceFile, true)
				.then(dartFile=>{if(dartFile) console.log('added', relative(process.cwd(), dartFile))})
				.catch(error=>reportError(sourceFile, error, options))
		})
		watcher.on('changed', sourceFile => {
			processFile(sourceFile, true)
				.then(dartFile=>{if(dartFile) console.log('updated', relative(process.cwd(), dartFile))})
				.catch(error=>reportError(sourceFile, error, options))
		})
		watcher.on('deleted', sourceFile => {
			if(options.propagateDelete) {
				const p = parseFileName(sourceFile)
				const dartFile = `${p.dir}/${p.name}.dart`
				if(fs.existsSync(dartFile)) {
					fs.unlinkSync(dartFile)
					console.log('deleted', relative(process.cwd(), dartFile))
				}
			}
		})
	
	})
	
	function renderPugFileAsHtml(file: string) : string {
		const templateName = 'flutter'
		const parsed: Block = pugload.file(file, {
			lex: puglex,
			parse: pugparse,
			basedir: dir
		})
		const linked: Block = puglinker(parsed)
		addPugLineAttributes(linked)
		const codegenfn = pugcodegen(linked, {
			compileDebug: false,
			pretty: true,
			inlineRuntimeFunctions: false,
			templateName
		});
		const pugTemplate = pugwrap(codegenfn, templateName);
		return pugTemplate()
	}

	function addPugLineAttributes(block: Block) {
		const tags = block.nodes.filter(node=>node.type=='Tag') as Tag[]
		for(let tag of tags) {
			if(!tag.line) continue
			tag.attrs = tag.attrs || []
			tag.attrs.push({
				name: 'pug-line',
				val: `"${tag.line},${tag.column}"`,
				mustEscape: true
			})
			if(tag.block) addPugLineAttributes(tag.block)
		}
	}

	async function processFile(file: string, isUpdate: boolean) : Promise<string> {
		const relativeFile = relative(process.cwd(), file)
		// extract the html from the file, depending on the type
		let html
		switch(extname(file)) {
			case '.pug': {
				html = renderPugFileAsHtml(file)
				// html = await renderFile(file)
				break
			}
			case '.htm': case '.html': {
				html = fs.readFileSync(file).toString()
				break
			}
			case '.css': case '.sass': {
				if(isUpdate) {
					const p = parseFileName(relative(process.cwd(), file))
					const pugFile = `${p.dir}/${p.name}.pug`
					const htmlFile = `${p.dir}/${p.name}.html`
					if(fs.existsSync(pugFile)) {
						return await processFile(pugFile, isUpdate)
					} else if(fs.existsSync(htmlFile)) {
						return await processFile(htmlFile, isUpdate)
					}
				}
				return null
			}
		}
		if(!html) throw `no html found in file ${file}`
		if(options.debug && options.debug.logHTML) 
			console.debug(relativeFile, 'HTML:\n' + html)

		// convert the html into an abstract syntax tree
		const ast = await processHtml(file, html)
		if(!ast) throw `no ast found in html of file ${file}`
		if(options.debug && options.debug.logHtmlAST) 
			console.debug(relativeFile, 'HTML AST:\n' + JSON.stringify(ast, null, 3))

		// convert the html ast into a dart widget tree to render
		const compiled = compile(ast, options)
		if(options.debug && options.debug.logDartPreAST) 
			console.debug(relativeFile, 'Dart Pre-process AST:\n' + JSON.stringify(compiled, null, 3))
		
		// convert the html ast into a dart widget tree to render
		const widgets = compiled.map(widget=>{
			let result : Widget = widget
			for(let plugin of plugins) {
				result = plugin.transformWidget(result, options)
			}
			result = removeEmptyChildren.transformWidget(result, options)
			return result
		})
		if(options.debug && options.debug.logDartPostAST) 
			console.debug(relativeFile, 'Dart Post-process AST:\n' + JSON.stringify(widgets, null, 3))
		
		// extract the imports to use from the ast
		const imports = extractImports(ast)

		// convert the widget tree with imports into dart source code
		const p = parseFileName(file)
		const dartFile = `${p.dir}/${p.name}.dart`
		const relativeDartFile = relative(process.cwd(), dartFile)
		const code = renderDartFile(relativeDartFile, widgets, imports, options)
		if(options.debug && options.debug.logCode) console.debug(relativeFile, 'Code:\n' + code)

		// save the code
		fs.writeFileSync(dartFile, code)
		return dartFile
	}
	
	async function processHtml(file: string, html: string): Promise<Element[]> {
		// transform the html into an abstract syntax tree
		let ast = await parse(html)
	
		// try to find a matching css or sass file
		const p = parseFileName(file)
		let css
		const sassFile = `${p.dir}/${p.name}.sass`
		const cssFile = `${p.dir}/${p.name}.css`
		if(fs.existsSync(sassFile)) {
			const cssResult = renderSync({
				file: sassFile,
				includePaths: [process.cwd()+'/lib'],
				outputStyle: 'expanded',
				indentedSyntax: true
			})
			css = cssResult.css.toLocaleString()
		} else if(fs.existsSync(cssFile)) {
			css = fs.readFileSync(cssFile).toString()
		}
		if(css) {
			// merge the css styles into the html
			const mergedHtml = juice.inlineContent(html, css, {
				xmlMode: false,
				webResources: {
					relativeTo: process.cwd()+'/lib'
				}
			})
			return await parse(mergedHtml)
		} else {
			return await parse(html)
		}

		async function parse(htm: string): Promise<Element[]>{
			return await new Promise(function(resolve, reject) {
				const handler = new htmlparser.DefaultHandler(function (error, dom) {
					if (error) reject(error)
					else resolve(dom)
				}, { verbose: false, ignoreWhitespace: true })
				new htmlparser.Parser(handler).parseComplete(htm)
			}) as Element[]
		}
	}

	function reportError(file: string, error: Error, options: Options) {
		try {
			console.error('Error on processing', relative(process.cwd(), file) + ':')
			console.error(error.toString())
			if(options.debug && options.debug.logErrorStack) {
				console.error(error.stack)	
			}
			if(options.reportErrorsInDart) {
				const errorLines = error.toString().split('\\n')
				const commentedLines = errorLines.map(line=>` * ${line}`)
				const errorCode = multiline(
					'/*',
					commentedLines.join('\n'),
					'*/',
					'',
					'false // intentional dart error'
				)
				const p = parseFileName(file)
				const dartFile = `${p.dir}/${p.name}.dart`
				fs.writeFileSync(dartFile, errorCode)
			}
		} catch(e) {
			console.error(`error handling error ${error} on file ${file}.`)
		}
	}

}
