// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

struct Bid {
    address bidder;
    uint bidValue;
}

contract Queue {
    mapping(uint256 => Bid /* or any other type */) public _queue;
    uint256 public first;
    uint256 public last;
    uint256 public bidPool;

    constructor() {
        first = 1;
        last = 1;
        bidPool = 0;
    }

    function enqueue(address _bidAddr, uint _bidValue) public {
        _queue[last] = Bid(_bidAddr, _bidValue);
        console.log("enqueu", last, _queue[last].bidder, _queue[last].bidValue);
        last += 1;
        bidPool += _bidValue;
    }

    function dequeue() public returns (address, uint) {
        Bid memory bid;
        require(last > first);
        console.log("deq", first, _queue[first].bidder, _queue[first].bidValue);
        bid = _queue[first];
        delete _queue[first];
        address addr = bid.bidder;
        uint bidValue = bid.bidValue;

        // update states
        bidPool -= bidValue;
        first += 1;

        return (addr, bidValue);
    }

    function length() public view returns (uint256) {
        return last - first;
    }

    function currentBidPool() public view returns (uint256) {
        return bidPool;
    }
}
