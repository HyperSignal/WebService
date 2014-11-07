/**
 * @author Lucas Teske
 *  _   _                       ____  _                   _ 
 * | | | |_   _ _ __   ___ _ __/ ___|(_) __ _ _ __   __ _| |
 * | |_| | | | | '_ \ / _ \ '__\___ \| |/ _` | '_ \ / _` | |
 * |  _  | |_| | |_) |  __/ |   ___) | | (_| | | | | (_| | |
 * |_| |_|\__, | .__/ \___|_|  |____/|_|\__, |_| |_|\__,_|_|
 *       |___/|_|                      |___/               
 *  ____  _                   _ _____               _             
 * / ___|(_) __ _ _ __   __ _| |_   _| __ __ _  ___| | _____ _ __ 
 * \___ \| |/ _` | '_ \ / _` | | | || '__/ _` |/ __| |/ / _ \ '__|
 * _ __) | | (_| | | | | (_| | | | || | | (_| | (__|   <  __/ |   
 * |____/|_|\__, |_| |_|\__,_|_| |_||_|  \__,_|\___|_|\_\___|_|   
 *         |___/                                                 
 * 
 * Created by: Lucas Teske from Teske Virtual System
 * Package: com.tvs.signaltracker
 * 	Signal Mapping Project
    Copyright (C) 2012  Lucas Teske
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var _tup 		= require('./modules/theupcrypter.js');
var _man 		= require('./modules/manager.js');
var compressor 	= require('node-minify');
var fs 			= require('fs');

var apimanager = function(manager, app, config, hslog)	{
	console.log("Initializing API Manager");

	this.man 	=	manager;
	this.app 	= 	app;
	this.config	= 	config;
	this.log 	=	hslog;
	this.tup 	= 	new _tup.TheUpCrypter(config.hskey, config.hsiv, hslog);
	var _this 	= 	this;
	this.lang	=	new _man.LanguageManager(config.paths.basepath, log);
	app.get("/"							,	function(r, q) { _this.apibase(r,q); 			});
}

apimanager.prototype.__response		=	function(data, req, res, status)	{
	var _this = this;
	if(status)
		res.status(status);
	data = JSON.stringify(data);
	this.tup.ODataEncrypt(data, function(odata) {
		res.send(odata);
	});
}

apimanager.prototype.__nresponse		=	function(data, req, res, status)	{
	var _this = this;
	if(status)
		res.status(status);
	res.send(data);
}

apimanager.prototype.apibase		=	function(req, res)	{
	if(req.body.hasOwnProperty("odata"))	
		this.odata(req,res);
	else if(req.body.hasOwnProperty("method"))
		this.method(req,res);
	else if(req.body.hasOwnProperty("tile") && req.body.hasOwnProperty("operadora"))
		this.readtile(req,res);
	else if(req.body.hasOwnProperty("mode") && req.body.hasOwnProperty("operadora"))
		this.oplogo(req,res);
	else if(req.body.hasOwnProperty("jscript"))
		this.jscript(req,res);
	else if(req.body.hasOwnProperty("css"))
		this.css(req,res);
	else
		this.__response({"result":"INT_ERROR"}, req, res, 500);
}

/**
 *	Returns an Operator Logo
 **/
apimanager.prototype.oplogo			=	function(req, res)	{
	var _this 	= 	this;
	var path 	= 	this.config.paths.opspath + "/" + req.body.operadora + ".png";
	var decoy	=	this.config.paths.opspath + "/none.png";
	fs.exists(path, function(exists)	{
		if(exists)	
   			res.sendfile(path);
   		else
   			res.sendfile(decoy);
	});
}

/**
 *	Returns an Minified Javascript File
 **/
