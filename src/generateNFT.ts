import { loadGeneratedCombinations, saveGeneratedCombinations, loadCount, saveCount, loadUploadedFiles, saveUploadedFiles } from './utils/fileUtils';
import { uploadFilesInParallel } from './utils/s3Utils';
import { generateImage, generateMetadata } from './utils/imageUtils';
import { NFTLayers } from './types';
import path from 'path';
import { NFT_START_ID, TOTAL_NFT_NUM, S3_IMAGE_KEY_PREFIX, S3_META_KEY_PREFIX } from './constant';

function getRandomElement<T>(array: T[]): [number, T] {
  const index = Math.floor(Math.random() * array.length);
  return [index, array[index]];
}

export async function generateNFTData(layers: NFTLayers, outputFolder: string): Promise<number> {
  const { backgrounds, clothes, crowns, faces, hands, heads } = layers;
  const uniqueCombinations = await loadGeneratedCombinations();
  const totalNFTs = TOTAL_NFT_NUM - NFT_START_ID;
  let count = await loadCount();

  while (uniqueCombinations.size < totalNFTs) {
    const nftId = count + NFT_START_ID;
    const [backgroundIndex, background] = getRandomElement(backgrounds);
    const [clothesIndex, cloth] = getRandomElement(clothes);
    const [crownIndex, crown] = getRandomElement(crowns);
    const [faceIndex, face] = getRandomElement(faces);
    const [handIndex, hand] = getRandomElement(hands);
    const [headIndex, head] = getRandomElement(heads);
    const traitMap = {
      background: backgroundIndex,
      clothes: clothesIndex,
      crown: crownIndex, 
      face: faceIndex, 
      hand: handIndex,
      head: headIndex
    }

    const combinationKey = `${background}-${cloth}-${crown}-${face}-${hand}-${head}`;
    
    if (!uniqueCombinations.has(combinationKey)) {
      uniqueCombinations.add(combinationKey);

      const layers = [background, crown, head, face, cloth, hand];
      const outputFile = path.join(outputFolder, `${nftId}.png`);

      await generateImage(layers, outputFile);

      await generateMetadata(outputFolder, nftId, traitMap);

      count++;
      await saveGeneratedCombinations(uniqueCombinations); 
      await saveCount(count); 
    }
  }

  console.log(`Generated ${count} unique NFTs`);
  return count;
}



export async function uploadGeneratedNFTData(outputFolder: string, startIndex: number, count: number): Promise<void> {
  const filesToUpload: Array<{ filePath: string, s3Key: string, isJson?: boolean }> = [];
  const uploadedFiles = await loadUploadedFiles();

  for (let i = startIndex; i < count + startIndex; i++) {
    const outputFile = path.join(outputFolder, `${i}.png`);
    const s3ImageKey = `${S3_IMAGE_KEY_PREFIX}/${i}.png`;
    const s3MetadataKey = `${S3_META_KEY_PREFIX}/${i}`;

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
