// Create database and seed sample data
const Database = require('better-sqlite3');
const fs = require('fs');
const sql = fs.readFileSync('./migrations.sql', 'utf8');
const db = new Database('./data.sqlite');
db.exec(sql);

const seed = db.prepare('INSERT INTO inventory (name, category, quantity, description) VALUES (?, ?, ?, ?)');
const items = [
  ['Ballpoint Pens', 'Stationery', 50, 'Blue/black pens for temporary use'],
  ['Notebooks (A4 sheets)', 'Papers', 200, 'Loose A4 papers and bundles'],
  ['Umbrellas (large)', 'Umbrellas', 10, 'Campus-use umbrellas'],
  ['Pencil Sets', 'Stationery', 30, 'Pencils and sharpeners']
];

db.transaction(() => {
  for (const i of items) seed.run(...i);
})();

console.log('Database initialized and seeded to data.sqlite');