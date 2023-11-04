import SubmarineFactoryABI from '../abis/SubmarineFactory.json';
import RevealABI from '../abis/Reveal.json';
import { ethers, provider, signer, decodeTransctionLogs } from './contract';

const subFactoryAddress = process.env.REACT_APP_SUB_FACTORY_ADDRESS;
const revealAddress = process.env.REACT_APP_REVEAL_ADDRESS;

export const createSubmarineContract = async () => {
  console.log('Creating Submarine contract...');
  const signerAdd = await signer.getAddress();
  // Connect to Factory as signer
  const factoryContract = new ethers.Contract(subFactoryAddress, SubmarineFactoryABI, signer);
  console.log(factoryContract);
  // Create submarine contract with the owner as sender
  const contractCreateTx = await factoryContract.createSubContract(signerAdd);
  console.log(contractCreateTx);
  // Print out submarine transaction receipt
  const txReceipt = await contractCreateTx.wait();
  console.log('Submarine contract creation TX : ', txReceipt);
  // Sleep 5s to allow for transaction to be mined
  const txLogs = decodeTransctionLogs(SubmarineFactoryABI, txReceipt.logs);

  const submarineAddress = txLogs[0].events.find((e) => e.name === 'submarine').value;
  console.log(submarineAddress);
  return submarineAddress;
};

export const sendEthertoSubmarine = async (submarineAddress, amountETH) => {
  console.log('Sending funds to Submaring contract...');

  // Show current Submarine Contract balance
  const submarineBalance = ethers.utils.formatEther(await provider.getBalance(submarineAddress));
  console.log('Initial balance on Submarine contract ETH: ', submarineBalance);

  // Convert ethereum into wei
  console.log(amountETH);
  const amountWei = ethers.utils.parseEther(amountETH);
  console.log(amountWei);

  // Build Transaction
  const tx = {
    to: submarineAddress,
    value: amountWei,
  };

  // Send Transaction
  const txSend = await signer.sendTransaction(tx);
  await txSend.wait();
};

export const getSubmarineBalance = async (submarineAddress) => {
  console.log('Checking funds on Submarine contract...');

  // Show balance of submarine transaction
  const balance = await provider.getBalance(submarineAddress);
  const humanBalance = ethers.utils.formatEther(balance);
  return humanBalance;
};

export const executeTransaction = async (dutchAuctionAddress) => {
  console.log('');
  console.log('Performing swap...');

  // Show ETH balance of sender
  const signerBalance = await provider.getBalance(signer.address);
  const humanSignerBal = ethers.utils.formatEther(signerBalance);
  console.log('Sender current balance: ', humanSignerBal);

  // Connect to reveal contract
  const revealContractSigner = new ethers.Contract(revealAddress, RevealABI, signer);

  // Execute swap
  const swapTx = await revealContractSigner.revealExecution(dutchAuctionAddress);
  console.log('Swap transaction reference: ', swapTx.hash);

  // Next instructions
  console.log('Please check Etherscan before proceeding');
  console.log('');
};
