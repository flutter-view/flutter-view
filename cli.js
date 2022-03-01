#!/usr/bin/env node
const program = require("commander");
const fs = require("fs");
const watcher = require("./dist/watcher.js");
const _ = require("lodash");

function cli() {
	program
		.version("1.1.0")
		.usage("[options] <directory ...>")
		.description(
			"Converts html and css templates into Flutter view widget code."
		)
		.option("-w, --watch", "Watch for changes")
		.option(
			"-c, --config <file>",
			"Optional config file to use",
			"flutter-view.json"
		)
		.parse(process.argv);

	// extract the directories to scan
	const dir = program.args.length > 0 ? program.args[0] : null;
	console.log("flutter-view - flutter template code generator");
	if (!dir) {
		console.log(
			"Converts html and css templates into Flutter view widget code."
		);
		console.log("Please pass a directory to scan.");
		console.log("flutter-view -h for help.");
		return;
	}
	// get the configuration
	const configFileName = program.config;

	// start the watching
	if (program.watch) console.log("watching for file changes...");
	watcher.startWatching(dir, configFileName, program.watch);
}

cli();
