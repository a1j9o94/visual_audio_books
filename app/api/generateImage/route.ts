import { NextResponse } from 'next/server';
import axios from 'axios';
import { generateImagePrompt } from '../../../lib/imagePromptGenerator';
import fs from "node:fs";
import FormData from "form-data";

export async function POST(request: Request) {
  const { scene, bookTitle, segmentId } = await request.json();

  const prompt = generateImagePrompt(scene);
  const payload = {
    prompt,
    output_format: "png"
  };

  let response;
  let retries = 3;

  while (retries > 0) {
    try {
      response = await axios.postForm(
        `https://api.stability.ai/v2beta/stable-image/generate/ultra`,
        axios.toFormData(payload, new FormData()),
        {
          headers: {
            'Accept': 'image/*',
            'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
          },
          responseType: 'arraybuffer',
          validateStatus: undefined,
        }
      );

      if (response.status === 200) {
        const filename = `${bookTitle}_segment_${segmentId}.png`;
        const imagePath = `./public/images/${filename}`;
        await fs.promises.writeFile(imagePath, Buffer.from(response.data));
        
        return NextResponse.json({ imageUrl: `/images/${filename}` });
      } else {
        throw new Error(`${response.status}: ${response.data.toString()}`);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      retries -= 1;
      if (retries === 0) {
        return NextResponse.json({ error: 'Error generating image' }, { status: 500 });
      }
    }
  }
}
