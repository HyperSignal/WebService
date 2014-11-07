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
var tool 			= 	require("./tool.js");
var mysql      		= 	require('mysql');
var queues 			= 	require('mysql-queues');
var HYPER_STEP		=	0.0005;							//	Step used on Database. 0.0005 gives us a ~100m precision
var HYPER_BRUSH		=	2;								//	Interpolation Brush Delta Size (-X,X) to (-Y,Y)
var HYPER_BRUSH_INT	=	[	
							[0.2	,0.1	,0.2	,0.1	,0.2],		//	|
							[0.1	,0.8	,0.8	,0.8	,0.1],		//	|
							[0.2	,0.8	,1		,0.8	,0.2],		//	|---- Interpolation Brush
							[0.1	,0.8	,0.8	,0.8	,0.1],		//	|
							[0.2	,0.1	,0.2	,0.1	,0.2]		//	|
						];						

/*
	WebSite Functions
*/


/**
 *	Language Manager
 **/
var LanguageManager = function(path,log)	{
	this.path = path;
	this.langdata = {};
	this.log = log;
}

/**
 *	Changes [KEY] by VALUE in text in the asked language.
 **/

LanguageManager.prototype.LangReplace =	function(text, language, cb)	{
	var _this = this;
	var log = this.log;
	language = language || "default";
	if(this.langdata.hasOwnProperty(language))	
		this.__LangReplace(text,language,cb);
	else{
		this.__LoadLanguage(text, language, function(ok)	{
			if(ok)
				_this.__LangReplace(text,language,cb);
			else
				_this.__LoadDefault(function(ok)	{
					if(ok)
						_this.__LangReplace(text,language,cb);
					else{
						log.e("ERROR: Cannot load default language file!!!");
						cb(text);
					}
				});
		});
	}
}

/**
 *	Loads specified Language File
 **/
LanguageManager.prototype.__LoadLanguage	=	function(language,cb)	{
	var log = this.log;
	var _this = this;
	langfile = this.path +"/"+ language + "/keywords.json";
	fs.exists(langfile, function(exists)	{
		if(exists)
			fs.readFile(langfile, function (err, data) {
				if(err)	{
					log.e("Error loading "+langfile+": "+err);
					cb(false);
				}else{
					try{
						var data = JSON.parse(data);
						_this.langdata[language] = data;
						log.i("Loaded Language file for "+language);
						cb(true);
					}catch(e)	{
						log.e("Error parsing Language File "+langfile+": "+e);
						cb(false);
					}
				}
			});
		else{
			log.w("Warning: Language file "+langfile+" does not exists!");
			cb(false);
		}
	});
}

/**
 *	Loads Default Language File
 **/
LanguageManager.prototype.__LoadDefault		=	function(cb)	{
	this.__LoadLanguage("default",cb);
}

/**
 *	Does an replace considering that language as already been loaded
 **/
LanguageManager.prototype.__LangReplace 	=	function(text,lang,cb)	{
	for(var i in this.langdata[language])	{
		if(this.langdata[language].hasOwnProperty(i))	{
			var re = new RegExp("\\["+i+"\\]","g");
			text = text.replace(re,this.langdata[language][i]);
		}
	}
	cb(text);
}

/**
 *	HyperSignal Functions
 **/

/**
 *	Returns HyperSignal X and Y coordinates with Latitude and Longitude Inputs
 **/
function LatLonToHyper(lat,lon)	{
	return [Math.round(Math.ceil((lon+180)/HYPER_STEP)), Math.round(Math.ceil((lat+90)/HYPER_STEP))];
}

/**
 *	Returns Latitude and Longitude for HyperSignal Coordinates
 **/
function HyperToLatLon(x,y)	{
	return [ y * HYPER_STEP - 90,  x * HYPER_STEP - 180 ];
}

/**
 *	Returns Google Tile Range for HyperSignal Coordinates
 *	(xmin, xmax, ymin, ymax)
 **/
function GetGoogleTileHSRange(z,x,y) {
	var bounds 	= 	tool.GoogleTileLatLonBounds(z,x,y)
	var b1		=	LatLonToHyper(bounds[0],bounds[1])
	var b2		=	LatLonToHyper(bounds[2],bounds[3])	
	return [ b1[0], b2[0], b1[1], b2[1] ]
}

/**
 *	Returns Google Tile (z,y,x) where HS(x,y) is
 **/
