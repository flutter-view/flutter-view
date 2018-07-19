import { camelCase, upperCaseFirst } from 'change-case';
import { merge, pull } from 'lodash';
import * as styleparser from 'style-parser';
import { Options, RenderPlugin } from './watcher';
import { Param, Widget } from './flutter-model';
import { Element, Tag, Text } from './html-model';
import { tail } from 'lodash'

/**
 * Extracts from the html any import elements, and returns those elements as imports
 * @param {Element[]} html the html elements, which get modified
 * @returns a list of import urls
 */
export function extractImports(html: Element[]) : string[] {
	const imports: Tag[] = []
	for(const el of html) {
		if(el.type == 'tag') {
			const tag = el as Tag
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
 * @param {Options} options compilation options
 * @returns {Widget} generated Dart widget tree
 */
export function compile(html: Element[], plugins: RenderPlugin[], options: Options): Widget[] {
	return html
		.filter(el=>isFlutterView(el))
		.map(el=>compileTag(el as Tag, plugins, options))
}

/**
 * Converts a tag and all of its children into a flutter dart tree
 * @param {Tag} tag the tag and children to convert
 * @param {Options} options compilation options
 * @returns {Widget} widget descriptor with tree of connected children widgets
 */
function compileTag(tag: Tag, plugins: RenderPlugin[], options: Options) : Widget {
	// use the configured class name if we set it in the tagClasses option
	for(let tagName of Object.keys(options.tagClasses)) {
		if(tag.name == tagName) tag.name = options.tagClasses[tagName]
	}

	const widgetClass = upperCaseFirst(camelCase(tag.name))

	// apply styles as properties
	const params: Param[] = []
	if(tag.attribs) {
		if(tag.attribs['style']) {
			const styleRules = styleparser(tag.attribs['style'])
			for(const attr in styleRules) {
				tag.attribs[':' + attr] = styleRules[attr]
			}
		}
		for(const attr in tag.attribs) {
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

	// calculate the tag constructor parameters
	if(tag.children) {
		// find all children and slot properties in the tag block
		const children: Widget[] = []
		for(const child of tag.children) {
			switch(child.type) {
				case 'tag': {
					const subTag = child as Tag
					const widget = compileTag(subTag, plugins, options)
					// if a subtag is a slot, it is actually a widget as a property
					const slot = subTag.attribs ? subTag.attribs['as'] : null
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
					const values = text.data.split('\n').map(line=>line.trim())
					for(let value of values) {
						if(value.length !== 0 && !value.startsWith('//')) {
							const widget: Widget = {
								class: 'widget',
								name: options.tagClasses['text'],
								constant: false,
								params: [
									{
										class: 'param',
										type: 'literal',
										value: value
									}
								]
							}
							const processed = applyPlugins(widget, plugins, options)
							children.push(processed)
						}
					}
				}
			}
		}
		// add the child or children parameter to the widget params
		const isMultiChildClass = !!options.multiChildClasses.find(cls=>cls==widgetClass)
		if(children.length > 0) {
			if(isMultiChildClass) {
				params.push({
					class: 'param',
					type: 'widgets',
					name: 'children',
					value: children
				})
			} else {
				if(children.length == 1 || !options.autowrapChildren) {
					params.push({
						class: 'param',
						type: 'widget',
						name: 'child',
						value: children[0]
					})
				} else {
					params.push({
						class: 'param',
						type: 'widget',
						name: 'child',
						value: {
							class: 'widget',
							constant: false,
							name: options.autowrapChildrenClass,
							params: [
								{
									class: 'param',
									type: 'widgets',
									name: 'children',
									value: children
								}
							]
						}
					})
				}	
			} 

		}
	}

	// create the widget for the tag
	const isConstant = tag.attribs && (tag.attribs['const'] || tag.attribs['const'] == '')
	const widget: Widget = {
		class: 'widget',
		constant: isConstant,
		name: widgetClass,
		params: params
	}
	return applyPlugins(widget, plugins, options)
}

/**
 * Checks if the element contains the flutter-view attribute
 * @param {Element} element the root element to check
 * @returns true if the element is a flutter-view root element
 */
function isFlutterView(element: Element) : boolean {
	if(element.type != 'tag') return false
	const tag = element as Tag
	return tag.attribs && (tag.attribs['flutter-view'] || tag.attribs['flutter-view'] == '')
}

/**
 * Recursively apply all plugins to the widget, either modifying or creating a new widget tree
 * @param widget the widget to apply all passed plugins on
 * @param plugins the plugins to apply
 */
function applyPlugins(widget: Widget, plugins: RenderPlugin[], options: Options) : Widget {
	if(!plugins || plugins.length == 0) return widget
	const plugin = plugins[0]
	const newWidget = plugin.transformWidget(widget, options)
	return applyPlugins(newWidget, tail(plugins), options)
}
