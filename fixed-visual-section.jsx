{/* --- Visual Inspirations Section --- */}
<motion.section
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.8 }}
  className="w-full max-w-4xl my-16 sm:my-24 text-center backdrop-blur-sm bg-black/30 p-6 sm:p-8 rounded-lg border border-white/10"
>
     <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 text-white">Visual Inspirations</h2>
        <p className="text-md text-gray-300">Moodboard & Aesthetics</p>
     </div>
     
     {/* Full-width Image Gallery */}
     <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8 w-full max-w-none mx-0">
        {[ 'VINN1.jpg', 'VINN2.jpg', 'VINN4.jpg', 'VINN7.jpg', 'VINN55.jpg', 'VINN56.jpg'].map((imgName) => (
            <div key={imgName} className="relative aspect-square overflow-hidden rounded-lg shadow-lg border border-white/10">
                <Image
                    src={`/${imgName}`}
                    alt={`Image of BryAlvin XII - ${imgName}`}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="transition-transform duration-300 hover:scale-105"
                />
            </div>
        ))}
     </div>
     
     {/* About Vinn Dropdown */}
     <div className="mb-6">
        <button 
            onClick={() => setIsAboutExpanded(!isAboutExpanded)}
            className="flex items-center justify-center w-full py-2 px-4 bg-black/40 hover:bg-black/50 rounded-lg border border-white/10 transition-colors duration-200"
        >
            <span className="font-medium text-white">About Vinn</span>
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`w-5 h-5 ml-2 transition-transform duration-200 ${isAboutExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
        
        {/* Collapsible Bio Content */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isAboutExpanded ? 'max-h-96 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="text-md text-gray-200 p-4 bg-black/20 rounded-lg border border-white/10">
                <p className="mb-4">
                    Hey, I'm <span className="font-semibold">BryAlvin XII</span> – a record producer and artist originally from Kampala, Uganda and now based in Berlin. I built this AI tool to break creative boundaries and help fellow artists overcome writer's block. My journey in music has always been about blending tradition with innovation, and this platform is a testament to that passion. Whether you're here to craft the next hit lyric or discover fresh beats, I'm excited to share my world with you.
                </p>
                <p className="text-md text-gray-300 italic mb-4">
                    "I created this tool because I know the struggle of facing a blank page. With AI on our side, creativity flows easier and faster, letting us focus on the art and emotion behind every lyric."
                </p>
                <p className="text-lg font-semibold text-white mb-2">A Place In Time Entertainment</p>
                <p className="text-md text-gray-300 italic mb-4">
                    "Crafting timeless creativity from this moment to eternity, leaving a boundless impact on culture."
                </p>
                <p className="text-sm text-gray-400">
                    Founded by Bryan Alvin Bagorogoza, APIT is a home for creatives, with a future vision extending into film and beyond.
                </p>
            </div>
        </div>
     </div>
</motion.section>
