import { Widget } from '../models/flutter-model';
import { applyOnDescendants, findParam } from '../tools';
import { Options } from '../watcher';
import { pull } from 'lodash';


/**
 * When you set a style with just a number, treat it as a number, even
 * if it is a string.
 * 
 * @param widget the widget tree to process
 * @param options the flutter-view options
 * @return the transformed widget tree
 */
export function transformWidget(widget: Widget, options: Options): Widget {

	if(!widget.params) return widget

	for(let param of widget.params) {
		if(param.type == 'literal' && !isNaN(param.value as any)) {
			param.type = 'expression'
			param.resolved = true
		}
	}

	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget	
}
