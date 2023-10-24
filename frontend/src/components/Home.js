import React from 'react';
import { connect } from 'react-redux';
import { Navigate } from 'react-router-dom';
// Styling
import './css/home.css';
// Components
import Board from './Board';
import Alert from './Alert';

const Home = (props) => {

  return (
    <div className='home'>
      <Board />
    </div>
  );
};


export default Home;