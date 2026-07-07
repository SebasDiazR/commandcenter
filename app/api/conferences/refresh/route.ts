import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CONFERENCE_RELEVANCE, slugifyConference } from '@/lib/conferences';
import type { Conference, ConferenceRelevance } from '@/lib/conferences';

// On-demand refresh: Claude searches the web for upcoming higher-ed conferences,
// verifies dates/locations against official pages, and returns a structured list.
// The client merges genuinely-new entries into the shared store as "pending"
// (awaiting human review) — this route itself is stateless.

export const maxDuration = 300;      // research + web search can take a while (Vercel Pro+)
export const dynamic = 'force-dynamic';

const ORGS = [
  "SCUP (annual + regional)", "APPA", "EDUCAUSE", "ACUHO-I", "AIA Conference on Architecture",
  "ACHA", "AASHE", "Greenbuild", "Tradeline", "NACUBO", "APLU", "NIRSA", "ACUI", "EDspaces",
].join(", ");

function parseConferences(text: string): Conference[] {
  let body = text.trim();
  const fence = body.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) body = fence[1].trim();
  const start = body.indexOf("[");
  const end = body.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  let arr: unknown;
  try { arr = JSON.parse(body.slice(start, end + 1)); } catch { return []; }
  if (!Array.isArray(arr)) return [];

  const rel = new Set<string>(CONFERENCE_RELEVANCE as readonly string[]);
  const seen = new Set<string>();
  const out: Conference[] = [];
  for (const c of arr as Record<string, unknown>[]) {
    if (!c || typeof c.name !== "string" || typeof c.startDate !== "string") continue;
    if (typeof c.lat !== "number" || typeof c.lng !== "number") continue;
    const id = slugifyConference(c.name, c.startDate);
    if (seen.has(id)) continue;
    seen.add(id);
    const relevance: ConferenceRelevance = rel.has(c.relevance as string)
      ? (c.relevance as ConferenceRelevance)
      : "general higher-ed";
    out.push({
      id,
      name: c.name,
      organizer: typeof c.organizer === "string" ? c.organizer : "—",
      city: typeof c.city === "string" ? c.city : "",
      state: typeof c.state === "string" && c.state ? c.state : null,
      country: typeof c.country === "string" ? c.country : "USA",
      venue: typeof c.venue === "string" && c.venue ? c.venue : undefined,
      startDate: c.startDate,
      endDate: typeof c.endDate === "string" ? c.endDate : c.startDate,
      url: typeof c.url === "string" ? c.url : "",
      relevance,
      lat: c.lat,
      lng: c.lng,
      confidence: "medium",
    });
  }
  return out;
}

export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Web refresh is not configured — set ANTHROPIC_API_KEY on the server." },
      { status: 503 },
    );
  }

  const client = new Anthropic({ apiKey });
  const today = new Date().toISOString().slice(0, 10);
  const relList = CONFERENCE_RELEVANCE.join(", ");

  const prompt = `Find UPCOMING higher-education conferences (start date on or after ${today}, out to ~18 months) relevant to an architecture firm's higher-ed business development. Cover these organizations/sources: ${ORGS}.

Use web search to find each event and CONFIRM its exact dates and host city against the official event page. Only include events you can verify with a real date and a physical host city (skip online-only events and anything with unannounced dates).

Return ONLY a JSON array — no prose, no markdown outside the array. Each element MUST have exactly these keys:
- "name": string
- "organizer": string (acronym + short name)
- "city": string (host city)
- "state": string (2-letter US code) or null for international
- "country": string
- "venue": string (or omit)
- "startDate": "YYYY-MM-DD"
- "endDate": "YYYY-MM-DD"
- "url": string (official event page)
- "relevance": one of exactly: ${relList}
- "lat": number (host city latitude)
- "lng": number (host city longitude)

Return between 15 and 35 conferences, sorted by startDate ascending.`;

  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 20000,
      thinking: { type: "adaptive" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 12 }],
      messages: [{ role: "user", content: prompt }],
    });
    const message = await stream.finalMessage();

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const conferences = parseConferences(text);
    if (conferences.length === 0) {
      return NextResponse.json(
        { error: "The refresh returned no parseable conferences. Try again." },
        { status: 502 },
      );
    }
    return NextResponse.json({ conferences, count: conferences.length });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Web refresh failed: the server's Anthropic API key was rejected. Update ANTHROPIC_API_KEY." },
        { status: 401 },
      );
    }
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Web refresh is rate-limited right now — try again in a minute." },
        { status: 429 },
      );
    }
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Web refresh failed (${e.status ?? "error"}).` }, { status: e.status ?? 500 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Refresh failed." }, { status: 500 });
  }
}
