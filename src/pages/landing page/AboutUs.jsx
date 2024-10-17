import React from 'react';
import './AboutUs.css'; // Import the CSS file for styling

const AboutUs = () => {
  return (
    <div className="about-container">
      <h1 className='heading-h1'>About Book Master</h1>
      <p className="intro">
        Welcome to <strong>Book Master</strong>, your ultimate library borrowing solution at USTP! Our system is designed to make borrowing books easier, faster, and more convenient for students and faculty. Whether you’re looking for textbooks, reference materials, or leisure reads, Book Master streamlines the entire borrowing process.
      </p>

      <h2 className='heading-h2'>Our Mission</h2>
      <p>
        At Book Master, we aim to provide an efficient and user-friendly platform that connects the USTP community with the resources they need. Our mission is to simplify access to knowledge, allowing you to focus on what truly matters—learning and personal growth.
      </p>

      <h2 className='heading-h2'>What We Offer</h2>
      <ul className="features-list">
        <li>Seamless online book reservations and borrowing.</li>
        <li>Real-time updates on book availability and due dates.</li>
        <li>Notifications and reminders for book returns.</li>
        <li>User-friendly interface with a focus on simplicity.</li>
      </ul>

      <h2 className='heading-h2'>Why Choose Book Master?</h2>
      <p>
        Book Master not only simplifies the borrowing process but also empowers students and faculty by providing easy access to the resources they need. We believe that knowledge should be accessible, and with our system, it's just a few clicks away.
      </p>

      <p className="conclusion">
        Join the USTP community in mastering the art of borrowing with Book Master!
      </p>
    </div>
  );
};

export default AboutUs;
