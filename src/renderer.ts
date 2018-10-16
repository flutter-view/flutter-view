import * as indent from 'indent-string';
import { pull, union, head, concat, trim } from 'lodash';
import { Param, Widget } from './models/flutter-model';
import { findAndRemoveParam, findParam, multiline, unquote, getWidgetChildren } from './tools';
import { Options } from './watcher';
import { camelCase, upperCaseFirst } from 'change-case';

/** A flutter-view parameter */
type FVParam = { 
	name: string, 
	type?: string, 
	value?: string,
	optional?: boolean
}

/**
 * Render the text for the .dart file, containing the dart functions to create the widgets
 * @param widgets the widgets code to render
 * @param imports imports to add to the file
 * @param options flutter-view options
 * @returns the generated dart code
 */
export function renderDartFile(dartFile: string, widgets: Widget[], imports: string[], options: Options) : string {
	const pugFileName = dartFile.replace('.dart', '.pug')
	const allImports = union(options.imports, imports)
	return multiline(
		renderClassImports(allImports),
		'',
		widgets
			.filter(isFlutterView)
			.map(widget=>renderFlutterView(widget, options))
			.join('\r\n\r\n'),
		renderHelperFunctions(options)
	)
	
	/**
	 * Renders as dart text a list of imports.
	 * @param imports a list of imports to render as code
	 * @returns the generated dart code
	 */
	function renderClassImports(imports: string[]) : string {
		if(!imports) return ''
		return imports.map(_import => `// ignore: unused_import\nimport '${_import}';`).join('\r\n')
	}
	
	/**
	 * Render a single widget function that builds a flutter-view widget tree
	 * @param widget the widget to render
	 * @param options flutter-view options
	 * @returns the generated dart code
	 */
	function renderFlutterView(widget: Widget, options: Options) : string | null {
		const fields = getFlutterViewParameters(widget)
		const child = head(getWidgetChildren(widget))
		let returnType = child.name
		switch(returnType) {
			case 'Slot':
			case 'Call': { returnType = 'Widget'; break }
			case 'Array': { returnType = 'List'; break }
			default: {
				const dotPosition = returnType.indexOf('.')
				if(dotPosition > 0) returnType = returnType.substr(0, dotPosition)
			}
		}
		return multiline(
			'// ignore: non_constant_identifier_names',
			`${returnType} ${renderFlutterViewConstructor(widget.name, fields)} {`,
				indent(renderFlutterViewBody(child, options), options.indentation),
			`}`
		)
	}
	
	/**
	 * Extract the flutter-view params from the top level widget
	 * @param widget a top level widget, representing the widget function
	 * @returns a list of fields
	 */
	function getFlutterViewParameters(widget: Widget) : FVParam[] {
		function toFVParam(param: Param) {
			const paramValueRegExp = /([a-z\-]+)(\[[a-zA-Z]+\])?(\?)?/g // format: appModel[AppModel]?
			const match = paramValueRegExp.exec(param.value.toString())
			return match ? { 
				name: camelCase(match[1]), 
				type: trim(match[2], '[]'),
				optional: match[3] == '?'
			} : null
		}
		if(widget.params) {
			return widget.params
				.filter(p=>p.type=='expression' && !p.resolved && p.value)
				.map(toFVParam)
				.filter(p=>p)
		} else {
			return []
		}
	}

	/**
	 * Renders the constructor of a flutter view
	 * @param name The name of the flutter view
	 * @param params the flutter view fields to add to the constructor
	 * @returns the generated dart code
	 */
	function renderFlutterViewConstructor(name: string, params: FVParam[]) : string {
		function renderParameter(param: FVParam) : string {
			const required = !param.optional ? '@required ' : ''
			const defaultValue = param.type == 'bool' ? ' = false' : ''
			const declaration = param.type ? `${param.type} ${param.name}${defaultValue}` : param.name
			return required + declaration
		}
		if(params.length > 0) {
			return `${name}({ ${params.map(param=>renderParameter(param)).join(', ')} })`
		} else {
			return `${name}()`
		}
	}

	function renderFlutterViewBody(widget: Widget, options: Options) {
		const widgetCode = renderWidget(widget, options)
		return `return ${widgetCode};`;
	}

	/**
	 * The most important method, this one recursively builds the whole tree into code.
	 * It will go into the parameters of the widget, extract the widgets from there, and
	 * then render that code, etc. The result is the rendered code of the full widget.
	 * @param widget the widget to render, including its descendants (through its parameters)
	 * @param options the flutter-view options
	 * @returns the generated dart code
	 */
	function renderWidget(widget: Widget, options: Options) : string {
		if(!widget) return '\n'
	
		if(widget.name=='Call') {
			const methodParam = findAndRemoveParam(widget, 'method', {
				includeExpressions: true,
				includeResolved: true
			})
			if(!methodParam || !methodParam.value) throw 'call tags requires a method property'
			const method = methodParam.value
			return multiline(
				`${method}(`,
				indent(renderParams(widget, options), options.indentation),
				')'
			)
		}

		if(widget.name=='Slot') {
			// if the slot has a direct value, render that value
			const valueParam = findParam(widget, undefined, true)
			if(valueParam && valueParam.value) {
				if(valueParam.type == 'expression') return valueParam.value.toString()
				if(valueParam.type == 'literal') return '"' + valueParam.value.toString() + '"'
			}
	
			// if the slot has children, render them as options, since only one gets shown at max
			const childrenParam = findParam(widget, 'children', true)
			if(!childrenParam || !childrenParam.value) return 'Container()'
			const children = childrenParam.value as Widget[]
			return multiline(
				children.map(child=>renderSlotChild(child)).join(':\n'),
				'// ignore: dead_code',
				': Container()'
			)
	
			/**
			 * render a single optional slot child
			 * @param child the child to add to the slot
			 */
			function renderSlotChild(child: Widget) {
				const ifParam = findAndRemoveParam(child, 'vIf')
				if(ifParam && ifParam.value) {
					return multiline(
						`(${ifParam.value}) ?`,
						indent(multiline(
							'// ignore: dead_code',
							renderWidget(child, options)
						), options.indentation)
					) 
				} else {
					return multiline(
						`true ?`,
						indent(multiline(
							'// ignore: dead_code',
							renderWidget(child, options)
						), options.indentation)
					) 
				}
			}
		}
	
		// if this is a function, create a Dart function which returns the child tree
		// of the function
		if(widget.name=='Function') {
			const paramsParam = findParam(widget, 'params', true)
			const params = paramsParam ? paramsParam.value : ''
			const childParam = findParam(widget, 'child', true)
			if(!childParam || !childParam.value) return 'null'
			const child = childParam.value as Widget
			
			return multiline(
				`(${params}) {`,
				indent(`return ${renderWidget(child, options)};`, options.indentation),
				`}`
			)
		}
	
		// if this widget has v-if, write code that either renders the widget,
		// or that replaces it with an empty container.
		const vIfParam = findParam(widget, 'vIf', true)
		const vForParam = findParam(widget, 'vFor', true)
		if(vIfParam) {
			pull(widget.params, vIfParam)
			const elseValue = (vForParam && vForParam.value) ? '[Container()]' : 'Container()'
			if(vIfParam.value) {
				return `${unquote(vIfParam.value.toString())} ? ${renderWidget(widget, options)} : ${elseValue}`
			} else {
				console.warn(`${widget.name} has a v-if without a condition`)
			}
		}
	
		// if this widget has v-for, repeatedly render it
		if(vForParam) {
			const result = parseVForExpression(vForParam.value.toString())
			pull(widget.params, vForParam)
			return multiline(
				(result.index)
					? multiline(
						`(${result.list} as List).asMap().entries.map((entry) {`, 
						indent(multiline(
							`final index = entry.key;`, 
							`final ${result.param} = entry.value;`
						), options.indentation)
					)
					: `(${result.list} as List).map((${result.param}) {`,
				indent(multiline(
					`return`,
					renderWidget(widget, options)+';'
				), options.indentation),
				`}).toList()`,
			)
		}
	
		const ids = findAndRemoveParam(widget, 'id', {
			includeExpressions: true,
			includeResolved: true
		})
		const classes = findAndRemoveParam(widget, 'class', {
			includeExpressions: true,
			includeResolved: true
		})
		let htmlIdentifiers = []
		if(ids && ids.value) {
			htmlIdentifiers = concat(htmlIdentifiers, ids.value.toString().split(' '))
		}
		if(classes && classes.value) {
			htmlIdentifiers = concat(htmlIdentifiers, classes.value.toString().split(' '))
		}
		let separatorComment : string
		if(htmlIdentifiers.length > 0) {
			separatorComment = htmlIdentifiers.map(name=>name.toUpperCase()).join(' / ')
		}
	
		// render the widget class with the parameters
		const genericParams = widget.generics ? `<${widget.generics.join(',')}>` : ''
		const vConstructorParam = findAndRemoveParam(widget, 'vConstructor', {
			includeExpressions: true,
			includeResolved: true
		})
		const name = vConstructorParam ? `${widget.name}.${vConstructorParam.value}` : widget.name
		let pugLineComment = ''
		if(options.showPugLineNumbers && widget.pugLine != null) {
			pugLineComment = `// project://${pugFileName}#${widget.pugLine},${widget.pugColumn}`
		}
		return multiline(
			separatorComment ? `\n//-- ${separatorComment} ----------------------------------------------------------` : null,
			`${widget.constant?'const ':''}${name}${genericParams}( ${pugLineComment}`,
			indent(renderParams(widget, options), options.indentation),
			`)`
		)
		
	}
	
	/**
	 * Renders the parameters of a widget. Since a parameter can contain another widget,
	 * this is part of the recursive process of renderWidget.
	 * @param widget the widget to render the parameters for
	 * @param options the flutter-view options
	 * @returns the generated dart code
	 */
	function renderParams(widget: Widget, options: Options) : string {
		const renderedParams : string[] = []
		const paramsToRender = widget.params ? widget.params.filter(param=>param.name!='const') : null
		if(paramsToRender) {
			for(var param of paramsToRender) {
				if(param.name) {
					const name = unquote(param.name)
					renderedParams.push(`${name}: ${renderParamValue(param, options)}`)
				} else {
					renderedParams.push(renderParamValue(param, options))
				}
			}
		}
		const trailing = (paramsToRender && paramsToRender.length > 0) ? ',' : ''
		return renderedParams.join(',\n') + trailing
	}
	
	/**
	 * Renders the value of a widget parameter. Since a parameter can contain another widget,
	 * this is part of the recursive process of renderWidget.
	 * @param widget the widget to render the parameters for
	 * @param options the flutter-view options
	 * @returns the generated dart code
	 */
	function renderParamValue(param: Param, options: Options) : string {
		switch(param.type) {
			case 'literal': {
				return `'${param.value}'`
			}
			case 'expression': {
				return `${param.value ? param.value.toString() : ''}`
			}
			case 'closure': {
				if(!param.value) return ''
				return `() { ${param.value}; }`
			}
			case 'widget': {
				const value = param.value as Widget
				const _const = findParam(value, 'const', true) ? 'const ' : ''
				return `${_const}${renderWidget(param.value as Widget, options)}`
			}
			case 'array': {
				const widgets = param.value as Widget[]
				const values = widgets.map(widget=>`${renderWidget(widget, options)}`)
				return multiline(
					`[`,
					indent(values.join(',\n'), options.indentation),
					`]`
				)
			}
			case 'widgets': {
				const widgets = param.value as Widget[]
				const values = widgets.map(widget=>`${renderWidget(widget, options)}`)
				// in v-for loops we generate arrays. these arrays may already be in an array,
				// so we will want to flatten these arrays of arrays before adding them
				return multiline(
					`__flatten([`,
					indent(values.join(',\n'), options.indentation),
					`])`
				)
			}
		}
		throw `unknown parameter type ${param.type}`
	}
	
	/**
	 * Render the helper methods for the widget, to be added to the dartfile,
	 * so we do not need to import an external lib.
	 * @param options the flutter-view options
	 * @returns the generated dart code
	 */
	function renderHelperFunctions(options: Options) : string {
		return multiline(
			'// ignore: unused_element',
			'__flatten(List list) {',
			indent(
				multiline(
					'return List<Widget>.from(list.expand((item) {',
					indent(
						'return item is Iterable ? item : [item as Widget];',
						options.indentation
					),
					'}));'
				),
				options.indentation
			),
			'}'
		)
	}

}

/**
 * Parse the parameter passed into a v-for tag
 * @param expression the parameter passed
 * @returns the name of the iterating parameter and the name of the list being iterated
 */
function parseVForExpression(expression: string) : { param: string, index?: string, list: string } {
	const regexp3params = /(\w+), (\w+)? in ([\$\(\)\w.]+)/g
	const match3 = regexp3params.exec(expression)
	if(match3) return { param: match3[1], index: match3[2], list: match3[3] }

	const regexp2params = /(\w+) in ([\$\(\)\w.]+)/g
	const match2 = regexp2params.exec(expression)
	if(match2) return { param: match2[1], list: match2[2] }

	throw `Invalid v-for expression: "${expression}"`
}

function isFlutterView(widget: Widget) {
	return !!findParam(widget, 'flutterView', true)
}
