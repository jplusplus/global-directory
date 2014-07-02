
/*
 Geocoding
 ----------------------*/
 
var map;
var layerGroup;
var markers;
var fetchedAddresses = new Object();
var mapQuestApiKey = "Fmjtd|luur206a20%2Cbn%3Do5-9at004"; // Open Steps APIKey, change please
var geocodeApiURL="http://www.mapquestapi.com/geocoding/v1/address?key="+mapQuestApiKey+"&country=#country#&city=#city#";

var initializeMap = function() {
  
  // Init Map
  map = L.map('map').setView([13.4061, 52.5192], 1);
        mapLink = 
            '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        L.tileLayer(
            'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; ' + mapLink,
            maxZoom: 8,
            }).addTo(map);
  
  markers = new L.MarkerClusterGroup();
  map.addLayer(markers);
    
  // Disable wheel zoom
  map.scrollWheelZoom.disable();
  
}

// Calls the geocoding webservice for an article and adds the marker on the map when found. If it is the last one, set the map bounds so all markers are visible.
var codeAddressFromArticle = function(context,article,last) {

	var addressToGeocode = article.country+', '+article.city;	

	// If the address was not already fetched, do it
	if (!fetchedAddresses[addressToGeocode]){
	
		// replace placeholders in the url
		var finalGeocodeApiURL = geocodeApiURL.replace('#city#',article.city);	
		finalGeocodeApiURL = finalGeocodeApiURL.replace('#country#',article.country);	
		
		//console.log("Fetching address on: "+finalGeocodeApiURL);		
			
		$.getJSON( finalGeocodeApiURL, function( data ) {	
							
			if (data.info.statuscode == 0) {									
			
				// Store fetched address
				fetchedAddresses[addressToGeocode] = data.results[0].locations[0].latLng.lat+","+data.results[0].locations[0].latLng.lng;
			
				// Add marker
				var marker = new L.marker(new L.latLng(data.results[0].locations[0].latLng.lat,data.results[0].locations[0].latLng.lng));
				setupMarkerWithArticle(context,marker,article,last);				
			}						
		
		});
	
	}else{
	
		// Extract coordinates from map
		var latLng = fetchedAddresses[addressToGeocode].split(",");				
		
		//console.log("Fetched address with coordinates: "+latLng[0]+" "+latLng[1]);		
		
		var marker = new L.marker(new L.latLng(latLng[0],latLng[1]));		
		setupMarkerWithArticle(context,marker,article,last);	
			
	}	
	
		
	
}

// Utility method to bind the popup of the marker and add it to the layer.
var setupMarkerWithArticle = function(context,marker,article,last){

	marker.bindPopup(context._renderArticlePopupHtml(article));

 	markers.addLayer(marker);
 	
 	if (last){
		map.fitBounds(markers.getBounds(),{padding: [50,50]});		     			     			     	 	
	}	

}

/*--------------------
  HELPERS
--------------------*/

var clearLayers = function(){

  //layerGroup.clearLayers();
  markers.clearLayers();
  
};

