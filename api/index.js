import serverless from 'serverless-http';
import app from '../server.js';

// Vercel expects a default export for Node serverless functions.
export default serverless(app);
