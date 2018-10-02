import { Widget } from '../models/flutter-model';
import { applyOnDescendants, findParam, findAndRemoveParam, getWidgetChildren } from '../tools';
import { Options } from '../watcher';

/**
 * This plugin processes the **active** tags.
 * 
 * It replaces this:
 * 
 * assign(name='someAssignment' :value='someValueOrCalculation')
 *     child
 * 
 * With this:
 * 
 * assign(name='someAssignment' :value='someValueOrCalculation')
 *     function(as='builder' params='context, someAssignment')
 *         child
 * 
 * @param widget the widget tree to process
 * @param options the flutter-view options
 * @return the transformed widget tree
 */
export function transformWidget(widget: Widget, options: Options): Widget {
	if (widget.name=='Assign') {
		const nameParam = findParam(widget, 'name', true)
		const valueParam = findAndRemoveParam(widget, 'value', true)

		if (nameParam && valueParam) {
			valueParam.name = 'value'
			valueParam.originalName = 'value'
			widget.params.push(valueParam)
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
							value: `context, ${nameParam.value}`,
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
	}

	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))
	return widget	
}
