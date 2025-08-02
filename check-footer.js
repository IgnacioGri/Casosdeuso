// Check if footer exists in DOCX file
import fs from 'fs';
import AdmZip from 'adm-zip';

// DOCX files are actually ZIP archives containing XML files
const zip = new AdmZip('test-footer-v2.docx');
const zipEntries = zip.getEntries();

console.log('\n🔍 Analyzing DOCX file for footer content...\n');

// Look for footer files
const footerFiles = zipEntries.filter(entry => 
  entry.entryName.includes('footer') || 
  entry.entryName.includes('Footer')
);

if (footerFiles.length === 0) {
  console.log('❌ No footer files found in the DOCX!');
} else {
  console.log('✅ Footer files found:');
  footerFiles.forEach(entry => {
    console.log(`   - ${entry.entryName}`);
    
    // Extract and display footer content
    const content = zip.readAsText(entry);
    console.log('\nFooter XML content preview:');
    
    // Look for our specific footer text
    if (content.includes('página') && content.includes(' de ')) {
      console.log('✅ Found page numbering: "página X de Y"');
    } else {
      console.log('❌ Page numbering not found');
    }
    
    if (content.includes('BP001-Gestionar Información Cliente')) {
      console.log('✅ Found use case name in footer');
    } else if (content.includes('CASO DE USO')) {
      console.log('⚠️  Found default "CASO DE USO" text instead of specific use case name');
    } else {
      console.log('❌ Use case name not found in footer');
    }
    
    // Show full footer content to debug
    console.log('\nFull Footer XML content:');
    console.log(content);
    console.log('\n---End of footer content---\n');
  });
}

// Also check document.xml.rels to see if footer is properly linked
const relsEntry = zipEntries.find(entry => 
  entry.entryName === 'word/_rels/document.xml.rels'
);

if (relsEntry) {
  const relsContent = zip.readAsText(relsEntry);
  if (relsContent.includes('footer')) {
    console.log('✅ Footer is properly linked in document relationships');
  } else {
    console.log('❌ Footer is NOT linked in document relationships');
  }
}