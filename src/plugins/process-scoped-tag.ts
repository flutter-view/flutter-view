import { Widget } from '../models/flutter-model';
import { applyOnDescendants, findParam, findAndRemoveParam, getWidgetChildren } from '../tools';
import { Options } from '../watcher';

/**
 * This plugin processes the **scoped** tags.
 * 
 * It replaces this:
 * 
 * scoped(model='MyModel' state='app')
 *     child
 * 
 * With this:
 * 
 * scoped-model-descendant(type='MyModel')
 *     function(as='builder' params='context, widget, app')
 *         child
 * 
 * @param widget the widget tree to process
 * @param options the flutter-view options
 * @return the transformed widget tree
 */
export function transformWidget(widget: Widget, options: Options): Widget {
	if(widget.name=='Scoped') {
		const modelParam = findParam(widget, 'model', true)
		const stateParam = findParam(widget, 'state', true)
		const contextParam = findParam(widget, 'context', true)
		const widgetParam = findParam(widget, 'widget', true)
		const asParam = findParam(widget, 'as', true)
		const children = getWidgetChildren(widget)
		if(modelParam && children.length > 0) {
			const model = modelParam.value.toString()
			const _state = stateParam ? stateParam.value : 'model'
			const _context = contextParam ? contextParam.value : 'context'
			const _widget = widgetParam ? widgetParam.value : 'widget'
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
						value: `${_context}, ${_widget}, ${_state}`,
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
			widget.name = 'ScopedModelDescendant'
			widget.generics = [model]
			widget.params = [
				{
					class: 'param',
					type: 'widget',
					name: 'child',
					resolved: true,
					value: functionWidget
				}
			]
			if(asParam) widget.params.push(asParam)
		}
	}

	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))
	return widget	
}
