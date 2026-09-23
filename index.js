const express = require("express");
const cors = require("cors");
const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const sql = neon(process.env.DATABASE_URL);

app.get("/", (req, res) => {
    res.json({
        message: "Link Saver API is running",
    });
});

app.get("/api/links", async (req, res) => {
    try {
        const links = await sql`
            SELECT *
            FROM links
            ORDER BY created_at DESC
        `;

        res.json(links);
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

        const links = await sql`
            INSERT INTO links (title, url)
            VALUES (${title}, ${url})
            RETURNING *
        `;

        res.status(201).json(links[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Server error",
        });
    }
});

module.exports = app;
