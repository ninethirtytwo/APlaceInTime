import { NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const ARTIST_ID = '3i7KKztiuNxSgo146aHLIZ'; // Your Artist ID

// Basic in-memory cache for the access token
let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getSpotifyAccessToken() {
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token;
  }

  console.log("Fetching new Spotify access token for artist info...");
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error("Spotify client ID or secret not configured in environment variables.");
    throw new Error("Spotify API credentials missing.");
  }

  try {
    const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Spotify Token API Error (${response.status}): ${errorBody}`);
      throw new Error(`Failed to fetch Spotify access token: ${response.statusText}`);
    }

    const data = await response.json();
    cachedToken = {
      access_token: data.access_token,
      expires_at: Date.now() + (data.expires_in - 60) * 1000 // Refresh 60s before expiry
    };
    console.log("Successfully fetched and cached new Spotify token.");
    return cachedToken.access_token;
  } catch (error) {
      console.error("Error fetching Spotify token:", error);
      throw error; // Re-throw after logging
  }
}

export async function GET() {
  try {
    const accessToken = await getSpotifyAccessToken();

    console.log(`Fetching Spotify artist data for ID: ${ARTIST_ID}...`);
    // Fetch artist details and top tracks
    const artistUrl = `${SPOTIFY_API_BASE}/artists/${ARTIST_ID}`;
    const topTracksUrl = `${SPOTIFY_API_BASE}/artists/${ARTIST_ID}/top-tracks?market=US&limit=5`; // Fetch top 5

    const [artistResponse, topTracksResponse] = await Promise.all([
        fetch(artistUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
        fetch(topTracksUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } })
    ]);

    if (!artistResponse.ok) {
      const errorText = await artistResponse.text();
      console.error(`Spotify Artist API Error (${artistResponse.status}): ${errorText}`);
      throw new Error(`Failed to fetch Spotify artist data: ${artistResponse.statusText}`);
    }
     if (!topTracksResponse.ok) {
      const errorText = await topTracksResponse.text();
      console.error(`Spotify Top Tracks API Error (${topTracksResponse.status}): ${errorText}`);
      // Don't throw here, maybe artist data is enough? Or return partial error?
      // For now, we'll proceed but log the error. Top tracks might be empty.
    }

    const artistData = await artistResponse.json();
    const topTracksData = topTracksResponse.ok ? await topTracksResponse.json() : { tracks: [] }; // Default if fetch failed

    console.log("Successfully fetched Spotify artist data.");

    // Combine relevant info
    const responseData = {
        name: artistData.name,
        imageUrl: artistData.images?.[0]?.url,
        // followers: artistData.followers?.total, // Remove follower count
        genres: artistData.genres,
        externalUrl: artistData.external_urls?.spotify,
        // Map fetched tracks (up to 5)
        topTracks: topTracksData.tracks?.map((track: any) => ({
            name: track.name,
            url: track.external_urls?.spotify,
            albumImageUrl: track.album?.images?.[2]?.url // Get smallest album image
        })) || []
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Spotify Artist Info Route Error:", error);
    return NextResponse.json({ error: 'Failed to fetch Spotify artist data.' }, { status: 500 });
  }
}