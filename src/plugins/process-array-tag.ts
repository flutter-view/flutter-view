import { Widget } from '../models/flutter-model';
import { applyOnDescendants, findParam } from '../tools';
import { Options } from '../watcher';

/**
 * This plugin processes the **array** tags.
 * 
 * If a array tag is found, it replaces itself with its children.
 * 
 * @param widget the widget tree to process
 * @param options the flutter-view options
 * @return the transformed widget tree
 */
export function transformWidget(widget: Widget, options: Options): Widget {

	// we start looking from the perspective of the parent of the array widget,
	// so we can put the array children into this widget
	if(widget.params) {
		for(let param of widget.params) {
			if(param.type=='widget' && param.value) {
				const slot = param.value as Widget
				if(slot.name == 'Array') {
					const children = findParam(slot, 'children', true)
					if(children) {
						param.value = children.value
						param.type = 'array'
					} else {
						const child = findParam(slot, 'child', true)
						if(child) {
							param.value = child.value
							param.type = 'widget'
						}
					}
				}
			}
		}
	}

	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget	
}
