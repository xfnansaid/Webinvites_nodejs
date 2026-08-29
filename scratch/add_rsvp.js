const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '../src/components/templates');
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.js') && f !== 'index.js' && f !== 'RsvpSection.js');

files.forEach(file => {
  const filePath = path.join(templatesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Ensure 'use client'; is at top if present
  if (content.includes("'use client';")) {
    // Remove all 'use client'; occurrences first
    content = content.replace(/'use client';\s*/g, '');
    content = "'use client';\n\n" + content.trim();
  }

  // Ensure import RsvpSection comes AFTER 'use client';
  if (!content.includes("import RsvpSection")) {
    if (content.includes("'use client';")) {
      content = content.replace("'use client';", "'use client';\n\nimport RsvpSection from './RsvpSection';");
    } else {
      content = "import RsvpSection from './RsvpSection';\n\n" + content;
    }
  } else {
    // If import RsvpSection is above 'use client';, fix order
    const useClientIdx = content.indexOf("'use client';");
    const importRsvpIdx = content.indexOf("import RsvpSection");
    if (useClientIdx > -1 && importRsvpIdx > -1 && importRsvpIdx < useClientIdx) {
      content = content.replace("import RsvpSection from './RsvpSection';\n", "");
      content = content.replace("'use client';", "'use client';\n\nimport RsvpSection from './RsvpSection';");
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Cleaned order in ${file}`);
});
