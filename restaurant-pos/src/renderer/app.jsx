const { useState, useEffect } = React;

function Sidebar({ categories, selectedId, onSelect }) {
  return (
    <div className="sidebar">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={"cat-tab" + (cat.id === selectedId ? " active" : "")}
          onClick={() => onSelect(cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

function ItemCard({ item, onAdd, onDelete }) {
  return (
    <div className="item-card" onClick={() => onAdd(item)}>
      <button
        className="delete-item-btn"
        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
      >
        &times;
      </button>
      <div className="item-name">{item.name}</div>
      {item.description && <div className="item-desc">{item.description}</div>}
      <div className="item-price">Rs. {item.price}</div>
    </div>
  );
}

function ItemGrid({ items, onAdd, onDelete }) {
  if (!items.length) {
    return <div className="empty-state">No items in this category.</div>;
  }
  return (
    <div className="item-grid">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onAdd={onAdd} onDelete={onDelete} />
      ))}
    </div>
  );
}

function AddItemModal({ categories, defaultCategoryId, onClose, onSave }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [error, setError] = useState('');

  function handleSave() {
    const trimmedName = name.trim();
    const numPrice = Number(price);
    if (!trimmedName) {
      setError('Enter item name.');
      return;
    }
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      setError('Enter valid price.');
      return;
    }
    if (!categoryId) {
      setError('Select category.');
      return;
    }
    onSave({ name: trimmedName, price: numPrice, categoryId });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">Add New Item</div>
        <div className="modal-body">
          <label className="modal-label">Name</label>
          <input
            type="text"
            className="modal-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
          />
          <label className="modal-label">Price (Rs.)</label>
          <input
            type="number"
            className="modal-input"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
          />
          <label className="modal-label">Category</label>
          <select
            className="modal-input"
            value={categoryId || ''}
            onChange={(e) => setCategoryId(Number(e.target.value))}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {error && <div className="modal-error">{error}</div>}
        </div>
        <div className="modal-actions">
          <button className="back-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-btn" onClick={handleSave}>Save Item</button>
        </div>
      </div>
    </div>
  );
}

function CartLine({ line, onInc, onDec, onRemove }) {
  return (
    <div className="cart-line">
      <div className="cart-line-info">
        <div className="cart-line-name">{line.name}</div>
        <div className="cart-line-unit">Rs. {line.price} each</div>
      </div>
      <div className="cart-line-controls">
        <button className="qty-btn" onClick={() => onDec(line.id)}>-</button>
        <span className="qty-val">{line.qty}</span>
        <button className="qty-btn" onClick={() => onInc(line.id)}>+</button>
      </div>
      <div className="cart-line-total">Rs. {line.price * line.qty}</div>
      <button className="remove-btn" onClick={() => onRemove(line.id)}>&times;</button>
    </div>
  );
}

function CartPanel({ cart, onInc, onDec, onRemove, onClear, onCheckout }) {
  const grandTotal = cart.reduce((sum, l) => sum + l.price * l.qty, 0);

  return (
    <div className="cart-panel">
      <div className="cart-header">Order</div>
      <div className="cart-lines">
        {cart.length === 0 && <div className="empty-state">Cart empty. Tap items to add.</div>}
        {cart.map((line) => (
          <CartLine key={line.id} line={line} onInc={onInc} onDec={onDec} onRemove={onRemove} />
        ))}
      </div>
      <div className="cart-footer">
        <div className="cart-total-row">
          <span>Total</span>
          <span>Rs. {grandTotal}</span>
        </div>
        <button className="checkout-btn" onClick={onCheckout} disabled={cart.length === 0}>
          Checkout
        </button>
        <button className="clear-btn" onClick={onClear} disabled={cart.length === 0}>
          Clear Order
        </button>
      </div>
    </div>
  );
}

