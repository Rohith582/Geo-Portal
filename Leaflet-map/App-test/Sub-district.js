var subdistrictLayer = L.geoJSON().addTo(map);
var selectedSubDistrict = null; // Initialize selectedSubDistrict variable

function fetchSubdistricts(selectedDistrict) {
    var wfsUrl = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:subdistrict_boundary&" +
        "outputFormat=application/json&propertyName=TEHSIL&CQL_FILTER=District='" + selectedDistrict + "'";

    fetch(wfsUrl)
        .then(response => response.json())
        .then(data => {
            var subdistricts = data.features.map(feature => feature.properties.TEHSIL);

            // Remove duplicate subdistricts
            subdistricts = Array.from(new Set(subdistricts));

            // Populate the dropdown menu
            var dropdownMenu = $('#subdistrictDropdownMenu');
            dropdownMenu.empty(); // Clear existing items

            subdistricts.forEach(subdistrict => {
                var dropdownItem = $('<a>', {
                    class: 'dropdown-item',
                    href: '#',
                    text: subdistrict
                }).on('click', function () {
                    selectedSubDistrict = subdistrict; // Store the selected sub-district
                    filterBySubDistrict();
                    zoomToSubDistrict(subdistrict);
                });

                dropdownMenu.append(dropdownItem);
            });
        })
        .catch(error => console.error('Error fetching sub-districts from GeoServer:', error));
}

function zoomToSubDistrict(subdistrictName) {
    // Use WFS GetFeature request to get the bounds of the selected sub-district
    var url = "http://localhost:8080/geoserver/India/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=India:subdistrict_boundary&" +
        "outputFormat=application/json&cql_filter=TEHSIL='" + subdistrictName + "'";

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.features.length > 0) {
                // Get the bounds of the selected sub-district
                var bounds = L.geoJSON(data).getBounds();

                // Fit the map to the bounds with some padding
                map.fitBounds(bounds);
            } else {
                // Display a message if no features found for the selected sub-district
                alert("No information available for the selected TEHSIL.");
            }
        })
        .catch(error => console.error('Error fetching sub-district bounds:', error));
}

function filterBySubDistrict() {
    if (selectedSubDistrict) {
        var query = "TEHSIL='" + selectedSubDistrict + "'";
        wmsLayer.setParams({ cql_filter: query });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Get the dropdown button and menu
    var subdistrictDropdownButton = $('#subdistrictDropdown');
    var subdistrictDropdownMenu = $('#subdistrictDropdownMenu');
    var maxTextLength = 13;

    // Add event listener to each dropdown item
    subdistrictDropdownMenu.on('click', '.dropdown-item', function (event) {
        // Update the button text with the selected item
        var selectedOption = $(event.target);
        var truncatedText = truncateText(selectedOption.text(), maxTextLength);
        subdistrictDropdownButton.text(truncatedText);
    });

    var subdistrictSearchInput = $('#subdistrictSearchInput');
    
    subdistrictSearchInput.on('input', function () {
        var searchTerm = subdistrictSearchInput.val().trim().toLowerCase();
        var regex = new RegExp('^' + searchTerm);

        $('.dropdown-item', subdistrictDropdownMenu).each(function () {
            var item = $(this);
            var text = item.text().trim().toLowerCase();
            var match = regex.test(text);
            item.css('display', match ? 'block' : 'none');
        });

        var noDataItem = $('#noDatasubDistrictItem');
        var matchingItems = $('.dropdown-item:visible', subdistrictDropdownMenu);

        noDataItem.css('display', matchingItems.length === 0 ? 'block' : 'none');
    });

    subdistrictDropdownButton.on('click', function () {
        subdistrictSearchInput.focus();
    });
});
