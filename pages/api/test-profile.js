export default async function handler(req, res) {
  return res.json({ 
    message: 'Test endpoint working',
    method: req.method,
    timestamp: new Date().toISOString()
  });
}
