import { createServer } from './server.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const app = createServer();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  🛡️  VAULTWARDEN ACADEMIC REPLICA SERVER READY 🛡️`);
  console.log(`=======================================================`);
  console.log(`  Listening on : http://localhost:${PORT}`);
  console.log(`  API Status   : http://localhost:${PORT}/api/status`);
  console.log(`  Environment  : ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Database     : node:sqlite (WAL Mode)`);
  console.log(`=======================================================\n`);
});
