import * as indent from 'indent-string';
import { pull, union, head } from 'lodash';
import { Param, Widget } from './models/flutter-model';
import { findAndRemoveParam, findParam, multiline, unquote, getChildren } from './tools';
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
			.filter(isFlutterView)
			.map(widget=>renderFlutterView(widget, options))
			.join('\r\n'),
		widgets
			.filter(isFlutterWidget)
			.map(widget=>renderFlutterWidget(widget, options))
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
export function renderFlutterView(widget: Widget, options: Options) : string | null {
	const fields = getClassFields(widget)
	const vModelParam = findParam(widget, 'model')
	const vModel = vModelParam ? vModelParam.value as string : null

	const child = head(getChildren(widget))
	const returnType = child.name
	return multiline(
		'// ignore: non_constant_identifier_names',
		`${!vModel ? returnType+' ' : ' '}${renderFunctionConstructor(widget.name, fields, vModel)} {`,
			indent(renderBuildBody(child, vModel, options), options.indentation),
		`}`
	)
}

function renderBuildBody(widget: Widget, vModel: string | null, options: Options) {
	const widgetCode = renderWidget(widget, vModel, options)
	if(vModel) {
		return multiline(
			`final widget = ${widgetCode};`,
			`return (model != null) ?`,
			indent(multiline(
				`ScopedModel<${vModel}>(model: model, child: widget) `,
				`: widget;`
			), options.indentation)
		)
	} else {
		return `return ${widgetCode};`
	}
}

/////////

export function renderFlutterWidget(widget: Widget, options: Options) : string | null {
	const vModelParam = findAndRemoveParam(widget, 'vModel')
	const vModel = vModelParam ? vModelParam.value as string : null
	const fields = getClassFields(widget)
	if(vModel) {
		fields.push({ 
			name: 'model',
			type: vModel
		})
	}
	const child = head(getChildren(widget))

	return multiline(
		`class ${widget.name} extends StatelessWidget {`,
		indent(multiline(
			'',
			renderClassFields(fields),
			'',
			renderClassConstructor(widget.name, fields, vModel) + ';',
			'',
			multiline(
				`@override`,
				`Widget build(BuildContext context) {`,
					indent(renderBuildBody(child, vModel, options), options.indentation),
				`}`
			),
			''
		), options.indentation),
		'}'
	)
	
}

function renderClassFields(fields: { name: string, type?: string, value?: string }[]) : string {
	return fields
		.map(field=> {
			if(field.value && field.value != 'true') {
				return `final ${field.type || ''} ${field.name} = ${field.value};`
			} else {
				return `final ${field.type || ''} ${field.name};`
			}
		})
		.join('\n')
}

/////////

/**
 * Renders the constructor of the widget function
 * @param name The name of the function
 * @param fields the widget function fields to add to the constructor
 * @param vModel the optional model type
 * @returns the generated dart code
 */
function renderFunctionConstructor(name: string, fields: { name: string, type?: string, value?: string }[], vModel: string) : string {
	if(vModel) {
		return `${name}({ ${vModel} model, ${fields.map(f=>`@required ${f.name}`).join(', ')} })`
	} else if(fields.length > 0) {
		return `${name}({ ${fields.map(f=>`@required ${f.name}`).join(', ')} })`
	} else {
		return `${name}()`
	}
}

/**
 * Renders the constructor of the widget function
 * @param name The name of the function
 * @param fields the widget function fields to add to the constructor
 * @param vModel the optional model type
 * @returns the generated dart code
 */
function renderClassConstructor(name: string, fields: { name: string, type?: string, value?: string }[], vModel: string) : string {
	return `${name}({ ${fields.map(f=>`@required this.${f.name}`).join(', ')} })`
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

	if(widget.name=='Slot') {
		console.log('slot', JSON.stringify(widget, null, 3))
		const childrenParam = findParam(widget, 'children')
		console.log('slot children', childrenParam)
		if(!childrenParam || !childrenParam.value) return 'Container()'
		const children = childrenParam.value as Widget[]
		
		return multiline(
			children.map(child=>_renderSwitchCase(child)).join(':\n// ignore: dead_code\n'),
			'// ignore: dead_code',
			': Container()'
		)

		function _renderSwitchCase(child: Widget) {
			const ifParam = findAndRemoveParam(child, 'vIf')
			if(ifParam && ifParam.value) {
				return multiline(
					`(${ifParam.value}) ?`,
					indent(renderWidget(child, vModel, options), options.indentation)
				) 
			} else {
				return multiline(
					`true ?`,
					indent(renderWidget(child, vModel, options), options.indentation)
				) 
			}
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
		if(vIfParam.value) {
			return `${unquote(vIfParam.value.toString())} ? ${renderWidget(widget, vModel, options)} : Container()`
		} else {
			console.warn(`${widget.name} has a v-if without a condition`)
		}
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
	const genericParams = widget.generics ? `<${widget.generics.join(',')}>` : ''
	return multiline(
		`${widget.constant?'const ':''}${widget.name}${genericParams}(`,
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
function getClassFields(widget: Widget) : { name: string, value?: string, type?: string }[] {
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

function isFlutterView(widget: Widget) {
	return !!findParam(widget, 'flutterView')
}

function isFlutterWidget(widget: Widget) {
	return !!findParam(widget, 'flutterWidget')
}
