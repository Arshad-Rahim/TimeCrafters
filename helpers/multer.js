



const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the storage for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../public/uploads/product-variants");

        // Check if the directory exists, if not, create it
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true }); // Create the directory recursively
        }

        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Use Date.now() to ensure unique filenames
        cb(null, Date.now() + "-" + file.originalname);
    }
});

// Create the multer upload instance
const upload = multer({
    storage: storage,
});

// Export the upload instance for use in your routes
module.exports = upload;