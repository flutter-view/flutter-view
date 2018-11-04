import { pull } from 'lodash';
import { Param, Widget } from '../models/flutter-model';
import { applyOnDescendants, findAndRemoveParam, findParam, parseStyleColor, parseStyleDoubleValue, unquote, parsePropertyStyle } from '../tools';
import { Options } from '../watcher';

/**
 * Processes text styles on a container, and if any styles are found, it wraps the container
 * with a DefaultTextStyle wrapper widget, which applies those styles on the container and
 * its descendants.
 */
export function transformWidget(widget: Widget, options: Options): Widget {

	if(widget.name != 'Container' && widget.name != 'AnimatedContainer') {
		applyOnDescendants(widget, descendant=>transformWidget(descendant, options))
		return widget
	}

	const fontSizeParam = findAndRemoveParam(widget, 'fontSize')
	const fontColorParam = findAndRemoveParam(widget, 'color')
	const fontFamilyParam = findAndRemoveParam(widget, 'fontFamily')
	const fontWeightParam = findAndRemoveParam(widget, 'fontWeight')
	const fontStyleParam = findAndRemoveParam(widget, 'fontStyle')
	const lineHeightParam = findAndRemoveParam(widget, 'lineHeight')
	const textDecorationParam = findAndRemoveParam(widget, 'textDecoration')
	const textDecorationColorParam = findAndRemoveParam(widget, 'textDecorationColor')
	const textDecorationStyleParam = findAndRemoveParam(widget, 'textDecorationStyle')
	const wordSpacingParam = findAndRemoveParam(widget, 'wordSpacing')
	const textAlignParam = findAndRemoveParam(widget, 'textAlign')
	const textOverflowParam = findAndRemoveParam(widget, 'textOverflow')
	const wordWrapParam = findAndRemoveParam(widget, 'wordWrap')
	const softWrapParam = findAndRemoveParam(widget, 'softWrap')
	const maxLinesParam = findAndRemoveParam(widget, 'maxLines')
	const lineClampParam = findAndRemoveParam(widget, 'lineClamp')

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
		maxLinesParam ||
		lineClampParam
	
	if(!update) {
		applyOnDescendants(widget, descendant=>transformWidget(descendant, options))
		return widget
	}

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
		let value = unquote(fontWeightParam.value.toString())
		if(fontWeightParam.type == 'literal') {
			const fontWeightProperty = parseInt(value) ? 'w' + value : value
			value = `FontWeight.${fontWeightProperty}` 
		}
		textStyleParams.push({
			class: 'param',
			name: 'fontWeight',
			type: 'expression',
			value: value,
			resolved: true
		})
	}

	if(fontStyleParam) {
		textStyleParams.push({
			class: 'param',
			name: 'fontStyle',
			type: 'expression',
			value: parsePropertyStyle('FontStyle', fontStyleParam),
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
			value: parsePropertyStyle('TextDecoration', textDecorationParam),
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
			value: transformWidget(widget, options),
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

	if(maxLinesParam || lineClampParam) {
		let maxLinesValue 
		if (maxLinesParam) maxLinesValue = maxLinesParam.value.toString()
		if (lineClampParam) maxLinesValue = lineClampParam.value.toString()
		params.push({
			class: 'param',
			name: 'maxLines',
			type: 'expression',
			value: unquote(maxLinesValue),
			resolved: true
		})
	}

	// if the widget uses vFor, move that vFor to the textstyle instead
	const vForParam = findParam(widget, 'vFor')
	if(vForParam) {
		pull(widget.params, vForParam)
		params.push(vForParam)
	}

	const newRootWidget: Widget = {
		constant: false,
		class: 'widget',
		name: 'DefaultTextStyle.merge',
		params: params
	}

	applyOnDescendants(newRootWidget, descendant=>transformWidget(descendant, options))

	return newRootWidget
}
