import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// -------------------------------
// CONFIG
// -------------------------------
const API_TOKEN = "ProspectScanVR88X2";
const SERPAPI_KEY = "7e6d4c3b17383f9172ab76133c8a6e63a6d869ab513d67c54427947050bf5983";
const MAX_RESULTS = 30;

// -------------------------------
// ROUTE PRINCIPALE
// -------------------------------
app.get("/search", async (req, res) => {
  try {
    const token = req.query.token;
    const q = req.query.q || "agence événementielle france";
    const limit = Math.min(parseInt(req.query.limit || 10), MAX_RESULTS);

    if (token !== API_TOKEN) {
      return res.json({ error: true, message: "Invalid token", results: [] });
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
      message: "Worker crashed: " + e.message,
      results: []
    });
  }
});

// -------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Worker running on port " + PORT));
