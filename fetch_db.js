/**
 * Database Inspector Script for DecisionTwin AI
 * Displays all records stored in the offline/local database
 */
const path = require('path');
const fs = require('fs');

console.log('===============================================================');
console.log('       🔍 DECISIONTWIN AI - DATABASE RECORD INSPECTOR');
console.log('===============================================================');

const storageFile = path.join(__dirname, 'server', 'src', 'data', 'offline_storage.json');

if (!fs.existsSync(storageFile)) {
  console.log('\n[Notice] No offline database file found at:');
  console.log(storageFile);
  console.log('The database will be automatically created when you register or create a scenario.');
  process.exit(0);
}

try {
  const content = fs.readFileSync(storageFile, 'utf8');
  const data = JSON.parse(content || '{}');
  const collections = Object.keys(data);

  if (collections.length === 0) {
    console.log('\n[Database Status] Database is currently empty (0 records).');
    console.log('Start the app and create a user or scenario to store data!\n');
    process.exit(0);
  }

  console.log(`\nFound ${collections.length} collection(s) in local storage:\n`);

  for (const coll of collections) {
    const items = data[coll] || [];
    console.log(`---------------------------------------------------------------`);
    console.log(`📁 Collection: [${coll.toUpperCase()}] (${items.length} records)`);
    console.log(`---------------------------------------------------------------`);

    if (items.length === 0) {
      console.log('   (Empty collection)');
    } else {
      items.forEach((item, idx) => {
        console.log(`\n   Record #${idx + 1}:`);
        // Print relevant fields cleanly
        const cleanItem = { ...item };
        delete cleanItem.passwordHash; // Don't print password hash
        console.log(JSON.stringify(cleanItem, null, 4).replace(/^/gm, '   '));
      });
    }
    console.log('');
  }

  console.log('===============================================================');
  console.log('Database inspection complete.');
  console.log('===============================================================');
} catch (err) {
  console.error('[Error] Could not read database file:', err.message);
}
