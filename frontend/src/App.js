import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './components/Home';
import Nav from './components/Nav';
import Ad  from './components/Ad';

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ads/:adId" element={<Ad />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
