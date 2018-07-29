import * as indent from 'indent-string';
import { pull, union } from 'lodash';
import { Param, Widget } from './flutter-model';
import { findAndRemoveParam, findParam, multiline, unquote } from './tools';
import { Options } from './watcher';

/**
 * Render the text for the .dart file, containing the dart functions to create the widgets
 * @param widgets the widgets code to render
 * @param imports imports to add to the file
 * @param options flutter-view options
 * @returns the generated dart code
 */
export function renderDartFile(widgets: Widget[], imports: string[], options: Options) : string {
	const allImports = union(options.imports, imports)
	return multiline(
		renderClassImports(allImports),
		'',
		widgets
			.map(widget=>renderWidgetFunction(widget, options))
			.join('\r\n'),
		'',
		renderHelperFunctions(options)
	)
}

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
export function renderWidgetFunction(widget: Widget, options: Options) : string | null {
	const fields = getClassFields(widget)
	const vModelParam = findParam(widget, 'vModel')
	const vModel = vModelParam ? vModelParam.value as string : null

	// find the single child to render
	const childParam = findParam(widget, 'child')
	const childrenParam = findParam(widget, 'child')
	let child: Widget
	if(childParam) {
		child = childParam.value as Widget
	} else if(childrenParam) {
		const children = childParam.value as Widget[]
		if(children.length == 0) {
			child = childrenParam.value[0] as Widget
		} else {
			child = null
		}
	} else {
		child = null
	}
	if(!child) return ''

	const built = renderWidget(child, vModel, options)

	const returnType = child.name
	if(vModel) {
		return multiline(
			'// ignore: non_constant_identifier_names',
			`${renderConstructor(widget.name, fields, vModel)} {`,
			indent(multiline(
				`final widget = ${built};`,
				`return (model != null) ?`,
				indent(multiline(
					`ScopedModel<${vModel}>(model: model, child: widget) `,
					`: widget;`
				), options.indentation)
			), options.indentation),
			`}`
		)
	} else {
		return multiline(
			'// ignore: non_constant_identifier_names',
			`${returnType} ${renderConstructor(widget.name, fields, vModel)} {`,
			indent(`return ${built};`, options.indentation),
			`}`
		)
	}
}

/**
 * Renders the constructor of the widget function
 * @param name The name of the function
 * @param fields the widget function fields to add to the constructor
 * @param vModel the optional model type
 * @returns the generated dart code
 */
function renderConstructor(name: string, fields: { name: string, value: string }[], vModel: string) : string {
	if(vModel) {
		return `${name}({ ${vModel} model, ${fields.map(f=>`@required ${f.name}`).join(', ')} })`
	} else if(fields.length > 0) {
		return `${name}({ ${fields.map(f=>`@required ${f.name}`).join(', ')} })`
	} else {
		return `${name}()`
	}
}

/**
 * The most important method, this one recursively builds the whole tree into code.
 * It will go into the parameters of the widget, extract the widgets from there, and
 * then render that code, etc. The result is the rendered code of the full widget.
 * @param widget the widget to render, including its descendants (through its parameters)
 * @param vModel the type of the model, if available
 * @param options the flutter-view options
 * @returns the generated dart code
 */
