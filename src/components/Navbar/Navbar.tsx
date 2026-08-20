import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = localStorage.getItem("userRole") === 'admin';

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/products')}>
        ⛷️ SNOW GOOD
      </div>
      <div className="navbar-links">
        <button className={isActive('/products')} onClick={() => navigate('/products')}>Products</button>
        <button className={isActive('/personalDetails')} onClick={() => navigate('/personalDetails')}>My Details</button>
        {isAdmin && <button className={isActive('/agent')} onClick={() => navigate('/agent')}>Agent - Add Products</button>}
      </div>
    </nav>
  );
};

export default Navbar;
