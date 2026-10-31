import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { prerenderRoutes } from '../prerender.config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');

async function prerender() {
  console.log('🚀 Starting pre-rendering with headless browser...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Start a simple HTTP server for the built files
  const { spawn } = await import('child_process');
  const server = spawn('npx', ['serve', '-s', 'dist', '-l', '3000'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'ignore'
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    for (const route of prerenderRoutes) {
      const url = `http://localhost:3000${route}`;
      console.log(`📄 Rendering: ${route}`);

      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for React to render
      await page.waitForSelector('#root', { timeout: 5000 });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the rendered HTML
      const html = await page.content();

      // Create directory structure for the route
      const routePath = route === '/' ? '' : (route.startsWith('/') ? route.slice(1) : route);
      const routeDir = path.join(distPath, routePath);
      const htmlPath = path.join(routeDir, 'index.html');

      // Create directory if it doesn't exist
      fs.mkdirSync(routeDir, { recursive: true });

      // Write the pre-rendered HTML
      fs.writeFileSync(htmlPath, html);

      console.log(`✓ Pre-rendered: ${route} → ${routePath || 'index'}.html\n`);
    }

    console.log(`\n✅ Successfully pre-rendered ${prerenderRoutes.length} routes!`);
  } catch (error) {
    console.error('❌ Error during pre-rendering:', error);
    throw error;
  } finally {
    await browser.close();
    server.kill();
  }
}

prerender().catch(err => {
  console.error(err);
  process.exit(1);
});
