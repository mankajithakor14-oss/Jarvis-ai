export default async function handler(req, res) {
  return res.status(200).json({
    ok: true,
    service: "JARVIS",
    time: new Date().toISOString(),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
  });
}
