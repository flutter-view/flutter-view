import { Widget } from '../models/flutter-model';
import { applyOnDescendants, findParam } from '../tools';
import { Options } from '../watcher';
import { pull } from 'lodash';


/**
 * This plugin removes empty children.
 * 
 * @param widget the widget tree to process
 * @param options the flutter-view options
 * @return the transformed widget tree
 */
export function transformWidget(widget: Widget, options: Options): Widget {

	const childrenParam = findParam(widget, 'children')
	if(childrenParam && (childrenParam.type == 'array' || childrenParam.type == 'widgets')) {
		const children = childrenParam.value as Widget[]
		if(children.length == 0) pull(widget.params, childrenParam)
	}

	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget	
}
