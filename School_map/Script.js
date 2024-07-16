// Initialize Leaflet map
//var map = L.map('map').setView([20.5937, 78.9629], 5);

var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
});

var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'});

var openTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
});

var map = L.map('map', {
    center: [20.5937, 81.9629],
    zoom: 5,
    layers: [osm]
});
var baseMaps = {
    "OpenStreetMap": osm,
    // "OpenStreetMap.HOT": osmHOT,
    // "OpenTopoMap": openTopoMap
};

// Define the bounds for your map
var southWest = L.latLng(-4, 59),
    northEast = L.latLng(39.52, 111),
    bounds = L.latLngBounds(southWest, northEast);

// Set the maximum bounds for the map
map.setMaxBounds(bounds);

// Optionally, restrict the map view to the defined bounds
map.on('drag', function () {
    map.panInsideBounds(bounds, { animate: false });
});
map.on('zoomend', function () {
    if (map.getBoundsZoom(bounds) > map.getMaxZoom()) {
        map.setZoom(map.getMaxZoom());
    }
});
var layerControl = L.control.layers(baseMaps).addTo(map);
var wmsLayer = null;
// Initialize variables
var districtLayer = null;
var selectedState = null;
//scale
L.control.scale({
    position: 'bottomleft'
}).addTo(map);


document.getElementById('layers').selectedIndex = 1;

 
function resetMapView() {
    map.setView([20.5937, 81.9629], 5);
    if (wmsLayer) {
        map.removeLayer(wmsLayer); // Remove wmsLayer if it's added
        wmsLayer = null; // Set wmsLayer back to null
    }
    if (legend) {
        map.removeControl(legend);
        legend = null;
    }
    
}

function Home_button() {
    // Remove any open pop-ups
    map.closePopup();
    
    // Close the chart if it's open
    var chartContainer = document.getElementById('chart-container');
    if (chartContainer.style.display !== 'none') {
        toggleChart(); // Call the toggleChart function to hide the chart

    }
    // Reset map view
    map.setView([20.5937, 81.9629], 5);
    // Remove any added layers
    removeCurrentLayer();
    // Reset dropdown selection
    document.getElementById('layers').selectedIndex = 0;
    legendAdded = false; // Reset the flag

    // Remove legend if it exists
    if (legend) {
        map.removeControl(legend);
        legend = null;
    }
}

// Function to display coordinates on mousemove
map.on('mousemove', function (e) { 
    document.getElementById('coordinateDisplay').innerHTML = 'Lat: ' + e.latlng.lat.toFixed(4) + ' , Long: ' + e.latlng.lng.toFixed(4);
});

document.getElementById('layers').addEventListener('change', function () {
    var selectedValue = this.value;
    if (selectedValue === 'Health') {
        removeCurrentLayer(); // Remove current layer
        resetMapView();
        addschoolLayer(); // Add health layer
        
        fetchStates('Health2'); // Fetch states for health centers layer
    } else if (selectedValue === 'District') {
        removeCurrentLayer(); // Remove current layer
        resetMapView();
        addDistrictLayer(); // Add district layer
        fetchStates('district_boundary'); // Fetch states for district boundaries layer
    } else {
       
    }
    
    // Reset selectedState when changing layers
    selectedState = null;
});

function removeCurrentLayer() {
    // Remove WMS layer if it exists
    if (wmsLayer) {
        map.removeLayer(wmsLayer);
        wmsLayer = null;
    }


    // Remove districtLayer if it exists
    if (districtLayer) {
        map.removeLayer(districtLayer);
        districtLayer = null;
    }
      
    selectedState = null;// Reset selectedState to null
}

// function togglePanel() {
//     var panel = document.getElementById("sidebar");
//     if (panel.style.display === "none") {
//         panel.style.display = "block";
//     } else {
//         panel.style.display = "none";
//     }
// }


// // Create a custom control
// var customControl = L.Control.extend({
//     options: {
//         position: 'topleft',
//         // Custom styles
//         style: {
//             backgroundColor: 'white',
//             color: 'black',
//             border: '2px solid gray',
//             borderRadius: '5px',
//             cursor: 'pointer',
//             fontFamily: 'Arial, sans-serif',
//             fontSize: '16px',
//             fontWeight: 'bold'
//         }
//     },
//     onAdd: function (map) {
//         // Include Font Awesome CSS dynamically
//         var faCss = document.createElement('link');
//         faCss.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
//         faCss.rel = 'stylesheet';
//         document.head.appendChild(faCss);
//         // Create a container div for the button
//         var container = L.DomUtil.create('div', 'custom-control-container');
//         // Apply custom styles
//         container.style.backgroundColor = this.options.style.backgroundColor;
//         container.style.color = this.options.style.color;
//         container.style.border = this.options.style.border;
//         container.style.borderRadius = this.options.style.borderRadius;
//         container.style.cursor = this.options.style.cursor;
//         container.style.fontFamily = this.options.style.fontFamily;
//         container.style.fontSize = this.options.style.fontSize;
//         container.style.fontWeight = this.options.style.fontWeight;
        
//         // Create the button element 
//         var button = L.DomUtil.create('button', 'custom-control-button', container);
//         button.innerHTML = '<i class="fas fa-bars"></i>';
        
//         // Define button behavior
//         button.onclick = function () {
//             togglePanel(); // Call your togglePanel function to toggle the sidebar
//         };
        
//         return container;
//     }
// });

// // Add the custom control to the map
// map.addControl(new customControl());

// Function to toggle chart visibility
function toggleChart() {
    var chartContainer = document.getElementById('chart-container');
    var toggleButton = document.getElementById("toggleChartButton");
    var Icon = document.createElement('link');
        Icon.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        Icon.rel = 'stylesheet';
        document.head.appendChild(Icon);
    if (chartContainer.style.display === 'none') {
        chartContainer.style.display = 'block';
        toggleButton.innerHTML = '<i class="fa fa-bar-chart" style="font-size:16px;color:rgb(250, 246, 246)"></i> Hide Chart';
    } else {
        chartContainer.style.display = 'none';
        toggleButton.innerHTML = '<i class="fa fa-bar-chart" style="font-size:16px;color:rgb(250, 246, 246)"></i> Show Chart';
    }
}

// Attach event listener to the button
document.getElementById('toggleChartButton').addEventListener('click', function () {
    toggleChart();
});
// Define a custom control for displaying coordinates
var coordinateDisplayControl = L.Control.extend({
    options: {
        position: 'bottomright',
        
    },
    onAdd: function(map) {
        // Create a container div for the coordinates display
        var container = L.DomUtil.create('div');
        container.id = 'coordinateDisplay'; // Set id for the container
        container.style.backgroundColor = 'white';
        container.style.padding = '5px';
        container.style.border = '1px solid #ccc';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.fontSize = '12px';
        container.style.position = 'bottomright';
        container.style.width = 'auto'; // Adjust width dynamically
        container.style.margin = '10px'; // Margin from legend and attribution
        
        return container;
    }
});
map.addControl(new coordinateDisplayControl());