apimanager.prototype.jscript		=	function(req, res)	{
	var _this	= 	this;
	var log 	=	this.log;
	var lang 	=	req.body.hasOwnProperty("lang") ? req.body.lang : "default";
	var file 	=	this.config.paths.jspath + "/" + req.body.jscript + ".js";
	var fileOut =	this.config.cachedir + "/" + lang + "-" + req.body.jscript + ".js";
	fs.exists(file, function(exists)	{
		if(exists)
			new compressor.minify({
			    type: 'gcc',
			    fileIn: file,
			    fileOut: fileOut,
			    callback: function(err, min){
			    	if(err)	{
			    		log.e("Error minifying file "+file);
			    		_this.__nresponse("Internal Error", req, res, 500);
			    	}else{
			    		_this.lang.LangReplace(min, lang, function(text) {
			    			_this.__nresponse(text, req, res);
			    		});
			    	}
			    }
			});
		else{
			log.i("File Not Found (404): "+file);
			_this.__nresponse("404: File not found",req,res,404);
		}
	});
}

/**
 *	Returns an Minified CSS File
 **/
apimanager.prototype.css			=	function(req, res)	{
	var _this	= 	this;
	var log 	=	this.log;
	var lang 	=	req.body.hasOwnProperty("lang") ? req.body.lang : "default";
	var file 	=	this.config.paths.csspath + "/" + req.body.css + ".js";
	var fileOut =	this.config.cachedir + "/" + lang + "-" + req.body.css + ".css";

	fs.exists(file, function(exists)	{
		if(exists)
			new compressor.minify({
			    type: 'yui-css',
			    fileIn: file,
			    fileOut: fileOut,
			    callback: function(err, min){
			    	if(err)	{
			    		log.e("Error minifying file "+file);
			    		_this.__nresponse("Internal Error", req, res, 500);
			    	}else{
			    		_this.lang.LangReplace(min, lang, function(text) {
			    			_this.__nresponse(text, req, res);
			    		});
			    	}
			    }
			});
		else{
			log.i("File Not Found (404): "+file);
			_this.__nresponse("404: File not found",req,res,404);
		}
	});
}

/**
 *	Non ODATA Methods
 **/
apimanager.prototype.method			=	function(req, res)	{
	var _this 	= 	this;
	switch(req.body.method)	{
		case "antenas":
			/**
			 *	Fetch and return Antennas List in the Block
			 **/
			 //TODO
			 break;
		case "operators":
			/**
			 *	Fetch List of the Operators
			 **/
			 //TODO
			 break;
		case "operatorlist":
			/**
			 *	Fetch List of Operators with MCC/MNC
			 **/
			 //TODO
			 break;
		default:
			_this.manager.AddStatistics("apicallerror");
			_this.log.e("Internal API Call Error: "+e+"\r\tData: "+JSON.stringify(req.body));
			_this.__nresponse('{"result":"INT_ERROR"}', req, res, 500);
	}
}

/**
 *	Returns a specified Tile
 **/
apimanager.prototype.readtile		=	function(req, res)	{
	var _this 	= 	this;
	var path 	= 	this.config.paths.tilepath + "/" + req.body.operadora +"/"+ req.body.tile+ ".png";
	var decoy	=	this.config.paths.tilepath + "/blank.png";
	fs.exists(path, function(exists)	{
		if(exists)	
   			res.sendfile(path);
   		else
   			res.sendfile(decoy);
	});
}

/**
 *	ODATA Processing
 **/
