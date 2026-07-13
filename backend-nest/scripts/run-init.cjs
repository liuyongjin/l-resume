/**
 * 将模板字段描述 JSON 注入 init.sql 后执行种子数据，并同步 jf_llm_model 表
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const schemaDir = path.join(root, 'src/templates/schemas');
const dataSchema = fs.readFileSync(path.join(schemaDir, 'resume-data-schema.json'), 'utf8');
const styleSchema = fs.readFileSync(path.join(schemaDir, 'resume-style-schema.json'), 'utf8');

let sql = fs.readFileSync(path.join(root, 'prisma/sql/init.sql'), 'utf8');
sql = sql.replaceAll('@@DATA_SCHEMA@@', dataSchema.trim());
sql = sql.replaceAll('@@STYLE_SCHEMA@@', styleSchema.trim());

function runSeedSql(maxAttempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const generated = path.join(os.tmpdir(), `l-resume-init-${Date.now()}.sql`);
    fs.writeFileSync(generated, sql, 'utf8');
    try {
      execSync(`npx prisma db execute --file "${generated}"`, {
        cwd: root,
        stdio: 'inherit',
      });
      console.log('Seed SQL applied');
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        console.warn(`Seed attempt ${attempt} failed, retrying...`);
      }
    } finally {
      fs.unlinkSync(generated);
    }
  }
  throw lastError;
}

async function syncLlmModels() {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(root, 'config/llm-models.json'), 'utf8'),
  );
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    for (const row of catalog.models) {
      await prisma.llmModel.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: row.name,
          provider: row.provider,
          description: row.description,
          maxTokens: row.maxTokens,
          isDefault: row.isDefault,
          isActive: row.isActive,
          sortOrder: row.sortOrder,
        },
        update: {
          name: row.name,
          provider: row.provider,
          description: row.description,
          maxTokens: row.maxTokens,
          isDefault: row.isDefault,
          isActive: row.isActive,
          sortOrder: row.sortOrder,
        },
      });
    }

    const catalogIds = catalog.models.map((m) => m.id);
    await prisma.llmModel.updateMany({
      where: { id: { notIn: catalogIds } },
      data: { isActive: false, isDefault: false },
    });

    console.log(`LLM models synced from config/llm-models.json (${catalog.models.length} rows)`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  runSeedSql();
  await syncLlmModels();
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
