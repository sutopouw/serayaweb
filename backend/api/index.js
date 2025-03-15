module.exports = async (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to SerayaWeb API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      winners: '/api/public/winners'
    },
    timestamp: new Date().toISOString()
  });
}; 