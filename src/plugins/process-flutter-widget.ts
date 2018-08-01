import { camelCase } from 'change-case';
import * as decode from 'decode-html';
import * as styleparser from 'style-parser';
import { Widget } from '../models/flutter-model';
import { applyOnDescendants, findAndRemoveParam, findParam } from '../tools';
import { Options } from '../watcher';

/**
 * Extracts the properties of flutter-widgets
 * @param widget the widget and descendants to process
 * @param options the flutter-view options
 */
export function transformWidget(widget: Widget, options: Options): Widget {
	
	const flutterWidgetParam = findParam(widget, 'flutterWidget')

	if(flutterWidgetParam) {
		const ids = []
		const classes = []

		let collector : (Widget)=>Widget
		collector = (widget: Widget) => {
			const idParam = findParam(widget, 'id')
			if(idParam && idParam.value) {
				ids.push(idParam.value)
			}
			const classParam = findParam(widget, 'class')
			if(classParam && classParam.value) {
				classes.push(classParam.value)
			}
			applyOnDescendants(widget, collector)
			return widget
		}

		applyOnDescendants(widget, collector)

		widget.params.push({
			class: 'param',
			name: '_ids',
			resolved: true,
			type: 'literal',
			value: ids
		})

		widget.params.push({
			class: 'param',
			name: '_classes',
			resolved: true,
			type: 'literal',
			value: classes
		})

		console.log('flutter ids', ids)
		console.log('flutter classes', classes)
	}
	
	return widget
}
