const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '../src/components/templates');
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.js') && f !== 'index.js' && f !== 'RsvpSection.js');

files.forEach(file => {
  const filePath = path.join(templatesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Tag top Hero section with id="hero-section" if not present
  if (!content.includes('id="hero-section"')) {
    // Replace first <section or <header that comes inside return
    const returnIdx = content.indexOf('return (');
    if (returnIdx !== -1) {
      const beforeReturn = content.slice(0, returnIdx);
      let afterReturn = content.slice(returnIdx);

      // Replace first <section or <header or top div
      if (afterReturn.includes('<section')) {
        afterReturn = afterReturn.replace('<section', '<section id="hero-section"');
      } else if (afterReturn.includes('<header')) {
        afterReturn = afterReturn.replace('<header', '<header id="hero-section"');
      }
      content = beforeReturn + afterReturn;
    }
  }

  // 2. Tag Countdown section with id="countdown-section" if not present
  if (!content.includes('id="countdown-section"')) {
    if (content.includes('countdownTitle')) {
      content = content.replace(/(<motion\.section|<section|<div)([^>]*countdownTitle)/s, '$1 id="countdown-section"$2');
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Tagged Hero and Countdown sections in ${file}`);
});
