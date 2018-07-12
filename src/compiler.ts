import { CompileOptions } from './compiler'
import { Widget, Param } from './flutter-model'
import { Element, Tag, Text } from './html-model'
import { camelCase, upperCaseFirst } from 'change-case'
import * as styleparser from 'style-parser'

export interface CompileOptions {
	imports?: string[]
	textClass?: string
	divClass?: string
	lineNumbers?: boolean
}

const defaultCompileOptions: CompileOptions = {
	textClass: 'Text',
	divClass: 'Container'
}

/**
 * Compiles a parsed pug tree into Flutter Dart code
 * @param {Block} pug parsed pug code block
 * @returns {Widget} generated Dart widget tree
 */
export function compile(html: Element[], options?: CompileOptions): Widget {
	const opts = options ? Object.assign(defaultCompileOptions, options) : defaultCompileOptions
	if(html.length === 0) return null
	if(html.length > 1) throw 'template code should start with a single top level tag'
	return compileTag(html[0] as Tag, opts)
}

function compileTag(tag: Tag, options: CompileOptions) : Widget {
	if(tag.name == 'div') {
		tag.name = options.divClass
	}
	// if(tag.name == 'text') tag.name = options.textClass

	let params: Param[] = []
	if(tag.attribs) {
		if(tag.attribs['style']) {
			const styleRules = styleparser(tag.attribs['style'])
			console.log('rules', styleRules)
			for(attr in styleRules) {
				tag.attribs[attr] = styleRules[attr]
			}
		}
		for(var attr in tag.attribs) {
			if(attr != 'slot' && attr != 'id' && attr != 'class' && attr != 'style') {
				const expression = attr.startsWith(':')
				const name = expression ? attr.substring(1) : attr
				const value = tag.attribs[attr]
				params.push({
					type: expression ? 'expression' : 'literal',
					name: camelCase(name),
					value: attr!=value ? value : null // pug renders empty attributes as key==value
				})
			}
		}
	}
	if(tag.children) {
		// find all children and slot properties in the tag block
		let children: Widget[] = []
		for(var child of tag.children) {
			switch(child.type) {
				case 'tag': {
					let subTag = child as Tag
					let widget = compileTag(subTag, options)
					let slot = subTag.attribs ? subTag.attribs['slot'] : null
					// if a subtag is a slot, it is actually a widget as a property
					if(slot) {
						params.push({
							type: 'widget',
							name: camelCase(slot),
							value: widget
						})
					} else {
						children.push(widget)
					}
					break
				}
				case 'text': {
					const text = child as Text
					const value = text.data.trim()
					if(value.length !== 0) {
						children.push({
							name: options.textClass,
							value: value
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
				value: children[0]
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
		name: upperCaseFirst(camelCase(tag.name)),
		params: params
	}
}
