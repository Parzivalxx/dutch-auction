import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
// MUI Components
import { Paper, Box, Typography, Divider, TextField, Button } from '@mui/material';

// Styling
import { 
  auctionTitleContainerStyle, 
  aunctionContentStyle, 
  aunctionInfoAreaStyle, 
  auctionLiveInfoStyle,
  bidAreaStyle, 
  containerStyle, 
  fieldStyle, 
  paperStyle } from './css/auctionPage';

import { getDutchAuctionContract, getTokenContract } from '../utils/contract';
import LoadingDisplay from './LoadingDisplay';


const AuctionPage = (props) => {
  const [loading, setLoading] = useState(true);
  const currentURL = window.location.href;
  const auctionAddress = currentURL.split('/')[4];
  const currentAccountAddress = useSelector((state) => state.account.account_id);

  const [auction, setAuction] = useState({
    tokenName: '',
    tokenTicker: '',
    sellerAdd: '',
    startedOn: 'Not Started',
    tokenQty: '',
    startingPrice: '',
    reservePrice: 'NA',
    currentPrice: 'NA',
    timeRemaining: 'NA',
    active: false,
  });
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function getAuctionInfo() {
      const dutchAuctionContract = getDutchAuctionContract(auctionAddress);

      // Token info
      const tokenAdd = await dutchAuctionContract.token();
      const tokenContract = getTokenContract(tokenAdd);
      const tokenName = await tokenContract.name();
      const tokenTicker = await tokenContract.symbol();
      
      // Auction info
      const seller = await dutchAuctionContract.seller();
      const tokenQty = parseInt((await dutchAuctionContract.tokenQty())._hex);
      const startingPrice = parseInt((await dutchAuctionContract.startingPrice())._hex);
      const isActive = await dutchAuctionContract.active();

      const newAuction = {
        ...auction,
        tokenName: tokenName,
        tokenTicker: tokenTicker,
        sellerAdd: seller,
        tokenQty: tokenQty,
        startingPrice: startingPrice,
        active: isActive,
      };

      if (isActive) {
        const startAt = parseInt((await dutchAuctionContract.startAt())._hex);
        const startedOn = new Date(startAt * 1000).toLocaleString();
        newAuction.startedOn = startedOn;

        const expiresAt = parseInt((await dutchAuctionContract.expiresAt())._hex);
        const duration = expiresAt - startAt;
        const discountRate = parseInt((await dutchAuctionContract.discountRate())._hex);
        const reservePrice = startingPrice - discountRate * duration;
        newAuction.reservePrice = reservePrice;

        const timeRemaining = expiresAt - Math.floor(Date.now() / 1000);
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        newAuction.timeRemaining = `${minutes}m ${seconds}s`;

        const currentPrice = parseInt((await dutchAuctionContract.getPrice())._hex);
        newAuction.currentPrice = currentPrice;
      }

      setAuction(newAuction);
    }
    setLoading(true)
    const interval = setInterval(() => { 
      setCount(count + 1); 
    }, 1000);
    getAuctionInfo();
    setLoading(false);
  }
  , [count]);

  async function startAuction() {
    const dutchAuctionContract = getDutchAuctionContract(auctionAddress);
    await dutchAuctionContract.startAuction();
  }

  return (
    <div>
    {loading?(
      <LoadingDisplay/>
      ):(
        <Box sx={containerStyle}>
      <Paper sx={paperStyle}>
        <Box sx={auctionTitleContainerStyle}>
          <Typography variant='h4'>{auction.tokenName} - {auction.tokenTicker}</Typography>
          <Typography sx={fieldStyle}>Seller Address: {auction.sellerAdd}</Typography>
        </Box>
        <Divider variant='middle' flexItem/>
        <Box sx={aunctionContentStyle}>
        <Box sx={aunctionInfoAreaStyle}>
          <Typography sx={fieldStyle}>Started On: {auction.startedOn}</Typography>
          <Typography sx={fieldStyle}>Token Quantity: {auction.tokenQty}</Typography>
          <Typography sx={fieldStyle}>Starting Price: {auction.startingPrice}</Typography>
          <Typography sx={fieldStyle}>Reserve Price: {auction.reservePrice}</Typography>
        </Box>

        <Divider variant='middle' orientation='vertical' flexItem/>

        <Box sx={auctionLiveInfoStyle}>
          <Typography sx={fieldStyle}>Time Remaining: {auction.timeRemaining}</Typography>
          <Typography sx={fieldStyle}>Current Price: {auction.currentPrice}</Typography>
          <Box sx={bidAreaStyle}>
            {!currentAccountAddress==auction.sellerAdd.toLowerCase()? (
              <div>
                <TextField
                label='$'
                size='small'
                style={{width: '50%', marginRight: '1rem'}}
                />
                <Button
                  variant='contained'
                >
                  Place bid
                </Button>
              </div>
            ):(
              <Button
                variant='contained'
                color='warning'
                onClick={startAuction}
                disabled = {auction.active}
              >
                Start Auction
              </Button>
            )}
          </Box>
        </Box>
        </Box>
      </Paper>
    </Box>
      )
    }
    </div>
  );
};

export default AuctionPage;
