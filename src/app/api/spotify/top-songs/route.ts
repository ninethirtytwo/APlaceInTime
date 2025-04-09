import { NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_PLAYLIST_ID = '37i9dQZEVXbMDoHDwVN2tF'; // Top 50 - Global playlist ID
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Re-use the token caching logic (could be refactored later)
let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getSpotifyAccessToken() {
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token;
  }
  console.log("Fetching new Spotify access token for top songs...");
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error("Spotify client ID or secret not configured.");
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
      expires_at: Date.now() + (data.expires_in - 60) * 1000
    };
    console.log("Successfully fetched and cached new Spotify token.");
    return cachedToken.access_token;
  } catch (error) {
    console.error("Error fetching Spotify token:", error);
    throw error;
  }
}

export async function GET() {
  try {
    const accessToken = await getSpotifyAccessToken();
    console.log(`Fetching Spotify Top 10 Global tracks...`);
    // Fetch top 10 tracks from the playlist
    // Remove market parameter for testing
    const playlistUrl = `${SPOTIFY_API_BASE}/playlists/${SPOTIFY_PLAYLIST_ID}/tracks?limit=5&fields=items(track(name,artists(name),external_urls(spotify),album(images)))`; // Fetch top 5

    const playlistResponse = await fetch(playlistUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!playlistResponse.ok) {
      const errorText = await playlistResponse.text();
      console.error(`Spotify Playlist API Error (${playlistResponse.status}): ${errorText}`);
      throw new Error(`Failed to fetch Spotify playlist data: ${playlistResponse.statusText}`);
    }

    const playlistData = await playlistResponse.json();
    console.log("Successfully fetched Spotify Top 10 data.");

    // Extract relevant track info
    const tracks = playlistData.items?.map((item: any) => ({
        name: item.track?.name,
        artist: item.track?.artists?.map((artist: any) => artist.name).join(', '),
        url: item.track?.external_urls?.spotify,
        albumImageUrl: item.track?.album?.images?.[2]?.url // Get smallest album image
    })).filter((track: any) => track.name && track.artist && track.url) || []; // Filter out potential null tracks

    return NextResponse.json({ tracks });

  } catch (error) {
    console.error("Spotify Top Songs Route Error:", error);
    return NextResponse.json({ error: 'Failed to fetch Spotify Top 10 songs.' }, { status: 500 });
  }
}