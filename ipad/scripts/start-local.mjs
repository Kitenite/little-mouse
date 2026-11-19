import { networkInterfaces } from 'node:os';
import { spawn } from 'node:child_process';
const candidates = Object.entries(networkInterfaces()).filter(([name]) => /^(en|eth|wlan)/.test(name)).flatMap(([, entries]) => entries || []);
const ip = candidates.find(entry => entry.family === 'IPv4' && !entry.internal)?.address;
if (!ip) throw new Error('Connect this computer to Wi-Fi or Ethernet before starting local iPad development.');
const gameUrl = `http://${ip}:8787`;
let server;
try { const response = await fetch('http://127.0.0.1:8787/api/version'); if (!response.ok) throw new Error('not ready'); }
catch { server = spawn('npm', ['run', 'dev'], { cwd: new URL('../../little-mouse/', import.meta.url), stdio: 'inherit' }); }
console.log(`\nGame address: ${gameUrl}\nOpen in Expo Go: http://${ip}:8088/_expo/loading?platform=ios\nConnect your iPad to the same Wi-Fi.\n`);
const expo = spawn('npx', ['expo', 'start', '--lan', '--go', '--port', '8088', ...process.argv.slice(2)], {
  stdio: 'inherit', env: { ...process.env, EXPO_PUBLIC_GAME_URL: gameUrl },
});
function stop() { expo.kill('SIGTERM'); server?.kill('SIGTERM'); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
expo.on('exit', code => { server?.kill('SIGTERM'); process.exitCode = code || 0; });
