var map = L.map('map').setView([8.926317, 124.158692], 7);
var currentMarker = null;
let hourlyChart;
let directionChart;
let periodChart;

// OpenStreetMap tile layer
var streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    zoom: 16,
    minZoom: 7,
    maxZoom: 10,
}).addTo(map);

// OpenTopoMap tile layer
var topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    zoom: 7,
    minZoom: 7,
    maxZoom: 10,
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
});

// Layer control to switch between street map and topographic map
var baseMaps = {
    "Street Map": streetLayer,
    "Topographic Map": topoLayer
};
L.control.layers(baseMaps).addTo(map);

// Define custom icon for marker
var customIcon = L.icon({
    iconUrl: '../static/assets/marker.png', // Replace with your custom marker image path
    iconSize: [38, 45], // Size of the icon
    iconAnchor: [22, 45], // Point of the icon which will correspond to marker's location
    popupAnchor: [-3, -45] // Point from which the popup should open relative to the iconAnchor
});

// Initialize empty charts
function initCharts() {
    const hourlyCtx = document.getElementById('hourlyWindWaveChart').getContext('2d');
    hourlyChart = new Chart(hourlyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Hourly Wind Wave Height',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            }
        }
    });

    const directionCtx = document.getElementById('windWaveDirectionChart').getContext('2d');
    directionChart = new Chart(directionCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Hourly Wind Wave Direction',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            }
        }
    });

    const periodCtx = document.getElementById('windWavePeriodChart').getContext('2d');
    periodChart = new Chart(periodCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Hourly Wind Wave Period',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            }
        }
    });
}

// Function to create or update a chart
function createOrUpdateChart(chart, ctx, labels, data, label) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

// Function to handle click on the map
function handleMapClick(e) {
    var lat = e.latlng.lat.toFixed(6);
    var lng = e.latlng.lng.toFixed(6);

    fetchWindWaveData(lat, lng);
}

function fetchWindWaveData(lat, lng) {
    fetch('/get-stored-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateWindWaveData(data.current);

            // Get the forecast for one hour later (this part remains the same)
            let nextHourData = getNextHourForecast(data.hourly, data.current.time);

            // If data exists, update the notification container
            if (nextHourData) {
                updateNotificationWithForecast(nextHourData);
            }

            // Update latitude and longitude in the container (if needed)
            document.getElementById('latitude').innerText = lat;
            document.getElementById('longitude').innerText = lng;

            // Remove previous marker if it exists
            if (currentMarker) map.removeLayer(currentMarker);

            // Add new marker with custom icon
            currentMarker = L.marker([lat, lng], { icon: customIcon }).addTo(map)
                .bindPopup(`Latitude: ${lat}<br>Longitude: ${lng}`)
                .openPopup();

            // Plot hourly wind wave data (updated for the new forecast)
            createOrUpdateChart(
                hourlyChart,
                hourlyChart.ctx,
                data.hourly.time,
                data.hourly.wind_wave_height,
                'Hourly Wind Wave Height'
            );

            // Plot hourly direction data
            const directionData = data.hourly.wind_wave_direction || Array(data.hourly.time.length).fill(null);
            createOrUpdateChart(
                directionChart,
                directionChart.ctx,
                data.hourly.time,
                directionData,
                'Hourly Wind Wave Direction'
            );

            // Plot hourly period data
            const periodData = data.hourly.wind_wave_period || Array(data.hourly.time.length).fill(null);
            createOrUpdateChart(
                periodChart,
                periodChart.ctx,
                data.hourly.time,
                periodData,
                'Hourly Wind Wave Period'
            );

            // Analyze safety for the current conditions
            analyzeSafety(data.current.wind_wave_height, data.current.wind_wave_direction, data.current.wind_wave_period);

            // Update the notification with the current date and time
            updateNotificationWithCurrentTime(); // This will update the time in the notification

        } else {
            alert('No data found for this location.');
        }
    })
    .catch(error => console.error('Error:', error));
}

