"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
// Removed import for SpotifyArtistInfo as we use iframe now
// Removed import for SpotifyTopSongs as we use iframe now

// --- Agent Data (Updated) ---
interface Agent { id: string; name: string; description: string; }
const availableAgents: Agent[] = [
    { id: 'lead', name: 'Lead Writer', description: 'Supervises and integrates styles.' },
    { id: 'poet', name: 'Literary Poet', description: 'Metaphors, wordplay, imagery.' },
    { id: 'mood', name: 'Mood Writer', description: 'Captures specific emotions.' },
    { id: 'pop', name: 'Pop Culture Writer', description: 'Current trends, slang, references.' },
    { id: 'analogy', name: 'Analogy Ace', description: 'Analogies, sayings, idioms.' },
    { id: 'philosophy', name: 'Deep Thinker', description: 'Philosophy, psychology, depth.' },
    { id: 'eras', name: 'Eras Writer', description: 'Writes in styles of specific eras.' },
    { id: 'genre', name: 'Genre Specialist', description: 'Adheres to genre conventions.' },
];
// --- End Agent Data ---

// Interface for the expected Analysis API response structure
interface AnalysisResultData {
  syllablesPerLine?: number[];
  rhymeSchemeAnalysis?: string;
  rhymeDetails?: { words: string[]; type: string }[];
  rhythmAndPacing?: string;
  repetitionTechniques?: string[];
  overallComplexity?: string;
  melodySuggestion?: string;
  keyObservations?: string[];
  formattedLyrics?: string;
  parseError?: string;
  rawResponse?: string;
}

// Interface for Genius Search results (Commented out as unused)
/*
interface GeniusHit {
    id: number;
    title: string;
    artist: string;
    url: string;
    thumbnailUrl?: string;
}
*/

