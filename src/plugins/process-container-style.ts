import { Param, Widget } from '../models/flutter-model';
import { applyOnDescendants, Border, findAndRemoveParam, parseBorderStyle, parseBoxShadow, parseStyleBackgroundSize, parseStyleColor, parseStyleDoubleValue, parseStyleRepeat, parseStyleUrl, parseTRBLStyle, unquote, toBorderRadiusCode, parsePropertyStyle } from '../tools';
import { Options } from '../watcher';

type Borders = { top?: Border, right?: Border, bottom?: Border, left?: Border }

export function transformWidget(widget: Widget, options: Options): Widget {

	if (widget.name == 'Container' || widget.name == 'AnimatedContainer' || widget.name == 'BoxDecoration') {
		if (!widget.params) widget.params = []

		const colorParam = findAndRemoveParam(widget, 'color')
		const backgroundColorParam = findAndRemoveParam(widget, 'backgroundColor')
		const backgroundImageParam = findAndRemoveParam(widget, 'backgroundImage')
		const backgroundRepeatParam = findAndRemoveParam(widget, 'backgroundRepeat')
		const backgroundSizeParam = findAndRemoveParam(widget, 'backgroundSize')

		const borderParam = findAndRemoveParam(widget, 'border')
		const borderTopParam = findAndRemoveParam(widget, 'borderTop')
		const borderRightParam = findAndRemoveParam(widget, 'borderRight')
		const borderBottomParam = findAndRemoveParam(widget, 'borderBottom')
		const borderLeftParam = findAndRemoveParam(widget, 'borderLeft')
		const borderWidthParam = findAndRemoveParam(widget, 'borderWidth')
		const borderStyleParam = findAndRemoveParam(widget, 'borderStyle')
		const borderColorParam = findAndRemoveParam(widget, 'borderColor')
		const borderRadiusParam = findAndRemoveParam(widget, 'borderRadius')
		const boxShadowParam = findAndRemoveParam(widget, 'boxShadow')

		const shapeParam = findAndRemoveParam(widget, 'shape')

		// border

		let borders: Borders = {}
		if (borderParam && borderParam.value) {
			const border = parseBorderStyle(borderParam.value.toString())
			borders.top = border
			borders.right = border
			borders.bottom = border
			borders.left = border
		}
		if (borderWidthParam && borderWidthParam.value) {
			const width = parseStyleDoubleValue(borderWidthParam.value.toString())
			if (borders.top) { borders.top.width = width } else borders.top = { width }
			if (borders.right) { borders.right.width = width } else borders.right = { width }
			if (borders.bottom) { borders.bottom.width = width } else borders.bottom = { width }
			if (borders.left) { borders.left.width = width } else borders.left = { width }
		}
		if (borderStyleParam && borderStyleParam.value) {
			const style = parseStyleDoubleValue(borderStyleParam.value.toString())
			if (borders.top) { borders.top.style = style } else borders.top = { style }
			if (borders.right) { borders.right.style = style } else borders.right = { style }
			if (borders.bottom) { borders.bottom.style = style } else borders.bottom = { style }
			if (borders.left) { borders.left.style = style } else borders.left = { style }
		}
		if (borderColorParam && borderColorParam.value) {
			const color = parseStyleColor(borderColorParam.value.toString())
			if (borders.top) { borders.top.color = color } else borders.top = { color }
			if (borders.right) { borders.right.color = color } else borders.right = { color }
			if (borders.bottom) { borders.bottom.color = color } else borders.bottom = { color }
			if (borders.left) { borders.left.color = color } else borders.left = { color }
		}
		if (borderTopParam && borderTopParam.value) {
			const border = parseBorderStyle(borderTopParam.value.toString())
			borders.top = border
		}
		if (borderRightParam && borderRightParam.value) {
			const border = parseBorderStyle(borderRightParam.value.toString())
			borders.right = border
		}
		if (borderBottomParam && borderBottomParam.value) {
			const border = parseBorderStyle(borderBottomParam.value.toString())
			borders.bottom = border
		}
		if (borderLeftParam && borderLeftParam.value) {
			const border = parseBorderStyle(borderLeftParam.value.toString())
			borders.left = border
		}
		let borderWidget: Widget
		if (Object.keys(borders).length > 0) {
			borderWidget = toBorderWidget(borders)
		}

		// image

		let imageWidget: Widget
		if (backgroundImageParam && backgroundImageParam.value) {
			const imgLocation = parseStyleUrl(backgroundImageParam.value.toString())
			if (imgLocation) {
				switch (imgLocation.type) {
					case 'asset': {
						imageWidget = {
							class: 'widget',
							name: options.tagClasses.backgroundAssetImg,
							constant: false,
							params: [
								{
									class: 'param',
									resolved: false,
									type: 'literal',
									value: imgLocation.url
								}
							]
						}
						break
					}
					case 'url': {
						imageWidget = {
							class: 'widget',
							name: options.tagClasses.backgroundUrlImg,
							constant: false,
							params: [
								{
									class: 'param',
									resolved: false,
									type: 'literal',
									value: imgLocation.url
								}
							]
						}
						break
					}
					case 'linear-gradient': {

					}
				}
			}
		}

		// decorationimage

		let decorationImageWidget: Widget
		if (imageWidget) {
			decorationImageWidget = {
				class: 'widget',
				name: 'DecorationImage',
				constant: false,
				params: []
			}
			if (imageWidget) decorationImageWidget.params.push({
				class: 'param',
				name: 'image',
				type: 'widget',
				resolved: false,
				value: imageWidget
			})
			if (backgroundRepeatParam && backgroundRepeatParam.value) {
				decorationImageWidget.params.push({
					class: 'param',
					name: 'repeat',
					type: 'expression',
					resolved: false,
					value: parseStyleRepeat(backgroundRepeatParam)
				})
			}
			if (backgroundSizeParam && backgroundSizeParam.value) {
				decorationImageWidget.params.push({
					class: 'param',
					name: 'fit',
					type: 'expression',
					resolved: false,
					value: parseStyleBackgroundSize(backgroundSizeParam)
				})
			}
		}

		// box decoration

		let boxDecorationWidget: Widget
		if (borderWidget || backgroundColorParam || backgroundImageParam || decorationImageWidget || shapeParam || borderRadiusParam || boxShadowParam) {
			boxDecorationWidget = {
				class: 'widget',
				name: 'BoxDecoration',
				constant: false,
				params: []
			}
			if (decorationImageWidget) boxDecorationWidget.params.push({
				class: 'param',
				name: 'image',
				resolved: false,
				type: 'widget',
				value: decorationImageWidget
			})
			if (borderWidget) boxDecorationWidget.params.push({
				class: 'param',
				name: 'border',
				type: 'widget',
				resolved: true,
				value: borderWidget
			})
			if (colorParam && colorParam.value) boxDecorationWidget.params.push({
				class: 'param',
				name: 'color',
				type: 'expression',
				value: parseStyleColor(unquote(colorParam.value.toString())),
				resolved: true
			})
			if (backgroundColorParam && backgroundColorParam.value) boxDecorationWidget.params.push({
				class: 'param',
				name: 'color',
				type: 'expression',
				value: parseStyleColor(unquote(backgroundColorParam.value.toString())),
				resolved: true
			})
			if (borderRadiusParam && borderRadiusParam.value) boxDecorationWidget.params.push({
				class: 'param',
				name: 'borderRadius',
				type: 'expression',
				value: toBorderRadiusCode(borderRadiusParam),
				resolved: true
			})
			if (shapeParam && shapeParam.value) boxDecorationWidget.params.push({
				class: 'param',
				name: 'shape',
				type: 'expression',
				value: parsePropertyStyle('BoxShape', shapeParam),
				resolved: true
			})
			if (boxShadowParam && boxShadowParam.value) {
				const values = boxShadowParam.value.toString().split(',')
				const boxShadows = values.map(value => toBoxShadow(parseBoxShadow(value)))
				boxDecorationWidget.params.push({
					class: 'param',
					name: 'boxShadow',
					type: 'array',
					value: boxShadows,
					resolved: true
				})
			}
		}

		if (boxDecorationWidget) {
			if(widget.name == 'BoxDecoration') {
				// if this widget is a box decoration, we just want to add these parameters
				for(let param of boxDecorationWidget.params) {
					widget.params.push(param)
				}
			} else {
				// add the box decoration to the widget
				widget.params.push({
					class: 'param',
					name: 'decoration',
					type: 'widget',
					resolved: true,
					value: boxDecorationWidget
				})
			}
		}

	}

	// also apply the plugin to the rest of the widget tree of this widget
	applyOnDescendants(widget, descendant => transformWidget(descendant, options))

	return widget
}

