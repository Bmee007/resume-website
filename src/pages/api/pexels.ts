export const prerender = false;
export const maxDuration = 10;

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get("q")?.trim();

  if (!query) {
    return new Response(JSON.stringify({ error: "Query required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = import.meta.env.PEXELS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Pexels not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape&size=medium`,
      { headers: { Authorization: apiKey } }
    );

    if (!res.ok) throw new Error(`Pexels ${res.status}`);

    const data = await res.json();
    const photos = data.photos ?? [];

    if (!photos.length) {
      return new Response(JSON.stringify({ url: null }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pick a random photo from the top 3 results for variety
    const photo = photos[Math.floor(Math.random() * photos.length)];

    return new Response(
      JSON.stringify({
        url: photo.src.large,
        photographer: photo.photographer,
        photographer_url: photo.photographer_url,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pexels fetch failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
