import { Widget } from '../flutter-model';
import { applyOnDescendants, findAndRemoveParam, parseStyleColor, unquote, parseStyleDoubleValue, parseTRBLStyle, Border, parseBorderStyle } from '../tools';
import { Options } from '../watcher';

type Borders = { top?: Border, right?: Border, bottom?: Border, left?: Border }

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

		const borderParam = findAndRemoveParam(widget, 'border')
		const borderTopParam = findAndRemoveParam(widget, 'borderTop')
		const borderRightParam = findAndRemoveParam(widget, 'borderRight')
		const borderBottomParam = findAndRemoveParam(widget, 'borderBottom')
		const borderLeftParam = findAndRemoveParam(widget, 'borderLeft')
		const borderWidthParam = findAndRemoveParam(widget, 'borderWidth')
		const borderStyleParam = findAndRemoveParam(widget, 'borderStyle')
		const borderColorParam = findAndRemoveParam(widget, 'borderColor')
		const borderRadiusParam = findAndRemoveParam(widget, 'borderRadius')

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

		// border
		let borders: Borders = {}
		if(borderParam && borderParam.type=='literal' && borderParam.value) {
			const border = parseBorderStyle(borderParam.value as string)
			borders.top = border
			borders.right = border
			borders.bottom = border
			borders.left = border
		}
		if(borderWidthParam && borderWidthParam.type=='literal' && borderWidthParam.value) {
			const width = parseStyleDoubleValue(borderWidthParam.value as string)
			if(borders.top) { borders.top.width = width } else borders.top = { width }
			if(borders.right) { borders.right.width = width } else borders.right = { width }
			if(borders.bottom) { borders.bottom.width = width } else borders.bottom = { width }
			if(borders.left) { borders.left.width = width } else borders.left = { width }
		}
		if(borderStyleParam && borderStyleParam.type=='literal' && borderStyleParam.value) {
			const style = parseStyleDoubleValue(borderStyleParam.value as string)
			if(borders.top) { borders.top.style = style } else borders.top = { style }
			if(borders.right) { borders.right.style = style } else borders.right = { style }
			if(borders.bottom) { borders.bottom.style = style } else borders.bottom = { style }
			if(borders.left) { borders.left.style = style } else borders.left = { style }
		}
		if(borderColorParam && borderColorParam.type=='literal' && borderColorParam.value) {
			const color = parseStyleColor(borderColorParam.value as string)
			if(borders.top) { borders.top.color = color } else borders.top = { color }
			if(borders.right) { borders.right.color = color } else borders.right = { color }
			if(borders.bottom) { borders.bottom.color = color } else borders.bottom = { color }
			if(borders.left) { borders.left.color = color } else borders.left = { color }
		}
		if(borderTopParam && borderTopParam.type=='literal' && borderTopParam.value) {
			const border = parseBorderStyle(borderTopParam.value as string)
			borders.top = border
		}
		if(borderRightParam && borderRightParam.type=='literal' && borderRightParam.value) {
			const border = parseBorderStyle(borderRightParam.value as string)
			borders.right = border
		}
		if(borderBottomParam && borderBottomParam.type=='literal' && borderBottomParam.value) {
			const border = parseBorderStyle(borderBottomParam.value as string)
			borders.bottom = border
		}
		if(borderLeftParam && borderLeftParam.type=='literal' && borderLeftParam.value) {
			const border = parseBorderStyle(borderLeftParam.value as string)
			borders.left = border
		}
		let borderWidget: Widget
		if(Object.keys(borders).length > 0) {
			borderWidget = toBorderWidget(borders)
		}

		if(borderWidget || backgroundColorParam) {
			const boxDecorationWidget: Widget = {
				class: 'widget',
				name: 'BoxDecoration',
				constant: false,
				params: []
			}
			if(borderWidget) boxDecorationWidget.params.push({
				class: 'param',
				name: 'border',
				type: 'widget',
				resolved: true,
				value: borderWidget
			})
			if(backgroundColorParam) {
				boxDecorationWidget.params.push({
					class: 'param',
					name: 'color',
					type: 'expression',
					value: parseStyleColor(unquote(backgroundColorParam.value.toString())),
					resolved: true
				})
			}
			if(borderRadiusParam) {
				const radiusValue = parseTRBLStyle(borderRadiusParam.value.toString())
				boxDecorationWidget.params.push({
					class: 'param',
					name: 'borderRadius',
					type: 'expression',
					value: toBorderRadiusCode(borderRadiusParam.value.toString()),
					resolved: true
				})
			}
			widget.params.push({
				class: 'param',
				name: 'decoration',
				type: 'widget',
				resolved: true,
				value: boxDecorationWidget
			})
		}
		/*
		 * decoration: new BoxDecoration(
				border: new Border(
					top: new BorderSide(width: 16.0, color: Colors.lightBlue.shade50),
					bottom: new BorderSide(width: 16.0, color: Colors.lightBlue.shade900),
				),
			),
		 */
	}

	// also apply the plugin to the rest of the widget tree of this widget
	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget
}

function toBorderSizeWidget(border: Border) : Widget {
	const borderSideWidget: Widget = {
		class: 'widget',
		name: 'BorderSide',
		constant: false,
		params: []
	}
	if(border.width) borderSideWidget.params.push({
		class: 'param',
		name: 'width',
		resolved: true,
		type: 'expression',
		value: border.width
	})
	if(border.style) borderSideWidget.params.push({
		class: 'param',
		name: 'style',
		resolved: true,
		type: 'expression',
		value: `BorderStyle.${border.style}`
	})
	if(border.color) borderSideWidget.params.push({
		class: 'param',
		name: 'color',
		resolved: true,
		type: 'expression',
		value: border.color
	})
	return borderSideWidget						
}

function toBorderWidget(borders: Borders) : Widget {
	const borderWidget: Widget = {
		class: 'widget',
		name: 'Border',
		constant: false,
		params: []
	}
	if(borders.top) {
		borderWidget.params.push({
			class: 'param',
			name: 'top',
			resolved: true,
			type: 'widget',
			value: toBorderSizeWidget(borders.top)
		})
	}
	if(borders.right) {
		borderWidget.params.push({
			class: 'param',
			name: 'right',
			resolved: true,
			type: 'widget',
			value: toBorderSizeWidget(borders.right)
		})
	}
	if(borders.bottom) {
		borderWidget.params.push({
			class: 'param',
			name: 'bottom',
			resolved: true,
			type: 'widget',
			value: toBorderSizeWidget(borders.bottom)
		})
	}
	if(borders.left) {
		borderWidget.params.push({
			class: 'param',
			name: 'left',
			resolved: true,
			type: 'widget',
			value: toBorderSizeWidget(borders.left)
		})
	}
	return borderWidget
}

function toBorderRadiusCode(radius: string) : string {
	function toRadius(value: string) {
		if(parseFloat(value)) {
			return `Radius.circular(${parseStyleDoubleValue(value)})`
		} else {
			return unquote(value)
		}
	}
	const radiusValue = parseTRBLStyle(radius)
	console.log('radiuses', radiusValue)
	const params: string[] = []
	if(radiusValue.top) params.push(`topLeft: ${toRadius(radiusValue.top)}`)
	if(radiusValue.right) params.push(`topRight: ${toRadius(radiusValue.right)}`)
	if(radiusValue.bottom) params.push(`bottomRight: ${toRadius(radiusValue.bottom)}`)
	if(radiusValue.left) params.push(`bottomLeft: ${toRadius(radiusValue.left)}`)
	return `BorderRadius.only(${params.join(', ')})`
}
