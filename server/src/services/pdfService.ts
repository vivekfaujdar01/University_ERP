/**
 * pdfService — Puppeteer + Handlebars PDF generation.
 * Generates HTML from a .hbs template, renders via headless Chromium, streams PDF.
 *
 * Rules (from Rules.md):
 *  - Launched with --no-sandbox, --disable-setuid-sandbox
 *  - PDFs streamed directly, never stored permanently on disk
 *  - Wrapped in try/catch — throws AppError on failure
 */

import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

/** Compile a .hbs template file with the given data and return HTML string. */
function renderTemplate(templateName: string, data: Record<string, unknown>): string {
  const templatePath = path.resolve(env.PDF_TEMPLATE_DIR, templateName);
  if (!fs.existsSync(templatePath)) {
    throw new AppError(`PDF template not found: ${templateName}`, 500);
  }
  const source = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(source);
  return template(data);
}

/** Generate a PDF buffer from a named template + data object. */
export async function generatePdf(
  templateName: string,
  data: Record<string, unknown>
): Promise<Buffer> {
  const html = renderTemplate(templateName, data);

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16px', bottom: '16px', left: '16px', right: '16px' },
    });
    return Buffer.from(pdfBuffer);
  } catch (err: unknown) {
    throw new AppError(
      `PDF generation failed: ${err instanceof Error ? err.message : String(err)}`,
      500
    );
  } finally {
    if (browser) await browser.close();
  }
}
