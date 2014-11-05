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
var express 		= 	require('express');
var app				= 	express();
var cookieParser 	= 	require('cookie-parser');
var bodyParser 		= 	require('body-parser');
var fs 				= 	require('fs');

var http        	=   require('http');
var https 			= 	require('https');
var httpserver  	=   http.createServer(app);

//var _db_			=	require("./models/db.js");
var _manager_		=	require("./modules/manager.js");
var tool			=	require("./modules/tool.js");
var apiman          =   require("./api.js");
//var _page_          =   require("./pagemanager.js");
var config          =   require("./includes/config.js").cfg;

var db              =   new _db_.Database(config.internals.mongodb, config);


app.use(cookieParser("secret"));
app.use(bodyParser());
app.set('view engine', 'ejs');

var log 			=	new tool.HSLogger(config.logfile);
var manager 		=	new _manager_.HSManager(config,log);
var api             =   new apiman.api(manager, app, config, log);
//var page            =   new _page_.page(db,app,config);

httpserver.listen(config.webserver.httpport);

if(config.webserver.httpsenable)	{
	var ca = [];
	if(config.webserver.hasOwnProperty("cabundle"))	{
		var chain = fs.readFileSync(config.webserver.cabundle, 'utf8');

		chain = chain.split("\n");
		var cert = [];

		for (_i = 0, _len = chain.length; _i < _len; _i++) {
			line = chain[_i];
			if (!(line.length !== 0)) {
				continue;
			}
			cert.push(line);
			if (line.match(/-END CERTIFICATE-/)) {
				ca.push(cert.join("\n"));
				cert = [];
			}
		}
	}
	httpsOptions = {
		ca: ca,
		key: fs.readFileSync(config.webserver.httpskey),
		cert: fs.readFileSync(config.webserver.httpscert)
	};
	var httpsServer = https.createServer(httpsOptions, app);

	httpsServer.listen(config.webserver.httpsport);
}