function GetGoogleTileFromHS(x,y,zoom) {
	latlon	=	HyperToLatLon(x,y)
	return tool.GoogleTile(latlon[0], latlon[1], zoom)
}

/**
 *	Filters the Operator Name
 **/
function CorrectOperator(val)	{
	return val;	//	TODO
}

/**
 * 		This is a simple version of Python HyperSignal Manager
 * 		This doesn't do the Tile Generation Stuff
 **/
var HSManager = function(config,hslog)	{
	this.conn = mysql.createConnection({
		host     : config.mysql.host,
		user     : config.mysql.username,
		password : config.mysql.password
	});
	this.log = hslog;
	this.config = config;
	queues(this.conn, DEBUG);
}

/**
 *	Connects to the Database
 **/
HSManager.prototype.ConnectDB			=	function()	{	this.log.i("Connecting to MySQL");		this.conn.connect();	}

/**
 *	Disconnects to the Database
 **/

HSManager.prototype.DisconnectDB		=	function()	{	this.log.i("Disconnecting from MySQL"); this.conn.end();		}

/**
 *	Generates a Google Tile
 **/
HSManager.prototype.GenerateGoogleTile	= 	function() 	{	this.log.e("HSManager::GenerateGoogleTile not available on NodeJS version!");	}


/**
 *	Inserts a signal point to database
 **/
HSManager.prototype.InsertToDB			= 	function(x,y,value,operator,weight,client,errcb)		{
	var log = this.log;
	weight = weight === undefined ? 1 : weight;
	client = client || this.conn;
	if(value < 32) {
		client.query(
			"INSERT INTO datamatrix VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE `value`=( ((2-?)*`value`)+(?*VALUES(`value`)))/2",
			[x,y,value,operator,weight,weight], function(err, result)	{
				if(err)	
					log.e("HSManager::InsertToDB - Failed to insert data to Database: "+err+"\n\t\tArguments: "+[x,y,value,operator,weight,weight].toString());
				if(errcb)
					errcb(err);
		});
	}
}

/**
 *	Inserts a Google Tile at Database
 **/
HSManager.prototype.InsertTileToDB		=	function(z,x,y,operator,client,errcb)	{
	var log = this.log;
	client = client || this.conn;
	client.query(
		"INSERT INTO tiles VALUES(?,?,?,?,0) ON DUPLICATE KEY UPDATE `updated`=0",
		[x,y,z,operator], function(err, result)	{
			if(err)
				log.e("HSManager::InsertTileToDB - Failed to insert data to Database: "+err+"\n\t\tArguments: "+[x,y,z,operator].toString());
			if(errcb)
				errcb(err);				
	});
}

/**
 *	Inserts an Mobile Operator to Database
 **/
HSManager.prototype.InsertOperatorToDB		=	function(mcc,mnc,name,fullname,client,errcb)	{
	fullname = fullname || "";
	var log = this.log;
	client = client || this.conn;
	client.query(
		"INSERT INTO `operators` VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE `fullname`=VALUES(`fullname`)",
		[mcc,mnc,name,fullname], function(err, result)	{
			if(err)
				log.e("HSManager::InsertOperatorToDB - Failed to insert data to Database: "+err+"\n\t\tArguments: "+[mcc,mnc,name,fullname].toString());
			if(errcb)
				errcb(err);	
	});
}

/**
 *	Increments an Statistics Value on Database
 **/
HSManager.prototype.AddStatistics			=	function(stype, count, client, errcb)	{
	var log = this.log;
	client = client || this.conn;
	count = count === undefined ? 1 : count;
	client.query(
		"INSERT INTO statistics VALUES (?,?,CURRENT_DATE()) ON DUPLICATE KEY UPDATE `count`= `count` + VALUES(`count`)",
		[stype,count], function(err, result)	{
			if(err)
				log.e("HSManager::AddStatistics - Failed to insert data to Database: "+err+"\n\t\tArguments: "+[stype,count].toString());
			if(errcb)
				errcb(err);	
	});
}

/**
 *	Processes a Recevied Signal Data
 **/
