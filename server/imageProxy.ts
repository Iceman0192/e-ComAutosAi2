/**
 * Image Proxy Server
 * Fetches auction site images server-side to bypass CORS restrictions
 */
import { Request, Response } from 'express';
import axios from 'axios';

export async function imageProxy(req: Request, res: Response) {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Validate that URL is from trusted auction sites
    const allowedDomains = [
      'cs.copart.com',
      'vis.iaai.com',
      'www.copart.com',
      'www.iaai.com'
    ];
    
    const urlObj = new URL(url);
    if (!allowedDomains.includes(urlObj.hostname)) {
      return res.status(403).json({ error: 'Unauthorized image source' });
    }

    // Fetch the image with proper headers
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': urlObj.hostname.includes('copart') ? 'https://www.copart.com/' : 'https://www.iaai.com/',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });

    // Set proper headers for image response
    res.set({
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    });

    // Pipe the image data to response
    response.data.pipe(res);

  } catch (error) {
    console.error('Image proxy error:', error.message);
    res.status(404).json({ error: 'Image not found' });
  }
}