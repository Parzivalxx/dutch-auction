// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


// Interface Contract
interface IReveal {
    function storeFactoryPlusBytes(address _owner, address _factory, bytes32 _byteCode) external;
}

// Interface WETH
interface IWETH {
    function deposit() external payable;
    function withdraw(uint) external;
}

// Interface UniswapV2
interface IUniswap {
    function swapETHForExactTokens(uint, address[] calldata, address, uint) external payable;
    function getAmountsOut(uint, address[] memory) external returns (uint[] memory);
}

// Submarine Contract
contract Submarine {

    // Store Owner
    address payable private owner;

    // Store timestamp
    uint256 public timestamp;

    // Store Token current price
    uint256 public currentPrice;

    // Store Reveal Contract
    address private revealContractAddr;

    // Contract constructor
    constructor(address payable _owner, address _revealContract) payable {
        owner = _owner;
        revealContractAddr = _revealContract;
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

    // Check is owner
    function _checkOwner() private view {
        require(msg.sender == owner, "Not called by owner");
    }

    // Get owner
    function getOwner() external view returns (address) {   
        require(msg.sender == revealContractAddr, "Reveal contract only"); 
        return owner;
    }

    function sendToOwner(uint amount) external payable {
        require(amount <= address(this).balance, "Not enough balance");
        owner.transfer(amount);
    }

    function sendToAccount(address payable account, uint amount) external payable {
        require(amount <= address(this).balance, "Not enough balance");
        account.transfer(amount);
    }

    // Destroy smart contract
    function _destroy() public payable {
        require(msg.sender == revealContractAddr, "Not allowed caller for destroy");
        address payable addr = payable(address(owner));
        selfdestruct(addr);
    }
}


// Factory Contract
contract SubmarineFactory {

    // Store Reveal Contract
    address private revealContractAddr;

    // Store Submarine Addresses
    mapping(address => address) private submarines;

    // Contract constructor
    constructor(address _revealContract) payable {
        revealContractAddr = _revealContract;
    }

    // Create Sub Contract
    function createSubContract(address payable _owner) public {

        // Get byteCode for storing in the reveal contract
        bytes32 byteCode = keccak256(abi.encodePacked(type(Submarine).creationCode, abi.encode(_owner, revealContractAddr)));

        // Create Submarine Contract
        Submarine sub = new Submarine(_owner, revealContractAddr);

        // Create bytecode
        // Owner, Factory, Bytes
        IReveal(revealContractAddr).storeFactoryPlusBytes(_owner, address(this), byteCode);

        // Store address
        submarines[_owner] = address(sub);
    }

    // Get ByteCode
    function _getByteCode (address _owner) private view returns (bytes memory) {
        bytes memory bytecode = type(Submarine).creationCode;
        return abi.encodePacked(bytecode, abi.encode(_owner, revealContractAddr));
    }

    // Get Stored Submarine Address
    function getSubAddress() public view returns (address) {
        return submarines[msg.sender];
    }

    // Get Reveal Contract Address
    function getRevealContractAddress () public view returns (address) {
        return revealContractAddr;
    }
}