HSManager.prototype.ProcessSignal			=	function(lat,lon,value,operator,weight, cb)	{
	weight = weight === undefined ? 1 : weight;
	if (operator.trim() == "" || operator == "None" || operator == undefined || value < 0 || value > 31 )
		cb(true,0);
	var log = this.log;
	value = Math.round(value);
	var signals = [	[x,y,value,operator,weight] ];
	var xy = LatLonToHyper(lat,lon);
	var bx = HYPER_BRUSH;
	var by = HYPER_BRUSH;
	var x = xy[0] - HYPER_BRUSH / 2;
	var y = xy[1] - HYPER_BRUSH / 2;
	for(var i=0;i<HYPER_BRUSH;i++)	{
		for(var j=0;j<HYPER_BRUSH;j++)	{
			if(x > -1) {
				if(y+i > -1)
					signals.push( [x,y+i,value,operator,HYPER_BRUSH_INT[by+i][bx]*weight] );
				if(y-i > -1)
					signals.push( [x,y-i,value,operator,HYPER_BRUSH_INT[by-i][bx]*weight] );
			}
			if(y > -1) {
				if(x-j > -1)
					signals.push( [x-j,y,value,operator,HYPER_BRUSH_INT[by][bx-j]*weight] );
				if(x+j > -1)
					signals.push( [x+j,y,value,operator,HYPER_BRUSH_INT[by][bx+j]*weight] );
			}

			if( (x-j > -1) && (y+i > -1) )
				signals.push( [x-j,y+i,value,operator,HYPER_BRUSH_INT[by+i][bx-j]] );

			if( (y-i > -1) && (x+j > -1) )
				signals.push( [x+j,y-i,value,operator,HYPER_BRUSH_INT[by-i][bx+j]] );

			if( (x-j > -1) && (y-i > -1) )
				signals.push( [x-j,y-i,value,operator,HYPER_BRUSH_INT[by-i][bx-j]] );

			if( (x+j > -1) && (y+i > -1) )
				signals.push( [x+j,y+i,value,operator,HYPER_BRUSH_INT[by+i][bx+j]] );
		}
	}
	var hb = HYPER_BRUSH*2+1;
	var tiles = [];
	for(var zoom=HYPER_ZOOM_RANGE[0];zoom<this.config.HYPER_ZOOM_RANGE[1];zoom++)	{
		for(var i=0;i<hb;i++)	{
			tiles.push(GetGoogleTileFromHS(x+i,y,zoom));
			tiles.push(GetGoogleTileFromHS(x-i,y,zoom));

			tiles.push(GetGoogleTileFromHS(x,y+i,zoom));
			tiles.push(GetGoogleTileFromHS(x,y-i,zoom));

			tiles.push(GetGoogleTileFromHS(x+i,y-i,zoom));
			tiles.push(GetGoogleTileFromHS(x-i,y+i,zoom));
		}		
	}

	var trans = client.startTransaction();

	function error(err) {
	    if(err && trans.rollback) {
	    	trans.rollback(); 
	    	log.e("HSManager::ProcessSignal - Error doing ProcessSignal Transaction: "+err);
	    }
	}

	for(var i in signals)	{
		var signal = signals[i];
		this.InsertToDB(signal[0],signal[1],signal[2],signal[3],signal[4],trans,error);
	}

	for(var i in tiles)	{
		var z = tiles[i][0];
		var x = tiles[i][1];
		var y = tiles[i][2];
		this.InsertTileToDB(z,x,y,operator,trans,error);
	}
	this.AddStatistics("signal",signals.length);
	this.AddStatistics("abssignal", 1);
	trans.commit(function(err, info)	{
	    if(err) {
	    	log.e("HSManager::ProcessSignal - Error commiting ProcessSignal Transaction: "+err);
	    	cb(false,0,err);
	    }else
	    	cb(true,signals.length);
	    
	    log.d("HSManager::ProcessSignal Transaction Info: "+info);
	});
}

/**
 *	Adds an user to database
 **/
HSManager.prototype.AddUser 				=	function(username,uid,name,email,lastip,city,country,client,errcb)	{
	var log = this.log;
	client = client || this.conn;
	count = count === undefined ? 1 : count;
	client.query(
		"INSERT INTO `users`(`uid`,`username`,`name`,`email`,`date`,`lastip`,`sentkm`,`city`,`country`,`lastaccess`) VALUES(?, ?, ?, ?, CURDATE(), ?, 0, ?, ?, NOW()) ON DUPLICATE KEY UPDATE `uid`=`uid`, `username`= VALUES(`username`), `name` = VALUES(`name`), `email` = VALUES(`email`), `date` = `date`, `lastip` = VALUES(`lastip`), `sentkm` = `sentkm`, `city` = VALUES(`city`), `country` = VALUES(`country`), `lastaccess` = NOW()",
		[uid,username,name,email,lastip,city,country], function(err, result)	{
			if(err)
				log.e("HSManager::AddStatistics - Failed to insert data to Database: "+err+"\n\t\tArguments: "+[username,uid,name,email,lastip,city,country].toString());
			if(errcb)
				errcb(err);	
	});	
}

