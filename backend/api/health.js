const { getDB } = require('../db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const pool = getDB();
    const [result] = await pool.execute('SELECT 1 as test');
    
    res.json({
      status: 'success',
      message: 'API is healthy',
      database: 'connected',
      test_query: result,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(503).json({
      status: 'error',
      message: 'API is experiencing issues',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
}; 