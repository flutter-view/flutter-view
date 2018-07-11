"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const indent = require("indent-string");
const defaultRenderOptions = {
    imports: [
        'package:flutter/material.dart',
        'package:flutter/cupertino.dart',
        'package:flutter_platform_widgets/flutter_platform_widgets.dart',
        'package:scoped_model/scoped_model.dart'
    ],
    textClass: 'Text',
    divClass: 'Container',
    lineNumbers: false
};
function findParam(widget, name) {
    if (!widget.params)
        return null;
    return widget.params.find(param => param.name == name);
}
function renderClass(widget, options) {
    const opts = options ? Object.assign(defaultRenderOptions, options) : defaultRenderOptions;
    const flutterParam = findParam(widget, 'flutter-widget');
    if (!flutterParam)
        return null;
    const fields = getClassFields(widget);
    const child = findParam(widget, 'child').value;
    const built = renderWidget(child, opts);
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
`;
}
exports.renderClass = renderClass;
function getClassFields(widget) {
    if (widget.params) {
        return widget.params
            .filter(p => p.type == 'expression')
            .map(p => ({ name: p.name, value: p.value.toString() }));
    }
    else {
        return [];
    }
}
function renderClassImports(imports) {
    if (!imports)
        return '';
    return imports.map(_import => `import '${_import}';`).join('\n');
}
function renderClassFields(fields) {
    return fields
        .map(field => {
        if (field.value && field.value != 'true') {
            return `final ${field.name} = ${field.value};`;
        }
        else {
            return `final ${field.name};`;
        }
    })
        .join('\n');
}
function renderConstructor(name, fields) {
    return `${name}(${fields.map(f => `this.${f.name}`).join(', ')});`;
}
// function renderMembers(widget: Widget, options: RenderOptions) : string {
// 	if(!widget.params)
// }
function renderWidget(widget, options) {
    switch (widget.name) {
        case 'text': {
            return `${options.textClass}('''${widget.value.toString()}''')`;
        }
        default: {
            return `${widget.name}(
${indent(renderParams(widget, options))}
)`;
        }
    }
}
function renderParams(widget, options) {
    const params = [];
    if (widget.params) {
        for (var param of widget.params) {
            params.push(indent(renderParam(param, options)));
        }
    }
    return params.join('\n');
}
function renderParam(param, options) {
    const name = unquote(param.name);
    switch (param.type) {
        case 'literal': {
            return `${name}: ${param.value}, ${pugRef(param, options)}`;
        }
        case 'expression': {
            return `${name}: ${unquote(param.value.toString())}, ${pugRef(param, options)}`;
        }
        case 'widget': {
            return `${name}: ${renderWidget(param.value, options)}, ${pugRef(param, options)}`;
        }
        case 'widgets': {
            const widgets = param.value;
            const values = widgets.map(widget => `${renderWidget(widget, options)}, ${pugRef(param, options)}`);
            return `${name}: [
${indent(values.join('\n'), 2)}
]`;
        }
    }
    throw `unknown parameter type ${param.type}`;
}
function pugRef(param, options) {
    if (options.lineNumbers && param.line) {
        return `/*@pug(${param.line})*/`;
    }
    else {
        return '';
    }
}
function unquote(text) {
    if (text.startsWith('"') && text.endsWith('"')) {
        return text.substring(1, text.length - 1);
    }
    if (text.startsWith("'") && text.endsWith("'")) {
        return text.substring(1, text.length - 1);
    }
    return text;
}