function CheckoutView({ cart, onBack, onConfirm }) {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const grandTotal = cart.reduce((sum, l) => sum + l.price * l.qty, 0);

  return (
    <div className="checkout-view">
      <div className="checkout-card">
        <div className="checkout-header">Confirm Order</div>

        <div className="checkout-lines">
          {cart.map((line) => (
            <div key={line.id} className="checkout-line">
              <span className="checkout-line-name">
                {line.name} <span className="checkout-line-qty">x{line.qty}</span>
              </span>
              <span className="checkout-line-total">Rs. {line.price * line.qty}</span>
            </div>
          ))}
        </div>

        <div className="checkout-total-row">
          <span>Grand Total</span>
          <span>Rs. {grandTotal}</span>
        </div>

        <div className="payment-section">
          <div className="payment-label">Payment Method</div>
          <div className="payment-options">
            <button
              className={"payment-btn" + (paymentMethod === 'Cash' ? ' active' : '')}
              onClick={() => setPaymentMethod('Cash')}
            >
              Cash
            </button>
            <button
              className={"payment-btn" + (paymentMethod === 'Card' ? ' active' : '')}
              onClick={() => setPaymentMethod('Card')}
            >
              Card
            </button>
          </div>
        </div>

        <div className="checkout-actions">
          <button className="back-btn" onClick={onBack}>Back</button>
          <button
            className="confirm-btn"
            disabled={!paymentMethod}
            onClick={() => onConfirm(paymentMethod)}
          >
            Confirm & Generate Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

const RESTAURANT_NAME = "Papa'Zzz Shawarma & Pizza";
const LOGO_PATH = './assets/icon.png';
const DEV_CONTACT = 'Developed by Ali Waris — 0309-4501187 — aliwarisdev.co.uk';

function Header() {
  return (
    <div className="app-header">
      <img src={LOGO_PATH} alt="logo" className="app-logo" />
      <div className="app-title-group">
        <div className="app-title">{RESTAURANT_NAME}</div>
        <div className="app-dev-contact">{DEV_CONTACT}</div>
      </div>
    </div>
  );
}

function ReceiptView({ order, onNewOrder, fromHistory, onBackToHistory }) {
  const dt = new Date(order.timestamp);
  const dateStr = dt.toLocaleDateString();
  const timeStr = dt.toLocaleTimeString();

  return (
    <div className="receipt-screen">
      <div className="receipt-paper">
        <img src={LOGO_PATH} alt="logo" className="receipt-logo" />
        <div className="receipt-restaurant">{RESTAURANT_NAME}</div>
        <div className="receipt-meta">
          <div>Order #{order.orderId}</div>
          <div>{dateStr} {timeStr}</div>
        </div>
        <div className="receipt-divider" />
        <div className="receipt-items">
          <div className="receipt-row receipt-col-head">
            <span className="col-name">Item</span>
            <span className="col-qty">Qty</span>
            <span className="col-price">Price</span>
            <span className="col-total">Total</span>
          </div>
          {order.items.map((line) => (
            <div key={line.id} className="receipt-row">
              <span className="col-name">{line.name}</span>
              <span className="col-qty">{line.qty}</span>
              <span className="col-price">{line.price}</span>
              <span className="col-total">{line.price * line.qty}</span>
            </div>
          ))}
        </div>
        <div className="receipt-divider" />
        <div className="receipt-row receipt-total-row">
          <span>Grand Total</span>
          <span>Rs. {order.total}</span>
        </div>
        <div className="receipt-row">
          <span>Payment Method</span>
          <span>{order.paymentMethod}</span>
        </div>
        <div className="receipt-divider" />
        <div className="receipt-thankyou">Thank you, visit again!</div>
        <div className="receipt-dev-contact">{DEV_CONTACT}</div>
      </div>

      <div className="receipt-actions no-print">
        <button className="print-btn" onClick={() => window.api.printReceipt()}>
          Print Receipt
        </button>
        {fromHistory ? (
          <button className="new-order-btn" onClick={onBackToHistory}>
            Back to History
          </button>
        ) : (
          <button className="new-order-btn" onClick={onNewOrder}>
            New Order
          </button>
        )}
      </div>
    </div>
  );
}

function toDateInputValue(d) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${day}`;
}

function rangeBounds(preset) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from;
  if (preset === 'today') {
    from = startOfToday;
  } else if (preset === 'week') {
    from = new Date(startOfToday);
    from.setDate(from.getDate() - 6);
  } else if (preset === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (preset === 'year') {
    from = new Date(now.getFullYear(), 0, 1);
  } else {
    return null;
  }
  const to = new Date(startOfToday);
  to.setDate(to.getDate() + 1);
  return { from, to };
}

function HistoryView({ orders, onSelectOrder, onExport, onDelete, onBack, exportMsg }) {
  const [preset, setPreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  let bounds = null;
  if (preset === 'custom') {
    if (customFrom && customTo) {
      const from = new Date(customFrom + 'T00:00:00');
      const to = new Date(customTo + 'T00:00:00');
      to.setDate(to.getDate() + 1);
      bounds = { from, to };
    }
  } else if (preset !== 'all') {
    bounds = rangeBounds(preset);
  }

  const filteredOrders = bounds
    ? orders.filter((o) => {
        const t = new Date(o.timestamp);
        return t >= bounds.from && t < bounds.to;
      })
    : orders;

  const filteredTotal = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  function handleExport() {
    if (bounds) {
      onExport({ from: bounds.from.toISOString(), to: new Date(bounds.to.getTime() - 1).toISOString() });
    } else {
      onExport(null);
    }
  }

  return (
    <div className="history-screen">
      <div className="history-card">
        <div className="history-topbar">
          <div className="history-header">Order History</div>
          <div className="history-topbar-actions">
            <button className="export-btn" onClick={handleExport}>Export to CSV</button>
            <button className="back-btn" onClick={onBack}>Back to Menu</button>
          </div>
        </div>

        <div className="range-bar">
          {['all', 'today', 'week', 'month', 'year', 'custom'].map((p) => (
            <button
              key={p}
              className={"range-btn" + (preset === p ? ' active' : '')}
              onClick={() => setPreset(p)}
            >
              {p === 'all' ? 'All' : p === 'week' ? 'Last 7 Days' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          {preset === 'custom' && (
            <div className="range-custom-inputs">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          )}
        </div>

        {exportMsg && <div className="export-msg">{exportMsg}</div>}

        <div className="history-summary">
          {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'} &middot; Rs. {filteredTotal} total
        </div>

        <div className="history-list">
          <div className="history-row history-row-head">
            <span className="hc-id">Order #</span>
            <span className="hc-date">Date / Time</span>
            <span className="hc-total">Total</span>
            <span className="hc-pay">Payment</span>
            <span className="hc-actions"></span>
          </div>
          {filteredOrders.length === 0 && <div className="empty-state">No orders in this range.</div>}
          {filteredOrders.map((o) => {
            const dt = new Date(o.timestamp);
            return (
              <div key={o.order_id} className="history-row history-row-item" onClick={() => onSelectOrder(o)}>
                <span className="hc-id">#{o.order_id}</span>
                <span className="hc-date">{dt.toLocaleDateString()} {dt.toLocaleTimeString()}</span>
                <span className="hc-total">Rs. {o.total}</span>
                <span className="hc-pay">{o.payment_method}</span>
                <span className="hc-actions">
                  <button
                    className="delete-order-btn"
                    onClick={(e) => { e.stopPropagation(); onDelete(o.order_id); }}
                  >
                    Delete
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [categories, setCategories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [view, setView] = useState('menu');
  const [lastOrder, setLastOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [fromHistory, setFromHistory] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);

  useEffect(() => {
    window.api.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length) setSelectedId(cats[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedId == null) return;
    window.api.getItemsByCategory(selectedId).then(setItems);
  }, [selectedId]);

  const selectedCategory = categories.find((c) => c.id === selectedId);

  function addToCart(item) {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === item.id);
      if (existing) {
        return prev.map((l) => (l.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  }

  function incLine(id) {
    setCart((prev) => prev.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)));
  }

  function decLine(id) {
    setCart((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty >= 1)
    );
  }

  function removeLine(id) {
    setCart((prev) => prev.filter((l) => l.id !== id));
  }

  function clearOrder() {
    setCart([]);
  }

  async function confirmOrder(paymentMethod) {
    const grandTotal = cart.reduce((sum, l) => sum + l.price * l.qty, 0);
    const lineItems = cart.map((l) => ({ id: l.id, name: l.name, price: l.price, qty: l.qty }));
    const result = await window.api.saveOrder({
      items: lineItems,
      total: grandTotal,
      paymentMethod
    });
    setLastOrder({
      orderId: result.orderId,
      timestamp: result.timestamp,
      items: lineItems,
      total: grandTotal,
      paymentMethod
    });
    setCart([]);
    setView('receipt');
  }

  async function deleteItem(itemId) {
    if (!window.confirm('Delete this item?')) return;
    await window.api.deleteItem(itemId);
    window.api.getItemsByCategory(selectedId).then(setItems);
  }

  async function saveNewItem({ name, price, categoryId }) {
    await window.api.addItem({ name, price, categoryId });
    if (categoryId === selectedId) {
      window.api.getItemsByCategory(selectedId).then(setItems);
    }
    setShowAddItem(false);
  }

  function startNewOrder() {
    setLastOrder(null);
    setFromHistory(false);
    setView('menu');
  }

  async function openHistory() {
    const rows = await window.api.getOrders();
    setOrders(rows);
    setExportMsg('');
    setView('history');
  }

  function selectHistoryOrder(row) {
    setLastOrder({
      orderId: row.order_id,
      timestamp: row.timestamp,
      items: JSON.parse(row.items),
      total: row.total,
      paymentMethod: row.payment_method
    });
    setFromHistory(true);
    setView('receipt');
  }

  async function deleteOrder(orderId) {
    if (!window.confirm(`Delete order #${orderId}? This cannot be undone.`)) return;
    await window.api.deleteOrder(orderId);
    const rows = await window.api.getOrders();
    setOrders(rows);
  }

  async function exportCsv(range) {
    const result = await window.api.exportOrdersCsv(range);
    if (result.canceled) return;
    setExportMsg(`Exported ${result.count} order${result.count === 1 ? '' : 's'} to ${result.filePath}`);
  }

  let content;

  if (view === 'checkout') {
    content = (
      <CheckoutView
        cart={cart}
        onBack={() => setView('menu')}
        onConfirm={confirmOrder}
      />
    );
  } else if (view === 'receipt' && lastOrder) {
    content = (
      <ReceiptView
        order={lastOrder}
        onNewOrder={startNewOrder}
        fromHistory={fromHistory}
        onBackToHistory={openHistory}
      />
    );
  } else if (view === 'history') {
    content = (
      <HistoryView
        orders={orders}
        onSelectOrder={selectHistoryOrder}
        onExport={exportCsv}
        onDelete={deleteOrder}
        onBack={() => setView('menu')}
        exportMsg={exportMsg}
      />
    );
  } else {
    content = (
      <div className="app">
        <Sidebar categories={categories} selectedId={selectedId} onSelect={setSelectedId} />
        <div className="main-panel">
          <div className="panel-header">
            <span>{selectedCategory ? selectedCategory.name : ''}</span>
            <div className="panel-header-actions">
              <button className="add-item-nav-btn" onClick={() => setShowAddItem(true)}>+ Add Item</button>
              <button className="history-nav-btn" onClick={openHistory}>Order History</button>
            </div>
          </div>
          <ItemGrid items={items} onAdd={addToCart} onDelete={deleteItem} />
        </div>
        <CartPanel
          cart={cart}
          onInc={incLine}
          onDec={decLine}
          onRemove={removeLine}
          onClear={clearOrder}
          onCheckout={() => setView('checkout')}
        />
        {showAddItem && (
          <AddItemModal
            categories={categories}
            defaultCategoryId={selectedId}
            onClose={() => setShowAddItem(false)}
            onSave={saveNewItem}
          />
        )}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />
      {content}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
