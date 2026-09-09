import axios from 'axios';

const testCitySearch = async () => {
    try {
        const city = 'lahore';
        console.log(`Testing API for city: ${city}`);
        const response = await axios.get(`http://localhost:5001/api/properties/search?city=${city}`);

        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error details:', error.toJSON ? error.toJSON() : error);
        if (error.response) {
            console.log('Response status:', error.response.status);
            console.log('Response data:', error.response.data);
        } else if (error.request) {
            console.log('No response received (network error likely)');
        }
    }
};

testCitySearch();
