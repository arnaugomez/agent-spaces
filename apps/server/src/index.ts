import { app } from './app';
import { config } from './config';

console.log(`
  ╔═══════════════════════════════════════════╗
  ║          Agent Spaces Server              ║
  ╠═══════════════════════════════════════════╣
  ║  Port: ${config.port.toString().padEnd(35)}║
  ║  Environment: ${config.nodeEnv.padEnd(28)}║
  ║  Auth: ${(config.authDisabled ? 'disabled' : 'enabled').padEnd(34)}║
  ╚═══════════════════════════════════════════╝
`);

export default {
  port: config.port,
  hostname: config.host,
  fetch: app.fetch,
};

