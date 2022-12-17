import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const BUILD_DIR = './build';
const FILE_NAME = 'websocket-endpoint.txt';

export const save = async (data: string) => {
  await writeFile(path.join(BUILD_DIR, FILE_NAME), data);
};

export const loadWebsocketEndpoint = async () => {
  try {
    return await readFile(path.join(BUILD_DIR, FILE_NAME), 'utf8');
  } catch (e) {
    throw new Error('You must run yarn start:chrome first');
  }
};
