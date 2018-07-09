
import { Block } from '../src/model'

/**
 * Compiles a parsed pug tree into Flutter Dart code
 * @param {*} json 
 * @param {*} options 
 * @returns {string} generated dart code
 */
export function compile(block: Block, options?: object) {
	if(block.type != 'Block') throw 'Pug code should start with a block, is this parsed pug code?'
	if(block.nodes.length === 0) return ""
	console.log(block.nodes.length)
	if(block.nodes.length > 1) throw 'Pug flutter code should start with a single top level tag'
	return compileBlock(block)
}

function compileBlock(block: Block) {
	return 'block!'
}
