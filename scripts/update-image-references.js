#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Base URL for Tebi.io images
const TEBI_BASE_URL = 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home';

// Image mapping based on categorization
const imageMapping = {
  // Before/After pairs
  '/testpics/Girl+1+Before.jpg': `${TEBI_BASE_URL}/before-after/Girl+1+Before.jpg`,
  '/testpics/Girl+1+After.png': `${TEBI_BASE_URL}/before-after/Girl+1+After.png`,
  '/testpics/Asian+Girl+7+before.jpg': `${TEBI_BASE_URL}/before-after/Asian+Girl+7+before.jpg`,
  '/testpics/Asian+Girl+7+after.png': `${TEBI_BASE_URL}/before-after/Asian+Girl+7+after.png`,
  '/testpics/Asian+Man+1+Before.jpg': `${TEBI_BASE_URL}/before-after/Asian+Man+1+Before.jpg`,
  '/testpics/Asian+Man+1+After.png': `${TEBI_BASE_URL}/before-after/Asian+Man+1+After.png`,
  '/testpics/Black+Man+1+Before.jpg': `${TEBI_BASE_URL}/before-after/Black+Man+1+Before.jpg`,
  '/testpics/Black+Man+1+After.png': `${TEBI_BASE_URL}/before-after/Black+Man+1+After.png`,
  '/testpics/Face+1+Before.jpg': `${TEBI_BASE_URL}/before-after/Face+1+Before.jpg`,
  '/testpics/Face+1+After.png': `${TEBI_BASE_URL}/before-after/Face+1+After.png`,
  '/testpics/Girl+2+Before (1).jpg': `${TEBI_BASE_URL}/before-after/Girl+2+Before (1).jpg`,
  '/testpics/Girl+2+After.png': `${TEBI_BASE_URL}/before-after/Girl+2+After.png`,
  '/testpics/White+Girl+6+before.jpg': `${TEBI_BASE_URL}/before-after/White+Girl+6+before.jpg`,
  '/testpics/White+Girl+6+after.jpg': `${TEBI_BASE_URL}/before-after/White+Girl+6+after.jpg`,
  '/testpics/White+Man+1+Before.jpg': `${TEBI_BASE_URL}/before-after/White+Man+1+Before.jpg`,
  '/testpics/White+Man+1+After.png': `${TEBI_BASE_URL}/before-after/White+Man+1+After.png`,
  '/testpics/LilMiquela+before.png': `${TEBI_BASE_URL}/before-after/LilMiquela+before.png`,
  '/testpics/LilMiquela+after.png': `${TEBI_BASE_URL}/before-after/LilMiquela+after.png`,
  '/testpics/Anita+Before.jpg.webp': `${TEBI_BASE_URL}/before-after/Anita+Before.jpg.webp`,
  '/testpics/Anita+After.png': `${TEBI_BASE_URL}/before-after/Anita+After.png`,
  
  // AI Tools/Competitors
  '/testpics/Adobe Firefly.png': `${TEBI_BASE_URL}/ai-tools/Adobe Firefly.png`,
  '/testpics/Dalle.png': `${TEBI_BASE_URL}/ai-tools/Dalle.png`,
  '/testpics/Flux.png': `${TEBI_BASE_URL}/ai-tools/Flux.png`,
  '/testpics/Midjourney2.png': `${TEBI_BASE_URL}/ai-tools/Midjourney2.png`,
  '/testpics/stability.png': `${TEBI_BASE_URL}/ai-tools/stability.png`,
  '/testpics/grok.png': `${TEBI_BASE_URL}/ai-tools/grok.png`,
  
  // Portfolio/Showcase
  '/testpics/Tove1.png': `${TEBI_BASE_URL}/portfolio/Tove1.png`,
  '/testpics/Tove2.png': `${TEBI_BASE_URL}/portfolio/Tove2.png`,
  '/testpics/Tove3.png': `${TEBI_BASE_URL}/portfolio/Tove3.png`,
  '/testpics/Tove4.png': `${TEBI_BASE_URL}/portfolio/Tove4.png`,
  
  // Hero/Marketing
  '/testpics/herodesktop.jpeg': `${TEBI_BASE_URL}/hero/herodesktop.jpeg`,
  '/testpics/previousherodesktop.jpeg': `${TEBI_BASE_URL}/hero/previousherodesktop.jpeg`,
  '/testpics/imageskintexturebackground.jpg': `${TEBI_BASE_URL}/hero/imageskintexturebackground.jpg`,
  '/testpics/b-roll.jpeg': `${TEBI_BASE_URL}/hero/b-roll.jpeg`,
  
  // Demo/Examples
  '/testpics/4kresolution.png': `${TEBI_BASE_URL}/demos/4kresolution.png`,
  '/testpics/ladypink.png': `${TEBI_BASE_URL}/demos/ladypink.png`,
  '/testpics/lipme.png': `${TEBI_BASE_URL}/demos/lipme.png`,
  '/testpics/blemanbefore.jpeg': `${TEBI_BASE_URL}/demos/blemanbefore.jpeg`,
  
  // SVG files (misc category)
  '/file.svg': `${TEBI_BASE_URL}/misc/file.svg`,
  '/globe.svg': `${TEBI_BASE_URL}/misc/globe.svg`,
  '/next.svg': `${TEBI_BASE_URL}/misc/next.svg`,
  '/vercel.svg': `${TEBI_BASE_URL}/misc/vercel.svg`,
  '/window.svg': `${TEBI_BASE_URL}/misc/window.svg`
};

