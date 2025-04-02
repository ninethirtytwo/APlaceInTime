import { NextResponse } from 'next/server';

const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;
const GENIUS_API_BASE = 'https://api.genius.com';

export async function GET(request: Request) {
  if (!GENIUS_ACCESS_TOKEN) {
    console.error("Genius Access Token is not configured.");
    return NextResponse.json({ error: 'Genius API token not configured.' }, { status: 500 });
  }

  // Get search query from request URL parameters
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Search query parameter "q" is required.' }, { status: 400 });
  }

  try {
    console.log(`Searching Genius for: ${query}`);
    const searchUrl = `${GENIUS_API_BASE}/search?q=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${GENIUS_ACCESS_TOKEN}`
      }
      // Vercel recommends specific caching strategies if needed
      // next: { revalidate: 3600 } // Example: revalidate once per hour
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Genius API Error (${response.status}): ${errorBody}`);
      throw new Error(`Failed to search Genius: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Successfully fetched Genius search results.");

    // Define simple type for Genius hit structure
    interface GeniusHitItem {
        result?: {
            id?: number;
            title?: string;
            primary_artist?: { name?: string };
            url?: string;
            song_art_image_thumbnail_url?: string;
        }
    }
    // Extract relevant hit info (e.g., top 5 hits)
    const hits = data.response?.hits?.slice(0, 5).map((hit: GeniusHitItem) => ({
        id: hit.result?.id,
        title: hit.result?.title,
        artist: hit.result?.primary_artist?.name,
        url: hit.result?.url,
        thumbnailUrl: hit.result?.song_art_image_thumbnail_url
    })) || [];

    return NextResponse.json({ hits });

  } catch (error) {
    console.error("Genius Search Route Error:", error);
    let message = 'Failed to search Genius.';
    if (error instanceof Error) { message = error.message; }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}