#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Initialize Tebi S3 Client
const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: 'https://s3.tebi.io',
  credentials: {
    accessKeyId: process.env.TEBI_ACCESS_KEY_ID,
    secretAccessKey: process.env.TEBI_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
  disableRequestCompression: true,
  useAccelerateEndpoint: false,
  maxAttempts: 3,
  disableS3ExpressSessionAuth: true,
  requestHandler: {
    httpsAgent: false
  }
});

const BUCKET_NAME = process.env.TEBI_BUCKET_NAME;
const BASE_PATH = 'sharpiiweb/home';

// Image categorization mapping
const imageCategories = {
  // Before/After pairs
  'before-after': [
    'Girl+1+Before.jpg', 'Girl+1+After.png',
    'Asian+Girl+7+before.jpg', 'Asian+Girl+7+after.png',
    'Asian+Man+1+Before.jpg', 'Asian+Man+1+After.png',
    'Black+Man+1+Before.jpg', 'Black+Man+1+After.png',
    'Face+1+Before.jpg', 'Face+1+After.png',
    'Girl+2+Before (1).jpg', 'Girl+2+After.png',
    'White+Girl+6+before.jpg', 'White+Girl+6+after.jpg',
    'White+Man+1+Before.jpg', 'White+Man+1+After.png',
    'LilMiquela+before.png', 'LilMiquela+after.png',
    'Anita+Before.jpg.webp', 'Anita+After.png'
  ],
  
  // AI Tools/Competitors
  'ai-tools': [
    'Adobe Firefly.png', 'Dalle.png', 'Flux.png',
    'Midjourney2.png', 'stability.png', 'grok.png'
  ],
  
  // Portfolio/Showcase
  'portfolio': [
    'Tove1.png', 'Tove2.png', 'Tove3.png', 'Tove4.png'
  ],
  
  // Hero/Marketing
  'hero': [
    'herodesktop.jpeg', 'previousherodesktop.jpeg',
    'imageskintexturebackground.jpg', 'b-roll.jpeg'
  ],
  
  // Demo/Examples
  'demos': [
    '4kresolution.png', 'ladypink.png', 'lipme.png', 'blemanbefore.jpeg'
  ]
};

// Get MIME type based on file extension
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Get category for a file
function getCategoryForFile(filename) {
  for (const [category, files] of Object.entries(imageCategories)) {
    if (files.includes(filename)) {
      return category;
    }
  }
  return 'misc'; // Default category
}

// Upload a single file to Tebi
async function uploadFile(filePath, filename) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const category = getCategoryForFile(filename);
    const key = `${BASE_PATH}/${category}/${filename}`;
    const contentType = getMimeType(filename);
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      Metadata: {
        'original-path': filePath,
        'upload-date': new Date().toISOString(),
        'category': category
      }
    });
    
    await s3Client.send(command);
    console.log(`✅ Uploaded: ${filename} -> ${key}`);
    return { success: true, key, url: `https://s3.tebi.io/${BUCKET_NAME}/${key}` };
  } catch (error) {
    console.error(`❌ Failed to upload ${filename}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Process all images in a directory
async function processDirectory(dirPath, results = []) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory not found: ${dirPath}`);
    return results;
  }
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      await processDirectory(filePath, results);
    } else if (stat.isFile()) {
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(ext)) {
        const result = await uploadFile(filePath, file);
        results.push({ filename: file, ...result });
      }
    }
  }
  
  return results;
}

// Main execution
async function main() {
  console.log('🚀 Starting image upload to Tebi.io...');
  console.log(`📁 Base path: ${BASE_PATH}`);
  console.log(`🪣 Bucket: ${BUCKET_NAME}`);
  
  const results = [];
  
  // Process public/testpics directory
  console.log('\n📂 Processing public/testpics...');
  await processDirectory('./public/testpics', results);
  
  // Process root testpics directory
  console.log('\n📂 Processing testpics...');
  await processDirectory('./testpics', results);
  
  // Process public SVG files
  console.log('\n📂 Processing public SVG files...');
  const publicFiles = ['file.svg', 'globe.svg', 'next.svg', 'vercel.svg', 'window.svg'];
  for (const file of publicFiles) {
    const filePath = path.join('./public', file);
    if (fs.existsSync(filePath)) {
      const result = await uploadFile(filePath, file);
      results.push({ filename: file, ...result });
    }
  }
  
  // Generate summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log('\n📊 Upload Summary:');
  console.log(`✅ Successful uploads: ${successful.length}`);
  console.log(`❌ Failed uploads: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('\n🔗 Uploaded files:');
    successful.forEach(result => {
      console.log(`   ${result.filename} -> ${result.url}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed uploads:');
    failed.forEach(result => {
      console.log(`   ${result.filename}: ${result.error}`);
    });
  }
  
  // Save results to JSON file for reference
  const outputFile = './upload-results.json';
  fs.writeFileSync(outputFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    basePath: BASE_PATH,
    bucket: BUCKET_NAME,
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length
    },
    results: results
  }, null, 2));
  
  console.log(`\n💾 Results saved to: ${outputFile}`);
  console.log('\n🎉 Upload process completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { uploadFile, processDirectory, imageCategories };