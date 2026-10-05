import { app } from './app';

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`\n=========================================================`);
  console.log(`🚀 SLAstice Backend API Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Database: File-backed / In-Memory Hybrid`);
  console.log(`=========================================================\n`);
});

export default server;
