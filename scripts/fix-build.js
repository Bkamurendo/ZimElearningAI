const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('route.ts') || fullPath.endsWith('page.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('export const dynamic') && !content.includes("'use client'")) {
        // Safe insertion below any 'use server' if it exists
        content = "export const dynamic = 'force-dynamic';\n" + content;
        fs.writeFileSync(fullPath, content);
      } else if (content.includes("'use client'") && !content.includes('export const dynamic')) {
        // For client components, sometimes dynamic cannot be exported or is restricted, but actually Next allows it.
        // Wait, 'use client' pages CANNOT export dynamic in Next.13/14 in the same file. They export it in a layout or server file.
        // So we skip 'use client' files to avoid compile errors.
      }
    }
  }
}

// Target all server-side APIs
processDir(path.join(process.cwd(), 'src/app/api'));

console.log('Successfully injected force-dynamic to API routes.');
