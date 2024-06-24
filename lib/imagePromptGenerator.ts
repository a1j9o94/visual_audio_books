import { Scene } from '../app/page';

export function generateImagePrompt(scene: Scene): string {
  const { description, tone, characters } = scene;
  const characterString = characters.join(', ');
  
  return `Create a cinematic image of the following scene: ${description}. 
    The scene should convey a ${tone} atmosphere. 
    Characters present: ${characterString}. 
    Style: Photorealistic, detailed, cinematic lighting.`;
}