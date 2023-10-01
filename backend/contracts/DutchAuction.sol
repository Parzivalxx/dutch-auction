// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Queue.sol";

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

function min(uint256 a, uint256 b) pure returns (uint256) {
    return a <= b ? a : b;
}

contract dutchAuction {
    uint private constant DURATION = 20 minutes;

    IERC20 public immutable token;
    uint public immutable tokenQty;
    uint public immutable tokenId;

    address payable public immutable seller;
    uint public immutable startingPrice;
    uint public immutable discountRate;
    uint public immutable startAt;
    uint public immutable expiresAt;

    uint private tokenNetWorthPool;
    uint private currentBidNetWorthPool;
    Queue private bidQueue; 

    constructor(
        uint _startingPrice,
        uint _discountRate,
        address _token,
        uint _tokenQty,
        uint _tokenId
    ) {
        seller = payable(msg.sender);
        startingPrice = _startingPrice;
        discountRate = _discountRate;
        startAt = block.timestamp;
        expiresAt = block.timestamp + DURATION;

        require(_startingPrice >= _discountRate * DURATION, "Starting price is too low");

        token = IERC20(_token);
        tokenQty = _tokenQty;
        tokenId = _tokenId;

        tokenNetWorthPool = startingPrice * tokenQty;
    }

    function getPrice() public view returns (uint) {
        uint timeElapsed = block.timestamp - startAt;
        uint discount = discountRate * timeElapsed;
        return startingPrice - discount;
    }

    function getCurrentTokenNetWorth() private view returns (uint) {
        uint currentPrice = getPrice();
        return currentPrice * tokenQty;
    }

    function placeBid() external payable{
        require(block.timestamp < expiresAt, "This auction has ended");

        address bidder = msg.sender;
        uint bidValue = msg.value;
        uint price = getPrice();
        require(bidValue >= price, "The amount of ETH sent is less than the price of token");
        
        uint currentBidPool = bidQueue.currentBidPool();
        uint currentTokenNetWorth = getCurrentTokenNetWorth();
        if (currentBidPool >= currentTokenNetWorth) {
            endAuction(currentTokenNetWorth);
        } else {
            bidQueue.enqueue(bidder, bidValue);
        }
        // selfdestruct(seller); //TODO: what is the new opcode?
    }

    function endAuction(uint tokenValue) internal{
        address bidder;
        uint bidValue;
        uint pricePerToken = tokenValue / tokenQty;

        uint tokensUnallocated = tokenQty;
        bool terminate = false;
        while (tokensUnallocated > 0 || terminate == false) {
            (bidder, bidValue) = bidQueue.dequeue();
            uint qtyAllocated = min(tokensUnallocated, bidValue / pricePerToken);
            uint remainder = bidValue - qtyAllocated*pricePerToken;
            tokensUnallocated -= qtyAllocated;

            require(token.transferFrom(seller, bidder, qtyAllocated), "Token transfer failed");
            if (remainder > 0) {
                (bool success, ) = bidder.call{value: remainder}("");
                require(success, "Remainder refund failed.");
            }

        }
    }
}