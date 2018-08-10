import { camelCase } from 'change-case';
import { pull } from 'lodash';
import { Widget } from '../models/flutter-model';
import { applyOnDescendants, findAndRemoveParam, findParam } from '../tools';
import { Options } from '../watcher';

/**
 * This plugin processes the **duration** parameters.
 * 
 * It converts the a :duration-ms=10 into into :duration='Duration(milliseconds:10)'
 * 
 * It does this for:
 * - duration-secs
 * - duration-ms
 * 
 * @param widget the widget tree to process
 * @param options the flutter-view options
 * @return the transformed widget tree
 */
export function transformWidget(widget: Widget, options: Options): Widget {

	const durationMsParam = findAndRemoveParam(widget, 'durationMs')
	const durationSecParam = findAndRemoveParam(widget, 'durationSec')
	const durationSecsParam = findAndRemoveParam(widget, 'durationSecs')

	if(durationMsParam) {
		widget.params.push({
			class: 'param',
			type: 'expression',
			name: 'duration',
			resolved: true,
			value: `Duration(milliseconds: ${durationMsParam.value.toString()})`
		})
	}

	if(durationSecParam) {
		widget.params.push({
			class: 'param',
			type: 'expression',
			name: 'duration',
			resolved: true,
			value: `Duration(seconds: ${durationSecParam.value.toString()})`
		})
	}

	if(durationSecsParam) {
		widget.params.push({
			class: 'param',
			type: 'expression',
			name: 'duration',
			resolved: true,
			value: `Duration(seconds: ${durationSecsParam.value.toString()})`
		})
	}


	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget	
}
