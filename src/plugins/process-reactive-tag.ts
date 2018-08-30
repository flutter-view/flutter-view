import { Widget } from '../models/flutter-model';
import { applyOnDescendants, findParam, findAndRemoveParam, getWidgetChildren } from '../tools';
import { Options } from '../watcher';

/**
 * This plugin processes the **reactive** tags.
 * 
 * It replaces this:
 * 
 * reactive(model='someModel')
 *     child
 * 
 * With this:
 * 
 * reactive-model(model='someModel')
 *     function(as='builder' params='context, model')
 *         child
 * 
 * @param widget the widget tree to process
 * @param options the flutter-view options
 * @return the transformed widget tree
 */
export function transformWidget(widget: Widget, options: Options): Widget {
	if(widget.name=='Reactive') {
		const asParam = findParam(widget, 'as', true)
		const children = getWidgetChildren(widget)
		findAndRemoveParam(widget, 'children', true)
		if(children.length > 0) {
			const functionWidget: Widget = {
				class: 'widget',
				name: 'Function',
				constant: false,
				params: [
					{
						class: 'param',
						type: 'expression',
						name: 'as',
						value: 'builder',
						resolved: false
					},
					{
						class: 'param',
						type: 'literal',
						name: 'params',
						value: 'context, model',
						resolved: true
					},
					{
						class: 'param',
						type: 'widgets',
						name: 'children',
						value: children,
						resolved: true
					}
				]
			}
			widget.name = 'ReactiveModel'
			widget.params.push({
					class: 'param',
					type: 'widget',
					name: 'child',
					resolved: true,
					value: functionWidget
			})
			if(asParam) widget.params.push(asParam)
		}
	}

	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))
	return widget	
}
