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
