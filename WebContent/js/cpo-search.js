/* cpo-search.js
*  created 2012.11.06 by jebb.q.stewart@noaa.gov
*  
*  Created for Climate.gov Data Interoperability Pilot Project web page
*  Main search functionality
* 
*  history:
*  2012.11.06 Initial Release (jqs)
*  2012.11.15 Updated CSW interactivety (jqs)
*  2012.11.28 Added links to get more details and a load button to eventually load data (jqs)
*/

var start = 1;
var num_of_results = 5;
var abstract_cutoff = 300;
var ellipse = "...";
var geoportal_server = "http://neis.fragileearthstudios.com/geoportal";

$(document).ready(function() {

	$("#search-dialog").dialog({
		autoOpen: false,
		title: "Find Data",
		width: 700,
		height: 400,
		minWidth: 500,
		minHeight: 400,
	});
	$("#results").accordion({
		collapsible: true,
		active: false,
		heightStyle: "fill"
	});

	$( "#results-resizer" ).resizable({
		minHeight: 300,
		minWidth: 400,
		resize: function() {
			$( "#results" ).accordion( "refresh" );
		}
	});

	$( "#search-button" )
	.button()
	.click(function( event ) {
		event.preventDefault();
		search(start, num_of_results);
	});

	$("#anytext").keypress(function(event) {
		if (event.which == 13) {
			event.preventDefault();
			search(start, num_of_results);
		}
	});

	$("#search-dialog-button").button().click(function() {
		$( "#search-dialog" ).dialog( "open" );
		return false;
	});

	$("#search-dialog-button").button({ icons: { primary: "ui-icon-search"}, text: false});

});

function load_data(link, type){
	alert("Loading data is disabled in this release. Coming Soon!");
}

