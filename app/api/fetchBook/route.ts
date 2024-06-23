// File: app/api/fetchBook/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookTitle = searchParams.get('bookTitle');

  if (!bookTitle) {
    return NextResponse.json({ error: 'Book title is required' }, { status: 400 });
  }

  try {
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(bookTitle)}`;
    const searchResponse = await axios.get(searchUrl);
    
    if (searchResponse.data.docs.length === 0) {
      return NextResponse.json({ error: 'No books found.' }, { status: 404 });
    }

    const book = searchResponse.data.docs[0];
    
    if (book.id_project_gutenberg && book.id_project_gutenberg.length > 0) {
      const gutenbergId = book.id_project_gutenberg[0];
      const editionUrl = `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`;
      
      const editionResponse = await axios.get(editionUrl);
      if (editionResponse.data) {
        return NextResponse.json({ bookText: editionResponse.data });
      } else {
        return NextResponse.json({ error: 'Failed to fetch book text.' }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: 'No Project Gutenberg ID found for this book.' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching book data:', error);
    return NextResponse.json({ error: 'Error fetching book data' }, { status: 500 });
  }
}