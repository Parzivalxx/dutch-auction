pragma solidity ^0.8.0;


library RLP {

 uint constant DATA_SHORT_START = 0x80;
 uint constant DATA_LONG_START = 0xB8;
 uint constant LIST_SHORT_START = 0xC0;
 uint constant LIST_LONG_START = 0xF8;
 
 uint constant DATA_LONG_OFFSET = 0xB7;
 uint constant LIST_LONG_OFFSET = 0xF7;


 struct RLPItem {
     uint _unsafe_memPtr;    // Pointer to the RLP-encoded bytes.
     uint _unsafe_length;    // Number of bytes. This is the full length of the string.
 }

 struct Iterator {
     RLPItem _unsafe_item;   // Item that's being iterated over.
     uint _unsafe_nextPtr;   // Position of the next item in the list.
 }

 /* Iterator */

 function next(Iterator memory self) internal view returns (RLPItem memory subItem) {
    if (hasNext(self)) {
        uint ptr = self._unsafe_nextPtr;
        uint itemLength = _itemLength(ptr);
        subItem._unsafe_memPtr = ptr;
        subItem._unsafe_length = itemLength;
        self._unsafe_nextPtr = ptr + itemLength;
    } else {
        revert("No next item");
    }
 }

 function next(Iterator memory self, bool strict) internal view returns (RLPItem memory subItem) {
     subItem = next(self);
     if (strict && !_validate(subItem)) {
        revert("Validation failed");
    }
     return;
 }

 function hasNext(Iterator memory self) internal view returns (bool) {
     RLPItem memory item = self._unsafe_item;
     return self._unsafe_nextPtr < item._unsafe_memPtr + item._unsafe_length;
 }


 function toRLPItem(bytes memory self) internal view returns (RLPItem memory) {
     uint len = self.length;
     if (len == 0) {
         return RLPItem(0, 0);
     }
     uint memPtr;
     assembly {
         memPtr := add(self, 0x20)
     }
     return RLPItem(memPtr, len);
 }

 function toRLPItem(bytes memory self, bool strict) internal view returns (RLPItem memory) {
     RLPItem memory item = toRLPItem(self);
     if (strict) {
        uint len = self.length;
        require(_payloadOffset(item) <= len, "Payload offset is greater than the length");
        require(_itemLength(item._unsafe_memPtr) == len, "Item length doesn't match the provided length");
        require(_validate(item), "Item validation failed");
    }
     return item;
 }

 function isNull(RLPItem memory self) internal view returns (bool ret) {
     return self._unsafe_length == 0;
 }

 function isList(RLPItem memory self) internal view returns (bool ret) {
     if (self._unsafe_length == 0)
         return false;
     uint memPtr = self._unsafe_memPtr;
     assembly {
         ret := iszero(lt(byte(0, mload(memPtr)), 0xC0))
     }
 }

 function isData(RLPItem memory self) internal view returns (bool ret) {
     if (self._unsafe_length == 0)
         return false;
     uint memPtr = self._unsafe_memPtr;
     assembly {
         ret := lt(byte(0, mload(memPtr)), 0xC0)
     }
 }

 function isEmpty(RLPItem memory self) internal view returns (bool ret) {
     if(isNull(self))
         return false;
     uint b0;
     uint memPtr = self._unsafe_memPtr;
     assembly {
         b0 := byte(0, mload(memPtr))
     }
     return (b0 == DATA_SHORT_START || b0 == LIST_SHORT_START);
 }

 function items(RLPItem memory self) internal view returns (uint) {
     if (!isList(self))
         return 0;
     uint b0;
     uint memPtr = self._unsafe_memPtr;
     assembly {
         b0 := byte(0, mload(memPtr))
     }
     uint pos = memPtr + _payloadOffset(self);
     uint last = memPtr + self._unsafe_length - 1;
     uint itms;
     while(pos <= last) {
         pos += _itemLength(pos);
         itms++;
     }
     return itms;
 }

 function iterator(RLPItem memory self) internal view returns (Iterator memory it) {
     require(isList(self), "Not a list");
     uint ptr = self._unsafe_memPtr + _payloadOffset(self);
     it._unsafe_item = self;
     it._unsafe_nextPtr = ptr;
 }

 function toBytes(RLPItem memory self) internal view returns (bytes memory bts) {
     uint len = self._unsafe_length;
     if (len == 0)
         return;
     bts = new bytes(len);
     _copyToBytes(self._unsafe_memPtr, bts, len);
 }

 function toData(RLPItem memory self) internal view returns (bytes memory bts) {
     require(isData(self), "Data check failed");
     (uint rStartPos, uint len) = _decode(self);
     bts = new bytes(len);
     _copyToBytes(rStartPos, bts, len);
 }

 function toList(RLPItem memory self) internal view returns (RLPItem[] memory list) {
     require(isList(self), "should be a list");
     uint numItems = items(self);
     list = new RLPItem [](numItems);
     Iterator memory it = iterator(self);
     uint idx;
     while(hasNext(it)) {
         list[idx] = next(it);
         idx++;
     }
 }

 function toAscii(RLPItem memory self) internal view returns (string memory str) {
     require(isData(self), "Data check failed");
     (uint rStartPos, uint len) = _decode(self);
     bytes memory bts = new bytes(len);
     _copyToBytes(rStartPos, bts, len);
     str = string(bts);
 }

 function toUint(RLPItem memory self) internal view returns (uint data) {
     require(isData(self), "Data check failed");
     (uint rStartPos, uint len) = _decode(self);
     require(len <= 32, "Len should be less than or equals 32");
     if (len == 0)
         return 0;
     assembly {
         data := div(mload(rStartPos), exp(256, sub(32, len)))
     }
 }

 /// @dev Decode an RLPItem into a boolean. This will not work if the
 /// RLPItem is a list.
 /// @param self The RLPItem.
 /// @return The decoded string.
 function toBool(RLPItem memory self) internal view returns (bool data) {
     require(isData(self), "Data check failed");
     (uint rStartPos, uint len) = _decode(self);
     require(len == 1, "Len should be 1");
     uint temp;
     assembly {
         temp := byte(0, mload(rStartPos))
     }
     require(len == 1, "Len should be 1");
     return temp == 1 ? true : false;
 }


 function toByte(RLPItem memory self) internal view returns (bytes1 data) {
     require(isData(self), "Data check failed");
     (uint rStartPos, uint len) = _decode(self);
     require(len == 1, "Len should be 1");
     uint temp;
     assembly {
         temp := byte(0, mload(rStartPos))
     }
     return bytes1(temp);
 }

 /// @dev Decode an RLPItem into an int. This will not work if the
 /// RLPItem is a list.
 /// @param self The RLPItem.
 /// @return The decoded string.
 function toInt(RLPItem memory self) internal view returns (int data) {
     return int(toUint(self));
 }

 /// @dev Decode an RLPItem into a bytes32. This will not work if the
 /// RLPItem is a list.
 /// @param self The RLPItem.
 /// @return The decoded string.
 function toBytes32(RLPItem memory self) internal view returns (bytes32 data) {
     return bytes32(toUint(self));
 }

 /// @dev Decode an RLPItem into an address. This will not work if the
 /// RLPItem is a list.
 /// @param self The RLPItem.
 /// @return The decoded string.
 function toAddress(RLPItem memory self) internal view returns (address data) {
     require(isData(self), "Data check failed");
     (uint rStartPos, uint len) = _decode(self);
     require(len == 20, "Length check failed");
     assembly {
         data := div(mload(rStartPos), exp(256, 12))
     }
 }

 // Get the payload offset.
 function _payloadOffset(RLPItem memory self) private view returns (uint) {
     if(self._unsafe_length == 0)
         return 0;
     uint b0;
     uint memPtr = self._unsafe_memPtr;
     assembly {
         b0 := byte(0, mload(memPtr))
     }
     if(b0 < DATA_SHORT_START)
         return 0;
     if(b0 < DATA_LONG_START || (b0 >= LIST_SHORT_START && b0 < LIST_LONG_START))
         return 1;
     if(b0 < LIST_SHORT_START)
         return b0 - DATA_LONG_OFFSET + 1;
     return b0 - LIST_LONG_OFFSET + 1;
 }

 // Get the full length of an RLP item.
 function _itemLength(uint memPtr) private view returns (uint len) {
     uint b0;
     assembly {
         b0 := byte(0, mload(memPtr))
     }
     if (b0 < DATA_SHORT_START)
         len = 1;
     else if (b0 < DATA_LONG_START)
         len = b0 - DATA_SHORT_START + 1;
     else if (b0 < LIST_SHORT_START) {
         assembly {
             let bLen := sub(b0, 0xB7) // bytes length (DATA_LONG_OFFSET)
             let dLen := div(mload(add(memPtr, 1)), exp(256, sub(32, bLen))) // data length
             len := add(1, add(bLen, dLen)) // total length
         }
     }
     else if (b0 < LIST_LONG_START)
         len = b0 - LIST_SHORT_START + 1;
     else {
         assembly {
             let bLen := sub(b0, 0xF7) // bytes length (LIST_LONG_OFFSET)
             let dLen := div(mload(add(memPtr, 1)), exp(256, sub(32, bLen))) // data length
             len := add(1, add(bLen, dLen)) // total length
         }
     }
 }

 // Get start position and length of the data.
 function _decode(RLPItem memory self) private view returns (uint memPtr, uint len) {
     require(isData(self), "Data check failed");
     uint b0;
     uint start = self._unsafe_memPtr;
     assembly {
         b0 := byte(0, mload(start))
     }
     if (b0 < DATA_SHORT_START) {
         memPtr = start;
         len = 1;
         return;
     }
     if (b0 < DATA_LONG_START) {
         len = self._unsafe_length - 1;
         memPtr = start + 1;
     } else {
         uint bLen;
         assembly {
             bLen := sub(b0, 0xB7) // DATA_LONG_OFFSET
         }
         len = self._unsafe_length - 1 - bLen;
         memPtr = start + bLen + 1;
     }
     return;
 }

 // Assumes that enough memory has been allocated to store in target.
 function _copyToBytes(uint btsPtr, bytes memory tgt, uint btsLen) private view {
     // Exploiting the fact that 'tgt' was the last thing to be allocated,
     // we can write entire words, and just overwrite any excess.
    assembly {
        let i := 0 // Start at arr + 0x20
        let words := div(add(btsLen, 31), 32)
        let rOffset := btsPtr
        let wOffset := add(tgt, 0x20)
    
    for { } neq(i, words) { } {
        let offset := mul(i, 0x20)
        mstore(add(wOffset, offset), mload(add(rOffset, offset)))
        i := add(i, 1)
    }

    mstore(add(tgt, add(0x20, mload(tgt))), 0)
    }
 }

     // Check that an RLP item is valid.
function _validate(RLPItem memory self) private view returns (bool ret) {
         // Check that RLP is well-formed.
         uint b0;
         uint b1;
         uint memPtr = self._unsafe_memPtr;
         assembly {
             b0 := byte(0, mload(memPtr))
             b1 := byte(1, mload(memPtr))
         }
         if(b0 == DATA_SHORT_START + 1 && b1 < DATA_SHORT_START)
             return false;
         return true;
     }
}
