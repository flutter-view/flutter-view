import { camelCase } from 'change-case';
import { pull } from 'lodash';
import { Widget } from '../flutter-model';
import { applyOnDescendants, findAndRemoveParam, findParam } from '../tools';
import { Options } from '../watcher';


export function transformWidget(widget: Widget, options: Options): Widget {
	
	if(widget.name && options.multiChildClasses) {
		if(options.multiChildClasses.indexOf(widget.name) < 0) {
			const childrenParam = findParam(widget, 'children')
			if(childrenParam) {
				const children = childrenParam.value as Widget[]
				pull(widget.params, childrenParam)
				if(children.length == 0) {
					// console.log(`${widget.name} is empty`)
				} else if(children.length > 1) {
					if(options.autowrapChildren) {
						widget.params.push({
							class: 'param',
							type: 'widget',
							name: 'child',
							value: {
								class: 'widget',
								constant: false,
								name: options.autowrapChildrenClass,
								params: [
									{
										class: 'param',
										type: 'widgets',
										name: 'children',
										value: children,
										resolved: true
									}
								]
							},
							resolved: true
						})
					} else {
						throw `${widget.name} can only have a single child but has multiple children.\nWrap the children in a wrapper like "column", \nor turn on the autowrapChildren option to have it done automatically.`
					}
				} else {
					widget.params.push({
						class: 'param',
						type: 'widget',
						name: 'child',
						value: children[0],
						resolved: true
					})
				}
				pull(widget.params, childrenParam)
			}
		}

	}


	// options.multiChildClasses

	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget	
}
