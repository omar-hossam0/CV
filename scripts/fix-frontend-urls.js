/**
 * Script to fix hardcoded localhost URLs in frontend files
 * Run this script to update all frontend files to use the centralized API configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to update
const filesToUpdate = [
  'Frontend/src/pages/Dashboard.jsx',
  'Frontend/src/pages/Jobs.jsx',
  'Frontend/src/pages/JobDetails.jsx',
  'Frontend/src/pages/Profile.jsx',
  'Frontend/src/pages/HRDashboard.jsx',
  'Frontend/src/pages/HRMessages.jsx',
  'Frontend/src/pages/HRProfile.jsx',
  'Frontend/src/pages/JobApplicants.jsx',
  'Frontend/src/pages/CandidateProfile.jsx',
  'Frontend/src/pages/AllJobsMatching.jsx',
  'Frontend/src/pages/HRCompanyProfile.jsx',
  'Frontend/src/pages/HRApplicants.jsx',
  'Frontend/src/components/LatestJobsSection.jsx',
  'Frontend/src/components/HRLayout.jsx',
  'Frontend/src/components/TopNavbar.jsx',
];

// Pattern to replace
const patterns = [
  { search: /http:\/\/localhost:5000/g, replace: '${API_BASE_URL}' },
  { search: /127\.0\.0\.1:5000/g, replace: '${API_BASE_URL}' },
];

// Import statement to add
const importStatement = 'import { API_BASE_URL } from "../utils/api.js";';

console.log('🔧 Fixing hardcoded localhost URLs in frontend files...\n');

for (const filePath of filesToUpdate) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changes = 0;
  
  // Check if API_BASE_URL is already imported
  const hasImport = content.includes('API_BASE_URL') || content.includes('import { API_BASE_URL }');
  
  // Apply replacements
  for (const pattern of patterns) {
    if (pattern.search.test(content)) {
      content = content.replace(pattern.search, pattern.replace);
      changes++;
    }
  }
  
  // Add import if needed and changes were made
  if (changes > 0 && !hasImport) {
    // Add import after last import statement
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfImportLine = content.indexOf('\n', lastImportIndex) + 1;
    content = content.slice(0, endOfImportLine) + importStatement + '\n' + content.slice(endOfImportLine);
    changes++;
  }
  
  if (changes > 0) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated: ${filePath} (${changes} changes)`);
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
  }
}

console.log('\n✨ Done! All hardcoded URLs have been replaced.');
