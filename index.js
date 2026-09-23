const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.get("/", (req, res) => {
    res.json({
        message: "Link Saver API is running",
    });
});

app.get("/api/links", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM links ORDER BY created_at DESC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Server error",
        });
    }
});

app.post("/api/links", async (req, res) => {
    try {
        const { title, url } = req.body;

        const result = await pool.query(
            "INSERT INTO links (title, url) VALUES ($1, $2) RETURNING *",
            [title, url]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Server error",
        });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
