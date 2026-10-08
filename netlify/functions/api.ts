import serverless from 'serverless-http';
import app from '../../backend/src/app.js';

// Serverless handler for Express app on Netlify Functions
export const handler = serverless(app);
