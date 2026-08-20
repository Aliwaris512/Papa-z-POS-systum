const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getCategories: () => ipcRenderer.invoke('menu:getCategories'),
  getItemsByCategory: (categoryId) => ipcRenderer.invoke('menu:getItemsByCategory', categoryId),
  addItem: (item) => ipcRenderer.invoke('menu:addItem', item),
  deleteItem: (itemId) => ipcRenderer.invoke('menu:deleteItem', itemId),
  saveOrder: (order) => ipcRenderer.invoke('orders:save', order),
  printReceipt: () => ipcRenderer.invoke('app:printReceipt'),
  getOrders: () => ipcRenderer.invoke('orders:getAll'),
  deleteOrder: (orderId) => ipcRenderer.invoke('orders:delete', orderId),
  exportOrdersCsv: (range) => ipcRenderer.invoke('orders:exportCsv', range),
  getInventory: () => ipcRenderer.invoke('inventory:getAll'),
  addInventoryItem: (item) => ipcRenderer.invoke('inventory:add', item),
  updateInventoryItem: (item) => ipcRenderer.invoke('inventory:update', item),
  deleteInventoryItem: (id) => ipcRenderer.invoke('inventory:delete', id),
  exportInventoryCsv: () => ipcRenderer.invoke('inventory:exportCsv')
});
