import Groq from "groq-sdk";
import { env } from "$env/dynamic/private";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export async function POST({request}) {
    const body = await request.json(); 

    // Compose the full message history, starting with the system prompt
    const messages = [
        { role: "system", content: "You are a helpful assistant." },
        ...(body.messages || [])
    ];

    const stream = await groq.chat.completions.create({
        messages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_completion_tokens: 1024,
        top_p: 1,
        stop: null,
        stream: true,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
        async start(controller) {
            for await (const chunk of stream) {
                controller.enqueue(encoder.encode(chunk.choices?.[0]?.delta?.content || ""));
            }
            controller.close();
        }
    });

    return new Response(readable, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*", // <-- Add this line
            "Access-Control-Allow-Methods": "POST, OPTIONS", // <-- And this
            "Access-Control-Allow-Headers": "Content-Type", // <-- And this
        }
    });
}

// Handle preflight OPTIONS request for CORS
export function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    });
}