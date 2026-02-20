// Vercel Serverless Function wrapper for Express app
const app = require('../backend/src/index.js');

// Export the Express app as a serverless function
module.exports = (req, res) => {
  // Ensure the app handles the request
  return app(req, res);
};