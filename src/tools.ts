import { isArray, mergeWith } from 'lodash';
import { Widget, Param } from './flutter-model';

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