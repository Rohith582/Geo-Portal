// Define a style for the highlighted district
var highlightStyle = {
    color: '#ffffff',
    weight: 5,
    opacity: 1,
};

// Initialize variables
var selectedState = null; 
var selectedDistrict = null; 
var districtLayer = L.geoJSON().addTo(map);
var wmsLayer = null; 
var legendAdded = false;

// Add a click event listener to the map
map.on('click', function (e) {
    var latlng = e.latlng;

    // Fetch state information based on clicked point
    var stateUrl = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:Total_Schools&" +
        "outputFormat=application/json&cql_filter=INTERSECTS(geom, POINT(" + latlng.lng + " " + latlng.lat + "))";

    fetch(stateUrl)
        .then(response => response.json())
        .then(data => {
            if (data.features.length > 0) {
                var stateName = data.features[0].properties.State;
                if (selectedState !== stateName) {
                    selectedState = stateName;
                    selectedDistrict = null; // Reset the selected district
                    districtLayer.clearLayers(); // Clear any highlighted districts
                    filterByState();
                    zoomToState(stateName);
                    fetchStateLevelData();
                    updateStateDropdown(stateName);
                } else {
                    // Fetch district information based on clicked point within the state
                    fetchDistrictInformation(latlng);
                }
            }
        })
        .catch(error => console.error('Error fetching state information:', error));

    // Check if the legend is already added, if not add the health legend
    if (!legendAdded) {
        addHealthLegend(wmsUrl, layerName);
        legendAdded = true; // Set the flag to true once the legend is added
    }
});

// Function to fetch district information
function fetchDistrictInformation(latlng) {
    var districtUrl = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:Total_Schools&" +
        "outputFormat=application/json&cql_filter=INTERSECTS(geom, POINT(" + latlng.lng + " " + latlng.lat + "))";

    fetch(districtUrl)
        .then(response => response.json())
        .then(data => {
            if (data.features.length > 0) {
                var districtName = data.features[0].properties.District;
                selectedDistrict = districtName;
                zoomToDistrict(districtName);
                updateDistrictDropdown(districtName);
                
                // Assuming the GeoServer response includes district and state information
                var id = data.features[0].properties.Dist_ID;
                var districtName = data.features[0].properties.District;
                var stateName = data.features[0].properties.State;
                var HC = data.features[0].properties.ud_2122_1;

                // Create and display the popup
                var popupContent = "ID: " + id + "<br>District: " + districtName + "<br>State: " + stateName + "<br>No. of Schools " + HC;
                var popup = L.popup()
                    .setLatLng(latlng)
                    .setContent(popupContent)
                    .openOn(map);
            }
        })
        .catch(error => console.error('Error fetching district information:', error));
}

// Function to filter by state and update the WMS layer
function filterByState() {
    if (selectedState) {
        var query = "State='" + selectedState + "'";
        if (!wmsLayer) {
            wmsLayer = L.tileLayer.wms("http://localhost:8080/geoserver/India/wms", {
                layers: "India:Total_Schools",
                format: 'image/png',
                transparent: true,
                version: '1.1.1',
                opacity: 0.8,
            }).addTo(map);
        }
        wmsLayer.setParams({ cql_filter: query });
    }
    fetchDistricts(selectedState);
}

// Function to zoom to the selected state
function zoomToState(stateName) {
    var url = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:Total_Schools&" +
        "outputFormat=application/json&cql_filter=State='" + stateName + "'";

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.features.length > 0) {
                var bounds = L.geoJSON(data).getBounds();
                map.fitBounds(bounds);
            } else {
                alert("No information available for the selected state.");
            }
        })
        .catch(error => console.error('Error fetching state bounds:', error));
}

// Function to fetch state level data
function fetchStateLevelData() {
    var wfsUrl = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:Total_Schools&" +
        "outputFormat=application/json&propertyName=District,ud_2122_1&CQL_FILTER=State='" + selectedState + "'";

    fetch(wfsUrl)
        .then(response => response.json())
        .then(data => {
            var stateData = data.features.map(feature => feature.properties);
            generateBarChart(stateData);
            updateBarChart(stateData);
        })
        .catch(error => console.error('Error fetching state level data:', error));
}

// Function to zoom to the selected district
function zoomToDistrict(districtName) {
    var url = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:Total_Schools&" +
        "outputFormat=application/json&cql_filter=District='" + districtName + "'";

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.features.length > 0) {
                districtLayer.clearLayers();
                districtLayer = L.geoJSON(data, { style: highlightStyle }).addTo(map);
            } else {
                alert("No information available for the selected district.");
            }
        })
        .catch(error => console.error('Error fetching district bounds:', error));
}

// Function to update the state dropdown menu with the selected state
function updateStateDropdown(stateName) {
    var stateDropdownButton = $('#stateDropdown');
    stateDropdownButton.text(stateName);
}

// Function to update the district dropdown menu with the selected district
function updateDistrictDropdown(districtName) {
    var districtDropdownButton = $('#districtDropdown');
    districtDropdownButton.text(districtName);
}
