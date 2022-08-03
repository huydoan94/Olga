#!/usr/bin/env node

import path from 'path';
import spawn from 'cross-spawn';

// To terminate the process if something interrupt it
process.on("SIGTERM", () => process.exit(1));
process.on("SIGINT", () => process.exit(1));
process.on("SIGHUP", () => process.exit(1));

// Get current working folder, to determine the location of modules.
const currentWorkingFolder = process.cwd();
// Get executable folders
const executablesPath = path.join(currentWorkingFolder, 'node_modules/.bin/gauge');

// Get arguments and run
const args = process.argv.slice(2);
const gauge = spawn(executablesPath, ['run', ...args]);

// Print message
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
