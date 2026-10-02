export default async function handler(req, res) {
  // Only POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST is allowed"
    });
  }

  try {
    // Get user message
    const message = req.body?.message;

    if (
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    // Check API key
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is missing in Vercel"
      });
    }

    // Send message to AI
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: "gpt-5",
          instructions:
            "તમે Jarvis નામનો વ્યક્તિગત AI assistant છો. " +
            "વપરાશકર્તા સાથે મુખ્યત્વે સરળ ગુજરાતી ભાષામાં વાત કરો. " +
            "વપરાશકર્તા ગુજરાતી બોલે તો ગુજરાતી જવાબ આપો. " +
            "જવાબ ટૂંકો, સ્પષ્ટ અને મદદરૂપ આપો.",

          input: message,

          max_output_tokens: 500
        })
      }
    );

    const data = await response.json();

    // OpenAI error
    if (!response.ok) {
      console.error(
        "OpenAI Error:",
        JSON.stringify(data)
      );

      return res.status(502).json({
        error: "AI service error"
      });
    }

    // AI reply
    const reply =
      data.output_text ||
      "મને AI તરફથી જવાબ મળ્યો નથી.";

    return res.status(200).json({
      reply
    });

  } catch (error) {

    console.error(
      "Jarvis Server Error:",
      error
    );

    return res.status(500).json({
      error: "Jarvis server error"
    });
  }
}
