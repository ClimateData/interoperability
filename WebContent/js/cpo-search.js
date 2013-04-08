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
 *  2012.02.12 Added loading dialog to give feedback to user (jqs)
 */

var start = 1;
var num_of_results = 5;
var abstract_cutoff = 300;
var ellipse = "...";
//var geoportal_server = "http://fxnet-dev3:8080/geoportal12/csw";
var geoportal_server = "http://gis.ncdc.noaa.gov/ncpinterop/csw202/discovery";

$(document).ready(function() {

	$("#search-dialog").dialog({
		autoOpen: false,
		title: "Find Data",
		width: 700,
		height: 400,
		minWidth: 500,
		minHeight: 400,
		position: { my: 'left top', at: 'right top', of: '#map' }
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

function get_links(details_url){
	
	$.ajax({
		type : "GET",
		url : details_url,
		dataType : "xml",
		success : function(response) { parse_xml_iso_record(response, details_url); }
		//success : function(xml) {
		//	parse_xml_iso_record(xml);
		//}
	});
}

var record_count = 0;

function parse_xml_iso_record(xml, url){
	
	
	var details_link = "";
	var wms_data_link = "";
	var wfs_data_link = "";
	var wcs_data_link = "";
	var esri_rest_data_link = "";
	var extra_text = "";
	
	var $xml = $(xml);
	
	details_link = url;
	var info = $xml.find('MD_DataIdentification');
	var file_id = $xml.find('fileIdentifier').text().trim();
	if ( file_id != "nhc_hurr_pts" ) {
	//var var_id = $xml.find('fileIdentifier').text().trim();
	var title = info.find('title').first().text().trim();
	var abs = info.find('abstract').first().text().trim();
	
	var text = "<h3>" + title + "</h3>\n";
	var abstract_text = abs;
	if (abstract_text.length > abstract_cutoff) {
		abstract_text = abstract_text.substring(0, abstract_cutoff) + ellipse;
	}
	

	// Find the various links for data and more information

	$xml.find('SV_ServiceIdentification').each(function(index) {
		
		var type = $(this).attr("id");
		var md_service = $(this).find('SV_OperationMetadata');
		var url = md_service.find('URL').text().trim();
		
		
		if (type.toUpperCase().indexOf("WFS") > 0 || url.toUpperCase().indexOf("/WFS?") > 0 ){
			wfs_data_link = url;
		}
		else if ( type.toUpperCase().indexOf("WMS") > 0 || url.toUpperCase().indexOf("/WMS?") > 0 ){
			wms_data_link = url;
		} 
		else if ( type.toUpperCase().indexOf("WCS") > 0 || url.toUpperCase().indexOf("/WCS?") > 0 ){
			wcs_data_link = url;
		} else if ( type.toUpperCase().indexOf("ARCGIS-REST") > 0 || url.toUpperCase().indexOf("ARCGIS/REST") > 0 ) {
			esri_rest_data_link = url;
		}		
		//alert(type + " " + url);
	});
	
	var var_info = {};
	var variables = new Array();
	$xml.find('MI_CoverageDescription').find('dimension').each(function(index){
		var variable = $(this).find('MD_Band').find('MemberName').find('aName').first().text().trim();
	    var description = $(this).find('MD_Band').find('descriptor').find('CharacterString').text().trim();
	    var_info[variable] = description;
	    variables.push(variable);
	});
	
	var var_id = variables[0];
	
	if ( wms_data_link.indexOf("erddap") > 0 ) { 
		var_id = file_id + ":" + var_id;
	}
	
	if ( wms_data_link != "" ) {
		extra_text = '<label for="layer-id-' + record_count + '"><b><i>Select a layer to load</i></b>:</label>';
		extra_text = extra_text + "\n" + '<select id="layer-id-' + record_count + '">';
		for (var i = 0 ; i < variables.length ; i++ ){
			extra_text = extra_text + '<option value="' + variables[i] + '">' + var_info[variables[i]] + '</option>\n';
		}
		extra_text = extra_text + "\n" + '</select>';
	}
	
	var details_text = '<p id="details">' + abstract_text + '<br />' + extra_text + '</p>' ; 



//	Create the buttons for links to more details and to load data
	var linktext = '<p id="item-tools">';
	linktext = linktext + '<button id="details-' + record_count + '">Details</button>';
	if ( wms_data_link != "" ) {
		linktext = linktext +  '<button id="load-data-' + record_count + '">Load</button>';	
	}
	else if ( wfs_data_link != "" ) {
		linktext = linktext +  '<button id="load-data-' + record_count + '">Load</button>';
	} 
	else if ( wcs_data_link != "" ) {
		linktext = linktext +  '<button id="load-data-' + record_count + '">Load</button>';
	} else if ( esri_rest_data_link != "" ) {
		linktext = linktext +  '<button id="load-data-' + record_count + '">Load</button>';
	}


	linktext = linktext + '</p>';
	text = text + '<div id="div_details">' + linktext + details_text + '</div>';
	$( "#results").append(text);

//	Add functions to buttons
	$("#details-" + record_count).click(function(){ 
		window.open(details_link, '_info', '');
		return false;
	});
	if ( wms_data_link != "" ) {
		(function(j, ln, t, r, v) {
			$("#load-data-" + r).click(function(){ 
				load_data(j, "wms", $("#layer-id-" + r).val(), t + " : " + v[$("#layer-id-" + r).val()]);
			});
		})(wms_data_link, var_id, title, record_count, variables);
	}
	else if ( wfs_data_link != "" ) {
		(function(j, ln, t) {
			$("#load-data-" + record_count).click(function(){ 
				load_data(j, "wfs", ln, t);
			});
		})(wfs_data_link, var_id, title);
	} 
	else if ( wcs_data_link != "" ) {
		(function(j, ln, t) {
			$("#load-data-" + record_count).click(function(){
				load_data(j, "wcs", ln, t);
			});
		})(wcs_data_link, var_id, title);
	} else if ( esri_rest_data_link != "" ) {
		(function(j, ln, t) {
			$("#load-data-" + record_count).click(function(){
				load_data(j, "esri_rest", ln, t);
			});
		})(esri_rest_data_link, var_id, title);
	}
	
	$("#results").accordion( "destroy" );
	//Reset the JQuery Accordion				
	$("#results").accordion({
		collapsible: true,
		active: false,
		heightStyle: "fill"
	});	
	
	record_count++;
	}
}




function search(start, num_of_results) {

	record_count = 0;
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
	var server = geoportal_server;
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
				//$("#results").accordion( "destroy" );
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
				for ( var i = 0 ; i < records.records.length; i++ ) {
					for ( c = 0 ; c < records.records[i].references.length; c++ ) {
						if ( records.records[i].references[c].toUpperCase().indexOf("/CSW?") > 0 ){
							details_link = records.records[i].references[c];
							get_links(details_link);
							c = records.records[i].references.length + 10;
						}
					}
				}


					//Uncomment to see full json response
					//$( "#results").append(JSON.stringify( records));
				} else if ( !records || !records.records ) {
					$("#status").empty();
					$("#results").empty();
					$("#status").append("Invalid response returned, unable to access search service!");
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
