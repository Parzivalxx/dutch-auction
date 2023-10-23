import React, {useEffect, useState} from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DutchAuction from './abis/DutchAuctionFactory.json';
import { useDispatch } from 'react-redux';

import Home from './components/Home';
import Nav from './components/Nav';
import Ad  from './components/Ad';

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auctions/:auctionsID" element={<Ad />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
