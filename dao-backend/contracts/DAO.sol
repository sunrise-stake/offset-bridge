// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

interface INFTMarketplace {
    /// @dev getPrice() returns the price of an NFT from the NFTMarketplace
    /// @return Returns the price in Wei for an NFT
    function getPrice() external view returns (uint256);

    /// @dev available() returns whether or not the given _tokenId has already been purchased
    /// @return Returns a boolean value - true if available, false if not
    function available(uint256 _tokenId) external view returns (bool);

    /// @dev purchase() purchases an NFT from the NFTMarketplace
    /// @param _tokenId - the NFT tokenID to purchase
    function purchase(uint256 _tokenId) external payable;
}

interface IanNFT {
    /// @dev balanceOf returns the number of NFTs owned by the given address
    /// @param owner - address to fetch number of NFTs for
    /// @return Returns the number of NFTs owned
    function balanceOf(address owner) external view returns (uint256);

    /// @dev tokenOfOwnerByIndex returns a tokenID at given index for owner
    /// @param owner - address to fetch the NFT TokenID for
    /// @param index - index of NFT in owned tokens array to fetch
    /// @return Returns the TokenID of the NFT
    function tokenOfOwnerByIndex(
        address owner,
        uint256 index
    ) external view returns (uint256);
}

contract TheBasicDAO is Ownable {
    struct Proposal {
        // nftTokenId - the tokenID of the NFT to purchase from NFTMarketplace if the proposal passes
        uint256 nftTokenId;
        // deadline - the UNIX timestamp until which this proposal is active. Proposal can be executed after the deadline has been exceeded.
        uint256 deadline;
        // yesVotes - number of Yes votes for this proposal
        uint256 yesVotes;
        // noVotes - number of No votes for this proposal
        uint256 noVotes;
        // executed - whether or not this proposal has been executed yet. Cannot be executed before the deadline has been exceeded.
        bool executed;
        // voters - a mapping of NFT tokenIDs to booleans indicating whether that NFT has already been used to cast a vote or not
        mapping(uint256 => bool) voters;
    }

    enum Vote {
        Yes,
        No
    }
    // Create a mapping of ID to Proposal
    mapping(uint256 => Proposal) public proposals;
    // Number of proposals that have been created
    uint256 public numProposals;

    INFTMarketplace nftMarketplace;
    IanNFT anNFT;

    constructor(address _nftMarketplace, address _anNFT) payable {
        nftMarketplace = INFTMarketplace(_nftMarketplace);
        anNFT = IanNFT(_anNFT);
    }

    modifier nftHolderOnly() {
        require(anNFT.balanceOf(msg.sender) > 0, "Not a DAO member");
        _;
    }

    // Active proposals whose deadline is positive & has not been exceeded
    modifier activeProposal(uint256 index) {
        require(
            proposals[index].deadline > block.timestamp,
            "Proposal is not active"
        );
        _;
    }

    // Inactive proposals whose deadline has been exceeded but have not been executed yet by a member
    modifier inactiveProposalOnly(uint256 proposalIndex) {
        require(
            proposals[proposalIndex].deadline <= block.timestamp,
            "Deadline has not been exceeded"
        );
        require(
            proposals[proposalIndex].executed == false,
            "Proposal has already been executed"
        );
        _;
    }

    /// @dev createProposal creates a new proposal to purchase an NFT from the NFTMarketplace
    /// @param _nftTokenId - the tokenID of the NFT to purchase from NFTMarketplace if the proposal passes
    /// @return Returns the index of the newly created proposal in the proposals array
    function createProposal(
        uint256 _nftTokenId
    ) external nftHolderOnly returns (uint256) {
        // Check if the NFT is available for purchase
        require(
            nftMarketplace.available(_nftTokenId),
            "NFT cannot be purchased"
        );
        // Get Proposal and check if it already exists
        Proposal storage proposal = proposals[_nftTokenId];
        require(proposal.deadline == 0, "Proposal already exists");
        // Set the proposal details
        proposal.nftTokenId = _nftTokenId;
        proposal.deadline = block.timestamp + 5 minutes;

        numProposals += 1;
        return numProposals - 1;
    }

    /// @dev voteOnProposal allows an NFT holder to cast their vote on an active proposal
    /// @param _proposalIndex - the index of the proposal to vote on in the proposals array
    /// @param _vote - the type of vote they want to cast
    function voteOnProposal(
        uint256 _proposalIndex,
        Vote _vote
    ) external nftHolderOnly activeProposal(_proposalIndex) {
        Proposal storage proposal = proposals[_proposalIndex];
        uint256 numberOfNFTs = anNFT.balanceOf(msg.sender);
        uint256 numberOfVotes = 0;

        // Iterate through all the NFTs owned by the sender and add up the votes
        for (uint256 i = 0; i <= numberOfNFTs; i++) {
            uint256 nftTokenId = anNFT.tokenOfOwnerByIndex(msg.sender, i);
            if (!proposal.voters[nftTokenId]) {
                proposal.voters[nftTokenId] = true;
                numberOfVotes++;
            }
        }

        require(numberOfVotes > 0, "No new votes were obtained");

        if (_vote == Vote.Yes) {
            proposal.yesVotes += numberOfVotes;
        } else {
            proposal.noVotes += numberOfVotes;
        }
    }

    /// @dev executeProposal allows a member to execute a proposal after the deadline has been exceeded
    /// @param _proposalIndex - the index of the proposal to execute in the proposals array
    function executeProposal(
        uint256 _proposalIndex
    ) external nftHolderOnly inactiveProposalOnly(_proposalIndex) {
        Proposal storage proposal = proposals[_proposalIndex];
        // Check if the proposal has passed
        require(
            proposal.yesVotes > proposal.noVotes,
            "Proposal has not passed"
        );
        // Execute the proposal
        uint256 nftPrice = nftMarketplace.getPrice();
        require(address(this).balance >= nftPrice, "Insufficient funds");
        nftMarketplace.purchase{value: nftPrice}(proposal.nftTokenId);
        proposal.executed = true;
    }

    /// @dev withdrawEther allows the contract owner (deployer) to withdraw the ETH from the contract
    function withdrawEther() external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "Contract is empty");
        (bool sent, ) = payable(owner()).call{value: amount}("");
        require(sent, "Failed to withdraw Ether");
    }

    // Allow the contract to receive ETH
    receive() external payable {}

    fallback() external payable {}
}
