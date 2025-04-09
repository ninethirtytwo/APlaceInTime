"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Track {
    name: string;
    url: string;
    albumImageUrl?: string;
}

interface ArtistData {
    name?: string;
    imageUrl?: string;
    followers?: number;
    genres?: string[];
    externalUrl?: string;
    topTracks?: Track[];
}

export default function SpotifyArtistInfo() {
    const [artistData, setArtistData] = useState<ArtistData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchArtistInfo() {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/spotify/artist-info');
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch artist data');
                }
                setArtistData(data);
            } catch (err) {
                console.error("Spotify fetch error:", err);
                setError(err instanceof Error ? err.message : 'Could not load artist data.');
            } finally {
                setLoading(false);
            }
        }
        fetchArtistInfo();
    }, []);

    if (loading) {
        return <p className="text-gray-400 italic">Loading Spotify info...</p>;
    }

    if (error) {
        return <p className="text-red-400">Error loading Spotify info: {error}</p>;
    }

    if (!artistData) {
        return <p className="text-gray-500">Could not load artist data.</p>;
    }

    return (
        <div className="flex flex-col items-center gap-4 text-center">
            {artistData.imageUrl && (
                <Image
                    src={artistData.imageUrl}
                    alt={`Image of ${artistData.name || 'artist'}`}
                    width={128} // Adjust size as needed
                    height={128}
                    className="rounded-full border-2 border-white/20 shadow-lg"
                />
            )}
            <h4 className="text-xl font-semibold text-white mt-2">{artistData.name || 'Artist Name'}</h4>
            {/* Follower count removed */}
             {artistData.genres && artistData.genres.length > 0 && (
                 <p className="text-xs text-gray-500 italic">{artistData.genres.join(', ')}</p>
            )}

            {/* Top Tracks */}
            {artistData.topTracks && artistData.topTracks.length > 0 && (
                <div className='mt-4 w-full max-w-sm'>
                    <h5 className='text-sm font-semibold text-gray-300 mb-2'>Top Tracks:</h5>
                    <ul className='space-y-1 text-left'>
                        {artistData.topTracks.map((track) => (
                            <li key={track.url} className='text-xs'>
                                <a href={track.url} target="_blank" rel="noopener noreferrer" className='flex items-center gap-2 hover:text-green-400 transition-colors'>
                                    {track.albumImageUrl && (
                                        <Image src={track.albumImageUrl} alt="Album art" width={24} height={24} className='rounded-sm flex-shrink-0'/>
                                    )}
                                    <span className='truncate'>{track.name}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {artistData.externalUrl && (
                <a
                    href={artistData.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block px-4 py-1 rounded bg-green-600/80 hover:bg-green-500/80 text-white text-sm font-medium transition-colors duration-200"
                >
                    View on Spotify
                </a>
            )}
        </div>
    );
}