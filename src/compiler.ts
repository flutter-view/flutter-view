import { Widget, Param } from './flutter-model';
import { Block, Tag, Attribute, Text } from './pug-model'
// import * as handlebar from 'handlebars'

/**
 * Compiles a parsed pug tree into Flutter Dart code
 * @param {Block} pug parsed pug code block
 * @returns {Widget} generated Dart widget tree
 */
export function compile(pug: Block): Widget {
	if(pug.type != 'Block') throw 'Pug code should start with a block, is this parsed pug code?'
	if(pug.nodes.length === 0) return null
	if(pug.nodes.length > 1) throw 'Pug flutter code should start with a single top level tag'
	return compileTag(pug.nodes[0] as Tag);
}

function findAttribute(tag: Tag, name: string) : Attribute | null {
	if(!tag.attrs) return null
	return tag.attrs.find(attr => attr.name==name)
}

function compileTag(tag: Tag) : Widget {
	// let isSlotTag = tag.attrs.find(attr=>attr.name=='slot')
	// if(isSlotTag) return null
	let params: Param[] = []
	if(tag.attrs) {
		for(var attr of tag.attrs) {
			if(attr.name != 'slot') {
				const expression = attr.name.startsWith(':')
				params.push({
					type: expression ? 'expression' : 'literal',
					name: expression ? attr.name.substring(1) : attr.name,
					value: attr.val,
					line: tag.line,
					column: tag.column
				})
			}
		}
	}
	if(tag.block && tag.block.nodes) {
		let children: Widget[] = []
		// find all children and slot properties in the tag block
		for(var node of tag.block.nodes) {
			switch(node.type) {
				case 'Tag': {
					let subTag = node as Tag
					let widget = compileTag(subTag)
					let slot = findAttribute(subTag, 'slot')
					// if a subtag is a slot, it is actually a widget as a property
					if(slot) {
						params.push({
							type: 'widget',
							name: slot.val,
							value: widget,
							line: subTag.line,
							column: subTag.column
						})
					} else {
						children.push(widget)
					}
					break
				}
				case 'Text': {
					const text = node as Text
					const value = text.val.trim()
					if(value.length !== 0) {
						children.push({
							name: 'text',
							value,
							line: text.line,
							column: text.column
						})
					}
				}
			}
		}
		// add the child or children parameter to the widget
		if(children.length == 1) {
			params.push({
				type: 'widget',
				name: 'child',
				value: children[0],
				line: tag.line,
				column: tag.column
			})
		} else if(children.length > 1) {
			params.push({
				type: 'widgets',
				name: 'children',
				value: children
			})
		}
	}
	return {
		name: tag.name,
		params: params
	}
}

// function compileText(block: Text) {
// }

// function compileBlock(block: Block) {
// 	for(var node of block.nodes) {
// 		switch(node.type) {
// 			case 'Block': compileBlock(node as Block); break
// 			case 'Tag': compileTag(node as Tag); break
// 			case 'Text': compileText(node as Text); break
// 		}
// 	}
// }
