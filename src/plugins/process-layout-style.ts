import { Widget } from '../models/flutter-model';
import { applyOnDescendants, Border, findAndRemoveParam, parseStyleDoubleValue, parseTRBLStyle, toBorderRadiusCode } from '../tools';
import { Options } from '../watcher';
import { camelCase, upperCaseFirst } from 'change-case';

type Borders = { top?: Border, right?: Border, bottom?: Border, left?: Border }

export function transformWidget(widget: Widget, options: Options): Widget {
	
	const widthParam = findAndRemoveParam(widget, 'width', {
		includeExpressions: false,
		includeResolved: true
	})
	const heightParam = findAndRemoveParam(widget, 'height', {
		includeExpressions: false,
		includeResolved: true
	})
	const sizeParam = findAndRemoveParam(widget, 'size', {
		includeExpressions: false,
		includeResolved: true
	})

	const fitParam = findAndRemoveParam(widget, 'fit', {
		includeExpressions: false,
		includeResolved: true
	})

	const paddingParam = findAndRemoveParam(widget, 'padding', {
		includeExpressions: false,
		includeResolved: true
	})
	const paddingTopParam = findAndRemoveParam(widget, 'paddingTop')
	const paddingRightParam = findAndRemoveParam(widget, 'paddingRight')
	const paddingBottomParam = findAndRemoveParam(widget, 'paddingBottom')
	const paddingLeftParam = findAndRemoveParam(widget, 'paddingLeft')

	const marginParam = findAndRemoveParam(widget, 'margin', {
		includeExpressions: false,
		includeResolved: true
	})
	const marginTopParam = findAndRemoveParam(widget, 'marginTop')
	const marginRightParam = findAndRemoveParam(widget, 'marginRight')
	const marginBottomParam = findAndRemoveParam(widget, 'marginBottom')
	const marginLeftParam = findAndRemoveParam(widget, 'marginLeft')

	const borderRadiusParam = findAndRemoveParam(widget, 'borderRadius', {
		includeExpressions: false,
		includeResolved: true
	})

	const alignmentParam = findAndRemoveParam(widget, 'alignment', {
		includeExpressions: false,
		includeResolved: true
	})


	// dimensions

	if (sizeParam && sizeParam.value) {
		widget.params.push({
			class: 'param',
			name: 'size',
			type: 'expression',
			value: parseStyleDoubleValue(sizeParam.value.toString()),
			resolved: true
		})
	}

	if (widthParam && widthParam.value) {
		widget.params.push({
			class: 'param',
			name: 'width',
			type: 'expression',
			value: parseStyleDoubleValue(widthParam.value.toString()),
			resolved: true
		})
	}

	if (heightParam && heightParam.value) {
		widget.params.push({
			class: 'param',
			name: 'height',
			type: 'expression',
			value: parseStyleDoubleValue(heightParam.value.toString()),
			resolved: true
		})
	}

	if (fitParam && fitParam.value) {
		widget.params.push({
			class: 'param',
			name: 'fit',
			type: 'expression',
			value: `BoxFit.${camelCase(fitParam.value.toString())}`,
			resolved: true
		})
	}

	// alignment

	if (alignmentParam && alignmentParam.value) {
		widget.params.push({
			class: 'param',
			name: 'alignment',
			type: 'expression',
			value: `Alignment.${camelCase(alignmentParam.value.toString())}`,
			resolved: true
		})
	}


	// padding

	let paddings: { top?: string, right?: string, bottom?: string, left?: string } = {}
	if (paddingParam && paddingParam.value) {
		paddings = parseTRBLStyle(paddingParam.value.toString())
	}
	if (paddingTopParam && paddingTopParam.value) {
		paddings.top = paddingTopParam.value.toString()
	}
	if (paddingRightParam && paddingRightParam.value) {
		paddings.right = paddingRightParam.value.toString()
	}
	if (paddingBottomParam && paddingBottomParam.value) {
		paddings.bottom = paddingBottomParam.value.toString()
	}
	if (paddingLeftParam && paddingLeftParam.value) {
		paddings.left = paddingLeftParam.value.toString()
	}
	if (Object.keys(paddings).length > 0) {
		const params: string[] = []
		if (paddings.top) params.push('top: ' + parseStyleDoubleValue(paddings.top))
		if (paddings.right) params.push('right: ' + parseStyleDoubleValue(paddings.right))
		if (paddings.bottom) params.push('bottom: ' + parseStyleDoubleValue(paddings.bottom))
		if (paddings.left) params.push('left: ' + parseStyleDoubleValue(paddings.left))
		const inset = `EdgeInsets.only(${params.join(', ')})`
		widget.params.push({
			class: 'param',
			name: 'padding',
			type: 'expression',
			value: inset,
			resolved: true
		})
	}


	// margin
	
	let margins: { top?: string, right?: string, bottom?: string, left?: string } = {}
	if (marginParam && marginParam.value) {
		margins = parseTRBLStyle(marginParam.value.toString())
	}
	if (marginTopParam && marginTopParam.value) {
		margins.top = marginTopParam.value.toString()
	}
	if (marginRightParam && marginRightParam.value) {
		margins.right = marginRightParam.value.toString()
	}
	if (marginBottomParam && marginBottomParam.value) {
		margins.bottom = marginBottomParam.value.toString()
	}
	if (marginLeftParam && marginLeftParam.value) {
		margins.left = marginLeftParam.value.toString()
	}
	if (Object.keys(margins).length > 0) {
		const params: string[] = []
		if (margins.top) params.push('top: ' + parseStyleDoubleValue(margins.top))
		if (margins.right) params.push('right: ' + parseStyleDoubleValue(margins.right))
		if (margins.bottom) params.push('bottom: ' + parseStyleDoubleValue(margins.bottom))
		if (margins.left) params.push('left: ' + parseStyleDoubleValue(margins.left))
		const inset = `EdgeInsets.only(${params.join(', ')})`
		widget.params.push({
			class: 'param',
			name: 'margin',
			type: 'expression',
			value: inset,
			resolved: true
		})
	}


	// border radius

	if (borderRadiusParam && borderRadiusParam.value) widget.params.push({
		class: 'param',
		name: 'borderRadius',
		type: 'expression',
		value: toBorderRadiusCode(borderRadiusParam.value.toString()),
		resolved: true
	})

	
	// also apply the plugin to the rest of the widget tree of this widget
	applyOnDescendants(widget, descendant => transformWidget(descendant, options))

	return widget
}
