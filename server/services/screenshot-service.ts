import puppeteer, { Browser } from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface ScreenshotOptions {
  html: string;
  width?: number;
  height?: number;
}

export class ScreenshotService {
  private browser: Browser | null = null;

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-extensions',
          '--no-first-run',
          '--disable-default-apps',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });
    }
  }

  async captureHTMLAsImage(options: ScreenshotOptions): Promise<Buffer> {
    await this.initialize();
    
    const page = await this.browser!.newPage();
    
    try {
      // Set viewport size
      await page.setViewport({
        width: options.width || 1024,
        height: options.height || 768
      });

      // Create temporary HTML file
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `wireframe-${Date.now()}.html`);
      await fs.writeFile(tempFile, options.html, 'utf-8');

      // Navigate to the HTML file
      await page.goto(`file://${tempFile}`, {
        waitUntil: 'networkidle0'
      });

      // Take screenshot with optimized settings
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: true,
        encoding: 'binary'
      });

      // Cleanup temp file
      await fs.unlink(tempFile).catch(() => {});

      return screenshot as Buffer;
    } finally {
      await page.close();
    }
  }

  async generateWireframeScreenshots(searchHTML: string, formHTML: string): Promise<{
    searchImage: Buffer;
    formImage: Buffer;
  }> {
    const [searchImage, formImage] = await Promise.all([
      this.captureHTMLAsImage({ html: searchHTML, width: 1200, height: 800 }),
      this.captureHTMLAsImage({ html: formHTML, width: 900, height: 1000 })
    ]);

    return { searchImage, formImage };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Singleton instance
let screenshotService: ScreenshotService | null = null;

export function getScreenshotService(): ScreenshotService {
  if (!screenshotService) {
    screenshotService = new ScreenshotService();
  }
  return screenshotService;
}