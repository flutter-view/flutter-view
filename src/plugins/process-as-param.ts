import { camelCase } from 'change-case';
import { pull } from 'lodash';
import { Widget } from '../flutter-model';
import { applyOnDescendants, findAndRemoveParam, findParam } from '../tools';
import { Options } from '../watcher';


export function transformWidget(widget: Widget, options: Options): Widget {
	const childParam = findParam(widget, 'child')
	if(childParam) {
		const child = childParam.value as Widget
		const asParam = findAndRemoveParam(child, 'as')
		if(asParam) {
			pull(widget.params, childParam)
			widget.params.push({
				class: 'param',
				type: 'widget',
				name: camelCase(asParam.value.toString()),
				value: child,
				resolved: true
			})
		}
	}

	const childrenParam = findParam(widget, 'children')
	if(childrenParam) {
		const children = childrenParam.value as Widget[]
		for(let child of children) {
			const asParam = findAndRemoveParam(child, 'as')
			if(asParam) {
				pull(children, child)
				widget.params.push({
					class: 'param',
					type: 'widget',
					name: camelCase(asParam.value.toString()),
					value: child,
					resolved: true
				})
			}
		}
	} 

	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget	
}
