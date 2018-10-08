import { Widget } from '../models/flutter-model';
import { applyOnDescendants, findParam, unquote } from '../tools';
import { Options } from '../watcher';

/**
 * This plugin changes literal properties that contain "true" or "false" expressions.
 * 
 * @param widget the widget tree to process
 * @param options the flutter-view options
 * @return the transformed widget tree
 */
export function transformWidget(widget: Widget, options: Options): Widget {

	if(!widget.params) return widget

	for(let param of widget.params) {
		if(param.type=='literal' && (param.value == 'true' || param.value == 'false')) {
			param.type = 'expression'
			param.value = unquote(param.value)
			param.resolved = true
		}
	}

	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget	
}
