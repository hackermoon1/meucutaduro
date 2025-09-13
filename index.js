export default function handler(req, res) {
  res.status(200).json({
    status: 'online',
    message: 'API is running. Use the /api/khan endpoint for requests.'
  });
}
