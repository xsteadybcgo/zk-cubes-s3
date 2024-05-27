const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");
const { fork } = require("child_process");

function randomFileIndex(length) {
  const min = 0;
  const max = length - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const folders = ["Background", "Clothes", "Crown", "Face", "Hand", "Head"];
const set = new Set();

async function composeImage(imageId, canvasWidth, canvasHeight, sizeList) {
  try {
    let indexStrs = [];
    while (true) {
      // Composite the images onto the canvas
      for (let i = 0; i < folders.length; i++) {
        const size = sizeList[i];
        const index = randomFileIndex(size);
        indexStrs.push(index);
      }
      const indexStr = indexStrs.join("-");
      if (!set.has(indexStr)) {
        set.add(indexStr);
        break;
      }
      indexStrs.length = 0; // clear the array
    }
    // Create the canvas
    const canvas = new Jimp(canvasWidth, canvasHeight);
    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];
      const folderPath = path.join(__dirname, folder);
      const files = fs.readdirSync(folderPath);
      const index = indexStrs[i];
      const imagePath = path.join(folderPath, files[index]);
      const image = await Jimp.read(imagePath);
      canvas.composite(image, 0, 0);
    }

    await saveImage(canvas, imageId);
    await saveJSON(
      imageId,
      indexStrs[0],
      indexStrs[1],
      indexStrs[2],
      indexStrs[3],
      indexStrs[4],
      indexStrs[5]
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

async function saveImage(canvas, imageId) {
  const outputDir = path.join(__dirname, "cuboimage");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  const imagePath = path.join(outputDir, `${imageId}.png`);
  await canvas.writeAsync(imagePath);
  console.log(`Image ${imageId} saved successfully!`);
}

async function saveJSON(imageId, background, clothes, crown, face, hand, head) {
  const outputDir = path.join(__dirname, "cubonft");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  const jsonPath = path.join(outputDir, `${imageId}.json`);
  const jsonData = {
    description: `In a distant blockchain realm, countless strings and blocks interweave, creating a vast, intricate yet monotonous network. Day in and day out, the same predictable processes played out, leaving the digital landscape uninspired and static.. One day, amidst the fragmented liquidity of this digital universe, a new chain emerged—Nova.

      Nova breathed new life into the blockchain, shattering the monotony and granting blocks and strings a fresh identity and greater customizationn. From this innovation, the Cubo was born. Cubo, meaning "cube" or "bloc" in Latin and Italian, is a transparent cube that embodies everything within the zk.Link ecosystem.

      Cubo acts as a cryo chamber, preserving the digital essence of its hosts while maintaining their original traits. It has the unique ability to house a variety of digital personas, from abstract series to the familiar PFP characters. With upcoming NFT partnerships and new ecosystem members, projects can seamlessly integrate their existing NFTs within Cubo, ensuring their preservation and continued evolution.`,
    image: `https://zklink-nova-nft.s3.ap-northeast-1.amazonaws.com/cuboimage/${imageId}.png`,
    name: "Cubo the Block",
    attributes: [
      {
        trait_type: "Background",
        value: background,
      },
      {
        trait_type: "Clothes",
        value: clothes,
      },
      {
        trait_type: "Crown",
        value: crown,
      },
      {
        trait_type: "Face",
        value: face,
      },
      {
        trait_type: "Hand",
        value: hand,
      },
      {
        trait_type: "Head",
        value: head,
      },
    ],
  };

  fs.writeFileSync(jsonPath, JSON.stringify(jsonData));
  console.log(`JSON ${imageId} saved successfully!`);
}

async function startGenerate(start, end) {
  const CONCURRENCY = 5;
  const folders = ["Background", "Clothes", "Crown", "Face", "Hand", "Head"];

  // Load the first image to get the dimensions
  const folderPath = path.join("./", folders[0]);
  const files = fs.readdirSync(folderPath);
  const firstImagePath = path.join(folderPath, files[0]);
  console.log("firstImagePath: ", firstImagePath);
  const firstImage = await Jimp.read(firstImagePath);
  const canvasWidth = firstImage.getWidth();
  const canvasHeight = firstImage.getHeight();

  const sizeList = [];
  for (const folder of folders) {
    const folderPath = path.join(__dirname, folder);
    const files = fs.readdirSync(folderPath);
    sizeList.push(files.length);
  }

  const Limit = 150000;
  const promises = [];
  for (let i = start; i <= end; i++) {
    // 普通图片从192开始
    promises.push(composeImage(i, canvasWidth, canvasHeight, sizeList));
    if (promises.length === CONCURRENCY) {
      await Promise.all(promises);
      promises.length = 0;
    }
  }
  await Promise.all(promises);
}

const NUM_PROCESSES = 8; // 使用 8 个子进程
async function generateAllCompositeImages(count) {
  const childProcesses = [];
  let start = 2000;
  for (let i = 0; i < NUM_PROCESSES; i++) {
    const childProcess = fork(__filename, ["child"]);
    childProcesses.push(childProcess);

    childProcess.on("message", (compositeFilePath) => {
      console.log(`Composite image generated: ${compositeFilePath}`);
    });
    let end = start + 18500;
    childProcess.send({ start, end });
    start = end;
  }

  await Promise.all(
    childProcesses.map(
      (childProcess) =>
        new Promise((resolve) => {
          childProcess.on("exit", resolve);
        })
    )
  );

  console.log("All composite images generated and saved.");
}

if (process.argv[2] === "child") {
  process.on("message", async (message) => {
    const { start, end } = message;
    await startGenerate(start, end);
    process.exit();
  });
} else {
  generateAllCompositeImages(150000);
}

// start();

// composeImage()
