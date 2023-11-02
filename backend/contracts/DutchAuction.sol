// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Queue.sol";

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
}

function min(uint256 a, uint256 b) pure returns (uint256) {
    return a <= b ? a : b;
}

contract DutchAuction {
    uint public constant DURATION = 20 minutes;

    IERC20 public immutable token;
    uint public immutable tokenQty;
    uint public immutable tokenId;

    address payable public immutable seller;
    uint public immutable startingPrice;
    uint public immutable discountRate;
    uint public startAt;
    uint public expiresAt;
    bool public active;
    bool public ended;

    uint private tokenNetWorthPool;
    uint private currentBidNetWorthPool;
    Queue private bidQueue;

    event AuctionCreated(
        address indexed _seller,
        address indexed _token,
        uint _qty,
        uint startPrice,
        uint discountRate
    );
    event StartOfAuction();
    event DespositTokens(address indexed _from, uint indexed _qty);
    event LogBid(address indexed _from, uint indexed _price);
    event EndOfAuction(uint indexed _time, uint _qtySold, uint _salePrice);
    event SuccessfulBid(
        address indexed _bidder,
        uint _qtyAlloacated,
        uint refund
    );

    modifier onlyNotSeller() {
        require(msg.sender != seller, "The seller cannot perform this action");
        _;
    }

    modifier onlySeller() {
        require(
            msg.sender == seller,
            "Only the seller can perform this action"
        );
        _;
    }

    modifier onlyAfterStart() {
        require(block.timestamp >= startAt, "This auction has not started");
        _;
    }

    modifier onlyBeforeEnd() {
        require(block.timestamp < expiresAt, "This auction has ended");
        _;
    }

    modifier onlyActive() {
        require(active, "This auction is no longer active");
        _;
    }

    modifier onlyNotActive() {
        require(!active, "This auction is already active");
        _;
    }

    constructor(
        address _seller,
        uint _startingPrice,
        uint _discountRate,
        address _token,
        uint _tokenQty,
        uint _tokenId
    ) {
        seller = payable(_seller);
        startingPrice = _startingPrice;
        discountRate = _discountRate;

        require(
            _startingPrice >= _discountRate * DURATION,
            "Starting price is too low"
        );

        token = IERC20(_token);
        tokenQty = _tokenQty;
        tokenId = _tokenId;

        tokenNetWorthPool = startingPrice * tokenQty;
        bidQueue = new Queue();

        emit AuctionCreated(
            seller,
            _token,
            tokenQty,
            startingPrice,
            discountRate
        );
    }

    function startAuction() external onlySeller onlyNotActive {
        injectTokens();
        require(
            tokenQty == token.balanceOf(address(this)),
            "Not enough tokens injected"
        );
        startAt = block.timestamp;
        expiresAt = block.timestamp + DURATION;
        active = true;
        emit StartOfAuction();
    }

    function injectTokens() internal onlySeller onlyNotActive {
        token.transferFrom(msg.sender, address(this), tokenQty);
        emit DespositTokens(msg.sender, tokenQty); //TODO: add tons of checks + tests
    }

    function getPrice(uint time_now) public view returns (uint) {
        if (time_now < startAt) return startingPrice;
        if (time_now >= expiresAt) {
            return getReservePrice();
        }
        uint timeElapsed = time_now - startAt;
        uint discount = discountRate * timeElapsed;
        return startingPrice - discount;
    }

    function getCurrentTokenNetWorth(
        uint time_now
    ) internal view returns (uint) {
        uint currentPrice = getPrice(time_now);
        return currentPrice * tokenQty;
    }

    function placeBid(
        uint time_now
    ) external payable onlyAfterStart onlyBeforeEnd onlyNotSeller onlyActive {
        require(block.timestamp < expiresAt, "This auction has ended");

        address bidder = msg.sender;
        uint bidValue = msg.value;
        uint price = getPrice(time_now);

        require(
            bidValue >= price,
            "The amount of ETH sent is less than the price of token"
        );

        bidQueue.enqueue(bidder, bidValue);
        emit LogBid(bidder, price);

        uint currentBidPool = bidQueue.currentBidPool();
        uint currentTokenNetWorth = getCurrentTokenNetWorth(time_now);
        if (currentBidPool >= currentTokenNetWorth) {
            endAuction(currentTokenNetWorth);
        }
    }

    function endAuction(uint tokenValue) internal onlyAfterStart onlyNotActive {
        address bidder;
        uint bidValue;
        uint pricePerToken = tokenValue / tokenQty;

        uint tokensUnallocated = tokenQty;
        while (bidQueue.length() > 0 && tokensUnallocated > 0) {
            (bidder, bidValue) = bidQueue.dequeue();
            uint qtyAllocated = min(
                tokensUnallocated,
                bidValue / pricePerToken
            );
            uint remainder = bidValue - qtyAllocated * pricePerToken;
            tokensUnallocated -= qtyAllocated;

            token.transfer(bidder, qtyAllocated);
            if (remainder > 0) {
                payable(bidder).transfer(remainder);
            }
            emit SuccessfulBid(bidder, qtyAllocated, remainder);
        }
        active = false;
        ended = true;
        seller.transfer(address(this).balance);
        emit EndOfAuction(
            block.timestamp,
            tokenQty - tokensUnallocated,
            pricePerToken
        );
    }

    function getReservePrice() public view returns (uint) {
        return startingPrice - DURATION * discountRate;
    }

    function auctionStatus(uint time_now) public returns (bool){
        if (time_now >= expiresAt) {
            endAuction(getCurrentTokenNetWorth(time_now));
        }
        return active;
    }
}
