const { ethers } = require('ethers');

export function convertUnixTimeToMinutes(unix_time) {
  const minutes = Math.floor(unix_time / 60);
  const seconds = unix_time % 60;
  return `${minutes}m ${seconds}s`;
}

export function convertWeiToEth(wei) {
  console.log(wei.toString());
  return ethers.utils.formatEther(wei.toString());
}

export function convertEthToWei(eth) {
  return ethers.utils.parseEther(eth);
}

export function auctionStatus(isActive, isEnded) {
  if (isEnded) {
    return 'Ended';
  } else if (isActive) {
    return 'In Progress';
  } else {
    return 'Not Started';
  }
}
