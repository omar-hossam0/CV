import express from 'express';
import multer from 'multer';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

dotenv.config();

const app = express();
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer to store files temporarily in memory or disk
const storage = multer.memoryStorage();
const upload = multer({ storage });

const ML_HOST = process.env.ML_HOST || 'http://127.0.0.1:5000';
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        message: 'ML Node Bridge running',
        endpoints: {
            predict: 'POST /match (form-data: cvFile)'
        },
        mlService: ML_HOST
    });
});

// Receive CV and forward to FastAPI
app.post('/match', upload.single('cvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'cvFile is required' });
        }

        // Forward as multipart/form-data to FastAPI
        const formData = new FormData();
        formData.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });

        const response = await axios.post(`${ML_HOST}/predict`, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        res.status(200).json(response.data);
    } catch (err) {
        const status = err.response?.status || 500;
        const data = err.response?.data || { success: false, error: err.message };
        res.status(status).json(data);
    }
});

app.listen(PORT, () => {
    console.log(`ML Node Bridge listening on http://localhost:${PORT}`);
});
