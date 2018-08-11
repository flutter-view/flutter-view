import { Widget } from '../models/flutter-model';
import { applyOnDescendants, Border, findAndRemoveParam, parseStyleCrossAxisAlignment, parseStyleCrossAxisSize, parseStyleMainAxisAlignment, parseStyleMainAxisSize } from '../tools';
import { Options } from '../watcher';

export function transformWidget(widget: Widget, options: Options): Widget {

	const mainAxisAlignmentParam = findAndRemoveParam(widget, 'mainAxisAlignment')
	const crossAxisAlignmentParam = findAndRemoveParam(widget, 'crossAxisAlignment')
	const mainAxisSizeParam = findAndRemoveParam(widget, 'mainAxisSize')
	const crossAxisSizeParam = findAndRemoveParam(widget, 'crossAxisSize')

	// MainAxisAlignment

	if (mainAxisAlignmentParam && mainAxisAlignmentParam.value) {
		widget.params.push({
			class: 'param',
			name: 'mainAxisAlignment',
			type: 'expression',
			value: parseStyleMainAxisAlignment(mainAxisAlignmentParam.value.toString()),
			resolved: true
		})
	}

	if (crossAxisAlignmentParam && crossAxisAlignmentParam.value) {
		widget.params.push({
			class: 'param',
			name: 'crossAxisAlignment',
			type: 'expression',
			value: parseStyleCrossAxisAlignment(crossAxisAlignmentParam.value.toString()),
			resolved: true
		})
	}

	if (mainAxisSizeParam && mainAxisSizeParam.value) {
		widget.params.push({
			class: 'param',
			name: 'mainAxisSize',
			type: 'expression',
			value: parseStyleMainAxisSize(mainAxisSizeParam.value.toString()),
			resolved: true
		})
	}

	if (crossAxisSizeParam && crossAxisSizeParam.value) {
		widget.params.push({
			class: 'param',
			name: 'crossAxisSize',
			type: 'expression',
			value: parseStyleCrossAxisSize(crossAxisSizeParam.value.toString()),
			resolved: true
		})
	}

	// also apply the plugin to the rest of the widget tree of this widget
	applyOnDescendants(widget, descendant => transformWidget(descendant, options))

	return widget
}
