import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import Navbar from '../../NavBar';

function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Use navigate for redirection
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:4000/register', { firstName, lastName, username, password });
      alert('User registered successfully');
      navigate('/login'); // Redirect to login page after registration
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleBcktoLogin = () => {
    navigate('/login');
  };

  const handleBcktoLandingPage = () => {
    navigate('/');
  };

  return (
    <>
    <Navbar/>
      <div 
        className='form-container'>
          <form 
            className="register-form"
            onSubmit={handleSubmit}>
            
            <h1>REGISTER </h1>

            <input
              className="input-field"
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />

            <input
              className="input-field"
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            
            <input
              className="input-field" 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required
            />

            <input
              className="input-field"
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required 
            />


            <button
              className="bttn register-btn"
              type="submit">Register
            </button>

            <button
              className="bttn login-btn"
              onClick={handleBcktoLogin}>
                Back to Login
            </button>

          </form>

      
        </div>
    </>
  );
}

export default Register;
