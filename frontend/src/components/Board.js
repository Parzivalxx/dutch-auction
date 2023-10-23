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
import './css/board.css';
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

const Board = (props) => {

  const navigate = useNavigate();
  const [pageNumber, setPageNumber] = useState(1);
  const [auncPerPage] = useState(10);
  const [auctions, setAuctions] = useState([]);

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
        // tx = await auctionContract.startAuction()
        // await tx.wait()
        const auctionStartPrice = await auctionContract.startingPrice()
        const auctionStartPriceInt = parseInt(auctionStartPrice._hex)
        const auctionStatus = await auctionContract.active()
        let auction = {
          address: auction_address,
          startPrice: auctionStartPriceInt,
          status: auctionStatus
        }
        auctions.push(auction)
      }
      setAuctions(auctions)
    }
    getAuctions()
  }, [])

  return props.loading ? (
    <Spinner />
  ) : (
    <Box sx={boardStyle}>
      <Box sx={auctionTableStyle}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={tableHeaderStyle} style={{width: '40%'}}>Auction</TableCell>
                <TableCell align='right' sx={tableHeaderStyle} style={{width: '15%'}}>Status</TableCell>
                <TableCell align='right' sx={tableHeaderStyle} style={{width: '15%'}}>Remaining Time</TableCell>
                <TableCell align='right' sx={tableHeaderStyle} style={{width: '15%'}}>Current Price</TableCell>
                <TableCell align='right' sx={tableHeaderStyle} style={{width: '15%'}}>Reserve Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {auctions.map((auction) => {
              return (
                <TableRow sx={tableRowStyle} onClick={() => onRowClick(auction.address)}>
                  <TableCell sx={tableCellStyle}>{auction.address}</TableCell>
                  <TableCell align='right' sx={tableCellStyle}>{auction.status?'In Progress':'Not Started'}</TableCell>
                  <TableCell align='right' sx={tableCellStyle}>auction.remainingTime</TableCell>
                  <TableCell align='right' sx={tableCellStyle}>{auction.startPrice}</TableCell>
                  <TableCell align='right' sx={tableCellStyle}>auction.reservePrice</TableCell>
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
