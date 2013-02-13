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
 *  2012.02.06 Added bulk of capability (jqs)
 */


var map;
var loaded_layers = 0;
var esriproj = new OpenLayers.Projection("EPSG:102100");
var sm = new OpenLayers.Projection("EPSG:3857");
var proj = new OpenLayers.Projection("EPSG:4326");

function single_layer(layer, time, fields){
	this.layer = layer;
	this.fields = fields;
	this.time = time;
}

function layer_collection(name, type){
	this.name = name;
	this.type = type;
	this.timeParamName = "";
	this.geomParamName = "";
	this.deleted = false;
	this.layers = new Array();
	this.setTimeName = setTimeParamName;
	this.setGeomName = setGeomParamName;
}

function setTimeParamName(name) {
	return this.timeParamName = name;
}

function setGeomParamName(name) {
	return this.geomParamName = name;
}

function map_details(){
	this.collections = new Array();
}

//noaa.gov api key.  Service must exist on noaa.gov domain
var apiKey = "ABQIAAAAIoZKb9JrajP0IwKLFr335hTsk_juWuwt_LNtOqByAr93uT9HuRTzovVKWJSi3TQGBPsWMWPyWdIQdg";

var map_info = new map_details();
var default_styles = new Array();
var selecting_layer;
var draw_control;
var select_control;

var colors = [ "#FF0000", "#00FF00", "#0000FF" ];

$(document).ready(function() {
	map = new OpenLayers.Map('map');

	var wms = new OpenLayers.Layer.WMS("OpenLayers WMS",
			"http://vmap0.tiles.osgeo.org/wms/vmap0", {
				layers : "basic"
			});

	map.addLayer(wms);
	var point = new OpenLayers.LonLat(-95, 40);
	map.setCenter(point.transform(proj, map.getProjectionObject()),4);

	selecting_layer = new OpenLayers.Layer.Vector("Select", null);
	draw_control = new OpenLayers.Control.DrawFeature(selecting_layer,
			OpenLayers.Handler.RegularPolygon, {handlerOptions: {sides: 4, snapAngle:0}});

	var selectStyle = new OpenLayers.Style({
		fillColor : "#ffaa44"
	});

	for ( var i = 0; i < colors.length; i++ ) {
		var tmp_style = OpenLayers.Util.extend({},
				OpenLayers.Feature.Vector.style['default']);
		tmp_style.strokeColor = colors[i];
		tmp_style.fillColor = colors[i];
		tmp_style.pointRadius = 2;

		var tmp_style_map = new OpenLayers.StyleMap({
			"default" : tmp_style,
			"select" : selectStyle
		});

		default_styles.push(tmp_style_map);
	}

	jQuery.ajaxSetup({
		beforeSend: function() {
			$("#loading-message").dialog("open");
		},
		complete: function(){
			$("#loading-message").dialog("close");
		},
		success: function() {}
	});
});

function common_failure(response){
	alert("Something went wrong in the request:" + response);
	console.log("Something went wrong in the request:" + response);
}

function post_request(server, post_data, callback_function, failure_function){
	var request = new OpenLayers.Request.POST({
		url: server,
		data: post_data,
		headers: {
			"Content-Type": "text/xml;charset=utf-8"
		},
		callback: callback_function,
		failure: failure_function
	});
}


function load_data(link, type, name, title){

	if ( link == "https://services.ogc.noaa.gov/geoserver/cpo/wfs?request=getcapabilities" && name == "noaa_esrl_fim9_hfip_forecasts" ) {
		link = "http://services.ogc.noaa.gov/geoserver/cpo/wfs?request=getcapabilities" ;
		name = "hfip_fim9_hurricane_forecast";
	} else if ( link == "http://services.ogc.noaa.gov/geoserver/nhc/wfs?request=getcapabilities" && name == "noaa_nhc_forecasts") {
		link = "http://services.ogc.noaa.gov/geoserver/nhc/wfs?request=getcapabilities";
		name = "nhc_hurr_pts";
	} else if ( link == "http://services.ogc.noaa.gov/geoserver/nhc/wfs?request=getcapabilities" && name == "nat_hurr_pts") {
		link = "http://services.ogc.noaa.gov/geoserver/nhc/wfs?request=getcapabilities";
		name = "nhc_hurr_pts";
	}

	if (type.toLowerCase() == "wms" ) {
		handleWMS(link, name, title);
	} else if ( type.toLowerCase() == "wfs") {
		handleWFS(link, name, title);
	} else if ( type.toLowerCase() == "esri_rest") {
		handleESRI(link, name, title);
	} else {
		alert(type + " unsuported in this release.  Coming Soon!");
	} 
}

