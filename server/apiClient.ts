/**
 * APICAR API Client
 * Direct API integration with minimal code for reliability
 */

import axios from 'axios';

// API Configuration
const API_KEY = process.env.APICAR_API_KEY || '';
const API_URL = 'https://api.apicar.store/api/history-cars';

/**
 * Get vehicle sales history directly from the APICAR API
 */
export async function getVehicleSalesHistory(make: string, model?: string, page: number = 1, size: number = 25) {
  try {
    // Build URL parameters - only what we absolutely need
    const params = new URLSearchParams();
    params.append('make', make);
    params.append('site', '1'); // Copart
    
    // Add pagination parameters
    params.append('page', page.toString());
    params.append('size', size.toString());
    
    if (model && model !== 'undefined' && model !== '') {
      params.append('model', model);
    }
    
    // Print request URL for debugging
    const requestUrl = `${API_URL}?${params.toString()}`;
    console.log('Requesting from APICAR API:', requestUrl);
    
    // Make the API request
    const response = await axios.get(requestUrl, {
      headers: {
        'api-key': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    // Return the data
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('APICAR API error:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
}