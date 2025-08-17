export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    platform: 'vercel',
    message: 'Health check working!'
  });
}