#!/usr/bin/env node
/**
 * Regenerate PWA / favicon PNGs from scripts/brand-asset-template.html.
 * Text must match src/lib/constants.ts APP_NAME ("المؤيد").
 */
import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const TEMPLATE = join(__dirname, "brand-asset-template.html");

/** Keep in sync with src/lib/constants.ts */
const APP_NAME = "المؤيد";

const OUTPUTS = [
  { file: "icon-512.png", size: 512 },
  { file: "icon-192.png", size: 192 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "favicon-32x32.png", size: 32 },
  { file: "favicon-16x16.png", size: 16 },
];

function decodeDataUrl(dataUrl) {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  return Buffer.from(base64, "base64");
}

function writeFaviconIco() {
  const png16 = join(PUBLIC, "favicon-16x16.png");
  const png32 = join(PUBLIC, "favicon-32x32.png");
  const ico = join(PUBLIC, "favicon.ico");
  const script = `
from PIL import Image
img16 = Image.open(${JSON.stringify(png16)}).convert("RGBA")
img32 = Image.open(${JSON.stringify(png32)}).convert("RGBA")
img32.save(${JSON.stringify(ico)}, format="ICO", sizes=[(16, 16), (32, 32)])
print("Wrote favicon.ico")
`;
  const result = spawnSync("python3", ["-c", script], { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    throw new Error("Failed to write favicon.ico");
  }
  process.stdout.write(result.stdout);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`file://${TEMPLATE}`);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await document.fonts.load('700 512px "Tajawal"');
    });
    await page.waitForTimeout(500);

    for (const { file, size } of OUTPUTS) {
      const dataUrl = await page.evaluate(
        ({ iconSize, label }) => window.renderBrandIcon(iconSize, label),
        { iconSize: size, label: APP_NAME }
      );
      const outPath = join(PUBLIC, file);
      writeFileSync(outPath, decodeDataUrl(dataUrl));
      console.log(`Wrote ${file} (${size}x${size})`);
    }

    writeFaviconIco();
    console.log(`Brand assets regenerated with label: ${APP_NAME}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
