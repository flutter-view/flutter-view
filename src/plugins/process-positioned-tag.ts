import { Widget } from '../models/flutter-model';
import { applyOnDescendants, parseStyleDoubleValue } from '../tools';
import { Options } from '../watcher';

export function transformWidget(widget: Widget, options: Options): Widget {
	
	// convert int values in styte positions to doubles
	if(widget.name == 'Positioned') {
		for(let param of widget.params) {
			if(
				param.name == 'left' || 
				param.name == 'top' || 
				param.name == 'right' ||
				param.name == 'bottom' ||
				param.name == 'width' ||
				param.name == 'height'
			) {
				param.value = parseStyleDoubleValue(param.value.toString())
			}
		}
	}

	// also apply the plugin to the rest of the widget tree of this widget
	applyOnDescendants(widget, descendant => transformWidget(descendant, options))

	return widget
}
