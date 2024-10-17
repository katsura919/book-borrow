import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css'
import Navbar from '../../NavBar';

function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Use navigate for redirection
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    
    e.preventDefault();
    try {
      setError("");
      const response = await axios.post('http://localhost:4000/login', { username, password });
      setToken(response.data.token); // Save token to state
      navigate('/dashboard'); // Redirect to dashboard after login
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setError('Invalid password');
      } else if (error.response && error.response.status === 402) {
        setError('Invalid username');
      }else {
        console.error('Login error:', error);
        alert('An error occurred during login');
      }
    }
  };

  const handleRegisterBtn = () => {
    navigate('/register');
  };

  const handleBcktoLandingPage = () => {
    navigate('/');
  };

  return (
    <>
    <Navbar/>
      <form 
        className="login-form"
        onSubmit={handleSubmit}>

        <h1>LOGIN </h1>
        {
          error &&
          <div className="error-notif">{error}</div>
                  }

        <input type="text" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)}
          className="input-field"
          required
        />

        <input type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="input-field"
          required
        />

        <div className="button-group">
          <button 
            className="btn login-btn"
            type="submit">
              Login
          </button>

          <button
            className="btn register-btn" 
            type="submit" 
            onClick={handleRegisterBtn}
            >Register
          </button>



        </div>
      </form>
    </>
  );
 
   
}

export default Login;
