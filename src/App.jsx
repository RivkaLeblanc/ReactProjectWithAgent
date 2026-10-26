import './App.css';
import React from 'react';
import ProductsPage from './components/ProductsPage/ProductsPage';
import ProductDetailsPage from './components/ProductDetailsPage/ProductDetailsPage';
import LoginPage from './components/LoginPage/LoginPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegisterPage from './components/RegisterPage/RegisterPage';
import AddProductPage from './components/AddProductPage/AddProductPage';
import AgentChat from './components/AgentChat/AgentChat';
import ClientDetailsPage from './components/ClientDetailsPage/ClientDetailsPage';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/products/add" element={<AddProductPage />} />
          <Route path='/agent' element={<AgentChat />} />
          <Route path="/personalDetails" element={<ClientDetailsPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
