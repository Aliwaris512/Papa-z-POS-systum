const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { getDb } = require('./db');

function csvEscape(value) {
  const str = String(value);
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

let db;
let mainWindow;

function applyInventoryDelta(lineItems, direction) {
  const getRecipe = db.prepare('SELECT ingredient_id, qty_per_unit FROM recipes WHERE item_id = ?');
  const updateQty = db.prepare('UPDATE inventory SET current_qty = current_qty + ? WHERE id = ?');
  const lowStock = [];

  lineItems.forEach((line) => {
    if (!line.menuItemId) return;
    const recipeRows = getRecipe.all(line.menuItemId);
    recipeRows.forEach((r) => {
      const delta = direction * r.qty_per_unit * line.qty;
      updateQty.run(delta, r.ingredient_id);
    });
  });

  if (direction < 0) {
    const affectedIds = new Set();
    lineItems.forEach((line) => {
      if (!line.menuItemId) return;
      getRecipe.all(line.menuItemId).forEach((r) => affectedIds.add(r.ingredient_id));
    });
    if (affectedIds.size) {
      const rows = db
        .prepare(`SELECT * FROM inventory WHERE id IN (${[...affectedIds].join(',')})`)
        .all();
      rows.forEach((row) => {
        if (row.current_qty <= row.reorder_level) lowStock.push(row);
      });
    }
  }

  return lowStock;
}

function getBackupDir() {
  const oneDrive = process.env.OneDriveConsumer || process.env.OneDrive;
  const base = oneDrive || app.getPath('documents');
  return path.join(base, 'Papa Zzz POS Backup');
}

function restoreDbIfMissing() {
  try {
    const dbPath = path.join(app.getPath('userData'), 'pos.db');
    const backupPath = path.join(getBackupDir(), 'pos.db');
    if (!fs.existsSync(dbPath) && fs.existsSync(backupPath)) {
      fs.mkdirSync(app.getPath('userData'), { recursive: true });
      fs.copyFileSync(backupPath, dbPath);
    }
  } catch (err) {
    console.error('Restore failed:', err);
  }
}

function backupDb() {
  try {
    const dbPath = path.join(app.getPath('userData'), 'pos.db');
    const backupDir = getBackupDir();
    fs.mkdirSync(backupDir, { recursive: true });
    fs.copyFileSync(dbPath, path.join(backupDir, 'pos.db'));
  } catch (err) {
    console.error('Backup failed:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  restoreDbIfMissing();
  db = getDb();
  backupDb();

  ipcMain.handle('menu:getCategories', () => {
    return db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  });

  ipcMain.handle('menu:getItemsByCategory', (_event, categoryId) => {
    return db.prepare('SELECT * FROM items WHERE category_id = ? ORDER BY id').all(categoryId);
  });

  ipcMain.handle('menu:addCategory', (_event, name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) throw new Error('Section name required');
    const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(trimmed);
    if (existing) throw new Error('A section with this name already exists');
    const maxOrder = db.prepare('SELECT MAX(sort_order) AS m FROM categories').get().m || 0;
    const result = db
      .prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)')
      .run(trimmed, maxOrder + 1);
    backupDb();
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  });

  ipcMain.handle('orders:save', (_event, { items, total, paymentMethod, paymentStatus, orderType, note, customerPhone, customerAddress }) => {
    const timestamp = new Date().toISOString();
    const status = paymentStatus || 'Paid';
    const shouldDeduct = status === 'Paid';

    let lowStock = [];
    const run = db.transaction(() => {
      const stmt = db.prepare(
        'INSERT INTO orders (timestamp, items, total, payment_method, payment_status, order_type, note, customer_phone, customer_address, inventory_applied) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      const result = stmt.run(
        timestamp,
        JSON.stringify(items),
        total,
        paymentMethod,
        status,
        orderType || 'Dine-in',
        note || null,
        customerPhone || null,
        customerAddress || null,
        shouldDeduct ? 1 : 0
      );
      if (shouldDeduct) {
        lowStock = applyInventoryDelta(items, -1);
      }
      return result.lastInsertRowid;
    });

    const orderId = run();
    backupDb();
    return { orderId, timestamp, lowStock };
  });

  ipcMain.handle('menu:addItem', (_event, { name, price, categoryId, description }) => {
    const stmt = db.prepare(
      'INSERT INTO items (name, price, category_id, description) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(name, price, categoryId, description || null);
    backupDb();
    return { id: result.lastInsertRowid, name, price, category_id: categoryId, description: description || null };
  });

  ipcMain.handle('menu:deleteItem', (_event, itemId) => {
    db.prepare('DELETE FROM items WHERE id = ?').run(itemId);
    backupDb();
    return { deleted: true };
  });

  ipcMain.handle('menu:getRecipe', (_event, itemId) => {
    return db
      .prepare(
        `SELECT r.ingredient_id, r.qty_per_unit, inv.name, inv.unit
         FROM recipes r JOIN inventory inv ON inv.id = r.ingredient_id
         WHERE r.item_id = ? ORDER BY inv.name`
      )
      .all(itemId);
  });

  ipcMain.handle('menu:saveRecipe', (_event, { itemId, ingredients }) => {
    const run = db.transaction(() => {
      db.prepare('DELETE FROM recipes WHERE item_id = ?').run(itemId);
      const insert = db.prepare(
        'INSERT INTO recipes (item_id, ingredient_id, qty_per_unit) VALUES (?, ?, ?)'
      );
      (ingredients || []).forEach((ing) => {
        if (ing.qtyPerUnit > 0) insert.run(itemId, ing.ingredientId, ing.qtyPerUnit);
      });
    });
    run();
    backupDb();
    return { saved: true };
  });

  ipcMain.handle('app:getPrinters', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win.webContents.getPrintersAsync();
  });

  ipcMain.handle('app:printReceipt', async (event, heightMm) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const height = Math.max(60, Math.min(heightMm || 200, 1200));

    const printers = await win.webContents.getPrintersAsync();
    const bixolon = printers.find((p) => /bixolon/i.test(p.name) && /qe302/i.test(p.name))
      || printers.find((p) => /bixolon/i.test(p.name));

    if (!bixolon) {
      return {
        success: false,
        error: `BIXOLON SRP-QE302 not found. Detected printers: ${printers.map((p) => p.name).join(', ') || 'none'}. Check it is installed, powered on, and set up in Windows.`
      };
    }

    return new Promise((resolve) => {
      win.webContents.print({
        silent: true,
        deviceName: bixolon.name,
        printBackground: true,
        margins: { marginType: 'none' },
        scaleFactor: 100,
        pageSize: { width: 72000, height: Math.round(height * 1000) }
      }, (success, errorType) => {
        if (!success) {
          console.error('Print failed:', errorType);
          resolve({ success: false, error: `Print failed: ${errorType}` });
        } else {
          resolve({ success: true });
        }
      });
    });
  });

  ipcMain.handle('orders:getAll', () => {
    return db.prepare('SELECT * FROM orders ORDER BY order_id DESC').all();
  });

  ipcMain.handle('orders:delete', (_event, orderId) => {
    const order = db.prepare('SELECT items, inventory_applied FROM orders WHERE order_id = ?').get(orderId);
    if (order && order.inventory_applied) {
      applyInventoryDelta(JSON.parse(order.items), 1);
    }
    db.prepare('DELETE FROM orders WHERE order_id = ?').run(orderId);
    backupDb();
    return { deleted: true };
  });

  ipcMain.handle('orders:update', (_event, payload) => {
    const { orderId, paymentMethod, paymentStatus, orderType, note, customerPhone, customerAddress } = payload;
    db.prepare(
      `UPDATE orders SET payment_method = ?, payment_status = ?, order_type = ?, note = ?, customer_phone = ?, customer_address = ?
       WHERE order_id = ?`
    ).run(paymentMethod, paymentStatus, orderType, note || null, customerPhone || null, customerAddress || null, orderId);
    backupDb();
    return { updated: true };
  });

  ipcMain.handle('orders:exportCsv', async (event, range) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Export Orders to CSV',
      defaultPath: `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });
    if (canceled || !filePath) return { canceled: true };

    let orders;
    if (range && range.from && range.to) {
      orders = db
        .prepare('SELECT * FROM orders WHERE timestamp >= ? AND timestamp <= ? ORDER BY order_id DESC')
        .all(range.from, range.to);
    } else {
      orders = db.prepare('SELECT * FROM orders ORDER BY order_id DESC').all();
    }

    const header = 'order_id,timestamp,items,total,payment_method,payment_status,order_type,note,customer_phone,customer_address';
    const rows = orders.map((o) =>
      [o.order_id, o.timestamp, o.items, o.total, o.payment_method, o.payment_status, o.order_type, o.note, o.customer_phone, o.customer_address].map(csvEscape).join(',')
    );
    fs.writeFileSync(filePath, [header, ...rows].join('\n'), 'utf-8');
    return { canceled: false, filePath, count: orders.length };
  });

  ipcMain.handle('inventory:getAll', () => {
    return db.prepare('SELECT * FROM inventory ORDER BY name').all();
  });

  ipcMain.handle('inventory:add', (_event, { name, unit, currentQty, reorderLevel, unitCost }) => {
    const stmt = db.prepare(
      'INSERT INTO inventory (name, unit, current_qty, reorder_level, unit_cost) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(name, unit || '', currentQty || 0, reorderLevel || 0, unitCost || 0);
    backupDb();
    return { id: result.lastInsertRowid };
  });

  ipcMain.handle('inventory:update', (_event, { id, name, unit, currentQty, reorderLevel, unitCost }) => {
    db.prepare(
      'UPDATE inventory SET name = ?, unit = ?, current_qty = ?, reorder_level = ?, unit_cost = ? WHERE id = ?'
    ).run(name, unit || '', currentQty || 0, reorderLevel || 0, unitCost || 0, id);
    backupDb();
    return { updated: true };
  });

  ipcMain.handle('inventory:delete', (_event, id) => {
    db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
    backupDb();
    return { deleted: true };
  });

  ipcMain.handle('inventory:exportCsv', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Export Inventory to CSV',
      defaultPath: `inventory-${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });
    if (canceled || !filePath) return { canceled: true };

    const items = db.prepare('SELECT * FROM inventory ORDER BY name').all();
    const header = 'id,name,unit,current_qty,reorder_level,unit_cost,buy_qty,buy_cost';
    const rows = items.map((it) => {
      const buyQty = Math.max(it.reorder_level - it.current_qty, 0);
      const buyCost = buyQty * it.unit_cost;
      return [it.id, it.name, it.unit, it.current_qty, it.reorder_level, it.unit_cost, buyQty, buyCost]
        .map(csvEscape)
        .join(',');
    });
    fs.writeFileSync(filePath, [header, ...rows].join('\n'), 'utf-8');
    return { canceled: false, filePath, count: items.length };
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
