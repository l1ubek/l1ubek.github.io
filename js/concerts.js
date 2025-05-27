
const API_ENDPOINTS = {
    upcoming: 'https://my-json-server.typicode.com/typicode/demo/posts', 
    artists: 'https://jsonplaceholder.typicode.com/users',
    venues: 'https://jsonplaceholder.typicode.com/albums'
};

const loadingIndicator = document.getElementById('loadingIndicator');
const responseData = document.getElementById('responseData');
const responseTitle = document.getElementById('responseTitle');
const loadUpcomingBtn = document.getElementById('loadUpcomingBtn');
const loadArtistsBtn = document.getElementById('loadArtistsBtn');
const loadVenuesBtn = document.getElementById('loadVenuesBtn');

loadingIndicator.style.display = 'none';

/**

 * @param {string} endpoint 
 * @param {string} title
 */
function fetchData(endpoint, title) {

    loadingIndicator.style.display = 'block';
    responseData.textContent = '';
    responseTitle.textContent = title;


    fetch(endpoint)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {

            displayData(data);
        })
        .catch((error) => {

            displayError(error);
        })
        .finally(() => {

            loadingIndicator.style.display = 'none';
        });
}

/**

 * @param {string} endpoint - The API endpoint to fetch data from
 * @param {string} title - The title to display for the response
 */
function fetchDataWithXHR(endpoint, title) {
    // Show loading indicator
    loadingIndicator.style.display = 'block';
    responseData.textContent = '';
    responseTitle.textContent = title;


    const xhr = new XMLHttpRequest();
    

    xhr.open('GET', endpoint, true);
    

    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {

            const data = JSON.parse(xhr.responseText);
            displayData(data);
        } else {

            displayError(new Error(`HTTP error! Status: ${xhr.status}`));
        }

        loadingIndicator.style.display = 'none';
    };
    
    xhr.onerror = function () {
        displayError(new Error('Network error occurred'));

        loadingIndicator.style.display = 'none';
    };
    

    xhr.send();
}

/**

 * @param {Object} data 
 */
function displayData(data) {

    const formattedData = JSON.stringify(data, null, 4);
    

    responseData.textContent = formattedData;
}

/**

 * @param {Error} error 
 */
function displayError(error) {
    responseData.textContent = `Error: ${error.message}`;
}


loadUpcomingBtn.addEventListener('click', () => {
    fetchData(API_ENDPOINTS.upcoming, 'Upcoming Concerts');
});

loadArtistsBtn.addEventListener('click', () => {
    fetchData(API_ENDPOINTS.artists, 'Featured Artists');
});

loadVenuesBtn.addEventListener('click', () => {
    fetchDataWithXHR(API_ENDPOINTS.venues, 'Popular Venues');
});


document.addEventListener('DOMContentLoaded', () => {
    fetchData(API_ENDPOINTS.upcoming, 'Upcoming Concerts');
});