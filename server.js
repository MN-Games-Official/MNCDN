const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Supabase client setup
const supabase = createClient('https://utgmmvofnginuwvzajig.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0Z21tdm9mbmdpbnV3dnphamlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE5NTczMzksImV4cCI6MjAzNzUzMzMzOX0.YWH5Ceiz0OI_h8M6wG1M2UsDXM_43i5UdopmYLGO7aE');

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
  const { data, error } = await supabase.storage.from('mncdn').upload(req.file.filename, fs.readFileSync(filePath), {
    contentType: req.file.mimetype
  });

  if (error) {
    return res.status(500).send(error.message);
  }

  const fileUrl = supabase.storage.from('mncdn').getPublicUrl(req.file.filename).publicURL;

  // Insert metadata into database
  const { data: insertData, error: insertError } = await supabase
    .from('cdn_files')
    .insert([{ filename: req.file.filename, file_url: fileUrl }]);

  if (insertError) {
    return res.status(500).send(insertError.message);
  }

  res.json({ fileUrl });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
