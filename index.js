#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const gauge = spawn('gauge', ['run', 'specs']);

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