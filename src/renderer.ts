import { RenderOptions } from './renderer';
import { Widget, Param } from './flutter-model';
import * as indent from 'indent-string'

export interface RenderOptions {
	imports?: string[]
	indentation?: number
}

const defaultRenderOptions: RenderOptions = {
	imports: [
		'package:flutter/material.dart',
		'package:flutter/cupertino.dart',
		'package:flutter_platform_widgets/flutter_platform_widgets.dart',
		'package:scoped_model/scoped_model.dart'
	],
	indentation: 2
}

function findParam(widget: Widget, name: string) : Param | null {
	if(!widget.params) return null
	return widget.params.find(param => param.name==name)
}

export function renderClass(widget: Widget, options?: RenderOptions) : string | null {
	const opts = options ? Object.assign(defaultRenderOptions, options) : defaultRenderOptions
	const flutterParam = findParam(widget, 'flutterWidget')
	if(!flutterParam) return null
	const fields = getClassFields(widget)
	const child = findParam(widget, 'child').value as Widget
	const built = renderWidget(child, opts)
	return multiline(
		renderClassImports(opts.imports),
		'',
		`class ${widget.name} extends StatelessWidget {`,
		indent(multiline(
			renderClassFields(fields),
			``,
			renderConstructor(widget.name, fields),
			``,
			multiline(
				`@override`,
				`Widget build(BuildContext context) {`,
				indent(multiline(
					`return`,
					built+';',
				), opts.indentation),
				`}`
			)
		), opts.indentation),
		'}'
	)
}

function getClassFields(widget: Widget) {
	if(widget.params) {
		return widget.params
			.filter(p=>p.type=='expression')
			.map(p=>({ name: p.name, value: p.value ? p.value.toString() : null }))
	} else {
		return []
	}
}

function renderClassImports(imports: string[]) : string {
	if(!imports) return ''
	return imports.map(_import => `import '${_import}';`).join('\n')
}

function renderClassFields(fields: { name: string, value: string }[]) : string {
	return fields
		.map(field=> {
			if(field.value && field.value != 'true') {
				return `final ${field.name} = ${field.value};`
			} else {
				return `final ${field.name};`
			}
		})
		.join('\n')
}

function renderConstructor(name: string, fields: { name: string, value: string }[]) : string {
	return `${name}(${fields.map(f=>`this.${f.name}`).join(', ')});`
}

function renderWidget(widget: Widget, options: RenderOptions) : string {
	const value = findParam(widget, 'value')
	const renderedValue = value ? renderParamValue(value, options) + ',' : null
	const renderedParams = renderParams(widget, options)
	return multiline(
		`${widget.name}(`,
		indent(
			multiline(
				renderedValue,
				renderedParams
			), 
			options.indentation
		),
		`)`
	)
}

function renderParams(widget: Widget, options: RenderOptions) : string {
	const renderedParams : string[] = []
	const paramsToRender = widget.params ? widget.params.filter(param=>param.name!='value') : null
	if(paramsToRender) {
		for(var param of paramsToRender) {
			const name = unquote(param.name)
			renderedParams.push(`${name}: ${renderParamValue(param, options)}`)
		}
	}
	return renderedParams.join(',\n')
}

function renderParamValue(param: Param, options: RenderOptions) : string {
	switch(param.type) {
		case 'literal': {
			return `'${param.value}'`
		}
		case 'expression': {
			return `${param.value ? param.value.toString() : ''}`
		}
		case 'widget': {
			return `${renderWidget(param.value as Widget, options)}`
		}
		case 'widgets': {
			const widgets = param.value as Widget[]
			const values = widgets.map(widget=>`${renderWidget(widget, options)}`)
			return multiline(
				`[`,
				indent(values.join(',\n'), options.indentation),
				`]`
			)
		}
	}
	throw `unknown parameter type ${param.type}`
}

function unquote(text: string) : string {
	if(!text) return ''
	if(text.startsWith('"') && text.endsWith('"')) {
		return text.substring(1, text.length-1)
	}
	if(text.startsWith("'") && text.endsWith("'")) {
		return text.substring(1, text.length-1)
	}
	return text
}

function multiline(...lines: string[]) : string {
	return lines.filter(line=>!!line).join('\n')
}