/**
 *	Increments User Sent kilometer Data
 **/
HSManager.prototype.IncUserKM 				=	function(uid,val,client,errcb)	{
	var log = this.log;
	client = client || this.conn;
	val = val === undefined ? 0.1 : val;
	client.query(
		"UPDATE `users` SET `sentkm` = `sentkm` + ? WHERE `uid` = ?",
		[val,uid], function(err, result)	{
			if(err)
				log.e("HSManager::IncUserKM - Failed to insert data to Database: "+err+"\n\t\tArguments: "+[val,uid].toString());
			if(errcb)
				errcb(err);	
	});	
}

/**
 *	Inserts an Antenna to Database
 **/
HSManager.prototype.AddAntenna 				=	function(lat,lon,operator,client,errcb)	{
	operator = OperatorCorrect(operator)
	var log = this.log;
	client = client || this.conn;
	client.query(
		"INSERT INTO `antennas` VALUES(?,?,?) ON DUPLICATE KEY UPDATE `lat`=`lat`",
		[lat,lon,operator], function(err, result)	{
			if(err)
				log.e("HSManager::AddAntenna - Failed to insert data to Database: "+err+"\n\t\tArguments: "+[lat,lon,operator].toString());
			if(errcb)
				errcb(err);	
	});	
	this.AddStatistics("tower");
}

/**
 *	Inserts an Device to Database
 **/
HSManager.prototype.AddDevice 				=	function(uid, device, manufacturer, model, brand, android, release, signal,client,errcb)	{
	var log = this.log;
	client = client || this.conn;
	client.query(
		"INSERT INTO `devices` VALUES(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE `signal` = (VALUES(`signal`) + `signal`) / 2",
		[uid, device, manufacturer, model, brand, android, release, signal], function(err, result)	{
			if(err)
				log.e("HSManager::AddDevice- Failed to insert data to Database: "+err+"\n\t\tArguments: "+[uid, device, manufacturer, model, brand, android, release, signal].toString());
			if(errcb)
				errcb(err);	
	});	
}

/**
 *	Fetch Antennas from Database
 **/
HSManager.prototype.FetchAntennas 			=	function(minlat,minlon,maxlat,maxlon,operator,client,cb)	{
	var log = this.log;
	client = client || this.conn;
	client.query(
		"SELECT * FROM antennas	WHERE `lat` >= ? and `lon` >= ? and `lat` < ? and `lon` < ? and `operator` = ?",
		[minlat,minlon,maxlat,maxlon,operator], function(err, rows, fields)	{
			if(err)	{
				log.e("HSManager::FetchAntennas- Failed to retrieve Antennas from Database: "+err+"\n\t\tArguments: "+[minlat,minlon,maxlat,maxlon,operator].toString());
				cb(err);
			}else if(cb) 
				cb(err, rows);
	});	
}

/**
 *	Fetch Operators from Database
 **/
HSManager.prototype.FetchOperators 				=	function(client,errcb)	{
	var log = this.log;
	client = client || this.conn;
	client.query(
		"SELECT `operator` FROM `tiles` GROUP BY `operator`", [], function(err, rows, fields)	{
			if(err)	{
				log.e("HSManager::FetchOperators - Failed to retrieve Operators from Database: "+err);
				cb(err);
			}else if(cb) {
				var ops = [];
				for(var i in rows)
					ops.push(rows[i].operator);
				cb(err, ops);
			}
	});	
}

/**
 *	Fetch Statistics of the Day
 **/
HSManager.prototype.FetchDayStatistics 			=	function(client,errcb)	{
	var log = this.log;
	client = client || this.conn;
	client.query(
		"SELECT * FROM `statistics` WHERE `date` = CURDATE()", [], function(err, rows, fields)	{
			if(err)	{
				log.e("HSManager::FetchDayStatistics - Failed to retrieve Operators from Database: "+err);
				cb(err);
			}else if(cb) {
				var statistics = {};
				for(var i in rows)
					statistics[rows[i].type] = rows[i].count;
				cb(err, statistics);
			}
	});	
}

