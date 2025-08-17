export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Test environment variables access
    const envCheck = {
      DATABASE_URL: process.env.DATABASE_URL ? 'CONFIGURED' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'CONFIGURED' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV || 'undefined'
    };

    // For now, return success without database check
    res.status(200).json({
      message: 'Login endpoint ready - environment variables working',
      email: email,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      platform: 'vercel'
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}