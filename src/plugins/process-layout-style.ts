import { Widget } from '../flutter-model';
import { applyOnDescendants, findAndRemoveParam, parseStyleColor, unquote, parseStyleDoubleValue, parseTRBLStyle } from '../tools';
import { Options } from '../watcher';

export function transformWidget(widget: Widget, options: Options): Widget {

	if(widget.name=='Container') {
		if(!widget.params) widget.params = []

		const backgroundColorParam = findAndRemoveParam(widget, 'backgroundColor')
		const widthParam = findAndRemoveParam(widget, 'width')
		const heightParam = findAndRemoveParam(widget, 'height')
		const paddingParam = findAndRemoveParam(widget, 'padding')
		const paddingTopParam = findAndRemoveParam(widget, 'paddingTop')
		const paddingRightParam = findAndRemoveParam(widget, 'paddingRight')
		const paddingBottomParam = findAndRemoveParam(widget, 'paddingBottom')
		const paddingLeftParam = findAndRemoveParam(widget, 'paddingLeft')
		const marginParam = findAndRemoveParam(widget, 'margin')
		const marginTopParam = findAndRemoveParam(widget, 'marginTop')
		const marginRightParam = findAndRemoveParam(widget, 'marginRight')
		const marginBottomParam = findAndRemoveParam(widget, 'marginBottom')
		const marginLeftParam = findAndRemoveParam(widget, 'marginLeft')

		// background color

		if(backgroundColorParam) {
			widget.params.push({
				class: 'param',
				name: 'color',
				type: 'expression',
				value: parseStyleColor(unquote(backgroundColorParam.value.toString())),
				resolved: true
			})
		}

		// dimensions

		if(widthParam) {
			widget.params.push({
				class: 'param',
				name: 'width',
				type: 'expression',
				value: parseStyleDoubleValue(widthParam.value.toString()),
				resolved: true
			})
		}

		if(heightParam) {
			widget.params.push({
				class: 'param',
				name: 'height',
				type: 'expression',
				value: parseStyleDoubleValue(heightParam.value.toString()),
				resolved: true
			})
		}

		// padding

		let paddings: { top?: string, right?: string, bottom?: string, left?: string } = {}
		if(paddingParam && paddingParam.type=='literal' && paddingParam.value) {
			paddings = parseTRBLStyle(paddingParam.value as string)
		}
		if(paddingTopParam && paddingTopParam.type=='literal' && paddingTopParam.value) {
			paddings.top = paddingTopParam.value as string
		}
		if(paddingRightParam && paddingRightParam.type=='literal' && paddingRightParam.value) {
			paddings.right = paddingRightParam.value as string
		}
		if(paddingBottomParam && paddingBottomParam.type=='literal' && paddingBottomParam.value) {
			paddings.bottom = paddingBottomParam.value as string
		}
		if(paddingLeftParam && paddingLeftParam.type=='literal' && paddingLeftParam.value) {
			paddings.left = paddingLeftParam.value as string
		}
		if(Object.keys(paddings).length > 0) {
			const params: string[] = []
			if(paddings.top) params.push('top: ' + parseStyleDoubleValue(paddings.top))
			if(paddings.right) params.push('right: ' + parseStyleDoubleValue(paddings.right))
			if(paddings.bottom) params.push('bottom: ' + parseStyleDoubleValue(paddings.bottom))
			if(paddings.left) params.push('left: ' + parseStyleDoubleValue(paddings.left))
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
		if(marginParam && marginParam.type=='literal' && marginParam.value) {
			margins = parseTRBLStyle(marginParam.value as string)
		}
		if(marginTopParam && marginTopParam.type=='literal' && marginTopParam.value) {
			margins.top = marginTopParam.value as string
		}
		if(marginRightParam && marginRightParam.type=='literal' && marginRightParam.value) {
			margins.right = marginRightParam.value as string
		}
		if(marginBottomParam && marginBottomParam.type=='literal' && marginBottomParam.value) {
			margins.bottom = marginBottomParam.value as string
		}
		if(marginLeftParam && marginLeftParam.type=='literal' && marginLeftParam.value) {
			margins.left = marginLeftParam.value as string
		}
		if(Object.keys(margins).length > 0) {
			const params: string[] = []
			if(margins.top) params.push('top: ' + parseStyleDoubleValue(margins.top))
			if(margins.right) params.push('right: ' + parseStyleDoubleValue(margins.right))
			if(margins.bottom) params.push('bottom: ' + parseStyleDoubleValue(margins.bottom))
			if(margins.left) params.push('left: ' + parseStyleDoubleValue(margins.left))
			const inset = `EdgeInsets.only(${params.join(', ')})`
			widget.params.push({
				class: 'param',
				name: 'margin',
				type: 'expression',
				value: inset,
				resolved: true
			})
		}
	}

	// also apply the plugin to the rest of the widget tree of this widget
	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget
}
