var HYPER_STEP		=	0.0005							//	Step used on Database. 0.0005 gives us a ~100m precision
var HYPER_BRUSH_INT	=	[	
							[0	,0	,0	,0	,0],		//	|
							[0	,0.5,0.5,0.5,0],		//	|
							[0	,0.5,1	,0.5,0],		//	|---- Interpolation Brush
							[0	,0.5,0.5,0.5,0],		//	|
							[0	,0	,0	,0	,0]			//	|
						]						

/*
	HyperSignal Functions
*/

/*
	Entra com Latitude e Longitude, retorna x e y nas coordenadas do HyperSignal
*/
function LatLonToHyper(lat,lon)	{
	return (Math.round(Math.ceil((lon+180)/HYPER_STEP)), Math.round(Math.ceil((lat+90)/HYPER_STEP)));
}

/*
	Entra com a coordenada do HyperSignal e retorna latitude,longitude
*/
function HyperToLatLon(x,y)	{
	return ( y * HYPER_STEP - 90,  x * HYPER_STEP - 180 );
}

/*
	Retorna range do Tile da google nas coordenadas do HyperSignal
	(xmin, xmax, ymin, ymax)
*/
function GetGoogleTileHSRange(z,x,y) {
	var bounds 	= 	tool.GoogleTileLatLonBounds(z,x,y)
	var b1		=	LatLonToHyper(bounds[0],bounds[1])
	var b2		=	LatLonToHyper(bounds[2],bounds[3])	
	return [ b1[0], b2[0], b1[1], b2[1] ]
}

/*
	Retorna o z,y,x do tile da google onde o HS(x,y) está.
*/
function GetGoogleTileFromHS(x,y,zoom) {
	latlon	=	HyperToLatLon(x,y)
	return tool.GoogleTile(latlon[0], latlon[1], zoom)
}

var HSManager = function()	{

}











exports.HSManager = HSManager;