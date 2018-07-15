#!/usr/bin/env node
const program = require('commander')
const fs = require('fs')
const watcher = require('./dest/watcher.js')
const _ = require('lodash')

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
	render: {},
	plugins: []
}
const configFileName = program.config
if(fs.existsSync(configFileName)) {
	const loadedConfig = JSON.parse(fs.readFileSync(configFileName).toString())
	config = _.merge(config, loadedConfig)
}
// load any plugins
plugins = [

]
if(config.plugins) {
	for(let plugin of config.plugins) {
		pluginFn = require(plugin)
		console.log('loading plugin ', plugin)
		plugins.push(pluginFn)
	}
}
// start the watching
watcher.startWatching(dirs, config, plugins, program.watch)
