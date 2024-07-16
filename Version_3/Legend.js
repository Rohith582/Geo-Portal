// Initialize legend variable
var legend = null;

// Function to add legend to the map using GetLegendGraphic
function addHealthLegend(wmsUrl, layerName) {
    // Create legend control
    legend = L.control({ position: 'bottomright' });

    // Add legend to the map
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'legend-container');
        div.innerHTML += '<div class="legend-title">Legend</div>';
        
        // Construct the URL for GetLegendGraphic
        var legendUrl = wmsUrl + 
            '?REQUEST=GetLegendGraphic' +
            '&VERSION=1.0.0' +
            '&FORMAT=image/png' +
            '&LAYER=' + layerName;
        
        // Add the legend image to the div
        div.innerHTML += '<div class="legend"><img src="' + legendUrl + '" alt="Legend"></div>';

        return div;
    };

    // Add legend control to the map
    legend.addTo(map);
}

// Example usage
var wmsUrl = "http://localhost:8080/geoserver/India/wms";
var layerName = "India:Total_Schools";
