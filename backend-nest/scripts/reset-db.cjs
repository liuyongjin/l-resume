/**
 * 删除旧业务表 → prisma db push 重建 jf_ 前缀表 → 写入种子数据
 */
const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const dropSql = path.join(root, 'prisma/sql/drop-legacy-tables.sql');

function run(cmd, opts = {}) {
  execSync(cmd, { cwd: root, stdio: 'inherit', ...opts });
}

console.log('Step 1/3: drop legacy business tables...');
run(`npx prisma db execute --file "${dropSql}"`);

console.log('Step 2/3: push Prisma schema (jf_* tables)...');
run('npx prisma db push --skip-generate');

console.log('Step 3/3: seed init data...');
run('node scripts/run-init.cjs');

console.log('Database reset complete.');
