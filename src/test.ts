import * as fs from 'mz/fs'
import * as lex from 'pug-lexer'
import * as parse from 'pug-parser'
import { compile } from './compiler'

// let lex = require('pug-lexer')
// let parse = require('pug-parser')

let data = fs.readFileSync('test/examples/simple.pug').toString()
let tokens = lex(data, {})
let parsed = parse(tokens)
console.log('parsed:', parsed)
let flutterCode = compile(parsed)
console.log(flutterCode)

