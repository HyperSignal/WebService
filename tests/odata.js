var tup = require("../modules/theupcrypter.js")
var tool = require("../modules/tool.js")
var hslog = new tool.HSLogger("test.log");
var x = new tup.TheUpCrypter("TESTETESTETESKEY","TESTETESTETESTIV",hslog)

var testvector = "eJwBgAB//2CU9/NHb9EB5Ddt+m0bbIYw+tFB9+MaF7KQomVpXnH/s4u1bj3n3KsiMNRRy3CobSivRFczyAvnUQeUkbX5efXYRsZWSxt/N4mVIxLTxROBWiUmSQ2gA3HUBPH7bLEyZCA0yBtFd0xGTi2vz79S6IVqTca/GXC5YXZuJ4QESfFHN149Pw==";
var encdata = '{"metodo": "addsinal", "uid": 0, "lon": -46.639344692230225, "sig": 15, "lat": -23.547917057611542, "op": "AEIO"}';

hslog.i("Encrypting test: "+encdata);
x.ODataEncrypt(encdata, function(data) {
	hslog.i("Encrypted! Value: "+data);
	if(data == testvector)	{
		hslog.i("TestVector matches Encrypted Data!");
	}else{
		hslog.e("TestVector doesnt match Encrypted Data");
	}
	hslog.i("Decrypting it.");
	x.ODataDecrypt(data, function(data) {
		hslog.i("Decrypted! Value: "+data);
		hslog.i("Decrypting Test Vector");
		x.ODataDecrypt(testvector, 
			function(data) { 
				hslog.i("Test Vector: "+data);
			}
		);
	});
});
