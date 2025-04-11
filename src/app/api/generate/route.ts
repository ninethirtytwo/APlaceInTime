import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Define a basic interface for the expected analysis context
interface AnalysisContext {
  syllablesPerLine?: number[];
  rhymeSchemeAnalysis?: string;
  rhythmAndPacing?: string;
  overallComplexity?: string;
  // Add other fields if they are consistently used in the prompt logic
  [key: string]: unknown; // Use unknown instead of any for index signature
}

// Define flow pattern descriptions
const FLOW_PATTERNS: Record<string, string> = {
  'standard': 'Regular rhythm with evenly spaced syllables',
  'triplet': 'Three syllables in the space of two beats (like Migos)',
  'double-time': 'Twice as many syllables per beat, creating a fast-paced delivery',
  'choppy': 'Staccato delivery with deliberate pauses between words or phrases',
  'melodic': 'Singing-rapping hybrid with pitch variation and melodic elements',
  'syncopated': 'Emphasis on off-beats, creating a bouncy, unpredictable rhythm',
  'percussive': 'Using words as percussion instruments, emphasizing consonant sounds',
  'laid-back': 'Slightly behind the beat, creating a relaxed, effortless feel',
  'push-ahead': 'Slightly ahead of the beat, creating an urgent, energetic feel',
  'call-response': 'Question-answer pattern, often with contrasting delivery styles'
};

