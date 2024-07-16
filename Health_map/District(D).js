document.addEventListener('DOMContentLoaded', function () {
    // Function to fetch districts for the selected state
    function fetchDistricts(selectedState) {
        var wfsUrl = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:district_boundary&" +
            "outputFormat=application/json&CQL_FILTER=STATE='" + selectedState + "'";

        fetch(wfsUrl)
            .then(response => response.json())
            .then(data => {
                var districts = data.features.map(feature => feature.properties.District);

                // Remove duplicate districts
                districts = Array.from(new Set(districts));

                // Populate the dropdown menu
                var dropdownMenu = $('#districtDropdownMenu');
                dropdownMenu.empty(); // Clear existing items

                districts.forEach(district => {
                    var dropdownItem = $('<a>', {
                        class: 'dropdown-item',
                        href: '#',
                        text: district
                    }).on('click', function () {
                        selectedDistrict = district; // Store the selected district
                        filterByDistrict();
                        zoomToDistrict(district);
                    });

                    dropdownMenu.append(dropdownItem);
                });
            })
            .catch(error => console.error('Error fetching districts from GeoServer:', error));
    }

    // Add event listener to state dropdown
    $('#stateDropdownMenu').on('click', '.dropdown-item', function (event) {
        // Update the selected state
        selectedState = $(event.target).text();

        // Populate districts for the selected state
        fetchDistricts(selectedState);
    });


function zoomToDistrict(districtName) {
    // Use WFS GetFeature request to get the bounds of the selected district
    var url = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:district_boundary&" +
        "outputFormat=application/json&cql_filter=District='" + districtName + "'";

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.features.length > 0) {
                // Get the bounds of the selected district
                var bounds = L.geoJSON(data).getBounds();

                // Fit the map to the bounds with some padding
                map.fitBounds(bounds);
            } else {
                // Display a message if no features found for the selected district
                alert("No information available for the selected district.");
            }
        })
        .catch(error => console.error('Error fetching district bounds:', error));
}

function filterByDistrict() {
    if (selectedDistrict) {
        var query = "District='" + selectedDistrict + "'";
        wmsLayer.setParams({ cql_filter: query });
    }
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
});
