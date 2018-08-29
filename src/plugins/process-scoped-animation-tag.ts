import { Widget } from '../models/flutter-model';
import { applyOnDescendants, findParam, findAndRemoveParam, getWidgetChildren } from '../tools';
import { Options } from '../watcher';

/**
 * This plugin processes the **scoped-animation** tags.
 * 
 * It replaces this:
 * 
 * scoped-animation(:duration='Duration(seconds:1)' :model-fn='model.newAnimModel' model='MyAnimModel' state='anim')
 *     child
 * 
 * With this:
 * 
 * animated-model-controller(v-type='MyAnimModel' :duration='Duration(seconds:1)' :model-fn='model.createHeightAnimModel')
 *     function(as='builder' params='anim')
 *         child
 * 
 * @param widget the widget tree to process
 * @param options the flutter-view options
 * @return the transformed widget tree
 */
export function transformWidget(widget: Widget, options: Options): Widget {
	if(widget.name=='ScopedAnimation') {
		const modelParam = findParam(widget, 'model')
		const stateParam = findParam(widget, 'state')
		const modelFnParam = findParam(widget, 'modelFn')
		const durationParam = findParam(widget, 'duration')
		const contextParam = findParam(widget, 'context')
		const widgetParam = findParam(widget, 'widget')
		const asParam = findParam(widget, 'as')
		const children = getWidgetChildren(widget)
		if(modelParam && modelFnParam && children.length > 0) {
			if(!durationParam.value) throw 'scoped-animation requires a duration'
			const model = modelParam.value.toString()
			const _modelFn = modelFnParam.value.toString()
			const _duration = durationParam.value.toString()
			const _state = stateParam ? stateParam.value : 'anim'
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
			widget.name = 'AnimatedModelController'
			widget.generics = [model]
			widget.params = [
				{
					class: 'param',
					type: 'expression',
					name: 'duration',
					resolved: false,
					value: _duration
				},
				{
					class: 'param',
					type: 'expression',
					name: 'modelFn',
					resolved: true,
					value: _modelFn
				},
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