export default function Home() {
  // --- State Variables ---
  const [lyricsInput, setLyricsInput] = useState(''); // For analysis input (middle panel)
  const [ideaInput, setIdeaInput] = useState(''); // For generation input (left panel)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [annotationsInput, setAnnotationsInput] = useState(''); // State for annotations

  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [storylineInput, setStorylineInput] = useState(''); // State for storyline

  const [selectedAgents, setSelectedAgents] = useState<string[]>(['lead']);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedEra, setSelectedEra] = useState('');
  const [selectedMood, setSelectedMood] = useState(''); // Changed from moodInput

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioControlsRef = useRef<HTMLDivElement | null>(null);

  // State for Genius Search (Commented out as unused)
  /*
  const [geniusQuery, setGeniusQuery] = useState('');
  const [geniusResults, setGeniusResults] = useState<GeniusHit[]>([]);
  const [geniusLoading, setGeniusLoading] = useState(false);
  const [geniusError, setGeniusError] = useState<string | null>(null);
  */

  // State for Musixmatch Lyrics Search
  const [musixmatchLyrics, setMusixmatchLyrics] = useState<string | null>(null);
  const [musixmatchLoading, setMusixmatchLoading] = useState(false);
  const [musixmatchError, setMusixmatchError] = useState<string | null>(null);
  const [lyricsSearchQuery, setLyricsSearchQuery] = useState('');

  // --- Handler Functions ---
  const handleAgentSelection = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  };

  async function handleAnalyzeFlow() {
    setAnalysisLoading(true); setAnalysisError(null); setAnalysisResult(null);
    const lyricsToAnalyze = lyricsInput;
    const annotations = annotationsInput; // Get annotations
    if (!lyricsToAnalyze) { setAnalysisError("No lyrics provided to analyze."); setAnalysisLoading(false); return; }
    try {
      const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Send annotations along with lyrics
          body: JSON.stringify({ lyrics: lyricsToAnalyze, annotations: annotations }),
      });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.error || `HTTP error! status: ${response.status}`); }
      if (data.parseError) { console.error("Backend JSON parsing error:", data.parseError); setAnalysisError(`Analysis failed: ${data.parseError}`); setAnalysisResult({ rawResponse: data.rawResponse }); }
      else { setAnalysisResult(data); }
    } catch (error) { console.error("Analysis fetch error:", error); setAnalysisError(error instanceof Error ? error.message : "Failed to fetch analysis."); }
    finally { setAnalysisLoading(false); }
  }

  async function handleGenerateOrFinish() {
    setGenerationLoading(true); setGenerationError(null);
    const promptInput = ideaInput || "Write a song based on the selected parameters.";
    const storyline = storylineInput; // Get storyline
    const contextLyrics = null;
    try {
      const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              prompt: promptInput,
              context: contextLyrics,
              agents: selectedAgents,
              genre: selectedGenre,
              era: selectedEra,
              mood: selectedMood, // Use selectedMood state
              storyline: storyline, // Pass storyline
              analysis: analysisResult
          }),
      });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.error || `HTTP error! status: ${response.status}`); }
      setGeneratedLyrics(data.generatedLyrics);
    } catch (error) { console.error("Generation fetch error:", error); setGenerationError(error instanceof Error ? error.message : "Failed to fetch generation."); }
    finally { setGenerationLoading(false); }
  }

  // --- Audio Handling ---
  useEffect(() => {
    if (!audioRef.current) {
        audioRef.current = new Audio('/sandy-beach-calm-waves-water-nature-sounds-8052.mp3'); // Use sandy beach sound
        audioRef.current.onerror = (e) => { console.error("Audio Error Event:", e); if (audioRef.current) audioRef.current.src = '/sandy-beach-calm-waves-water-nature-sounds-8052.mp3'; }; // Update fallback src too
    }
    if (audioRef.current) {
        audioRef.current.loop = true;
        audioRef.current.volume = volume;
        audioRef.current.muted = isMuted;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) { playPromise.catch(error => { console.warn("Audio autoplay failed:", error); }); }
    }
    return () => { if (audioRef.current) { audioRef.current.pause(); } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

   useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
       if (volume > 0 && !isMuted && audioRef.current.paused) { audioRef.current.play().catch(e => console.warn("Play attempt after state change failed:", e)); }
    }
  }, [volume, isMuted]);

  const toggleMute = () => { if (audioRef.current) { const newMutedState = !audioRef.current.muted; audioRef.current.muted = newMutedState; setIsMuted(newMutedState); } };
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => { const newVolume = parseFloat(event.target.value); setVolume(newVolume); };

  const pauseBackgroundAudio = () => { if (audioRef.current && !audioRef.current.paused) { console.log("Pausing background audio due to potential Spotify interaction."); audioRef.current.pause(); } };

  // --- Genius Search Handler (Commented out as unused) ---
  /*
  async function handleGeniusSearch(e?: React.FormEvent<HTMLFormElement>) {
    // ... implementation ...
  }
  */
  // --- Musixmatch Lyrics Search Handler ---
  async function handleMusixmatchSearch(track: string, artist: string) {
    if (!track || !artist) {
      setMusixmatchError("Track and Artist names are needed to search lyrics.");
      return;
    }
    setMusixmatchLoading(true);
    setMusixmatchError(null);
    setMusixmatchLyrics(null);
    try {
      const response = await fetch(`/api/musixmatch/lyrics?track=${encodeURIComponent(track)}&artist=${encodeURIComponent(artist)}`);
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || data.message || 'Failed to fetch lyrics from Musixmatch');
      }
      if (data.lyrics) {
        setMusixmatchLyrics(data.lyrics);
      } else {
        setMusixmatchError(data.message || "Lyrics not found.");
      }
    } catch (error) {
      console.error("Musixmatch search fetch error:", error);
      setMusixmatchError(error instanceof Error ? error.message : "Failed to search Musixmatch.");
    } finally {
      setMusixmatchLoading(false);
    }
  }
  // --- End Handler Functions & Audio ---

  return (
    <>
      <main className="relative flex min-h-screen flex-col items-center p-4 sm:p-8 text-white">

        {/* --- Header Section --- */}
        <header className="w-full max-w-4xl text-center mb-10 sm:mb-12 mt-8 sm:mt-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-white text-shadow-lg">
            A Place In Time Entertainment
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 text-shadow">
            Home of Innovation in Music & AI
          </p>
        </header>

        {/* --- AI Tool Section --- */}
        <section id="tool-section" className="w-full max-w-screen-lg xl:max-w-screen-xl mb-16 sm:mb-24">
           <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-white">AI Lyric Generator & Analyzer</h2>
              <p className="text-md text-gray-300">Write, analyze, and perfect your lyrics with AI.</p>
           </div>
           {/* Restoring 3-Column Grid Layout */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 backdrop-blur-lg bg-black/40 p-6 sm:p-8 rounded-xl shadow-2xl border border-white/10">
              {/* --- Left Panel: Generator --- */}
              <div className="flex flex-col gap-4 min-h-[70vh]"> {/* Adjusted gap */}
                <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">AI Generator</h3>
                 <div className="flex flex-col gap-2">
                   <label htmlFor="idea-input" className="text-sm font-medium text-gray-300">Your Idea / Prompt:</label>
                   <textarea id="idea-input" placeholder="Enter song concept, theme, or starting lines..." className="w-full p-3 rounded bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-100 resize-none transition-colors duration-200 min-h-[100px]" value={ideaInput} onChange={(e) => setIdeaInput(e.target.value)} disabled={generationLoading} />
                 </div>
                 {/* Generation Parameter Controls */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {/* Genre Select */}
                   <div className="flex flex-col gap-1">
                      <label htmlFor="genre-select" className="text-sm font-medium text-gray-300">Genre:</label>
                      <select id="genre-select" className="p-2 rounded bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-100 disabled:opacity-60 transition-colors duration-200" disabled={generationLoading} value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
                        <option value="">Any</option>
                        <option value="hip-hop">Hip Hop (General)</option>
                        <option value="trap">Trap</option>
                        <option value="boom-bap">Boom Bap</option>
                        <option value="rnb">R&B</option>
                        <option value="pop">Pop</option>
                        <option value="pop-rap">Pop Rap</option>
                        <option value="conscious-hip-hop">Conscious Hip Hop</option>
                        <option value="drill">Drill</option>
                        <option value="lo-fi-hip-hop">Lo-fi Hip Hop</option>
                        <option value="alternative-rap">Alternative Rap</option>
                        <option value="emo-rap">Emo Rap</option>
                        <option value="hyperpop">Hyperpop</option>
                        <option value="country-rap">Country Rap</option>
                        <option value="jazz-rap">Jazz Rap</option>
                        <option value="g-funk">G-Funk</option>
                        <option value="soul">Soul</option>
                        <option value="funk">Funk</option>
                        <option value="reggae">Reggae</option>
                        <option value="dancehall">Dancehall</option>
                        <option value="rock">Rock Rap</option>
                        <option value="latin-trap">Latin Trap</option>
                        <option value="afrobeat">Afrobeat</option>
                        <option value="dancehall">Dancehall</option>
                        <option value="afropop">Afropop</option>
                        <option value="afro-house">Afro House</option>
                        {/* Added Genres */}
                      </select>
                   </div>
                   {/* Era Select */}
                   <div className="flex flex-col gap-1">
                      <label htmlFor="era-select" className="text-sm font-medium text-gray-300">Era:</label>
                      <select id="era-select" className="p-2 rounded bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-100 disabled:opacity-60 transition-colors duration-200" disabled={generationLoading} value={selectedEra} onChange={(e) => setSelectedEra(e.target.value)}>
                        <option value="">Any</option>
                        <option value="1920s">1920s</option>
                        <option value="1930s">1930s</option>
                        <option value="1940s">1940s</option>
                        <option value="1950s">1950s</option>
                        <option value="1960s">1960s</option>
                        <option value="1970s">1970s</option>
                        <option value="1980s">1980s</option>
                        <option value="1990s">1990s</option>
                        <option value="2000s">2000s</option>
                        <option value="2010s">2010s</option>
                        <option value="2020s">2020s</option>
                        <option value="future">Futuristic</option>
                        {/* Added Eras */}
                      </select>
                   </div>
                   {/* Mood Select */}
                   <div className="flex flex-col gap-1 sm:col-span-2">
                      <label htmlFor="mood-select" className="text-sm font-medium text-gray-300">Mood:</label>
                      <select id="mood-select" className="p-2 rounded bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-100 disabled:opacity-60 transition-colors duration-200" disabled={generationLoading} value={selectedMood} onChange={(e) => setSelectedMood(e.target.value)}>
                         <option value="">Any</option>
                         <option value="happy">Happy</option>
                         <option value="sad">Sad</option>
                         <option value="angry">Angry</option>
                         <option value="reflective">Reflective</option>
                         <option value="energetic">Energetic</option>
                         <option value="chill">Chill</option>
                         <option value="romantic">Romantic</option>
                         <option value="dark">Dark</option>
                         <option value="hype">Hype</option>
                         <option value="nostalgic">Nostalgic</option>
                         <option value="hopeful">Hopeful</option>
                         <option value="aggressive">Aggressive</option>
                         <option value="playful">Playful</option>
                         <option value="serious">Serious</option>
                         {/* Added Moods */}
                      </select>
                   </div>
                 </div>
                 {/* Storyline Input */}
                 <div className="flex flex-col gap-2">
                   <label htmlFor="storyline-input" className="text-sm font-medium text-gray-300">Storyline / Narrative (Optional):</label>
                   <textarea id="storyline-input" placeholder="Describe the story or message..." className="w-full p-3 rounded bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-100 resize-none transition-colors duration-200 min-h-[80px]" value={storylineInput} onChange={(e) => setStorylineInput(e.target.value)} disabled={generationLoading} />
                 </div>
                 {/* Generate Button */}
                 <button className="mt-4 px-5 py-2 rounded bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium transition-colors duration-200 self-center disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleGenerateOrFinish} disabled={generationLoading || !ideaInput}>
                   {generationLoading ? 'Generating...' : 'Generate Lyrics'}
                 </button>
                 {/* Display Selected Agents */}
                 <div className="text-center text-xs text-gray-400 mt-2">
                    Writing Team: {selectedAgents.map(id => availableAgents.find(a => a.id === id)?.name || id).join(', ')}
                 </div>
                 {/* Generated Lyrics Area */}
                 <div className="p-4 rounded bg-black/30 border border-white/10 flex-grow overflow-y-auto mt-3 min-h-[200px]">
                    {generationLoading && <p className="text-sm text-gray-400">Generating...</p>}
                    {generationError && <p className="text-sm text-red-400">Error: {generationError}</p>}
                    {generatedLyrics && !generationLoading && !generationError && ( <pre className="text-sm text-gray-100 whitespace-pre-wrap">{generatedLyrics}</pre> )}
                    {!generatedLyrics && !generationLoading && !generationError && ( <p className="text-sm text-gray-500 italic">(Generated lyrics/story will appear here...)</p> )}
                 </div>
              </div>

              {/* --- Middle Panel: Analyzer --- */}
              <div className="flex flex-col gap-5 min-h-[70vh]">
                 <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">Lyric Analyzer</h3>
                 {/* Annotations Input */}
                 <div className="flex flex-col gap-2">
                   <label htmlFor="annotations-input" className="text-sm font-medium text-gray-300">Annotations / Background Info (Optional):</label>
                   <textarea id="annotations-input" placeholder="Add context like Genius annotations..." className="w-full p-3 rounded bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-100 resize-none transition-colors duration-200 min-h-[80px]" value={annotationsInput} onChange={(e) => setAnnotationsInput(e.target.value)} disabled={analysisLoading} />
                 </div>
                 {/* Lyric Input */}
                 <div className="flex flex-col gap-2 flex-grow">
                   <label htmlFor="analyze-input" className="text-sm font-medium text-gray-300">Lyrics to Analyze:</label>
                   <textarea id="analyze-input" placeholder="Paste lyrics here for analysis..." className="w-full flex-grow p-3 rounded bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-100 resize-none transition-colors duration-200 min-h-[150px]" value={lyricsInput} onChange={(e) => setLyricsInput(e.target.value)} disabled={analysisLoading} /> {/* Adjusted min-h */}
                 </div>
                 <button className="mt-1 px-5 py-2 rounded bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium transition-colors duration-200 self-center disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleAnalyzeFlow} disabled={analysisLoading || !lyricsInput}>
                   {analysisLoading ? 'Analyzing...' : 'Analyze Flow'}
                 </button>
                 {/* Analysis Results Area */}
                 <div className="p-4 rounded bg-black/40 border border-white/10 flex-grow overflow-y-auto text-sm space-y-3 mt-3 min-h-[150px]"> {/* Adjusted min-h */}
                    {analysisLoading && <p className="text-gray-400">Analyzing...</p>}
                    {analysisError && <p className="text-red-400">Error: {analysisError}</p>}
                    {analysisResult && !analysisLoading && !analysisError && (
                      <>
                        {analysisResult.parseError && <p className="text-red-400">Analysis Error: {analysisResult.parseError}<br/><span className='text-xs text-gray-400'>Raw: {analysisResult.rawResponse?.substring(0,100)}...</span></p>}
                        {analysisResult.syllablesPerLine && ( <div><h5 className="font-semibold text-gray-300 mb-1">Syllables Per Line:</h5><p className="text-gray-200 bg-black/20 p-2 rounded text-xs">[{analysisResult.syllablesPerLine.join(', ')}]</p></div> )}
                        {analysisResult.rhymeSchemeAnalysis && ( <div><h5 className="font-semibold text-gray-300 mb-1">Rhyme Scheme:</h5><p className="text-gray-200">{analysisResult.rhymeSchemeAnalysis}</p></div> )}
                        {analysisResult.rhymeDetails && analysisResult.rhymeDetails.length > 0 && ( <div><h5 className="font-semibold text-gray-300 mb-1">Rhyme Details:</h5><ul className="space-y-1 pl-2">{analysisResult.rhymeDetails.map((detail: { words: string[], type: string }, index: number) => ( <li key={index} className="text-gray-200"><span className="font-medium">{detail.words.join(' / ')}</span><span className="text-xs text-gray-400 ml-2">({detail.type})</span></li> ))}</ul></div> )}
                        {analysisResult.rhythmAndPacing && ( <div><h5 className="font-semibold text-gray-300 mb-1">Rhythm & Pacing:</h5><p className="text-gray-200">{analysisResult.rhythmAndPacing}</p></div> )}
                        {analysisResult.repetitionTechniques && analysisResult.repetitionTechniques.length > 0 && ( <div><h5 className="font-semibold text-gray-300 mb-1">Repetition Techniques:</h5><ul className="list-disc list-inside text-gray-200 pl-2">{analysisResult.repetitionTechniques.map((tech: string, index: number) => <li key={index}>{tech}</li>)}</ul></div> )}
                        {analysisResult.overallComplexity && ( <div><h5 className="font-semibold text-gray-300 mb-1">Overall Complexity:</h5><p className="text-gray-200">{analysisResult.overallComplexity}</p></div> )}
                        {analysisResult.melodySuggestion && ( <div><h5 className="font-semibold text-gray-300 mb-1">Melody Suggestion:</h5><p className="text-gray-200 italic">{analysisResult.melodySuggestion}</p></div> )}
                        {analysisResult.keyObservations && analysisResult.keyObservations.length > 0 && ( <div><h5 className="font-semibold text-gray-300 mb-1">Key Observations:</h5><ul className="list-disc list-inside text-gray-200 pl-2">{analysisResult.keyObservations.map((obs: string, index: number) => <li key={index}>{obs}</li>)}</ul></div> )}
                        {analysisResult.formattedLyrics && ( <div className="mt-4"><h5 className="font-semibold text-gray-300 mb-1">Formatted Lyrics (for Flow):</h5><pre className="text-amber-200 whitespace-pre-wrap text-xs bg-black/20 p-2 rounded">{analysisResult.formattedLyrics}</pre></div> )}
                        {!analysisResult.parseError && !analysisResult.syllablesPerLine && !analysisResult.rhymeDetails && !analysisResult.formattedLyrics && ( <pre className="text-gray-200 whitespace-pre-wrap text-xs">{JSON.stringify(analysisResult, null, 2)}</pre> )}
                      </>
                    )}
                    {!analysisResult && !analysisLoading && !analysisError && ( <p className="text-sm text-gray-500 italic">(Analysis results will appear here...)</p> )}
                 </div>
                 {/* Musixmatch Search UI */}
                 <div className="mt-6 pt-4 border-t border-white/10">
                    <h4 className="text-md font-semibold mb-3 text-gray-200">Find Lyrics (via Musixmatch)</h4>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const parts = lyricsSearchQuery.split('-').map((p: string) => p.trim());
                        const track = parts[0];
                        const artist = parts.length > 1 ? parts.slice(1).join(' ') : '';
                        if (track && artist) { handleMusixmatchSearch(track, artist); }
                        else { setMusixmatchError("Please enter in 'Title - Artist' format."); }
                    }} className="flex gap-2 items-center">
                        <input type="text" placeholder="Enter Song Title - Artist" value={lyricsSearchQuery} onChange={(e) => setLyricsSearchQuery(e.target.value)} className="flex-grow p-2 rounded bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-100" disabled={musixmatchLoading} />
                        <button className="px-4 py-2 rounded bg-purple-600/80 hover:bg-purple-500/80 text-white text-sm font-medium transition-colors duration-200 disabled:opacity-50" disabled={musixmatchLoading || !lyricsSearchQuery}>
                            {musixmatchLoading ? 'Searching...' : 'Search'}
                        </button>
                    </form>
                    <div className="mt-4 p-3 rounded bg-black/30 border border-white/10 min-h-[100px] max-h-[300px] overflow-y-auto text-xs">
                        {musixmatchLoading && <p className="text-gray-400 italic">Loading lyrics...</p>}
                        {musixmatchError && <p className="text-red-400">Error: {musixmatchError}</p>}
                        {musixmatchLyrics && !musixmatchLoading && !musixmatchError && ( <pre className="whitespace-pre-wrap text-gray-200">{musixmatchLyrics}</pre> )}
                        {!musixmatchLyrics && !musixmatchLoading && !musixmatchError && ( <p className="text-gray-500 italic">(Lyrics will appear here if found...)</p> )}
                    </div>
                 </div>
              </div>

              {/* --- Right Panel: AI Writing Team (Checkboxes Restored) --- */}
              <div className="flex flex-col gap-5 min-h-[70vh]">
                <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">AI Writing Team</h3>
                <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                    {availableAgents.map(agent => (
                        <div key={agent.id} className="flex items-start gap-3 p-2 rounded hover:bg-white/10 transition-colors duration-150">
                           <input type="checkbox" id={`agent-${agent.id}`} checked={selectedAgents.includes(agent.id)} onChange={() => handleAgentSelection(agent.id)} className="mt-1 accent-blue-400 h-4 w-4 flex-shrink-0" disabled={generationLoading} />
                           <label htmlFor={`agent-${agent.id}`} className="flex flex-col cursor-pointer">
                              <span className="font-medium text-sm text-gray-100">{agent.name}</span>
                              <span className="text-xs text-gray-400">{agent.description}</span>
                           </label>
                        </div>
                    ))}
                 </div>
              </div>

            </div> {/* End of 3-column grid */}
        </section>

        {/* --- Graphs/Trends Placeholder Section --- */}
        <section className="w-full max-w-6xl my-16 sm:my-24 text-center">
             <h2 className="text-3xl font-bold mb-4 text-white">Lyric Trends & Insights</h2>
             <div className="p-6 rounded-lg border border-dashed border-gray-600 backdrop-blur-sm bg-black/30">
                 <p className="text-gray-400 italic">(Graphs and trend data visualizations coming soon...)</p>
             </div>
        </section>

        {/* --- Features Section --- */}
        <section className="w-full max-w-4xl text-center my-16 sm:my-24">
            <h2 className="text-3xl font-bold mb-6 text-white">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
                    <h4 className="text-lg font-semibold mb-2 text-white">Instant Generation</h4>
                    <p className="text-sm text-gray-300">Turn ideas into full songs in seconds with customizable AI agents.</p>
                </div>
                 <div className="bg-white/5 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
                    <h4 className="text-lg font-semibold mb-2 text-white">In-Depth Analysis</h4>
                    <p className="text-sm text-gray-300">Break down flow, rhyme schemes, syllables, and more to refine your craft.</p>
                </div>
                 <div className="bg-white/5 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
                    <h4 className="text-lg font-semibold mb-2 text-white">Guided Writing</h4>
                    <p className="text-sm text-gray-300">Use analysis results to guide AI generation for consistent style and structure.</p>
                </div>
            </div>
        </section>

        {/* --- Music Section (Combined Artist + Top Songs) --- */}
         <section className="w-full max-w-6xl my-16 sm:my-24 backdrop-blur-sm bg-black/30 p-6 sm:p-8 rounded-lg border border-white/10">
             {/* Placeholder for Graphs/Trends */}
             <div className="text-center mb-8">
                 <h3 className="text-2xl font-bold mb-4 text-white">Music Trends & Insights</h3>
                 <p className="text-gray-400 italic">(Graphs and trend data coming soon...)</p>
             </div>
             {/* Spotify Embeds */}
             <div
                className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start"
                onClick={pauseBackgroundAudio}
                onFocus={pauseBackgroundAudio}
                tabIndex={-1}
             >
                 {/* My Artist Info Column */}
                 <div className="flex flex-col items-center">
                     <h3 className="text-2xl font-bold mb-4 text-white">My Music</h3>
                     <p className="text-sm text-gray-300 mb-6 text-center">Experience my beats and tracks.</p>
                     {/* Artist Embed iframe */}
                     <iframe
                        style={{ borderRadius: '12px', border: 'none', width: '100%', maxWidth: '400px', height: '352px' }}
                        src="https://open.spotify.com/embed/artist/3i7KKztiuNxSgo146aHLIZ?utm_source=generator&theme=0"
                        allowFullScreen={false}
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        title="Spotify Artist Embed - BryAlvin XII"
                      ></iframe>
                 </div>
                 {/* Top Songs Column */}
                 <div className="flex flex-col items-center">
                      <h3 className="text-2xl font-bold mb-4 text-white">Top Global Songs</h3>
                      <p className="text-sm text-gray-300 mb-6 text-center">Current hits on Spotify.</p>
                      {/* Top 50 Playlist iframe embed */}
                      <iframe
                        style={{ borderRadius: '12px', border: 'none', width: '100%', maxWidth: '400px', height: '352px' }}
                        src="https://open.spotify.com/embed/playlist/37i9dQZEVXbMDoHDwVN2tF?utm_source=generator&theme=0"
                        allowFullScreen={false}
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        title="Spotify Top 50 Global Playlist"
                      ></iframe>
                 </div>
             </div>
        </section>

        {/* --- About Me Section --- */}
        <section className="w-full max-w-4xl my-16 sm:my-24 text-center backdrop-blur-sm bg-black/30 p-6 sm:p-8 rounded-lg border border-white/10">
             <h2 className="text-3xl font-bold mb-8 text-white">About Me</h2>
             {/* Image Collage */}
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
                {[ 'VINN1.jpg', 'VINN2.jpg', 'VINN4.jpg', 'VINN7.jpg', 'VINN55.jpg', 'VINN56.jpg'].map((imgName) => (
                    <div key={imgName} className="relative aspect-square overflow-hidden rounded-lg shadow-lg border border-white/10">
                        <Image
                            src={`/${imgName}`}
                            alt={`Image of BryAlvin XII - ${imgName}`}
                            layout="fill"
                            objectFit="cover"
                            className="transition-transform duration-300 hover:scale-105"
                        />
                    </div>
                ))}
             </div>
             <p className="text-md text-gray-200 mb-4 max-w-2xl mx-auto">
                Hey, I’m <span className="font-semibold">BryAlvin XII</span> – a record producer and artist originally from Kampala, Uganda and now based in Berlin. I built this AI tool to break creative boundaries and help fellow artists overcome writer’s block. My journey in music has always been about blending tradition with innovation, and this platform is a testament to that passion. Whether you’re here to craft the next hit lyric or discover fresh beats, I’m excited to share my world with you.
             </p>
             <p className="text-md text-gray-300 italic max-w-2xl mx-auto">
                "I created this tool because I know the struggle of facing a blank page. With AI on our side, creativity flows easier and faster, letting us focus on the art and emotion behind every lyric."
             </p>
             <p className="text-lg font-semibold text-white mt-6 mb-2">A Place In Time Entertainment</p>
             <p className="text-md text-gray-300 italic">
                "Crafting timeless creativity from this moment to eternity, leaving a boundless impact on culture."
             </p>
             <p className="text-sm text-gray-400 mt-4">
                Founded by Bryan Alvin Bagorogoza, APIT is a home for creatives, with a future vision extending into film and beyond.
             </p>
        </section>

        {/* Footer */}
        <footer className="w-full text-center text-xs text-gray-300/80 mt-10 py-4 border-t border-white/10">
          A Place In Time Entertainment
        </footer>
      </main>

      {/* Audio Controls */}
      <div ref={audioControlsRef} className="fixed bottom-5 right-5 z-50 flex items-center gap-3 p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 shadow-lg">
        <button onClick={toggleMute} className="p-1 rounded-full hover:bg-white/20 transition-colors" aria-label={isMuted ? "Unmute background audio" : "Mute background audio"}>
          {isMuted ? ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l-2.25 2.25M15 9.75 14.25 12l.75 2.25m-4.5 0L7.5 12l-.75-2.25M3 10.055 3 9.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.305m-3 0V12a6 6 0 0 0 6 6m-6 0a6 6 0 0 1 6-6m-6 0H4.5m6 6H6.375m6.375 0L10.5 18.75m0 0L11.25 12l1.25-2.25" /><path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18" /></svg> )
          : ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg> )}
        </button>
        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-400" aria-label="Volume slider" />
      </div>
    </> // Closing fragment tag
  );
}
