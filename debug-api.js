import axios from 'axios';

const API_KEY = process.env.APICAR_API_KEY || 'your-api-key-here';
const API_URL = 'https://api.apicar.store/api/history-cars';

async function testAPIResponse() {
  try {
    const params = new URLSearchParams();
    params.append('make', 'Honda');
    params.append('site', '1');
    params.append('page', '1');
    params.append('size', '5');
    params.append('year_from', '2020');
    params.append('year_to', '2025');
    params.append('sale_date_from', '2025-01-10');
    params.append('sale_date_to', '2025-06-09');

    const requestUrl = `${API_URL}?${params.toString()}`;
    console.log('Request URL:', requestUrl);

    const response = await axios.get(requestUrl, {
      headers: {
        'api-key': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    console.log('Data type:', typeof response.data);
    console.log('Is array:', Array.isArray(response.data));
    console.log('Data keys:', Object.keys(response.data));
    console.log('Full response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPIResponse();