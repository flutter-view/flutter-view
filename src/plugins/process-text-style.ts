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

	if(fontSizeParam) {
		pull(widget.params, fontSizeParam)
		textStyleParams.push({
			class: 'param',
			name: 'fontSize',
			type: 'expression',
			value: fontSizeParam.value.toString()
		})
	}

	if(fontColorParam) {
		pull(widget.params, fontColorParam)
		textStyleParams.push({
			class: 'param',
			name: 'color',
			type: 'expression',
			value: unquote(fontColorParam.value.toString())
		})
	}

	// let child : Widget
	// if(vForParam) {
	// 	child = {
	// 		class: 'widget',
	// 		constant: false,
	// 		name: options.autowrapChildrenClass,
	// 		params: [
	// 			{
	// 				class: 'param',
	// 				type: 'widget',
	// 				name: 'children',
	// 				value: widget
	// 			}
	// 		]
	// 	}
	// } else {
	// 	child = widget
	// }

	const params: Param[] = [
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
		}
	]

	// if the widget uses vFor, move that vFor to the textstyle instead
	const vForParam = findParam(widget, 'vFor')
	if(vForParam) {
		pull(widget.params, vForParam)
		params.push(vForParam)
	}

	return {
		constant: false,
		class: 'widget',
		name: 'DefaultTextStyle',
		params: params
	}
}
