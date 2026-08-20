import "./RegisterPage.css";
import { Formik } from "formik";
import * as Yup from "yup";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

type User = { id: number; firstName: string; lastName: string; email: string; password: string; role: string; };

const schema = Yup.object().shape({
  firstName: Yup.string().required("Your first name is required"),
  lastName: Yup.string().required("Your last name is required"),
  email: Yup.string().required("Email is a required field").email("Invalid email format"),
  password: Yup.string().required("Password is a required field").min(8, "Password must be at least 8 characters"),
});

const RegisterPage = () => {
  const navigate = useNavigate();

  const onSubmit = async (values: any, { setErrors }: any) => {
    try {
      const response = await fetch(`${API}/users`);
      const users: User[] = await response.json();

      if (users.find(u => u.email === values.email)) {
        setErrors({ email: "This email is already registered" });
        return;
      }

      const lastId = users.length > 0 ? Math.max(...users.map((u: any) => Number(u.id))) : 0;
      const nextId = (lastId + 1).toString();
      const userWithId = { ...values, id: nextId, role: 'user' };

      localStorage.setItem("userRole", "user");
      localStorage.setItem("userId", nextId);
      localStorage.setItem("firstName", values.firstName);

      await fetch(`${API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userWithId)
      });

      navigate("/products");
    } catch (error) {
      alert("Server connection error");
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>⛷️ Join SNOW GOOD</h1>
          <p>Start your skiing adventure today!</p>
        </div>

        <Formik initialValues={{ firstName: "", lastName: "", email: "", password: "" }} validationSchema={schema} onSubmit={onSubmit}>
          {({ handleSubmit, handleChange, values, errors }) => (
            <form onSubmit={handleSubmit}>
              <input type="text" name="firstName" placeholder="First Name" onChange={handleChange} value={values.firstName} />
              {errors.firstName && <p className="error">{errors.firstName}</p>}

              <input type="text" name="lastName" placeholder="Last Name" onChange={handleChange} value={values.lastName} />
              {errors.lastName && <p className="error">{errors.lastName}</p>}

              <input type="email" name="email" placeholder="Email" onChange={handleChange} value={values.email} />
              {errors.email && <p className="error">{errors.email}</p>}

              <input type="password" name="password" placeholder="Password" onChange={handleChange} value={values.password} />
              {errors.password && <p className="error">{errors.password}</p>}

              <button type="submit">Create Account</button>
            </form>
          )}
        </Formik>

        <div className="register-footer">
          <p>Already have an account?</p>
          <Link to="/" className="login-link">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
