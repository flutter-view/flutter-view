import { Widget } from '../models/flutter-model';
import { applyOnDescendants, parseThemeStyle, unquote } from '../tools';
import { Options } from '../watcher';

/**
 * Transforms theme properties into literal Theme.of(context).property expressions
 * @param widget the widget and descendants to process
 * @param options the flutter-view options
 */
export function transformWidget(widget: Widget, options: Options): Widget {

	if(!widget.params) return widget

	for(let param of widget.params) {
		if(param.value && param.type == 'literal') {
			const value = param.value.toString()
			const themeStyle = parseThemeStyle(value)
			if(themeStyle) {
				param.type = 'expression'
				param.value = themeStyle
			}
		}
	}

	// also apply the plugin to the rest of the widget tree of this widget
	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget
}
