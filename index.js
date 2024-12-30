import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import cors from "cors"; //give access to http localhost ma use kerva

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "ezlearn",
  password: "123456789",
  port: 5432,
});
db.connect();

app.use(cors()); // Allows all origins by default; specify options for more control
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.get("/", async (req,res) =>{
//     const data = await db.query("SELECT * from courses");
//     const result = data.rows; //
//     res.json(result);
// });

app.get("/search", async (req,res) =>{
    const data = await db.query("SELECT course_id,course_title from course_table");
    const result = data.rows;
    res.json(result);
});

app.get("/getcourses", async (req, res) => {
  try {
    const result = await db.query("SELECT * from course_table");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

app.post("/courseid", async (req, res) => {
  const { courseId } = req.body;
  try {
    const result = await db.query("SELECT * FROM courses WHERE id = $1", [
      courseId,
    ]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});


// video content--------------------------------------------------------------------------

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Upload route --- temp diable
app.post('/upload', upload.single('video'), async (req, res) => {
    const { title } = req.body;
    const filepath = `/uploads/${req.file.filename}`;

    try {
        await db.query('INSERT INTO videos (title, filepath) VALUES ($1, $2)', [title, filepath]);
        res.json({ message: 'Video uploaded successfully!', filepath });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});

// Stream video route
app.get('/video/:filename', (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(__dirname, 'uploads', filename);
    

    fs.stat(filepath, (err, stats) => {
        if (err) {
            console.error(err);
            return res.status(404).send('Video not found');
        }

        const range = req.headers.range;
        if (!range) {
            return res.status(400).send('Requires Range header');
        }

        const videoSize = stats.size;
        const CHUNK_SIZE = 10 ** 6; // 1MB
        const start = Number(range.replace(/\D/g, ''));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

        const contentLength = end - start + 1;
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${videoSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': contentLength,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, headers);

        const videoStream = fs.createReadStream(filepath, { start, end });
        videoStream.pipe(res);
    });
});

// Fetch videos 
app.get('/videos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM course_video_table where course_id=$1',[id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});


// video content--------------------------------------------------------------------------

app.listen(port, () => {
  console.log(`Server running on port_number: ${port}`);
});
