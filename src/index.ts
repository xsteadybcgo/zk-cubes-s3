import dotenv from 'dotenv';
dotenv.config();

import { ensureCacheDir, getFiles } from './utils/fileUtils';
import { generateNFTData, uploadGeneratedNFTData } from './generateNFT';
import { NFTLayers } from './types';
import fs from 'fs/promises';
import { NFT_START_ID } from './constant';
import path from 'path';


async function main(): Promise<void> {
  await ensureCacheDir();

  const layers: NFTLayers = {
    backgrounds: await getFiles('src/assets/Background'),
    clothes: await getFiles('src/assets/Clothes'),
    crowns: await getFiles('src/assets/Crown'),
    faces: await getFiles('src/assets/Face'),
    hands: await getFiles('src/assets/Hand'),
    heads: await getFiles('src/assets/Head'),
  };

  await fs.mkdir('output', { recursive: true });

  const count = await generateNFTData(layers, 'output');
  await uploadGeneratedNFTData(path.resolve('output'), NFT_START_ID, count);
}

main().catch(console.error);