// Helper function to get forecasted values for the next hour
function getNextHourForecast(hourlyData, currentTime) {
    let nextHourIndex = hourlyData.time.findIndex(time => time > currentTime);
    if (nextHourIndex !== -1) {
        return {
            wind_wave_height: hourlyData.wind_wave_height[nextHourIndex],
            wind_wave_direction: hourlyData.wind_wave_direction[nextHourIndex],
            wind_wave_period: hourlyData.wind_wave_period[nextHourIndex],
            time: hourlyData.time[nextHourIndex],
        };
    }
    return null; // Return null if no forecast is available
}

// Update the notification with the forecasted data
function updateNotificationWithForecast(forecastData) {
    // Format the forecast time using the correct timestamp
    const forecastTime = formatDateTime(forecastData.time);

    // Convert the wind direction (in degrees) to compass direction
    const windDirection = getWindDirection(forecastData.wind_wave_direction);

    // Safety note based on wave height
    let safetyNote = "⚠️ Stay alert to wave conditions when near the water!";
    if (forecastData.wind_wave_height > 3) {
        safetyNote = "⚠️ High wave height expected! Exercise caution when near or on the water.";
    }

    // Adjust the wave height description based on the forecasted value
    let waveHeightDescription = "Moderate";
    if (forecastData.wind_wave_height > 3) {
        waveHeightDescription = "High";
    } else if (forecastData.wind_wave_height < 1) {
        waveHeightDescription = "Low";
    }

    // Adjust the wave period description based on the forecasted value
    let wavePeriodDescription = "Normal Frequency";
    if (forecastData.wind_wave_period > 10) {
        wavePeriodDescription = "Long Frequency";
    } else if (forecastData.wind_wave_period < 6) {
        wavePeriodDescription = "Short Frequency";
    }

    // Update the notification container with the forecasted values
    document.getElementById('forecast-time').innerText = forecastTime;
    document.getElementById('wave-height').innerText = `${forecastData.wind_wave_height} meters (${waveHeightDescription})`;
    document.getElementById('wave-direction').innerText = `${forecastData.wind_wave_direction}° (${windDirection})`;
    document.getElementById('wave-period').innerText = `${forecastData.wind_wave_period} seconds (${wavePeriodDescription})`;
    document.getElementById('forecast-note').innerText = safetyNote;

    // Show the notification count on the bell
    document.getElementById('notificationCount').style.display = 'inline'; // Make the notification visible
    document.getElementById('notificationCount').innerText = '1'; // Set the notification count
    document.getElementById('notificationBell').classList.add('has-notification'); // Optionally, add a class to style the bell with a red indicator
}

// Function to format the forecast time (example)
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

// Convert wind direction degrees to compass direction (example)
function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((degrees % 360) / 45) % 8);
    return directions[index];
}


// Function to update the notification with the current date and time
function updateNotificationWithCurrentTime() {
    const currentTime = formatDateTime(Date.now() / 1000); // Use current time in seconds
    document.getElementById('forecast-time').innerText = currentTime;
}

// Function to format the timestamp to a readable date (without time)
function formatDateTime(epochTime) {
    const date = new Date(epochTime * 1000); // Convert from seconds to milliseconds
    if (isNaN(date)) {
        return "Invalid Date";
    }

    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };

    const formattedDate = date.toLocaleDateString('en-US', dateOptions);
    
    return ` ${formattedDate}`;
}

// //with time
// // Function to format the timestamp to a readable date and time
// function formatDateTime(epochTime) {
//     const date = new Date(epochTime * 1000); // Convert from seconds to milliseconds
//     if (isNaN(date)) {
//         return "Invalid Date";
//     }

//     const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
//     const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true }; // 12-hour format with minutes

//     const formattedDate = date.toLocaleDateString('en-US', dateOptions);
//     const formattedTime = date.toLocaleTimeString('en-US', timeOptions);

//     return `📅 Date: ${formattedDate} Time: ${formattedTime}`;
// }



// Convert wind direction degrees to compass direction
function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.floor((degrees + 22.5) / 45) % 8;
    return directions[index];
}

