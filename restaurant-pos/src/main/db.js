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
      sizes TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS orders (
      order_id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      items TEXT NOT NULL,
      total INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'Paid',
      order_type TEXT NOT NULL DEFAULT 'Dine-in',
      note TEXT,
      customer_phone TEXT,
      customer_address TEXT
    );
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT '',
      current_qty REAL NOT NULL DEFAULT 0,
      reorder_level REAL NOT NULL DEFAULT 0,
      unit_cost REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      qty_per_unit REAL NOT NULL,
      FOREIGN KEY (item_id) REFERENCES items(id),
      FOREIGN KEY (ingredient_id) REFERENCES inventory(id),
      UNIQUE (item_id, ingredient_id)
    );
  `);

  try {
    db.exec('ALTER TABLE items ADD COLUMN sizes TEXT');
  } catch (err) {
    // column already exists
  }

  [
    "ALTER TABLE orders ADD COLUMN order_type TEXT NOT NULL DEFAULT 'Dine-in'",
    "ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'Paid'",
    'ALTER TABLE orders ADD COLUMN note TEXT',
    'ALTER TABLE orders ADD COLUMN customer_phone TEXT',
    'ALTER TABLE orders ADD COLUMN customer_address TEXT',
    'ALTER TABLE orders ADD COLUMN inventory_applied INTEGER NOT NULL DEFAULT 0'
  ].forEach((sql) => {
    try {
      db.exec(sql);
    } catch (err) {
      // column already exists
    }
  });

  seedIfEmpty(db);
  backfillSizes(db);
  ensureOffersCategory(db);
  return db;
}

function ensureOffersCategory(db) {
  const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get('Big Offers');
  if (existing) return;

  const oldOffers = db.prepare('SELECT id FROM categories WHERE name = ?').get('Offers');
  if (oldOffers) {
    db.prepare('UPDATE categories SET name = ? WHERE id = ?').run('Big Offers', oldOffers.id);
    return;
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) AS m FROM categories').get().m;
  db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run('Big Offers', (maxOrder || 0) + 1);
}

function backfillSizes(db) {
  const missing = db.prepare("SELECT id, name FROM items WHERE sizes IS NULL OR sizes = ''").all();
  if (!missing.length) return;

  const menuPath = path.join(app.getAppPath(), 'menu.json');
  const parentPath = path.join(app.getAppPath(), '..', 'menu.json');
  const finalPath = fs.existsSync(menuPath) ? menuPath : parentPath;
  if (!fs.existsSync(finalPath)) return;

  const menu = JSON.parse(fs.readFileSync(finalPath, 'utf-8'));
  const sizesByName = new Map();
  (menu.categories || []).forEach((cat) => {
    (cat.items || []).forEach((item) => {
      if (item.sizes) sizesByName.set(item.name, item.sizes);
    });
  });
  if (!sizesByName.size) return;

  const update = db.prepare('UPDATE items SET sizes = ? WHERE id = ?');
  const run = db.transaction((rows) => {
    rows.forEach((row) => {
      const sizes = sizesByName.get(row.name);
      if (sizes) update.run(JSON.stringify(sizes), row.id);
    });
  });
  run(missing);
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
    'INSERT INTO items (name, price, category_id, description, sizes) VALUES (?, ?, ?, ?, ?)'
  );

  const seedAll = db.transaction((categories) => {
    categories.forEach((cat, idx) => {
      const catId = insertCategory.run(cat.name, idx).lastInsertRowid;
      (cat.items || []).forEach((item) => {
        let price = item.price;
        let description = item.description || null;
        let sizesJson = null;
        if (price === undefined && item.sizes) {
          const sizeEntries = Object.entries(item.sizes);
          price = sizeEntries.length ? sizeEntries[0][1] : 0;
          sizesJson = JSON.stringify(item.sizes);
        }
        insertItem.run(item.name, price || 0, catId, description, sizesJson);
      });
    });
  });

  seedAll(menu.categories || []);
}

module.exports = { getDb };
