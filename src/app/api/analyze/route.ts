import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Define the expected JSON structure for type safety (optional but good practice)
interface AnalysisResponse {
    syllablesPerLine?: number[];
    rhymeSchemeAnalysis?: string;
    rhymeDetails?: { words: string[]; type: string }[];
    rhythmAndPacing?: string;
    repetitionTechniques?: string[];
    overallComplexity?: string;
    melodySuggestion?: string;
    keyObservations?: string[];
    formattedLyrics?: string;
    error?: string; // For potential parsing errors
}

export async function POST(request: Request) {
  try {
    const { lyrics } = await request.json();

    if (!lyrics || typeof lyrics !== 'string') {
      return NextResponse.json({ error: 'Lyrics are required and must be a string.' }, { status: 400 });
    }

    // --- Use Claude API for Analysis ---
    const model = "claude-3-opus-20240229"; // Or another suitable Claude model like claude-3-sonnet...

    // Craft prompt for Claude, emphasizing JSON output
    const prompt = `Analyze the flow and structure of the following rap lyrics in detail. Provide the analysis ONLY as a single JSON object containing the following keys:
- "syllablesPerLine": Array of approximate syllable counts per line (integer[]).
- "rhymeSchemeAnalysis": Description of the overall end rhyme scheme (string).
- "rhymeDetails": Array of objects, each describing a significant rhyme group, including: {"words": string[], "type": "perfect" | "slant" | "multi-syllable" | "internal"} (object[]).
- "rhythmAndPacing": Description of the rhythm and pacing (string).
- "repetitionTechniques": Array of repetition techniques used (string[]).
- "overallComplexity": Brief assessment ("Simple", "Moderate", "Complex") (string).
- "melodySuggestion": A brief suggestion for a potential melodic approach based on the rhythm and structure (string).
- "keyObservations": Array of other key observations about flow or delivery (string[]).
- "formattedLyrics": The original input lyrics reformatted with line breaks indicating natural pauses or melodic phrases, using '\\n' for newlines (string).

Lyrics to Analyze:
---
${lyrics}
---

JSON Output:`;

    console.log(`Sending analysis prompt to Claude for lyrics: ${lyrics.substring(0, 50)}...`);

    try {
      const msg = await anthropic.messages.create({
        model: model,
        max_tokens: 4096, // Use a generous token limit
        messages: [{ role: 'user', content: prompt }],
      });

      // Extract the text content - Claude SDK structure might differ slightly
      // Assuming the main content is in the first block of the first message content
      let analysisText = '';
      if (msg.content && msg.content[0] && msg.content[0].type === 'text') {
          analysisText = msg.content[0].text;
      } else {
          throw new Error("Unexpected response structure from Claude API");
      }

      console.log("Claude Analysis Response Text:", analysisText);

      // Attempt to parse the JSON response from Claude
      // Use regex to extract the main JSON object, ignoring potential preamble/postamble/fences
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/); // Find text between first { and last }
      if (jsonMatch && jsonMatch[0]) {
          analysisText = jsonMatch[0];
          console.log("Extracted JSON string:", analysisText);
      } else {
          console.error("Could not extract JSON object from Claude response using regex:", analysisText);
          // Try basic trim as fallback before erroring
          analysisText = analysisText.trim();
          if (!analysisText.startsWith('{') || !analysisText.endsWith('}')) {
             throw new Error("Invalid format received from analysis API (no JSON object found).");
          }
      }

      let analysisResults: AnalysisResponse;
      try {
          analysisResults = JSON.parse(analysisText);
      } catch (parseError) {
          console.error("Failed to parse Claude JSON response:", parseError);
          console.error("Raw response was:", analysisText);
          analysisResults = {
              error: `Failed to parse analysis JSON. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          };
          // Return 200 but include the error in the body for frontend handling
      }

      return NextResponse.json(analysisResults);

    } catch (apiError: any) {
        console.error("Claude API Error during analysis:", apiError);
        return NextResponse.json({ error: `Failed to analyze lyrics via Claude API: ${apiError.message}` }, { status: 500 });
    }

  } catch (error) {
    // General error handling
    console.error("General Analysis API Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred during analysis." }, { status: 500 });
  }
}