import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import { saveUploadedFiles } from './fileUtils';

const s3Client = new S3Client({ region: 'ap-northeast-1'}); 
const bucketName = 'zklink-nova-nft'; 

async function uploadToS3WithRetry(filePath: string, s3Key: string, isJson = false, retryCount = 3): Promise<void> {
  let body;
  let contentType;

  if (isJson) {
    body = JSON.stringify(filePath);
    contentType = 'application/json';
  } else {
    body = await fs.readFile(filePath);
  }

  const uploadParams = {
    Bucket: bucketName,
    Key: s3Key,
    Body: body,
    ContentType: contentType,
  };

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      await s3Client.send(new PutObjectCommand(uploadParams));
      console.log(`File uploaded to S3: ${s3Key}`);
      return;
    } catch (error) {
      console.error(`Failed to upload file: ${filePath} to S3: ${s3Key} on attempt ${attempt}`, error);
      if (attempt === retryCount) {
        throw error;
      }
    }
  }
}

export async function uploadFilesInParallel(
  files: Array<{ filePath: string, s3Key: string, isJson?: boolean }>,
  uploadedFiles: Set<string>,
  maxConcurrency = 5
): Promise<void> {
  for (let i = 0; i < files.length; i += maxConcurrency) {
    const batch = files.slice(i, i + maxConcurrency)
      .filter(({ s3Key }) => !uploadedFiles.has(s3Key))
      .map(({ filePath, s3Key, isJson }) => uploadToS3WithRetry(filePath, s3Key, isJson));

    await Promise.all(batch);

    for (const file of files.slice(i, i + maxConcurrency)) {
      uploadedFiles.add(file.s3Key);
    }
    await saveUploadedFiles(uploadedFiles);
  }

  console.log('All files uploaded');
}
