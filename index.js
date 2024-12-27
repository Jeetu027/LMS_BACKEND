import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import cors from "cors";//give access to http localhost ma use kerva


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





app.get("/", async (req,res) =>{
    const data = await db.query("SELECT * from courses");
    const result = data.rows; //
    res.json(result);
});

app.get("/search", async (req,res) =>{
    const data = await db.query("SELECT c_name from courses");
    const result = data.rows; //
    res.json(result);
});

app.post("/courseid", async (req, res) => {
    const { courseId } = req.body;
    try {
        const result = await db.query(
            "SELECT * FROM courses WHERE id = $1",
            [courseId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});


app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

