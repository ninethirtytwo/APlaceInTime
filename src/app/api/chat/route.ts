import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Define message structure for chat history
interface ChatMessage {
  role: 'user' | 'assistant'; // Claude uses 'user' and 'assistant'
  content: string;
}

// Define the expected request body structure
interface ChatRequestBody {
  message: string;
  history?: ChatMessage[]; // Optional conversation history
}

export async function POST(request: Request) {
  try {
    const { message, history = [] }: ChatRequestBody = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    // --- Use Claude API for Chat ---
    const model = "claude-3-opus-20240229"; // Or claude-3-sonnet / claude-3-haiku

    // Construct the prompt for Vinn
    const systemPrompt = `You are Vinn, an AI creative partner specializing in music lyrics and analysis, embedded within the 'A Place In Time Entertainment' platform. Your personality is helpful, knowledgeable, slightly cool, and encouraging. You assist users with generating lyrics, analyzing flow, understanding music concepts, and finding information (like lyrics for existing songs, relying on your training data or formulating search queries if asked directly). Keep responses concise and focused on the user's creative task unless asked for broader conversation. If asked for lyrics you don't know, politely state you couldn't find them in your data but can help generate something similar or analyze lyrics the user provides.`;

    // Combine history with the new user message
    const messages: Anthropic.Messages.MessageParam[] = [
        ...history,
        { role: 'user', content: message }
    ];

    console.log(`Sending chat message to Claude: ${message}`);

    try {
      const msg = await anthropic.messages.create({
        model: model,
        max_tokens: 1024, // Adjust token limit as needed for chat
        system: systemPrompt, // Provide the persona/instructions
        messages: messages,
      });

      // Extract the response text
      let responseText = '';
       if (msg.content && msg.content[0] && msg.content[0].type === 'text') {
          responseText = msg.content[0].text.trim();
      } else {
          console.warn("Unexpected response structure from Claude chat API:", msg);
          responseText = "Sorry, I encountered an issue processing that.";
      }

      console.log("Claude Chat Response:", responseText);
      return NextResponse.json({ reply: responseText });

    } catch (apiError) {
        console.error("Claude API Error during chat:", apiError);
        let errorMessage = "Sorry, I couldn't process that request.";
        if (apiError instanceof Error) {
             errorMessage = `Chat API Error: ${apiError.message}`;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

  } catch (error) {
    console.error("General Chat API Error:", error);
    let generalErrorMessage = "An unexpected error occurred in the chat API.";
     if (error instanceof Error) {
        generalErrorMessage = `Chat API Error: ${error.message}`;
    }
    return NextResponse.json({ error: generalErrorMessage }, { status: 500 });
  }
}