function renderWidget(widget: Widget, vModel: string, options: Options) : string {
	if(!widget) return '\n'

	// if this widget has v-model, wrap it with a ScopedModelDescendant
	const vStateParam = findParam(widget, 'vState')
	if(vStateParam) {
		pull(widget.params, vStateParam)
		// check if there is a v-model-type on the widget as well
		const vModelParam = findParam(widget, 'vModel')
		if(vModelParam) pull(widget.params, vModelParam)
		const localVModel = vModelParam ? vModelParam.value : vModel
		// if we have a type, create the wrapper
		if(localVModel) {
			return multiline(
				`ScopedModelDescendant<${localVModel}>(`,
				indent(multiline(
					`builder: (context, widget, ${vStateParam.value}) {`,
					indent(`return ${renderWidget(widget, vModel, options)};`, options.indentation),
					`}`
				), options.indentation),
				`)`
			)
		}
	}

	// if this widget is a switch, get all the cases and render only the case that resolves
	if(widget.name=='Switch') {
		const valueParam = findParam(widget, 'select')
		if(!valueParam) throw 'switch tag is missing select parameter'
		const childrenParam = findParam(widget, 'children')
		if(!childrenParam || !childrenParam.value) return 'null'
		const children = childrenParam.value as Widget[]
		const cases = children.filter(child=>findParam(child, 'vCase'))

		return multiline(
			cases.map(_case=>_renderSwitchCase(_case)).join('\n: '),
			': Container()'
		)

		function _renderSwitchCase(_case: Widget) {
			const caseParam = findAndRemoveParam(_case, 'vCase')
			return multiline(
				`(${renderParamValue(valueParam, vModel, options)}==${renderParamValue(caseParam, vModel, options)}) ?`,
				indent(renderWidget(_case, vModel, options), options.indentation)
			)
		}
	}

	if(widget.name=='Function') {
		const paramsParam = findParam(widget, 'params')
		const params = paramsParam ? paramsParam.value : ''
		const childParam = findParam(widget, 'child')
		if(!childParam || !childParam.value) return 'null'
		const child = childParam.value as Widget
		
		return multiline(
			`(${params}) {`,
			indent(`return ${renderWidget(child, vModel, options)};`, options.indentation),
			`}`
		)
	}

	// if this widget has v-if, write code that either renders the widget,
	// or that replaces it with an empty container.
	const vIfParam = findParam(widget, 'vIf')
	if(vIfParam) {
		pull(widget.params, vIfParam)
		return `${vIfParam.value} ? ${renderWidget(widget, vModel, options)} : Container()`
	}

	// if this widget has v-for, repeatedly render it
	const vForParam = findParam(widget, 'vFor')
	if(vForParam) {
		const result = parseVForExpression(vForParam.value as string)
		pull(widget.params, vForParam)
		return multiline(
			`${result.list}.map<Widget>((${result.param}) {`,
			indent(multiline(
				`return`,
				renderWidget(widget, vModel, options)+';'
			), options.indentation),
			`}).toList()`,
		)
	}

	// render the widget class with the parameters
	return multiline(
		`${widget.constant?'const ':''}${widget.name}(`,
		indent(renderParams(widget, vModel, options), options.indentation),
		`)`
	)
	
}

/**
 * Renders the parameters of a widget. Since a parameter can contain another widget,
 * this is part of the recursive process of renderWidget.
 * @param widget the widget to render the parameters for
 * @param vModel the optional model type to use
 * @param options the flutter-view options
 * @returns the generated dart code
 */
function renderParams(widget: Widget, vModel: string, options: Options) : string {
	const renderedParams : string[] = []
	const paramsToRender = widget.params ? widget.params.filter(param=>param.name!='value'&&param.name!='const') : null
	if(paramsToRender) {
		for(var param of paramsToRender) {
			if(param.name) {
				const name = unquote(param.name)
				renderedParams.push(`${name}: ${renderParamValue(param, vModel, options)}`)
			} else {
				renderedParams.push(renderParamValue(param, vModel, options))
			}
		}
	}
	return renderedParams.join(',\n')
	
}

/**
 * Renders the value of a widget parameter. Since a parameter can contain another widget,
 * this is part of the recursive process of renderWidget.
 * @param widget the widget to render the parameters for
 * @param vModel the optional model type to use
 * @param options the flutter-view options
 * @returns the generated dart code
 */
function renderParamValue(param: Param, vModel: string, options: Options) : string {
	switch(param.type) {
		case 'literal': {
			return `'${param.value}'`
		}
		case 'expression': {
			return `${param.value ? param.value.toString() : ''}`
		}
		case 'widget': {
			const value = param.value as Widget
			const _const = findParam(value, 'const') ? 'const ' : ''
			return `${_const}${renderWidget(param.value as Widget, vModel, options)}`
		}
		case 'array': {
			const widgets = param.value as Widget[]
			const values = widgets.map(widget=>`${renderWidget(widget, vModel, options)}`)
			return multiline(
				`[`,
				indent(values.join(',\n'), options.indentation),
				`]`
			)
		}
		case 'widgets': {
			const widgets = param.value as Widget[]
			const values = widgets.map(widget=>`${renderWidget(widget, vModel, options)}`)
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

/**
 * Extract the fields of the widget function from the top level widget
 * @param widget a top level widget, representing the widget function
 * @returns a list of fields
 */
function getClassFields(widget: Widget) : { name: string, value: string }[] {
	if(widget.params) {
		return widget.params
			.filter(p=>p.type=='expression')
			.map(p=>({ name: p.name, value: (p.value ? p.value.toString() : null) }))
	} else {
		return []
	}
}

/**
 * Parse the parameter passed into a v-for tag
 * @param expression the parameter passed
 * @returns the name of the iterating parameter and the name of the list being iterated
 */
function parseVForExpression(expression: string) : { param: string, list: string } {
	const regexp = /(\w+) in ([\w.]+)/g
	const match = regexp.exec(expression)
	if(match) return { param: match[1], list: match[2] }
	else throw `Invalid v-for expression: "${expression}"`
}