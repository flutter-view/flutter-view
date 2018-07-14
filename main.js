#!/usr/bin/env node
const program = require('commander')
const fs = require('fs')
const watcher = require('./dest/watcher.js')

program
	.version('1.0.0')
	.usage('[options] <directory ...>')
	.description('Converts html and pug templates into Flutter widget code.')
	.option('-w, --watch', 'Watch for changes')
	.option('-c, --config <file>', 'Optional config file to use', 'watcher.json')
	.parse(process.argv)

// extract the parameters
const watch = program.watch
const dirs = program.args.length > 0 ? program.args : ['.']
// get the configuration
let config = {
	exclude: [],
	compile: {},
	render: {}
}
const configFileName = program.config
if(fs.existsSync(configFileName)) {
	config = JSON.parse(fs.readFileSync(configFileName).toString())
}
// start the watching
watcher.startWatching(dirs, config, program.watch)
