// Constants for API endpoints
const API_ENDPOINTS = {
    upcoming: 'https://my-json-server.typicode.com/typicode/demo/posts', // Mock API for upcoming concerts
    artists: 'https://jsonplaceholder.typicode.com/users', // Mock API for artists
    venues: 'https://jsonplaceholder.typicode.com/albums' // Mock API for venues
};

// DOM Elements
const loadingIndicator = document.getElementById('loadingIndicator');
const responseData = document.getElementById('responseData');
const responseTitle = document.getElementById('responseTitle');
const loadUpcomingBtn = document.getElementById('loadUpcomingBtn');
const loadArtistsBtn = document.getElementById('loadArtistsBtn');
const loadVenuesBtn = document.getElementById('loadVenuesBtn');

// Hide loading indicator initially
loadingIndicator.style.display = 'none';

/**
 * Fetches data from the specified API endpoint
 * @param {string} endpoint - The API endpoint to fetch data from
 * @param {string} title - The title to display for the response
 */
function fetchData(endpoint, title) {
    // Show loading indicator
    loadingIndicator.style.display = 'block';
    responseData.textContent = '';
    responseTitle.textContent = title;

    // Using fetch API for AJAX request
    fetch(endpoint)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            // Process and display the data
            displayData(data);
        })
        .catch((error) => {
            // Handle errors
            displayError(error);
        })
        .finally(() => {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
        });
}

/**
 * Alternative implementation using XMLHttpRequest
 * @param {string} endpoint - The API endpoint to fetch data from
 * @param {string} title - The title to display for the response
 */
function fetchDataWithXHR(endpoint, title) {
    // Show loading indicator
    loadingIndicator.style.display = 'block';
    responseData.textContent = '';
    responseTitle.textContent = title;

    // Create new XMLHttpRequest
    const xhr = new XMLHttpRequest();
    
    // Configure request
    xhr.open('GET', endpoint, true);
    
    // Set up event handlers
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            // Success
            const data = JSON.parse(xhr.responseText);
            displayData(data);
        } else {
            // Error
            displayError(new Error(`HTTP error! Status: ${xhr.status}`));
        }
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
    };
    
    xhr.onerror = function () {
        displayError(new Error('Network error occurred'));
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
    };
    
    // Send request
    xhr.send();
}

/**
 * Displays the fetched data in the response container
 * @param {Object} data - The data to display
 */
function displayData(data) {
    // Convert data to formatted JSON string
    const formattedData = JSON.stringify(data, null, 4);
    
    // Display the data
    responseData.textContent = formattedData;
}

/**
 * Displays an error message in the response container
 * @param {Error} error - The error to display
 */
function displayError(error) {
    responseData.textContent = `Error: ${error.message}`;
}

// Event Listeners
loadUpcomingBtn.addEventListener('click', () => {
    fetchData(API_ENDPOINTS.upcoming, 'Upcoming Concerts');
});

loadArtistsBtn.addEventListener('click', () => {
    fetchData(API_ENDPOINTS.artists, 'Featured Artists');
});

loadVenuesBtn.addEventListener('click', () => {
    fetchDataWithXHR(API_ENDPOINTS.venues, 'Popular Venues');
});

// Initialize the page with upcoming concerts data
document.addEventListener('DOMContentLoaded', () => {
    fetchData(API_ENDPOINTS.upcoming, 'Upcoming Concerts');
});