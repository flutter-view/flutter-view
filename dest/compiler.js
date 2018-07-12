"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const change_case_1 = require("change-case");
const styleparser = require("style-parser");
const defaultCompileOptions = {
    textClass: 'Text',
    divClass: 'Container'
};
/**
 * Compiles a parsed pug tree into Flutter Dart code
 * @param {Block} pug parsed pug code block
 * @returns {Widget} generated Dart widget tree
 */
function compile(html, options) {
    const opts = options ? Object.assign(defaultCompileOptions, options) : defaultCompileOptions;
    if (html.length === 0)
        return null;
    if (html.length > 1)
        throw 'template code should start with a single top level tag';
    return compileTag(html[0], opts);
}
exports.compile = compile;
function compileTag(tag, options) {
    if (tag.name == 'div') {
        tag.name = options.divClass;
    }
    // if(tag.name == 'text') tag.name = options.textClass
    let params = [];
    if (tag.attribs) {
        if (tag.attribs['style']) {
            const styleRules = styleparser(tag.attribs['style']);
            console.log('rules', styleRules);
            for (attr in styleRules) {
                tag.attribs[attr] = styleRules[attr];
            }
        }
        for (var attr in tag.attribs) {
            if (attr != 'slot' && attr != 'id' && attr != 'class' && attr != 'style') {
                const expression = attr.startsWith(':');
                const name = expression ? attr.substring(1) : attr;
                const value = tag.attribs[attr];
                params.push({
                    type: expression ? 'expression' : 'literal',
                    name: change_case_1.camelCase(name),
                    value: attr != value ? value : null // pug renders empty attributes as key==value
                });
            }
        }
    }
    if (tag.children) {
        // find all children and slot properties in the tag block
        let children = [];
        for (var child of tag.children) {
            switch (child.type) {
                case 'tag': {
                    let subTag = child;
                    let widget = compileTag(subTag, options);
                    let slot = subTag.attribs ? subTag.attribs['slot'] : null;
                    // if a subtag is a slot, it is actually a widget as a property
                    if (slot) {
                        params.push({
                            type: 'widget',
                            name: change_case_1.camelCase(slot),
                            value: widget
                        });
                    }
                    else {
                        children.push(widget);
                    }
                    break;
                }
                case 'text': {
                    const text = child;
                    const value = text.data.trim();
                    if (value.length !== 0) {
                        children.push({
                            name: options.textClass,
                            value: value
                        });
                    }
                }
            }
        }
        // add the child or children parameter to the widget
        if (children.length == 1) {
            params.push({
                type: 'widget',
                name: 'child',
                value: children[0]
            });
        }
        else if (children.length > 1) {
            params.push({
                type: 'widgets',
                name: 'children',
                value: children
            });
        }
    }
    return {
        name: change_case_1.upperCaseFirst(change_case_1.camelCase(tag.name)),
        params: params
    };
}
