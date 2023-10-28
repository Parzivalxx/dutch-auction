import React, { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './components/Home';
import Nav from './components/Nav';
import AuctionPage from './components/AuctionPage';
import CreateAuctionModal from './components/CreateAuction';

function App() {
  const [openModal, setOpenModal] = useState(false);

  return (
    <BrowserRouter>
      <Nav openModal={openModal} handleOpenModal={() => setOpenModal(true)} />
      <Routes>
        <Route path="/dutch-auction/" element={<Home />} />
        <Route path="/dutch-auction/auctions/:auctionID" element={<AuctionPage />} />
      </Routes>
      <CreateAuctionModal openModal={openModal} handleCloseModal={() => setOpenModal(false)} />
    </BrowserRouter>
  );
}

export default App;
