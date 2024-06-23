'use client';

import React, { useState } from 'react';
import Image from "next/image";
import axios from 'axios';

export default function Home() {
  const [bookTitle, setBookTitle] = useState('');
  const [bookText, setBookText] = useState('');
  const [currentImage, setCurrentImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBookText = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/fetchBook?bookTitle=${encodeURIComponent(bookTitle)}`);
      setBookText(response.data.bookText);
      // Reset the current image when a new book is loaded
      setCurrentImage('');
    } catch (error) {
      setError(error.response?.data?.error || 'Error fetching book data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen p-4">
      {/* Header with search */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Visual Novel Creator</h1>
        <div className="flex">
          <input
            type="text"
            placeholder="Enter book title"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            className="flex-grow p-2 border rounded text-black bg-white"
          />
          <button 
            onClick={fetchBookText}
            className="ml-2 p-2 bg-blue-500 text-white rounded"
            disabled={isLoading}
          >
            {isLoading ? 'Fetching...' : 'Fetch Book'}
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* Main content area */}
      <div className="flex flex-grow">
        {/* Book text area - left third */}
        <div className="w-1/3 pr-4">
          <h2 className="text-xl font-semibold mb-2">Book Text</h2>
          <div className="h-[calc(100vh-200px)] overflow-y-auto border rounded p-4">
            <p className="whitespace-pre-wrap">{bookText}</p>
          </div>
        </div>

        {/* Image display area - right two-thirds */}
        <div className="w-2/3 pl-4">
          <h2 className="text-xl font-semibold mb-2">Current Scene</h2>
          <div className="h-[calc(100vh-200px)] border rounded p-4 flex items-center justify-center bg-gray-100">
            {currentImage ? (
              <Image src={currentImage} alt="Current scene" width={500} height={500} objectFit="contain" />
            ) : (
              <p className="text-gray-500">No image generated yet</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}