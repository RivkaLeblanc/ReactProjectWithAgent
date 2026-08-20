import { useCart } from '../../context/CartContext';
import './Cart.css';

type CartProps = {
  onClose: () => void;
};

const Cart = ({ onClose }: CartProps) => {
  const { cart, removeFromCart, clearCart, totalItems } = useCart();

  const total = cart.reduce((sum, item) => sum + item.price_usd * item.quantity, 0);

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-sidebar" onClick={e => e.stopPropagation()}>
        <div className="cart-header">
          <h2>❤️ My Choices ({totalItems})</h2>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <p>No choices yet</p>
            <span>Add some ski gear!</span>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={item.image_url} alt={item.name} />
                  <div className="cart-item-info">
                    <p className="cart-item-name">{item.name}</p>
                    <p className="cart-item-price">${item.price_usd} × {item.quantity}</p>
                  </div>
                  <button className="cart-item-remove" onClick={() => removeFromCart(item.id)}>✕</button>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-total">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button className="cart-checkout-btn">Checkout</button>
              <button className="cart-clear-btn" onClick={clearCart}>Clear All</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
