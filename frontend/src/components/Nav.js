import React, {useEffect, useState} from 'react';
import { useSDK } from '@metamask/sdk-react';
import { useDispatch, useSelector, connect } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
// Material UI Componeents
import { Button, Link } from '@mui/material';
// Files
import './css/nav.css';
import logo from '../images/nav-bar-banner.png';
import DutchAuctionFactory from '../abis/DutchAuctionFactory.json';
import TokenFactory from '../abis/TokenFactory.json';

import { accountLinked } from '../actions/accountActions';

import detectEthereumProvider from '@metamask/detect-provider';
import { 
  getDutchAuctionFactoryContract,
  getTokenFactoryContract,
  getTokenContract,
  decodeTransactionData,
  decodeTransctionLogs,
  getDutchAuctionContract
 } from '../utils/contract';


const Nav = (props) => {
  const account_id = useSelector((state) => state.account.account_id);
  const { sdk, connected, connecting, provider, chainId } = useSDK();
  const  dispatch = useDispatch();

  const connect = async () => {
    try {
      const accounts = await sdk?.connect();
      let cur_account = accounts?.[0];
      dispatch(accountLinked(cur_account));
    } catch(err) {
      console.warn(`failed to connect..`, err);
    }
  };

  const disconnect = async () => {
    try {
      await sdk?.disconnect();
      dispatch(accountLinked(null));
    } catch(err) {
      console.warn(`failed to disconnect..`, err);
    }
  }
  const dutchAuctionFactoryContract = getDutchAuctionFactoryContract()
  const tokenFactoryContract = getTokenFactoryContract()
  const ethers = require('ethers')
  async function createAuction(){
      let test_amount = 100
      const deployTokenTX = await tokenFactoryContract.deployToken('Test Token', 'TT', 1000)
      const rc1 = await deployTokenTX.wait()

      const tokenAdd = decodeTransctionLogs(TokenFactory, rc1.logs)[0].address
      const tokenContract = getTokenContract(tokenAdd)

      const deployAuctionTx = await dutchAuctionFactoryContract.deployAuction(tokenAdd, test_amount, 900000, 1)
      const rc2 = await deployAuctionTx.wait()

      const auctionAdd = decodeTransctionLogs(DutchAuctionFactory, rc2.logs)[0].address
      tokenContract.approve(auctionAdd, test_amount)

      const aunction = getDutchAuctionContract(auctionAdd)
      aunction.startAuction()
  }

  return (
    <div className='nav'>
      <div className='nav__group1'>
        <div className='nav__image-container'>
          <RouterLink to='/'>
            <img className='nav__icon' src={logo} alt='navicon' href='/' />
          </RouterLink>
        </div>

          <div className='nav__buttons'>
            <RouterLink to='/' style={{ textDecoration: 'none' }}>
              <Button>Home</Button>
            </RouterLink>
            <Button onClick={createAuction}>Create Auction</Button>
          </div>
      </div>

      <div className='nav__group2'> 
        <div className='nav__account'>
          {!account_id? (
            <Button onClick={connect}>Link your wallet</Button>
          ):
            <Button onClick={disconnect}>{account_id}</Button>}
        </div>  
      </div>
    </div>
  );
};

export default Nav;
