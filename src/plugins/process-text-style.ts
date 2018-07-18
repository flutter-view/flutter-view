import { Options } from './../watcher';
import { Widget, Param } from '../flutter-model'
import * as parse from 'style-parser'
import { pull} from 'lodash'
import { multiline, unquote, findParam } from '../tools';

export function transformWidget(widget: Widget, options: Options): Widget {
	const fontSizeParam = findParam(widget, 'fontSize')
	const fontColorParam = findParam(widget, 'color')
	if(!fontSizeParam && !fontColorParam) return widget;

	const textStyleParams: Param[] = []

	pull(widget.params, fontSizeParam)
	if(fontSizeParam) textStyleParams.push({
		class: 'param',
		name: 'fontSize',
		type: 'expression',
		value: fontSizeParam.value.toString()
	})

	pull(widget.params, fontColorParam)
	if(fontColorParam) textStyleParams.push({
		class: 'param',
		name: 'color',
		type: 'expression',
		value: unquote(fontColorParam.value.toString())
	})

	return {
		constant: false,
		class: 'widget',
		name: 'DefaultTextStyle',
		params: [
			{
				class: 'param',
				name: 'style',
				type: 'widget',
				value: {
					constant: false,
					class: 'widget',
					name: 'TextStyle',
					params: textStyleParams
				}
			},
			{
				class: 'param',
				name: 'child',
				type: 'widget',
				value: widget
			},

		]
	}
}
