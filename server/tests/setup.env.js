process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.MONGODB_URI = 'mongodb://localhost:27017/careerflow-test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-do-not-use-in-prod';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-do-not-use-in-prod';
process.env.JWT_REFRESH_EXPIRY = '30d';
process.env.COOKIE_SECRET = 'test-cookie-secret';
