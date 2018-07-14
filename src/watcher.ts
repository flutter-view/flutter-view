#!/usr/bin/env node

import { readFileSync } from 'fs';
import * as gaze from 'gaze';
import * as htmlparser from 'htmlparser';
import * as juice from 'juice';
import * as fs from 'mz/fs';
import { renderSync } from 'node-sass';
import { dirname, extname, parse as parseFileName, resolve } from 'path';
import { renderFile } from 'pug';
import { compile, CompileOptions } from './compiler';
import { Element, Tag } from './html-model';
import { renderClass, RenderOptions } from './renderer';

interface Config {
	exclude?: string[]
	compile?: CompileOptions,
	render?: RenderOptions
}

export function startWatching(dirs: string[], config: Config, watch: boolean = true) {
	
	const gazePatterns = dirs.map(dir=>`${dir}/**/*.+(pug|html)`)
	
	gaze(gazePatterns, async (err, watcher) => {
		
		// process all watched files once
		const dirs = watcher.watched()
		// console.log('watching:', dirs)
		for(var dir of Object.keys(dirs)) {
			for(var file of dirs[dir]) {
				await processFile(file)
			}
		}
	
		// stop if we do not want to keep watching
		if(!watch) {
			watcher.close()
			return
		}
	
		// watch for changes
		watcher.on('added', added => {
			console.log('added', added)
			processFile(added).catch()
		})
		watcher.on('changed', changed => {
			console.log('changed', changed)
			processFile(changed).catch()
		})
		watcher.on('deleted', deleted => {
			console.log('deleted', deleted)
		})
	
	})
	
	async function processFile(file: string) : Promise<string> {
		console.log('processing', file)
		let html
		switch(extname(file)) {
			case '.pug': {
				html = renderFile(file)
				break
			}
			case '.htm': case '.html': {
				html = readFileSync(file).toString()
			}
		}
		if(!html) return Promise.reject(`no html found in file ${file}`)
		const ast = await processHtml(file, html)
		if(!ast) return Promise.reject(`no ast found in html of file ${file}`)
		const code = await renderCode(ast)
		const p = parseFileName(file)
		const dartFile = `${p.dir}/${p.name}.dart`
		fs.writeFileSync(dartFile, code)
		console.log('updated', dartFile)
	}
	
	async function processHtml(file: string, html: string): Promise<Element[]> {
		let ast = await parse(html)
	
		// there must be a root element and it must be a widget
		const root = ast[0] as Tag
		if(!root || !root.attribs || !root.attribs['flutter-widget']) return Promise.reject('no root or flutter-widget found')
	
		// if the widget has a style attribute, merge the css
		if(root.attribs && root.attribs['style']) {
			// calculate the absolute path of the file
			const style = root.attribs['style']
			const styleFile = resolve(dirname(file), style)
			// preprocess sass if necessary
			let css
			switch (extname(styleFile)) {
				case '.sass': {
					const cssResult = renderSync({
						file: styleFile,
						outputStyle: 'expanded',
						indentedSyntax: true
					})
					css = cssResult.css.toLocaleString()
				}
				case '.css': {
					css = fs.readFileSync(styleFile).toString()
				}
			}
			console.log('css:', css, '\n')
			// merge the css styles into the html
			const mergedHtml = juice.inlineContent(html, css, {
				xmlMode: false
			})
			console.log('merged: ', mergedHtml, '\n')
			ast = await parse(mergedHtml)
		}
		return ast
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
		console.log('rendering', JSON.stringify(ast, null, 3))
		const widget = compile(ast, config.compile)
		console.log('widget', JSON.stringify(widget, null, 3), '\n')
		const code = renderClass(widget, config.render)
		console.log('code', code)
		return code
	}
}
