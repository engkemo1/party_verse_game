/**
 * Structured Logging Layer
 * 
 * Provides timestamped and categorized logs.
 * Essential for production debugging when deployed to Render/Railway.
 */

const getTimestamp = () => new Date().toISOString();

const logger = {
  info: (context, message) => {
    console.log(`[\x1b[36mINFO\x1b[0m] [${getTimestamp()}] [${context}] ${message}`);
  },
  warn: (context, message) => {
    console.log(`[\x1b[33mWARN\x1b[0m] [${getTimestamp()}] [${context}] ${message}`);
  },
  error: (context, message, error = '') => {
    console.error(`[\x1b[31mERROR\x1b[0m] [${getTimestamp()}] [${context}] ${message}`, error);
  },
  debug: (context, message) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[\x1b[90mDEBUG\x1b[0m] [${getTimestamp()}] [${context}] ${message}`);
    }
  }
};

module.exports = logger;
