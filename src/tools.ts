import { camelCase } from 'change-case';
import { isArray, mergeWith, pull, tail } from 'lodash';
import { Param, Widget } from './models/flutter-model';
import { CSSAssetURL, CSSLinearGradientURL, CSSURL } from './models/html-model';
import { Options, RenderPlugin } from './watcher';

/**
 * Remove starting and ending double or single quotes.
 * Only removes if these quotes are of the same type,
 * and at the start and end of the text.
 * @param text the text to remove the quotes from
 */
export function unquote(text: string): string {
	if (!text) return ''
	if (text.startsWith('"') && text.endsWith('"')) {
		return text.substring(1, text.length - 1)
	}
	if (text.startsWith("'") && text.endsWith("'")) {
		return text.substring(1, text.length - 1)
	}
	return text
}

/**
 * Escapes only the quotation marks in the string.
 * For example: "That's right" becomes "That\'s right"
 * @param text the text to escape the quotation marks
 */
export function escapeQuotes(text: string): string {
	return text.replace("'", "\\\'") //.replace('"', '\\\"')
}

/**
 * Join multiple lines of text with newlines.
 * Filters out the nulls
 * @param lines 
 */
export function multiline(...lines: string[]): string {
	return lines.filter(line => !!line).join('\n')
}

/**
 * Create a deep clone of the object by converting it
 * to JSON and back to an object. Only works with data objects.
 * Note: can be slow, so only use when necessary.
 * @param object the object to clone
 */
export function clone(object: any) {
	return JSON.parse(JSON.stringify(object))
}

/**
 * Perform a deep merge, including the merging of arrays.
 * By default lodash.merge does not merge arrays.
 * @param object the original object
 * @param other the object to merge with
 * @returns the merged object
 */
export function merge(object, other) {
	function customizer(objValue, srcValue) {
		if (isArray(objValue)) {
			return objValue.concat(srcValue)
		}
	}
	return mergeWith(object, other, customizer)
}

/** Find a parameter of the given name in the widget */
export function findParam(widget: Widget, name: string, includeResolved?: boolean): Param | null {
	if (!widget.params) return null
	return widget.params.find(param => param.name == name && (includeResolved || !param.resolved))
}

/** Find and remove a parameter in the widget */
export function findAndRemoveParam(
	widget: Widget,
	name: string,
	options: { includeResolved?: boolean, includeExpressions?: boolean } =
		{ includeExpressions: true, includeResolved: false }
): Param | null {
	if (!widget.params) return null
	function filter(param: Param): boolean {
		if (param.name != name) return false
		if (!options.includeResolved && param.resolved) return false
		if (!options.includeExpressions && param.type == 'expression') return false
		return true
	}
	const param = widget.params.find(filter)
	if (param) pull(widget.params, param)
	return param
}

export function isThemeStyle(style: string): boolean {
	return style.startsWith('theme')
}

export function parsePropertyStyle(enumName: string, styleParam: Param) {
	if (styleParam.type == 'expression') {
		return styleParam.value.toString()
	} else {
		return `${enumName}.${camelCase(unquote(styleParam.value.toString()))}`
	}
}

export function parseStyleString(styleParam: Param) {
	if (styleParam.type == 'expression') {
		return styleParam.value.toString()
	} else {
		return `"${unquote(styleParam.value.toString())}"`
	}
}


