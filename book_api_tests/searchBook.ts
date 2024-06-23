import axios from 'axios';
import fs from 'fs';

interface BookSearchResult {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  id_project_gutenberg?: string[];
}

interface BookEdition {
  title: string;
  text: string;
}

const searchBookByName = async (bookName: string) => {
  try {
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(bookName)}`;
    const searchResponse = await axios.get(searchUrl);
    
    if (searchResponse.data.docs.length === 0) {
      console.log('No books found.');
      return;
    }

    const book: BookSearchResult = searchResponse.data.docs[0];

    console.log("Writing open library api response to book.json");

    //create a folder to hold the book data named for this book
    fs.mkdirSync(bookName, { recursive: true });

    //write book to a text file for refeence
    fs.writeFileSync(`${bookName}/book.json`, JSON.stringify(book, null, 2));

    // the gutenberg format if the id is 1342 https://www.gutenberg.org/cache/epub/1342/pg1342.txt

    /**
        in the book object you're looking for the field 
        "id_project_gutenberg": [
        "1342",
        "42671",
        "45186"]
    */

    if (book.id_project_gutenberg && book.id_project_gutenberg.length > 0) {
      const gutenbergId = book.id_project_gutenberg[0];
      const editionUrl = `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`;
      
      const editionResponse = await axios.get(editionUrl);

      //write the response to a file named after the search queary
      fs.writeFileSync(`${bookName}/edition.txt`, editionResponse.data);

      //if edition response isn't empty or an error, return it
      if (editionResponse.data) {
        return editionResponse.data;
      }
    } else {
      console.log('No Project Gutenberg ID found for this book.');
    }
  } catch (error) {
    console.error('Error fetching book data:', error);
  }
};

searchBookByName('Pride and prejudice');