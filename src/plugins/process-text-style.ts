import { Param, Widget } from '../flutter-model';
import { findAndRemoveStyleParam, findParam, unquote, parseStyleColor, parseStyleDoubleValue, applyPlugins } from '../tools';
import { Options, RenderPlugin } from './../watcher';
import { pull} from 'lodash';

export function transformWidget(widget: Widget, plugins: RenderPlugin[], options: Options): Widget {
	const fontSizeParam = findAndRemoveStyleParam(widget, 'fontSize')
	const fontColorParam = findAndRemoveStyleParam(widget, 'color')
	const fontFamilyParam = findAndRemoveStyleParam(widget, 'fontFamily')
	const fontWeightParam = findAndRemoveStyleParam(widget, 'fontWeight')
	const fontStyleParam = findAndRemoveStyleParam(widget, 'fontStyle')
	const lineHeightParam = findAndRemoveStyleParam(widget, 'lineHeight')
	const textDecorationParam = findAndRemoveStyleParam(widget, 'textDecoration')
	const textDecorationColorParam = findAndRemoveStyleParam(widget, 'textDecorationColor')
	const textDecorationStyleParam = findAndRemoveStyleParam(widget, 'textDecorationStyle')
	const wordSpacingParam = findAndRemoveStyleParam(widget, 'wordSpacing')
	const textAlignParam = findAndRemoveStyleParam(widget, 'textAlign')
	const textOverflowParam = findAndRemoveStyleParam(widget, 'textOverflow')
	const wordWrapParam = findAndRemoveStyleParam(widget, 'wordWrap')
	const softWrapParam = findAndRemoveStyleParam(widget, 'softWrap')
	const maxLinesParam = findAndRemoveStyleParam(widget, 'maxLines')

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
		textStyleParams.push({
			class: 'param',
			name: 'fontSize',
			type: 'expression',
			value: parseStyleDoubleValue(fontSizeParam.value.toString()),
			resolved: true
		})
	}

	if(fontColorParam) {
		textStyleParams.push({
			class: 'param',
			name: 'color',
			type: 'expression',
			value: parseStyleColor(unquote(fontColorParam.value.toString())),
			resolved: true
		})
	}

	if(fontFamilyParam) {
		textStyleParams.push({
			class: 'param',
			name: 'fontFamily',
			type: 'expression',
			value: fontFamilyParam.value.toString(),
			resolved: true
		})
	}

	if(fontWeightParam) {
		textStyleParams.push({
			class: 'param',
			name: 'fontWeight',
			type: 'expression',
			value: `FontWeight.${unquote(fontWeightParam.value.toString())}`,
			resolved: true
		})
	}

	if(fontStyleParam) {
		textStyleParams.push({
			class: 'param',
			name: 'fontStyle',
			type: 'expression',
			value: `FontStyle.${unquote(fontStyleParam.value.toString())}`,
			resolved: true
		})
	}

	if(lineHeightParam) {
		textStyleParams.push({
			class: 'param',
			name: 'height',
			type: 'expression',
			value: parseStyleDoubleValue(lineHeightParam.value.toString()),
			resolved: true
		})
	}

	if(textDecorationParam) {
		textStyleParams.push({
			class: 'param',
			name: 'decoration',
			type: 'expression',
			value: `TextDecoration.${unquote(textDecorationParam.value.toString())}`,
			resolved: true
		})
	}

	if(textDecorationColorParam) {
		textStyleParams.push({
			class: 'param',
			name: 'decorationColor',
			type: 'expression',
			value: parseStyleColor(unquote(textDecorationColorParam.value.toString())),
			resolved: true
		})
	}

	if(textDecorationStyleParam) {
		textStyleParams.push({
			class: 'param',
			name: 'decorationStyle',
			type: 'expression',
			value: `TextDecorationStyle.${unquote(textDecorationStyleParam.value.toString())}`,
			resolved: true
		})
	}

	if(wordSpacingParam) {
		textStyleParams.push({
			class: 'param',
			name: 'wordSpacing',
			type: 'expression',
			value: parseStyleDoubleValue(wordSpacingParam.value.toString()),
			resolved: true
		})
	}

	// create the DefaultTextStyle wrapper

	const params: Param[] = [
		{
			class: 'param',
			name: 'child',
			type: 'widget',
			value: applyPlugins(widget, plugins, options),
			resolved: true
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
		},
		resolved: true
	})

	if(textAlignParam) {
		params.push({
			class: 'param',
			name: 'textAlign',
			type: 'expression',
			value: `TextAlign.${unquote(textAlignParam.value.toString())}`,
			resolved: true
		})
	}

	if(textOverflowParam) {
		params.push({
			class: 'param',
			name: 'overflow',
			type: 'expression',
			value: `TextOverflow.${unquote(textOverflowParam.value.toString())}`,
			resolved: true
		})
	}

	if(wordWrapParam || softWrapParam) {
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
			value: wordWrap,
			resolved: true
		})
	}

	if(maxLinesParam) {
		params.push({
			class: 'param',
			name: 'maxLines',
			type: 'expression',
			value: unquote(maxLinesParam.value.toString()),
			resolved: true
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
