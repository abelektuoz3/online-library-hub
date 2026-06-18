const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'resource-' + uniqueSuffix + ext);
    }
});

// File filter - ALLOW PDF, VIDEO, AUDIO, IMAGES, DOCUMENTS
const fileFilter = (req, file, cb) => {
    console.log('📎 File type:', file.mimetype);
    console.log('📎 File name:', file.originalname);
    console.log('📎 File size:', file.size);
    
    // Allow all these types
    const allowedTypes = [
        'application/pdf',
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/mp3',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed: ${file.mimetype}. Allowed: PDF, MP4, MP3, WAV, MOV, AVI, JPEG, PNG, DOC, DOCX, PPT, PPTX, TXT`), false);
    }
};

// Create multer instance with larger limit
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

module.exports = upload;