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

// Helper function to build the Claude prompt based on agents, parameters, and analysis context
function buildAgentPrompt(
    idea: string,
    agents: string[],
    genre: string,
    era: string,
    mood: string,
    contextLyrics?: string | null,
    analysisContext?: AnalysisContext | null, // Use the interface, allow null
    storyline?: string | null // Add storyline parameter
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
     prompt += ` Generate complete lyrics including verses and a chorus minimum.`;
  }
  // Request structure labels
  prompt += ` Clearly label the different sections of the song using bracketed tags like [Verse 1], [Chorus], [Bridge], [Hook], [Pre-Hook], [Outro], etc. Place each label on its **own line** before the section begins.`; // Added emphasis on own line

  prompt += `\n\nUser Idea/Request: "${idea}"`;

  // Explicitly request the desired formatting
  prompt += `\n\nIMPORTANT: Format the generated lyrics output carefully. Use '\\n' to represent line breaks. Each distinct lyrical line should start on a new line (using '\\n'). **Crucially, also use '\\n' within a lyrical line to indicate significant rhythmic pauses, breaths, or melodic phrases, similar to this flow example:** "Iced out, I flex this\\nnew drop\\nFresh pack\\nwho's next up?". Ensure structure labels like [Chorus] are also on their own lines. Do not include any other explanatory text, just the formatted lyrics.`; // Refined formatting instruction

  return prompt;
}


export async function POST(request: Request) {
  try {
    const { prompt: idea, context, agents, genre, era, mood, storyline, analysis } = await request.json(); // Add storyline

    // Basic validation
    if (!idea || typeof idea !== 'string') {
      return NextResponse.json({ error: 'Idea/Prompt is required.' }, { status: 400 });
    }
    if (!agents || !Array.isArray(agents)) {
       return NextResponse.json({ error: 'Agents must be an array.' }, { status: 400 });
    }

    // --- Use Claude API ---
    const model = "claude-3-opus-20240229"; // Or claude-3-sonnet...

    // Build the dynamic prompt using the helper function
    const finalPrompt = buildAgentPrompt(idea, agents, genre || '', era || '', mood || '', context, analysis, storyline); // Pass storyline

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
      return NextResponse.json({ generatedLyrics });

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