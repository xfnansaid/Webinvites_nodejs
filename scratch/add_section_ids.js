const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '../src/components/templates');
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.js') && f !== 'index.js' && f !== 'RsvpSection.js');

files.forEach(file => {
  const filePath = path.join(templatesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add id="countdown-section" if not present
  if (!content.includes('id="countdown-section"')) {
    content = content.replace(/(countdownTitle|countdownSubtitle|Counting Down|The Countdown|timeLeft)/, 'id="countdown-section" $1');
  }

  // Add id="venue-section" if not present
  if (!content.includes('id="venue-section"')) {
    content = content.replace(/(venueAddress|canonicalMapUrl|venueMapAddress|Google Maps)/, 'id="venue-section" $1');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Added section IDs to ${file}`);
});
