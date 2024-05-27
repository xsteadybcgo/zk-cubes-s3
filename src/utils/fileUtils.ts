import fs from 'fs/promises';
import path from 'path';

export const cacheDir = path.join('cache');
export const recordFilePath = path.join(cacheDir, 'generated_combinations.json');
export const countFilePath = path.join(cacheDir, 'count.json');
export const uploadedFilesPath = path.join(cacheDir, 'uploaded_files.json');

export async function ensureCacheDir() {
  try {
    await fs.mkdir(cacheDir, { recursive: true });
    console.log(`Cache directory created or already exists: ${cacheDir}`);
  } catch (error) {
    console.error(`Error creating cache directory: ${error}`);
    throw error;
  }
}

export async function ensureCacheFile(filePath: string) {
  try {
    await fs.access(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const initialData = [recordFilePath, uploadedFilesPath].includes(filePath)  ? JSON.stringify([]) : '0';
      await fs.writeFile(filePath, initialData);
    } else {
      throw error;
    }
  }
}

export async function loadGeneratedCombinations(): Promise<Set<string>> {
  await ensureCacheFile(recordFilePath);

  const data = await fs.readFile(recordFilePath, 'utf-8');
  const combinations = JSON.parse(data);
  return new Set(combinations);
}

export async function saveGeneratedCombinations(combinations: Set<string>): Promise<void> {
  const data = JSON.stringify(Array.from(combinations));
  await fs.writeFile(recordFilePath, data, 'utf-8');
}

export async function loadCount(): Promise<number> {
  await ensureCacheFile(countFilePath);

  const data = await fs.readFile(countFilePath, 'utf-8');
  return parseInt(data, 10);
}

export async function saveCount(count: number): Promise<void> {
  await fs.writeFile(countFilePath, count.toString(), 'utf-8');
}


export async function loadUploadedFiles(): Promise<Set<string>> {
  await ensureCacheFile(uploadedFilesPath);

  const data = await fs.readFile(uploadedFilesPath, 'utf-8');
  const uploadedFiles = JSON.parse(data);
  return new Set(uploadedFiles);
}

export async function saveUploadedFiles(uploadedFiles: Set<string>): Promise<void> {
  const data = JSON.stringify(Array.from(uploadedFiles));
  await fs.writeFile(uploadedFilesPath, data, 'utf-8');
}

export async function getFiles(dir: string): Promise<string[]> {
  const absolutePath = path.resolve(dir);
  const files = await fs.readdir(absolutePath);
  const validFiles = files
    .filter((file) => !file.startsWith('.'))
    .map((file) => path.join(absolutePath, file));
  
  return validFiles;
}
