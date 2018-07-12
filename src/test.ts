import * as fs from 'mz/fs'
import * as lex from 'pug-lexer'
import * as parse from 'pug-parser'
import { render, renderSync  } from 'node-sass'
import * as csstree from 'css-tree'
import * as juice from 'juice'
import { compile } from './compiler'
import { renderClass } from './renderer'

// let lex = require('pug-lexer')
// let parse = require('pug-parser')

let data = fs.readFileSync('test/examples/simple.pug').toString()
let tokens = lex(data, {})
let parsed = parse(tokens)
console.log('pug', JSON.stringify(parsed, null, 3))
let flutter = compile(parsed)
console.log(JSON.stringify(flutter, null, 3))
let code = renderClass(flutter)
console.log(code)

// let result = renderSync({
// 	file: 'test/examples/simple.sass',
// 	outputStyle: 'expanded',
// 	indentedSyntax: true
// })
// let css = result.css.toLocaleString()
// console.log('css:', css)

// let ast = csstree.parse(css, {
// 	parseAtrulePrelude: false
// })
// console.log(JSON.stringify(ast, null, 3))

// csstree.walk(ast, node=>console.log(node))

// SimplePage->PlatformScaffold=>#body
// csstree.walk(ast, {
//     visit: 'SelectorList',
//     enter: function(node) {
//         console.log(node.name)
//     }
// })
let html = `
<div class='top'>
	<p class='header'>Hello world!</p>
	<button id='submit'>Submit</button>
</div>
`
let css = `
.top {
	height: 100%;
	width: 100px;
}
.header {
	font-size: 15px;
}
#submit {
	on-click: 'try me';
	the-best-ever: 10
}
`
let juiced = juice.inlineContent(html, css)
console.log('juice: ', juiced)