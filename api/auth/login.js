import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Test Prisma connection
    const prisma = new PrismaClient();
    
    try {
      // Simple test - just try to connect
      await prisma.$connect();
      
      res.status(200).json({
        message: 'Login endpoint with Prisma connection working',
        email: email,
        timestamp: new Date().toISOString(),
        database: 'Connected successfully',
        platform: 'vercel'
      });
      
    } catch (dbError) {
      res.status(500).json({
        error: 'Database connection failed',
        message: dbError.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}