function updateLayers(){
	$("#layers-content").empty();
	$("#legend").empty();
	$("#legend").append("<b>Legend:</b><br/>");
	for ( var i = 0; i < map_info.collections.length; i++){
		$("#layers-content").append('<p>');
		$("#layers-content").append(map_info.collections[i].name + '<div id="slider-' + i + '"></div>');    
		(function(l) {
			$( "#slider-" + i ).slider({
				range: "min",
				min: 0,
				max: 100,
				value: l.opacity*100,
				slide: function(e, ui) {				    	
					l.setOpacity(ui.value / 100);
				}
			});
		})(map_info.collections[i].layers[0].layer);
		$("#layers-content").append('<button id="unload-' + i + '">unload</button>');
		$("#unload-" + i).button({ icons: { primary: "ui-icon-closethick"}, text: false});

		//Add functions to buttons
		(function(l) {
			$("#unload-" + i).click(function(){ 
				l.deleted = true;
				map.removeLayer(l.layers[0].layer);
				remove_layer(l.name);
				l.layers[0].layer.destroy();
				return false;
			});
		})(map_info.collections[i]);

		$("#layers-content").append('<button id="activate-' + i + '">Enable Query</button>');

		//Add functions to buttons
		(function(l) {
			$("#activate-" + i).click(function(){
				//alert(this.innerText);
				if ( this.innerText == "Enable Query" ) {
					activate_select(l, l.layers[0]);
					this.innerText = "Disable Query" ;
				} else if ( this.innerText == "Disable Query") {
					deactivate_select(l, l.layers[0]);
					this.innerText ="Enable Query" ;
				}
			});
		})(map_info.collections[i]);

		$("#layers-content").append('<button id="export-' + i + '">Generate Export</button>');

		//Add functions to buttons
		(function(l) {
			$("#export-" + i).click(function(){
				export_data(l, l.layers[0]);
			});
		})(map_info.collections[i]);

		$("#layers-content").append('</p>');

		map.addLayer(map_info.collections[i].layers[0].layer);
		
		var color_legend = "";
		if ( map_info.collections[i].type == "esri" ) {
			color_legend = '<span style="color:purple">------</span>  ';
		} else if ( map_info.collections[i].type == "wfs") {
			color_legend = '<span style="color:' + colors[i] + '">------</span>  ';
		}
		$("#legend").append(i + " :: " + color_legend + map_info.collections[i].name + "<br/>");

	}
}

function already_loaded(name){
	var result = false;

	for ( var i = 0; i < map_info.collections.length; i++){
	  if ( map_info.collections[i].name == name ) {
	  	result = true;
	  	break;
	  }
	}
	return result;
}

function remove_layer(name){
	for ( var i = 0; i < map_info.collections.length; i++){
		if ( map_info.collections[i].name == name ) {
			map_info.collections.splice(i,1);

		}
	}
	updateLayers();
}

function handleWMS(link, layerName, title){

	link = link.substring(0, link.indexOf("?"));

	var urlstring = link + "?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0";
	var capabilitiesRequest = OpenLayers.Request.GET({
		url: urlstring,
		success: function(response) { parseWmsCapabilities(response, link, title, layerName); },
		failure: function(response) { alert("ERROR\n" + response);}
	});

}

function handleESRI(link, layername, title){
	if ( link.substring(link.lastIndexOf("/")).indexOf("export") < 0  ) {
		link = link + "/export";	
	}

	var collection = new layer_collection(title, "esri");
	map_info.collections.push(collection);

	var layer = new OpenLayers.Layer.ArcGIS93Rest(title,
			link,		
			{
		layers: "1",
		transparent: "true"
			});

	var layertmp = new single_layer(layer, [], []);
	collection.layers.push(layertmp);

	updateLayers();
}

