import React from 'react';
import './LandingPage.css';
import Navbar from '../../NavBar'; // Import the Navbar component
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const LandingPage = () => {
    const navigate = useNavigate();

      const handleCheckOutBtn = () => {
        navigate('/checkout');
      };

      
  return (
    <>
        
        <div className="landing-container">
    
            <header className="landing-header">
                <h1>Welcome to Book Master</h1>
                <p>Simplifying the way you borrow.</p>
                <button className="cta-button" onClick={handleCheckOutBtn}>Check Out Now</button>
            </header>

            <section className="features">
                <h2>Features</h2>

                <div className="feature">
                    <h3>Feature 1</h3>
                    <p>Short description of Feature 1.</p>
                </div>

                <div className="feature">
                    <h3>Feature 2</h3>
                    <p>Short description of Feature 2.</p>
                </div>

                <div className="feature">
                    <h3>Feature 3</h3>
                    <p>Short description of Feature 3.</p>
                </div>

            </section>
            
            <footer className="landing-footer">
                <p>© 2024 Our Company. All rights reserved.</p>
            </footer>
        </div>

    </>
  )
};

export default LandingPage;
