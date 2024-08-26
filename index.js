const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;

        // Upload the file to Supabase Storage
        const { data, error } = await supabase.storage
            .from('cdn-bucket')
            .upload(`public/${file.filename}`, file.buffer);

        if (error) throw error;

        const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/cdn-bucket/${file.filename}`;

        // Insert file metadata into the database
        const { data: dbData, error: dbError } = await supabase
            .from('cdn_files')
            .insert([{ filename: file.originalname, url }]);

        if (dbError) throw dbError;

        res.json({ success: true, url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/files', async (req, res) => {
    try {
        const { data, error } = await supabase.from('cdn_files').select('*');

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message
