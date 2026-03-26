import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// Basic protection
const API_KEY = process.env.API_KEY;

app.use((req, res, next) => {
  if (req.headers["x-api-key"] !== API_KEY) return res.status(403).send("Forbidden");
  next();
});

// Routes
app.get("/transactions", async (req, res) => {
  const result = await pool.query("SELECT * FROM transactions ORDER BY id DESC");
  res.json(result.rows);
});

app.post("/transactions", async (req, res) => {
  const { amount, category, date } = req.body;
  await pool.query(
    "INSERT INTO transactions (amount, category, date) VALUES ($1,$2,$3)",
    [amount, category, date]
  );
  res.sendStatus(200);
});

app.delete("/transactions/:id", async (req, res) => {
  await pool.query("DELETE FROM transactions WHERE id=$1", [req.params.id]);
  res.sendStatus(200);
});

app.put("/transactions/:id", async (req, res) => {
  const { amount, category, date } = req.body;
  await pool.query(
    "UPDATE transactions SET amount=$1, category=$2, date=$3 WHERE id=$4",
    [amount, category, date, req.params.id]
  );
  res.sendStatus(200);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on ${port}`));