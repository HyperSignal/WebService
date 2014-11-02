var fs 					= 	require('fs');
var path				=	require('path');
var colors 				= 	require('colors');
var functionAULT_ZOOM		=	16
var SCALE				=	2

var tileSize 			= 	256

var initialResolution 	= 	2 * Math.PI * 6378137 / tileSize;

var originShift 		= 	2 * Math.PI * 6378137 / 2.0;

/**
 *		functionault theming for colors
 **/
colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

/**
 *   HyperSignal Logger 
 *   We have 4 levels of Logging: Info(0), Warning(1), Error(2), Debug
 *   The Debug Level has a separated flag for enabling/disabling it.
 *	 functionaults to Debug Disabled, Log Level = Info, Printing true, To File true
 **/
function HSLogger(filename)	{
	this.filename = filename || "hs.log";
	var directory = path.dirname(filename);
	if(!fs.existsSync(directory))
		fs.mkdirSync(directory);

	this.minimumLevel = 0;
	this.debug = false;
	this.tofile = true;
	this.print = true;
}

HSLogger.prototype.i 		=	function(msg)	{
	if(this.minimumLevel <= 0)	{
		this.__write("Info", msg);
		if(this.print)
			this.__printmsg("Info", msg, 0);
	}	
}
HSLogger.prototype.w 		=	function(msg)	{
	if(this.minimumLevel <= 1)	{
		this.__write("Warning", msg);
		if(this.print)
			this.__printmsg("Warning", msg, 1);
	}	
}
HSLogger.prototype.e 		=	function(msg)	{
	if(this.minimumLevel <= 2)	{
		this.__write("Error", msg);
		if(this.print)
			this.__printmsg("Error", msg, 2);
	}	
}

HSLogger.prototype.d 		=	function(msg)	{
	if(this.debug)	{
		this.__write("DEBUG", msg);
		if(this.print)
			this.__printmsg("DEBUG", msg, -1);
	}	
}

HSLogger.prototype.error 	= HSLogger.prototype.e;
HSLogger.prototype.warning 	= HSLogger.prototype.w;
HSLogger.prototype.info 	= HSLogger.prototype.i;
HSLogger.prototype.debug 	= HSLogger.prototype.d;

HSLogger.prototype.__printmsg =	function(level, msg, n)	{
	switch(n)	{
		case -1: 		//	Debug
			msg = colors.debug(msg);
			break;
		case 0:
			msg = colors.info(msg);
			break;
		case 1:
			msg = colors.warn(msg);
			break;
		case 2: 		//	Error
			msg = colors.error(msg);
			break;
	}
	var date = new Date(Date.now());
	msg = colors.help(date.toString()) + colors.info(" ["+level+"]: ") + msg;
	console.log(msg);
}

HSLogger.prototype.__write	=	function(level, msg)	{
	var date = new Date(Date.now());
	msg = date.toString() + "["+level+"]: " + msg;
	fs.writeFile(this.filename, msg, function(err) {}); 
	return msg;
}

/**
 *	Coordinate Tools
 **/

/**
 *	Converts given lat/lon in WGS84 Datum to XY in Spherical Mercator EPSG:900913
 **/
function LatLonToMeters(lat, lon)	{
    var mx = lon * originShift / 180.0;
    var my = Math.log( Math.tan((90 + lat) * Math.PI / 360.0 )) / ( Math.PI / 180.0);

    var my = my * originShift / 180.0;
    return [mx, my];
}

/**
 *	Returns tile for given mercator coordinates"	
 **/
function MetersToTile(mx, my, zoom)	{
    p = MetersToPixels( mx, my, zoom);
    return PixelsToTile( p[0], p[1]);
}
/**
 *	Converts EPSG:900913 to pyramid pixel coordinates in given zoom level
 **/
function MetersToPixels(mx, my, zoom)	{
    res = Resolution( zoom );
    px = (mx + originShift) / res;
    py = (my + originShift) / res;
    return [px, py];
}	

/**
 *	Resolution (meters/pixel) for given zoom level (measured at Equator)
 **/
function Resolution( zoom )	{
        // return (2 * math.pi * 6378137) / (self.tileSize * 2**zoom)
        return initialResolution / Math.pow(2,zoom);
}

/**
 *	Returns a tile covering region in given pixel coordinates"
 **/
function PixelsToTile(px, py)	{
    var tx = Math.round( Math.ceil( px / tileSize ) - 1 );
    var ty = Math.round( Math.ceil( py / tileSize ) - 1 );
    return tx, ty;
}

/**
 *	Returns bounds of the given tile in latutude/longitude using WGS84 datum
 **/
function TileLatLonBounds(tx, ty, zoom ) {
    var bounds = TileBounds( tx, ty, zoom);
    var minLatLon = MetersToLatLon(bounds[0], bounds[1]);
    var maxLatLon = MetersToLatLon(bounds[2], bounds[3]);

    return ( minLatLon[0], minLatLon[1], maxLatLon[0], maxLatLon[1] );
}

/**
 *	Returns bounds of the given tile in EPSG:900913 coordinates
 **/
function TileBounds(tx, ty, zoom) 	{
    var min = PixelsToMeters( tx*tileSize, ty*tileSize, zoom );
    var max = PixelsToMeters( (tx+1)*tileSize, (ty+1)*tileSize, zoom );
    return ( min[0], min[1], max[0], max[1] );
}

