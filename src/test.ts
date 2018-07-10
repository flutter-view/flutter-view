import * as fs from 'mz/fs'
import * as lex from 'pug-lexer'
import * as parse from 'pug-parser'
import { compile } from './compiler'

// let lex = require('pug-lexer')
// let parse = require('pug-parser')

let data = fs.readFileSync('test/examples/simple.pug').toString()
let tokens = lex(data, {})
let parsed = parse(tokens)
// console.log('pug', JSON.stringify(parsed, null, 3))
let flutterCode = compile(parsed)
console.log(JSON.stringify(flutterCode, null, 3))

