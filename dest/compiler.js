"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as handlebar from 'handlebars'
/**
 * Compiles a parsed pug tree into Flutter Dart code
 * @param {Block} pug parsed pug code block
 * @returns {Widget} generated Dart widget tree
 */
function compile(pug) {
    if (pug.type != 'Block')
        throw 'Pug code should start with a block, is this parsed pug code?';
    if (pug.nodes.length === 0)
        return null;
    console.log(pug.nodes.length);
    if (pug.nodes.length > 1)
        throw 'Pug flutter code should start with a single top level tag';
    return compileTag(pug.nodes[0]);
}
exports.compile = compile;
function findAttribute(tag, name) {
    if (!tag.attrs)
        return null;
    return tag.attrs.find(attr => attr.name == name);
}
function compileTag(tag) {
    let isSlotTag = tag.attrs.find(attr => attr.name == 'slot');
    if (isSlotTag)
        return null;
    let params = [];
    if (tag.attrs) {
        for (var attr of tag.attrs) {
            params.push({
                name: attr.name,
                value: attr.val
            });
        }
    }
    if (tag.block && tag.block.nodes) {
        for (var node of tag.block.nodes) {
            switch (node.type) {
                case 'Tag': {
                    if (tag.attrs.)
                        break;
                }
            }
        }
    }
    return {
        name: tag.name,
        params: params
    };
}
function compileBlock(block) {
    for (var node of block.nodes) {
        switch (node.type) {
            case 'Block':
                compileBlock(node);
                break;
            case 'Tag':
                compileTag(node);
                break;
        }
    }
    return 'block!';
}
