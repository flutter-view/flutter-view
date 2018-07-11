import { RenderOptions } from './renderer';
import { Widget, Param } from './flutter-model';
import * as handlebar from 'handlebars'
import * as indent from 'indent-string'

export interface RenderOptions {
	imports?: string[]
	textClass?: string
	divClass?: string
	lineNumbers?: boolean
}

const defaultRenderOptions: RenderOptions = {
	imports: [
		'package:flutter/material.dart',
		'package:flutter/cupertino.dart',
		'package:flutter_platform_widgets/flutter_platform_widgets.dart',
		'package:scoped_model/scoped_model.dart'
	],
	textClass: 'Text',
	divClass: 'Container',
	lineNumbers: false
}

function findParam(widget: Widget, name: string) : Param | null {
	if(!widget.params) return null
	return widget.params.find(param => param.name==name)
}

export function renderClass(widget: Widget, options?: RenderOptions) : string | null {
	const opts = options ? Object.assign(defaultRenderOptions, options) : defaultRenderOptions
	const flutterParam = findParam(widget, 'flutter-widget')
	if(!flutterParam) return null
	const fields = getClassFields(widget)
	const child = findParam(widget, 'child').value as Widget
	const built = renderWidget(child, opts)
	return `
${renderClassImports(opts.imports)}

class ${widget.name} extends StatelessWidget {

${indent(renderClassFields(fields), 2)}

${indent(renderConstructor(widget.name, fields), 2)}

  @override
  Widget build(BuildContext context) {
    return 
${indent(built, 6)};
  }

}
`
}

function getClassFields(widget: Widget) {
	if(widget.params) {
		return widget.params
			.filter(p=>p.type=='expression')
			.map(p=>({ name: p.name, value: p.value.toString() }))
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

// function renderMembers(widget: Widget, options: RenderOptions) : string {
// 	if(!widget.params)
// }

function renderWidget(widget: Widget, options: RenderOptions) : string {
	switch(widget.name) {
		case 'text': {
return `${options.textClass}('''${widget.value.toString()}''')`
		}
		default: {
return `${widget.name}(
${indent(renderParams(widget, options))}
)`
		}
	}
}

function renderParams(widget: Widget, options: RenderOptions) : string {
	const params : string[] = []
	if(widget.params) {
		for(var param of widget.params) {
			params.push(indent(renderParam(param, options)))
		}
	}
	return params.join('\n')
}

function renderParam(param: Param, options: RenderOptions) : string {
	const name = unquote(param.name)
	switch(param.type) {
		case 'literal': {
			return `${name}: ${param.value}, ${pugRef(param, options)}`
		}
		case 'expression': {
			return `${name}: ${unquote(param.value.toString())}, ${pugRef(param, options)}`
		}
		case 'widget': {
			return `${name}: ${renderWidget(param.value as Widget, options)}, ${pugRef(param, options)}`
		}
		case 'widgets': {
			const widgets = param.value as Widget[]
			const values = widgets.map(widget=>`${renderWidget(widget, options)}, ${pugRef(param, options)}`)
return `${name}: [
${indent(values.join('\n'), 2)}
]`
		}
	}
	throw `unknown parameter type ${param.type}`
}

function pugRef(param: Param, options: RenderOptions) : string {
	if(options.lineNumbers && param.line) {
		return `/*@pug(${param.line})*/`
	} else {
		return ''
	}
}

function unquote(text: string) : string {
	if(text.startsWith('"') && text.endsWith('"')) {
		return text.substring(1, text.length-1)
	}
	if(text.startsWith("'") && text.endsWith("'")) {
		return text.substring(1, text.length-1)
	}
	return text
}
