import React from 'react';
import { connect } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
// Material UI Componeents
import { Button, Link } from '@mui/material';
// Files
import './css/nav.css';
import logo from '../images/nav-bar-banner.png';


const Nav = (props) => {
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
            <RouterLink to='/about' style={{ textDecoration: 'none' }}>
              <Button>Create Auction</Button>
            </RouterLink>
          </div>
      </div>

      <div className='nav__group2'>
        <div className='nav__account'>
              <Button>Link your wallet</Button>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  isAuth: state.auth.isAuthenticated,
});

// export default connect(mapStateToProps, { logout })(Nav);
export default Nav;
