import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Recursively walk a directory and return all files that match the given extension.
 */
async function walk(dir: string, ext: string, fileList: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, ext, fileList);
    } else if (entry.isFile() && fullPath.endsWith(ext)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

interface AssetFileReference {
  url: string;
  key?: string;
}

async function verifyAssetPack(jsonPath: string, rootDir: string): Promise<{ ok: boolean; missing: string[] }> {
  const jsonRaw = await fs.readFile(jsonPath, 'utf-8');
  let data: any;
  try {
    data = JSON.parse(jsonRaw);
  } catch (err) {
    console.error(`❌  Failed to parse JSON ${jsonPath}:`, err);
    return { ok: false, missing: [] };
  }

  const entries: AssetFileReference[] = Array.isArray(data) ? data : data.files ?? [];
  const missing: string[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry.url !== 'string') continue;
    const candidate = path.resolve(path.dirname(jsonPath), entry.url);
    try {
      await fs.access(candidate);
    } catch {
      // Try relative to rootDir
      const alt = path.resolve(rootDir, entry.url);
      try {
        await fs.access(alt);
      } catch {
        missing.push(entry.url);
      }
    }
  }
  return { ok: missing.length === 0, missing };
}

async function main() {
  const targetDir = process.argv[2] || path.resolve(process.cwd(), 'apps/web/public/assets');
  const packFiles = await walk(targetDir, '.json');
  if (packFiles.length === 0) {
    console.log(`No asset-pack JSON files found under ${targetDir}`);
    return;
  }

  console.log(`🔍 Scanning ${packFiles.length} asset-pack files...`);

  let totalMissing = 0;
  for (const pack of packFiles) {
    const { ok, missing } = await verifyAssetPack(pack, targetDir);
    if (!ok) {
      console.log(`
⛔  Missing assets in ${path.relative(targetDir, pack)}:`);
      missing.forEach(m => console.log(`   • ${m}`));
      totalMissing += missing.length;
    }
  }

  if (totalMissing === 0) {
    console.log('\n✅  All referenced assets are present.');
  } else {
    console.log(`\n⚠️  ${totalMissing} referenced asset files missing.`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
} 