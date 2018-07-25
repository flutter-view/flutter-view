import { Widget } from '../flutter-model';
import { applyOnDescendants, findAndRemoveParam, parseStyleColor, unquote } from '../tools';
import { Options } from '../watcher';

export function transformWidget(widget: Widget, options: Options): Widget {

	// if(widget.name!='Container') {
	// 	console.warn('cannot apply layout styles to widget', widget.name + ', must be a container')
	// 	return widget
	// }

	
	const backgroundColorParam = findAndRemoveParam(widget, 'backgroundColor')

	//   const textStyleParams: Param[] = []

	// if(backgroundColorParam) {
	// 	textStyleParams.push({
	// 		class: 'param',
	// 		name: 'fontSize',
	// 		type: 'expression',
	// 		value: fontSizeParam.value.toString()
	// 	})
	// }

	// add the container parameters

	if(!widget.params) widget.params = []

	if(backgroundColorParam) {
		widget.params.push({
			class: 'param',
			name: 'color',
			type: 'expression',
			value: parseStyleColor(unquote(backgroundColorParam.value.toString())),
			resolved: true
		})
	}

	// also apply the plugin to the rest of the widget tree of this widget
	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget
}
