import * as fs from 'mz/fs'
import * as lex from 'pug-lexer'
import * as parse from 'pug-parser'
import { renderFile } from 'pug'
import { render, renderSync  } from 'node-sass'
import * as juice from 'juice'
import { compile } from './compiler'
import { renderClass } from './renderer'
import * as htmlparser from 'htmlparser'

const html = renderFile('test/examples/simple.pug')
console.log('html:', html, '\n')

const cssResult = renderSync({
	file: 'test/examples/simple.sass',
	outputStyle: 'expanded',
	indentedSyntax: true
})
const css = cssResult.css.toLocaleString()
console.log('css:', css, '\n')

const mergedHtml = juice.inlineContent(html, css, {
	xmlMode: true
})
console.log('merged: ', mergedHtml, '\n')

async function parse(html: string): Promise<object>{
	return await new Promise(function(resolve, reject) {
		const handler = new htmlparser.DefaultHandler(function (error, dom) {
			if (error) reject(error)
			else resolve(dom)
		}, { verbose: false, ignoreWhitespace: true })
		new htmlparser.Parser(handler).parseComplete(html)
	})
}

async function renderCode() {
	const ast = await parse(html)
	console.log('ast', JSON.stringify(ast, null, 3), '\n')
}

renderCode()

