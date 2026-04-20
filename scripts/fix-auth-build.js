const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('page.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('export const dynamic') && !content.includes("'use client'") && !content.includes('"use client"')) {
        content = "export const dynamic = 'force-dynamic';\n" + content;
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir(path.join(process.cwd(), 'src/app/(auth)'));
processDir(path.join(process.cwd(), 'src/app/auth'));

console.log('Successfully injected force-dynamic to auth pages.');
