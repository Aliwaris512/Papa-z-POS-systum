const { useState, useEffect } = React;

function Sidebar({ categories, selectedId, onSelect, onAddSection }) {
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
      <button className="cat-tab cat-tab-add" onClick={onAddSection}>+ Add Section</button>
    </div>
  );
}

function AddSectionModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter section name.');
      return;
    }
    try {
      await onSave(trimmed);
    } catch (err) {
      setError(err.message || 'Could not add section.');
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">Add Section</div>
        <div className="modal-body">
          <label className="modal-label">Section Name</label>
          <input
            type="text"
            className="modal-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Wraps, Shawarma"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          />
          {error && <div className="modal-error">{error}</div>}
        </div>
        <div className="modal-actions">
          <button className="back-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-btn" onClick={handleSave}>Done</button>
        </div>
      </div>
    </div>
  );
}

function ItemCard({ item, inventory, recipeRows, onAdd, onDelete }) {
  const sizes = item.sizes ? JSON.parse(item.sizes) : null;
  const sizeKeys = sizes ? Object.keys(sizes) : [];
  const [selectedSize, setSelectedSize] = useState(sizeKeys[0] || null);

  const displayPrice = sizes ? sizes[selectedSize] : item.price;
  const isOutOfStock = (() => {
    if (!Array.isArray(inventory) || !inventory.length) return false;
    const rows = Array.isArray(recipeRows) ? recipeRows : [];
    if (!rows.length) return false;
    return rows.some((row) => {
      const ingredient = inventory.find((inv) => Number(inv.id) === Number(row.ingredient_id));
      return ingredient && Number(ingredient.current_qty) < Number(row.qty_per_unit);
    });
  })();

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
      <div className="item-name">{item.name}</div>
      {isOutOfStock && <div className="out-of-stock-badge">OUT OF STOCK</div>}
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

function ItemGrid({ items, inventory, recipeByItem, onAdd, onDelete }) {
  if (!items.length) {
    return <div className="empty-state">No items in this category.</div>;
  }
  return (
    <div className="item-grid">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          inventory={inventory}
          recipeRows={recipeByItem[item.id] || []}
          onAdd={onAdd}
          onDelete={onDelete}
        />
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
const DEV_CONTACT = 'Developed by AMAFHH Solutions — 0309-4501187';

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
  const paperRef = React.useRef(null);

  const handlePrint = async () => {
    const el = paperRef.current;
    const heightMm = el ? (el.scrollHeight / 96) * 25.4 + 10 : null;
    const result = await window.api.printReceipt(heightMm);
    if (result && result.success === false) {
      alert(result.error);
    }
  };

  return (
    <div className="receipt-screen">
      <div className="receipt-paper" ref={paperRef}>
        <img src={LOGO_PATH} alt="logo" className="receipt-logo" />
        <div className="receipt-restaurant">{RESTAURANT_NAME}</div>
        <div className="receipt-shop-contact">0326-1231238 / 0318-4533774</div>
        <div className="receipt-meta">
          <div>Order #{order.orderId}</div>
          <div>{dateStr} {timeStr}</div>
          {order.orderType && <div>Order Type: {order.orderType}</div>}
        </div>
        {order.orderType === 'Delivery' && (order.customerPhone || order.customerAddress) && (
          <>
            <div className="receipt-divider" />
            <div className="receipt-meta receipt-customer-info">
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
        <button className="print-btn" onClick={handlePrint}>
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

function EditOrderModal({ order, onClose, onSave }) {
  const [paymentMethod, setPaymentMethod] = useState(order.payment_method);
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [orderType, setOrderType] = useState(order.order_type);
  const [note, setNote] = useState(order.note || '');
  const [customerPhone, setCustomerPhone] = useState(order.customer_phone || '');
  const [customerAddress, setCustomerAddress] = useState(order.customer_address || '');

  const canSave = paymentMethod && paymentStatus && (orderType !== 'Delivery' || (customerPhone.trim() && customerAddress.trim()));

  function handleSave() {
    onSave({
      orderId: order.order_id,
      paymentMethod,
      paymentStatus,
      orderType,
      note: note.trim(),
      customerPhone: orderType === 'Delivery' ? customerPhone.trim() : '',
      customerAddress: orderType === 'Delivery' ? customerAddress.trim() : ''
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">Edit Order #{order.order_id}</div>
        <div className="modal-body">
          <div className="payment-section">
            <div className="payment-label">Order Type</div>
            <div className="payment-options">
              {['Dine-in', 'Takeaway', 'Delivery'].map((t) => (
                <button
                  key={t}
                  className={"payment-btn" + (orderType === t ? ' active' : '')}
                  onClick={() => setOrderType(t)}
                >
                  {t}
                </button>
              ))}
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
        </div>
        <div className="modal-actions">
          <button className="back-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-btn" disabled={!canSave} onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function HistoryView({ orders, onSelectOrder, onExport, onDelete, onEdit, onBack, exportMsg }) {
  const [preset, setPreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  let filteredOrders = bounds
    ? orders.filter((o) => {
        const t = new Date(o.timestamp);
        return t >= bounds.from && t < bounds.to;
      })
    : orders;

  if (statusFilter !== 'all') {
    filteredOrders = filteredOrders.filter((o) => o.payment_status === statusFilter);
  }

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

        <div className="range-bar">
          {['all', 'Paid', 'Pending'].map((s) => (
            <button
              key={s}
              className={"range-btn" + (statusFilter === s ? ' active' : '')}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All Bills' : s}
            </button>
          ))}
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
            <span className="hc-status">Status</span>
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
                <span className="hc-status">
                  <span className={"status-badge " + (o.payment_status === 'Pending' ? 'status-pending' : 'status-paid')}>
                    {o.payment_status}
                  </span>
                </span>
                <span className="hc-actions">
                  <button
                    className="edit-order-btn"
                    onClick={(e) => { e.stopPropagation(); onEdit(o); }}
                  >
                    Edit
                  </button>
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

function getInventoryDefaults(name, categoryName) {
  const text = `${name || ''} ${categoryName || ''}`.toLowerCase();
  if (/burger(?!.*bun)|burger's|burgers/.test(text)) return { unit: 'Packet', conversionQty: 4 };
  if (/burger.*bun|bun/.test(text)) return { unit: 'Packet', conversionQty: 4 };
  if (/shawarma.*bread|bread/.test(text)) return { unit: 'Packet', conversionQty: 4 };
  if (/tortilla|wrap/.test(text)) return { unit: 'Packet', conversionQty: 8 };
  if (/water/.test(text)) return { unit: 'Bottle', conversionQty: 1 };
  if (/drink|soft drink/.test(text)) return { unit: 'Bottle', conversionQty: 1 };
  return { unit: 'Pcs', conversionQty: 1 };
}

function InventoryItemModal({ item, inventoryCategories, onClose, onSave }) {
  const [name, setName] = useState(item ? item.name : '');
  const [categoryId, setCategoryId] = useState(item ? (item.category_id ?? '') : '');
  const [customCategory, setCustomCategory] = useState('');
  const [unit, setUnit] = useState(item ? item.unit : '');
  const [currentQty, setCurrentQty] = useState(item ? String(item.current_qty) : '');
  const [unitCost, setUnitCost] = useState(item ? String(item.unit_cost || 0) : '');
  const [conversionQty, setConversionQty] = useState(item ? String(item.conversion_qty || '') : '');
  const [error, setError] = useState('');

  const selectedCategoryName = inventoryCategories.find((cat) => String(cat.id) === String(categoryId))?.name || customCategory.trim();
  const burgerPacketOptions = [2, 4];
  const isBurgerPacketItem = (selectedCategoryName || name || '').toLowerCase().includes('burger') || (/burger/.test((name || '').toLowerCase()) && (unit || '').toLowerCase() === 'packet');
  const unitOptions = (() => {
    const name = (selectedCategoryName || '').toLowerCase();
    if (name.includes('water')) return ['300ml', '500ml', '1.5 Litre'];
    if (name.includes('drink')) return ['300ml', '500ml', '1.5 Litre'];
    if (name.includes('bread')) return ['Packet', 'Pcs'];
    if (name.includes('burger')) return ['Packet', 'Pcs'];
    if (name.includes('bun')) return ['Packet', 'Pcs'];
    if (name.includes('wrap')) return ['Packet', 'Pcs'];
    return ['Pcs', 'Bottle', 'Packet', 'Kg', 'G', 'Litre', 'Ml'];
  })();

  useEffect(() => {
    if (!item && unitOptions.length && !unit) {
      setUnit(unitOptions[0]);
    }
  }, [item, unitOptions, unit]);

  useEffect(() => {
    if (!item && unitOptions.length && !unitOptions.includes(unit)) {
      setUnit(unitOptions[0]);
    }
  }, [item, unitOptions, unit]);

  function handleSave() {
    const trimmedName = name.trim();
    const qty = Number(currentQty);
    const cost = Number(unitCost || 0);
    const conversion = conversionQty === '' ? null : Number(conversionQty);

    if (!trimmedName) {
      setError('Enter item name.');
      return;
    }
    if (currentQty === '' || isNaN(qty) || qty < 0) {
      setError('Enter valid current quantity.');
      return;
    }
    if (unit.trim() === '') {
      setError('Enter a unit such as pcs, bottle, kg, g, litre, ml.');
      return;
    }
    if (conversionQty !== '' && (isNaN(conversion) || conversion <= 0)) {
      setError('Optional conversion quantity must be greater than zero.');
      return;
    }

    onSave({
      id: item ? item.id : undefined,
      name: trimmedName,
      categoryId: categoryId ? Number(categoryId) : null,
      categoryName: customCategory.trim() || null,
      unit: unit.trim(),
      currentQty: qty,
      reorderLevel: 0,
      unitCost: cost,
      conversionQty: conversion
    });
  }

  const showUnitDropdown = unitOptions.length > 0 && (selectedCategoryName || customCategory.trim());

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">{item ? 'Edit Inventory Item' : 'Add Inventory Item'}</div>
        <div className="modal-body">
          <label className="modal-label">Item name</label>
          <input type="text" className="modal-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shawarma Bread" autoFocus />

          <label className="modal-label">Category</label>
          <select className="modal-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Select category</option>
            {inventoryCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <label className="modal-label">Custom category (optional)</label>
          <input type="text" className="modal-input" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="e.g. Bakery" />

          <label className="modal-label">Unit</label>
          {showUnitDropdown ? (
            <select className="modal-input" value={unit} onChange={(e) => setUnit(e.target.value)}>
              {unitOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input type="text" className="modal-input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pcs, bottle, kg, g, litre, ml" />
          )}

          <label className="modal-label">Current stock</label>
          <input type="number" className="modal-input" value={currentQty} onChange={(e) => setCurrentQty(e.target.value)} placeholder="0" step="any" />

          <label className="modal-label">Pieces per purchase unit</label>
          {isBurgerPacketItem && unit.toLowerCase() === 'packet' ? (
            <select className="modal-input" value={conversionQty === '' || conversionQty == null ? '4' : String(conversionQty)} onChange={(e) => setConversionQty(e.target.value)}>
              {burgerPacketOptions.map((opt) => (
                <option key={opt} value={String(opt)}>{opt} pcs per packet</option>
              ))}
            </select>
          ) : (
            <input type="number" className="modal-input" value={conversionQty} onChange={(e) => setConversionQty(e.target.value)} placeholder="e.g. 4 for 1 packet = 4 pcs" step="any" />
          )}

          <label className="modal-label">Unit cost (optional)</label>
          <input type="number" className="modal-input" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="0" step="any" />

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
  const [selectedIngredient, setSelectedIngredient] = useState('');

  const availableIngredients = inventory.filter((inv) => !(inv.id in qtys));

  function setQty(ingredientId, val) {
    setQtys((prev) => ({ ...prev, [ingredientId]: val }));
  }

  function removeIngredient(ingredientId) {
    setQtys((prev) => {
      const next = { ...prev };
      delete next[ingredientId];
      return next;
    });
  }

  function handleAddIngredient() {
    if (!selectedIngredient) return;
    setQtys((prev) => ({ ...prev, [selectedIngredient]: '' }));
    setSelectedIngredient('');
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
        <div className="modal-header">Ingredients / Stock Used: {item.name}</div>
        <div className="modal-body">
          {inventory.length === 0 && <div className="empty-state">Add stock items in Inventory first.</div>}
          {Object.entries(qtys).map(([ingredientId, qty]) => {
            const ingredient = inventory.find((inv) => String(inv.id) === String(ingredientId));
            if (!ingredient) return null;
            return (
              <div key={ingredient.id} className="recipe-row">
                <span className="recipe-row-name">{ingredient.name}</span>
                <input
                  type="number"
                  className="modal-input recipe-row-input"
                  value={qty}
                  onChange={(e) => setQty(ingredient.id, e.target.value)}
                  placeholder="0"
                  min="0"
                  step="any"
                />
                <span className="recipe-row-unit">{ingredient.unit}</span>
                <button className="delete-order-btn" onClick={() => removeIngredient(ingredient.id)}>Remove</button>
              </div>
            );
          })}
          {availableIngredients.length > 0 && (
            <div className="recipe-row recipe-row-add">
              <select className="modal-input" value={selectedIngredient} onChange={(e) => setSelectedIngredient(e.target.value)}>
                <option value="">+ Add Ingredient</option>
                {availableIngredients.map((inv) => (
                  <option key={inv.id} value={inv.id}>{inv.name}</option>
                ))}
              </select>
              <button className="confirm-btn" onClick={handleAddIngredient} disabled={!selectedIngredient}>Add</button>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="back-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-btn" onClick={handleSave}>Save Recipe</button>
        </div>
      </div>
    </div>
  );
}

function InventoryAdjustmentModal({ item, onClose, onSave }) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('New stock');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  function handleSave() {
    const qty = Number(quantity);
    if (quantity === '' || Number.isNaN(qty) || qty === 0) {
      setError('Enter a non-zero adjustment quantity.');
      return;
    }
    onSave({ id: item.id, quantity: qty, reason, note });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">Adjust Stock: {item.name}</div>
        <div className="modal-body">
          <label className="modal-label">Current stock</label>
          <div className="modal-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>{item.current_qty} {item.unit}</div>

          <label className="modal-label">Quantity</label>
          <input type="number" className="modal-input" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 20" step="any" />

          <label className="modal-label">Reason</label>
          <select className="modal-input" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option>New stock</option>
            <option>Damaged</option>
            <option>Waste</option>
            <option>Stock count correction</option>
          </select>

          <label className="modal-label">Note (optional)</label>
          <input type="text" className="modal-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
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

function InventoryHistoryModal({ item, entries, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">Stock History: {item.name}</div>
        <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {entries.length === 0 && <div className="empty-state">No stock movement yet.</div>}
          {entries.map((entry) => (
            <div key={entry.id} className="recipe-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <strong>{entry.reason} {entry.delta_qty > 0 ? '+' : ''}{entry.delta_qty} {item.unit}</strong>
              <div>{entry.note || 'No note'}</div>
              <small>{new Date(entry.created_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="confirm-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function InventoryView({ items, categories, selectedCategoryId, onCategoryChange, onBack, onAdd, onEdit, onDelete, onAdjust, onHistory, onExport, exportMsg }) {
  const filteredItems = selectedCategoryId
    ? items.filter((it) => Number(it.category_id) === Number(selectedCategoryId))
    : items;

  const lowStockItems = filteredItems.filter((it) => Number(it.current_qty) <= Number(it.reorder_level));
  const totalItems = filteredItems.length;

  return (
    <div className="history-screen">
      <div className="history-card">
        <div className="history-topbar">
          <div className="history-header">Inventory</div>
          <div className="history-topbar-actions">
            <button className="export-btn" onClick={onAdd}>+ Add Item</button>
            <button className="export-btn" onClick={onExport}>Download List</button>
            <button className="back-btn" onClick={onBack}>Back to Menu</button>
          </div>
        </div>

        <div className="export-msg">
          {totalItems} Items | {lowStockItems.length} Low Stock
        </div>

        {categories.length > 0 && (
          <div className="history-list" style={{ marginBottom: '12px' }}>
            <div className="cat-tab-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '8px 0' }}>
              <button className={"cat-tab" + (!selectedCategoryId ? ' active' : '')} onClick={() => onCategoryChange(null)}>All</button>
              {categories.map((cat) => (
                <button key={cat.id} className={"cat-tab" + (selectedCategoryId === cat.id ? ' active' : '')} onClick={() => onCategoryChange(cat.id)}>{cat.name}</button>
              ))}
            </div>
          </div>
        )}

        {exportMsg && <div className="export-msg">{exportMsg}</div>}

        <div className="history-list">
          <div className="history-row history-row-head">
            <span className="hc-id">Item</span>
            <span className="hc-date">Status</span>
            <span className="hc-total">Stock</span>
            <span className="hc-actions"></span>
          </div>
          {filteredItems.length === 0 && <div className="empty-state">No items in this category yet.</div>}
          {filteredItems.map((it) => {
            const unitPieces = Number(it.conversion_qty || 0);
            const piecesTotal = unitPieces > 1 ? Number(it.current_qty) * unitPieces : Number(it.current_qty);
            const isLow = Number(it.current_qty) <= Number(it.reorder_level);
            const stockText = unitPieces > 1 ? `${it.current_qty} ${it.unit} / ${piecesTotal} pcs` : `${it.current_qty} ${it.unit}`;
            return (
              <div key={it.id} className={"history-row history-row-item" + (isLow ? ' low-stock' : '')}>
                <span className="hc-id">{it.name}</span>
                <span className="hc-date">{isLow ? 'LOW STOCK' : 'OK'}</span>
                <span className="hc-total">{stockText}</span>
                <span className="hc-actions">
                  <button className="edit-order-btn" onClick={() => onEdit(it)}>Edit</button>
                  <button className="edit-order-btn" onClick={() => onAdjust(it)}>Adjust</button>
                  <button className="edit-order-btn" onClick={() => onHistory(it)}>History</button>
                  <button className="delete-order-btn" onClick={() => onDelete(it.id)}>Delete</button>
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
  const [recipeByItem, setRecipeByItem] = useState({});
  const [inventoryCategories, setInventoryCategories] = useState([]);
  const [selectedInventoryCategoryId, setSelectedInventoryCategoryId] = useState(null);
  const [showInventoryItem, setShowInventoryItem] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);
  const [inventoryExportMsg, setInventoryExportMsg] = useState('');
  const [inventoryAdjustmentItem, setInventoryAdjustmentItem] = useState(null);
  const [inventoryHistoryItem, setInventoryHistoryItem] = useState(null);
  const [inventoryHistoryEntries, setInventoryHistoryEntries] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [editingOrderRow, setEditingOrderRow] = useState(null);
  const [showAddSection, setShowAddSection] = useState(false);
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
    window.api.getInventoryCategories().then((cats) => {
      setInventoryCategories(cats);
      if (cats.length && !selectedInventoryCategoryId) setSelectedInventoryCategoryId(cats[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedId == null) return;
    window.api.getItemsByCategory(selectedId).then(async (menuItems) => {
      setItems(menuItems);
      const itemRecipes = {};
      for (const item of menuItems) {
        itemRecipes[item.id] = await window.api.getRecipe(item.id);
      }
      setRecipeByItem(itemRecipes);
    });
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

    const refreshedInventory = await window.api.getInventory();
    setInventory(refreshedInventory);

    if (result.lowStock && result.lowStock.length) {
      setLowStockAlert(result.lowStock);
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

  async function saveNewSection(name) {
    const cat = await window.api.addCategory(name);
    const rows = await window.api.getCategories();
    setCategories(rows);
    setSelectedId(cat.id);
    setShowAddSection(false);
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

  function editOrder(order) {
    requestAdminDelete(`Enter admin password to edit order #${order.order_id}.`, () => {
      setEditingOrderRow(order);
    });
  }

  async function saveEditedOrder(payload) {
    await window.api.updateOrder(payload);
    const [rows, refreshedInventory] = await Promise.all([
      window.api.getOrders(),
      window.api.getInventory()
    ]);
    setOrders(rows);
    setInventory(refreshedInventory);
    setEditingOrderRow(null);
  }

  async function openInventory() {
    const [rows, cats] = await Promise.all([
      window.api.getInventory(),
      window.api.getInventoryCategories()
    ]);
    setInventory(rows);
    setInventoryCategories(cats);
    if (cats.length && !selectedInventoryCategoryId) {
      setSelectedInventoryCategoryId(cats[0].id);
    }
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
    let categoryId = payload.categoryId;
    if (!categoryId && payload.categoryName) {
      const created = await window.api.addInventoryCategory(payload.categoryName);
      categoryId = created.id;
    }

    const defaults = getInventoryDefaults(payload.name, payload.categoryName || inventoryCategories.find((cat) => String(cat.id) === String(categoryId))?.name || '');
    const prepared = {
      ...payload,
      categoryId: categoryId || null,
      name: payload.name.trim(),
      unit: payload.unit || defaults.unit,
      conversionQty: payload.conversionQty === '' || payload.conversionQty == null ? defaults.conversionQty : payload.conversionQty
    };

    if (prepared.id) {
      await window.api.updateInventoryItem(prepared);
    } else {
      await window.api.addInventoryItem(prepared);
    }

    const rows = await Promise.all([
      window.api.getInventory(),
      window.api.getInventoryCategories()
    ]);
    setInventory(rows[0]);
    setInventoryCategories(rows[1]);
    setShowInventoryItem(false);
    setEditingInventoryItem(null);
  }

  function openInventoryAdjust(item) {
    setInventoryAdjustmentItem(item);
  }

  async function saveInventoryAdjustment({ id, quantity, reason, note }) {
    await window.api.adjustInventory({ id, deltaQty: quantity, reason, note });
    const rows = await window.api.getInventory();
    setInventory(rows);
    setInventoryAdjustmentItem(null);
  }

  async function openInventoryHistory(item) {
    const rows = await window.api.getInventoryHistory(item.id);
    setInventoryHistoryEntries(rows);
    setInventoryHistoryItem(item);
  }

  function deleteInventoryItem(id) {
    requestAdminDelete('Delete this stock item? This will also remove its recipe links and stock history.', async () => {
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
        onEdit={editOrder}
        onBack={() => setView('menu')}
        exportMsg={exportMsg}
      />
    );
  } else if (view === 'inventory') {
    content = (
      <>
        <InventoryView
          items={inventory}
          categories={inventoryCategories}
          selectedCategoryId={selectedInventoryCategoryId}
          onCategoryChange={setSelectedInventoryCategoryId}
          onBack={() => setView('menu')}
          onAdd={openAddInventoryItem}
          onEdit={openEditInventoryItem}
          onDelete={deleteInventoryItem}
          onAdjust={openInventoryAdjust}
          onHistory={openInventoryHistory}
          onExport={exportInventoryCsv}
          exportMsg={inventoryExportMsg}
        />
        {showInventoryItem && (
          <InventoryItemModal
            item={editingInventoryItem}
            inventoryCategories={inventoryCategories}
            onClose={() => { setShowInventoryItem(false); setEditingInventoryItem(null); }}
            onSave={saveInventoryItem}
          />
        )}
      </>
    );
  } else {
    content = (
      <div className="app">
        <Sidebar categories={categories} selectedId={selectedId} onSelect={setSelectedId} onAddSection={() => setShowAddSection(true)} />
        <div className="main-panel">
          <div className="panel-header">
            <span>{selectedCategory ? selectedCategory.name : ''}</span>
            <div className="panel-header-actions">
              <button className="add-item-nav-btn" onClick={() => setShowAddItem(true)}>+ Add Item</button>
              <button className="history-nav-btn" onClick={openInventory}>Inventory</button>
              <button className="history-nav-btn" onClick={openHistory}>Order History</button>
            </div>
          </div>
          <ItemGrid items={items} inventory={inventory} recipeByItem={recipeByItem} onAdd={addToCart} onDelete={deleteItem} />
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
      {showAddSection && (
        <AddSectionModal
          onClose={() => setShowAddSection(false)}
          onSave={saveNewSection}
        />
      )}
      {editingOrderRow && (
        <EditOrderModal
          order={editingOrderRow}
          onClose={() => setEditingOrderRow(null)}
          onSave={saveEditedOrder}
        />
      )}
      {inventoryAdjustmentItem && (
        <InventoryAdjustmentModal
          item={inventoryAdjustmentItem}
          onClose={() => setInventoryAdjustmentItem(null)}
          onSave={saveInventoryAdjustment}
        />
      )}
      {inventoryHistoryItem && (
        <InventoryHistoryModal
          item={inventoryHistoryItem}
          entries={inventoryHistoryEntries}
          onClose={() => { setInventoryHistoryItem(null); setInventoryHistoryEntries([]); }}
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
