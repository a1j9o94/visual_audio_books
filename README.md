# Visual Novel Creator

## Project Overview

Visual Novel Creator is a web application that transforms text from classic literature into a visual novel experience. By leveraging public domain books and AI-generated imagery, this tool allows users to experience literature in a new, interactive way.

## Features

- Search and fetch full text of public domain books
- Display book text in a scrollable format
- Prepare for AI-generated imagery based on book content (future feature)
- Built with Next.js for optimal performance and SEO

## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/visual-novel-creator.git
   cd visual-novel-creator
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory and add any necessary API keys:
   ```
   NEXT_PUBLIC_SOME_API_KEY=your_api_key_here
   ```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/page.tsx`: Main component for the application UI
- `app/api/fetchBook/route.ts`: API route for fetching book data
- `app/globals.css`: Global styles for the application

## Future Enhancements

- Implement AI image generation for book scenes
- Add chapter navigation and bookmarking features
- Integrate audio narration capabilities
- Improve text parsing for better scene detection

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Project Gutenberg for providing access to public domain literature
- Open Library for book metadata

---

This project was bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

For more information on Next.js, check out the following resources:
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)