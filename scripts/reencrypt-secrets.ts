/**
 * 把 Exchange.apiSecret 里仍为明文（`plain:` 前缀或无前缀的旧值）的记录，
 * 用当前 ENCRYPTION_KEY 重新加密为 `enc:` 格式。
 *
 * 用法（项目根目录）：
 *   npx tsx scripts/reencrypt-secrets.ts            # 实际写入
 *   npx tsx scripts/reencrypt-secrets.ts --dry-run  # 只统计，不写
 *
 * 跑之前先备份 dev.db。脚本只打印记录 id 与状态，不打印任何密钥内容。
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { encryptSecret, decryptSecret } from "../src/lib/crypto";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64 || !/^[0-9a-fA-F]+$/.test(key)) {
    console.error("ENCRYPTION_KEY 缺失或格式不对（需要 64 位十六进制），中止。");
    process.exit(1);
  }

  const exchanges = await prisma.exchange.findMany({
    select: { id: true, name: true, apiSecret: true },
  });

  let plain = 0;
  let legacy = 0;
  let encrypted = 0;
  let updated = 0;

  for (const row of exchanges) {
    const stored = row.apiSecret ?? "";
    let kind: "enc" | "plain" | "legacy";
    if (stored.startsWith("enc:")) kind = "enc";
    else if (stored.startsWith("plain:")) kind = "plain";
    else kind = "legacy";

    if (kind === "enc") {
      encrypted += 1;
      continue;
    }
    if (kind === "plain") plain += 1;
    else legacy += 1;

    if (dryRun) {
      console.log(`[dry-run] ${row.id} (${row.name}) ${kind} -> 会重新加密`);
      continue;
    }

    const plaintext = decryptSecret(stored);
    const next = encryptSecret(plaintext);
    if (!next.startsWith("enc:")) {
      console.error(`${row.id} 加密结果不是 enc: 格式，中止。`);
      process.exit(1);
    }
    // 回读校验：能解回同样的明文才写库
    if (decryptSecret(next) !== plaintext) {
      console.error(`${row.id} 回读校验失败，中止。`);
      process.exit(1);
    }

    await prisma.exchange.update({
      where: { id: row.id },
      data: { apiSecret: next },
    });
    updated += 1;
    console.log(`${row.id} (${row.name}) ${kind} -> enc 已更新`);
  }

  console.log(
    `总计 ${exchanges.length} 条：已加密 ${encrypted}，plain 前缀 ${plain}，旧明文 ${legacy}，本次更新 ${updated}${dryRun ? "（dry-run 未写入）" : ""}`,
  );
}

main()
  .catch((error) => {
    console.error("reencrypt-secrets 失败：", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
