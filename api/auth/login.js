export default function handler(req, res) {
  // Ultra simple test - no async, no try/catch, minimal logic
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({
    message: 'Ultra simple login test working!',
    timestamp: new Date().toISOString(),
    platform: 'vercel',
    method: req.method,
    hasBody: !!req.body
  });
}