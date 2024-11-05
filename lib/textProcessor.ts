// File: lib/textProcessor.ts

export interface TextSegment {
    id: number;
    text: string;
    startIndex: number;
    endIndex: number;
}
  
export function preprocessGutenbergText(fullText: string): string {
  const startMarkers = [
    "*** START OF THE PROJECT GUTENBERG EBOOK",
    "*** START OF THIS PROJECT GUTENBERG EBOOK"
  ];
  
  let startIndex = -1;
  for (const marker of startMarkers) {
    startIndex = fullText.indexOf(marker);
    if (startIndex !== -1) {
      startIndex = fullText.indexOf('\n', startIndex) + 1;
      break;
    }
  }

  if (startIndex === -1) {
    console.warn("Could not find the start of the book. Using full text.");
    return fullText;
  }

  return fullText.slice(startIndex);
}

export function segmentText(text: string, wordsPerSegment: number = 50): TextSegment[] {
  const words = text.split(/\s+/);
  const segments: TextSegment[] = [];
  let currentIndex = 0;
  
  for (let i = 0; i < words.length; i += wordsPerSegment) {
    const segmentWords = words.slice(i, i + wordsPerSegment);
    const segmentText = segmentWords.join(' ');
    segments.push({
      id: segments.length,
      text: segmentText,
      startIndex: currentIndex,
      endIndex: currentIndex + segmentText.length
    });
    currentIndex += segmentText.length + 1; // +1 for the space
  }

  return segments;
}