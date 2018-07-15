import { Widget } from '../flutter-model'
import { RenderPlugin } from '../watcher'

export default class implements RenderPlugin {

	transformWidget(widget: Widget): Widget {
		console.log('convertDivs called with widget', widget)
		return widget
	}

}
