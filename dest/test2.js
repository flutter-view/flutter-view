"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const pug_1 = require("pug");
const node_sass_1 = require("node-sass");
const juice = require("juice");
const htmlparser = require("htmlparser");
const html = pug_1.renderFile('test/examples/simple.pug');
console.log('html:', html, '\n');
const cssResult = node_sass_1.renderSync({
    file: 'test/examples/simple.sass',
    outputStyle: 'expanded',
    indentedSyntax: true
});
const css = cssResult.css.toLocaleString();
console.log('css:', css, '\n');
const mergedHtml = juice.inlineContent(html, css, {
    xmlMode: true
});
console.log('merged: ', mergedHtml, '\n');
function parse(html) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Promise(function (resolve, reject) {
            const handler = new htmlparser.DefaultHandler(function (error, dom) {
                if (error)
                    reject(error);
                else
                    resolve(dom);
            }, { verbose: false, ignoreWhitespace: true });
            new htmlparser.Parser(handler).parseComplete(html);
        });
    });
}
function renderCode() {
    return __awaiter(this, void 0, void 0, function* () {
        const ast = yield parse(html);
        console.log('ast', JSON.stringify(ast, null, 3), '\n');
    });
}
renderCode();
