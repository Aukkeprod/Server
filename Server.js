import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

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
  try {
    const token = req.query.token;
    const q = req.query.q || "agence événementielle france";
    const limit = Math.min(parseInt(req.query.limit || 10), MAX_RESULTS);

    // -----------------------------
    // Vérification token
    // -----------------------------
    if (!token || token !== API_TOKEN) {
      return res.json({
        error: true,
        message: "Invalid token",
        results: []
      });
    }

    // -----------------------------
    // Vérification clé SerpAPI
    // -----------------------------
    if (!SERPAPI_KEY) {
      return res.json({
        error: true,
        message: "Missing SERPAPI_KEY on server",
        results: []
      });
    }

    // -----------------------------
    // Requête SerpAPI
    // -----------------------------
    const serpURL =
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}` +
      `&num=${limit}&hl=fr&api_key=${SERPAPI_KEY}`;

    const serpRes = await fetch(serpURL);
    const serpData = await serpRes.json();

    // -----------------------------
    // Erreur renvoyée par SerpAPI
    // -----------------------------
    if (serpData.error) {
      return res.json({
        error: true,
        message: `SerpAPI error: ${serpData.error}`,
        query: q,
        results: []
      });
    }

    // -----------------------------
    // Résultats vides
    // -----------------------------
    if (!serpData.organic_results || serpData.organic_results.length === 0) {
      return res.json({
        error: true,
        message: "SerpAPI returned nothing.",
        query: q,
        results: []
      });
    }

    // -----------------------------
    // Réponse finale
    // -----------------------------
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
      message: "Server crashed: " + e.message,
      results: []
    });
  }
});

// -------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Worker running on port " + PORT));
