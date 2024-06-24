// File: app/api/generateAudio/route.ts

import { NextResponse } from 'next/server';
import { generateAudioForSegment } from '../../../lib/audioGenerator';

export async function POST(request: Request) {
  const { text, segmentId } = await request.json();

  try {
    const audioUrl = await generateAudioForSegment(text, segmentId, './public/audio');
    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error('Error generating audio:', error);
    return NextResponse.json({ error: 'Error generating audio' }, { status: 500 });
  }
}