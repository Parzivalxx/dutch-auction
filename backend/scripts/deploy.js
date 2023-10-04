// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
  "Deploying contracts with the account:",
  deployer.address
  );
  
  const DutchAuctionFactory = await hre.ethers.getContractFactory("DutchAuctionFactory");
  const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
  const dutchAuctionFactory = await DutchAuctionFactory.deploy();
  const tokenFactory = await TokenFactory.deploy();

  console.log("DutchAuctionFactory deployed at:", dutchAuctionFactory.address);
  console.log("TokenFactory deployed at:", tokenFactory.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});