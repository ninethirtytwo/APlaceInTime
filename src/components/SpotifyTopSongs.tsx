"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Track {
    name: string;
    artist: string;
    url: string;
    albumImageUrl?: string;
}

export default function SpotifyTopSongs() {
    const [topTracks, setTopTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTopSongs() {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/spotify/top-songs');
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch top songs');
                }
                setTopTracks(data.tracks || []);
            } catch (err) {
                console.error("Spotify Top Songs fetch error:", err);
                setError(err instanceof Error ? err.message : 'Could not load top songs.');
            } finally {
                setLoading(false);
            }
        }
        fetchTopSongs();
    }, []);

    if (loading) {
        return <p className="text-sm text-gray-400 italic">Loading Top Songs...</p>;
    }

    if (error) {
        return <p className="text-sm text-red-400">Error loading Top Songs: {error}</p>;
    }

    if (!topTracks || topTracks.length === 0) {
        return <p className="text-sm text-gray-500">Top Songs data unavailable.</p>;
    }

    return (
        <div className='w-full'>
             <h5 className='text-md font-semibold text-gray-300 mb-3 text-center'>Spotify Top 10 Global</h5>
             <ul className='space-y-2'>
                {topTracks.map((track, index) => (
                    <li key={track.url || index} className='text-xs'>
                        <a href={track.url} target="_blank" rel="noopener noreferrer" className='flex items-center gap-2 hover:text-green-400 transition-colors p-1 rounded hover:bg-white/5'>
                            <span className="text-gray-500 w-4 text-right">{index + 1}.</span>
                            {track.albumImageUrl && (
                                <Image src={track.albumImageUrl} alt="Album art" width={24} height={24} className='rounded-sm flex-shrink-0'/>
                            )}
                            <div className='overflow-hidden'>
                                <span className='font-medium text-gray-100 block truncate'>{track.name}</span>
                                <span className='text-gray-400 block truncate'>{track.artist}</span>
                            </div>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}