// exports
var exp = module.exports = exports;
var parseURL = require('url').parse,
	fs = require('fs');

const METHOD_GET = 'get';
const METHOD_POST = 'post';
const METHOD_UNKNOWN = 'unknown';

const KEY_METHOD = 'method';
const KEY_ROUTE = 'route';

// public function
exp.createRouter = function() {
	var router = function(req, res) {
		parse.call(router, req, res);
	};
	configRouter.call(router);
	return router;
}

// internal implementation
// init / configure target router
function configRouter() {
	var self = this,
		methods = self.methods = {},
		get_cbs = methods[METHOD_GET] = {},
		post_cbs = methods[METHOD_POST] = {},
		
		// about unknown methods and routes
		unknowns = self.unknowns = {}
		;
		
	self.methods = methods;
	// for chained invoking
	self.get = function (path, callback) { /* callback(req, res, method, route) */
		get_cbs[path] = callback;
		return self;
	};
	
	self.post = function (path, callback) { /* callback(req, res, method, route) */
		post_cbs[path] = callback;
		return self;
	};
	
	self.unKnownMethod = function (callback) { /* callback(req, res, method, route) */
		unknowns[KEY_METHOD] = callback;
		return self;
	};
	
	// push a new configure with target method and route
	self.push = function (method, route, callback){ /* callback(req, res, method, route) */
		method = method.toLowerCase();
		var target_method_cbs = methods[method] = methods[method] || {};
		target_method_cbs[route] = callback;
		return self;
	};
	
	self.unKnownRoute = function (callback) { /* callback(req, res, method, route) */
		unknowns[KEY_ROUTE] = callback;
		return self;
	};
	
	self.redirect = function (method, route, req, res) {
		method = method.toLowerCase();
		var target_method_routes = methods[method] || {};
		var target_method_cbs = target_method_routes[route];
		if (target_method_cbs) {
			target_method_cbs(req, res, method, route);
		}
		return self;
	};
	
	self.__dispatchUnknown = function (key, req, res, others) {
		var tar = unknowns[key];
		if (tar) {
			tar(req, res, others);
		} else {
			// just end it
			res.end();
		}
	};
}

function parse(req, res) {
	var self = this;
	
	var method = req.method.toLowerCase();
	console.log('router req method = %s, url = %s ', method, req.url);
	
	var tar_method = self.methods[method];
	
	var urlData = parseURL(req.url, true, true);
	var pathname = urlData.pathname;
	var querystring = urlData.query;
		
	if (tar_method) {
		var cb_ofpath = tar_method[pathname];
		if (cb_ofpath) {
			cb_ofpath(req, res, method, pathname, querystring);
		} else {
			// no matched paths
			self.__dispatchUnknown(KEY_ROUTE, req, res, method, pathname, querystring);
		}
	} else {
		// no matched methods
		self.__dispatchUnknown(KEY_METHOD, req, res, method, pathname, querystring);
	}
}