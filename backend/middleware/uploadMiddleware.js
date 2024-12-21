// backend/middleware/uploadMiddleware.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// We'll store uploads in a temp folder first
const upload = multer({ dest: 'temp_uploads/' });

/**
 * Moves each uploaded file to "ClientDataUpload/<projectId>"
 */
function moveUploadedFiles(projectId, files) {
  // Create the directory if it doesn't exist
  const projectDir = path.join(__dirname, '..', '..', 'ClientDataUpload', String(projectId));
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  // Move each file from temp_uploads to projectDir
  files.forEach(file => {
    const tempPath = file.path;
    const newPath = path.join(projectDir, file.originalname);
    fs.renameSync(tempPath, newPath);
  });
}

module.exports = {
  upload,
  moveUploadedFiles
};
