var districtLayer = L.geoJSON().addTo(map);
var selectedDistrict = null; // Initialize selectedDistrict variable

// Define a style for the highlighted district
var highlightStyle = {
    color: '#ff7800',
    weight: 5,
    opacity: 1,
};

// Populate the dropdown with districts for the selected state
function fetchDistricts(selectedState) {
    var wfsUrl = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:Total_Schools&" +
        "outputFormat=application/json&propertyName=District&CQL_FILTER=State='" + selectedState + "'";

    fetch(wfsUrl)
        .then(response => response.json())
        .then(data => {
            var districts = data.features.map(feature => feature.properties.District);
 
            // Remove duplicate districts
            districts = Array.from(new Set(districts));
 
            // Populate the dropdown menu
            var dropdownMenu = $('#districtDropdownMenu');
            dropdownMenu.empty(); // Clear existing items

            districts.forEach(District => {
                var dropdownItem = $('<a>', {
                    class: 'dropdown-item',
                    href: '#',
                    text: District
                }).on('click', function () {
                    selectedDistrict = District; // Store the selected district
                    zoomToDistrict(District);
                });

                dropdownMenu.append(dropdownItem);
            });
        })
        .catch(error => console.error('Error fetching districts from GeoServer:', error));
}

function zoomToDistrict(districtName) {
    // Use WFS GetFeature request to get the bounds of the selected district
    var url = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:Total_Schools&" +
        "outputFormat=application/json&cql_filter=District='" + districtName + "'";

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.features.length > 0) {
                // Clear any existing layers
                districtLayer.clearLayers();
                
                // Add the new GeoJSON layer with the highlight style
                districtLayer = L.geoJSON(data, { style: highlightStyle }).addTo(map);

                // Get the bounds of the selected district

                // Fit the map to the bounds with some padding
            } else {
                // Display a message if no features found for the selected district
                alert("No information available for the selected district.");
            }
        })
        .catch(error => console.error('Error fetching district bounds:', error));
}

document.addEventListener('DOMContentLoaded', function () {
    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
 
    // Get the dropdown button and menu
    var districtDropdownButton = $('#districtDropdown');
    var districtDropdownMenu = $('#districtDropdownMenu');
    var maxTextLength = 14;

    // Add event listener to each dropdown item
    districtDropdownMenu.on('click', '.dropdown-item', function (event) {
        // Update the button text with the selected item
        var selectedOption = $(event.target);
        var truncatedText = truncateText(selectedOption.text(), maxTextLength);
        districtDropdownButton.text(truncatedText);
    });

    var districtSearchInput = $('#districtSearchInput');
    
    districtSearchInput.on('input', function () {
        var searchTerm = districtSearchInput.val().trim().toLowerCase();
        var regex = new RegExp('^' + searchTerm);

        $('.dropdown-item', districtDropdownMenu).each(function () {
            var item = $(this);
            var text = item.text().trim().toLowerCase();
            var match = regex.test(text);
            item.css('display', match ? 'block' : 'none');
        });

        var noDataItem = $('#noDataDistrictItem');
        var matchingItems = $('.dropdown-item:visible', districtDropdownMenu);

        noDataItem.css('display', matchingItems.length === 0 ? 'block' : 'none');
    });

    districtDropdownButton.on('click', function () {
        districtSearchInput.focus();
    });
});

