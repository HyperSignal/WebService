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