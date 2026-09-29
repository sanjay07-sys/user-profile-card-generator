const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// SQLite database
const db = new sqlite3.Database("./profiles.db", (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

// Create profiles table
db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        bio TEXT NOT NULL,
        skills TEXT NOT NULL,
        linkedin TEXT,
        github TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Home page
app.get("/", (req, res) => {
    res.render("index", {
        profile: null,
        message: null
    });
});

// Process profile form
app.post("/profile", (req, res) => {
    const { name, bio, skills, linkedin, github } = req.body;

    if (!name || !bio || !skills) {
        return res.render("index", {
            profile: null,
            message: "Please fill in Name, Bio and Skills."
        });
    }

    const sql = `
        INSERT INTO profiles (name, bio, skills, linkedin, github)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [name, bio, skills, linkedin || "", github || ""],
        function (err) {
            if (err) {
                console.error(err.message);

                return res.render("index", {
                    profile: null,
                    message: "Unable to save profile."
                });
            }

            const profile = {
                id: this.lastID,
                name,
                bio,
                skills,
                linkedin: linkedin || "",
                github: github || ""
            };

            res.render("index", {
                profile,
                message: "Profile created successfully!"
            });
        }
    );
});

// View saved profiles
app.get("/profiles", (req, res) => {
    db.all(
        "SELECT * FROM profiles ORDER BY created_at DESC",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).send("Database error");
            }

            res.json(rows);
        }
    );
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});