import { camelCase } from 'change-case';
import * as decode from 'decode-html';
import * as styleparser from 'style-parser';
import { Widget } from '../flutter-model';
import { applyOnDescendants, findAndRemoveParam } from '../tools';
import { Options } from '../watcher';

/**
 * Parses style parameters generated from CSS, and transforms them into widget parameters
 * @param widget the widget and descendants to process
 * @param options the flutter-view options
 */
export function transformWidget(widget: Widget, options: Options): Widget {
	
	findAndRemoveParam(widget, 'id')
	findAndRemoveParam(widget, 'class')	
	const styleParam = findAndRemoveParam(widget, 'style')

	if(styleParam && styleParam.value) {
		const style = styleParam.value as string
		const styleRules = styleparser(style)
		for(const attr in styleRules) {
			const expression = attr.startsWith(':')
			const name = expression ? attr.substring(1) : attr
			const value = styleRules[attr]
			widget.params.push({
				class: 'param',
				type: expression ? 'expression' : 'literal',
				name: (name=='value') ? undefined : camelCase(name),
				value: attr!=value ? decode(value) : null, // pug renders empty attributes as key==value
				resolved: false
			})
		}
	}

	// also apply the plugin to the rest of the widget tree of this widget
	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget
}
