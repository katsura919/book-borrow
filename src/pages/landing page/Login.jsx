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


  return (
    <>
    <Navbar/>
    <form className="form"
    onSubmit={handleSubmit}>
        <div className="header">Sign In</div>

        {
          error &&
          <div className="error-notif">{error}</div>
                  }

        <div className="inputs">
            <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            required
            />

            <input 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="input"
            required
            />

          
            <button 
            className="sigin-btn"
            type="submit">Login</button>

           
            <p class="signup-link"
               type="submit"
               >Don't have an account? <a onClick={handleRegisterBtn}>Sign up</a></p>
        </div>
    </form>
    </>
  );
 
   
}

export default Login;
