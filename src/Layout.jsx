// Layout.js
import React, { useState } from 'react';
import Navbar from './NavBar';
import { Outlet } from 'react-router-dom';
import Login from './pages/landing page/Login';


const Layout = () => {


  return (
    <>
      <Navbar />
      <div className="content">
        <Outlet /> {/* This will render the child routes */}
      </div>
    </>
  );
};

export default Layout;
