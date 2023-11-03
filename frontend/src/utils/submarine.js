import { SubmarineFactoryABI } from '../abis/SubmarineFactory.json'
import { RevealABI } from '../abis/Reveal.json'

const ethers = require('ethers');
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const subFactoryAddress = process.env.REACT_APP_SUB_FACTORY_ADDRESS;
const revealAddress = process.env.REACT_APP_REVEAL_ADDRESS;

export const createSubmarineContract = async () => {
    console.log("");
    console.log("Creating Submarine contract...");
  
    // Connect to Factory as signer
    const factoryContract = new ethers.Contract(
      subFactoryAddress,
      SubmarineFactoryABI,
      signer
    );
  
    // Create submarine contract with the owner as sender
    const contractCreateTx = await factoryContract.createSubContract(
      signer.address
    );
  
    // Print out submarine transaction receipt
    const txReceipt = await provider.getTransaction(contractCreateTx.hash);
    console.log("Submarine contract creation TX Hash: ", txReceipt.hash);
  
    // Print transaction
    console.log(txReceipt);
  
    // Output message
    console.log("Check etherscan to ensure before next step");
    console.log("Remember to add or update this address in the .env file");
    console.log("");
  };

export const sendEthertoSubmarine = async (submarineAddress, amountETH) => {
    console.log("");
    console.log("Sending funds to Submaring contract...");
  
    // Show current Submarine Contract balance
    const submarineBalance = ethers.utils.formatEther(
      await provider.getBalance(submarineAddress)
    );
    console.log("Initial balance on Submarine contract ETH: ", submarineBalance);
  
    // Convert ethereum into wei
    const amountWei = ethers.utils.parseEther(amountETH);
  
    // Build Transaction
    const tx = {
      to: submarineAddress,
      value: amountWei,
    };
  
    // Send Transaction
    const txSend = await signer.sendTransaction(tx);
    console.log("Send transaction Hash: ", txSend.hash);
  
    // Output
    console.log("Check etherscan for the tx completion before continuing");
    console.log("");
  };

export const getSubmarineBalance = async (submarineAddress) => {
    console.log("");
    console.log("Checking funds on Submarine contract...");
  
    // Show balance of submarine transaction
    const balance = await provider.getBalance(submarineAddress);
    const humanBalance = ethers.utils.formatEther(balance);
    console.log("Current balance of Submarine contract is ETH: ", humanBalance);
    console.log("");
  };

export const executeTransaction = async (submarineAddress, tokenSwapAddress) => {
    console.log("");
    console.log("Performing swap...");
  
    // Show ETH balance of sender
    const signerBalance = await provider.getBalance(signer.address);
    const humanSignerBal = ethers.utils.formatEther(signerBalance);
    console.log("Sender current balance: ", humanSignerBal);
  
    // Connect to reveal contract
    const revealContractSigner = new ethers.Contract(
      revealAddress,
      RevealABI,
      signer
    );
  
    // Execute swap
    const swapTx = await revealContractSigner.revealExecution(
      tokenSwapAddress
    );
    console.log("Swap transaction reference: ", swapTx.hash);
  
    // Next instructions
    console.log("Please check Etherscan before proceeding");
    console.log("");
  };