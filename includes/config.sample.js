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
var cfg = {
	"hskey"		: 	"TESTETESTETESKEY",				//	ODATA Key
	"hsiv"		: 	"TESTETESTETESTIV",  			//	ODATA IV
	"mysql"		: 	{
		"host"	: 	"localhost",					//	MySQL Hostname
		"user"	: 	"hypersignal",					//	MySQL Username
		"pass"	: 	"hs1234",						//	MySQL Password
		"db"	: 	"hypersignal"					//	MySQL Database
	},
	"logfile"	: 	"/var/log/hypersignal.log",		//	HyperSignal Log File 
	"cachedir"	: 	"./cache/",						//	WebSite Cache
	"webserver"			: 	{
		"httpport"		: 82,						//	HyperSignal HTTP Port
		"httpsport"		: 443,						//	HyperSignal HTTPS Port
		"httpsenable"	: true,						//	HyperSignal Enable HTTPS
		"httpscert"		: "ssl/server.crt",			//	SSL Certificate File
		"httpskey"		: "ssl/server.key",			//	SSL Key File
		//"httpscabundle"	: "cabundle.pem" 		//	SSL CA Bundle File (If needed)
	}, 
	"paths"		: {
		"tilepath"		:	"/var/www/hstiles/"		//	Path to tiles folder
		"opspath"		:	"/var/www/hsops/"		//	Path to Operator Images
		"jspath"		:	"/var/www/hsjs/"		//	Path to Javascript Files
		"csspath"		:	"/var/www/hscss/"		//	Path to CSS Files
		"basepath"		:	"/var/www/hsbase/"		//	Path to Site Base
	}, 
	"replaces"	: {									//	Replace Keys for Javascript and CSS
			"SITEURL"	: 	"http://localhost/hypersignal/WebSite/", 
			"APIURL" 	: 	"http://localhost/hypersignal/WebService/" 
	},
	"cookiesecret"	: "HUEHUEHUE, GIBE COOKIE SECRET!"
};



exports = cfg;