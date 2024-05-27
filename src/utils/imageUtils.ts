import path from 'path';
import sharp from 'sharp';
import fs from 'fs/promises';

export async function generateImage(layers: string[], outputFile: string): Promise<void> {
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

export async function generateMetadata(outputFolder: string, index: number, traitMap: {[key:string]: number}): Promise<string> {
  const { background, clothes, crown, face, hand, head } = traitMap
  const jsonData = {
    description: `In a distant blockchain realm, countless strings and blocks interweave, creating a vast, intricate yet monotonous network. Day in and day out, the same predictable processes played out, leaving the digital landscape uninspired and static.. One day, amidst the fragmented liquidity of this digital universe, a new chain emerged—Nova.

Nova breathed new life into the blockchain, shattering the monotony and granting blocks and strings a fresh identity and greater customizationn. From this innovation, the Cubo was born. Cubo, meaning "cube" or "bloc" in Latin and Italian, is a transparent cube that embodies everything within the zk.Link ecosystem.

Cubo acts as a cryo chamber, preserving the digital essence of its hosts while maintaining their original traits. It has the unique ability to house a variety of digital personas, from abstract series to the familiar PFP characters. With upcoming NFT partnerships and new ecosystem members, projects can seamlessly integrate their existing NFTs within Cubo, ensuring their preservation and continued evolution.`,
    image: `https://zklink-nova-nft.s3.ap-northeast-1.amazonaws.com/cuboimage/${index}.png`,
    name: "Cubo the Block",
    attributes: [
      { trait_type: "Background", value: `${background}` },
      { trait_type: "Clothes", value: `${clothes}` },
      { trait_type: "Crown", value: `${crown}` },
      { trait_type: "Face", value: `${face}` },
      { trait_type: "Hand", value: `${hand}` },
      { trait_type: "Head", value: `${head}` },
    ],
  };

  const metadataFilePath = path.join(outputFolder, `${index}.json`);
  await fs.writeFile(metadataFilePath, JSON.stringify(jsonData));
  return metadataFilePath;
}
