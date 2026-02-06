import logo from './logo.svg';
import './App.css';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/auth";

function App() {

  useEffect(() => {
  fetch("/api/hello")
    .then(res => res.json())
    .then(data => console.log(data));
}, []);

  return (
   
     <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
    
  
  );
}

export default App;
