import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link for navigation
import './Navbar.css'; // Import CSS for styling
import Login from './pages/landing page/Login'


const Navbar = () => {
    const navigate = useNavigate();

    const handleRegisterBtn = () => {
        navigate('/register');
      };

      const handleLoginBtn = () => {
        <Login/>
      };


  return (
    <nav className="navbar">
      <div className="navbar-logo">
      <Link
        className="title"
        to="/" >
          <h1>Book Master</h1>
        </Link>
      </div>

      <div className="navbar-links">
        <Link to="/login" className="navbar-link">Login</Link>
        <Link to="/register" className="navbar-link">Register</Link>
        <Link to="/about" className="navbar-link">About Us</Link>
      </div>
    </nav>
  );
};

export default Navbar;