function toBorderSizeWidget(border: Border): Widget {
	const borderSideWidget: Widget = {
		class: 'widget',
		name: 'BorderSide',
		constant: false,
		params: []
	}
	if (border.width) borderSideWidget.params.push({
		class: 'param',
		name: 'width',
		resolved: true,
		type: 'expression',
		value: border.width
	})
	if (border.style) borderSideWidget.params.push({
		class: 'param',
		name: 'style',
		resolved: true,
		type: 'expression',
		value: `BorderStyle.${border.style}`
	})
	if (border.color) borderSideWidget.params.push({
		class: 'param',
		name: 'color',
		resolved: true,
		type: 'expression',
		value: border.color
	})
	return borderSideWidget
}

function toBorderWidget(borders: Borders): Widget {
	const borderWidget: Widget = {
		class: 'widget',
		name: 'Border',
		constant: false,
		params: []
	}
	if (borders.top) {
		borderWidget.params.push({
			class: 'param',
			name: 'top',
			resolved: true,
			type: 'widget',
			value: toBorderSizeWidget(borders.top)
		})
	}
	if (borders.right) {
		borderWidget.params.push({
			class: 'param',
			name: 'right',
			resolved: true,
			type: 'widget',
			value: toBorderSizeWidget(borders.right)
		})
	}
	if (borders.bottom) {
		borderWidget.params.push({
			class: 'param',
			name: 'bottom',
			resolved: true,
			type: 'widget',
			value: toBorderSizeWidget(borders.bottom)
		})
	}
	if (borders.left) {
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

function toBoxShadow(boxShadow: { color?: string, hoffset: string, voffset: string, blur?: string, spread?: string }): Widget {
	const params: Param[] = []
	params.push({
		class: 'param',
		type: 'expression',
		resolved: true,
		name: 'offset',
		value: `Offset(${boxShadow.hoffset}, ${boxShadow.voffset})`
	})
	if (boxShadow.color) {
		params.push({
			class: 'param',
			type: 'expression',
			resolved: true,
			name: 'color',
			value: boxShadow.color
		})
	}
	if (boxShadow.blur) {
		params.push({
			class: 'param',
			type: 'expression',
			resolved: true,
			name: 'blurRadius',
			value: boxShadow.blur
		})
	}
	if (boxShadow.spread) {
		params.push({
			class: 'param',
			type: 'expression',
			resolved: true,
			name: 'spreadRadius',
			value: boxShadow.spread
		})
	}
	return {
		class: 'widget',
		constant: false,
		name: 'BoxShadow',
		params: params
	}
}