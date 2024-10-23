import { View, Text } from 'react-native'
import React from 'react'

function logincopy() {
  return (
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
            type="submit">Submit</button>

           
            <p className="signup-link" 
            type="submit" 
            onClick={handleRegisterBtn}>Sign up</p>
        </div>
    </form>
  )
};

export default logincopy;