// backend/src/controllers/uploadController.js
async function uploadImage(req, res) {
  if (!req.file) {
    throw new Error('No file uploaded');
  }

  // Get the base URL from environment or construct it
  const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

  res.json({
    ok: true,
    imageUrl,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
}

module.exports = {
  uploadImage
};