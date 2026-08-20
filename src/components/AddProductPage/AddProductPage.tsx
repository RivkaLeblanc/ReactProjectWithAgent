import "./AddProductPage.css";
import { Formik } from "formik";
import * as Yup from "yup";
import Navbar from '../Navbar/Navbar';
import type { Product } from "../../service/ProductsService";
import { getNextProductId } from "../../service/ProductsService";

const API = import.meta.env.VITE_API_URL;

const schema = Yup.object().shape({
  category: Yup.string().required("Category is required"),
  name: Yup.string().required("The product name is required").min(3, "Name is too short").matches(/^[A-Za-z0-9\s\-'.]+$/, "English characters only"),
  gender: Yup.string().required("Gender is required"),
  price_usd: Yup.number().typeError("Price must be a number").positive("Price must be positive").required("Price is required"),
  description: Yup.string().required("Description is required").trim().min(15, "Description must be at least 15 characters").max(500, "Description must be at most 500 characters").matches(/^[\x00-\x7F]+$/, "English characters only"),
  image_url: Yup.string().url("Must be a valid URL").required("Image URL is required"),
});

const AddProductPage = () => {
  const onSubmit = async (values: any, { resetForm }: any) => {
    try {
      const response = await fetch(`${API}/${values.category}`);
      const data = await response.json();
      const newProductId = getNextProductId(values.category, data);

      const newProduct: Product = {
        product_type: values.category,
        product_id: newProductId,
        name: values.name,
        gender: values.gender,
        price_usd: Number(values.price_usd),
        description: values.description,
        image_url: values.image_url,
        id: crypto.randomUUID(),
        units_sold: 0,
      };

      await fetch(`${API}/${values.category}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });

      alert("Product added successfully!");
      resetForm();
    } catch (error) {
      alert("Failed to add product");
    }
  };

  return (
    <>
      <Navbar />
      <div className="add-product-container">
        <Formik
          initialValues={{ category: "", name: "", gender: "", price_usd: "", description: "", image_url: "" }}
          validationSchema={schema}
          onSubmit={onSubmit}
        >
          {({ handleSubmit, handleChange, values, errors, touched }) => (
            <form onSubmit={handleSubmit} className="add-product-form">
              <h2>Add New Product</h2>

              <div className="form-group">
                <label>Category</label>
                <select name="category" value={values.category} onChange={handleChange}>
                  <option value="">Select Category</option>
                  <option value="SKIES">Skis</option>
                  <option value="GOGGLES">Goggles</option>
                  <option value="BOOTS">Boots</option>
                </select>
                {touched.category && errors.category && <div className="error-text">{errors.category}</div>}
              </div>

              <div className="form-group">
                <label>Product Name</label>
                <input name="name" type="text" placeholder="Product Name" value={values.name} onChange={handleChange} />
                {touched.name && errors.name && <div className="error-text">{errors.name}</div>}
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={values.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="MEN">Men</option>
                  <option value="WOMEN">Women</option>
                  <option value="UNISEX">Unisex</option>
                </select>
                {touched.gender && errors.gender && <div className="error-text">{errors.gender}</div>}
              </div>

              <div className="form-group">
                <label>Price (USD)</label>
                <input name="price_usd" type="number" placeholder="Price" value={values.price_usd} onChange={handleChange} />
                {touched.price_usd && errors.price_usd && <div className="error-text">{errors.price_usd}</div>}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" placeholder="Product Description" value={values.description} onChange={handleChange} />
                {touched.description && errors.description && <div className="error-text">{errors.description}</div>}
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input name="image_url" type="text" placeholder="Image URL" value={values.image_url} onChange={handleChange} />
                {touched.image_url && errors.image_url && <div className="error-text">{errors.image_url}</div>}
              </div>

              <button type="submit">Add Product</button>
            </form>
          )}
        </Formik>
      </div>
    </>
  );
};

export default AddProductPage;
