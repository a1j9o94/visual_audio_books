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
    const segments = segmentText(processedText, 75);

    // Add this before generating the audio
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    try {
      console.log('Output directory:', './public/audio');
      
      return NextResponse.json({ 
        processedText, 
        segments,
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