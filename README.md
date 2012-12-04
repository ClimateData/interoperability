Climate.gov Data Interoperability Pilot Project
================

Introduction
------------

The main goal of this pilot initiative is to develop a proof-of-concept, interoperable system for data access and display.  Here, “interoperable” means a browse and access interface that allows the user to locate, display and manipulate data products that are stored in and served from different data centers.  The system is “file format agnostic,” meaning the pilot system will locate and display the data regardless of what format they’re archived in.

Another important goal is to use this pilot initiative to help us define / refine our technical requirements for the Climate.gov Data Interoperability (DI), based upon lessons learned.   

Our main objectives are to:

*  focus on 2 or 3 (or a small number) representative datasets (i.e., we’re not trying to be comprehensive in this pilot);
*  select datasets from at least two different source providers, in accordance with our team’s use-case scenarios;
*  ensure the selected data are available via one of the types of data access services identified in our interoperability system architecture;
*  ensure there are appropriate/compliant metadata about the datasets chosen, and that metadata is available via our discovery service (i.e., GeoPortal); and
*  integrate our search and browse interface with relevant data services and demonstrate working pilot system.  

Requirements
------------

*  Web Server (apache, tomcat, or some other installation)
*  Python (For OpenLayers Proxy.cgi that allows us to request data from servers other than the one hosting this page)
*  Apache Ant (if you want to create a WAR file)
  
Dependencies
------------

Not included in the installation path but required for usage are several javascript libraries which are referenced in the index.html file

*  JQuery (http://jquery.com/)
*  JQuery-UI (http://jqueryui.com/)
*  OpenLayers (http://openlayers.org/)
  
Installation Instructions
-------------------------

### Using Apache

If you are using a regular web server such as Apache, place the content of the 'WebContent' folder in a desired location on the web server. 

     cp -r WebContent /var/www/html/cpodi
     
Now you can hit the main web page using the following url:

     http://localhost/cpodi/index.html
     
### Using Tomcat

To create a WAR file for a Apache Tomcat installation, you need to have Apache Ant installed.  Change to the base directory where the build.xml file is located and run 'ant'

     $ ant
    
This will create an cpodi.war file for installation on your Tomcat server.  Place this file in your Tomcat webapps directory to initialize the web site.  You can access the website through this url:

     http://localhost:8080/cpodi/index.html
     
Site Specific Configuration
---------------------------

By default, this website will use the OpenStreetMaps as the default map layer.  If you have access to a Google Maps API key you can change this behavior by modifying the 'js/cpo-map.js' file.  Follow the comments in the file to change the default map layers. 

By default, this website will search the NEIS (http://www.esrl.noaa.gov/neis) GeoPortal instance for results.  If you wish to use another GeoPortal instance, you will need to modify two files.

1.  First modify the js/cpo-search.js ' file and change the variable geoportal_server to your server's URL. 
2.  OpenLayers requires the 'proxy.cgi' to allow the web application to request data from other sources outside of this server where this application is installed.  Add any additional outside servers to the 'allowed_hosts' variable.
     

Contributing
------------

1. Fork it.
2. Create a branch (`git checkout -b my_markup`)
3. Commit your changes (`git commit -am "Added Snarkdown"`)
4. Push to the branch (`git push origin my_markup`)
5. Open a [Pull Request][1]

    
