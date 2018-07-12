"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("mz/fs");
const lex = require("pug-lexer");
const parse = require("pug-parser");
const juice = require("juice");
const compiler_1 = require("./compiler");
const renderer_1 = require("./renderer");
// let lex = require('pug-lexer')
// let parse = require('pug-parser')
let data = fs.readFileSync('test/examples/simple.pug').toString();
let tokens = lex(data, {});
let parsed = parse(tokens);
console.log('pug', JSON.stringify(parsed, null, 3));
let flutter = compiler_1.compile(parsed);
console.log(JSON.stringify(flutter, null, 3));
let code = renderer_1.renderClass(flutter);
console.log(code);
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
`;
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
`;
let juiced = juice.inlineContent(html, css);
console.log('juice: ', juiced);
