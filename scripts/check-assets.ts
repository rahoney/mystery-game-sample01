import { access, readFile } from "node:fs/promises";
import path from "node:path";

interface AssetManifest {
  objects: Array<{ id: string; file: string; fallback: string }>;
  backgrounds: string[];
  characters: string[];
  expressions: string[];
  eventCuts: string[];
}

const root = process.cwd();
const manifest = JSON.parse(
  await readFile(path.join(root, "public/assets/asset-manifest.json"), "utf8"),
) as AssetManifest;
const errors: string[] = [];
if (manifest.objects.length !== 10) errors.push("오브젝트 슬롯은 정확히 10개여야 합니다.");
for (const item of manifest.objects) {
  const fallback = path.join(root, "public", item.fallback.replace(/^\//, ""));
  try {
    await access(fallback);
  } catch {
    errors.push(`${item.id}: fallback 파일이 없습니다.`);
  }
}
if (manifest.backgrounds.length !== 3) errors.push("배경 슬롯은 3개여야 합니다.");
if (manifest.characters.length * manifest.expressions.length < 16)
  errors.push("NPC portrait 슬롯은 16개 이상이어야 합니다.");
if (manifest.eventCuts.length < 3) errors.push("이벤트 컷 슬롯은 3개 이상이어야 합니다.");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  `Asset slots OK: objects=${manifest.objects.length}, portraits=${manifest.characters.length * manifest.expressions.length}, backgrounds=${manifest.backgrounds.length}, cuts=${manifest.eventCuts.length}`,
);
