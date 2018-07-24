import { camelCase } from 'change-case';
import { pull } from 'lodash';
import { Widget } from '../flutter-model';
import { applyOnDescendants, findAndRemoveParam, findParam } from '../tools';
import { Options } from '../watcher';


export function transformWidget(widget: Widget, options: Options): Widget {

	

	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget	
}
