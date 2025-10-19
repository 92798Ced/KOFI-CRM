export async function handler(event) {
  try {
    const { prompt } = JSON.parse(event.body || "{}");

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OpenAI API key");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Jayvee, a CRM automation assistant." },
          { role: "user", content: prompt || "Hello" }
        ],
        temperature: 0.4
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };

  } catch (err) {
    console.error("Jayvee Function Error:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
