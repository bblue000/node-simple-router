
var http = require('http'),
	fs = require('fs'),
	router = require('./index.js').SimpleRouter.createRouter();


router.get('/login', function(req, res){
			console.log('login');
		})
	.get('/order', function(req, res, method, pathname){
			console.log('order');
			// redirect to 'login'
			router.redirect(method, '/login', req, res);       
		});
	
startServer(router);

// start server and make sure that it'll always restart
function startServer(callback) {
	http.createServer(callback).listen(80).on('error', function(e){
		console.log('error: ' + e);
		startServer(callback);
	})
	.on('close', function() {
		console.log('close');
		startServer(callback);
	});
}