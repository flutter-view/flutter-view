#!/usr/bin/env node
const program = require('commander')
const fs = require('fs')
const watcher = require('./dest/watcher.js')
const _ = require('lodash')

program
	.version('0.3.0')
	.usage('[options] <directory ...>')
	.description('Converts html and css templates into Flutter view widget code.')
	.option('-w, --watch', 'Watch for changes')
	.option('-c, --config <file>', 'Optional config file to use', 'flutter-view.json')
	.parse(process.argv)

// extract the directories to scan
const dirs = program.args.length > 0 ? program.args : null
console.log('flutter-view - flutter template code generator')
if(!dirs) {
	console.log('Converts html and css templates into Flutter view widget code.')
	console.log('Please pass a directory to scan.')
	console.log('flutter-view -h for help.')
	return
}
// get the configuration
const configFileName = program.config
let config = {}
if(fs.existsSync(configFileName)) {
	config = JSON.parse(fs.readFileSync(configFileName).toString())
}
// load any plugins
let plugins = []
if(config.plugins) {
	for(let plugin of config.plugins) {
		const pluginFn = require(plugin)
		console.log('loaded plugin', plugin)
		plugins.push(pluginFn)
	}
}
// start the watching
if(program.watch) console.log('watching for file changes...')
watcher.startWatching(dirs, config, plugins, program.watch)
