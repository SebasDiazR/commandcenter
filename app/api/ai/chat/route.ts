import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatBody {
  messages: ChatMessage[];
  instContext: {
    name: string;
    system: string;
    pipeline: number;
    energy: number;
    relationship: number;
    status: string;
    priority: number;
    notes: string;
    nextAction: string;
    projects: { name: string; budget: number | null; year: number | null; type: string; pursuit_stage: string | null }[];
  };
  model?: string;
}

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, instContext, model = "llama3.2" } = body;

  const projectList = instContext.projects
    .slice(0, 12)
    .map(p => `  - ${p.name}${p.budget ? ` ($${p.budget}M)` : ""}${p.year ? ` FY${p.year}` : ""}${p.type ? ` · ${p.type}` : ""}${p.pursuit_stage ? ` · ${p.pursuit_stage}` : ""}`)
    .join("\n");

  const systemPrompt = `You are a strategic BD (Business Development) advisor for HKS, a global architecture and design firm. You are helping a BD team member think through pursuit strategy for a specific client institution.

Institution: ${instContext.name}
System/Network: ${instContext.system}
Pipeline: $${(instContext.pipeline / 1_000_000).toFixed(1)}M
Energy Score: ${instContext.energy.toFixed(1)} (composite pursuit momentum metric)
Relationship Strength: ${instContext.relationship}/5 stars
HKS Status: ${instContext.status}
Strategic Priority: ${instContext.priority}/10
Next Planned Action: ${instContext.nextAction || "None set"}
Notes: ${instContext.notes || "None"}

Active Projects:
${projectList || "  None on file"}

Your role: Give sharp, actionable BD strategy advice. Be direct and specific — this is an internal tool, not a client-facing document. Reference the institution's actual data when relevant. Keep responses concise unless asked to elaborate. You can help with: capture planning, stakeholder mapping, outreach drafts, risk analysis, next-step prioritization, or any other BD question.`;

  const ollamaMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  let ollamaRes: Response;
  try {
    ollamaRes = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: ollamaMessages,
        stream: true,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Ollama is not running. Start it with: ollama serve" },
      { status: 503 }
    );
  }

  if (!ollamaRes.ok) {
    const text = await ollamaRes.text();
    if (text.includes("model") && text.includes("not found")) {
      return NextResponse.json(
        { error: `Model "${model}" not found. Run: ollama pull ${model}` },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: `Ollama error: ${ollamaRes.status}` }, { status: 502 });
  }

  // Proxy the NDJSON stream — extract just the text tokens for the client
  const reader = ollamaRes.body!.getReader();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { controller.close(); break; }
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            const token = json?.message?.content ?? "";
            if (token) controller.enqueue(encoder.encode(token));
            if (json?.done) { controller.close(); return; }
          } catch { /* partial line, skip */ }
        }
      }
    },
    cancel() { reader.cancel(); },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    },
  });
}
