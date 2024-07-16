// HealthLayer:
addschoolLayer(); // Add health layer
function addschoolLayer() {
    var boundariesLayer; // Declare the state boundaries layer variable
    if (!boundariesLayer) {
        boundariesLayer = L.tileLayer.wms("http://localhost:8080/geoserver/India/wms", {
            layers: "India:Schools_States",
            format: 'image/png',
            transparent: true,
            version: '1.1.1',
            opacity: 0.8,
        }).addTo(map);
    }
    fetchNationalLevelData();

    // Remove the wmsLayer initialization here
}

fetchStates();
var districtLayer = L.geoJSON().addTo(map);
var selectedState = null; // Initialize selectedState variable
var wmsLayer = null; // Initialize wmsLayer variable

function fetchStates(layerName) {
    var wfsUrl = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:Total_Schools&" +
        "outputFormat=application/json&propertyName=State";

    fetch(wfsUrl)
        .then(response => response.json())
        .then(data => {
            var states = data.features.map(feature => feature.properties.State);

            // Remove duplicate states
            states = Array.from(new Set(states));

            // Populate the dropdown menu
            var dropdownMenu = $('#stateDropdownMenu');
            dropdownMenu.empty(); // Clear existing items

            states.forEach(state => {
                var dropdownItem = $('<a>', {
                    class: 'dropdown-item',
                    href: '#',
                    text: state
                }).on('click', function () {
                    selectedState = state; // Store the selected state
                    filterByState();
                    zoomToState(state);
                    addHealthLegend();

                });

                dropdownMenu.append(dropdownItem);
            });
        })
        .catch(error => console.error('Error fetching states from GeoServer:', error));
}

function zoomToState(stateName) {
    // Use WFS GetFeature request to get the bounds of the selected state
    var url = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:Total_Schools&" +
        "outputFormat=application/json&cql_filter=State='" + stateName + "'";

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.features.length > 0) {
                // Get the bounds of the selected states
                var bounds = L.geoJSON(data).getBounds();

                // Fit the map to the bounds with some padding
                map.fitBounds(bounds);
            } else {
                // Display a message if no features found for the selected state
                alert("No information available for the selected state.");
            }
        })
        .catch(error => console.error('Error fetching state bounds:', error));
}

function filterByState() {
    if (selectedState) {
        var query = "State='" + selectedState + "'";
        if (!wmsLayer) {
            // Create wmsLayer only when a state is selected
            wmsLayer = L.tileLayer.wms("http://localhost:8080/geoserver/India/wms", {
                layers: "India:Total_Schools",
                format: 'image/png',
                transparent: true,
                version: '1.1.1',
                opacity: 0.8,
            }).addTo(map);
        }

        wmsLayer.setParams({ cql_filter: query });
        wmsLayer.bringToFront();

    }

    fetchDistricts(selectedState);
}

document.addEventListener('DOMContentLoaded', function () {
    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Get the dropdown button and menu
    var stateDropdownButton = $('#stateDropdown');
    var stateDropdownMenu = $('#stateDropdownMenu');
    var maxTextLength = 14; // Adjust the maximum length as needed

    // Add event listener to each dropdown item
    stateDropdownMenu.on('click', '.dropdown-item', function (event) {
        // Update the button text with the selected item
        var selectedOption = $(event.target);
        var truncatedText = truncateText(selectedOption.text(), maxTextLength);
        stateDropdownButton.text(truncatedText);
        // Call function to fetch data and generate chart with the updated selected state
        fetchStateLevelData();
        // fetchDataAndGenerateChart();
    });

    var stateSearchInput = $('#stateSearchInput');

    stateSearchInput.on('input', function () {
        var searchTerm = stateSearchInput.val().trim().toLowerCase();
        var regex = new RegExp('^' + searchTerm);

        $('.dropdown-item', stateDropdownMenu).each(function () {
            var item = $(this);
            var text = item.text().trim().toLowerCase();
            var match = regex.test(text);
            item.css('display', match ? 'block' : 'none');
        });

        var noDataItem = $('#noDataStateItem');
        var matchingItems = $('.dropdown-item:visible', stateDropdownMenu);

        noDataItem.css('display', matchingItems.length === 0 ? 'block' : 'none');
    });

    stateDropdownButton.on('click', function () {
        stateSearchInput.focus();
    });
});

