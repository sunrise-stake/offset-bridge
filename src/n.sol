// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address public owner;

    constructor() ERC721("ContractNftTest", "CNT") {
        owner = msg.sender;
    }

    function createToken() public returns (uint) {
        require(_tokenIds.current() < 10000, "No more NFTs can be minted");
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        string
            memory tokenURI = "https://ipfs.io/ipfs/QmTBFrmexeAHbBMgrD81NXRretDAu9MHj5mfqW8rDm5ssf/metadata/2.json";

        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        return newItemId;
    }
}
