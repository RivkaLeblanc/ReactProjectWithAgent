import "./LoginPage.css";
import { Formik } from "formik";
import * as Yup from "yup";
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

const schema = Yup.object().shape({
  email: Yup.string().required("Email is a required field").email("Invalid email format"),
  password: Yup.string().required("Password is a required field").min(8, "Password must be at least 8 characters"),
});

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = async (values: any) => {
    try {
      const response = await fetch(`${API}/users?email=${values.email}`);
      const data = await response.json();

      if (data.length === 0) {
        alert("Email not found!");
        return;
      }

      const user = data[0];

      if (user.password === values.password) {
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userId", user.id);
        localStorage.setItem("firstName", user.firstName);
        navigate("/products");
      } else {
        alert("Incorrect password");
      }
    } catch (error) {
      alert("Connection error");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>⛷️ SNOW GOOD</h1>
          <p>Welcome back! Ready to hit the slopes?</p>
        </div>

        <Formik initialValues={{ email: "", password: "" }} validationSchema={schema} onSubmit={handleLogin}>
          {({ handleSubmit, handleChange, values, errors }) => (
            <form onSubmit={handleSubmit}>
              <input type="email" name="email" placeholder="Email" onChange={handleChange} value={values.email} />
              {errors.email && <p className="error">{errors.email}</p>}

              <input type="password" name="password" placeholder="Password" onChange={handleChange} value={values.password} />
              {errors.password && <p className="error">{errors.password}</p>}

              <button type="submit">Login</button>
            </form>
          )}
        </Formik>

        <div className="login-footer">
          <p>Haven't joined the SNOW GOOD family?</p>
          <Link to="/register" className="register-link">Create an Account</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
