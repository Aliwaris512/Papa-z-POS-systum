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

  ipcMain.handle('orders:save', (_event, { items, total, paymentMethod }) => {
    const timestamp = new Date().toISOString();
    const stmt = db.prepare(
      'INSERT INTO orders (timestamp, items, total, payment_method) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(timestamp, JSON.stringify(items), total, paymentMethod);
    backupDb();
    return { orderId: result.lastInsertRowid, timestamp };
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

  ipcMain.handle('app:printReceipt', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.webContents.print({ silent: false, printBackground: true });
  });

  ipcMain.handle('orders:getAll', () => {
    return db.prepare('SELECT * FROM orders ORDER BY order_id DESC').all();
  });

  ipcMain.handle('orders:delete', (_event, orderId) => {
    db.prepare('DELETE FROM orders WHERE order_id = ?').run(orderId);
    backupDb();
    return { deleted: true };
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

    const header = 'order_id,timestamp,items,total,payment_method';
    const rows = orders.map((o) =>
      [o.order_id, o.timestamp, o.items, o.total, o.payment_method].map(csvEscape).join(',')
    );
    fs.writeFileSync(filePath, [header, ...rows].join('\n'), 'utf-8');
    return { canceled: false, filePath, count: orders.length };
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
