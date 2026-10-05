import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Craft AI Backend running on http://localhost:${PORT}`);
  console.log(`✨ Environment: ${process.env.NODE_ENV || 'development'}`);
});
