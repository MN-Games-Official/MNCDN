const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Supabase client setup
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Endpoint for file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  const filePath = path.join('uploads', req.file.filename);
  const { data, error } = await supabase.storage.from('your-bucket').upload(req.file.filename, fs.readFileSync(filePath), {
    contentType: req.file.mimetype
  });

  if (error) {
    return res.status(500).send(error.message);
  }

  const fileUrl = supabase.storage.from('your-bucket').getPublicUrl(req.file.filename).publicURL;

  // Insert metadata into database
  const { data: insertData, error: insertError } = await supabase
    .from('files')
    .insert([{ filename: req.file.filename, file_url: fileUrl }]);

  if (insertError) {
    return res.status(500).send(insertError.message);
  }

  res.json({ fileUrl });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
