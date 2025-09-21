// Simple test to check if the module can be imported
import fs from 'fs';

// Read the bookmark.ts file directly
const bookmarkFile = fs.readFileSync('/Users/sungho/Desktop/daou_study/prompt-driver/frontend/src/types/bookmark.ts', 'utf8');

console.log('File contents:');
console.log(bookmarkFile);

// Look for the Bookmark export specifically
const bookmarkExportMatch = bookmarkFile.match(/export interface Bookmark.*?{.*?}/s);
if (bookmarkExportMatch) {
  console.log('\nFound Bookmark export:');
  console.log(bookmarkExportMatch[0]);
} else {
  console.log('\nBookmark export NOT found!');
}

// Check for any syntax issues around the Bookmark interface
const lines = bookmarkFile.split('\n');
lines.forEach((line, index) => {
  if (line.includes('Bookmark')) {
    console.log(`Line ${index + 1}: ${line}`);
  }
});