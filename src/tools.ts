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

export function findAndRemoveStyleParam(widget: Widget, name: string) : Param | null {
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

export function parseStyleDoubleValue(value: string) : string {
	if(!value) return ''
	const isNumber = parseFloat(value)
	if(isNumber && value.indexOf('.') < 0) return `${value}.0`
	return value
}

/**
 * Recursively apply all plugins to the widget, either modifying or creating a new widget tree
 * @param widget the widget to apply all passed plugins on
 * @param plugins the plugins to apply
 */
export function applyPlugins(widget: Widget, plugins: RenderPlugin[], options: Options) : Widget {
	if(!plugins || plugins.length == 0) return widget
	const plugin = plugins[0]
	const newWidget = plugin.transformWidget(widget, plugins, options)
	return applyPlugins(newWidget, tail(plugins), options)
}
