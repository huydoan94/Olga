#!/usr/bin/env node

import path from 'path';
import spawn from 'cross-spawn';

process.on("SIGTERM", () => process.exit(1));
process.on("SIGINT", () => process.exit(1));
process.on("SIGHUP", () => process.exit(1));

const currentWorkingFolder = process.cwd();
const executablesPath = path.join(currentWorkingFolder, 'node_modules/.bin/gauge');

const args = process.argv.slice(2);
const gauge = spawn(executablesPath, ['run', ...args]);

gauge.stdout.on("data", data => {
    console.log(`${data}`);
});

gauge.stderr.on("data", data => {
    console.log(`${data}`);
});

gauge.on('error', (error) => {
    console.log(`Error: ${error.message}`);
});

gauge.on("close", code => {
    console.log(`child process exited with code ${code}`);
});
