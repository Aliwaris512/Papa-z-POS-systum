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

function normalizeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function getInventoryStatus(item) {
  if (!item) return 'OK';
  return item.current_qty <= item.reorder_level ? 'LOW STOCK' : 'OK';
}

function findDefaultIngredientForItemName(itemName) {
  const name = (itemName || '').toLowerCase();
  const inventory = db.prepare('SELECT * FROM inventory ORDER BY name').all();

  const matchesAny = (keywords) => {
    const keyList = keywords.map((word) => word.toLowerCase());
    return inventory.find((row) => {
      const rowName = (row.name || '').toLowerCase();
      return keyList.some((word) => rowName.includes(word));
    });
  };

  if (/burger|burger's|burgers/.test(name)) {
    return matchesAny(['burger bun', 'bun', 'burger bread']) || matchesAny(['bread']) || null;
  }

  if (/shawarma/.test(name)) {
    return matchesAny(['shawarma bread', 'shawarma', 'bread']) || matchesAny(['bread']) || null;
  }

  if (/wrap/.test(name)) {
    return matchesAny(['tortilla wrap', 'wrap bread', 'wrap', 'tortilla', 'bread']) || matchesAny(['bread']) || null;
  }

  if (/water/.test(name)) {
    if (/small|300ml/.test(name)) return matchesAny(['300ml', 'small water bottle', 'water bottle', 'water']) || matchesAny(['water']) || null;
    if (/large|500ml|1.5|1.5 litre|liter/.test(name)) return matchesAny(['500ml', '1.5 litre', 'large water bottle', 'water bottle', 'water']) || matchesAny(['water']) || null;
    return matchesAny(['water bottle', 'water']) || matchesAny(['water']) || null;
  }

  if (/drink|soft drink/.test(name)) {
    if (/small|300ml/.test(name)) return matchesAny(['300ml', 'small drink bottle', 'drink bottle', 'soft drink', 'drink']) || matchesAny(['drink']) || null;
    if (/large|500ml|1.5|1.5 litre|liter/.test(name)) return matchesAny(['500ml', '1.5 litre', 'large drink bottle', 'drink bottle', 'soft drink', 'drink']) || matchesAny(['drink']) || null;
    return matchesAny(['drink bottle', 'soft drink', 'drink']) || matchesAny(['drink']) || null;
  }

  if (/pizza|roll|sandwich|fries|deal|platter|appetizer|appetisers|special/.test(name)) {
    return matchesAny(['bread', 'bun', 'packet', 'pcs']) || null;
  }

  return matchesAny(['bread', 'bun', 'packet', 'pcs']) || null;
}

