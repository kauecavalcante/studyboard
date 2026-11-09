export const config = {
  port: Number(process.env.PORT) || 3001,
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017',
  dbName: process.env.DB_NAME || 'studyboard',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

export const MAX_MESSAGE_LENGTH = 2000;
export const PAGE_SIZE = 50;