// Helper function to build the Claude prompt based on agents, parameters, and analysis context
function buildAgentPrompt(
    idea: string,
    agents: string[],
    genre: string,
    era: string,
    mood: string,
    contextLyrics?: string | null,
    analysisContext?: AnalysisContext | null, // Use the interface, allow null
    storyline?: string | null, // Add storyline parameter
    structureId?: string | null, // Use structureId instead of structure object
    flowPattern?: string | null // Add flow pattern parameter
): string {
  let prompt = `You are an expert songwriting assistant collaborating with a user, acting as a specific AI writing team member or a lead integrating multiple perspectives. `;

  const agentDetails = {
    lead: "Act as the Lead Writer, supervising and integrating various styles. Ensure a cohesive final output.",
    poet: "Emphasize strong metaphors, wordplay, and evocative imagery like a Literary Poet.",
    mood: "Focus intensely on capturing the specified mood.",
    pop: "Incorporate relevant modern slang, pop culture references, and trends.",
    analogy: "Weave in clever analogies, common sayings, or idioms naturally.",
    philosophy: "Add depth with philosophical or psychological insights.",
    eras: "Write in a style reminiscent of a specific musical era.",
    genre: "Adhere closely to the conventions of a specific genre."
  };

  // Define Agent Roles
  if (agents.includes('lead') || agents.length === 0) {
    prompt += agentDetails.lead + " ";
    prompt += "Consider elements from all other available perspectives (poetry, mood, pop culture, analogy, philosophy, era, genre) as appropriate. ";
  } else {
    prompt += "Embody ONLY the following selected roles: ";
    agents.forEach(agentId => {
      if (agentDetails[agentId as keyof typeof agentDetails]) {
        prompt += `\n- ${agentDetails[agentId as keyof typeof agentDetails]}`;
      }
    });
    prompt += "\n"; // Add newline after listing roles
  }

  // Add specific instructions based on parameters
  if (genre) prompt += `The target genre is ${genre}. `;
  if (era) prompt += `The desired era style is ${era}. `;
  if (mood) prompt += `The mood should be ${mood}. `;

  // Add flow pattern instructions if provided
  if (flowPattern && FLOW_PATTERNS[flowPattern]) {
    prompt += `\n\nUse a ${flowPattern} flow pattern: ${FLOW_PATTERNS[flowPattern]}. `;
  }

  // Incorporate Analysis Context if provided
  if (analysisContext && typeof analysisContext === 'object' && Object.keys(analysisContext).length > 0 && !analysisContext.error) {
    prompt += `\n\nThe user has provided lyrics which have been analyzed. Use these key characteristics to guide the generation or continuation:`;
    if (analysisContext.syllablesPerLine) prompt += `\n- Syllable Pattern Per Line: [${analysisContext.syllablesPerLine.join(', ')}] (try to follow this pattern)`;
    if (analysisContext.rhymeSchemeAnalysis) prompt += `\n- Rhyme Scheme: ${analysisContext.rhymeSchemeAnalysis} (try to follow this scheme)`;
    if (analysisContext.rhythmAndPacing) prompt += `\n- Rhythm/Pacing: ${analysisContext.rhythmAndPacing} (match this feel)`;
    if (analysisContext.overallComplexity) prompt += `\n- Complexity: ${analysisContext.overallComplexity}`;
    // Add more analysis fields if needed
  }

  // Define the Core Task
  prompt += `\n\nYour task is to generate compelling and creative song lyrics based on the user's idea/request below. Adhere strictly to the selected agent roles, genre/era/mood parameters, and any provided analysis context/style.`;
  if (storyline) {
    prompt += ` The lyrics should follow this narrative or storyline: ${storyline}.`;
  }
  if (contextLyrics) {
    prompt += ` Use the following existing lyrics as context or inspiration:\n---\n${contextLyrics}\n---\n`;
    prompt += ` Either continue them seamlessly or write new lyrics inspired by them and the analysis.`;
  } else {
     prompt += ` Generate complete lyrics.`; // Simplified base instruction
  }
  // Request structure labels
  prompt += ` Clearly label the different sections of the song using bracketed tags like [Verse 1], [Chorus], [Bridge], [Hook], [Pre-Chorus], [Outro], etc. **Each label must be on its own line.**`; // Added Pre-Chorus to example labels

  // Add structure instructions based on structureId
  prompt += `\n\nUse the following song structure format: `;
  switch (structureId) {
    case 'verse-chorus':
      prompt += `Standard Verse-Chorus (e.g., Verse 1, Chorus, Verse 2, Chorus). Include at least 2 verses.`;
      break;
    case 'verse-chorus-bridge':
      prompt += `Verse-Chorus-Bridge (e.g., Verse 1, Chorus, Verse 2, Chorus, Bridge, Chorus). Include at least 2 verses.`;
      break;
    case 'verse-prechorus-chorus':
      prompt += `Verse-PreChorus-Chorus (e.g., Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus). Include at least 2 verses.`;
      break;
    case 'strophic':
      prompt += `Strophic (Verse Repeating, AAA...). Write several verses (at least 3) with the same melody but different lyrics. No distinct chorus section.`;
      break;
    case 'aaba':
      prompt += `AABA (32-Bar Form). Structure it as A section (8 bars), A section (8 bars, different lyrics), B section/Bridge (8 bars, contrasting), A section (8 bars, return to main theme).`;
      break;
    case '12-bar-blues':
      prompt += `12-Bar Blues. Follow the standard 12-bar blues progression and AAB lyrical pattern if appropriate for the idea.`;
      break;
    case 'pop-standard':
      prompt += `Standard Pop (VCVCBC - Verse, Chorus, Verse, Chorus, Bridge, Chorus).`;
      break;
    case 'pop-modern':
      prompt += `Modern Pop Formula (Intro, Verse, Pre-Chorus, Chorus, Verse, Pre-Chorus, Chorus, Bridge, Chorus, Outro). Ensure a catchy hook in the chorus and pre-chorus.`;
      break;
    case 'pop-chorus-first':
      prompt += `Chorus First Pop. Start the song directly with the [Chorus] section for immediate impact, then proceed with verses, etc.`;
      break;
    case 'rock-standard-solo':
      prompt += `Standard Rock with Solo (e.g., Intro, Verse, Chorus, Verse, Chorus, Bridge, Guitar Solo, Chorus, Outro).`;
      break;
    case 'hiphop-standard':
      prompt += `Standard Hip-Hop (e.g., Intro, Verse 1, Chorus/Hook, Verse 2, Chorus/Hook, Bridge, Verse 3, Chorus/Hook, Outro). Use 16-bar verses typically.`;
      break;
    case 'hiphop-hook-emphasis':
      prompt += `Hip-Hop Hook Emphasis (e.g., Hook, Verse 1, Hook, Verse 2, Hook, Bridge, Hook). Focus on a repetitive, catchy hook.`;
      break;
    case 'through-composed':
      prompt += `Through-Composed. Do not repeat any major sections. Develop the music and lyrics continuously to follow the narrative or idea.`;
      break;
    case 'custom':
    default: // Default to AI deciding if 'custom' or unknown ID is selected
      prompt += `AI Decides Best. Analyze the user's idea, genre, mood, and era, then choose the most appropriate and effective song structure. Ensure it includes at least a verse and a chorus or hook.`;
      break;
  }

  prompt += `\n\nUser Idea/Request: "${idea}"`;

  // Explicitly request the desired formatting
  prompt += `\n\nIMPORTANT: Format the generated lyrics output carefully. Use '\\n' ONLY for line breaks. Each distinct lyrical line MUST start on a new line (begin with '\\n' if it's not the very first line). Also use '\\n' within a lyrical line to indicate significant rhythmic pauses or breaths, like this flow example: "Iced out, I flex this\\nnew drop\\nFresh pack\\nwho's next up?". Ensure structure labels like [Chorus] are also on their own lines, preceded by '\\n'. Output ONLY the formatted lyrics, with no other explanatory text before or after.`; // Further refined formatting instruction

  return prompt;
}


