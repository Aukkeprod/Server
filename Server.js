import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// Important pour Make.com
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------------
// CONFIG
// -------------------------------
const API_TOKEN = process.env.API_TOKEN;
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const MAX_RESULTS = 100;

// -------------------------------
// ROUTE PRINCIPALE
// -------------------------------
app.get("/search", async (req, res) => {
  console.log("REQ QUERY =", req.query); // Debug Render

  try {
    const token = req.query.token;
    const q = req.query.q || "agence événementielle france";
    const limit = Math.min(parseInt(req.query.limit || 10), MAX_RESULTS);

    if (token !== API_TOKEN) {
      return res.json({
        error: true,
        message: "Invalid token",
        results: []
      });
    }

    // SerpAPI
    const serpURL =
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}` +
      `&num=${limit}&hl=fr&api_key=${SERPAPI_KEY}`;

    const serpRes = await fetch(serpURL);
    const serpData = await serpRes.json();

    if (!serpData.organic_results) {
      return res.json({
        error: true,
        message: "SerpAPI returned nothing.",
        query: q,
        results: []
      });
    }

    return res.json({
      error: false,
      query: q,
      limit,
      count: serpData.organic_results.length,
      results: serpData.organic_results
    });

  } catch (e) {
    return res.json({
      error: true,
      message: "Server error: " + e.message,
      results: []
    });
  }
});

// -------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Worker running on port " + PORT));
