/* cpo-map.js
*  created 2012.11.06 by jebb.q.stewart@noaa.gov
*  
*  Created for Climate.gov Data Interoperability Pilot Project web page
*  Main functions controlling OpenLayers map layout
*  
*  !!NOTE!! uses NOAA.gov google maps api key.  To work properly, website must end in noaa.gov
* 
*  history:
*  2012.11.06 Initial Release (jqs)
*/

$(document).ready(function() {
var apiKey = "ABQIAAAAIoZKb9JrajP0IwKLFr335hTsk_juWuwt_LNtOqByAr93uT9HuRTzovVKWJSi3TQGBPsWMWPyWdIQdg";
OpenLayers.ProxyHost = "proxy.cgi?url=";

var gg = new OpenLayers.Projection("EPSG:4326");
var sm = new OpenLayers.Projection("EPSG:900913");

// Use This Section if you have Google Maps API key or are using a server that ends in noaa.gov 
/* Google Maps API Key section 
 * 
 
 
// create map
var map = new OpenLayers.Map({
	div: "map",
	theme: null,
	projection: gg,
	units: "m",
	numZoomLevels: 18,
	maxResolution: 156543.0339,
	maxExtent: new OpenLayers.Bounds(
			-20037508.34, -20037508.34, 20037508.34, 20037508.34
	)
	});

var gphy = new OpenLayers.Layer.Google(
		"Google Physical",
		{type: G_NORMAL_MAP}
);

var gmap = new OpenLayers.Layer.Google(
		"Google Streets", // the default
		{numZoomLevels: 20}
);
var gsat = new OpenLayers.Layer.Google(
		"Google Satellite",
		{type: G_SATELLITE_MAP, numZoomLevels: 22}
);

map.addLayers([gphy, gmap, gsat]);

var lonlat = new OpenLayers.LonLat(-95.0, 40.0);
map.setCenter(lonlat, 5);
map.addControl(new OpenLayers.Control.LayerSwitcher());

//** End Google Maps API Key Block 
*/

/* Use this section if you want to stick with Open Street Maps that does not require a key
 * 
 * */

// create map
var map = new OpenLayers.Map({
	div: "map",
	theme: null,
	projection: sm,
	units: "m",
	numZoomLevels: 18,
	maxResolution: 156543.0339,
	maxExtent: new OpenLayers.Bounds(
			-20037508.34, -20037508.34, 20037508.34, 20037508.34
	)
	});

var osm = new OpenLayers.Layer.OSM();
map.addLayer(osm);
var lonlat = new OpenLayers.LonLat(-95.0, 40.0);
lonlat.transform(gg, sm);

map.setCenter(lonlat, 5);
map.addControl(new OpenLayers.Control.LayerSwitcher());
/*
//**End Open Street Maps Block
 */
});

