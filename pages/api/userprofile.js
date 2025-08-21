export default function handler(req, res) {
  res.json({ 
    message: 'User profile endpoint working',
    method: req.method,
    timestamp: new Date().toISOString()
  });
}