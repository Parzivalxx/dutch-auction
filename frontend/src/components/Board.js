import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// MUI
import { 
  Button, 
  Box, 
  ButtonGroup, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper, } 
  from '@mui/material';

// Styling
import {
  auctionTableStyle,
  boardStyle,
  paginationStyle,
  tableCellStyle,
  tableHeaderStyle,
  tableRowStyle,
} from './css/boardStyle';

// Components
import Spinner from './Spinner';
import { getDutchAuctionFactoryContract, getDutchAuctionContract } from '../utils/contract';
import LoadingDisplay from './LoadingDisplay';

const Board = (props) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [pageNumber, setPageNumber] = useState(1);
  const [auncPerPage] = useState(10);
  const [auctions, setAuctions] = useState([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setPageNumber(1);
  }, [])


  // Pagination
  let lastAdIndex = pageNumber * auncPerPage;
  let firstAdIndex = lastAdIndex - auncPerPage;
  // Page numbers for buttons
  let pageNumbers = [];
  const num = Math.ceil(auctions.length / auncPerPage);
  for (let i = 1; i <= num; i++) {
    pageNumbers.push(i);
  }
  // When page number button is clicked
  const clickPageNumberButton = (num) => {
    setPageNumber(num);
  };

  const onRowClick = (address) => {
    navigate(`/auctions/${address}`)
  }
  const dutchAuctionFactoryContract = getDutchAuctionFactoryContract()

  useEffect(() => {
    async function getAuctions(){
      const auction_count = await dutchAuctionFactoryContract.auctionCount()
      const auction_count_int = parseInt(auction_count._hex)
      let auctions = []
      for(let i = 0; i < auction_count_int; i++){
        const auction_address = await dutchAuctionFactoryContract.auctions(i)
        const auctionContract = getDutchAuctionContract(auction_address)

        const auctionStartPrice = await auctionContract.startingPrice()
        const auctionStartPriceInt = parseInt(auctionStartPrice._hex)
        const auctionStatus = await auctionContract.active()

        let auction = {
          address: auction_address,
          startPrice: auctionStartPriceInt,
          currentPrice: auctionStartPriceInt,
          remainingTime: 'NA',
          status: auctionStatus,
          reservePrice: 'NA'
        }

        if (auctionStatus == true) {
          const auctionCurrentPrice = await auctionContract.getPrice()
          const auctionCurrentPriceInt = parseInt(auctionCurrentPrice._hex)
          auction.currentPrice = auctionCurrentPriceInt
          // console.log(auctionCurrentPriceInt)
          
          const auctionStartAt = await auctionContract.startAt()
          const auctionStartAtInt = parseInt(auctionStartAt._hex)

          const auctionExpireAt = await auctionContract.expiresAt()
          const auctionExpireAtInt = parseInt(auctionExpireAt._hex)
          const currentTime = Math.floor(Date.now() / 1000)
          const auctionRemainingTime = Math.max(0, auctionExpireAtInt - currentTime)
          const minutes = Math.floor(auctionRemainingTime / 60)
          const seconds = auctionRemainingTime % 60
          auction.remainingTime = `${minutes}m ${seconds}s`
          
          const auctionDuration = auctionExpireAtInt - auctionStartAtInt

          const auctionDiscountRate = await auctionContract.discountRate()
          const auctionDiscountRateInt = parseInt(auctionDiscountRate._hex)
          const auctionReservePrice = auctionStartPriceInt - auctionDiscountRateInt*auctionDuration
          auction.reservePrice = auctionReservePrice
        }

        auctions.push(auction)
      }
      setAuctions(auctions)
    }
    setLoading(true)
    const interval = setInterval(() => { 
      setCount(count + 1); 
    }, 10000);
    getAuctions()
    setLoading(false)
  }, [count])

  return loading ? (
    <LoadingDisplay />
  ) : (
    <Box sx={boardStyle}>
      <Box sx={auctionTableStyle}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={tableHeaderStyle}>Auction</TableCell>
                <TableCell align='right' sx={tableHeaderStyle}>Status</TableCell>
                <TableCell align='right' sx={tableHeaderStyle}>Remaining Time</TableCell>
                <TableCell align='right' sx={tableHeaderStyle}>Starting Price</TableCell>
                <TableCell align='right' sx={tableHeaderStyle}>Current Price</TableCell>
                <TableCell align='right' sx={tableHeaderStyle}>Reserve Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {auctions.slice(firstAdIndex, lastAdIndex).map((auction) => {
              return (
                <TableRow sx={tableRowStyle} onClick={() => onRowClick(auction.address)}>
                  <TableCell sx={tableCellStyle}>{auction.address}</TableCell>
                  <TableCell align='right' sx={tableCellStyle}>{auction.status?'In Progress':'Not Started'}</TableCell>
                  <TableCell align='right' sx={tableCellStyle}>{auction.remainingTime}</TableCell>
                  <TableCell align='right' sx={tableCellStyle}>{auction.startPrice}</TableCell>
                  <TableCell align='right' sx={tableCellStyle}>{auction.currentPrice}</TableCell>
                  <TableCell align='right' sx={tableCellStyle}>{auction.reservePrice}</TableCell>
                </TableRow>
              );
            })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Box sx={paginationStyle}>
        <ButtonGroup variant='outlined' size='medium'>
          <Button
            disabled={pageNumber === 1}
            onClick={(e) => clickPageNumberButton(pageNumber - 1)}
          >
            Prev
          </Button>
          {pageNumbers.map((num) => {
            return (
              <Button
                key={num}
                disabled={pageNumber === num}
                onClick={(e) => clickPageNumberButton(num)}
              >
                {num}
              </Button>
            );
          })}
          <Button
            disabled={pageNumber === pageNumbers[pageNumbers.length - 1]}
            onClick={(e) => clickPageNumberButton(pageNumber + 1)}
          >
            Next
          </Button>
        </ButtonGroup>
      </Box>
    </Box>
  );
};

export default Board;