apimanager.prototype.odata			=	function(req, res)	{
	var _this = this;
	this.tup.ODataDecrypt(req.body.odata, function(data) {
		if(data)	{
			try{
				var data_s = data;
				data = JSON.parse(data);
			}catch(e)	{
				var d = JSON.stringify(data);
				_this.manager.AddStatistics("apicallerror");
				_this.log.e("Internal API Call Error: "+e+"\r\tData: "+data_s);
				_this.__response({"result":"INT_ERROR"}, req, res, 500);
				return;
			}
			_this.man.AddStatistics("apicall");
			if(data.hasOwnProperty("metodo"))	{
				switch(data.metodo)	{
					case "batchaddsinal":
						/**
						 *	Add Signal List (TODO)
						 **/

						 break;
					case "addsinal":
						/**
						 *	Add Signal
						 **/
						 try {
						 	if(data.op != "")	{
						 		if(data.hasOwnProperty("mcc") && data.hasOwnProperty("mnc"))	{
						 			data.op = _this.man.FetchOperatorName(data.mcc,data.mnc);
						 			if(data.op == data.mcc + "" + data.mnc)
						 				_this.man.InsertOperatorToDB(data.mcc,data.mnc,data.op,"BLOCK_TODO");
						 		}
						 		var weight = data.hasOwnProperty("weight") ? data.weight : 1.0;
						 		var sigs = _this.man.ProcessSignal(data["lat"],data["lon"],data["sig"],data["op"], weight);

						 		if(data.hasOwnProperty("dev"))
						 			_this.man.AddDevice(data["uid"], data["dev"], data["man"], data["model"], data["brand"], data["and"], data["rel"], data["sig"]);

						 		if(data.hasOwnProperty("uid"))
						 			_this.man.IncUserKM(data["uid"], 1);

					 			_this.__response({"result":"OK"}, req, res);
					 		}
				 		}catch(e) {
					 			_this.man.AddStatistics("apicallerror");
								_this.log.e("Error Adding Signal: "+e+"\n\tData: "+data_s);
					 			_this.__response({"result":"INT_ERROR"}, req, res, 500);
				 		}
						 break;

					case "ttstoweradd":
						/**
						 *	Add Tower by TeskeTrackingSystem (DEPRECATED)
						 **/

					case "addtorre":
					 	/**
					 	 *	Add Tower (DEPRECATED)
					 	 **/
			 			_this.man.AddStatistics("apicalldeprecated");
			 			_this.__response({"result":"DEPRECATED"}, req, res, 500);
						 break;
					case "ttsadd":
						/**
						 *	Add Signal Point by TeskeTrackingSystem 
						 **/
						try{
							 if(data.op.trim() != "")	{
							 	_this.man.ProcessSignal(data["lat"],data["lon"],data["sig"],data["op"]);
			 					_this.man.AddStatistics("tts");
					 			_this.__response({"result":"OK"}, req, res);
							 }
						}catch(e)	{
				 			_this.man.AddStatistics("apicallerror");
							_this.log.e("Error Adding TTS Signal: "+e+"\n\tData: "+data_s);
				 			this.__response({"result":"INT_ERROR"}, req, res, 500);
						}
						 break;
					case "adduser":
						/**
						 *	Add an user
						 **/
						 try{
						 	_this.man.AddUser(data["username"],data["uid"],data["name"],data["email"],_SERVER["REMOTE_ADDR"],data["city"],data["country"]);
						 	_this.man.AddStatistics("adduser");
				 			_this.__response({"result":"OK"}, req, res);
						 }catch(e)	{
				 			_this.man.AddStatistics("apicallerror");
							_this.log.e("Error Adding User: "+e+"\n\tData: "+data_s);
				 			this.__response({"result":"INT_ERROR"}, req, res, 500);
						}
						 break;
					default:
						/**
						 *	Unknown API Call
						 **/
						var d = JSON.stringify(data);
						_this.manager.AddStatistics("apicallerror");
						_this.log.e("Wrong API Call: "+d);
						_this.__response({"result":"WRONG_API_CALL"}, req, res, 500);
				}
			}else{
				/**
				 *	Unknown API Call
				 **/
				var d = JSON.stringify(data);
				_this.manager.AddStatistics("apicallerror");
				_this.log.e("Wrong API Call: "+d);
				_this.__response({"result":"WRONG_API_CALL"}, req, res, 500);
			}
		}else
			_this.__response({"result":"INVALID_ODATA"}, req, res, 500);
	});
}