import { spawn } from 'child_process';
import { save } from './storage';

const MAC_CHROME_APP = `/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome`;
const CHROME_ARGS = [
  '--remote-debugging-port=9222',
  '--no-first-run',
  '--no-default-browser-check',
  "--user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')",
];

export const startChromeWebsocket = async () => {
  const childProcess = spawn(MAC_CHROME_APP, CHROME_ARGS, {
    shell: true,
  });

  childProcess.stdout.on('data', (data: any) => {
    console.log(data.toString());
  });

  // For some reason, this command's output goes to stderr
  // The first data emitted will be "DevTools listening on ws://127..."
  childProcess.stderr.on('data', async (data: any) => {
    const url = data.toString().split('DevTools listening on ')[1];
    if (url) {
      await save(url);
    }
    console.log(data.toString());
  });
};

(async () => {
  try {
    await startChromeWebsocket();
  } catch (e) {
    console.log(e);
  }
})();
