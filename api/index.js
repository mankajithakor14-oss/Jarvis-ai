export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST is allowed"
    });
  }

  try {
    const { message } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is missing in Vercel"
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({
          model: "gpt-5",

          instructions:
            "તમે Jarvis નામનો વ્યક્તિગત AI assistant છો. " +
            "વપરાશકર્તા સાથે મુખ્યત્વે સરળ ગુજરાતી ભાષામાં વાત કરો. " +
            "જવાબ ટૂંકો, સ્પષ્ટ અને મદદરૂપ આપો. " +
            "વપરાશકર્તા ગુજરાતી બોલે તો ગુજરાતી જવાબ આપો.",

          input: message,

          max_output_tokens: 500
        })
      }
    );

    const data = await response.json();

    // OpenAI તરફથી error આવે તો સાચી error Vercel logમાં દેખાશે
    if (!response.ok) {
      console.error("OpenAI API Error:", JSON.stringify(data));

      return res.status(502).json({
        error: "OpenAI API error",
        details: data
      });
    }

    const reply =
      data.output_text ||
      "મને જવાબ મળ્યો નથી.";

    return res.status(200).json({
      reply: reply
    });

  } catch (error) {
    console.error("Jarvis Backend Error:", error);

    return res.status(500).json({
      error: "Server error",
      details: error.message || String(error)
    });
  }
}
