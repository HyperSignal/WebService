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
var crypto 	= 	require('crypto');
var zlib 	= 	require('zlib');

function TheUpCrypter(key, iv, log)	{
	this.iv = iv;
	this.key = key;
	this.log = log;
}

/**
 *	Encrypts an String to OData
 **/
TheUpCrypter.prototype.ODataEncrypt	=	function(string, cb)	{
	var log = this.log;
	encdata		=	this.__Encrypt(new Buffer(string));
	this.__Compress(encdata, function(err, buffer) {
		if(err)	
			log.e("Error compressing string: "+err);
		cb(buffer.toString('base64'));
	});
}

/**
 *	Decrypts an OData to String
 **/
TheUpCrypter.prototype.ODataDecrypt = 	function(string, cb)	{
	var log = this.log;
	var _this = this;
	data		=	new Buffer(string, 'base64');
	this.__UnCompress(data, function(err, buffer) {
		if(err)		{
			log.e("Error uncompressing string: "+err);
			cb(false);
		}else
			cb(_this.__Decrypt(buffer).toString().split("\x00")[0]);
	});
}

/**
 *	Compresses an string to GZip
 **/
TheUpCrypter.prototype.__Compress 	=	function(string, cb)	{
	zlib.deflate(string, cb);
}

/**
 *	Decompresses an GZip to String
 **/
TheUpCrypter.prototype.__UnCompress	=	function(string, cb)	{
	zlib.inflate(string, cb);
}

/**
 *	Encrypts string using AES-RIJNDAEL-128 CBC
 **/
TheUpCrypter.prototype.__Encrypt 	=	function(string)	{
	try{
		var cipher = crypto.createCipheriv("aes-128-cbc", this.key, this.iv);
		cipher.setAutoPadding(false);
		var block = (16 - string.length % 16);
		var block = new Buffer(block);
		for(var i=0;i<block.length;i++)
			block[i] = '\x00';
		string = Buffer.concat([string, block]);
		var out = cipher.update(string);
		var out2 = cipher.final();
		return Buffer.concat([out,out2]);
	}catch(e)	{
		this.log.e("Error encrypting data: "+e);
		return "";
	}
}
/**
 *	Decrypts string using AES-RIJNDAEL-128 CBC
 **/
TheUpCrypter.prototype.__Decrypt 	=	function(string)	{
	try{
		var decipher = crypto.createDecipheriv("aes-128-cbc", this.key, this.iv);
		decipher.setAutoPadding(false);
		var decrypted = decipher.update(string);
		decrypted += decipher.final();
		return decrypted;
	}catch(e)	{
		this.log.e("Error encrypting data: "+e);
		return "";
	}
}

exports.TheUpCrypter = TheUpCrypter;