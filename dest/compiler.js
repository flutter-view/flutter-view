"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Compiles a parsed pug tree into Flutter Dart code
 * @param {*} json
 * @param {*} options
 * @returns {string} generated dart code
 */
function compile(block, options) {
    if (block.type != 'Block')
        throw 'Pug code should start with a block, is this parsed pug code?';
    if (block.nodes.length === 0)
        return "";
    console.log(block.nodes.length);
    if (block.nodes.length > 1)
        throw 'Pug flutter code should start with a single top level tag';
    return compileBlock(block);
}
exports.compile = compile;
function compileBlock(block) {
    return 'block!';
}
