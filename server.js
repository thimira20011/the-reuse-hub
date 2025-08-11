require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const basicAuth = require('express-basic-auth');

const db = require('./db');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: get inventory
app.get('/api/inventory', (req, res) => {
  const rows = db.prepare('SELECT * FROM inventory ORDER BY category, name').all();
  res.json(rows);
});

// API: borrow item
app.post('/api/borrow', (req, res) => {
  const { item_id, qty, user_name, student_id, contact } = req.body;
  if (!item_id || !qty || !user_name) return res.status(400).json({ error: 'Missing fields' });

  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(item_id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.quantity < qty) return res.status(400).json({ error: 'Not enough quantity' });

  const update = db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE id = ?');
  const insert = db.prepare('INSERT INTO transactions (item_id, type, qty, user_name, student_id, contact) VALUES (?, "borrow", ?, ?, ?, ?)');

  const tx = db.transaction(() => {
    update.run(qty, item_id);
    insert.run(item_id, qty, user_name, student_id || null, contact || null);
  });

  try {
    tx();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: return item
app.post('/api/return', (req, res) => {
  const { item_id, qty, user_name, student_id, contact } = req.body;
  if (!item_id || !qty || !user_name) return res.status(400).json({ error: 'Missing fields' });

  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(item_id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const update = db.prepare('UPDATE inventory SET quantity = quantity + ? WHERE id = ?');
  const insert = db.prepare('INSERT INTO transactions (item_id, type, qty, user_name, student_id, contact) VALUES (?, "return", ?, ?, ?, ?)');

  const tx = db.transaction(() => {
    update.run(qty, item_id);
    insert.run(item_id, qty, user_name, student_id || null, contact || null);
  });

  try {
    tx();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin routes (basic auth)
const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASS || 'changeme';
app.use('/admin-api', basicAuth({ users: { [adminUser]: adminPass }, challenge: true }));

app.get('/admin-api/transactions', (req, res) => {
  const rows = db.prepare('SELECT t.*, i.name AS item_name, i.category FROM transactions t LEFT JOIN inventory i ON i.id = t.item_id ORDER BY t.ts DESC').all();
  res.json(rows);
});

app.post('/admin-api/inventory', (req, res) => {
  const { name, category, quantity, description } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'Missing fields' });
  const stmt = db.prepare('INSERT INTO inventory (name, category, quantity, description) VALUES (?, ?, ?, ?)');
  const info = stmt.run(name, category, quantity || 0, description || null);
  res.json({ id: info.lastInsertRowid });
});

app.put('/admin-api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const { quantity, name, category, description } = req.body;
  const stmt = db.prepare('UPDATE inventory SET name = COALESCE(?, name), category = COALESCE(?, category), quantity = COALESCE(?, quantity), description = COALESCE(?, description) WHERE id = ?');
  stmt.run(name, category, quantity, description, id);
  res.json({ success: true });
});

app.get('/admin-api/inventory', (req, res) => {
  const rows = db.prepare('SELECT * FROM inventory ORDER BY category, name').all();
  res.json(rows);
});

// fallback to index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));