// Interval to update the notification time every minute (60000 ms = 1 minute)
setInterval(function() {
    updateNotificationWithCurrentTime(); // Call the function to update the notification time
}, 3600000); // Updates every 1 minute (60000 ms)

// Interval to update the wind wave data every hour (3600000 ms = 1 hour)
setInterval(function() {
    const lat = document.getElementById('latitude').innerText;
    const lng = document.getElementById('longitude').innerText;

    if (lat && lng) {
        fetchWindWaveData(lat, lng); 
    }
}, 3600000); // Updates every 1 hour 



// Update wind wave data in the table
function updateWindWaveData(data) {
    document.getElementById('windHeight').innerText = data.wind_wave_height || 'N/A';
    document.getElementById('windDirection').innerText = data.wind_wave_direction || 'N/A';
    document.getElementById('windPeriod').innerText = data.wind_wave_period || 'N/A';
}

function analyzeSafety(windHeight, windDirection, windPeriod) {
    // Show placeholder message
    const placeholder = document.getElementById('placeholder');
    placeholder.style.display = 'block';

    // Create the analysis prompt
    const prompt = `
        Analyze the following conditions:
        Wind Wave Height: ${windHeight} meters,
        Wind Wave Direction: ${windDirection || "N/A"} degrees,
        Wind Wave Period: ${windPeriod || "N/A"} seconds.
    `;

    // Set the iframe's source to the analysis URL
    const iframeSrc = `https://barmmdrr.com/connect_ai/message?prompt=${encodeURIComponent(prompt)}`;
    const iframe = document.getElementById('nlpIframe');
    iframe.src = iframeSrc;

    // Hide the placeholder when the iframe content is loaded
    iframe.onload = function () {
        placeholder.style.display = 'none';
    };

    // Optional: Handle iframe load errors (if necessary)
    iframe.onerror = function () {
        placeholder.textContent = 'Failed to load data. Please try again later.';
        placeholder.style.color = 'red';
    };
}


// Function to convert wind direction in degrees to compass direction
function getWindDirection(degrees) {
    const directions = [
        { name: 'North', min: 337.5, max: 360 },
        { name: 'North', min: 0, max: 22.5 },
        { name: 'East', min: 22.5, max: 67.5 },
        { name: 'South', min: 67.5, max: 112.5 },
        { name: 'West', min: 112.5, max: 157.5 },
        { name: 'South', min: 157.5, max: 202.5 },
        { name: 'West', min: 202.5, max: 247.5 },
        { name: 'North', min: 247.5, max: 292.5 },
        { name: 'East', min: 292.5, max: 337.5 },
    ];

    for (const dir of directions) {
        if (degrees >= dir.min && degrees < dir.max) {
            return dir.name;
        }
    }
    return 'Unknown Direction';
}

// Add event listener to the map for clicks
map.on('click', handleMapClick);

// Initialize charts
initCharts();

  // JavaScript to toggle the notification dropdown
  document.getElementById('notificationIcon').addEventListener('click', function(event) {
    event.preventDefault();  // Prevent the default action (like navigation)

    // Get the dropdown element
    var notificationDropdown = document.getElementById('notificationDropdown');

    // Toggle the display of the dropdown
    if (notificationDropdown.style.display === 'none' || notificationDropdown.style.display === '') {
        notificationDropdown.style.display = 'block';  // Show the form
    } else {
        notificationDropdown.style.display = 'none';   // Hide the form
    }
});

    // Listen for form submission
    document.getElementById('saveLocationForm').addEventListener('submit', function(event) {
        event.preventDefault();  // Prevent the form from submitting normally

        // Get the values from the form inputs
        var latitude = document.getElementById('latitudeInput').value;
        var longitude = document.getElementById('longitudeInput').value;

        // Send the data via AJAX (POST request)
        fetch(saveLocationUrl, {  // Use the rendered URL for the save-location route
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                latitude: latitude,
                longitude: longitude
            })
        })
        .then(response => response.json())
        .then(data => {
            // Handle the response (for example, show a message)
            alert(data.message);
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred while saving your location.");
        });
    });

