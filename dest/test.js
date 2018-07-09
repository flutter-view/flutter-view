"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("mz/fs");
const lex = require("pug-lexer");
const parse = require("pug-parser");
const compiler_1 = require("./compiler");
// let lex = require('pug-lexer')
// let parse = require('pug-parser')
let data = fs.readFileSync('test/examples/simple.pug').toString();
let tokens = lex(data, {});
let parsed = parse(tokens);
console.log('parsed:', parsed);
let flutterCode = compiler_1.compile(parsed);
console.log(flutterCode);
