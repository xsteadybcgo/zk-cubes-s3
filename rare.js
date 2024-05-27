const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
function randomFileIndex(length) {
  const min = 0;
  const max = length-1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
const folders = ['Background', 'Clothes', 'Face', 'Others', 'Skin'];
const set = new Set();
const PathPrefix = './MYTHIC_RAITS/'
async function composeImage(canvasWidth, canvasHeight, sizeList) {
  try {
    console.log('sizeList: ', sizeList[0])
  
    let imageId = 0;
    for(let i = 0; i < sizeList[0]; i++) {
  console.log('sizeList: ', sizeList[0])

      const folderPath = path.join(PathPrefix, folders[0]);
      const files = fs.readdirSync(folderPath);
      const imagePath = path.join(folderPath, files[i])
      const image1 = await Jimp.read(imagePath);
     
      for(let j = 0; j < sizeList[1]; j++) {
        const folderPath = path.join(PathPrefix, folders[1]);
        const files = fs.readdirSync(folderPath);
        const imagePath = path.join(folderPath, files[j])
        const image2 = await Jimp.read(imagePath);
        
        for(let k = 0; k < sizeList[2]; k++) {
          const folderPath = path.join(PathPrefix, folders[2]);
          const files = fs.readdirSync(folderPath);
          const imagePath = path.join(folderPath, files[k])
          const image3 = await Jimp.read(imagePath);
         
          for(let l = 0; l < sizeList[3]; l++) {
            const folderPath = path.join(PathPrefix, folders[3]);
            const files = fs.readdirSync(folderPath);
            const imagePath = path.join(folderPath, files[l])
            const image4 = await Jimp.read(imagePath);
            
            for(let m = 0; m < sizeList[4]; m++) {
              const canvas = new Jimp(canvasWidth, canvasHeight);
              canvas.composite(image1, 0, 0);
              canvas.composite(image2, 0, 0);
              canvas.composite(image3, 0, 0);
              canvas.composite(image4, 0, 0);

              const folderPath = path.join(PathPrefix, folders[4]);
              const files = fs.readdirSync(folderPath);
              const imagePath = path.join(folderPath, files[m])
              const image5 = await Jimp.read(imagePath);
              canvas.composite(image5, 0, 0);
              console.log('save image...' , imageId)
              await saveImage(canvas, imageId)
              await saveJSON(imageId, i, j, k, l, m)
              imageId++;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
  console.log('done.')
}

async function saveImage(canvas, imageId) {
  // 保存图片
  const outputDir = path.join(__dirname, 'cuboimage');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  const imagePath = path.join(outputDir, `${imageId}.png`);
  await canvas.writeAsync(imagePath);
  console.log(`Image ${imageId} saved successfully!`);
}

async function saveJSON(imageId, background, clothes, face, others, skin) {
  // 保存 JSON 文件
  const outputDir = path.join(__dirname, 'cubonft');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  const jsonPath = path.join(outputDir, `${imageId}.json`);
  const jsonData = {
      "description": `In a distant blockchain realm, countless strings and blocks interweave, creating a vast, intricate yet monotonous network. Day in and day out, the same predictable processes played out, leaving the digital landscape uninspired and static.. One day, amidst the fragmented liquidity of this digital universe, a new chain emerged—Nova.

      Nova breathed new life into the blockchain, shattering the monotony and granting blocks and strings a fresh identity and greater customizationn. From this innovation, the Cubo was born. Cubo, meaning "cube" or "bloc" in Latin and Italian, is a transparent cube that embodies everything within the zk.Link ecosystem.

      Cubo acts as a cryo chamber, preserving the digital essence of its hosts while maintaining their original traits. It has the unique ability to house a variety of digital personas, from abstract series to the familiar PFP characters. With upcoming NFT partnerships and new ecosystem members, projects can seamlessly integrate their existing NFTs within Cubo, ensuring their preservation and continued evolution.`, 
      "image": `https://zklink-nova-nft.s3.ap-northeast-1.amazonaws.com/cuboimage/${imageId}.png`, 
      "name": "Cubo the Block",
      "attributes": [ 
      {
          "trait_type": "Background", 
          "value": `Rare-${background}`
      }, 
      {
          "trait_type": "Clothes", 
          "value": `Rare-${clothes}`
      }, 
      {
        "trait_type": "Face", 
        "value": `Rare-${face}`
      }, 
      {
        "trait_type": "Others", 
        "value": `Rare-${others}`
      }, 
      {
        "trait_type": "Skin", 
        "value": `Rare-${skin}`
      }, 

      ]
    }
  
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData));
  console.log(`JSON ${imageId} saved successfully!`);
}

async function start() {
  const CONCURRENCY = 5;

    // Load the first image to get the dimensions
    const folderPath = path.join(PathPrefix, folders[0]);
    const files = fs.readdirSync(folderPath);
    const firstImagePath = path.join(folderPath, files[0]);
    const firstImage = await Jimp.read(firstImagePath);
    const canvasWidth = firstImage.getWidth();
    const canvasHeight = firstImage.getHeight();

    const sizeList = []
    for (const folder of folders) {
      const folderPath = path.join(PathPrefix, folder);
      const files = fs.readdirSync(folderPath);
      sizeList.push(files.length)
    }

    await composeImage(canvasWidth, canvasHeight, sizeList)

}

 start();

// composeImage()