var select_active = false;

function apply_time_filter(start, end){
	for (var i = 0 ; i < map_info.collections.length; i++){
		var layer = map_info.collections[i].layers[0].layer;
		if ( map_info.collections[i].type == "esri" ) {
			var startYear = start.getYear() + 1900;
			var startMonth = start.getMonth() + 1;

			var yearFilterString = "FilterParam_Years >= " + startYear;
			var monthFilterString = "FilterParam_Months >= " + startMonth;

			var endYear = ""; 
			var endMonth = ""; 
			if ( end ) {
				endYear = end.getYear() + 1900;
				endMonth =  end.getMonth() + 1;
				yearFilterString = yearFilterString + " AND FilterParam_Years =< " + endYear;
				monthFilterString = monthFilterString + " AND FilterParam_Months =< " + endMonth;
			}

			var filterString = yearFilterString + " AND " + monthFilterString;

			layer.setLayerFilter(1,	filterString);

			layer.redraw({
				force : true,
			});

		} else if ( map_info.collections[i].type == "wfs") {

			if (end ) {
				layer.filter = new OpenLayers.Filter.Comparison({
					type : OpenLayers.Filter.Comparison.BETWEEN,
					property: map_info.collections[i].timeParamName,
					lowerBoundary: start.toISOString(),
					upperBoundary: end.toISOString()
				});
			} else {
				layer.filter = new OpenLayers.Filter.Comparison({
					type : OpenLayers.Filter.Comparison.EQUAL,
					property: map_info.collections[i].timeParamName,
					value : start.toISOString()
				});
			}

			layer.refresh({
				force : true
			});
		}
	}
}

function activate_query_tool(active){
	if  ( !active  ) {
		draw_control.deactivate();
		map.removeControl(draw_control);
		map.removeLayer(selecting_layer);
		select_active = false;
	} else {
		
		map.addLayer(selecting_layer);
		map.addControl(draw_control);
		select_active = true;
		draw_control.activate();


		selecting_layer.events.on({
			beforefeatureadded : function(event) {
				var geometry = event.feature.geometry;
				var center=geometry.getCentroid();

				for (var i = 0 ; i < map_info.collections.length; i++){
					var layer = map_info.collections[i].layers[0].layer;
					if ( map_info.collections[i].type == "esri" ) {

						//var point = new OpenLayers.LonLat(center.x, center.y);
						var point = new OpenLayers.Geometry.Point(center.x, center.y);
						point.transform(proj, sm);

						if ( geometry.getVertices().length > 0 ) {
							var point2 = new OpenLayers.Geometry.Point(geometry.getVertices()[0].x , geometry.getVertices()[0].y);
							//var point2 = new OpenLayers.LonLat(geometry.getVertices()[0].x , geometry.getVertices()[0].y);

							point2.transform(proj, sm);
							layer.setLayerFilter(
									1,
									"STORMID IN (SELECT STORMID FROM WebMerc.get_StormIdsForGeometry(default,default,default,-1,2000,'" + point.x + " " + point.y + "'," + point.distanceTo(point2) + "))");

							layer.redraw({
								force : true
							});
						}
					} else if ( map_info.collections[i].type == "wfs") {

						layer.filter = new OpenLayers.Filter.Spatial({
							type : OpenLayers.Filter.Spatial.INTERSECTS,
							value : event.feature.geometry
						});
						layer.refresh({
							force : true
						});
					}
				}

				return false;

			}
		});
	}
}

