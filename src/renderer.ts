import { Widget, Param } from './flutter-model';
import * as handlebar from 'handlebars'
import * as indent from 'indent-string'

export function render(widget: Widget) : string {
	return renderWidget(widget)
}

function renderWidget(widget: Widget) : string {
return `${widget.name}(
	${indent(renderParams(widget))}
)`
}

function renderParams(widget: Widget) : string {
	const params : string[] = []
	for(var param of widget.params) {
		params.push(indent(renderParam(param)))
	}
	return params.join(',\n')
}

function renderParam(param: Param) : string {
	switch(typeof param.value) {
		
	}
	return `${param.name}`
}
