/**
 * Clean API Routes - Simplified and Reliable
 * Uses the new cache service for operational integrity
 */

import type { Express, Request, Response } from "express";
import { cacheService } from "./cacheService";
import { getVehicleSalesHistory } from "./apiClient";

export function setupApiRoutes(app: Express) {
  /**
   * OpenAI API Key Validation Endpoint
   */
  app.get('/api/openai/validate', async (req: Request, res: Response) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ 
          valid: false, 
          message: 'OpenAI API key not configured' 
        });
      }
      
      res.json({ 
        valid: true, 
        message: 'OpenAI API key is configured' 
      });
    } catch (error) {
      console.error('OpenAI validation error:', error);
      res.status(500).json({ 
        valid: false, 
        message: 'Failed to validate OpenAI API key' 
      });
    }
  });

  /**
   * Copart Sales History Endpoint - Clean Cache System
   */
  app.get('/api/sales-history', async (req: Request, res: Response) => {
    try {
      const { make, model, yearFrom, yearTo, auctionDateFrom, auctionDateTo, site = 1, page = 1, size = 25 } = req.query;
      
      // Use cache service for efficient data handling
      const cacheKey = { make: make as string, model: model as string, site: parseInt(site as string) };
      
      if (await cacheService.hasCachedData(cacheKey, parseInt(page as string), parseInt(size as string))) {
        const cachedData = await cacheService.getCachedData(cacheKey, parseInt(page as string), parseInt(size as string));
        return res.json(cachedData);
      }
      
      // Fetch from API if no cache
      const apiResults = await getVehicleSalesHistory({
        make: make as string,
        model: model as string,
        yearFrom: yearFrom ? parseInt(yearFrom as string) : undefined,
        yearTo: yearTo ? parseInt(yearTo as string) : undefined,
        site: parseInt(site as string),
        auctionDateFrom: auctionDateFrom as string,
        auctionDateTo: auctionDateTo as string,
        page: parseInt(page as string),
        size: parseInt(size as string)
      });
      
      await cacheService.storeResults(cacheKey, apiResults);
      res.json(apiResults);
    } catch (error) {
      console.error('Sales history error:', error);
      res.status(500).json({ error: 'Failed to fetch sales history' });
    }
  });

  /**
   * IAAI Sales History Endpoint - Clean Cache System
   */
  app.get('/api/iaai/sales-history', async (req: Request, res: Response) => {
    try {
      const { make, model, yearFrom, yearTo, auctionDateFrom, auctionDateTo, page = 1, size = 25 } = req.query;
      
      // Use cache service for IAAI (site = 2)
      const cacheKey = { make: make as string, model: model as string, site: 2 };
      
      if (await cacheService.hasCachedData(cacheKey, parseInt(page as string), parseInt(size as string))) {
        const cachedData = await cacheService.getCachedData(cacheKey, parseInt(page as string), parseInt(size as string));
        return res.json(cachedData);
      }
      
      // Fetch from API if no cache
      const apiResults = await getVehicleSalesHistory({
        make: make as string,
        model: model as string,
        yearFrom: yearFrom ? parseInt(yearFrom as string) : undefined,
        yearTo: yearTo ? parseInt(yearTo as string) : undefined,
        site: 2, // IAAI
        auctionDateFrom: auctionDateFrom as string,
        auctionDateTo: auctionDateTo as string,
        page: parseInt(page as string),
        size: parseInt(size as string)
      });
      
      await cacheService.storeResults(cacheKey, apiResults);
      res.json(apiResults);
    } catch (error) {
      console.error('IAAI sales history error:', error);
      res.status(500).json({ error: 'Failed to fetch IAAI sales history' });
    }
  });

  /**
   * Live Copart Lot Lookup Endpoint
   */
  app.get('/api/live-copart/:lotId', async (req: Request, res: Response) => {
    try {
      const { lotId } = req.params;
      
      const response = await fetch(`https://api.apicar.store/api/cars/${lotId}?site=1`, {
        headers: {
          'api-key': process.env.APICAR_API_KEY || '',
          'accept': '*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Live Copart lookup error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch live Copart data' 
      });
    }
  });

  /**
   * Live IAAI Lot Lookup Endpoint
   */
  app.get('/api/live-iaai/:lotId', async (req: Request, res: Response) => {
    try {
      const { lotId } = req.params;
      
      const response = await fetch(`https://api.apicar.store/api/cars/${lotId}?site=2`, {
        headers: {
          'api-key': process.env.APICAR_API_KEY || '',
          'accept': '*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Live IAAI lookup error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch live IAAI data' 
      });
    }
  });

  /**
   * Find Comparable Vehicles Endpoint - Direct Implementation
   */
  app.post('/api/find-comparables', async (req: Request, res: Response) => {
    try {
      const { make, model, year, damage, mileage } = req.body;
      
      // Get comparable vehicles from both platforms
      const copartResults = await getVehicleSalesHistory({
        make,
        model,
        yearFrom: year - 2,
        yearTo: year + 2,
        site: 1,
        page: 1,
        size: 50
      });
      
      const iaaiResults = await getVehicleSalesHistory({
        make,
        model,
        yearFrom: year - 2,
        yearTo: year + 2,
        site: 2,
        page: 1,
        size: 50
      });
      
      res.json({
        copart: copartResults,
        iaai: iaaiResults,
        total: (copartResults?.length || 0) + (iaaiResults?.length || 0)
      });
    } catch (error) {
      console.error('Find comparables error:', error);
      res.status(500).json({ error: 'Failed to find comparable vehicles' });
    }
  });
}