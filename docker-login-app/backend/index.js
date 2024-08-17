const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 7000;
const secretKey = "supersecretkey"; // For JWT token signing

app.use(bodyParser.json());

const pool = new Pool({
  user: "postgres",
  host: "db", // PostgreSQL service name
  database: "usersdb",
  password: "postgres123",
  port: 5432,
});

// Path to the users.json file
const usersFilePath = path.join(__dirname, 'user-data', 'users.json');

// Create the users table if it doesn't exist
pool.query(
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
  );`,
  (err) => {
    if (err) {
      console.error("Error creating users table:", err);
    } else {
      console.log("Users table is ready");
      // Read users from the users.json file and insert them into the database
      initializeUsers();
    }
  }
);

// Function to register users from users.json
async function initializeUsers() {
  try {
    const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [
        user.username,
        hashedPassword,
      ]);
    }
    console.log("Users registered");
  } catch (err) {
    console.error("Error registering users:", err);
  }
}

// Register a new user
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [
      username,
      hashedPassword,
    ]);
    res.status(201).send("User registered");
  } catch (err) {
    res.status(400).send("Error registering user");
  }
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    if (result.rows.length === 0) return res.status(400).send("User not found");

    const validPass = await bcrypt.compare(password, result.rows[0].password);
    if (!validPass) return res.status(400).send("Invalid password");

    res.send("Logged in");
  } catch (err) {
    res.status(400).send("Error logging in");
  }
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(400).send("Error fetching users");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

