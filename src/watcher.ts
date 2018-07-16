#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import * as gaze from 'gaze';
import * as htmlparser from 'htmlparser';
import * as juice from 'juice';
import * as fs from 'mz/fs';
import { renderSync } from 'node-sass';
import { dirname, extname, parse as parseFileName, resolve, relative } from 'path';
import { renderFile } from 'pug';
import { compile, CompileOptions } from './compiler';
import { Element, Tag } from './html-model';
import { renderClass, RenderOptions } from './renderer';
import { Widget } from './flutter-model';

export interface RenderPlugin {
	transformWidget(widget: Widget) : Widget
}

export interface Config {
	exclude?: string[]
	compile?: CompileOptions,
	render?: RenderOptions,
	propagateDelete: boolean
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
		const ast = await processHtml(file, html)
		if(!ast) throw `no ast found in html of file ${file}`
		const code = await renderCode(ast)
		const p = parseFileName(file)
		const dartFile = `${p.dir}/${p.name}.dart`
		fs.writeFileSync(dartFile, code)
		// console.log('updated', dartFile)
		return dartFile
	}
	
	async function processHtml(file: string, html: string): Promise<Element[]> {
		let ast = await parse(html)
	
		// there must be a root element and it must be a widget
		const root = ast[0] as Tag
		if(!root || !root.attribs || !root.attribs['flutter-view']) return Promise.reject('no root or flutter-widget found')
	
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
	
	function renderCode(ast: Element[]) : string {
		// console.log('rendering', JSON.stringify(ast, null, 3))
		const widget = compile(ast, config.compile)
		// console.log('widget', JSON.stringify(widget, null, 3), '\n')
		const code = renderClass(widget, plugins, config.render)
		// console.log('code', code)
		return code
	}

	function reportError(file: string, error: Error) {
		console.error('Error on processing ', relative(process.cwd(), file), ':')
		console.error(error)
	}

}
