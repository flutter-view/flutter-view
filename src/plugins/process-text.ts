import { Widget } from '../models/flutter-model';
import { applyOnDescendants, findAndRemoveParam, unquote } from '../tools';
import { Options } from '../watcher';

export function transformWidget(widget: Widget, options: Options): Widget {

	const textTransformParam = findAndRemoveParam(widget, 'textTransform')
	
	if (textTransformParam && widget.params) {
		let transformationFunction: string
		switch(textTransformParam.value) {
			case 'lowercase': {
				transformationFunction = 'toLowerCase' 
				break;
			}
			case 'uppercase': {
				transformationFunction = 'toUpperCase'
				break;
			}
			default: {
				console.error(`text-transform value '${textTransformParam.value}' is not supported`)
				break;
			}
		}
		function applyTextTransformation(widget: Widget): Widget {
			if (widget.originalName == 'text') {
				for (let param of widget.params) {
					if (param.type == 'literal') 
						param.value = `'${param.value.toString()}'.${transformationFunction}()`
					if (param.type == 'expression') 
						param.value = `(${unquote(param.value.toString())}).${transformationFunction}()`
					param.type = 'expression'
				}
			}
			applyOnDescendants(widget, applyTextTransformation)
			return widget
		}

		if (transformationFunction) {
			applyTextTransformation(widget)
		}
	}

	applyOnDescendants(widget, descendant => transformWidget(descendant, options))

	return widget
}
