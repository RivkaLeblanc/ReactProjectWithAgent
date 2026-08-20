import "./ProductsPage.css";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../service/ProductsService';
import Navbar from '../Navbar/Navbar';

const API = import.meta.env.VITE_API_URL;

const ProductsPage = () => {
  const navigate = useNavigate();
  const [displayCount, setDisplayCount] = useState(15);
  const [activeFilter, setActiveFilter] = useState('all');
  const [reviews, setReviews] = useState<any[]>([]);
  const { products, loading, getProducts, getProductsByCategory, getProductsByGender, getProductsByName, deleteProduct } = useProducts();
  const isAdmin = localStorage.getItem("userRole") === 'admin';

  useEffect(() => {
    getProducts();
    fetch(`${API}/reviews`).then(r => r.json()).then(setReviews).catch(() => {});
  }, []);

  const getAvgRating = (productId: string) => {
    const productReviews = reviews.filter(r => r.product_id === productId);
    if (productReviews.length === 0) return null;
    const avg = productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / productReviews.length;
    return avg.toFixed(1);
  };

  const handleFilter = (key: string, fn: () => void) => {
    setActiveFilter(key);
    fn();
  };

  return (
    <>
      <Navbar />
      <div className="products-container">
        <h1>Ski Shop</h1>

        <div className="filters">
          <input
            type="text"
            placeholder="Search products..."
            onChange={(e) => { setActiveFilter('search'); getProductsByName(e.target.value); }}
          />

          <div className="filter-group">
            <span className="filter-label">Gender:</span>
            <button className={activeFilter === 'women' ? 'active' : ''} onClick={() => handleFilter('women', () => getProductsByGender('Women'))}>Women</button>
            <button className={activeFilter === 'men' ? 'active' : ''} onClick={() => handleFilter('men', () => getProductsByGender('Men'))}>Men</button>
            <button className={activeFilter === 'unisex' ? 'active' : ''} onClick={() => handleFilter('unisex', () => getProductsByGender('Unisex'))}>Unisex</button>
          </div>

          <div className="filter-group">
            <span className="filter-label">Category:</span>
            <button className={activeFilter === 'skies' ? 'active' : ''} onClick={() => handleFilter('skies', () => getProductsByCategory('SKIES'))}>Skis</button>
            <button className={activeFilter === 'boots' ? 'active' : ''} onClick={() => handleFilter('boots', () => getProductsByCategory('BOOTS'))}>Boots</button>
            <button className={activeFilter === 'goggles' ? 'active' : ''} onClick={() => handleFilter('goggles', () => getProductsByCategory('GOGGLES'))}>Goggles</button>
          </div>

          <button className="reset-btn" onClick={() => handleFilter('all', getProducts)}>Show All</button>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : products.length > 0 ? (
          <>
            <div className="products-grid">
              {products.slice(0, displayCount).map(product => {
                const avg = getAvgRating(product.product_id);
                return (
                  <div
                    key={product.id}
                    className="card"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <img src={product.image_url} alt={product.name} />
                    <div className="card-body">
                      <h3>{product.name}</h3>
                      <p className="card-price">${product.price_usd}</p>
                      {avg && <p className="card-rating">⭐ {avg} / 5</p>}
                    </div>
                    {isAdmin && <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteProduct(product.id); }}>Delete</button>}
                  </div>
                );
              })}
            </div>
            {displayCount < products.length && (
              <div className="load-more-container">
                <button className="load-more-btn" onClick={() => setDisplayCount(displayCount + 15)}>
                  Load More
                </button>
                <span className="products-count">
                  Showing {displayCount} of {products.length} products
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>No products found</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductsPage;
