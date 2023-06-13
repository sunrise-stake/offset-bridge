// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

import "src/CarbonOffsetSettler.sol";
import "forge-std/console.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

import "forge-std/console.sol";

import "src/interfaces/INFTBridge.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "lib/openzeppelin-contracts/contracts/utils/Counters.sol";

contract HoldingContract is Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _nonce;

    // Retirement contract (mundo CarbonOffsetSettler)
    address public retireContract;
    // Retirement details
    address public tco2;
    address public beneficiary;
    string public beneficiaryName;
    string public SolanaAccountAddress;

    // Wormhole bridge
    address private bridge = 0x51a02d0dcb5e52F5b92bdAA38FA013C91c7309A9;
    // mainnet 0x90BBd86a6Fe93D3bc3ed6335935447E75fAb7fCf
    // Toucan Retirement Certificate Contract
    address public certificate = 0x5e377f16E4ec6001652befD737341a28889Af002;

    // USDC token contract
    address private usdc = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;

    // Event emitted when funds are used to offset emissions
    event Offset(
        address indexed tco2,
        address indexed beneficiary,
        string beneficiaryName,
        uint256 amount
    );

    // Errors
    error InsufficientFunds();
    error InvalidRetireContract();

    constructor(
        address newTco2,
        address newBeneficiary,
        string memory newBeneficiaryName,
        string memory newSolanaAccountAddress
    ) {
        tco2 = newTco2;
        beneficiary = newBeneficiary;
        beneficiaryName = newBeneficiaryName;
        SolanaAccountAddress = newSolanaAccountAddress;
    }

    /*
     * @notice Set the address of the CarbonOffsetSettler contract
     * @param newRetireContract address of the CarbonOffsetSettler contract
     */
    function setRetireContract(address newRetireContract) external onlyOwner {
        if (newRetireContract == address(0)) revert InvalidRetireContract();
        retireContract = newRetireContract;
    }

    // ------------------ Setting retirement details (admin-only, ensure valid values) ------------------ //

    /*
     * @notice Set the details for the beneficiary of the carbon offset
     * @param newBeneficiary address of the beneficiary (in case you're retiring for someone else)
     * @param newBeneficiaryName name of the beneficiary
     */
    function setBeneficiary(
        address newBeneficiary,
        string calldata newBeneficiaryName
    ) external onlyOwner {
        beneficiary = newBeneficiary;
        beneficiaryName = newBeneficiaryName;
    }

    /*
     * @notice Set the address of the TCO2 token contract
     * @param newTco2 address of the TCO2 token contract
     */
    function setTCO2(address newTco2) external onlyOwner {
        tco2 = newTco2;
    }

    /*
     * @notice Set the Solana Account that receives the retirement certificate
     * @dev This is read out to calculate the associated token account for the Wormhole message
     * @param newSolanaAccountAddress address of the Solana Account
     */
    function setSolanaAccountAddress(
        string calldata newSolanaAccountAddress
    ) external onlyOwner {
        SolanaAccountAddress = newSolanaAccountAddress;
    }

    // --------------------------------- Permissionless retiring --------------------------------------- //
    /*
     * @notice Offset carbon emissions by sending USDC to the CarbonOffsetSettler contract and using the funds to retire carbon tokens.
     * @param entity name of the entity that does the retirement (Sunrise Stake)
     * @param message retirement message
     */
    function offset(string calldata entity, string calldata message) external {
        if (IERC20(usdc).balanceOf(address(this)) == 0)
            revert InsufficientFunds();
        IERC20 usdcToken = IERC20(usdc);
        uint256 usdcBalance = usdcToken.balanceOf(address(this));
        usdcToken.transfer(retireContract, usdcBalance);
        CarbonOffsetSettler(retireContract).retire(
            tco2,
            usdcBalance,
            entity,
            beneficiary,
            beneficiaryName,
            message
        );

        emit Offset(tco2, beneficiary, beneficiaryName, usdcBalance);
    }

    // --------------------------------- Permissionless bridging using Wormhole --------------------------------------- //
    function bridgeNFT(
        uint256 tokenId,
        bytes32 recipient
    ) external returns (uint256 sequence) {
        address nft = 0xC15133D0Fc527AD38eaB2627ee89FD8faf728859;
        uint32 nonce = uint32(_nonce.current());
        _nonce.increment();
        ERC721(nft).approve(bridge, tokenId);
        sequence = INFTBridge(bridge).transferNFT(
            nft,
            tokenId,
            1, //Solana Chain ID
            recipient, // recipient
            nonce
        );
    }

    function stringToBytes32(
        string memory str
    ) public pure returns (bytes32 result) {
        bytes memory strBytes = bytes(str);
        assembly {
            result := mload(add(strBytes, 32))
        }
    }
}
