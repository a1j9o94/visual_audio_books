// File: app/api/processBook/route.ts

import { NextResponse } from 'next/server';
import { preprocessGutenbergText, segmentText } from '../../../lib/textProcessor';
import { generateAudioForSegment } from '../../../lib/audioGenerator';

export async function POST(request: Request) {
  const { bookText } = await request.json();

  try {
    const processedText = preprocessGutenbergText(bookText);
    const segments = segmentText(processedText);

    // Generate audio for the first segment as an example
    // In a real application, you might want to do this for all segments or on-demand
    const audioUrl = await generateAudioForSegment(segments[0].text, segments[0].id, './public/audio');

    return NextResponse.json({ 
      processedText, 
      segments,
      firstSegmentAudioUrl: audioUrl
    });
  } catch (error) {
    console.error('Error processing book:', error);
    return NextResponse.json({ error: 'Error processing book' }, { status: 500 });
  }
}