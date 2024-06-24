// File: app/api/processBook/route.ts

import { NextResponse } from 'next/server';
import { preprocessGutenbergText, segmentText } from '../../../lib/textProcessor';
import { generateAudioForSegment } from '../../../lib/audioGenerator';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const { bookText, bookTitle } = await request.json();

  try {
    const processedText = preprocessGutenbergText(bookText);
    const segments = segmentText(processedText);

    // Add this before generating the audio
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    try {
      console.log('Generating audio for segment:', segments[0].id);
      console.log('Book title:', bookTitle);
      console.log('Output directory:', './public/audio');
      
      const audioUrl = await generateAudioForSegment(segments[0].text, segments[0].id, bookTitle, './public/audio');
      
      console.log('Audio URL generated:', audioUrl);

      return NextResponse.json({ 
        processedText, 
        segments,
        firstSegmentAudioUrl: audioUrl
      });
    } catch (error) {
      console.error('Error processing book:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: 'Error processing book', details: error.message }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing book:', error);
    return NextResponse.json({ error: 'Error processing book' }, { status: 500 });
  }
}