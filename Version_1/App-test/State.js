
var wmsLayer = L.tileLayer.wms("http://localhost:8080/geoserver/India/wms", {
    layers: "India:district_boundary",
    format: 'image/png',
    transparent: true,
    version: '1.1.1',
    opacity: 0.5,
}).addTo(map);


 

var districtLayer = L.geoJSON().addTo(map);
var selectedState = null; // Initialize selectedState variable

fetchStates();

function fetchStates() {
    var wfsUrl = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:district_boundary&" +
        "outputFormat=application/json&propertyName=STATE";

    fetch(wfsUrl)
        .then(response => response.json())
        .then(data => {
            var states = data.features.map(feature => feature.properties.STATE);

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
                });

                dropdownMenu.append(dropdownItem);
            });
        })
        .catch(error => console.error('Error fetching states from GeoServer:', error));
}

function zoomToState(stateName) {
    // Use WFS GetFeature request to get the bounds of the selected state
    var url = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:district_boundary&" +
        "outputFormat=application/json&cql_filter=STATE='" + stateName + "'";

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.features.length > 0) {
                // Get the bounds of the selected state
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
        var query = "STATE='" + selectedState + "'";
        wmsLayer.setParams({ cql_filter: query });
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
    var maxTextLength = 13; // Adjust the maximum length as needed

    // Add event listener to each dropdown item
    stateDropdownMenu.on('click', '.dropdown-item', function (event) {
        // Update the button text with the selected item
        var selectedOption = $(event.target);
        var truncatedText = truncateText(selectedOption.text(), maxTextLength);
        stateDropdownButton.text(truncatedText);
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
