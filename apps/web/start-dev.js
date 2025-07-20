#!/usr/bin/env node
const { spawn } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';

// Choose command based on platform
const command = isWindows ? 'next dev' : 'next dev --turbopack';
const [cmd, ...args] = command.split(' ');

console.log(`Starting development server for ${isWindows ? 'Windows' : 'Linux/macOS'}...`);
console.log(`Command: ${command}`);

const child = spawn(cmd, args, {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
