import { pull } from 'lodash';
import { Widget } from '../models/flutter-model';
import { applyOnDescendants, findAndRemoveParam, findParam } from '../tools';
import { Options } from '../watcher';

/**
 * This plugin processes the **as** parameters.
 * 
 * It finds all child/children widgets with the as="..." parameter, 
 * and changes any of those widgets from child(ren) to direct parameters of
 * the name in the as parameter value.
 * 
 * @param widget the widget tree to process
 * @param options the flutter-view options
 * @return the transformed widget tree
 */
export function transformWidget(widget: Widget, options: Options): Widget {

	const childrenParam = findParam(widget, 'children', true)
	if(childrenParam) {
		const params: { name: string, value: Widget }[] = []
		const children = childrenParam.value as Widget[]
		// we cannot remove while iterating the children, so we do this in two steps:
		// 1) find all the children to be removed
		for(let child of children) {
			const displayParam = findAndRemoveParam(child, 'display', {
				includeResolved: true,
				includeExpressions: true
			})
			if(displayParam && displayParam.value == 'none') {
				params.push({ 
					name: displayParam.value.toString(), 
					value: child 
				})
			}
		}
		// 2) remove each param's widget from the children param widget
		for(let param of params) {
			pull(children, param.value)
		}
	} 

	const childParam = findParam(widget, 'child', true)
	if(childParam) {
		const child = childParam.value as Widget
		const displayParam = findAndRemoveParam(child, 'display')
		if(displayParam) console.log('DISPLAY ' + displayParam)
		if(displayParam && displayParam.value == 'none') {
			findAndRemoveParam(widget, 'child', {
				includeResolved: true,
				includeExpressions: true
			})
		}
	}

	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget	
}
