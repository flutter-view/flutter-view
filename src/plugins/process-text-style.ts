import { Options } from './../watcher'
import { Widget, Param } from '../flutter-model'
import { pull} from 'lodash'
import { multiline, unquote, findParam } from '../tools'

export function transformWidget(widget: Widget, options: Options): Widget {
	const fontSizeParam = findParam(widget, 'fontSize')
	const fontColorParam = findParam(widget, 'color')
	const fontFamilyParam = findParam(widget, 'fontFamily')
	const fontWeightParam = findParam(widget, 'fontWeight')
	const fontStyleParam = findParam(widget, 'fontStyle')
	const lineHeightParam = findParam(widget, 'lineHeight')
	const textDecorationParam = findParam(widget, 'textDecoration')
	const textDecorationColorParam = findParam(widget, 'textDecorationColor')
	const textDecorationStyleParam = findParam(widget, 'textDecorationStyle')
	const backgroundColorParam = findParam(widget, 'backgroundColor')

	if(
		!fontSizeParam && 
		!fontColorParam && 
		!fontFamilyParam && 
		!fontWeightParam &&
		!fontStyleParam &&
		!lineHeightParam &&
		!textDecorationParam &&
		!textDecorationColorParam &&
		!textDecorationStyleParam &&
		!backgroundColorParam
	) return widget

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

	if(fontFamilyParam) {
		pull(widget.params, fontFamilyParam)
		textStyleParams.push({
			class: 'param',
			name: 'fontFamily',
			type: 'expression',
			value: fontFamilyParam.value.toString()
		})
	}

	if(fontWeightParam) {
		pull(widget.params, fontWeightParam)
		textStyleParams.push({
			class: 'param',
			name: 'fontWeight',
			type: 'expression',
			value: `FontWeight.${unquote(fontWeightParam.value.toString())}`
		})
	}

	if(fontStyleParam) {
		pull(widget.params, fontStyleParam)
		textStyleParams.push({
			class: 'param',
			name: 'fontStyle',
			type: 'expression',
			value: `FontStyle.${unquote(fontStyleParam.value.toString())}`
		})
	}

	if(lineHeightParam) {
		pull(widget.params, lineHeightParam)
		textStyleParams.push({
			class: 'param',
			name: 'height',
			type: 'expression',
			value: lineHeightParam.value.toString()
		})
	}

	if(textDecorationParam) {
		pull(widget.params, textDecorationParam)
		textStyleParams.push({
			class: 'param',
			name: 'decoration',
			type: 'expression',
			value: `TextDecoration.${unquote(textDecorationParam.value.toString())}`
		})
	}

	if(textDecorationColorParam) {
		pull(widget.params, textDecorationColorParam)
		textStyleParams.push({
			class: 'param',
			name: 'decorationColor',
			type: 'expression',
			value: unquote(textDecorationColorParam.value.toString())
		})
	}

	if(textDecorationStyleParam) {
		pull(widget.params, textDecorationStyleParam)
		textStyleParams.push({
			class: 'param',
			name: 'decorationStyle',
			type: 'expression',
			value: `TextDecorationStyle.${unquote(textDecorationStyleParam.value.toString())}`
		})
	}

	if(backgroundColorParam) {
		pull(widget.params, backgroundColorParam)
		textStyleParams.push({
			class: 'param',
			name: 'background',
			type: 'expression',
			value: unquote(backgroundColorParam.value.toString())
		})
	}

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