/**
 *	Fetch Number of Operators
 **/
HSManager.prototype.FetchNumOperators 			=	function(client,errcb)	{
	self.cursor = self.con.cursor()
	self.cursor.execute("")
	row		=	self.cursor.fetchone()
	numops = int(row[0])
	return numops

	var log = this.log;
	client = client || this.conn;
	client.query(
		"SELECT COUNT(*) as `opcount` FROM (SELECT `operator` FROM `tiles` GROUP BY `operator`) tbl1 ", [], function(err, rows, fields)	{
			if(err)	{
				log.e("HSManager::FetchDayStatistics - Failed to retrieve Operators from Database: "+err);
				cb(err);
			}else if(cb) 
				cb(err, rows[0].opcount);

	});	
}

/*

TODO

HSManager.prototype.FetchNumTiles 				=	function(self,client,errcb):
	self.cursor = self.con.cursor()
	self.cursor.execute("SELECT COUNT(*) FROM `tiles`")
	row		=	self.cursor.fetchone()
	numtiles = int(row[0])
	return numtiles
	
HSManager.prototype.FetchTilesToDo 				=	function(self,operator,alltiles=False,client,errcb):
	self.cursor = self.con.cursor()
	if alltiles:
		self.cursor.execute("SELECT * FROM `tiles` WHERE `operator` = %s", (operator))
	else:
		self.cursor.execute("SELECT * FROM `tiles` WHERE `operator` = %s and `updated` = 0", (operator))

	row		=	self.cursor.fetchone()
	tiles	=	{}

	for zoom in range(config.HYPER_ZOOM_RANGE[0],config.HYPER_ZOOM_RANGE[1]):
		tiles[zoom] = []
	numtiles	=	0

	while row is not None:
		tiles[row[2]].append( (row[2],row[0],row[1],row[3]) )
		row = self.cursor.fetchone()
		numtiles	=	numtiles + 1

	return tiles,numtiles

HSManager.prototype.FetchOperatorName 			=	function(self,mcc,mnc,client,errcb):
	self.cursor = self.con.cursor()
	self.cursor.execute("SELECT * FROM `operators`	WHERE `mcc` = %s and `mnc` = %s", (mcc,mnc))
	row		=	self.cursor.fetchone()
	if row != None:
		return row[2].decode("ISO-8859-1").encode("UTF-8")
	else:
		return str(mcc)+str(mnc)

HSManager.prototype.FetchOperatorList 			=	function(self,client,errcb):
	self.cursor = self.con.cursor()
	self.cursor.execute("SELECT * FROM `operators`")
	data = self.cursor.fetchall()
	newdata = []
	for i in range(len(data)):
		newdata.append((data[i][0],data[i][1],data[i][2],data[i][3].decode("ISO-8859-1").encode("UTF-8")))
	return newdata

HSManager.prototype.RemoveTileToDo 				=	function(self, z, x, y, operator,client,errcb):
	self.cursor = self.con.cursor()
	self.cursor.execute("UPDATE tiles SET `updated` = 1 WHERE x = %s and y = %s and z = %s and operator = %s", (x,y,z,operator))

HSManager.prototype.FetchBlock 					=	function(self,start,end,operator,client,errcb):
	self.cursor = self.con.cursor()
	self.cursor.execute("SELECT * FROM datamatrix WHERE x >= %s and x < %s and y >= %s and y < %s and operator = %s",(start[0],end[0],start[1],end[1],operator))
	blockdata = self.cursor.fetchall()
	block = numpy.zeros((end[0]-start[0],end[1]-start[1]),dtype=numpy.uint8)
	block.fill(-1)
	for data in blockdata:
		x			=	int(data[0]) - start[0]
		y			=	int(data[1]) - start[1]
		sig			=	int(data[2])
		block[x,y]	=	sig
	return block
*/

exports.HSManager 				= 	HSManager;
exports.LanguageManager 		= 	LanguageManager;
exports.LatLonToHyper 			= 	LatLonToHyper;
exports.HyperToLatLon 			= 	HyperToLatLon;
exports.GetGoogleTileHSRange 	= 	GetGoogleTileHSRange;
exports.GetGoogleTileFromHS 	= 	GetGoogleTileFromHS;
exports.CorrectOperator 		= 	CorrectOperator;
