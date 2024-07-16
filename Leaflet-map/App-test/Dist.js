var map = L.map('map').setView([22.593, 78.962], 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        var wmsLayer = L.tileLayer.wms("http://localhost:8080/geoserver/India/wms", {
            layers: "India:district_boundary",
            format: 'image/png',
            transparent: true,
            version: '1.1.1',
            opacity: 0.5,
        }).addTo(map);

        var districtLayer = L.geoJSON().addTo(map);
        // Populate the dropdown with states from the WFS
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
                    var dropdownMenu = document.getElementById("stateDropdownMenu");
                    dropdownMenu.innerHTML = ""; // Clear existing items

                    states.forEach(state => {
                        var dropdownItem = document.createElement("a");
                        dropdownItem.classList.add("dropdown-item");
                        dropdownItem.href = "#";
                        dropdownItem.textContent = state;
                        dropdownItem.addEventListener("click", function () {
                            selectedState = state; // Store the selected state
                            filterByState();
                            zoomToState(state);
                        });

                        dropdownMenu.appendChild(dropdownItem);
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
                        map.fitBounds(bounds.pad(0.5));
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
        
        map.on('click', function (e) {
            var latlng = e.latlng;
        
           
        
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
        
                        // Create and display the popup
                        var popup = L.popup()
                            .setLatLng(latlng)
                            .setContent("District: " + districtName + "<br>State: " + stateName)
                            .openOn(map);
        
                        // Add a new layer for the clicked district
                        districtLayer.addData(data);
        
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
                        alert("No information available for the selected state and clicked point.");
                    }
                })
                .catch(error => console.error('Error fetching district information:', error));
        });
        
    }
    