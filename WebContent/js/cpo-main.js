/* cpo-main.js
 *  created 2012.11.06 by jebb.q.stewart@noaa.gov
 *  
 *  Created for Climate.gov Data Interoperability Pilot Project web page
 *  Main functions and variables used by web site
 * 
 *  history:
 *  2012.11.06 Initial Release (jqs)
 *  2012.02.12 Added Legend and Download Dialogs (jqs)
 */

$(document).ready(function() {

	$("#layers-dialog").dialog({
		autoOpen: false,
		title: "Manage Layers",
		width: 700,
		height: 400,
		minWidth: 500,
		minHeight: 400,
		position: { my: 'left top', at: 'right middle', of: '#map' }
	});

	$("#tools-dialog").dialog({
		autoOpen: false,
		title: "Manage Display",
		width: 700,
		height: 400,
		minWidth: 500,
		minHeight: 400,
		position: { my: 'left top', at: 'right bottom', of: '#map' }
	});
	

	$("#layers-dialog-button").button({ icons: { primary: "ui-icon-image"}, text: false});
	$("#tools-dialog-button").button({ icons: { primary: "ui-icon-gear"}, text: false});

	$("#layers-dialog-button").button().click(function() {
		$( "#layers-dialog" ).dialog( "open" );
		return false;
	});

	$("#tools-dialog-button").button().click(function() {
		$( "#tools-dialog" ).dialog( "open" );
		return false;
	});

	$("#tools-dialog").append('<button id="select-tool">Enable Select</button>');

	//Add functions to buttons
	$("#select-tool").click(function(){
		if ( this.innerText == "Enable Select") {
			activate_query_tool(true);
			this.innerText = "Disable Select";
		} else if ( this.innerText == "Disable Select") {
			activate_query_tool(false);
			this.innerText = "Enable Select";
		}	
	});


	$("#tools-dialog").append('<br />\n<hr width="90%"/>\n');
	$("#tools-dialog").append('<label for="from">From</label>');
	$("#tools-dialog").append('<input type="text" id="from" name="from" />');
	$("#tools-dialog").append('<label for="to">to</label>');
	$("#tools-dialog").append('<input type="text" id="to" name="to" />');
	$("#tools-dialog").append('<button id="time-filter-tool">Filter Time</button>');

	$( "#from" ).datepicker({
		defaultDate: "+1w",
		changeMonth: true,
		yearRange: "1850:2015",
		changeYear: true,
		onClose: function( selectedDate ) {
			$( "#to" ).datepicker( "option", "minDate", selectedDate );
		}
	});
	$( "#to" ).datepicker({
		defaultDate: "+1w",
		changeMonth: true,
		changeYear: true,
		yearRange: "1850:2015",
		onClose: function( selectedDate ) {
			$( "#from" ).datepicker( "option", "maxDate", selectedDate );
		}
	});

	$("#time-filter-tool").click(function(){
		var start =  $( "#from" ).datepicker( "getDate" );
		var end = $( "#to" ).datepicker( "getDate" );
		if ( this.innerText == "Filter Time") {
			apply_time_filter(start, end);
			//activate_select_tool(true);
			this.innerText == "Clear Time";
		} else if ( this.innerText == "Clear Time") {
			apply_time_filter(start, end);
			//activate_select_tool(false);
			this.innerText == "Filter Time";
		}	
	});

	$( "#download-message" ).dialog({
		modal: true,
		autoOpen: false,
		width: 500,
		buttons: {
			Ok: function() {
				$( this ).dialog( "close" );
			}
		}
	});
	$( "#loading-message" ).dialog({
		modal: true,
		autoOpen: false,
		resizable: false,
		dialogClass: "alert"
	});
});

Date.prototype.addHours = function(h) {    
	this.setTime(this.getTime() + (h*60*60*1000)); 
	return this;   
};

Date.prototype.addMinutes = function(m) {    
	this.setTime(this.getTime() + (m*60*1000)); 
	return this;   
};

Date.prototype.addDays = function(d) {    
	this.setTime(this.getTime() + (d*24*60*60*1000)); 
	return this;   
};

Date.prototype.addMonths = function(m) {    
	this.setMonth(this.getMonth() + m); 
	return this;   
};
