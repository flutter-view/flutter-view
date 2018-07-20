import { Param, Widget } from '../flutter-model';
import { findAndRemoveStyleParam, parseStyleColor, findParam, unquote } from '../tools';
import { Options, RenderPlugin } from '../watcher';
import { pull} from 'lodash';

export function transformWidget(widget: Widget, plugins: RenderPlugin[], options: Options): Widget {

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
			value: parseStyleColor(unquote(backgroundColorParam.value.toString())),
			resolved: true
		})
	}

	return widget
}
