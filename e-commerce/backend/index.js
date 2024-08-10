const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();
const port = 3000;

// Database connection pool.
const pool = new Pool({
  user: "postgres",
  host: "db", // Updated to match the service name in docker-compose.yml
  database: "e-commerce", // Updated to match the POSTGRES_DB value
  password: "postgres123",
  port: 5432,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create the shipping table if it doesn't exist.
pool.query(
  `
  CREATE TABLE IF NOT EXISTS shipping (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    status VARCHAR(50) NOT NULL
  );
`,
  (err) => {
    if (err) {
      console.error("Error creating table:", err);
    }
  }
);

// Route to add a new shipping order.
app.post("/add-order", async (req, res) => {
  const { order_id, address, status } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO shipping (order_id, address, status) VALUES ($1, $2, $3) RETURNING *",
      [order_id, address, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error inserting order:", err);
    res.status(500).send("Server error");
  }
});

// Route to get all shipping orders.
app.get("/orders", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM shipping");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send("Server error");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

