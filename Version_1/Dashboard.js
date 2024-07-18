// Initialize Leaflet map
var map = L.map('map').setView([20.5937, 78.9629], 4);

// Add a base map layer (street map)
var streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add a satellite map layer
var satelliteLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'
});

// Initially, add the street map layer
streetLayer.addTo(map);

// Function to toggle between basemap and satellite map
function toggleMap() {
    if (map.hasLayer(streetLayer)) {
        map.removeLayer(streetLayer);
        satelliteLayer.addTo(map);
    } else {
        map.removeLayer(satelliteLayer);
        streetLayer.addTo(map);
    }
    wmsLayer.bringToFront();
}

// Function to reset map view
function resetMapView() {
    map.setView([20.5937, 78.9629], 4);
}

// Function to display coordinates on mousemove
map.on('mousemove', function (e) {
    document.getElementById('coordinateDisplay').innerHTML = 'Lat: ' + e.latlng.lat.toFixed(4) + ' , Long: ' + e.latlng.lng.toFixed(4);
});

map.on('click', function (e) {
    var latlng = e.latlng;
    // Handle click event if needed
   

    // Use WFS GetFeature request to get information about the clicked point only for the selected state
    var url = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:district_boundary&" +
        "outputFormat=application/json&cql_filter=INTERSECTS(geom, POINT(" + latlng.lng + " " + latlng.lat + ")) AND STATE='" + selectedState + "'";

    fetch(url)
        .then(response => response.json())
        .then(data => {
            districtLayer.clearLayers(); // Clear previous layers

            if (data.features.length > 0) {
                // Assuming the GeoServer response includes district and state information
                var districtName = data.features[0].properties.District;
                var stateName = data.features[0].properties.STATE;
                var subdistName = data.features[0].properties.TEHSIL;

                // Create and display the popup
                var popup = L.popup()
                    .setLatLng(latlng)
                    .setContent("Sub-district:" + subdistName+ "<br>District: " + districtName + "<br>State: " + stateName)
                    .openOn(map);

                // Add a new layer for the clicked district

                // Fade the popup after 30 seconds using CSS transitions
                setTimeout(function () {
                    popup._container.style.transition = "opacity 1s ease-out";
                    popup._container.style.opacity = 0;

                    setTimeout(function () {
                        map.closePopup();
                    }, 1000); // 1 second (adjust as needed)
                }, 9000); // 30 seconds
            } else {
                // Display a message if no features found for the selected state and clicked point
                
            }
        })
        .catch(error => console.error('Error fetching district information:', error));
});