// map.on('click', function (e) {
//     var latlng = e.latlng;

//     // Use WFS GetFeature request to get information about the clicked point only for the selected state
//     var url = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:Total_Schools&" +
//         "outputFormat=application/json&cql_filter=INTERSECTS(geom, POINT(" + latlng.lng + " " + latlng.lat + ")) AND State='" + selectedState + "'";

//     fetch(url)
//         .then(response => response.json())
//         .then(data => {
//             // Check if features are present
//             if (data.features.length > 0) {
//                 // Assuming the GeoServer response includes district and state information
//                 var id = data.features[0].properties.Dist_ID;
//                 var districtName = data.features[0].properties.District;
//                 var stateName = data.features[0].properties.State;
//                 var HC = data.features[0].properties.ud_2122_1;

//                 // Create and display the popup
//                 var popupContent = "ID: " + id + "<br>District: " + districtName + "<br>State: " + stateName + "<br>No.of Schools " + HC;
//                 var popup = L.popup()
//                     .setLatLng(latlng)
//                     .setContent(popupContent)
//                     .openOn(map);
//             }
//         })
//         .catch(error => console.error('Error fetching information:', error));
// });


// Function to fetch national level data
function fetchNationalLevelData() {
    var wfsUrl = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:Total_Schools&" +
        "outputFormat=application/json&propertyName=State,ud_2122_1";

    fetch(wfsUrl)
        .then(response => response.json())
        .then(data => {
            var stateData = data.features.map(feature => feature.properties);

            // Aggregate data for national level
            var Data = aggregateDataByState(stateData);

            // Generate national level bar chart  
            generateBarChart(Data);
        })
        .catch(error => console.error('Error fetching national level data:', error));
}

// Function to fetch state level data
function fetchStateLevelData() {
    var wfsUrl = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:Total_Schools&" +
        "outputFormat=application/json&propertyName=District,ud_2122_1&CQL_FILTER=State='" + selectedState + "'";

    fetch(wfsUrl)
        .then(response => response.json())
        .then(data => {
            var stateData = data.features.map(feature => feature.properties);

            // Generate state level bar chart
            generateBarChart(stateData);
            // Update the chart with new data
            updateBarChart(stateData);
        })
        .catch(error => console.error('Error fetching state level data:', error));
}

// Function to aggregate data by state
function aggregateDataByState(stateData) {
    var Data = {};

    // Iterate through the stateData array
    stateData.forEach(data => {
        var stateName = data.State;
        var HC_Count = data.ud_2122_1;

        // If stateName already exists in aggregatedData, add HC_Count to existing count
        if (Data[stateName]) {
            Data[stateName] += HC_Count;
        } else {
            // Otherwise, create a new entry for the stateName
            Data[stateName] = HC_Count;
        }
    });

    // Convert aggregatedData object to array format for Chart.js
    var aggregatedArray = [];
    for (var stateName in Data) {
        aggregatedArray.push({ State: stateName, ud_2122_1: Data[stateName] });
    }

    return aggregatedArray;
}

// Function to update the bar chart
function updateBarChart(stateData) {
    // Retrieve existing chart instance
    var barChart = Chart.getChart('barChart');

    // Update chart data and labels
    barChart.data.labels = stateData.map(data => data.District);
    barChart.data.datasets[0].data = stateData.map(data => data.ud_2122_1);

    // Update the chart
    barChart.update();
}

// Function to generate bar chart
function generateBarChart(data) {
    var ctx = document.getElementById('barChart').getContext('2d');

    if (!ctx) {
        console.error('Canvas context not found!');
        return;
    }

    try {
        var barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(data => data.District || data.State), // Use state or district name depending on the level
                datasets: [{
                    label: 'Schools',
                    data: data.map(data => data.ud_2122_1),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                    x: {
                        ticks: {
                            minTicksLimit: 3,
                            maxTicksLimit: 8 // Adjust this value to reduce the number of x-axis ticks
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom', // Position the legend at the bottom
                        align: 'end'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error generating bar chart:', error);
    }
}
