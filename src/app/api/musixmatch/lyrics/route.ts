import { NextResponse } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const MUSIXMATCH_API_URL = 'https://musixmatch-lyrics-songs.p.rapidapi.com/songs/lyrics';
const RAPIDAPI_HOST = 'musixmatch-lyrics-songs.p.rapidapi.com';

export async function GET(request: Request) {
  if (!RAPIDAPI_KEY) {
    console.error("RapidAPI Key is not configured.");
    return NextResponse.json({ error: 'RapidAPI key not configured.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const track = searchParams.get('track');
  const artist = searchParams.get('artist');
  // Optional params - might not be needed if API handles missing ones
  // const duration = searchParams.get('duration');
  // const type = searchParams.get('type') || 'json'; // Default to json?

  if (!track || !artist) {
    return NextResponse.json({ error: 'Required parameters "track" and "artist" missing.' }, { status: 400 });
  }

  try {
    console.log(`Fetching lyrics from Musixmatch via RapidAPI for track: ${track}, artist: ${artist}`);

    // Construct the URL with query parameters
    const url = new URL(MUSIXMATCH_API_URL);
    url.searchParams.append('t', track);
    url.searchParams.append('a', artist);
    // url.searchParams.append('type', type); // Add if needed
    // if (duration) url.searchParams.append('d', duration); // Add if needed

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Musixmatch RapidAPI Error (${response.status}): ${errorBody}`);
      // Try to parse error message from Musixmatch if possible
      let specificError = `Failed to fetch lyrics: ${response.statusText}`;
      try {
          const jsonError = JSON.parse(errorBody);
          specificError = jsonError?.message || specificError;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_e) { /* Ignore parsing error */ }
      throw new Error(specificError);
    }

    const data = await response.json();
    console.log("Successfully fetched data from Musixmatch RapidAPI.");

    // Extract the lyrics - **NOTE: Adjust this based on the ACTUAL response structure**
    // This is a common structure, but might need changing
    const lyrics = data?.body?.lyrics?.lyrics_body || data?.lyrics?.lyrics_body || data?.lyrics || null;

    if (!lyrics) {
        console.warn("Lyrics not found in Musixmatch response structure:", data);
        return NextResponse.json({ lyrics: null, message: "Lyrics not found for this track." });
    }

    // Optional: Clean up lyrics (remove common disclaimers)
    const cleanedLyrics = lyrics.replace(/\*{7}.*?\*{7}/gs, '').replace(/Unfortunately, we are not licensed.*/is, '').trim();

    return NextResponse.json({ lyrics: cleanedLyrics });

  } catch (error) {
    console.error("Musixmatch Lyrics Route Error:", error);
    let message = 'Failed to fetch lyrics via Musixmatch.';
    if (error instanceof Error) { message = error.message; }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}