function export_data(collection, layer){
	var filename = collection.name.replace(/\s+/ig, "");
	filename = filename+".csv";
	//var test = layer;
	var firstRun = true;
	var csv = "";
	var line = "";
	layer.layer.features.forEach(function(feature){
		line = "";
		if ( firstRun ) {
			Object.keys(feature.attributes).forEach(function(key){
				if (line != "" ) {
					line = line + ", ";
				}
				line = line + key;
			});
			csv = csv + line + "\n";
			line = "";
			firstRun = false;
		}

		Object.keys(feature.attributes).forEach(function(key){
			if ( line != "" ) {
				line = line + ", ";
			}
			line = line + feature.attributes[key];
		});

		csv = csv + line + "\n";



	});

	$("#download-message").html('');
	$("#download-message").append("<a href='data:text;charset=utf-8,"+encodeURI(csv)+"' download='" + filename + "' >" + filename +"</a>");
	$("#download-message").dialog("open");
}
function activate_select(collection, layer){

	select_control = new OpenLayers.Control.SelectFeature(
			[layer.layer],
			{
				clickout: true, toggle: false,
				multiple: false, hover: false,
				toggleKey: "ctrlKey", // ctrl key removes from selection
				multipleKey: "shiftKey" // shift key adds to selection
			}
	);

	map.addControl(select_control);
	select_control.activate();

	layer.layer.events.on({
		featureselected: function(e) {
			var response = "";
			if ( layer.fields && layer.fields.length>0 ) {
				for (var i = 0; i < layer.fields.length; i++ ) {
					response = response + " " + layer.fields[i] + "::" + e.feature.data[layer.fields[i]];
				}
				alert("selected feature "+response+" on " + collection.name);
			}
				},
		featureunselected: function(e) {
			// alert("unselected feature "+e.feature.id+" on Vector Layer 1");
		}
	});
}

function deactivate_select(collection, layer){
	//alert("here");
	map.removeControl(select_control);
	delete select_control;
}

function handle_describe_feature_response (response, link, title, name) {
	//read the response from GeoServer
	$("#loading-message").dialog("close");
	var geom = "";
	var targetNS = "";
	var targetPrefix = "";
	var featureName = "";
	//var SRS = "";
	var timeField = "";

	var df_reader = new OpenLayers.Format.WFSDescribeFeatureType({ extractAttributes: true});
	var desc = df_reader.read(response.responseText);
	var fields = new Array();
	$.each(desc.featureTypes, function(i, featureType){
		featureName = featureType.typeName;
		$.each(featureType.properties, function(i, property){
			if (property.type == "gml:PointPropertyType"  ){
				geom = property.name;
			}
			if (property.type == "xsd:dateTime" ){
				timeField = property.name;
			}
			fields.push(property.name);
		});
	});

	targetNS = desc.targetNamespace;
	targetPrefix = desc.targetPrefix;
	//alert (geom + " : " + targetNS);

	if ( !already_loaded(title)){

		var collection = new layer_collection(title, "wfs");
		collection.setTimeName(targetPrefix + ":" + timeField);
		collection.setGeomName(geom);
		map_info.collections.push(collection);

		var index = map_info.collections.indexOf(collection);

		var layer = new OpenLayers.Layer.Vector("WFS", {
			//projection: proj,
			strategies : [ new OpenLayers.Strategy.BBOX() ],
			protocol : new OpenLayers.Protocol.WFS({
				url : link,
				featureType : featureName,
				featureNS : targetNS,
				geometryName : geom,
				//srsName : "EPSG:100100",
				version : "1.1.0"
			}),
			styleMap: default_styles[index]
		});
		
		$("#loading-message").dialog("open");

		var layertmp = new single_layer(layer, [], fields);
		collection.layers.push(layertmp);
		layer.events.on({
			featuresadded : function(event) {
				$("#loading-message").dialog("close");
			}
		});

		updateLayers();
	}
}

function handleWFS(link, featureName, title){
	link = link.substring(0, link.indexOf("?"));

	var request = new OpenLayers.Request.GET({
		url: link,
		params: { request : "describefeaturetype", typename: featureName },
		callback: function (response) { handle_describe_feature_response(response, link, title, featureName); },
		failure: function (response) {
			alert("Something went wrong in the request " + response);
		}
	});
	
	$("#loading-message").dialog("open");}

var parseWFSResponse = function (response) {

};

