import { askJarvis } from "./_lib/openai.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const result = await askJarvis({ message, history });
    return res.status(200).json(result);
  } catch (error) {
    console.error("JARVIS AI ERROR:", error);
    return res.status(error.status || 500).json({
      error: error.message || "Jarvis server error",
    });
  }
}
