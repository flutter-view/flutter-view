import { isArray, mergeWith } from 'lodash';
import { Widget, Param } from './flutter-model';
import { pull} from 'lodash';

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
		return `Color(0xFF${color.substring(1, 7)})` // Color(0xFFB74093)
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