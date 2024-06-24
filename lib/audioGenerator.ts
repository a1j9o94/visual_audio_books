import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI();

async function createSpeech(text: string, retryCount = 0): Promise<any> {
  try {
    return await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });
  } catch (error: any) {
    if (error.status === 429 && retryCount < 2) { // 429 is the status code for rate limit errors
      console.log(`Rate limit reached, retrying (attempt ${retryCount + 2}/3)...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return createSpeech(text, retryCount + 1);
    }
    throw error;
  }
}

export async function generateAudioForSegment(text: string, segmentId: number, bookTitle: string, outputDir: string): Promise<string> {
  if (!outputDir) {
    throw new Error('Output directory is not specified');
  }

  const filename = `${bookTitle}_segment_${segmentId}.mp3`;
  const speechFile = path.join(outputDir, filename);
  
  try {
    const mp3 = await createSpeech(text);

    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);

    return `/audio/${filename}`;
  } catch (error) {
    console.error(`Error generating audio for ${bookTitle} segment ${segmentId}:`, error);
    throw error;
  }
}