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
	const wordSpacingParam = findParam(widget, 'wordSpacing')
	const textAlignParam = findParam(widget, 'textAlign')
	const textOverflowParam = findParam(widget, 'textOverflow')
	const wordWrapParam = findParam(widget, 'wordWrap')
	const softWrapParam = findParam(widget, 'softWrap')
	const maxLinesParam = findParam(widget, 'maxLines')

	const update =
		fontSizeParam ||
		fontColorParam || 
		fontFamilyParam || 
		fontWeightParam ||
		fontStyleParam ||
		lineHeightParam ||
		textDecorationParam ||
		textDecorationColorParam ||
		textDecorationStyleParam ||
		wordSpacingParam ||
		textAlignParam ||
		textOverflowParam ||
		wordWrapParam ||
		softWrapParam ||
		maxLinesParam
	if(!update) return widget

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

	if(wordSpacingParam) {
		pull(widget.params, wordSpacingParam)
		textStyleParams.push({
			class: 'param',
			name: 'wordSpacing',
			type: 'expression',
			value: wordSpacingParam.value.toString()
		})
	}

	// create the DefaultTextStyle wrapper

	const params: Param[] = [
		{
			class: 'param',
			name: 'child',
			type: 'widget',
			value: widget
		}
	]

	if(textStyleParams.length > 0) params.push({
		class: 'param',
		name: 'style',
		type: 'widget',
		value: {
			constant: false,
			class: 'widget',
			name: 'TextStyle',
			params: textStyleParams
		}
	})

	if(textAlignParam) {
		pull(widget.params, textAlignParam)
		params.push({
			class: 'param',
			name: 'textAlign',
			type: 'expression',
			value: `TextAlign.${unquote(textAlignParam.value.toString())}`
		})
	}

	if(textOverflowParam) {
		pull(widget.params, textOverflowParam)
		params.push({
			class: 'param',
			name: 'overflow',
			type: 'expression',
			value: `TextOverflow.${unquote(textOverflowParam.value.toString())}`
		})
	}

	if(wordWrapParam || softWrapParam) {
		pull(widget.params, wordWrapParam)
		pull(widget.params, softWrapParam)
		let wordWrap : string
		if(softWrapParam) {
			wordWrap = softWrapParam.value.toString()
		} else {
			switch(unquote(wordWrapParam.value.toString())) {
				case 'normal': case 'true': {
					wordWrap = 'true'
					break
				}
				case 'break-word': case 'false': {
					wordWrap = 'false'
					break
				}
				default: {
					console.log('no valid word-wrap style set, expecting one of [true, false, normal, break-word].')
				}
			}
		}
		params.push({
			class: 'param',
			name: 'softWrap',
			type: 'expression',
			value: wordWrap
		})
	}

	if(maxLinesParam) {
		pull(widget.params, maxLinesParam)
		params.push({
			class: 'param',
			name: 'maxLines',
			type: 'expression',
			value: unquote(maxLinesParam.value.toString())
		})
	}

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
