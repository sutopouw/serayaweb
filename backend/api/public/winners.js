const { getDB } = require('../../db');

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
    const [winners] = await pool.execute(
      'SELECT winner_username, role_reward, created_at FROM links WHERE is_used = TRUE ORDER BY created_at DESC'
    );

    res.json({
      status: 'success',
      data: winners,
      count: winners.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error fetching public winners:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch winners',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
}; 