export async function POST(request: Request) {
  try {
    const { prompt: idea, context, agents, genre, era, mood, storyline, analysis, structureId, flowPattern } = await request.json(); // Added flowPattern

    // Basic validation
    if (!idea || typeof idea !== 'string') {
      return NextResponse.json({ error: 'Idea/Prompt is required.' }, { status: 400 });
    }
    if (!agents || !Array.isArray(agents)) {
       return NextResponse.json({ error: 'Agents must be an array.' }, { status: 400 });
    }

    // --- Use Claude API ---
    const model = "claude-3-5-sonnet-20240620"; // Corrected typo: Use hyphens instead of period

    // Build the dynamic prompt using the helper function
    const finalPrompt = buildAgentPrompt(idea, agents, genre || '', era || '', mood || '', context, analysis, storyline, structureId, flowPattern); // Pass flowPattern

    console.log(`Sending final prompt to Claude (length: ${finalPrompt.length}): ${finalPrompt.substring(0, 300)}...`); // Log beginning of prompt

    try {
      const msg = await anthropic.messages.create({
        model: model,
        max_tokens: 4096, // Generous token limit
        messages: [{ role: 'user', content: finalPrompt }],
      });

      // Extract the text content
      let generatedLyrics = '';
       if (msg.content && msg.content[0] && msg.content[0].type === 'text') {
          generatedLyrics = msg.content[0].text.trim(); // Trim whitespace
      } else {
          throw new Error("Unexpected response structure from Claude API");
      }

      console.log("Claude Response Text:", generatedLyrics);
      // Basic check if the response looks like lyrics or an error message
      if (generatedLyrics.startsWith('[')) { // Assume lyrics start with a structure tag
          return NextResponse.json({ generatedLyrics });
      } else {
          // If it doesn't look like lyrics, treat it as an explanation/error from Claude
          console.warn("Claude response did not start with expected structure tag, treating as explanation/error.");
          // Return the plain text response wrapped in an error object for the frontend
          return NextResponse.json({ error: `Claude responded: ${generatedLyrics.substring(0, 300)}${generatedLyrics.length > 300 ? '...' : ''}` }, { status: 200 }); // Use 200 to let frontend display the message
      }

    } catch (apiError) { // Use unknown or Error type
        console.error("Claude API Error during generation:", apiError);
        let errorMessage = "Failed to generate lyrics via Claude API.";
        if (apiError instanceof Error) {
             errorMessage = `Failed to generate lyrics via Claude API: ${apiError.message}`;
        }
        // Anthropic SDK might have specific error types/codes for safety or other issues
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

  } catch (error) { // Use unknown or Error type
    // General error handling
    console.error("General Generation API Error:", error);
    let generalErrorMessage = "An unexpected error occurred during generation.";
     if (error instanceof Error) {
        generalErrorMessage = `An unexpected error occurred during generation: ${error.message}`;
    }
    return NextResponse.json({ error: generalErrorMessage }, { status: 500 });
  }
}