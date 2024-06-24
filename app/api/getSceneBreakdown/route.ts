import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCharacters, updateCharacters } from '@/lib/characters';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function cleanResponse(response: string): string {
  // Remove any potential markdown formatting
  return response.replace(/```json\n?|\n?```/g, '').trim();
}

async function callAnthropicAPI(prompt: string, retryCount = 0): Promise<any> {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      temperature: 0.7,
      system: "You are a skilled film director and screenwriter, adept at creating vivid, cinematic scene descriptions. Always respond with valid JSON without any Markdown formatting.",
      messages: [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": prompt
            }
          ]
        }
      ]
    });

    const cleanedResponse = cleanResponse(msg.content[0].text);
    return JSON.parse(cleanedResponse);
  } catch (error: any) {
    if (retryCount < 2) {
      console.log(`API call failed, retrying (attempt ${retryCount + 2}/3)...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return callAnthropicAPI(prompt, retryCount + 1);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const { text, bookTitle, segmentIndex } = await request.json();

  const characters = await getCharacters(bookTitle);
  const characterInfo = characters.map(c => `${c.name}: ${c.description}`).join('\n');

  const prompt = `As a visionary film director, create a detailed storyboard for the following scene from "${bookTitle}". Break it down into cinematic shots, capturing the tone, atmosphere, and character nuances. For each shot, describe the camera angle, lighting, and any significant visual elements. Remember to convey the emotional undertones and subtext.

Known characters in the book:
${characterInfo}

Text to analyze:
${text}

Provide the scene breakdown as a JSON array with the following structure for each shot:
[
  {
    "shotNumber": 1,
    "characters": ["Character A", "Character B"],
    "description": "Close-up on Character A's furrowed brow, soft lighting emphasizing the worry lines. Camera slowly pans to reveal Character B in the background, out of focus but visibly tense.",
    "dialogue": "Any significant dialogue or narration, if applicable",
    "tone": "Tense, foreboding"
  },
  ...
]

Also, provide a list of any new characters introduced in this scene, with brief descriptions:
{
  "newCharacters": [
    {
      "name": "Character C",
      "description": "Brief description of Character C"
    },
    ...
  ]
}

Respond with a JSON object containing both the 'shots' array and the 'newCharacters' object. Do not include any Markdown formatting in your response.`;

  try {
    const response = await callAnthropicAPI(prompt);
    
    // Update characters
    if (response.newCharacters && response.newCharacters.length > 0) {
      const updatedCharacters = [...characters, ...response.newCharacters];
      await updateCharacters(bookTitle, updatedCharacters);
    }

    return NextResponse.json({ shots: response.shots, newCharacters: response.newCharacters });
  } catch (error) {
    console.error('Error generating scene breakdown:', error);
    return NextResponse.json({ error: 'Error generating scene breakdown' }, { status: 500 });
  }
}