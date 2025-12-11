import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const API_TOKEN = process.env.API_TOKEN;
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAX_RESULTS = 20;

// --------------------
// Fonction GPT enrichissement
// --------------------
async function enrichResult(item) {
  const prompt = `
Tu es un agent qui nettoie et enrichit des données de prospection B2B.
À partir d’un résultat Google, transforme-le en JSON structuré.

Données :
${JSON.stringify(item)}

Renvoie STRICTEMENT ce JSON :
{
  "company_name": "",
  "domain": "",
  "website_url": "",
  "emails": [],
  "match_score": 0.0,
  "notes": ""
}
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    }),
  });

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

// --------------------
// ROUTE /search enrichie
// --------------------
app.get("/search", async (req, res) => {
  try {
    if (req.query.token !== API_TOKEN) {
      return res.json({ error: true, message: "Invalid token" });
    }

    const q = req.query.q || "agence événementielle france";
    const limit = Math.min(parseInt(req.query.limit || 10), MAX_RESULTS);

    // Appel SerpAPI
    const serpURL =
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}` +
      `&num=${limit}&hl=fr&api_key=${SERPAPI_KEY}`;

    const serpRes = await fetch(serpURL);
    const serpData = await serpRes.json();

    if (!serpData.organic_results) {
      return res.json({ error: true, message: "SerpAPI returned nothing.", results: [] });
    }

    // 🔥 Enrichissement GPT pour chaque résultat
    const enriched = [];
    for (const item of serpData.organic_results) {
      const clean = await enrichResult(item);
      enriched.push(clean);
    }

    return res.json({
      error: false,
      query: q,
      limit,
      count: enriched.length,
      results: enriched
    });

  } catch (e) {
    return res.json({
      error: true,
      message: "Worker crashed: " + e.message,
      results: []
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Worker running on port " + PORT));
