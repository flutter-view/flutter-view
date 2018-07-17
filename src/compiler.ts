import { camelCase, upperCaseFirst } from 'change-case';
import { merge, pull } from 'lodash';
import * as styleparser from 'style-parser';
import { CompileOptions } from './compiler';
import { Param, Widget } from './flutter-model';
import { Element, Tag, Text } from './html-model';

export interface CompileOptions {
	imports?: string[]
	textClass?: string
	divClass?: string,
	multiChildClasses?: string[]
	lineNumbers?: boolean
}

const defaultCompileOptions: CompileOptions = {
	textClass: 'PlatformText',
	divClass: 'Container',
	multiChildClasses: [
		'Row',
		'Column',
		'Stack',
		'IndexedStack',
		'GridView',
		'Flow',
		'Table',
		'Wrap',
		'ListBody',
		'ListView',
		'CustomMultiChildLayout'
	]
}

/**
 * Extracts from the html any import elements, and returns those elements as imports
 * @param html the html elements, which get modified
 */
export function extractImports(html: Element[]) : string[] {
	let imports: Tag[] = []
	for(let el of html) {
		if(el.type == 'tag') {
			let tag = el as Tag
			if(tag.name == 'import') {
				imports.push(tag)
				pull(html, tag)
			}
		}
	}
	return imports
		.map(i=>i.attribs['package'])
		.filter(i=>!!i)
		.map(i=>`package:${i}`)
}

/**
 * Compiles a parsed html tree into Flutter Dart code
 * @param {Element[]} html parsed html elements
 * @returns {Widget} generated Dart widget tree
 */
export function compile(html: Element[], options: CompileOptions): Widget[] {
	options = merge(defaultCompileOptions, options)
	return html
		.filter(el=>isFlutterView(el))
		.map(el=>compileTag(el as Tag, options))

}

function compileTag(tag: Tag, options: CompileOptions) : Widget {
	if(tag.name == 'div') {
		tag.name = options.divClass
	}
	const widgetClass = upperCaseFirst(camelCase(tag.name))

	let params: Param[] = []
	if(tag.attribs) {
		if(tag.attribs['style']) {
			const styleRules = styleparser(tag.attribs['style'])
			for(let attr in styleRules) {
				tag.attribs[':' + attr] = styleRules[attr]
			}
		}
		for(let attr in tag.attribs) {
			if(attr != 'as' && attr != 'id' && attr != 'class' && attr != 'style') {
				const expression = attr.startsWith(':')
				const name = expression ? attr.substring(1) : attr
				const value = tag.attribs[attr]
				params.push({
					class: 'param',
					type: expression ? 'expression' : 'literal',
					name: (name=='value') ? undefined : camelCase(name),
					value: attr!=value ? value : null // pug renders empty attributes as key==value
				})
			}
		}
	}
	if(tag.children) {
		// find all children and slot properties in the tag block
		let children: Widget[] = []
		for(let child of tag.children) {
			switch(child.type) {
				case 'tag': {
					let subTag = child as Tag
					let widget = compileTag(subTag, options)
					let slot = subTag.attribs ? subTag.attribs['as'] : null
					// if a subtag is a slot, it is actually a widget as a property
					if(slot) {
						params.push({
							class: 'param',
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
					if(value.length !== 0 && !value.startsWith('//')) {
						children.push({
							class: 'widget',
							name: options.textClass,
							constant: true,
							params: [
								{
									class: 'param',
									type: 'literal',
									value: value
								}
							]
						})
					}
				}
			}
		}
		// add the child or children parameter to the widget
		const isMultiChildClass = !!options.multiChildClasses.find(cls=>cls==widgetClass)
		if(isMultiChildClass || children.length > 1) {
			params.push({
				class: 'param',
				type: 'widgets',
				name: 'children',
				value: children
			})
		} else if(children.length == 1) {
			params.push({
				class: 'param',
				type: 'widget',
				name: 'child',
				value: children[0]
			})
		}
	}
	const isConstant = tag.attribs && (tag.attribs['const'] || tag.attribs['const'] == '')
	return {
		class: 'widget',
		constant: isConstant,
		name: widgetClass,
		params: params
	}
}

function isFlutterView(element: Element) {
	if(element.type != 'tag') return false
	const tag = element as Tag
	return tag.attribs && (tag.attribs['flutter-view'] || tag.attribs['flutter-view'] == '')
}
