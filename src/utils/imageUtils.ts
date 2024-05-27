import sharp from 'sharp';

export async function combineImages(layers: string[], outputFile: string): Promise<void> {
  try {
    const images = await Promise.all(layers.map(layer => sharp(layer).resize(1024, 1024).toBuffer()));
    let compositeImage = sharp(images[0]).resize(1024, 1024);
        const composites = images.slice(1).map((imageBuffer) => ({
      input: imageBuffer,
      blend: 'over' as const
    }));
    
    compositeImage = compositeImage.composite(composites);
    
    await compositeImage.toFile(outputFile);
    console.log(`Image created: ${outputFile}`);
  } catch (error) {
    console.error('Error combining images:', error);
  }
}
