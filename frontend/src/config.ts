// Central API configuration - dynamic local backend URL
// Uses the browser's hostname so other devices on the network can connect
const API_BASE_URL = `http://${window.location.hostname}:8080`;

export default API_BASE_URL;
