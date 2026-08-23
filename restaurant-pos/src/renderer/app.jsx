const { useState, useEffect } = React;

function Sidebar({ categories, selectedId, onSelect }) {
  return (
    <div className="sidebar">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={
            "cat-tab" +
            (cat.name === 'Big Offers' ? " cat-tab-offer" : "") +
            (cat.id === selectedId ? " active" : "")
          }
          onClick={() => onSelect(cat.id)}
        >
          {cat.name === 'Big Offers' ? '🔥 Big Offers' : cat.name}
        </button>
      ))}
    </div>
  );
}

function ItemCard({ item, onAdd, onDelete, onEditRecipe }) {
  const sizes = item.sizes ? JSON.parse(item.sizes) : null;
  const sizeKeys = sizes ? Object.keys(sizes) : [];
  const [selectedSize, setSelectedSize] = useState(sizeKeys[0] || null);

  const displayPrice = sizes ? sizes[selectedSize] : item.price;

  function handleAdd(e) {
    e.stopPropagation();
    if (sizes) {
      onAdd({ ...item, name: `${item.name} (${selectedSize})`, price: sizes[selectedSize], id: `${item.id}-${selectedSize}`, menuItemId: item.id });
    } else {
      onAdd({ ...item, menuItemId: item.id });
    }
  }

  return (
    <div className="item-card" onClick={sizes ? undefined : handleAdd}>
      <button
        className="delete-item-btn"
        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
      >
        &times;
      </button>
      <button
        className="recipe-item-btn"
        onClick={(e) => { e.stopPropagation(); onEditRecipe(item); }}
      >
        Recipe
      </button>
      <div className="item-name">{item.name}</div>
      {item.description && <div className="item-desc">{item.description}</div>}
      {sizes && (
        <div className="size-options">
          {sizeKeys.map((s) => (
            <button
              key={s}
              className={"size-btn" + (s === selectedSize ? " active" : "")}
              onClick={(e) => { e.stopPropagation(); setSelectedSize(s); }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="item-card-footer">
        <div className="item-price">Rs. {displayPrice}</div>
        {sizes && <button className="add-btn" onClick={handleAdd}>Add</button>}
      </div>
    </div>
  );
}

function ItemGrid({ items, onAdd, onDelete, onEditRecipe }) {
  if (!items.length) {
    return <div className="empty-state">No items in this category.</div>;
  }
  return (
    <div className="item-grid">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onAdd={onAdd} onDelete={onDelete} onEditRecipe={onEditRecipe} />
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

function AddOnModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
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
    onSave({ name: trimmedName, price: numPrice });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">Add Custom Item</div>
        <div className="modal-body">
          <label className="modal-label">Name</label>
          <input
            type="text"
            className="modal-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            autoFocus
          />
          <label className="modal-label">Price (Rs.)</label>
          <input
            type="number"
            className="modal-input"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
          />
          {error && <div className="modal-error">{error}</div>}
        </div>
        <div className="modal-actions">
          <button className="back-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-btn" onClick={handleSave}>Add to Order</button>
        </div>
      </div>
    </div>
  );
}

const ADMIN_PASSWORD = 'Admin@512';

function PasswordModal({ message, onClose, onConfirm }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleConfirm() {
    if (password !== ADMIN_PASSWORD) {
      setError('Wrong password.');
      return;
    }
    onConfirm();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">Admin Password Required</div>
        <div className="modal-body">
          <div className="modal-label">{message}</div>
          <input
            type="password"
            className="modal-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
          />
          {error && <div className="modal-error">{error}</div>}
        </div>
        <div className="modal-actions">
          <button className="back-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-btn" onClick={handleConfirm}>Confirm Delete</button>
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

function CartPanel({ cart, onInc, onDec, onRemove, onClear, onCheckout, onAddOn }) {
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
        <button className="addon-btn" onClick={onAddOn}>+ Add Custom Item</button>
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
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [orderType, setOrderType] = useState('Dine-in');
  const [note, setNote] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const grandTotal = cart.reduce((sum, l) => sum + l.price * l.qty, 0);

  const canConfirm = paymentMethod && paymentStatus && (orderType !== 'Delivery' || (customerPhone.trim() && customerAddress.trim()));

  function handleConfirm() {
    onConfirm({
      paymentMethod,
      paymentStatus,
      orderType,
      note: note.trim(),
      customerPhone: orderType === 'Delivery' ? customerPhone.trim() : '',
      customerAddress: orderType === 'Delivery' ? customerAddress.trim() : ''
    });
  }

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
          <div className="payment-label">Order Type</div>
          <div className="payment-options">
            <button
              className={"payment-btn" + (orderType === 'Dine-in' ? ' active' : '')}
              onClick={() => setOrderType('Dine-in')}
            >
              Dine-in
            </button>
            <button
              className={"payment-btn" + (orderType === 'Takeaway' ? ' active' : '')}
              onClick={() => setOrderType('Takeaway')}
            >
              Takeaway
            </button>
            <button
              className={"payment-btn" + (orderType === 'Delivery' ? ' active' : '')}
              onClick={() => setOrderType('Delivery')}
            >
              Delivery
            </button>
          </div>
        </div>

        {orderType === 'Delivery' && (
          <div className="payment-section">
            <div className="payment-label">Delivery Details</div>
            <input
              type="text"
              className="modal-input"
              placeholder="Customer phone number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
            <input
              type="text"
              className="modal-input"
              placeholder="Delivery address"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
            />
          </div>
        )}

        <div className="payment-section">
          <div className="payment-label">Note (optional)</div>
          <textarea
            className="modal-input checkout-note"
            placeholder="e.g. no onions, extra spicy..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
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

        <div className="payment-section">
          <div className="payment-label">Bill Status</div>
          <div className="payment-options">
            <button
              className={"payment-btn" + (paymentStatus === 'Paid' ? ' active' : '')}
              onClick={() => setPaymentStatus('Paid')}
            >
              Paid
            </button>
            <button
              className={"payment-btn" + (paymentStatus === 'Pending' ? ' active' : '')}
              onClick={() => setPaymentStatus('Pending')}
            >
              Pending
            </button>
          </div>
        </div>

        <div className="checkout-actions">
          <button className="back-btn" onClick={onBack}>Back</button>
          <button
            className="confirm-btn"
            disabled={!canConfirm}
            onClick={handleConfirm}
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
          {order.orderType && <div>Order Type: {order.orderType}</div>}
        </div>
        {order.orderType === 'Delivery' && (order.customerPhone || order.customerAddress) && (
          <>
            <div className="receipt-divider" />
            <div className="receipt-meta">
              {order.customerPhone && <div>Phone: {order.customerPhone}</div>}
              {order.customerAddress && <div>Address: {order.customerAddress}</div>}
            </div>
          </>
        )}
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
        {order.paymentStatus && (
          <div className={"receipt-row" + (order.paymentStatus === 'Pending' ? ' receipt-status-pending' : '')}>
            <span>Bill Status</span>
            <span>{order.paymentStatus}</span>
          </div>
        )}
        {order.note && (
          <>
            <div className="receipt-divider" />
            <div className="receipt-note">Note: {order.note}</div>
          </>
        )}
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

function InventoryItemModal({ item, onClose, onSave }) {
  const [name, setName] = useState(item ? item.name : '');
  const [unit, setUnit] = useState(item ? item.unit : '');
  const [currentQty, setCurrentQty] = useState(item ? String(item.current_qty) : '');
  const [reorderLevel, setReorderLevel] = useState(item ? String(item.reorder_level) : '');
  const [unitCost, setUnitCost] = useState(item ? String(item.unit_cost) : '');
  const [error, setError] = useState('');

  function handleSave() {
    const trimmedName = name.trim();
    const qty = Number(currentQty);
    const reorder = Number(reorderLevel);
    const cost = Number(unitCost);
    if (!trimmedName) {
      setError('Enter item name.');
      return;
    }
    if (currentQty === '' || isNaN(qty) || qty < 0) {
      setError('Enter valid current quantity.');
      return;
    }
    if (reorderLevel === '' || isNaN(reorder) || reorder < 0) {
      setError('Enter valid reorder level.');
      return;
    }
    if (unitCost === '' || isNaN(cost) || cost < 0) {
      setError('Enter valid unit cost.');
      return;
    }
    onSave({
      id: item ? item.id : undefined,
      name: trimmedName,
      unit: unit.trim(),
      currentQty: qty,
      reorderLevel: reorder,
      unitCost: cost
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">{item ? 'Edit Stock Item' : 'Add Stock Item'}</div>
        <div className="modal-body">
          <label className="modal-label">Name</label>
          <input
            type="text"
            className="modal-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chicken Breast"
            autoFocus
          />
          <label className="modal-label">Unit</label>
          <input
            type="text"
            className="modal-input"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. kg, pcs, litre"
          />
          <label className="modal-label">Current Quantity</label>
          <input
            type="number"
            className="modal-input"
            value={currentQty}
            onChange={(e) => setCurrentQty(e.target.value)}
            placeholder="0"
          />
          <label className="modal-label">Reorder Level (min qty to keep in stock)</label>
          <input
            type="number"
            className="modal-input"
            value={reorderLevel}
            onChange={(e) => setReorderLevel(e.target.value)}
            placeholder="0"
          />
          <label className="modal-label">Unit Cost (Rs.)</label>
          <input
            type="number"
            className="modal-input"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            placeholder="0"
          />
          {error && <div className="modal-error">{error}</div>}
        </div>
        <div className="modal-actions">
          <button className="back-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

function RecipeModal({ item, inventory, recipe, onClose, onSave }) {
  const initialQtys = {};
  recipe.forEach((r) => { initialQtys[r.ingredient_id] = String(r.qty_per_unit); });
  const [qtys, setQtys] = useState(initialQtys);

  function setQty(ingredientId, val) {
    setQtys((prev) => ({ ...prev, [ingredientId]: val }));
  }

  function handleSave() {
    const ingredients = Object.entries(qtys)
      .map(([ingredientId, val]) => ({ ingredientId: Number(ingredientId), qtyPerUnit: Number(val) }))
      .filter((ing) => !isNaN(ing.qtyPerUnit) && ing.qtyPerUnit > 0);
    onSave({ itemId: item.id, ingredients });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">Recipe: {item.name}</div>
        <div className="modal-body">
          {inventory.length === 0 && <div className="empty-state">Add stock items in Inventory first.</div>}
          {inventory.map((inv) => (
            <div key={inv.id} className="recipe-row">
              <span className="recipe-row-name">{inv.name} <span className="recipe-row-unit">({inv.unit})</span></span>
              <input
                type="number"
                className="modal-input recipe-row-input"
                value={qtys[inv.id] || ''}
                onChange={(e) => setQty(inv.id, e.target.value)}
                placeholder="0"
                min="0"
                step="any"
              />
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="back-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-btn" onClick={handleSave}>Save Recipe</button>
        </div>
      </div>
    </div>
  );
}

function InventoryView({ items, onBack, onAdd, onEdit, onDelete, onExport, exportMsg }) {
  const toBuy = items
    .map((it) => ({ ...it, buyQty: Math.max(it.reorder_level - it.current_qty, 0) }))
    .filter((it) => it.buyQty > 0);
  const totalBuyCost = toBuy.reduce((sum, it) => sum + it.buyQty * it.unit_cost, 0);

  return (
    <div className="history-screen">
      <div className="history-card">
        <div className="history-topbar">
          <div className="history-header">Inventory</div>
          <div className="history-topbar-actions">
            <button className="export-btn" onClick={onAdd}>+ Add Stock Item</button>
            <button className="export-btn" onClick={onExport}>Download CSV</button>
            <button className="back-btn" onClick={onBack}>Back to Menu</button>
          </div>
        </div>

        {exportMsg && <div className="export-msg">{exportMsg}</div>}

        {toBuy.length > 0 && (
          <div className="export-msg">
            {toBuy.length} item{toBuy.length === 1 ? '' : 's'} need restock &middot; Est. cost Rs. {totalBuyCost.toFixed(2)}
          </div>
        )}

        <div className="history-list">
          <div className="history-row history-row-head">
            <span className="hc-id">Item</span>
            <span className="hc-date">Current / Reorder</span>
            <span className="hc-total">Buy Qty</span>
            <span className="hc-pay">Buy Cost</span>
            <span className="hc-actions"></span>
          </div>
          {items.length === 0 && <div className="empty-state">No stock items yet. Add one above.</div>}
          {items.map((it) => {
            const buyQty = Math.max(it.reorder_level - it.current_qty, 0);
            const buyCost = buyQty * it.unit_cost;
            const low = buyQty > 0;
            return (
              <div
                key={it.id}
                className={"history-row history-row-item" + (low ? " low-stock" : "")}
                onClick={() => onEdit(it)}
              >
                <span className="hc-id">{it.name}</span>
                <span className="hc-date">{it.current_qty} {it.unit} / {it.reorder_level} {it.unit}</span>
                <span className="hc-total">{low ? `${buyQty} ${it.unit}` : '-'}</span>
                <span className="hc-pay">{low ? `Rs. ${buyCost.toFixed(2)}` : '-'}</span>
                <span className="hc-actions">
                  <button
                    className="delete-order-btn"
                    onClick={(e) => { e.stopPropagation(); onDelete(it.id); }}
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
  const [showAddOn, setShowAddOn] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [showInventoryItem, setShowInventoryItem] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);
  const [inventoryExportMsg, setInventoryExportMsg] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [recipeItem, setRecipeItem] = useState(null);
  const [recipeRows, setRecipeRows] = useState([]);
  const [lowStockAlert, setLowStockAlert] = useState([]);

  function requestAdminDelete(message, action) {
    setPendingDelete({ message, action });
  }

  useEffect(() => {
    window.api.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length) setSelectedId(cats[0].id);
    });
    window.api.getInventory().then(setInventory);
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
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1, menuItemId: item.menuItemId }];
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

  function addOnToCart({ name, price }) {
    setCart((prev) => [...prev, { id: `addon-${Date.now()}`, name, price, qty: 1 }]);
    setShowAddOn(false);
  }

  async function confirmOrder({ paymentMethod, paymentStatus, orderType, note, customerPhone, customerAddress }) {
    const grandTotal = cart.reduce((sum, l) => sum + l.price * l.qty, 0);
    const lineItems = cart.map((l) => ({ id: l.id, name: l.name, price: l.price, qty: l.qty, menuItemId: l.menuItemId }));
    const result = await window.api.saveOrder({
      items: lineItems,
      total: grandTotal,
      paymentMethod,
      paymentStatus,
      orderType,
      note,
      customerPhone,
      customerAddress
    });
    if (result.lowStock && result.lowStock.length) {
      setLowStockAlert(result.lowStock);
      window.api.getInventory().then(setInventory);
    }
    setLastOrder({
      orderId: result.orderId,
      timestamp: result.timestamp,
      items: lineItems,
      total: grandTotal,
      paymentMethod,
      paymentStatus,
      orderType,
      note,
      customerPhone,
      customerAddress
    });
    setCart([]);
    setView('receipt');
  }

  function deleteItem(itemId) {
    requestAdminDelete('Delete this menu item?', async () => {
      await window.api.deleteItem(itemId);
      window.api.getItemsByCategory(selectedId).then(setItems);
    });
  }

  function openRecipeModal(item) {
    window.api.getRecipe(item.id).then((rows) => {
      setRecipeRows(rows);
      setRecipeItem(item);
    });
  }

  async function saveItemRecipe({ itemId, ingredients }) {
    await window.api.saveRecipe({ itemId, ingredients });
    setRecipeItem(null);
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
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      orderType: row.order_type,
      note: row.note,
      customerPhone: row.customer_phone,
      customerAddress: row.customer_address
    });
    setFromHistory(true);
    setView('receipt');
  }

  function deleteOrder(orderId) {
    requestAdminDelete(`Delete order #${orderId}? This cannot be undone.`, async () => {
      await window.api.deleteOrder(orderId);
      const rows = await window.api.getOrders();
      setOrders(rows);
      window.api.getInventory().then(setInventory);
    });
  }

  async function openInventory() {
    const rows = await window.api.getInventory();
    setInventory(rows);
    setInventoryExportMsg('');
    setView('inventory');
  }

  async function exportInventoryCsv() {
    const result = await window.api.exportInventoryCsv();
    if (result.canceled) return;
    setInventoryExportMsg(`Exported ${result.count} item${result.count === 1 ? '' : 's'} to ${result.filePath}`);
  }

  function openAddInventoryItem() {
    setEditingInventoryItem(null);
    setShowInventoryItem(true);
  }

  function openEditInventoryItem(item) {
    setEditingInventoryItem(item);
    setShowInventoryItem(true);
  }

  async function saveInventoryItem(payload) {
    if (payload.id) {
      await window.api.updateInventoryItem(payload);
    } else {
      await window.api.addInventoryItem(payload);
    }
    const rows = await window.api.getInventory();
    setInventory(rows);
    setShowInventoryItem(false);
    setEditingInventoryItem(null);
  }

  function deleteInventoryItem(id) {
    requestAdminDelete('Delete this stock item?', async () => {
      await window.api.deleteInventoryItem(id);
      const rows = await window.api.getInventory();
      setInventory(rows);
    });
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
  } else if (view === 'inventory') {
    content = (
      <>
        <InventoryView
          items={inventory}
          onBack={() => setView('menu')}
          onAdd={openAddInventoryItem}
          onEdit={openEditInventoryItem}
          onDelete={deleteInventoryItem}
          onExport={exportInventoryCsv}
          exportMsg={inventoryExportMsg}
        />
        {showInventoryItem && (
          <InventoryItemModal
            item={editingInventoryItem}
            onClose={() => { setShowInventoryItem(false); setEditingInventoryItem(null); }}
            onSave={saveInventoryItem}
          />
        )}
      </>
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
              <button className="history-nav-btn" onClick={openInventory}>Inventory</button>
              <button className="history-nav-btn" onClick={openHistory}>Order History</button>
            </div>
          </div>
          <ItemGrid items={items} onAdd={addToCart} onDelete={deleteItem} onEditRecipe={openRecipeModal} />
        </div>
        <CartPanel
          cart={cart}
          onInc={incLine}
          onDec={decLine}
          onRemove={removeLine}
          onClear={clearOrder}
          onCheckout={() => setView('checkout')}
          onAddOn={() => setShowAddOn(true)}
        />
        {showAddItem && (
          <AddItemModal
            categories={categories}
            defaultCategoryId={selectedId}
            onClose={() => setShowAddItem(false)}
            onSave={saveNewItem}
          />
        )}
        {showAddOn && (
          <AddOnModal
            onClose={() => setShowAddOn(false)}
            onSave={addOnToCart}
          />
        )}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />
      {content}
      {pendingDelete && (
        <PasswordModal
          message={pendingDelete.message}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            pendingDelete.action();
            setPendingDelete(null);
          }}
        />
      )}
      {recipeItem && (
        <RecipeModal
          item={recipeItem}
          inventory={inventory}
          recipe={recipeRows}
          onClose={() => setRecipeItem(null)}
          onSave={saveItemRecipe}
        />
      )}
      {lowStockAlert.length > 0 && (
        <div className="modal-overlay" onClick={() => setLowStockAlert([])}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">Low Stock Alert</div>
            <div className="modal-body">
              {lowStockAlert.map((it) => (
                <div key={it.id} className="recipe-row">
                  <span className="recipe-row-name">{it.name}</span>
                  <span>{it.current_qty} {it.unit} left (min {it.reorder_level})</span>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={() => setLowStockAlert([])}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
