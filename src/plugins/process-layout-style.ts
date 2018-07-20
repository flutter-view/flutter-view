import { Param, Widget } from '../flutter-model';
import { findAndRemoveStyleParam, findParam, unquote } from '../tools';
import { Options } from '../watcher';
import { pull} from 'lodash';

export function transformWidget(widget: Widget, options: Options): Widget {

	// if(widget.name!='Container') {
	// 	console.warn('cannot apply layout styles to widget', widget.name + ', must be a container')
	// 	return widget
	// }

	const backgroundColorParam = findAndRemoveStyleParam(widget, 'backgroundColor')

	const update =
		backgroundColorParam
	if(!update) return widget

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
			value: unquote(backgroundColorParam.value.toString()),
			resolved: true
		})
		console.log(widget)
	}

	return widget
}
