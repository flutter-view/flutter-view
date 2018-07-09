import { Widget, Param } from './flutter-model';
import { Block, Tag, Attribute } from './pug-model'
// import * as handlebar from 'handlebars'

/**
 * Compiles a parsed pug tree into Flutter Dart code
 * @param {Block} pug parsed pug code block
 * @returns {Widget} generated Dart widget tree
 */
export function compile(pug: Block): Widget {
	if(pug.type != 'Block') throw 'Pug code should start with a block, is this parsed pug code?'
	if(pug.nodes.length === 0) return null
	console.log(pug.nodes.length)
	if(pug.nodes.length > 1) throw 'Pug flutter code should start with a single top level tag'
	return compileTag(pug.nodes[0] as Tag);
}

function findAttribute(tag: Tag, name: string) {
	if(!tag.attrs) return null
	return tag.attrs.find(attr => attr.name==name)
}

function compileTag(tag: Tag) : Widget {
	let isSlotTag = tag.attrs.find(attr=>attr.name=='slot')
	if(isSlotTag) return null
	let params: Param[] = []
	if(tag.attrs) {
		for(var attr of tag.attrs) {
			params.push({
				name: attr.name,
				value: attr.val
			})
		}
	}
	if(tag.block && tag.block.nodes) {
		for(var node of tag.block.nodes) {
			switch(node.type) {
				case 'Tag': {
					if(tag.attrs.)
					break
				}
			}
		}
	}
	return {
		name: tag.name,
		params: params
	}
}

function compileBlock(block: Block) {
	for(var node of block.nodes) {
		switch(node.type) {
			case 'Block': compileBlock(node as Block); break
			case 'Tag': compileTag(node as Tag); break
		}
	}
	return 'block!'

}
