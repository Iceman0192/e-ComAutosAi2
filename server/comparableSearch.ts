/**
 * Clean Comparable Search Implementation
 * Built from scratch using only verified database columns
 */
import { pool } from './db';

export async function findComparableVehicles(searchParams: any) {
  const { make, model, series, yearFrom, yearTo, damageType, maxMileage } = searchParams;
  
  console.log('Search params received:', { make, model, series, yearFrom, yearTo, damageType, maxMileage });
  
  // Build clean WHERE clause using only existing database columns
  let whereConditions = [];
  let params = [];
  let paramIndex = 1;
  
  if (make) {
    whereConditions.push(`make ILIKE $${paramIndex}`);
    params.push(`%${make}%`);
    paramIndex++;
  }
  
  if (model) {
    whereConditions.push(`model ILIKE $${paramIndex}`);
    params.push(`%${model}%`);
    paramIndex++;
  }
  
  if (series) {
    whereConditions.push(`(series ILIKE $${paramIndex} OR trim ILIKE $${paramIndex})`);
    params.push(`%${series}%`);
    paramIndex++;
  }
  
  if (yearFrom) {
    whereConditions.push(`year >= $${paramIndex}`);
    params.push(yearFrom);
    paramIndex++;
  }
  
  if (yearTo) {
    whereConditions.push(`year <= $${paramIndex}`);
    params.push(yearTo);
    paramIndex++;
  }
  
  if (damageType && damageType !== 'all') {
    whereConditions.push(`vehicle_damage ILIKE $${paramIndex}`);
    params.push(`%${damageType}%`);
    paramIndex++;
  }
  
  if (maxMileage && maxMileage > 0) {
    whereConditions.push(`vehicle_mileage <= $${paramIndex}`);
    params.push(maxMileage);
    paramIndex++;
  }
  
  const whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : '1=1';
  
  console.log('Final query conditions:', whereConditions);
  console.log('Query parameters:', params);
  
  // Query Copart data (site = 1)
  const copartQuery = `
    SELECT * FROM sales_history 
    WHERE ${whereClause} AND site = $${paramIndex}
    ORDER BY sale_date DESC
  `;
  console.log('Copart query:', copartQuery);
  const copartResult = await pool.query(copartQuery, [...params, 1]);
  
  // Query IAAI data (site = 2) 
  const iaaiQuery = `
    SELECT * FROM sales_history 
    WHERE ${whereClause} AND site = $${paramIndex}
    ORDER BY sale_date DESC
  `;
  const iaaiResult = await pool.query(iaaiQuery, [...params, 2]);

  const copartData = copartResult.rows;
  const iaaiData = iaaiResult.rows;
  
  // Calculate statistics
  const calculateStats = (data: any[]) => {
    if (data.length === 0) return { count: 0, avgPrice: 0, minPrice: 0, maxPrice: 0 };
    
    const prices = data
      .filter(item => item.purchase_price && item.purchase_price > 0)
      .map(item => parseFloat(item.purchase_price));
    
    if (prices.length === 0) return { count: data.length, avgPrice: 0, minPrice: 0, maxPrice: 0 };
    
    return {
      count: data.length,
      avgPrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices)
    };
  };

  const copartStats = calculateStats(copartData);
  const iaaiStats = calculateStats(iaaiData);

  return {
    success: true,
    data: {
      comparables: {
        copart: copartData,
        iaai: iaaiData
      },
      statistics: {
        totalFound: copartData.length + iaaiData.length,
        copartCount: copartStats.count,
        iaaiCount: iaaiStats.count,
        copartAvgPrice: copartStats.avgPrice,
        iaaiAvgPrice: iaaiStats.avgPrice,
        priceDifference: Math.abs(copartStats.avgPrice - iaaiStats.avgPrice)
      },
      searchCriteria: { make, model, series, yearFrom, yearTo, damageType, maxMileage }
    }
  };
}