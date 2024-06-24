'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from "next/image";
import axios from 'axios';
import { TextSegment } from '../lib/textProcessor';

interface Scene {
  shotNumber: number;
  characters: string[];
  description: string;
  dialogue?: string;
  tone: string;
}

interface Character {
  name: string;
  description: string;
}

type ProcessedSegment = TextSegment & {
  audioUrl: string;
  scenes: Scene[];
  newCharacters: Character[];
  imageUrl: string;
}

// Helper function to write logs to the server
const writeLog = async (bookName: string, logType: string, data: any) => {
  try {
    await axios.post('/api/log', { bookName, logType, data });
    console.log(`Log written for ${bookName} - ${logType}`);
  } catch (error) {
    console.error('Error writing log:', error);
  }
};

export default function Home() {
  const [bookTitle, setBookTitle] = useState('');
  const [bookText, setBookText] = useState('');
  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [processedSegments, setProcessedSegments] = useState<ProcessedSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [isBookProcessed, setIsBookProcessed] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const generateImage = async (scene: Scene) => {
    try {
      const response = await axios.post('/api/generateImage', { scene, bookTitle });
      setCurrentImage(response.data.imageUrl);
      await writeLog(bookTitle, `generateImage_${currentSegmentIndex}`, { scene, imageUrl: response.data.imageUrl });
    } catch (error) {
      console.error('Error generating image:', error);
      await writeLog(bookTitle, `generateImage_error_${currentSegmentIndex}`, { scene, error: error.message });
    }
  };

  const processNextSegment = async (segmentIndex: number) => {
    if (segmentIndex >= segments.length) {
      console.log('All segments processed');
      return;
    }

    const segment = segments[segmentIndex];
    try {
      console.log(`Processing segment ${segmentIndex}:`, segment);
      const [audioResponse, sceneResponse] = await Promise.all([
        axios.post('/api/generateAudio', { text: segment.text, segmentId: segment.id, bookTitle }),
        axios.post('/api/getSceneBreakdown', { text: segment.text, bookTitle, segmentIndex })
      ]);

      await writeLog(bookTitle, `processSegment_${segmentIndex}`, { 
        segmentId: segment.id, 
        audioResponse: audioResponse.data,
        sceneResponse: sceneResponse.data
      });
      console.log('Audio response:', audioResponse.data);
      console.log('Scene response:', sceneResponse.data);

      const imageResponse = await axios.post('/api/generateImage', { 
        scene: sceneResponse.data.shots[0], 
        bookTitle, 
        segmentId: segment.id 
      });
      await writeLog(bookTitle, `generateImage_${segmentIndex}`, { 
        segmentId: segment.id, 
        imageResponse: imageResponse.data 
      });
      console.log('Image response:', imageResponse.data);

      const processedSegment: ProcessedSegment = {
        ...segment,
        audioUrl: audioResponse.data.audioUrl,
        scenes: sceneResponse.data.shots,
        newCharacters: sceneResponse.data.newCharacters,
        imageUrl: imageResponse.data.imageUrl
      };

      setProcessedSegments(prev => [...prev, processedSegment]);

      if (segmentIndex === 0) {
        setCurrentScene(processedSegment.scenes[0]);
        setCurrentImage(processedSegment.imageUrl);
      }

    } catch (error) {
      console.error(`Error processing segment ${segmentIndex}:`, error);
      await writeLog(bookTitle, `processSegment_error_${segmentIndex}`, { segmentId: segment.id, error: error.message });
    }
  };

  const handleAudioEnd = async () => {
    console.log('Audio ended, moving to next segment');
    const nextIndex = currentSegmentIndex + 1;
    
    if (nextIndex < processedSegments.length) {
      setCurrentSegmentIndex(nextIndex);
      setCurrentScene(processedSegments[nextIndex].scenes[0]);
      setCurrentImage(processedSegments[nextIndex].imageUrl);
      
      if (nextIndex + 2 >= processedSegments.length && nextIndex + 2 < segments.length) {
        await processNextSegment(nextIndex + 2);
      }
    } else {
      setIsPlaying(false);
      console.log('Reached end of processed segments');
    }
  };

  const playPauseAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const fetchAndProcessBook = async () => {
    setIsLoading(true);
    setError('');
    setProcessedSegments([]);
    setCurrentSegmentIndex(0);
    setIsBookProcessed(false);
    try {
      console.log(`Fetching book: ${bookTitle}`);
      const response = await axios.get(`/api/fetchBook?bookTitle=${encodeURIComponent(bookTitle)}`);
      const fetchedBookText = response.data.bookText;
      await writeLog(bookTitle, 'fetchBook', { responseData: response.data });
      console.log('Processing book');
      const processResponse = await axios.post('/api/processBook', { bookText: fetchedBookText });
      await writeLog(bookTitle, 'processBook', { responseData: processResponse.data });
      const allSegments = processResponse.data.segments;
      console.log('Set segments:', allSegments.slice(0, 100));
      setSegments(allSegments);
      setBookText(processResponse.data.processedText);
      setIsBookProcessed(true);
    } catch (error) {
      console.error('Error in fetchAndProcessBook:', error);
      setError(error.response?.data?.error || 'Error processing book');
      await writeLog(bookTitle, 'fetchAndProcessBook_error', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const processInitialSegments = async () => {
      if (isBookProcessed && segments.length > 0) {
        console.log('Processing first three segments');
        console.log('Segments length:', segments.length);
        for (let i = 0; i < 3 && i < segments.length; i++) {
          await processNextSegment(i);
        }
      }
    };
    processInitialSegments();
  }, [isBookProcessed]);
  useEffect(() => {
    const handleSegmentChange = async () => {
      if (audioRef.current && processedSegments[currentSegmentIndex]) {
        const currentSegment = processedSegments[currentSegmentIndex];
        audioRef.current.src = currentSegment.audioUrl;
        audioRef.current.load();
        
        setCurrentScene(currentSegment.scenes[0]);
        setCurrentImage(currentSegment.imageUrl);

        if (isPlaying) {
          try {
            await audioRef.current.play();
          } catch (error) {
            console.error('Error playing audio:', error);
          }
        }
      }
    };

    handleSegmentChange();
  }, [currentSegmentIndex, processedSegments, isPlaying]);
  useEffect(() => {
    if (textAreaRef.current && segments[currentSegmentIndex]) {
      const segmentStart = segments[currentSegmentIndex].startIndex;
      const scrollPercentage = segmentStart / bookText.length;
      textAreaRef.current.scrollTop = scrollPercentage * textAreaRef.current.scrollHeight;
    }
  }, [currentSegmentIndex, segments, bookText.length]);
  return (
    <main className="flex flex-col h-screen p-4">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Visual Novel Creator</h1>
        <div className="flex justify-center">
          <input
            type="text"
            placeholder="Enter book title"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            className="p-2 border rounded text-black bg-white w-64"
          />
          <button
            onClick={fetchAndProcessBook}
            className="ml-2 p-2 bg-blue-500 text-white rounded"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Fetch Book'}
          </button>
        </div>
      </div>
      {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
      <div className="flex flex-grow overflow-hidden">
        <div className="w-1/3 pr-4 flex flex-col">
          <div className="mb-2 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Book Text</h2>
            <button
              onClick={playPauseAudio}
              className="p-2 bg-green-500 text-white rounded"
              disabled={!bookText || processedSegments.length === 0}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>
          <div
            ref={textAreaRef}
            className="flex-grow overflow-y-auto border rounded p-4"
          >
            <p className="whitespace-pre-wrap">{bookText}</p>
          </div>
        </div>
        <div className="w-2/3 pl-4 flex flex-col">
          <h2 className="text-xl font-semibold mb-2">Scene Visualization</h2>
          <div className="flex-grow border rounded p-4 flex flex-col items-center justify-center bg-white overflow-hidden">
            {currentScene ? (
              <>
                <h3 className="text-lg font-semibold mb-2 text-black">Shot {currentScene.shotNumber}</h3>
                <p className="mb-2 text-black"><strong>Characters:</strong> {currentScene.characters.join(', ')}</p>
                <p className="mb-2 text-black"><strong>Description:</strong> {currentScene.description}</p>
                <p className="mb-2 text-black"><strong>Dialogue:</strong> {currentScene.dialogue}</p>
                <p className="mb-2 text-black"><strong>Tone:</strong> {currentScene.tone}</p>
                {currentImage && (
                  <img src={currentImage} alt="Generated scene" className="mt-4 max-w-full h-auto" />
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
      <audio ref={audioRef} onEnded={handleAudioEnd} style={{ display: 'none' }} />
    </main>
  );
}