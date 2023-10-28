import React from 'react';
import { useSDK } from '@metamask/sdk-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
// Material UI Componeents
import { Button } from '@mui/material';
// Files
import './css/nav.css';
import logo from '../images/nav-bar-banner.png';

import { accountLinked } from '../actions/accountActions';

const Nav = (props) => {
  const { handleOpenModal } = props;

  const account_id = useSelector((state) => state.account.account_id);
  const { sdk } = useSDK();

  const dispatch = useDispatch();

  const connect = async () => {
    try {
      const accounts = await sdk?.connect();
      let cur_account = accounts?.[0];
      dispatch(accountLinked(cur_account));
    } catch (err) {
      console.warn(`failed to connect..`, err);
    }
  };

  const disconnect = async () => {
    try {
      await sdk?.disconnect();
      dispatch(accountLinked(null));
    } catch (err) {
      console.warn(`failed to disconnect..`, err);
    }
  };

  return (
    <div className="nav">
      <div className="nav__group1">
        <div className="nav__image-container">
          <RouterLink to="/dutch-auction">
            <img className="nav__icon" src={logo} alt="navicon" href="/dutch-auction" />
          </RouterLink>
        </div>

        <div className="nav__buttons">
          <RouterLink to="/dutch-auction" style={{ textDecoration: 'none' }}>
            <Button>Home</Button>
          </RouterLink>
          <Button onClick={handleOpenModal}>Create Auction</Button>
        </div>
      </div>

      <div className="nav__group2">
        <div className="nav__account">
          {!account_id ? (
            <Button onClick={connect}>Link your wallet</Button>
          ) : (
            <Button onClick={disconnect}>{account_id}</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Nav;
