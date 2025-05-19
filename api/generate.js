// File: dealgen/api/generate.js
// This is a Vercel Serverless Function (Node.js runtime)

export default async function handler(request, response) {
    // 1. Handle CORS Preflight (OPTIONS request)
    if (request.method === 'OPTIONS') {
        response.setHeader('Access-Control-Allow-Origin', '*'); // More specific origin in production is better e.g., your Vercel domain
        response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        response.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 1 day
        return response.status(204).end();
    }

    // 2. Only allow POST requests for actual data processing
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // 3. Get API Key from Vercel Environment Variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set in Vercel environment variables.");
        return response.status(500).json({ error: 'API Key not configured on the server.' });
    }

    try {
        // 4. Get the prompt data from your React app's request body
        const requestBody = request.body; // Vercel automatically parses JSON if Content-Type is application/json
        if (!requestBody || !requestBody.messages) {
            return response.status(400).json({ error: "Invalid request: 'messages' are required." });
        }

        const { messages } = requestBody;

        // 5. Construct the request to the Gemini API
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

        const geminiContents = messages.map(msg => ({
            role: msg.role === "system" ? "user" : msg.role, // Adapt "system" if needed for Gemini, often combined into user role
            parts: [{ text: msg.content }]
        }));

        const payloadForGemini = {
            contents: geminiContents,
            generationConfig: {
                response_mime_type: "application/json", // Crucial for Gemini to return parseable JSON
            }
        };

        // 6. Call the Gemini API using 'fetch'
        const geminiApiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payloadForGemini),
        });

        if (!geminiApiResponse.ok) {
            const errorBody = await geminiApiResponse.text();
            console.error(`Gemini API Error (${geminiApiResponse.status}):`, errorBody);
            return response.status(geminiApiResponse.status).json({
                error: `Error from Gemini API: ${geminiApiResponse.status}`,
                details: errorBody
            });
        }

        const geminiData = await geminiApiResponse.json();

        // 7. Send the Gemini response back to your React app
        if (geminiData.candidates && geminiData.candidates.length > 0 &&
            geminiData.candidates[0].content &&
            geminiData.candidates[0].content.parts && geminiData.candidates[0].content.parts.length > 0 &&
            geminiData.candidates[0].content.parts[0].text) {

            const jsonStringFromAi = geminiData.candidates[0].content.parts[0].text;
            // Set CORS header for the actual response too
            response.setHeader('Access-Control-Allow-Origin', '*'); // Adjust for production
            return response.status(200).json({ content: jsonStringFromAi });
        } else {
            console.error("Unexpected Gemini response structure:", geminiData);
            return response.status(500).json({ error: 'Unexpected response structure from Gemini API', details: geminiData });
        }

    } catch (error) {
        console.error("Error in Vercel function (api/generate.js):", error);
        return response.status(500).json({ error: `Internal Server Error: ${error.message}`, details: error.toString() });
    }
}