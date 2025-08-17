export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Debug environment variables
    const envDebug = {
      DATABASE_URL: process.env.DATABASE_URL ? 'CONFIGURED' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'CONFIGURED' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV || 'undefined'
    };

    console.log('🔍 Environment Variables Check:', envDebug);

    // Simple response for testing
    res.status(200).json({
      message: 'Login endpoint working with environment check',
      email: email,
      timestamp: new Date().toISOString(),
      environment: envDebug,
      platform: 'vercel'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}