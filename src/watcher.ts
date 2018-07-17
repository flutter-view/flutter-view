#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import * as gaze from 'gaze';
import * as htmlparser from 'htmlparser';
import * as juice from 'juice';
import { merge, cloneDeep } from 'lodash';
import * as fs from 'mz/fs';
import { renderSync } from 'node-sass';
import { extname, parse as parseFileName, relative } from 'path';
import { renderFile } from 'pug';
import { compile, CompileOptions, extractImports } from './compiler';
import { Widget } from './flutter-model';
import { Element } from './html-model';
import { renderDartFile, RenderOptions } from './renderer';

export interface RenderPlugin {
	transformWidget(widget: Widget) : Widget
}

export interface Config {
	exclude?: string[]
	compile?: CompileOptions,
	render?: RenderOptions,
	propagateDelete?: boolean,
	debug?: {
		logHTML?: boolean,
		logAST?: boolean,
		logCode?: boolean
	}
}

export function startWatching(dirs: string[], config: Config, plugins: RenderPlugin[], watch: boolean) {
	
	const gazePatterns = dirs.map(dir=>`${dir}/**/*.+(pug|htm|html|sass|css)`)
	
	gaze(gazePatterns, (err, watcher) => {
		
		// process all watched files once
		const dirs = watcher.watched()
		// console.log('watching:', dirs)
		for(var dir of Object.keys(dirs)) {
			for(var file of dirs[dir]) {
				const sourceFile = file
				processFile(sourceFile, false)
					.then(dartFile=>{if(dartFile) console.log('updated', relative(process.cwd(), dartFile))})
					.catch(error=>reportError(sourceFile, error))
			}
		}
	
		// stop if we do not want to keep watching
		if(!watch) {
			watcher.close()
			return
		}
	
		// watch for changes
		watcher.on('added', sourceFile => {
			processFile(sourceFile, true)
				.then(dartFile=>{if(dartFile) console.log('added', relative(process.cwd(), dartFile))})
				.catch(error=>reportError(sourceFile, error))
		})
		watcher.on('changed', sourceFile => {
			processFile(sourceFile, true)
				.then(dartFile=>{if(dartFile) console.log('updated', relative(process.cwd(), dartFile))})
				.catch(error=>reportError(sourceFile, error))
		})
		watcher.on('deleted', sourceFile => {
			if(config.propagateDelete) {
				const p = parseFileName(sourceFile)
				const dartFile = `${p.dir}/${p.name}.dart`
				if(fs.existsSync(dartFile)) {
					fs.unlinkSync(dartFile)
					console.log('deleted', relative(process.cwd(), dartFile))
				}
			}
		})
	
	})
	
	async function processFile(file: string, isUpdate: boolean) : Promise<string> {
		// extract the html from the file, depending on the type
		let html
		switch(extname(file)) {
			case '.pug': {
				html = await renderFile(file)
				break
			}
			case '.htm': case '.html': {
				html = readFileSync(file).toString()
				break
			}
			case '.css': case '.sass': {
				if(isUpdate) {
					const p = parseFileName(file)
					const pugFile = `${p.dir}/${p.name}.pug`
					const htmlFile = `${p.dir}/${p.name}.html`
					if(existsSync(pugFile)) {
						return await processFile(pugFile, isUpdate)
					} else if(existsSync(htmlFile)) {
						return await processFile(htmlFile, isUpdate)
					}
					throw `no pug or html template found for ${relative(process.cwd(), file)}`
				} else return null
			}
		}
		if(!html) throw `no html found in file ${file}`
		if(config.debug && config.debug.logHTML) console.debug(file, 'HTML:' + html)

		// convert the html into an abstract syntax tree, merging any css in the process
		const ast = await processHtml(file, html)
		if(!ast) throw `no ast found in html of file ${file}`
		if(config.debug && config.debug.logAST) console.debug(file, 'AST:\n' + JSON.stringify(ast, null, 3))

		// convert the ast into code
		const code = await renderCode(ast)
		if(config.debug && config.debug.logCode) console.debug(file, 'Code:\n' + code)

		// save the code
		const p = parseFileName(file)
		const dartFile = `${p.dir}/${p.name}.dart`
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
		if(existsSync(sassFile)) {
			const cssResult = renderSync({
				file: sassFile,
				outputStyle: 'expanded',
				indentedSyntax: true
			})
			css = cssResult.css.toLocaleString()
		} else if(existsSync(cssFile)) {
			css = fs.readFileSync(cssFile).toString()
		}
		// merge the css styles into the html
		const mergedHtml = juice.inlineContent(html, css, {
			xmlMode: false
		})
		return await parse(mergedHtml)

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
	
	function renderCode(ast: Element[]) : string {
		const widgets = compile(ast, config.compile)
		const imports = extractImports(ast)
		return renderDartFile(widgets, imports, plugins, config.render)
	}

	function reportError(file: string, error: Error) {
		console.error('Error on processing', relative(process.cwd(), file) + ':')
		console.error(error)
	}

}