// Function to update file content
function updateFileContent(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    let replacements = [];
    
    // Replace each image reference
    for (const [localPath, tebiUrl] of Object.entries(imageMapping)) {
      const regex = new RegExp(localPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      
      if (matches) {
        content = content.replace(regex, tebiUrl);
        updated = true;
        replacements.push({
          from: localPath,
          to: tebiUrl,
          count: matches.length
        });
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      replacements.forEach(r => {
        console.log(`   ${r.from} -> ${r.to} (${r.count} occurrences)`);
      });
      return { updated: true, replacements };
    } else {
      console.log(`⏭️  No changes: ${filePath}`);
      return { updated: false, replacements: [] };
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return { updated: false, error: error.message, replacements: [] };
  }
}

// Function to find all relevant files
function findFiles() {
  const patterns = [
    'src/**/*.tsx',
    'src/**/*.ts',
    'src/**/*.jsx',
    'src/**/*.js'
  ];
  
  let allFiles = [];
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    allFiles = allFiles.concat(files);
  });
  
  // Remove duplicates and filter out test files
  return [...new Set(allFiles)].filter(file => 
    !file.includes('node_modules') && 
    !file.includes('.test.') && 
    !file.includes('.spec.')
  );
}

// Main execution
async function main() {
  console.log('🚀 Starting image reference update...');
  console.log(`🔗 Base URL: ${TEBI_BASE_URL}`);
  
  const files = findFiles();
  console.log(`📁 Found ${files.length} files to process`);
  
  const results = [];
  let totalUpdated = 0;
  let totalReplacements = 0;
  
  for (const file of files) {
    const result = updateFileContent(file);
    results.push({ file, ...result });
    
    if (result.updated) {
      totalUpdated++;
      totalReplacements += result.replacements.reduce((sum, r) => sum + r.count, 0);
    }
  }
  
  // Generate summary
  console.log('\n📊 Update Summary:');
  console.log(`📁 Files processed: ${files.length}`);
  console.log(`✅ Files updated: ${totalUpdated}`);
  console.log(`🔄 Total replacements: ${totalReplacements}`);
  
  const updatedFiles = results.filter(r => r.updated);
  if (updatedFiles.length > 0) {
    console.log('\n📝 Updated files:');
    updatedFiles.forEach(result => {
      console.log(`   ${result.file}`);
    });
  }
  
  const errorFiles = results.filter(r => r.error);
  if (errorFiles.length > 0) {
    console.log('\n❌ Files with errors:');
    errorFiles.forEach(result => {
      console.log(`   ${result.file}: ${result.error}`);
    });
  }
  
  // Save results to JSON file for reference
  const outputFile = './image-update-results.json';
  fs.writeFileSync(outputFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: TEBI_BASE_URL,
    summary: {
      filesProcessed: files.length,
      filesUpdated: totalUpdated,
      totalReplacements: totalReplacements,
      errors: errorFiles.length
    },
    results: results
  }, null, 2));
  
  console.log(`\n💾 Results saved to: ${outputFile}`);
  console.log('\n🎉 Image reference update completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { updateFileContent, imageMapping };