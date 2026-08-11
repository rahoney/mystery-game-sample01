import "dotenv/config";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PixelLabClient } from "../src/integrations/pixellab/client";

interface ManifestItem {
  id: string;
  file: string;
  prompt: string;
}
interface Manifest {
  objects: ManifestItem[];
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await readFile(path.join(root, "public/assets/asset-manifest.json"), "utf8"),
) as Manifest;
const key = process.env.PIXELLAB_API_KEY;
if (!key) throw new Error("PIXELLAB_API_KEY가 없습니다. .env에 설정한 뒤 다시 실행하세요.");
const force = process.argv.includes("--force");
const outputDir = path.join(root, "public/assets/objects");
await mkdir(outputDir, { recursive: true });
const client = new PixelLabClient(key, process.env.PIXELLAB_API_URL || undefined);
const log: Array<Record<string, unknown>> = [];

for (const item of manifest.objects) {
  const output = path.join(root, "public", item.file.replace(/^\/assets\//, "assets/"));
  try {
    if (!force && (await stat(output)).size > 0) {
      console.log(`skip ${item.id}`);
      continue;
    }
  } catch {
    /* generate */
  }
  console.log(`generate ${item.id}`);
  const response = await client.generate({
    description: `${item.prompt}, isolated gameplay object, consistent three-quarter isometric view, modern semi-pixel art, readable silhouette, cool office light from upper left, restrained 32 color palette, no text except specified markings`,
    image_size: { width: 256, height: 256 },
    no_background: true,
    isometric: true,
    outline: "selective outline",
  });
  const encoded = response.image.base64.replace(/^data:image\/png;base64,/, "");
  await writeFile(output, Buffer.from(encoded, "base64"));
  log.push({ id: item.id, generatedAt: new Date().toISOString(), usage: response.usage });
}
await writeFile(path.join(outputDir, "generation-log.json"), JSON.stringify(log, null, 2));
console.log(`완료: ${manifest.objects.length}개 슬롯 확인`);
