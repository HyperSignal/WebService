

var apimanager = function(database, app, config)	{
	console.log("Initializing API Manager");

	this.db 	= database;
	this.app 	= app;
	this.config	= config;
	var _this 	= this;
}


apimanager.prototype.apibase		=	function(req, res)	{
	res.json({"status":"NOK","code":"NO_COMMAND","error":"No Command"});
};