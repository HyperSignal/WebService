var _tup = require('./modules/theupcrypter.js');

var apimanager = function(manager, app, hslog, config)	{
	console.log("Initializing API Manager");

	this.man 	=	manager;
	this.app 	= 	app;
	this.config	= 	config;
	this.log 	=	hslog;
	this.tup 	= 	new _tup.TheUpCrypter(config.hskey, config.hsiv, hslog);
	var _this 	= 	this;
}


apimanager.prototype.apibase		=	function(req, res)	{
	res.json({"status":"NOK","code":"NO_COMMAND","error":"No Command"});
};