/**
 *	Converts pixel coordinates in given zoom level of pyramid to EPSG:900913
 **/
function PixelsToMeters(px, py, zoom)	{
    var res = Resolution( zoom );
    var mx = px * res - originShift;
    var my = py * res - originShift;
    return [mx, my];
}

/**
 *	Converts XY point from Spherical Mercator EPSG:900913 to lat/lon in WGS84 Datum
 **/
function MetersToLatLon(mx, my ) {
    var lon = (mx / originShift) * 180.0;
    var lat = (my / originShift) * 180.0;
    var lat = 180 / Math.PI * (2 * Math.atan( Math.exp( lat * Math.PI / 180.0)) - Math.PI / 2.0);
    return [lat, lon];
}

function GetTileBounds(lat, lon, zoom)	{
    var m = LatLonToMeters( lat, lon );
    var tmin = MetersToTile( m[0], m[1], zoom );
    return TileLatLonBounds( tmin[0], tmin[1], zoom );
}

function TruncSix(val) {
	return math.ceil(val*1e6)/1e6;
}	

function GetMetersPerPixel(tileBounds,zoom)	{
	var M1 = LatLonToMeters(tileBounds[0], tileBounds[1]);
	var M2 = LatLonToMeters(tileBounds[2], tileBounds[3]);
	var PX = MetersToPixels(M1[0], M1[1], zoom);
	var PY = MetersToPixels(M2[0], M2[1], zoom);
	var X  = [ TruncSix(M2[0] - M1[0]), TruncSix(M2[1] - M1[1]) ];
	var P  = [ Math.ceil(PY[0] - PX[0]), Math.ceil(PY[1] - PX[1]) ];
	return [ X[0]/P[0] , X[1] / P[1] ];
}

function GetTilePixelSize(tileBounds,zoom) {
	var M1 = LatLonToMeters(tileBounds[0], tileBounds[1]);
	var M2 = LatLonToMeters(tileBounds[2], tileBounds[3]);
	var PX = MetersToPixels(M1[0], M1[1], zoom);
	var PY = MetersToPixels(M2[0], M2[1], zoom);
	var P  = [ Math.ceil(PY[0] - PX[0]), Math.ceil(PY[1] - PX[1]) ];
	return [ P[0] , P[1] ];
}

function GetTilePixelBounds(tileBounds,zoom) {
	var M1 = LatLonToMeters(tileBounds[0], tileBounds[1]);
	var M2 = LatLonToMeters(tileBounds[2], tileBounds[3]);
	var PX = MetersToPixels(M1[0], M1[1], zoom);
	var PY = MetersToPixels(M2[0], M2[1], zoom);
	return [ Math.ceil(PX[0]), Math.ceil(PX[1]), Math.ceil(PY[0]), Math.ceil(PY[1]) ] ;
}

function LatLonToPixels(lat, lon, zoom)	{
	var meters = LatLonToMeters(lat, lon);
	var pp = MetersToPixels(meters[0], meters[1], zoom);
	return [ Math.round(pp[0]), Math.round(pp[1]) ];
}

function GoogleTile(lat, lon, zoom) {
	var m = LatLonToMeters( lat, lon );
	var t = MetersToTile( m[0], m[1], zoom );
	return [zoom, t[0], Math.Pow(2,zoom) - t[1] - 1];
}

function GetTile(lat, lon, zoom) {
	var m = LatLonToMeters( lat, lon );
	var t = MetersToTile( m[0], m[1], zoom );
	return [t[0], t[1]];
}

function GoogleTile2Tile(z,x,y) {
	return ( x, -y + Math.pow(2 , z) -1 );
}

function GoogleTileLatLonBounds(z,x,y) {
	var t = GoogleTile2Tile(z,x,y);
	return TileLatLonBounds(t[0], t[1], z);
}

function TileLatLonPerPixel(tx,ty,zoom) {
	var bounds	=	TileLatLonBounds(tx, ty, zoom );
	//boundsm	=	(	LatLonToMeters(bounds[0], bounds[1] ), LatLonToMeters(bounds[2], bounds[3] ) )
	var deltax	=	bounds[2] - bounds[0]	//	Latitude
	var deltay	=	bounds[3] - bounds[1]	//	Longitude
	return	[	deltax / tileSize, deltay / tileSize ]
}

/**
 *		Color Control
 **/


function hsv2rgb(h, s, v)	{
	var h60 	= h / 60.0
	var h60f 	= Math.floor(h60)
	var hi 		= h60f % 6
	var f 		= h60 - h60f
	var p 		= v * (1 - s)
	var q 		= v * (1 - f * s)
	var t 		= v * (1 - (1 - f) * s)
	var r 		= 0,
		g 		= 0,
		b 		= 0;

		switch(hi)	{
		case 0: 	r = v; g = t; b = p;	break;
		case 1: 	r = q; g = v; b = p; 	break;
		case 2: 	r = p; g = v; b = t; 	break;
		case 3: 	r = p; g = q; b = v;  	break;
		case 4: 	r = t; g = p; b = v;  	break;
		case 5: 	r = v; g = p; b = q;  	break;
	}
	r = Math.round(r*255);
	g = Math.round(g*255);
	b = Math.round(b*255);
	return [r, g, b];
}


exports.HSLogger = HSLogger;