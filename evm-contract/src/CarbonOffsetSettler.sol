// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

import "lib/openzeppelin-contracts-upgradeable/contracts/token/ERC20/IERC20Upgradeable.sol";
import "lib/OffsetHelper/contracts/interfaces/IToucanPoolToken.sol";
import "lib/OffsetHelper/contracts/interfaces/IToucanCarbonOffsets.sol";
import "src/interfaces/IUniswapV2Router02.sol";
import "lib/openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC721/IERC721Receiver.sol";
import "lib/openzeppelin-contracts-upgradeable/contracts/token/ERC721/IERC721Upgradeable.sol";
import "forge-std/console.sol";

/**
 * @notice This contract is to be used to purchase and offset carbon credits
 */
contract CarbonOffsetSettler is OwnableUpgradeable, IERC721Receiver {
    address public constant NCT = 0xD838290e877E0188a4A44700463419ED96c16107;
    address public constant CERT = 0x5e377f16E4ec6001652befD737341a28889Af002;
    address public constant USDC = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
    address public constant SUSHI_ROUTER =
        0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;

    uint public tokenId;

    /**
     * Retire carbon credits from specified project for a specified amount of USDC
     * @param _tco2 Address of the project for which TCO2 will be retired
     * @param _amountUSDC Amount of USDC to be used to buy carbon credits
     * @param _entity Name of the entity who is performing the retirement
     * @param _beneficiary Address of beneficiary, to whom the retirement will be accredited
     * @param _beneficiaryName Name of beneficiary
     * @param _msg Any message to be attached to the retirement certificate
     */
    function retire(
        address _tco2,
        uint256 _amountUSDC,
        string calldata _entity,
        address _beneficiary,
        string calldata _beneficiaryName,
        string calldata _msg
    ) public {
        // 1. Swap USDC on contract into NCT.
        uint256 amountOffset = swap(_amountUSDC);

        address[] memory tco2s = new address[](1);
        tco2s[0] = _tco2;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amountOffset;

        // 2. Redeem NCT into TCO2
        uint256 tco2RedeemedBefore = IToucanCarbonOffsets(_tco2).balanceOf(
            address(this)
        );
        IToucanPoolToken(NCT).redeemMany(tco2s, amounts);

        uint256 tco2Redeemed = IToucanCarbonOffsets(_tco2).balanceOf(
            address(this)
        ) - tco2RedeemedBefore;

        // 3. Retire TCO2 and mint certificate!
        IToucanCarbonOffsets(_tco2).retireAndMintCertificate(
            _entity, // retiringEntity
            _beneficiary, // beneficiary address
            _beneficiaryName, // benficiary name
            _msg, // retirement message
            tco2Redeemed
        );
        IERC721Upgradeable(CERT).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId
        );
    }

    /**
     * @notice Called when new Toucan retirement certificate NFTs are minted.
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 newTokenId,
        bytes calldata data
    ) external returns (bytes4) {
        tokenId = newTokenId;
        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * Given a specific TCO2 and amount, return the amount of xUSDC we would need to burn after fees.
     * @param _tco2 Address of the project for which TCO2 will be retired
     * @param _amountToOffset Amount of TCO2 to offset
     */
    function getUSDCNeeded(
        address _tco2,
        uint256 _amountToOffset
    ) public view returns (uint256) {
        address[] memory tco2s = new address[](1);
        tco2s[0] = _tco2;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = _amountToOffset;

        uint256 totalFee = IToucanPoolToken(NCT).calculateRedeemFees(
            tco2s,
            amounts
        );
        uint256 totalNCTWanted = totalFee + _amountToOffset;

        address[] memory path = generatePath(USDC, NCT);
        uint256[] memory expectedAmountsIn = IUniswapV2Router02(SUSHI_ROUTER)
            .getAmountsIn(totalNCTWanted, path);

        return expectedAmountsIn[0];
    }

    /**
     * Given a specific TCO2 and amount, return the amount of NCT we would need to burn after fees.
     * @param _tco2 Address of the project for which TCO2 will be retired
     * @param _amountToOffset Amount of TCO2 to offset
     */
    function getExpectedNCT(
        address _tco2,
        uint256 _amountToOffset
    ) public view returns (uint256) {
        address[] memory tco2s = new address[](1);
        tco2s[0] = _tco2;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = _amountToOffset;

        uint256 totalFee = IToucanPoolToken(NCT).calculateRedeemFees(
            tco2s,
            amounts
        );

        address[] memory reversePath = generatePath(NCT, USDC);
        uint256[] memory expectedAmountsIn = IUniswapV2Router02(SUSHI_ROUTER)
            .getAmountsIn(totalFee + _amountToOffset, reversePath);
        return expectedAmountsIn[0];
    }

    /**
     * Find path for swapping; only support USDC <-> NCT routes
     * @param _from Address of token to be swapped from
     * @param _to Address of token to be swapped to
     */
    function generatePath(
        address _from,
        address _to
    ) internal pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = _from;
        path[1] = _to;
        return path;
    }

    /**
     * Swap USDC on contract into NCT.
     * @param _amountUSDC Amount of USDC to swap for NCT tokans
     */
    function swap(uint256 _amountUSDC) public returns (uint256) {
        IUniswapV2Router02 routerSushi = IUniswapV2Router02(SUSHI_ROUTER);
        address[] memory path = generatePath(USDC, NCT);
        uint256[] memory expectedAmountsOut = routerSushi.getAmountsOut(
            _amountUSDC,
            path
        );

        IERC20Upgradeable(USDC).approve(SUSHI_ROUTER, _amountUSDC);
        uint256[] memory amountsSwapped = routerSushi.swapExactTokensForTokens(
            _amountUSDC,
            expectedAmountsOut[0],
            path,
            address(this),
            block.timestamp
        );
        return amountsSwapped[1];
    }
}
