import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
// MUI Components
import { Paper, Box, Typography, Divider, TextField, Button, Grid } from '@mui/material';

// Styling
import {
  auctionTitleContainerStyle,
  aunctionContentStyle,
  aunctionInfoAreaStyle,
  auctionLiveInfoStyle,
  bidAreaStyle,
  containerStyle,
  fieldStyle,
  paperStyle,
} from './css/auctionPage';

import { getDutchAuctionContract, getTokenContract } from '../utils/contract';
import { auctionStatus, convertUnixTimeToMinutes, convertWeiToEth } from '../utils/utils';
import LoadingDisplay from './LoadingDisplay';
import { ethers } from 'ethers';

import { accountBidded } from '../actions/accountActions';

const AuctionPage = () => {
  const [loading, setLoading] = useState(true);
  const currentURL = window.location.href;
  const auctionAddress = currentURL.split('/')[5];
  const currentAccountAddress = useSelector((state) => state.account.account_id);
  const currentAccountBidded = useSelector((state) => state.account.account_bidded);

  const dispatch = useDispatch();

  const [auction, setAuction] = useState({
    tokenName: '',
    tokenTicker: '',
    sellerAdd: '',
    startedOn: 'NaN',
    tokenQty: '',
    startingPrice: '',
    reservePrice: 'NaN',
    currentPrice: 'NaN',
    timeRemaining: 'NaN',
    status: 'NaN',
    active: false,
    ended: false,
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
      const tokenQty = convertWeiToEth(parseInt((await dutchAuctionContract.tokenQty())._hex));
      const startingPrice = convertWeiToEth(
        parseInt((await dutchAuctionContract.startingPrice())._hex),
      );
      const isActive = await dutchAuctionContract.active();
      console.log(isActive);
      const reservePrice = convertWeiToEth(
        parseInt((await dutchAuctionContract.getReservePrice())._hex),
      );
      const auctionEnded = await dutchAuctionContract.ended();

      const newAuction = {
        ...auction,
        tokenName: tokenName,
        tokenTicker: tokenTicker,
        sellerAdd: seller,
        tokenQty: tokenQty,
        startingPrice: startingPrice,
        active: isActive,
        ended: auctionEnded,
        reservePrice: reservePrice,
        status: auctionStatus(isActive, auctionEnded),
      };

      if (isActive) {
        const startAt = parseInt((await dutchAuctionContract.startAt())._hex);
        const startedOn = new Date(startAt * 1000).toLocaleString();
        newAuction.startedOn = startedOn;

        const expiresAt = parseInt((await dutchAuctionContract.expiresAt())._hex);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeRemaining = Math.max(expiresAt - currentTime, 0);
        newAuction.timeRemaining = convertUnixTimeToMinutes(timeRemaining);

        const currentPrice = convertWeiToEth(
          parseInt((await dutchAuctionContract.getPrice(currentTime))._hex),
        );
        newAuction.currentPrice = currentPrice;
      }

      setAuction(newAuction);
    }
    setLoading(true);

    setInterval(() => {
      setCount(count + 1);
    }, 10000);

    getAuctionInfo();
    setLoading(false);
  }, [count]);

  const dutchAuctionContract = getDutchAuctionContract(auctionAddress);
  async function startAuction() {
    setLoading(true);
    const startAucTx = await dutchAuctionContract.startAuction();
    await startAucTx.wait();
    setLoading(false);
  }

  const [bidAmount, setBidAmount] = useState();
  async function placeBid() {
    const currentTime = Math.floor(Date.now() / 1000);
    await dutchAuctionContract.placeBid(currentTime, {
      value: ethers.utils.parseEther(bidAmount.toString()),
    });
    dispatch(accountBidded(true));
  }

  const [enableBid, setEnableBid] = useState(true);
  useEffect(() => {
    const newEnableBid = Boolean(auction.active && !currentAccountBidded && currentAccountAddress);
    setEnableBid(newEnableBid);
  }, [auction, accountBidded, currentAccountAddress]);

  return (
    <div>
      {loading ? (
        <LoadingDisplay />
      ) : (
        <Box sx={containerStyle}>
          <Paper sx={paperStyle}>
            <Box sx={auctionTitleContainerStyle}>
              <Typography variant="h4">
                {auction.tokenName} - {auction.tokenTicker}
              </Typography>
              <Typography sx={fieldStyle}>Seller Address: {auction.sellerAdd}</Typography>
            </Box>
            <Divider variant="middle" flexItem />
            <Box sx={aunctionContentStyle}>
              <Box sx={aunctionInfoAreaStyle}>
                <Grid container>
                  <Grid item xs={8}>
                    <Typography sx={fieldStyle}>Status:</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={fieldStyle}>{auction.status}</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography sx={fieldStyle}>Token Quantity ({auction.tokenTicker}):</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={fieldStyle}>{auction.tokenQty}</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography sx={fieldStyle}>
                      Starting Price (ETH/{auction.tokenTicker}):
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={fieldStyle}>{auction.startingPrice}</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography sx={fieldStyle}>
                      Reserve Price (ETH/{auction.tokenTicker}):
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={fieldStyle}>{auction.reservePrice}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider variant="middle" orientation="vertical" flexItem />

              <Box sx={auctionLiveInfoStyle}>
                <Grid container>
                  <Grid item xs={8}>
                    <Typography sx={fieldStyle}>Started On:</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={fieldStyle}>{auction.startedOn}</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography sx={fieldStyle}>Time Remaining:</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={fieldStyle}>{auction.timeRemaining}</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography sx={fieldStyle}>
                      Current Price (ETH/{auction.tokenTicker}):
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={fieldStyle}>{auction.currentPrice}</Typography>
                  </Grid>
                </Grid>
                <Box sx={bidAreaStyle}>
                  {!(currentAccountAddress == auction.sellerAdd.toLowerCase()) ? (
                    <div>
                      <TextField
                        label="ETH"
                        size="small"
                        style={{ width: '50%', marginRight: '1rem' }}
                        value={bidAmount}
                        disabled={!enableBid}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={placeBid}
                        disabled={!enableBid}
                      >
                        Place bid
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={startAuction}
                      disabled={auction.active}
                    >
                      Start Auction
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </div>
  );
};

export default AuctionPage;
