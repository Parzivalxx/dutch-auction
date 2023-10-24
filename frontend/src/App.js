import React, {useEffect, useState} from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DutchAuction from './abis/DutchAuctionFactory.json';
import { useDispatch } from 'react-redux';

import Home from './components/Home';
import Nav from './components/Nav';
import AuctionPage  from './components/AuctionPage';
import CreateAuctionModal from './components/CreateAuction';

function App() {
  const [openModal, setOpenModal] = useState(false);
  
  return (
    <BrowserRouter>
      <Nav openModal={openModal} handleOpenModal={() => setOpenModal(true)}/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auctions/:auctionID" element={<AuctionPage/>} />
      </Routes>
      <CreateAuctionModal openModal={openModal} handleCloseModal={() => setOpenModal(false)} />
    </BrowserRouter>
  );
}

export default App;
