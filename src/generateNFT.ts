import { loadGeneratedCombinations, saveGeneratedCombinations, loadCount, saveCount, loadUploadedFiles, saveUploadedFiles } from './utils/fileUtils';
import { uploadFilesInParallel } from './utils/s3Utils';
import { combineImages } from './utils/imageUtils';
import { NFTLayers } from './types';
import path from 'path';
import fs from 'fs/promises';

function getRandomElement<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

export async function generateNFTData(layers: NFTLayers, outputFolder: string): Promise<number> {
  const { backgrounds, clothes, crowns, faces, hands, heads } = layers;
  const uniqueCombinations = await loadGeneratedCombinations();
  const totalNFTs = 300;
  let count = await loadCount();

  while (uniqueCombinations.size < totalNFTs) {
    const background = getRandomElement(backgrounds);
    const cloth = getRandomElement(clothes);
    const crown = getRandomElement(crowns);
    const face = getRandomElement(faces);
    const hand = getRandomElement(hands);
    const head = getRandomElement(heads);

    const combinationKey = `${background}-${cloth}-${crown}-${face}-${hand}-${head}`;
    
    if (!uniqueCombinations.has(combinationKey)) {
      uniqueCombinations.add(combinationKey);

      const layers = [background, crown, head, face, cloth, hand];
      const outputFile = path.join(outputFolder, `${count}.png`);

      await combineImages(layers, outputFile);

      await generateMetadata(outputFolder, count);

      count++;
      await saveGeneratedCombinations(uniqueCombinations); 
      await saveCount(count); 
    }
  }

  console.log(`Generated ${count} unique NFTs`);
  return count;
}

export async function generateMetadata(outputFolder: string, index: number): Promise<string> {
  const jsonData = {
    description: `In a distant blockchain realm, countless strings and blocks interweave, creating a vast, intricate yet monotonous network. Day in and day out, the same predictable processes played out, leaving the digital landscape uninspired and static.. One day, amidst the fragmented liquidity of this digital universe, a new chain emerged—Nova.

Nova breathed new life into the blockchain, shattering the monotony and granting blocks and strings a fresh identity and greater customizationn. From this innovation, the Cubo was born. Cubo, meaning "cube" or "bloc" in Latin and Italian, is a transparent cube that embodies everything within the zk.Link ecosystem.

Cubo acts as a cryo chamber, preserving the digital essence of its hosts while maintaining their original traits. It has the unique ability to house a variety of digital personas, from abstract series to the familiar PFP characters. With upcoming NFT partnerships and new ecosystem members, projects can seamlessly integrate their existing NFTs within Cubo, ensuring their preservation and continued evolution.`,
    image: `https://zklink-nova-nft.s3.ap-northeast-1.amazonaws.com/cuboimage/${index}.png`,
    name: "Cubo the Block",
    attributes: [
      { trait_type: "Background", value: `${index}` },
      { trait_type: "Clothes", value: `${index}` },
      { trait_type: "Crown", value: `${index}` },
      { trait_type: "Face", value: `${index}` },
      { trait_type: "Hand", value: `${index}` },
      { trait_type: "Head", value: `${index}` },
    ],
  };

  const metadataFilePath = path.join(outputFolder, `${index}.json`);
  await fs.writeFile(metadataFilePath, JSON.stringify(jsonData));
  return metadataFilePath;
}

export async function uploadGeneratedNFTData(outputFolder: string, startIndex: number, endIndex: number): Promise<void> {
  const filesToUpload: Array<{ filePath: string, s3Key: string, isJson?: boolean }> = [];
  const uploadedFiles = await loadUploadedFiles();

  for (let i = startIndex; i < endIndex; i++) {
    const outputFile = path.join(outputFolder, `${i}.png`);
    const s3ImageKey = `cuboimage/${i}.png`;
    const s3MetadataKey = `cubonft/${i}`;

    if (!uploadedFiles.has(s3ImageKey)) {
      filesToUpload.push({ filePath: outputFile, s3Key: s3ImageKey });
    }

    if (!uploadedFiles.has(s3MetadataKey)) {
      const metadataFilePath = path.join(outputFolder, `${i}.json`);
      filesToUpload.push({ filePath: metadataFilePath, s3Key: s3MetadataKey, isJson: true });
    }
  }

  await uploadFilesInParallel(filesToUpload, uploadedFiles);

  console.log('Upload process completed.');
}
