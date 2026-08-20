import { useState, useCallback } from "react";

const API = import.meta.env.VITE_API_URL;
export type Product = {
  id: string;
  name: string;
  product_id: string;
  product_type: string;
  gender: string;
  price_usd: number;
  description: string;
  image_url: string;
  units_sold?: number;
};

const getCategoryPrefix = (category: string) => {
  switch (category.toUpperCase()) {
    case "BOOTS": return "BOOT";
    case "SKIES": return "SKI";
    case "GOGGLES": return "GOG";
    default: return category.slice(0, 3).toUpperCase();
  }
};

export const getNextProductId = (category: string, allProducts: Product[]) => {
  const upperCategory = category.toUpperCase();
  const prefix = getCategoryPrefix(upperCategory);
  const filtered = allProducts.filter(p => p.product_type.toUpperCase() === upperCategory);
  const lastNumber = filtered.reduce((max, p) => {
    const match = p.product_id?.match(new RegExp(`^${prefix}(\\d+)$`, "i"));
    if (!match) return max;
    const num = Number(match[1]);
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);
  return `${prefix}${String(lastNumber + 1).padStart(3, "0")}`;
};

 export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // פונקציית עזר פנימית למניעת חזרתיות על ה-Fetch של הכל
  const fetchAll = async () => {
    const [skiesRes, gogglesRes, bootsRes] = await Promise.all([
      fetch(`${API}/SKIES`),
      fetch(`${API}/GOGGLES`),
      fetch(`${API}/BOOTS`)
    ]);
    return [
      await skiesRes.json(),
      await gogglesRes.json(),
      await bootsRes.json()
    ];
  };

  const getProducts = async () => {
    setLoading(true);
    try {
      const [skies, goggles, boots] = await fetchAll();
      setProducts([...skies, ...goggles, ...boots]);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProductsByCategory = async (category: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/${category.toUpperCase()}`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProductsByName = async (searchTerm: string) => {
    try {
      const [skies, goggles, boots] = await fetchAll();
      const all = [...skies, ...goggles, ...boots];
      const filtered = all.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
      setProducts(filtered);
    } catch (error) { console.error(error); }
  };

  const getProductsByGender = async (gender: string) => {
    try {
      const [skies, goggles, boots] = await fetchAll();
      const all = [...skies, ...goggles, ...boots];
      const filtered = all.filter(p => p.gender.toLowerCase() === gender.toLowerCase());
      setProducts(filtered);
    } catch (error) { console.error(error); }
  };

  const getProductById = useCallback(async (id: string) => {
  setLoading(true);
  try {
    const [skies, goggles, boots] = await fetchAll();
    const all = [...skies, ...goggles, ...boots];
    return all.find(p => p.id === id) || null;
  } finally {
    setLoading(false);
  }
}, []);

const deleteProduct = async (id: string) => {
  const confirmed = window.confirm("Are you sure you want to delete this product?");
  if (!confirmed) return;

  try {
    const [skies, goggles, boots] = await fetchAll();
    const all = [...skies, ...goggles, ...boots];
    const productToDelete = all.find(p => p.id === id);
    if (!productToDelete) {
      alert("Product not found");
      return;
    }

    await fetch(`${API}/${productToDelete.product_type}/${id}`, {
      method: "DELETE",
    });

    // Update the products state by removing the deleted product
    setProducts(products.filter(p => p.id !== id));
    alert("Product deleted successfully!");
  } catch (error) {
    console.error(error);
    alert("Failed to delete product");
  }
};



  return { products, loading, getProducts, getProductsByCategory, getProductsByName, getProductsByGender,getProductById,deleteProduct };
};