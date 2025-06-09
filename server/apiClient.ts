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
export async function getVehicleSalesHistory(
  make: string, 
  site: string,
  model?: string, 
  page: number = 1, 
  size: number = 25,
  yearFrom?: number,
  yearTo?: number,
  saleFrom?: string,
  saleTo?: string
) {
  try {
    // Build URL parameters - only what we absolutely need
    const params = new URLSearchParams();
    params.append('make', make);
    params.append('site', site);
    
    // Add pagination parameters
    params.append('page', page.toString());
    params.append('size', size.toString());
    
    // Add year range parameters if provided
    if (yearFrom !== undefined && yearFrom > 0) {
      params.append('year_from', yearFrom.toString());
    }
    
    if (yearTo !== undefined && yearTo > 0) {
      params.append('year_to', yearTo.toString());
    }
    
    // Add sale date range if provided
    if (saleFrom) {
      params.append('sale_date_from', saleFrom);
    }
    
    if (saleTo) {
      params.append('sale_date_to', saleTo);
    }
    
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
    
    // Log the actual response structure for debugging
    console.log('=== APICAR API Response Debug ===');
    console.log('Full response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data type:', typeof response.data);
    console.log('Is response.data an array?', Array.isArray(response.data));
    
    if (typeof response.data === 'object' && response.data !== null) {
      console.log('Response data keys:', Object.keys(response.data));
      if (response.data.data) {
        console.log('response.data.data type:', typeof response.data.data);
        console.log('Is response.data.data an array?', Array.isArray(response.data.data));
        if (Array.isArray(response.data.data)) {
          console.log('response.data.data length:', response.data.data.length);
        }
      }
    }
    
    console.log('First 200 chars of response:', JSON.stringify(response.data).substring(0, 200));
    
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