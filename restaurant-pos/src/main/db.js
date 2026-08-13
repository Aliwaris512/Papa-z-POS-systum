const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { app } = require('electron');

function getDb() {
  const dbPath = path.join(app.getPath('userData'), 'pos.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      description TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS orders (
      order_id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      items TEXT NOT NULL,
      total INTEGER NOT NULL,
      payment_method TEXT NOT NULL
    );
  `);

  seedIfEmpty(db);
  return db;
}

function seedIfEmpty(db) {
  const count = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
  if (count > 0) return;

  const menuPath = path.join(app.getAppPath(), 'menu.json');
  const parentPath = path.join(app.getAppPath(), '..', 'menu.json');
  const finalPath = fs.existsSync(menuPath) ? menuPath : parentPath;
  if (!fs.existsSync(finalPath)) return;

  const menu = JSON.parse(fs.readFileSync(finalPath, 'utf-8'));

  const insertCategory = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)');
  const insertItem = db.prepare(
    'INSERT INTO items (name, price, category_id, description) VALUES (?, ?, ?, ?)'
  );

  const seedAll = db.transaction((categories) => {
    categories.forEach((cat, idx) => {
      const catId = insertCategory.run(cat.name, idx).lastInsertRowid;
      (cat.items || []).forEach((item) => {
        let price = item.price;
        let description = item.description || null;
        if (price === undefined && item.sizes) {
          const sizeEntries = Object.entries(item.sizes);
          price = sizeEntries.length ? sizeEntries[0][1] : 0;
          description = sizeEntries.map(([s, p]) => `${s}: Rs.${p}`).join('  ');
        }
        insertItem.run(item.name, price || 0, catId, description);
      });
    });
  });

  seedAll(menu.categories || []);
}

module.exports = { getDb };
