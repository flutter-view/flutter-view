import { isArray, mergeWith, pull, tail } from 'lodash';
import { Param, Widget } from './flutter-model';
import { Options, RenderPlugin } from './watcher';

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

export function multiline(...lines: string[]): string {
	return lines.join('\n')
}

export function merge(object, other) {
	function customizer(objValue, srcValue) {
		if (isArray(objValue)) {
			return objValue.concat(srcValue)
		}
	}
	return mergeWith(object, other, customizer)
}

export function findParam(widget: Widget, name: string) : Param | null {
	if(!widget.params) return null
	return widget.params.find(param => param.name==name)
}

export function findAndRemoveParam(widget: Widget, name: string) : Param | null {
	if(!widget.params) return null
	const param = widget.params.find(param => param.name==name && !param.resolved)
	if(param) pull(widget.params, param)
	return param
}

export function parseStyleColor(color: string) : string {
	if(!color) return ''
	if(color.length == 7 && color.startsWith('#') && color) {
		return `Color(0xFF${color.substring(1, 7).toUpperCase()})` // Color(0xFFB74093)
	}
	if(color.indexOf('.') < 0 && color.indexOf('(') < 0) {
		return `Colors.${color}`
	}
	return color
}

export function parseTRBLStyle(style: string) : { top?: string, right?: string, bottom?: string, left?: string } {
	const regexp = /[.a-z0-9\.\,\(\)]+/gi
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

export function parseBorderStyle(border: string) : Border {
	const regexp = /[.a-z0-9\.\,\(\)]+/gi
	const matches = border.match(regexp)
	switch (matches.length) {
		case 1: {
			if(matches[0]=='none') {
				return { style: 'none' }
			} else if(parseFloat(matches[0])) {
				// border: 5.0
				return { width: parseStyleDoubleValue(matches[0]) }
			} else {
				// border: red
				return { color: parseStyleColor(matches[0]) }
			}
		}
		case 2: {
			if(parseFloat(matches[0])) {
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

export function parseStyleDoubleValue(value: string) : string {
	if(!value) return ''
	const isNumber = parseFloat(value)
	if(isNumber && value.indexOf('.') < 0) return `${value}.0`
	return value
}

/**
 * Recursively apply all plugins to the widget and its descendants, either modifying or creating a new widget tree
 * @param widget the widget to apply all passed plugins on
 * @param plugins the plugins to apply
 */
export function applyPlugins(widget: Widget, plugins: RenderPlugin[], options: Options) : Widget {
	if(!plugins || plugins.length == 0) return widget
	const plugin = plugins[0]
	const newWidget = plugin.transformWidget(widget, options)
	return applyPlugins(newWidget, tail(plugins), options)
}

/**
 * Apply a widget transformation function on a widget
 * @param widget the widget whose parameters to apply the transformation function on
 * @param fn takes a widget and returns a modified or new widget, that should replace the value in the parameter
 */
export function applyOnDescendants(widget: Widget, fn: (Widget)=>Widget) {
	if(!widget.params) return widget
	for(let param of widget.params) {
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
