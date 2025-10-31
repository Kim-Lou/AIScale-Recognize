import express from 'express';
import { getDb } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, format } from 'date-fns';

const router = express.Router();

/**
 * @api {get} /api/dashboard/today-stats Get today's waste type statistics
 * @apiName GetTodayStats
 * @apiGroup Dashboard
 * @apiDescription Get statistics of waste types collected today
 * 
 * @apiSuccess {Object} stats Today's statistics by waste type
 * @apiSuccess {Object} stats.paper Paper waste statistics
 * @apiSuccess {Number} stats.paper.value Total net weight of paper waste
 * @apiSuccess {Number} stats.paper.change Percentage change from yesterday
 * @apiSuccess {Object} stats.plastic Plastic waste statistics
 * @apiSuccess {Number} stats.plastic.value Total net weight of plastic waste
 * @apiSuccess {Number} stats.plastic.change Percentage change from yesterday
 * @apiSuccess {Object} stats.glass Glass waste statistics
 * @apiSuccess {Number} stats.glass.value Total net weight of glass waste
 * @apiSuccess {Number} stats.glass.change Percentage change from yesterday
 * @apiSuccess {Object} stats.metal Metal waste statistics
 * @apiSuccess {Number} stats.metal.value Total net weight of metal waste
 * @apiSuccess {Number} stats.metal.change Percentage change from yesterday
 */
router.get('/today-stats', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    
    // Get today and yesterday's date range
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const yesterday = subDays(today, 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);
    
    // Log for debugging
    console.log(`Date range for today: ${todayStart.toISOString()} to ${todayEnd.toISOString()}`);
    console.log(`Date range for yesterday: ${yesterdayStart.toISOString()} to ${yesterdayEnd.toISOString()}`);
    
    // Convert to ISO strings for database queries
    const todayStartStr = todayStart.toISOString();
    const todayEndStr = todayEnd.toISOString();
    const yesterdayStartStr = yesterdayStart.toISOString();
    const yesterdayEndStr = yesterdayEnd.toISOString();
    
    // Query for today's statistics by waste type
    const todayStats = db.prepare(`
      SELECT 
        waste_type, 
        SUM(net_weight) as total_weight
      FROM weight_records
      WHERE weighing_time BETWEEN ? AND ?
      GROUP BY waste_type
    `).all(todayStartStr, todayEndStr);
    
    // Query for yesterday's statistics by waste type
    const yesterdayStats = db.prepare(`
      SELECT 
        waste_type, 
        SUM(net_weight) as total_weight
      FROM weight_records
      WHERE weighing_time BETWEEN ? AND ?
      GROUP BY waste_type
    `).all(yesterdayStartStr, yesterdayEndStr);
    
    // Process the results
    const wasteTypes = ['Paper', 'Plastic', 'Glass', 'Metal'];
    const result = {};
    
    // Initialize result with zero values
    wasteTypes.forEach(type => {
      result[type.toLowerCase()] = { value: 0, change: 0 };
    });
    
    // Process today's data
    todayStats.forEach(stat => {
      const type = stat.waste_type.toLowerCase();
      if (wasteTypes.some(w => w.toLowerCase() === type)) {
        result[type].value = parseFloat(stat.total_weight) || 0;
      }
    });
    
    // Create a map of yesterday's stats for easy lookup
    const yesterdayStatsMap = {};
    yesterdayStats.forEach(stat => {
      const type = stat.waste_type.toLowerCase();
      yesterdayStatsMap[type] = parseFloat(stat.total_weight) || 0;
    });
    
    // Calculate change for each waste type
    wasteTypes.forEach(type => {
      const typeLower = type.toLowerCase();
      const todayValue = result[typeLower].value;
      const yesterdayValue = yesterdayStatsMap[typeLower] || 0;
      
      if (yesterdayValue > 0) {
        // Normal case: yesterday has data
        result[typeLower].change = Math.round((todayValue - yesterdayValue) / yesterdayValue * 100);
      } else if (todayValue > 0) {
        // Special case: yesterday has no data but today does
        result[typeLower].change = 100;
      } else {
        // Both yesterday and today have no data
        result[typeLower].change = 0;
      }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching today stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @api {get} /api/dashboard/weekly-customers Get weekly customer rankings
 * @apiName GetWeeklyCustomers
 * @apiGroup Dashboard
 * @apiDescription Get top customers for the current week ranked by total net weight
 * 
 * @apiParam {Number} [limit=15] The maximum number of customers to return
 * 
 * @apiSuccess {Array} customers List of top customers for the week
 * @apiSuccess {String} customers.customer_id Customer ID
 * @apiSuccess {String} customers.customer_name Customer name
 * @apiSuccess {Number} customers.total_net_weight Total net weight collected
 * @apiSuccess {Number} customers.weighing_count Number of weighing records
 */
router.get('/weekly-customers', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const limit = parseInt(req.query.limit) || 15;
    
    // Get this week's date range with locale consideration
    const today = new Date();
    // 手动设置周起始日为周一（1代表周一，0代表周日）
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    // Log for debugging
    console.log(`Week date range: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);
    
    // Query for customer rankings
    const customerRankings = db.prepare(`
      SELECT 
        customer_id,
        customer_name,
        SUM(net_weight) as total_net_weight,
        COUNT(*) as weighing_count
      FROM weight_records
      WHERE weighing_time BETWEEN ? AND ?
      GROUP BY customer_id, customer_name
      ORDER BY total_net_weight DESC
      LIMIT ?
    `).all(weekStart.toISOString(), weekEnd.toISOString(), limit);
    
    // Format the results
    const formattedRankings = customerRankings.map(customer => ({
      customer_id: customer.customer_id,
      customer_name: customer.customer_name,
      total_net_weight: parseFloat(customer.total_net_weight) || 0,
      weighing_count: customer.weighing_count
    }));
    
    res.json(formattedRankings);
  } catch (error) {
    console.error('Error fetching weekly customer rankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
