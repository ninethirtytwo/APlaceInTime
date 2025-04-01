"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import SpotifyArtistInfo from '@/components/SpotifyArtistInfo';
import SpotifyTopSongs from '@/components/SpotifyTopSongs'; // Import the top songs component

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

export default function Home() {
  // --- State Variables ---
  const [lyricsInput, setLyricsInput] = useState(''); // For analysis input (middle panel)
  const [ideaInput, setIdeaInput] = useState(''); // For generation input (left panel)
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [selectedAgents, setSelectedAgents] = useState<string[]>(['lead']);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedEra, setSelectedEra] = useState('');
  const [moodInput, setMoodInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Handler Functions ---
  const handleAgentSelection = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  };

  async function handleAnalyzeFlow() {
    setAnalysisLoading(true); setAnalysisError(null); setAnalysisResult(null);
    const lyricsToAnalyze = lyricsInput;
    if (!lyricsToAnalyze) { setAnalysisError("No lyrics provided to analyze."); setAnalysisLoading(false); return; }
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lyrics: lyricsToAnalyze }), });
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
    const contextLyrics = null;
    try {
      const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: promptInput, context: contextLyrics, agents: selectedAgents, genre: selectedGenre, era: selectedEra, mood: moodInput, analysis: analysisResult }), });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.error || `HTTP error! status: ${response.status}`); }
      setGeneratedLyrics(data.generatedLyrics);
    } catch (error) { console.error("Generation fetch error:", error); setGenerationError(error instanceof Error ? error.message : "Failed to fetch generation."); }
    finally { setGenerationLoading(false); }
  }

  // --- Audio Handling ---
  useEffect(() => {
    if (!audioRef.current) {
        audioRef.current = new Audio('/ocean.wav.wav'); // Ensure correct path
        audioRef.current.onerror = (e) => { console.error("Audio Error Event:", e); if (audioRef.current) audioRef.current.src = '/ocean.wav.wav'; };
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
           {/* 3-Column Grid Layout for Tools */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 backdrop-blur-lg bg-black/40 p-6 sm:p-8 rounded-xl shadow-2xl border border-white/10">
              {/* --- Left Panel: Generator --- */}
              <div className="flex flex-col gap-5 min-h-[70vh]">
                <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">AI Generator</h3>
                 {/* Idea Input */}
                 <div className="flex flex-col gap-2">
                   <label htmlFor="idea-input" className="text-sm font-medium text-gray-300">Your Idea / Prompt:</label>
                   <textarea id="idea-input" placeholder="Enter song concept, theme, or starting lines..." className="w-full p-3 rounded bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-100 resize-none transition-colors duration-200 min-h-[100px]" value={ideaInput} onChange={(e) => setIdeaInput(e.target.value)} disabled={generationLoading} />
                 </div>
                 {/* Generation Parameter Controls */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="flex flex-col gap-1"> <label htmlFor="genre-select" className="text-sm font-medium text-gray-300">Genre:</label> <select id="genre-select" className="p-2 rounded bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-100 disabled:opacity-60 transition-colors duration-200" disabled={generationLoading} value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}> <option value="">Any</option> <option value="trap">Trap</option> <option value="boom-bap">Boom Bap</option> <option value="rnb">R&B</option> <option value="pop-rap">Pop Rap</option> <option value="conscious">Conscious</option> <option value="drill">Drill</option> <option value="lo-fi">Lo-fi</option> </select> </div>
                   <div className="flex flex-col gap-1"> <label htmlFor="era-select" className="text-sm font-medium text-gray-300">Era:</label> <select id="era-select" className="p-2 rounded bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-100 disabled:opacity-60 transition-colors duration-200" disabled={generationLoading} value={selectedEra} onChange={(e) => setSelectedEra(e.target.value)}> <option value="">Any</option> <option value="80s">80s</option> <option value="90s">90s</option> <option value="2000s">2000s</option> <option value="2010s">2010s</option> <option value="modern">Modern</option> </select> </div>
                   <div className="flex flex-col gap-1 sm:col-span-2"> <label htmlFor="mood-input" className="text-sm font-medium text-gray-300">Mood:</label> <input id="mood-input" type="text" placeholder="e.g., nostalgic, energetic" className="p-2 rounded bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-100 disabled:opacity-60 transition-colors duration-200" value={moodInput} onChange={(e) => setMoodInput(e.target.value)} disabled={generationLoading} /> </div>
                 </div>
                {/* Generate Button */}
                <button className="mt-3 px-5 py-2 rounded bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium transition-colors duration-200 self-center disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleGenerateOrFinish} disabled={generationLoading || !ideaInput}>
                  {generationLoading ? 'Generating...' : 'Generate Lyrics'}
                </button>
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
                 <div className="flex flex-col gap-2 flex-grow">
                   <label htmlFor="analyze-input" className="text-sm font-medium text-gray-300">Lyrics to Analyze:</label>
                   <textarea id="analyze-input" placeholder="Paste lyrics here for analysis..." className="w-full flex-grow p-3 rounded bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-100 resize-none transition-colors duration-200 min-h-[200px]" value={lyricsInput} onChange={(e) => setLyricsInput(e.target.value)} disabled={analysisLoading} />
                 </div>
                 <button className="mt-1 px-5 py-2 rounded bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium transition-colors duration-200 self-center disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleAnalyzeFlow} disabled={analysisLoading || !lyricsInput}>
                   {analysisLoading ? 'Analyzing...' : 'Analyze Flow'}
                 </button>
                 <div className="p-4 rounded bg-black/40 border border-white/10 flex-grow overflow-y-auto text-sm space-y-3 mt-3 min-h-[200px]">
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
              </div>

              {/* --- Right Panel: AI Writing Team --- */}
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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
                 {/* My Artist Info Column */}
                 <div className="flex flex-col items-center">
                     <h3 className="text-2xl font-bold mb-4 text-white">My Music</h3>
                     <p className="text-sm text-gray-300 mb-6 text-center">Experience my beats and tracks.</p>
                     <SpotifyArtistInfo />
                     {/* Analyze button removed for now */}
                 </div>
                 {/* Top Songs Column */}
                 <div className="flex flex-col items-center">
                      <h3 className="text-2xl font-bold mb-4 text-white">Top Global Songs</h3>
                      <p className="text-sm text-gray-300 mb-6 text-center">Current hits on Spotify.</p>
                      <SpotifyTopSongs />
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
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 shadow-lg">
        <button onClick={toggleMute} className="p-1 rounded-full hover:bg-white/20 transition-colors" aria-label={isMuted ? "Unmute background audio" : "Mute background audio"}>
          {isMuted ? ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l-2.25 2.25M15 9.75 14.25 12l.75 2.25m-4.5 0L7.5 12l-.75-2.25M3 10.055 3 9.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.305m-3 0V12a6 6 0 0 0 6 6m-6 0a6 6 0 0 1 6-6m-6 0H4.5m6 6H6.375m6.375 0L10.5 18.75m0 0L11.25 12l1.25-2.25" /><path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18" /></svg> )
          : ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg> )}
        </button>
        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-400" aria-label="Volume slider" />
      </div>
    </> // Closing fragment tag
  );
}
