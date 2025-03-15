const { getDB } = require('../db');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log('Attempting to fetch winners...');
    const pool = getDB();
    
    // Test database connection first
    const [testResult] = await pool.execute('SELECT 1 as test');
    console.log('Database connection test:', testResult);

    const [winners] = await pool.execute(
      'SELECT winner_username, role_reward, created_at FROM links WHERE is_used = TRUE ORDER BY created_at DESC'
    );
    console.log(`Found ${winners.length} winners`);

    return res.status(200).json({
      status: 'success',
      data: winners,
      count: winners.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error fetching winners:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch winners',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      timestamp: new Date().toISOString()
    });
  }
}; 