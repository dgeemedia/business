// backend/src/controllers/uploadController.js
async function uploadImage(req, res) {
  if (!req.file) throw new Error('No file uploaded');

  // Cloudinary gives us the URL directly on req.file.path
  const imageUrl = req.file.path;

  res.json({
    ok: true,
    imageUrl,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
}

module.exports = { uploadImage };