var parseWmsCapabilities = function(response, link, title, name) {
	var wmsParser = new OpenLayers.Format.WMSCapabilities();
	wmsCapabilities = wmsParser.read(response.responseText);
	for(var i=0; i<wmsCapabilities.capability.layers.length; ++i) {
		if ("name" in wmsCapabilities.capability.layers[i]) {

			if ( wmsCapabilities.capability.layers[i].name == name){
				var currentTimes = wmsCapabilities.capability.layers[i].dimensions['time'].values.toString();
				var times = parseTimes(currentTimes, link);
				var style = '';
				if ( wmsCapabilities.capability.layers[i].styles.length > 0 ){
					style = wmsCapabilities.capability.layers[i].styles[0].name;
				}
				var collection = new layer_collection(wmsCapabilities.capability.layers[i].title, "wms");
				map_info.collections.push(collection);

				for (var t = 0; t< 10; t++){

					var tmpmap = new OpenLayers.Layer.WMS(wmsCapabilities.capability.layers[i].title,
							link,
							{
						layers: wmsCapabilities.capability.layers[i].name,
						transparent: 'true', styles: style, time: times[times.length-t-1].toISOString() 
							},
							{ 
								buffer:1, 
								opacity: 0.65, 
								visibility: 'true',
								alpha: true, 
							});

					var layertmp = new single_layer(tmpmap, times[times.length-t-1].toISOString(), []);

					collection.layers.push(layertmp);
				}
			}
		}
	}

	updateLayers();
	};

function addPeriod(date, period){

	if (period.substring(0,1) != "P") {
		alert("invalid period:"  + period);
		return
	}
	//date
	if ( period.toUpperCase() == "P1D") {
		date = date.addDays(1);
	} else if (period.toUpperCase() == "P8D" || period.toUpperCase() == "P1W1D"){
		date = date.addDays(8);
	} else if ( period.toUpperCase() == "P1M") {
		date = date.addMonths(1);
	}

	return date;
}

function parseTimes(timelist, url){
	if (url.indexOf("neowms") >= 0 ) {
		return (parseNEOTimes(timelist));
	} else if (url.indexOf("/P") >= 0 ) {
		return (parseISOTime(timelist));
	} else {
		return (parseTimesList(timelist));
	}
}

function parseTimesList(timelist){
	var productTimes = new Array();
	var timePeriods = timelist.split(",");
	for (var i = 0; i<timePeriods.length; i++ ){
		var time = new Date(timePeriods[i].trim());
		productTimes.push(time);
	}

	return (productTimes);	
}


function parseNEOTimes(timelist){
	var productTimes = new Array();
	var segmentCount = 0;
	var lastSegmentSize = 0;

	var timePeriods = timelist.split(",");
	for (var i = 0; i<timePeriods.length; i++ ){
		var segment = timePeriods[i].split("/");
		if ( segment.length != 3 ){
			console.log("Expecting string similar to time/time/period");
			break;
		} else {
			var start = new Date(segment[0]);
			var end = new Date(segment[1]);
			var period = segment[2];

			var step = new Date(start.getTime());
			while ( step <end) {
				productTimes.push(step);
				step = new Date(addPeriod(step, period).getTime());
			}
			productTimes.push(end);	

			console.log( "Segment " + segmentCount + ": from " + start.toISOString() + " to " + end.toISOString() + " with period: " + period.toString());
			console.log( "  Total Times:" + (productTimes.length-lastSegmentSize));

			segmentCount++;
		} 
	}

	console.log("       time info: Segments (" + segmentCount + ") + total time steps (" + productTimes.length + ")");
	return (productTimes);
}


var tIndex = 0;
var timeoutState;
//$("#output").html(tIndex + " " + times[tIndex]);
var timeout = 1000;


function animate() {
	var remainingTiles = namLayers[tIndex].numLoadingTiles;
	if ( remainingTiles > 0 ) {
		$("#output").html(tIndex + " Still waiting for " + remainingTiles + " remaining tile before continuing animation.");
		timemout = 50;
	} else {
		timeout = 1000;
		tIndex++;
		if ( tIndex >= 5 ) {
			tIndex = 0;
		}
		if ( tIndex == 0 ) {

			map.removeLayer(namLayers[4]);
		} else {
			map.removeLayer(namLayers[tIndex-1]);
		}
		map.addLayer(namLayers[tIndex]);
		$("#output").html(tIndex);
	}
	timeoutState = setTimeout("animate()", timeout);
}

function toggle() {
	if ( timeoutState == null ) {
		animate();
	} else {
		clearTimeout(timeoutState);
		timeoutState = null;
	}
}

/**/