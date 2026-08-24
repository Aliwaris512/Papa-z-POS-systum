const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getCategories: () => ipcRenderer.invoke('menu:getCategories'),
  addCategory: (name) => ipcRenderer.invoke('menu:addCategory', name),
  getItemsByCategory: (categoryId) => ipcRenderer.invoke('menu:getItemsByCategory', categoryId),
  addItem: (item) => ipcRenderer.invoke('menu:addItem', item),
  deleteItem: (itemId) => ipcRenderer.invoke('menu:deleteItem', itemId),
  getRecipe: (itemId) => ipcRenderer.invoke('menu:getRecipe', itemId),
  saveRecipe: (payload) => ipcRenderer.invoke('menu:saveRecipe', payload),
  saveOrder: (order) => ipcRenderer.invoke('orders:save', order),
  printReceipt: (heightMm) => ipcRenderer.invoke('app:printReceipt', heightMm),
  getPrinters: () => ipcRenderer.invoke('app:getPrinters'),
  getOrders: () => ipcRenderer.invoke('orders:getAll'),
  deleteOrder: (orderId) => ipcRenderer.invoke('orders:delete', orderId),
  updateOrder: (payload) => ipcRenderer.invoke('orders:update', payload),
  exportOrdersCsv: (range) => ipcRenderer.invoke('orders:exportCsv', range),
  getInventory: () => ipcRenderer.invoke('inventory:getAll'),
  addInventoryItem: (item) => ipcRenderer.invoke('inventory:add', item),
  updateInventoryItem: (item) => ipcRenderer.invoke('inventory:update', item),
  deleteInventoryItem: (id) => ipcRenderer.invoke('inventory:delete', id),
  exportInventoryCsv: () => ipcRenderer.invoke('inventory:exportCsv')
});
