import { Widget } from '../models/flutter-model';
import { applyOnDescendants, unquote, parseStyleColor } from '../tools';
import { Options } from '../watcher';
import * as lodash from 'lodash'

/**
 * Takes any unresolved non-expression widget parameter that ends with "color"
 * and parses the color css value.
 */
export function transformWidget(widget: Widget, options: Options): Widget {

	if(!widget.params) return widget

	const colorParams = widget.params.filter(param=>
		param.name 
		&& param.name.toLowerCase().endsWith('color') 
		&& !param.resolved 
		&& param.type != 'expression')

	lodash.pullAll(widget.params, colorParams)

	for(let param of colorParams) {
		widget.params.push({
			class: 'param',
			name: param.name,
			type: 'expression',
			value: parseStyleColor(unquote(param.value.toString())),
			resolved: true
		})
	}
	
	applyOnDescendants(widget, descendant => transformWidget(descendant, options))

	return widget
}
