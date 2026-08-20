import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetailsPage.css';
import ProductReviewsPage from '../ProductReviewsPage/ProductReviewsPage';
import { useProducts } from '../../service/ProductsService';
import type { Product } from '../../service/ProductsService';
import Navbar from '../Navbar/Navbar';

const ProductDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getProductById, loading } = useProducts();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const found = await getProductById(id);
      if (!found) setError("Product not found");
      else setProduct(found);
    };
    load();
  }, [id, getProductById]);

  if (loading) return (
    <>
      <Navbar />
      <div className="spinner" />
    </>
  );

  if (error || !product) return (
    <>
      <Navbar />
      <div className="product-details-container">
        <p className="error">{error || 'Product not found'}</p>
        <button onClick={() => navigate('/products')} className="back-button">← Back to Shop</button>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="product-details-container">
        <button onClick={() => navigate('/products')} className="back-button">← Back to Shop</button>

        <div className="product-details-content">
          <div className="product-image-section">
            <img src={product.image_url} alt={product.name} className="product-image" />
          </div>

          <div className="product-info-section">
            <h1 className="product-name">{product.name}</h1>

            <div className="product-meta">
              <span className="product-id">Product ID: {product.product_id}</span>
              <span className="product-gender">{product.gender}</span>
            </div>

            <div className="product-price">${product.price_usd}</div>

            <p className="product-description">{product.description}</p>
          </div>
        </div>
        <ProductReviewsPage productId={product.product_id} />
      </div>
    </>
  );
};

export default ProductDetailsPage;