function ensureDefaultInventoryIngredient(name, defaults = { unit: 'Pcs', conversionQty: 1 }) {
  const normalized = (name || '').trim();
  if (!normalized) return null;

  const existing = db.prepare('SELECT * FROM inventory WHERE LOWER(name) = LOWER(?)').get(normalized);
  if (existing) return existing;

  const categoryMatch = db.prepare('SELECT id FROM inventory_categories WHERE LOWER(name) LIKE LOWER(?)').get(`${normalized}%`);
  const categoryId = categoryMatch ? categoryMatch.id : null;
  const result = db.prepare(
    'INSERT INTO inventory (name, category_id, unit, current_qty, reorder_level, unit_cost, conversion_qty) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(normalized, categoryId, defaults.unit || 'Pcs', 0, 0, 0, defaults.conversionQty ?? 1);

  return db.prepare('SELECT * FROM inventory WHERE id = ?').get(result.lastInsertRowid);
}

function getDefaultBeverageIngredientName(itemName) {
  const name = (itemName || '').toLowerCase();
  if (/small|300ml/.test(name)) return 'Drink Bottle 300ml';
  if (/large|500ml|1.5|1.5 litre|liter/.test(name)) return 'Drink Bottle 1.5 Litre';
  return 'Drink Bottle 300ml';
}

function ensureDefaultRecipeForItem(itemId, itemName) {
  if (!itemId) return;
  const existing = db.prepare('SELECT COUNT(*) AS c FROM recipes WHERE item_id = ?').get(itemId).c;
  if (existing > 0) return;

  const lowerName = (itemName || '').toLowerCase();
  let ingredient = null;

  if (/burger|burger's|burgers/.test(lowerName)) {
    ingredient = findDefaultIngredientForItemName(itemName) || ensureDefaultInventoryIngredient('Burger Bun', { unit: 'Packet', conversionQty: 4 });
  } else if (/shawarma/.test(lowerName)) {
    ingredient = findDefaultIngredientForItemName(itemName) || ensureDefaultInventoryIngredient('Shawarma Bread', { unit: 'Packet', conversionQty: 4 });
  } else if (/wrap/.test(lowerName)) {
    ingredient = findDefaultIngredientForItemName(itemName) || ensureDefaultInventoryIngredient('Tortilla Wrap', { unit: 'Packet', conversionQty: 8 });
  } else if (/water/.test(lowerName)) {
    ingredient = findDefaultIngredientForItemName(itemName) || ensureDefaultInventoryIngredient(/small|300ml/.test(lowerName) ? 'Water Bottle 300ml' : 'Water Bottle 1.5 Litre', { unit: 'Bottle', conversionQty: 1 });
  } else if (/drink|soft drink/.test(lowerName)) {
    ingredient = findDefaultIngredientForItemName(itemName) || ensureDefaultInventoryIngredient(getDefaultBeverageIngredientName(itemName), { unit: 'Bottle', conversionQty: 1 });
  }

  if (!ingredient) return;

  db.prepare('INSERT INTO recipes (item_id, ingredient_id, qty_per_unit) VALUES (?, ?, ?)')
    .run(itemId, ingredient.id, 1);
}

function getRequiredIngredientQty(ingredient, recipeQty, orderQty) {
  const recipeUnits = normalizeNumber(recipeQty) * normalizeNumber(orderQty);
  const conversion = normalizeNumber(ingredient?.conversion_qty || 1);
  if (conversion > 0 && ingredient && ingredient.unit && /packet/i.test(String(ingredient.unit))) {
    return recipeUnits / conversion;
  }
  return recipeUnits;
}

function validateInventoryAvailability(lineItems) {
  const getRecipe = db.prepare('SELECT ingredient_id, qty_per_unit FROM recipes WHERE item_id = ?');
  const getInventory = db.prepare('SELECT * FROM inventory WHERE id = ?');
  const issues = [];

  (lineItems || []).forEach((line) => {
    const qty = normalizeNumber(line.qty);
    if (!line.menuItemId || qty <= 0) return;
    const recipeRows = getRecipe.all(line.menuItemId);
    recipeRows.forEach((r) => {
      const ingredient = getInventory.get(r.ingredient_id);
      if (!ingredient) return;
      const required = getRequiredIngredientQty(ingredient, r.qty_per_unit, qty);
      if (ingredient.current_qty - required < 0) {
        issues.push({
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          current_qty: ingredient.current_qty,
          reorder_level: ingredient.reorder_level,
          required,
          message: `${ingredient.name}: ${ingredient.current_qty} ${ingredient.unit} available, need ${required} ${ingredient.unit}`
        });
      }
    });
  });

  return issues;
}

function addInventoryTransaction(inventoryId, deltaQty, reason, note = null, orderId = null) {
  if (!inventoryId || deltaQty === 0) return;
  db.prepare(
    'INSERT INTO inventory_transactions (inventory_id, order_id, delta_qty, reason, note, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(inventoryId, orderId || null, deltaQty, reason, note || null, new Date().toISOString());
}

function applyInventoryDelta(lineItems, direction, options = {}) {
  const { orderId = null, reason = 'SALE', note = null } = options;
  const getRecipe = db.prepare('SELECT ingredient_id, qty_per_unit FROM recipes WHERE item_id = ?');
  const getInventory = db.prepare('SELECT * FROM inventory WHERE id = ?');
  const updateQty = db.prepare('UPDATE inventory SET current_qty = current_qty + ? WHERE id = ?');
  const lowStock = [];
  const affectedIds = new Set();

  (lineItems || []).forEach((line) => {
    if (!line.menuItemId) return;
    const qty = normalizeNumber(line.qty);
    if (qty <= 0) return;
    const recipeRows = getRecipe.all(line.menuItemId);
    recipeRows.forEach((r) => {
      const ingredientId = r.ingredient_id;
      const ingredient = getInventory.get(ingredientId);
      if (!ingredient) return;
      const delta = direction * getRequiredIngredientQty(ingredient, r.qty_per_unit, qty);
      if (direction < 0 && ingredient.current_qty + delta < 0) {
        throw new Error(`Insufficient inventory for ${ingredient.name}.`);
      }
      updateQty.run(delta, ingredientId);
      addInventoryTransaction(ingredientId, delta, reason, note, orderId);
      affectedIds.add(ingredientId);
    });
  });

  if (direction < 0 && affectedIds.size) {
    const inventoryRows = db
      .prepare(`SELECT * FROM inventory WHERE id IN (${[...affectedIds].map(() => '?').join(',')})`)
      .all([...affectedIds]);
    inventoryRows.forEach((row) => {
      if (getInventoryStatus(row) === 'LOW STOCK') lowStock.push(row);
    });
  }

  return lowStock;
}

function normalizeInventoryInput(data = {}) {
  const normalized = {
    name: String(data.name || '').trim(),
    categoryId: data.categoryId === null || data.categoryId === undefined || data.categoryId === '' ? null : Number(data.categoryId),
    unit: String(data.unit || '').trim(),
    currentQty: Number.isFinite(Number(data.currentQty)) ? Number(data.currentQty) : 0,
    reorderLevel: Number.isFinite(Number(data.reorderLevel)) ? Number(data.reorderLevel) : 0,
    unitCost: Number.isFinite(Number(data.unitCost)) ? Number(data.unitCost) : 0,
    conversionQty: data.conversionQty === null || data.conversionQty === undefined || data.conversionQty === '' ? null : Number(data.conversionQty)
  };

  if (normalized.conversionQty !== null && (!Number.isFinite(normalized.conversionQty) || normalized.conversionQty <= 0)) {
    normalized.conversionQty = null;
  }

  return normalized;
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
    const items = db.prepare('SELECT * FROM items WHERE category_id = ? ORDER BY id').all(categoryId);
    items.forEach((item) => ensureDefaultRecipeForItem(item.id, item.name));
    return items;
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
        'INSERT INTO orders (timestamp, items, total, payment_method, payment_status, order_type, note, customer_phone, customer_address, inventory_applied, inventory_restored) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
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
        0,
        0
      );
      const orderId = result.lastInsertRowid;

      if (shouldDeduct) {
        const shortages = validateInventoryAvailability(items || []);
        if (shortages.length) {
          lowStock = shortages.map((it) => ({
            id: it.id,
            name: it.name,
            unit: it.unit,
            current_qty: it.current_qty,
            reorder_level: it.reorder_level
          }));
          return orderId;
        }
        db.prepare('UPDATE orders SET inventory_applied = 1 WHERE order_id = ?').run(orderId);
        lowStock = applyInventoryDelta(items, -1, { orderId, reason: 'SALE', note: `Order #${orderId}` });
      }
      return orderId;
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
    ensureDefaultRecipeForItem(result.lastInsertRowid, name);
    backupDb();
    return { id: result.lastInsertRowid, name, price, category_id: categoryId, description: description || null };
  });

  ipcMain.handle('menu:deleteItem', (_event, itemId) => {
    db.transaction(() => {
      db.prepare('DELETE FROM recipes WHERE item_id = ?').run(itemId);
      db.prepare('DELETE FROM items WHERE id = ?').run(itemId);
    })();
    backupDb();
    return { deleted: true };
  });

  ipcMain.handle('menu:getRecipe', (_event, itemId) => {
    const item = db.prepare('SELECT name FROM items WHERE id = ?').get(itemId);
    if (item) {
      ensureDefaultRecipeForItem(itemId, item.name);
    }
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
    const order = db.prepare('SELECT items, inventory_applied, inventory_restored FROM orders WHERE order_id = ?').get(orderId);
    if (order && order.inventory_applied && !order.inventory_restored) {
      applyInventoryDelta(JSON.parse(order.items || '[]'), 1, { orderId, reason: 'CANCELLED', note: `Order #${orderId} deleted` });
      db.prepare('UPDATE orders SET inventory_restored = 1 WHERE order_id = ?').run(orderId);
    }
    db.prepare('DELETE FROM orders WHERE order_id = ?').run(orderId);
    backupDb();
    return { deleted: true };
  });

  ipcMain.handle('orders:update', (_event, payload) => {
    const { orderId, paymentMethod, paymentStatus, orderType, note, customerPhone, customerAddress } = payload;
    const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId);
    if (!order) return { updated: false };

    const nextStatus = paymentStatus || order.payment_status;
    const items = JSON.parse(order.items || '[]');

    db.transaction(() => {
      if (nextStatus === 'Paid' && !order.inventory_applied) {
        const shortages = validateInventoryAvailability(items);
        if (shortages.length) {
          db.prepare(
            `UPDATE orders SET payment_method = ?, payment_status = ?, order_type = ?, note = ?, customer_phone = ?, customer_address = ?
             WHERE order_id = ?`
          ).run(paymentMethod, nextStatus, orderType, note || null, customerPhone || null, customerAddress || null, orderId);
          return;
        }
        applyInventoryDelta(items, -1, { orderId, reason: 'SALE', note: `Order #${orderId} marked paid` });
        db.prepare('UPDATE orders SET inventory_applied = 1, inventory_restored = 0 WHERE order_id = ?').run(orderId);
      }

      if ((nextStatus === 'Refunded' || nextStatus === 'Cancelled') && order.inventory_applied && !order.inventory_restored) {
        applyInventoryDelta(items, 1, { orderId, reason: 'REFUND', note: `Order #${orderId} ${nextStatus}` });
        db.prepare('UPDATE orders SET inventory_restored = 1 WHERE order_id = ?').run(orderId);
      }

      db.prepare(
        `UPDATE orders SET payment_method = ?, payment_status = ?, order_type = ?, note = ?, customer_phone = ?, customer_address = ?
         WHERE order_id = ?`
      ).run(paymentMethod, nextStatus, orderType, note || null, customerPhone || null, customerAddress || null, orderId);
    })();

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

  ipcMain.handle('inventory:getCategories', () => {
    return db.prepare('SELECT * FROM inventory_categories ORDER BY sort_order, name').all();
  });

  ipcMain.handle('inventory:addCategory', (_event, name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) throw new Error('Category name required');
    const existing = db.prepare('SELECT id FROM inventory_categories WHERE name = ?').get(trimmed);
    if (existing) return existing;
    const maxOrder = db.prepare('SELECT MAX(sort_order) AS m FROM inventory_categories').get().m || 0;
    const result = db.prepare('INSERT INTO inventory_categories (name, sort_order) VALUES (?, ?)').run(trimmed, maxOrder + 1);
    backupDb();
    return db.prepare('SELECT * FROM inventory_categories WHERE id = ?').get(result.lastInsertRowid);
  });

  ipcMain.handle('inventory:getAll', () => {
    return db.prepare(
      `SELECT i.*, ic.name AS category_name
       FROM inventory i
       LEFT JOIN inventory_categories ic ON ic.id = i.category_id
       ORDER BY i.name`
    ).all();
  });

  ipcMain.handle('inventory:getHistory', (_event, inventoryId) => {
    return db.prepare(
      `SELECT t.*, i.name AS inventory_name
       FROM inventory_transactions t
       JOIN inventory i ON i.id = t.inventory_id
       WHERE t.inventory_id = ?
       ORDER BY t.id DESC`
    ).all(inventoryId);
  });

  ipcMain.handle('inventory:adjust', (_event, { id, deltaQty, reason, note }) => {
    const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    if (!item) throw new Error('Inventory item not found');
    const delta = Number(deltaQty || 0);
    if (!Number.isFinite(delta)) throw new Error('Enter a valid stock adjustment.');

    db.transaction(() => {
      db.prepare('UPDATE inventory SET current_qty = current_qty + ? WHERE id = ?').run(delta, id);
      addInventoryTransaction(id, delta, (reason || 'ADJUSTMENT').toUpperCase(), note || null, null);
    })();

    const saved = db.prepare('SELECT current_qty FROM inventory WHERE id = ?').get(id);
    backupDb();
    return { updated: true, currentQty: saved ? saved.current_qty : 0 };
  });

  ipcMain.handle('inventory:add', (_event, payload) => {
    const normalized = normalizeInventoryInput(payload);
    const stmt = db.prepare(
      'INSERT INTO inventory (name, category_id, unit, current_qty, reorder_level, unit_cost, conversion_qty) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      normalized.name,
      normalized.categoryId,
      normalized.unit || '',
      normalized.currentQty,
      normalized.reorderLevel,
      normalized.unitCost,
      normalized.conversionQty
    );
    backupDb();
    return { id: result.lastInsertRowid, ...normalized };
  });

  ipcMain.handle('inventory:update', (_event, payload) => {
    const normalized = normalizeInventoryInput(payload);
    if (!payload || !payload.id) throw new Error('Inventory item id is required');

    db.prepare(
      'UPDATE inventory SET name = ?, category_id = ?, unit = ?, current_qty = ?, reorder_level = ?, unit_cost = ?, conversion_qty = ? WHERE id = ?'
    ).run(
      normalized.name,
      normalized.categoryId,
      normalized.unit || '',
      normalized.currentQty,
      normalized.reorderLevel,
      normalized.unitCost,
      normalized.conversionQty,
      payload.id
    );

    const saved = db.prepare('SELECT * FROM inventory WHERE id = ?').get(payload.id);
    backupDb();
    return { updated: true, item: saved };
  });

  ipcMain.handle('inventory:delete', (_event, id) => {
    db.transaction(() => {
      db.prepare('DELETE FROM recipes WHERE ingredient_id = ?').run(id);
      db.prepare('DELETE FROM inventory_transactions WHERE inventory_id = ?').run(id);
      db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
    })();
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