export function parseThemeStyle(style: string): string | null {
	let selector: string
	if (!isThemeStyle(style)) return null
	if (unquote(style) == style) {
		const themeRegExp = /theme\(([\w\-\/]+)\)/g
		const match = themeRegExp.exec(style)
		if (!match) return null
		const escaped = match[1].replace(/\//g, 'xxx')
		const cased = camelCase(escaped)
		selector = cased.replace(/xxx/g, '?.')
	} else {
		selector = unquote(style)
	}
	return `Theme.of(context).${selector}`
}

export function parseStyleColor(color: string): string {
	if (!color) return ''
	const themeStyle = parseThemeStyle(color)
	if (themeStyle) return themeStyle
	if (color.startsWith('#')) {
		switch(color.length) {
			case 4: {
				// #xyz => 0xFFxxyyzz
				const c = color.toUpperCase()
				return `Color(0xFF${c.charAt(1)}${c.charAt(1)}${c.charAt(2)}${c.charAt(2)}${c.charAt(3)}${c.charAt(3)})` // Color(0xFFB74093)
			}
			case 5: {
				// #xyzO => 0xOOxxyyzz
				const c = color.toUpperCase()
				return `Color(0x${c.charAt(4)}${c.charAt(4)}${c.charAt(1)}${c.charAt(1)}${c.charAt(2)}${c.charAt(2)}${c.charAt(3)}${c.charAt(3)})` // Color(0xFFB74093)
			}
			case 7: {
				// #abcdef => 0xFFabcdef
				return `Color(0xFF${color.substring(1, 7).toUpperCase()})` // Color(0xFFB74093)
			}
			case 9: {
				// #abcdefop => 0xopabcdef
				return `Color(0x${color.substring(3, 9).toUpperCase()}${color.substring(1, 2).toUpperCase()})`
			}
		}
	}
	const shadeRegExp = /(\w+)\[(\d{2,3})\]/g
	const match = shadeRegExp.exec(color)
	if (match) {
		const flutterColor = match[1]
		const flutterShade = match[2]
		return `Colors.${camelCase(flutterColor)}.shade${flutterShade}`
	}
	if (color.indexOf('.') < 0 && color.indexOf('(') < 0) {
		return `Colors.${camelCase(color)}`
	}
	return color
}

export function parseStyleRepeat(repeatParam: Param): string {
	if (!repeatParam) return ''
	const repeat = repeatParam.value.toString()
	if (repeatParam.type == 'expression') return repeat
	if (repeat.indexOf('.') < 0 && repeat.indexOf('(') < 0) {
		return `ImageRepeat.${camelCase(repeat)}`
	}
	return repeat
}

export function parseStyleBackgroundSize(sizeParam: Param): string {
	// CSS:     https://www.w3schools.com/cssref/css3_pr_background-size.asp
	// Flutter: https://docs.flutter.io/flutter/painting/BoxFit-class.html
	if (!sizeParam) return ''
	const size = sizeParam.value.toString()
	if (sizeParam.type == 'expression') return size
	if (size.indexOf('.') < 0 && size.indexOf('(') < 0) {
		return `BoxFit.${camelCase(size)}`
	}
	return size
}

export function parseStyleMainAxisAlignment(alignmentParam: Param): string {
	// Flutter: https://docs.flutter.io/flutter/rendering/MainAxisAlignment-class.html
	if (!alignmentParam) return ''
	const alignment = alignmentParam.value.toString()
	if (alignmentParam.type == 'expression') return alignment
	if (alignment.indexOf('.') < 0 && alignment.indexOf('(') < 0) {
		return `MainAxisAlignment.${camelCase(alignment)}`
	}
	return alignment
}

export function parseStyleCrossAxisAlignment(alignmentParam: Param): string {
	// Flutter: https://docs.flutter.io/flutter/rendering/CrossAxisAlignment-class.html
	if (!alignmentParam) return ''
	const alignment = alignmentParam.value.toString()
	if (alignmentParam.type == 'expression') return alignment
	if (alignment.indexOf('.') < 0 && alignment.indexOf('(') < 0) {
		return `CrossAxisAlignment.${camelCase(alignment)}`
	}
	return alignment
}

export function parseStyleMainAxisSize(alignmentParam: Param): string {
	// Flutter: https://docs.flutter.io/flutter/rendering/MainAxisSize-class.html
	if (!alignmentParam) return ''
	const alignment = alignmentParam.value.toString()
	if (alignmentParam.type == 'expression') return alignment
	if (alignment.indexOf('.') < 0 && alignment.indexOf('(') < 0) {
		return `MainAxisSize.${camelCase(alignment)}`
	}
	return alignment
}

export function parseStyleCrossAxisSize(alignmentParam: Param): string {
	// Flutter: https://docs.flutter.io/flutter/rendering/CrossAxisSize-class.html
	if (!alignmentParam) return ''
	const alignment = alignmentParam.value.toString()
	if (alignmentParam.type == 'expression') return alignment
	if (alignment.indexOf('.') < 0 && alignment.indexOf('(') < 0) {
		return `CrossAxisSize.${camelCase(alignment)}`
	}
	return alignment
}

export function parseTRBLStyle(style: string): { top?: string, right?: string, bottom?: string, left?: string } {
	const regexp = /[.a-z0-9\-\_\*\:\.\,\(\)\[\]]+/gi
	const matches = style.match(regexp)
	switch (matches.length) {
		case 1: return {
			top: matches[0],
			right: matches[0],
			bottom: matches[0],
			left: matches[0]
		}
		case 2: return {
			top: matches[0],
			bottom: matches[0],
			left: matches[1],
			right: matches[1]
		}
		case 3: return {
			top: matches[0],
			right: matches[1],
			bottom: matches[2]
		}
		case 4: return {
			top: matches[0],
			right: matches[1],
			bottom: matches[2],
			left: matches[3]
		}
		default: return {}
	}
}

export type Border = { width?: string, style?: string, color?: string }

export function parseBorderStyle(border: string): Border {
	const regexp = /[.a-z0-9\#\-\.\,\(\)\[\]]+/gi
	const matches = border.match(regexp)
	switch (matches.length) {
		case 1: {
			if (matches[0] == 'none') {
				return { style: 'none' }
			} else if (parseFloat(matches[0])) {
				// border: 5.0
				return { width: parseStyleDoubleValue(matches[0]) }
			} else {
				// border: red
				return { color: parseStyleColor(matches[0]) }
			}
		}
		case 2: {
			if (parseFloat(matches[0])) {
				// border: 5.0 red
				return {
					width: parseStyleDoubleValue(matches[0]),
					color: parseStyleColor(matches[1])
				}
			} else {
				// border: solid red
				return {
					style: matches[0],
					color: parseStyleColor(matches[1])
				}
			}
		}
		case 3: return {
			// border: 5.0 solid red
			width: parseStyleDoubleValue(matches[0]),
			style: matches[1],
			color: parseStyleColor(matches[2])
		}
		default: return {}
	}
}

export function parseStyleDoubleValue(value: string): string {
	// return `(${value}).toDouble()` // used to be necessary, but fixed in Dart 2.0
	return value
}

/**
 * Fallback double value parser, in case the result must be a constant value
 * or else the dart compiler will complain.
 * @param value the value to process
 */
export function parseConstStyleDoubleValue(value: string): string {
	if (parseFloat(value) || value == '0') return parseFloat(value).toFixed(2).toString()
	return value
}

export function parseStyleUrl(value: string): CSSURL | CSSAssetURL | CSSLinearGradientURL | null {
	const matchesUrl = /url\(['"]([a-zA-Z0-9:\/\._-]+)['"]\)/g.exec(value)
	if (matchesUrl) return {
		type: 'url',
		url: matchesUrl[1]
	}
	const matchesAsset = /asset\(['"]([a-zA-Z0-9:\/\._-]+)['"]\)/g.exec(value)
	if (matchesAsset) return {
		type: 'asset',
		url: matchesAsset[1]
	}
	// const matchesLinearGradient = /linear-gradient\(['"]([a-zA-Z0-9:\/\._-]+)['"]\)/g.exec(value)
	// if (matchesLinearGradient) {
	// 	const params = matchesLinearGradient[1]
	// 	return {
	// 		type: 'linear-gradient',
	// 		location: matchesLinearGradient[1]
	// 	}
	// }
	return null
}



export function parseBoxShadow(value: string): { color?: string, hoffset: string, voffset: string, blur?: string, spread?: string } {
	const regexp = /([\w\.\(\)\:\_\-\#\[\]]+)/g
	const matches = value.match(regexp)
	let params = []
	switch (matches.length) {
		case 2: {
			return {
				hoffset: parseConstStyleDoubleValue(matches[0]),
				voffset: parseConstStyleDoubleValue(matches[1])
			}
		}
		case 3: {
			if (parseStyleColor(matches[2]) == matches[2]) {
				return {
					hoffset: parseConstStyleDoubleValue(matches[0]),
					voffset: parseConstStyleDoubleValue(matches[1]),
					color: parseStyleColor(matches[3])
				}
			} else {
				return {
					hoffset: parseConstStyleDoubleValue(matches[0]),
					voffset: parseConstStyleDoubleValue(matches[1]),
					blur: parseConstStyleDoubleValue(matches[2])
				}
			}
		}
		case 4: {
			if (parseStyleColor(matches[3]) == matches[3]) {
				return {
					hoffset: parseConstStyleDoubleValue(matches[0]),
					voffset: parseConstStyleDoubleValue(matches[1]),
					blur: parseConstStyleDoubleValue(matches[2]),
					color: parseStyleColor(matches[3])
				}
			} else {
				return {
					hoffset: parseConstStyleDoubleValue(matches[0]),
					voffset: parseConstStyleDoubleValue(matches[1]),
					blur: parseConstStyleDoubleValue(matches[2]),
					spread: parseConstStyleDoubleValue(matches[3])
				}
			}
		}
		case 5: {
			return {
				hoffset: parseConstStyleDoubleValue(matches[0]),
				voffset: parseConstStyleDoubleValue(matches[1]),
				blur: parseConstStyleDoubleValue(matches[2]),
				spread: parseConstStyleDoubleValue(matches[3]),
				color: parseStyleColor(matches[4])
			}
		}
		default: throw `box-shadow style ${value} is invalid, needs at least hoffset and voffset, but found ${matches.length} properties.`
	}
}

/**
 * Recursively apply all plugins to the widget and its descendants, either modifying or creating a new widget tree
 * @param widget the widget to apply all passed plugins on
 * @param plugins the plugins to apply
 */
export function applyPlugins(widget: Widget, plugins: RenderPlugin[], options: Options): Widget {
	if (!plugins || plugins.length == 0) return widget
	const plugin = plugins[0]
	const newWidget = plugin.transformWidget(widget, options)
	return applyPlugins(newWidget, tail(plugins), options)
}

/**
 * Apply a widget transformation function on a widget
 * @param widget the widget whose parameters to apply the transformation function on
 * @param fn takes a widget and returns a modified or new widget, that should replace the value in the parameter
 */
export function applyOnDescendants(widget: Widget, fn: (Widget) => Widget) {
	if (!widget.params) return
	for (let param of widget.params) {
		switch (param.type) {
			case 'array': case 'widgets': {
				const widgets = param.value as Widget[]
				param.value = widgets.map(fn)
			}
			case 'widget': {
				const widget = param.value as Widget
				param.value = fn(widget)
			}
		}
	}
}

/**
 * Gets the first child from either the child or the children property
 * @param widget the widget to get the child from
 * @returns a widget if it a child was found, or null if nothing was found
 */
export function getWidgetChildren(widget: Widget): Widget[] {
	if (!widget.params) return []
	const childParam = widget.params.find(param => param.name == 'child' && param.type == 'widget' && !!param.value)
	const childrenParam = widget.params.find(param => param.name == 'children' && param.type == 'widgets' && !!param.value)
	if (childParam) return [childParam.value as Widget]
	if (childrenParam) return childrenParam.value as Widget[]
	return []
}

export function toBorderRadiusCode(radiusParam: Param): string {
	function toRadius(value: string) {
		if (parseFloat(value) || parseFloat(value) == 0) {
			return `Radius.circular(${parseStyleDoubleValue(value)})`
		} else {
			return unquote(value)
		}
	}
	const radius = radiusParam.value.toString()
	if (radiusParam.type == 'expression') return radius
	const radiusValue = parseTRBLStyle(radius)
	const params: string[] = []
	if (radiusValue.top) params.push(`topLeft: ${toRadius(radiusValue.top)}`)
	if (radiusValue.right) params.push(`topRight: ${toRadius(radiusValue.right)}`)
	if (radiusValue.bottom) params.push(`bottomRight: ${toRadius(radiusValue.bottom)}`)
	if (radiusValue.left) params.push(`bottomLeft: ${toRadius(radiusValue.left)}`)
	return `BorderRadius.only(${params.join(', ')})`
}