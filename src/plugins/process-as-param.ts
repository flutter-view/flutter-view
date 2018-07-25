import { camelCase } from 'change-case';
import { pull } from 'lodash';
import { Widget } from '../flutter-model';
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

	const childrenParam = findParam(widget, 'children')
	if(childrenParam) {
		const params: { name: string, value: Widget }[] = []
		const children = childrenParam.value as Widget[]
		// we cannot remove while iterating the children, so we do this in two steps:
		// 1) find all the children to be moved, and what prop to put them 
		for(let child of children) {
			const asParam = findAndRemoveParam(child, 'as')
			if(asParam) {
				params.push({ 
					name: asParam.value.toString(), 
					value: child 
				})
			}
		}
		// 2) remove each param's widget from the children param widget, and push it as a new named parameter
		for(let param of params) {
			pull(children, param.value)
			widget.params.push({
				class: 'param',
				type: 'widget',
				name: camelCase(param.name),
				value: param.value,
				resolved: false
			})
		}
	} 

	const childParam = findParam(widget, 'child')
	if(childParam) {
		const child = childParam.value as Widget
		const asParam = findAndRemoveParam(child, 'as')
		if(asParam) {
			childParam.name = camelCase(asParam.value.toString())
		}
	}

	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget	
}
