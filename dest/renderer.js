"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const indent = require("indent-string");
function render(widget) {
    return renderWidget(widget);
}
exports.render = render;
function renderWidget(widget) {
    return `${widget.name}(
	${indent(renderParams(widget))}
)`;
}
function renderParams(widget) {
    const params = [];
    for (var param of widget.params) {
        params.push(indent(renderParam(param)));
    }
    return params.join(',\n');
}
function renderParam(param) {
    switch (typeof param.value) {
    }
    return `${param.name}`;
}