function search(start, num_of_results) {

	var format = new OpenLayers.Format.CSWGetRecords();
	var search_text = $("#anytext").val();
	var filter_bounding_box = "";

	if ( search_text.length > 0 ) {
		filter_bounding_box = new OpenLayers.Filter.Comparison({
			type: OpenLayers.Filter.Comparison.LIKE,
			property: "anytext",
			value: "%" + search_text + "%"
		});
	}
	//type: OpenLayers.Filter.Spatial.BBOX,

	//property: "ows:BoundingBox",
	//value: bbox
	//});

	var options;
	if (filter_bounding_box != "" ) {
		options = {
				resultType: "results",
				startPosition: start,
				maxRecords: num_of_results,
				outputFormat: "application/xml",
				outputSchema: "http://www.opengis.net/cat/csw/2.0.2",
				Query: {
					ElementSetName: {
						value: "full"
					},
					Constraint: {
						version: "1.1.0",
						Filter: filter_bounding_box
					}
				}
		};
	} else {
		options = {
				resultType: "results",
				startPosition: start,
				maxRecords: num_of_results,
				outputFormat: "application/xml",
				outputSchema: "http://www.opengis.net/cat/csw/2.0.2",
				Query: {
					ElementSetName: {
						value: "full"
					}
				}
		};
	}

	var post_data = format.write(options);
	var server = geoportal_server + "/csw";
	var request = new OpenLayers.Request.POST({
		url: server,
		data: post_data,
		headers: {
			"Content-Type": "text/xml;charset=utf-8"
		},
		callback: function (response) {
			//read the response from GeoServer
			var csw_reader = new OpenLayers.Format.CSWGetRecords({ extractAttributes: true });
			var records = csw_reader.read(response.responseText);
			i = 0;
			if ( records && records.records && records.records.length > 0 ) {
				$("#results").empty();
				$("#results").accordion( "destroy" );
				$("#status").empty();

				//Setup the navigation for the pages of results
				var status_text = "Results " +  start + "-" + Math.min(start+num_of_results-1, records.SearchResults.numberOfRecordsMatched) + " of " + records.SearchResults.numberOfRecordsMatched + " record";
				if ( records.SearchResults.numberOfRecordsMatched > 1 ) { status_text = status_text + "s"; }
				$("#status").append(status_text);

				//If we are not on the first page, provide links to the first and previous pages
				if ( records.SearchResults.nextRecord > 1 + num_of_results ) {
					$("#status").append('<input type="button" id="search-first" value="first">'); 
					$("#search-first").click(function(){ search(1, num_of_results);}); 
					$("#status").append('<input type="button" id="search-prev" value="<">'); 
					$("#search-prev").click(function(){ search(records.SearchResults.nextRecord-(num_of_results*2), num_of_results);}); 
				}

				//Create the links to the various pages
				var pages = Math.ceil(records.SearchResults.numberOfRecordsMatched / num_of_results);
				var current_page = parseInt((records.SearchResults.nextRecord - num_of_results) / num_of_results) + 1;
				for ( var c = Math.max(1,current_page-2); c <= Math.min(pages, current_page+2); c++ ){
					var new_start = ((c-1) * num_of_results)+1;
					($("#status").append('<button id="search-page-' + c + '">' + c + '</button>'));
					(function(j) {
						$("#search-page-" + c).click(function(){ 
							search(j, num_of_results);
						});
					})(new_start);
				}

				//If we are not on the last page, create links to the last and next pages
				if ( pages != current_page ) {
					$("#status").append('<input type="button" id="search-next" value=">">'); 
					$("#search-next").click(function(){ search(records.SearchResults.nextRecord, num_of_results);}); 
					$("#status").append('<input type="button" id="search-last" value="last">'); 
					$("#search-last").click(function(){ search((pages-1)*num_of_results, num_of_results);});
				}

				//Print the details for each record
				for ( i = 0 ; i < records.records.length; i++ ) {
					var text = "<h3>" + records.records[i].title[0].value + "</h3>\n";
					var abstract_text = records.records[i].abstract[0];
					if (abstract_text.length > abstract_cutoff) {
						abstract_text = abstract_text.substring(0, abstract_cutoff) + ellipse;
					}
					var details_text = '<p id="details">' + abstract_text + '</p>' ; 

					// Find the various links for data and more information
					var details_link = "";
					var wms_data_link = "";
					var wfs_data_link = "";
					var wcs_data_link = "";
					for ( c = 0 ; c < records.records[i].references.length; c++ ) {
						if ( records.records[i].references[c].toUpperCase().indexOf("/CSW?") > 0 ){
							details_link = records.records[i].references[c];
						}
						else if ( records.records[i].references[c].toUpperCase().indexOf("/WMS?") > 0 ){
							wms_data_link = records.records[i].references[c];
						}
						else if ( records.records[i].references[c].toUpperCase().indexOf("/WCS?") > 0 ){
							wcs_data_link = records.records[i].references[c];
						}
						else if ( records.records[i].references[c].toUpperCase().indexOf("/WFS?") > 0 ){
							wfs_data_link = records.records[i].references[c];
						}

					}

					//Create the buttons for links to more details and to load data
					var linktext = '<p id="item-tools">';
					linktext = linktext + '<button id="details-' + i + '">Details</button>';
					if ( wms_data_link != "" ) {
						linktext = linktext +  '<button id="load-data-' + i + '">Load</button>';	
					}
					else if ( wfs_data_link != "" ) {
						linktext = linktext +  '<button id="load-data-' + i + '">Load</button>';
					} 
					else if ( wcs_data_link != "" ) {
						linktext = linktext +  '<button id="load-data-' + i + '">Load</button>';
					}

					linktext = linktext + '</p>';
					text = text + '<div id="div_details">' + linktext + details_text + '</div>';
					$( "#results").append(text);

					//Add functions to buttons
					$("#details-" + i).click(function(){ 
						window.open(details_link, '_info', '');
						return false;
					});
					//+ details_link + '" target="_info">details</a>';
					if ( wms_data_link != "" ) {
						(function(j) {
							$("#load-data-" + i).click(function(){ 
								load_data(j, "wms");
							});
						})(wms_data_link);
					}
					else if ( wfs_data_link != "" ) {
						(function(j) {
							$("#load-data-" + i).click(function(){ 
								load_data(j, "wfs");
							});
						})(wfs_data_link);
					} 
					else if ( wcs_data_link != "" ) {
						(function(j) {
							$("#load-data-" + i).click(function(){
								load_data(j, "wcs");
							});
						})(wcs_data_link);
					}
				}

				//Reset the JQuery Accordion				
				$("#results").accordion({
					collapsible: true,
					active: false,
					heightStyle: "fill"
				});				

				//Uncomment to see full json response
				//$( "#results").append(JSON.stringify( records));
			} else if ( records.records.length == 0 ) {
				//No results are found, tell the user
				$("#status").empty();
				$("#results").empty();
				$("#status").append("No results found!");
			}
		},
		failure: function (response) {
			alert("Something went wrong in the request");
		}
	});
	return false;
}
