export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured"
      });
    }

    const messages = [
      {
        role: "system",
        content: `
You are JARVIS, a personal AI assistant.

Understand Gujarati, Hindi, Hinglish and English.

Your job:
1. Understand what the user actually wants.
2. Answer normal questions naturally.
3. Keep conversation context.
4. Give useful step-by-step instructions when needed.
5. Never answer with the same fixed response to every question.
6. If the user asks about coding, help with code.
7. If the user asks about markets, explain the analysis clearly and mention that market information can change.
8. If the user gives a phone/app command, identify the intended action clearly.
9. If you cannot perform an action directly, explain what is required instead of pretending it was done.
10. Reply in the same language/style the user uses whenever practical.

Be concise but useful.
        `
      },
      ...Array.isArray(history)
        ? history
            .filter(
              x =>
                x &&
                (x.role === "user" || x.role === "assistant") &&
                typeof x.content === "string"
            )
            .slice(-12)
        : [],
      {
        role: "user",
        content: message.trim()
      }
    ];

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.7,
          max_tokens: 800
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "AI request failed"
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({
        error: "Empty AI response"
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("JARVIS ERROR:", error);

    return res.status(500).json({
      error: "Jarvis server error"
    });
  }
}
