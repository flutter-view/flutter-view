import { Widget, Param } from './flutter-model';
import * as handlebar from 'handlebars'

export function render(widget: Widget) : string {
	return template(widget)
}

const template = Handlebars.compile(`
	
`)