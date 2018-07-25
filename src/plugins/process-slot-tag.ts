import { camelCase } from 'change-case';
import { pull } from 'lodash';
import { Widget } from '../flutter-model';
import { applyOnDescendants, findAndRemoveParam, findParam } from '../tools';
import { Options } from '../watcher';

/**
 * This plugin processes the **slot** tags.
 * 
 * If a slot tag is found, it replaces itself with its children.
 * 
 * @param widget the widget tree to process
 * @param options the flutter-view options
 * @return the transformed widget tree
 */
export function transformWidget(widget: Widget, options: Options): Widget {

	// we start looking from the perspective of the parent of the slot widget,
	// so we can put the slot children into this widget
	if(widget.params) {
		for(let param of widget.params) {
			if(param.type=='widget' && param.value) {
				const slot = param.value as Widget
				if(slot.name == 'Slot') {
					console.log('Found slot', slot, 'in param', param)
					const children = findParam(slot, 'children')
					if(children) {
						console.log('children', children)
						param.value = children.value
						param.type = 'widgets'
					} else {
						const child = findParam(slot, 'child')
						if(child) {
							console.log('child', children)
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
