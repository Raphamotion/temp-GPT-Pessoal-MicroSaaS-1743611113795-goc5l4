import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import App from './App.tsx'
import './index.css'

console.log("[main.tsx] Script starting execution...");

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode> // <-- Temporarily commented out
    <BrowserRouter> {/* Wrap App with BrowserRouter */}
      <App />
    </BrowserRouter>
  // </React.StrictMode>, // <-- Temporarily commented out
)

console.log("[main.tsx] ReactDOM.createRoot finished.");
