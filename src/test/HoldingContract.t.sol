// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

import "forge-std/Test.sol";
import "src/HoldingContract.sol";
import "src/CarbonOffsetSettler.sol";
import "forge-std/console.sol";
import "lib/openzeppelin-contracts-upgradeable/contracts/token/ERC721/IERC721Upgradeable.sol";

contract HoldingContractTest is Test {
    HoldingContract holdingContract;
    CarbonOffsetSettler carbonOffsetSettler;
    address usdc = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
    address public constant CERT = 0x5e377f16E4ec6001652befD737341a28889Af002;

    event Offset(
        address indexed tco2,
        address indexed beneficiary,
        string beneficiaryName,
        uint256 amount
    );
    error InsufficientFunds();
    error InvalidRetireContract();

    function setUp() public {
        address tco2 = 0x463de2a5c6E8Bb0c87F4Aa80a02689e6680F72C7;
        address beneficiary = address(0);
        string memory beneficiaryName = "0x0";
        holdingContract = new HoldingContract(
            tco2,
            beneficiary,
            beneficiaryName
        );
        carbonOffsetSettler = new CarbonOffsetSettler(address(holdingContract));
        holdingContract.setRetireContract(address(carbonOffsetSettler));
        console.log("Tco2 address: %s", holdingContract.tco2());
    }

    function test_Offset() public {
        // fund holding contract with USDC
        uint amount = 100 * 1e6;
        deal(usdc, address(holdingContract), amount);
        // vm.prank(0x19aB546E77d0cD3245B2AAD46bd80dc4707d6307);
        // usdc.call(
        //     abi.encodeWithSignature(
        //         "transfer(address,uint256)",
        //         address(holdingContract),
        //         amount
        //     )
        // );

        // Call offset and emit event
        IERC721Upgradeable cert = IERC721Upgradeable(CERT);
        assertEq(cert.balanceOf(address(holdingContract)), 0);

        assertEq(IERC20(usdc).balanceOf(address(holdingContract)), 100 * 1e6);

        vm.expectEmit(true, true, true, true);
        emit Offset(
            holdingContract.tco2(),
            holdingContract.beneficiary(),
            holdingContract.beneficiaryName(),
            amount
        );
        holdingContract.offset("entity", "msg");
        assertEq(IERC20(usdc).balanceOf(address(holdingContract)), 0);
        assertEq(cert.balanceOf(address(holdingContract)), 1);
    }

    function test_revert_Offset_insufficientFunds() public {
        vm.expectRevert(InsufficientFunds.selector);
        holdingContract.offset("entity", "msg");
    }

    function test_revert_Offset_invalidRetireContract() public {
        vm.expectRevert(InvalidRetireContract.selector);
        holdingContract.setRetireContract(address(0));
    }

    function test_setRetirementDetails() public {
        // Set new retirement details
        address newBeneficiary = 0xFed3CfC8Ea0bF293e499565b8ccdD46ff8B37Ccb;
        string memory newBeneficiaryName = "Sunrise Stake";
        holdingContract.setBeneficiary(newBeneficiary, newBeneficiaryName);

        // Fund holding contract with USDC
        uint amount = 100 * 1e6;
        deal(usdc, address(holdingContract), amount);
        // vm.prank(0x19aB546E77d0cD3245B2AAD46bd80dc4707d6307);
        // usdc.call(
        //     abi.encodeWithSignature(
        //         "transfer(address,uint256)",
        //         address(holdingContract),
        //         amount
        //     )
        // );

        // Call offset and emit event with new details
        vm.expectEmit(true, true, true, true);
        emit Offset(
            holdingContract.tco2(),
            newBeneficiary,
            newBeneficiaryName,
            amount
        );
        holdingContract.offset("Sunrise", "Climate-Positive Staking on Solana");
    }

    function test_revert_setRetirementDetails_onlyOwner() public {
        vm.prank(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
        vm.expectRevert("Ownable: caller is not the owner");
        holdingContract.setBeneficiary(address(0), "0x0");
    }
}
