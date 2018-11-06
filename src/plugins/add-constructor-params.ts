import { Widget } from '../models/flutter-model';
import { applyOnDescendants, findParam } from '../tools';
import { camelCase, upperCaseFirst } from 'change-case';
import { Options } from '../watcher';
import { pull } from 'lodash';


/**
 * This plugin looks for widgets from tags like foo:bar, and interprets the :bar
 * part as meaning the constructor function of foo. It will remove the :bar part
 * from the tag and add a constructor parameter to the widget.
 * 
 * @param widget the widget tree to process
 * @param options the flutter-view options
 * @return the transformed widget tree
 */
export function transformWidget(widget: Widget, options: Options): Widget {
	if(widget.originalName) {
		const split = widget.originalName.split(':')
		if(split.length == 2) {
			widget.name = upperCaseFirst(split[0])
			if(!widget.params) widget.params = []
			widget.params.push({
				class: 'param',
				type: 'literal',
				name: 'constructor',
				value: split[1],
				resolved: true
			})
		}
	}

	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget	
}
