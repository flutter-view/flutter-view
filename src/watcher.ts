import * as gaze from 'gaze'

gaze('dest/**/*.js', (err, watcher) => {
	console.log('watching:', watcher.watched())
	watcher.on('added', added => {
		console.log('added', added)
	})
	watcher.on('changed', update => {
		console.log('changed', update)
	})
	watcher.on('deleted', deleted => {
		console.log('deleted', deleted)
	})
})

// hello I updated!!!!