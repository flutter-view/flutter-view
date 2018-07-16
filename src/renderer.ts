import { RenderPlugin } from './watcher'
import { RenderOptions } from './renderer'
import { Widget, Param } from './flutter-model'
import * as indent from 'indent-string'
import { merge} from 'lodash'

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

export function renderClass(widget: Widget, plugins: RenderPlugin[], options: RenderOptions) : string | null {
	options = merge(defaultRenderOptions, options)
	// console.log('render options:', options)
	const indentation = indent('', options.indentation)
	const fields = getClassFields(widget)
	const child = findParam(widget, 'child').value as Widget
	const built = renderWidget(child)
	return multiline(
		'',
		renderClassImports(options.imports),
		'',
		`class ${widget.name} extends StatelessWidget {`,
		indent(multiline(
			'',
			renderClassFields(fields),
			'',
			renderConstructor(widget.name, fields),
			'',
			multiline(
				`@override`,
				`Widget build(BuildContext context) {`,
				indent(multiline(
					`return`,
					built+';',
				), options.indentation),
				`}`
			),
			''
		), options.indentation),
		'}'
	)

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
	
	function renderWidget(widget: Widget) : string {
		const renderedParams = renderParams()
		return multiline(
			`${widget.name}(`,
			indent(renderedParams, options.indentation),
			`)`
		)

		function renderParams() : string {
			const renderedParams : string[] = []
			const paramsToRender = widget.params ? widget.params.filter(param=>param.name!='value') : null
			if(paramsToRender) {
				for(var param of paramsToRender) {
					if(param.name) {
						const name = unquote(param.name)
						renderedParams.push(`${name}: ${renderParamValue()}`)
					} else {
						renderedParams.push(renderParamValue())
					}
				}
			}
			return renderedParams.join(',\n')
			
			function renderParamValue() : string {
				switch(param.type) {
					case 'literal': {
						return `'${param.value}'`
					}
					case 'expression': {
						return `${param.value ? param.value.toString() : ''}`
					}
					case 'widget': {
						const value = param.value as Widget
						// const _const = value.params ? 'const ' : ''
						const _const = ''
						return `${_const}${renderWidget(param.value as Widget)}`
					}
					case 'widgets': {
						const widgets = param.value as Widget[]
						const values = widgets.map(widget=>`${renderWidget(widget)}`)
						return multiline(
							`[`,
							indent(values.join(',\n'), options.indentation),
							`]`
						)
					}
				}
				throw `unknown parameter type ${param.type}`
			}
		}
	}
	

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
	return lines.join('\n')
}
