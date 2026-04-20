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

// Target all server-side pages
processDir(path.join(process.cwd(), 'src/app/(dashboard)'));
processDir(path.join(process.cwd(), 'src/app/admin'));
processDir(path.join(process.cwd(), 'src/app/parent'));
processDir(path.join(process.cwd(), 'src/app/student'));
processDir(path.join(process.cwd(), 'src/app/teacher'));
processDir(path.join(process.cwd(), 'src/app/school-admin'));

console.log('Successfully injected force-dynamic to pages.');
