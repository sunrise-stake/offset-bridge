// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

import "forge-std/Test.sol";
import "src/HoldingContract.sol";
import "src/CarbonOffsetSettler.sol";
import "src/HoldingContractFactory.sol";
import "forge-std/console.sol";
import "lib/openzeppelin-contracts-upgradeable/contracts/token/ERC721/IERC721Upgradeable.sol";

contract HoldingContractTest is Test {
    HoldingContract holdingImplementation;
    CarbonOffsetSettler carbonOffsetSettler;
    HoldingContractFactory factory;
    address proxy;
    address usdc = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
    address public constant CERT = 0x5e377f16E4ec6001652befD737341a28889Af002;

    address user = address(1234);
    address tco2 = 0x463de2a5c6E8Bb0c87F4Aa80a02689e6680F72C7;
    string beneficiaryName = "0x0";
    bytes32 SolanaAccountAddress = "";

    event Offset(
        address indexed tco2,
        address indexed beneficiary,
        string beneficiaryName,
        uint256 amount
    );
    error InsufficientFunds();
    error InvalidRetireContract();

    function setUpNoProxy() public {
        // address tco2 = 0x463de2a5c6E8Bb0c87F4Aa80a02689e6680F72C7;
        // address beneficiary = address(0);
        // string memory beneficiaryName = "0x0";
        // string
        //     memory SolanaAccountAddress = "9wApiVNoU2xZ4eNrDPja2ypiiXZyNV2oy9MUxZ9TCTrq";
        // holdingImplementation = new HoldingContract();
        // carbonOffsetSettler = new CarbonOffsetSettler(
        //     address(holdingImplementation)
        // );
        // holdingImplementation.setRetireContract(address(carbonOffsetSettler));
        // // vm.prank(address(0));
        // holdingImplementation.initialize(
        //     tco2,
        //     beneficiary,
        //     beneficiaryName,
        //     SolanaAccountAddress
        // );
        // console.log("Tco2 address: %s", holdingImplementation.tco2());
    }

    function setUp() public {
        // deploy an implementation contract
        holdingImplementation = new HoldingContract();
        // deploy factory contract pointing to implementation contract
        factory = new HoldingContractFactory(address(holdingImplementation));
        carbonOffsetSettler = new CarbonOffsetSettler();
        // address(holdingImplementation)
        // holdingImplementation.setFactoryContract(address(factory));

        //deploy proxy contract
        vm.prank(user);
        proxy = factory.createContract(
            keccak256(abi.encode(address(user))),
            tco2,
            beneficiaryName,
            SolanaAccountAddress,
            address(carbonOffsetSettler)
        );
    }

    function test_proxy_setup() public {
        assertEq(HoldingContract(proxy).beneficiary(), proxy);
        assertEq(HoldingContract(proxy).beneficiaryName(), beneficiaryName);
        assertEq(HoldingContract(proxy).tco2(), tco2);
        assertEq(
            HoldingContract(proxy).SolanaAccountAddress(),
            SolanaAccountAddress
        );
        assertEq(
            HoldingContract(proxy).retireContract(),
            address(carbonOffsetSettler)
        );
    }

    function test_proxy_call() public {
        assertEq(HoldingContract(proxy).beneficiary(), proxy);

        // user calls createContract
        vm.prank(user);
        HoldingContract(proxy).setBeneficiary(user, "Sunrise");
        assertEq(HoldingContract(proxy).beneficiary(), user);
    }

    function test_proxy_multiple() public {
        // test with multiple proxies

        // new user proxy
        vm.startPrank(address(146));
        proxy = factory.createContract(
            keccak256(abi.encode(address(146))),
            tco2,
            beneficiaryName,
            SolanaAccountAddress,
            address(carbonOffsetSettler)
        );
        HoldingContract(proxy).setBeneficiary(address(146), "Solana");
        assertEq(HoldingContract(proxy).beneficiary(), address(146));
        IERC721Upgradeable cert = IERC721Upgradeable(CERT);

        deal(usdc, proxy, 100 * 1e6);

        HoldingContract(proxy).offset("entity", "msg");
        assertEq(IERC20(usdc).balanceOf(proxy), 0);
        assertEq(cert.balanceOf(proxy), 1);
        // deal(usdc, proxy, 100 * 1e6);
        // HoldingContract(proxy).offset("2nd entity", "msg");
        // assertEq(cert.balanceOf(proxy), 2);

        vm.stopPrank();

        // user calls createContract
        vm.startPrank(address(6143));
        proxy = factory.createContract(
            keccak256(abi.encode(address(6143))),
            tco2,
            beneficiaryName,
            SolanaAccountAddress,
            address(carbonOffsetSettler)
        );
        HoldingContract(proxy).setBeneficiary(address(6143), "Solana");
        assertEq(HoldingContract(proxy).beneficiary(), address(6143));
        deal(usdc, proxy, 100 * 1e6);

        HoldingContract(proxy).offset("entity", "msg");
        assertEq(IERC20(usdc).balanceOf(proxy), 0);
        assertEq(cert.balanceOf(proxy), 1);
        vm.stopPrank();
    }

    function test_revert_ProxyOwnerAuthorizatioN() public {
        vm.expectRevert("Ownable: caller is not the owner");
        HoldingContract(proxy).setBeneficiary(address(0), "Sunrise");
    }

    function test_Offset() public {
        // fund holding contract with USDC
        uint amount = 100 * 1e6;
        deal(usdc, proxy, amount);
        // vm.prank(0x19aB546E77d0cD3245B2AAD46bd80dc4707d6307);
        // usdc.call(
        //     abi.encodeWithSignature(
        //         "transfer(address,uint256)",
        //         address(holdingContract),
        //         amount
        //     )
        // );
        // check balances
        IERC721Upgradeable cert = IERC721Upgradeable(CERT);
        assertEq(cert.balanceOf(proxy), 0);
        assertEq(IERC20(usdc).balanceOf(proxy), 100 * 1e6);

        // Call offset and emit event

        vm.expectEmit(true, true, true, true);
        emit Offset(
            HoldingContract(proxy).tco2(),
            HoldingContract(proxy).beneficiary(),
            HoldingContract(proxy).beneficiaryName(),
            amount
        );
        vm.prank(user);
        HoldingContract(proxy).offset("entity", "msg");
        assertEq(IERC20(usdc).balanceOf(proxy), 0);
        assertEq(cert.balanceOf(proxy), 1);
    }

    function test_revert_Offset_insufficientFunds() public {
        vm.expectRevert(InsufficientFunds.selector);
        vm.prank(user);
        HoldingContract(proxy).offset("entity", "msg");
    }

    function test_revert_Offset_invalidRetireContract() public {
        vm.expectRevert(InvalidRetireContract.selector);
        vm.prank(user);
        HoldingContract(proxy).setRetireContract(address(0));
    }

    function test_setRetirementDetails() public {
        // Set new retirement details
        address newBeneficiary = 0xFed3CfC8Ea0bF293e499565b8ccdD46ff8B37Ccb;
        string memory newBeneficiaryName = "Sunrise Stake";
        vm.prank(user);
        HoldingContract(proxy).setBeneficiary(
            newBeneficiary,
            newBeneficiaryName
        );

        // Fund holding contract with USDC
        uint amount = 100 * 1e6;
        deal(usdc, proxy, amount);
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
            HoldingContract(proxy).tco2(),
            newBeneficiary,
            newBeneficiaryName,
            amount
        );
        vm.prank(user);
        HoldingContract(proxy).offset(
            "Sunrise",
            "Climate-Positive Staking on Solana"
        );
    }

    function test_setSolana() public {
        bytes32 newSolanaAccountAddress = "943b9";
        vm.startPrank(user);
        HoldingContract(proxy).setSolanaAccountAddress(newSolanaAccountAddress); // this one passes
        // HoldingContract(proxy).bridgeToAddress(4010, newSolanaAccountAddress); // this one calls setSolanaAddress from the contract address
        vm.stopPrank();
    }

    function test_bridge() public {
        uint amount = 100 * 1e6;
        deal(usdc, proxy, amount);
        vm.startPrank(user);
        HoldingContract(proxy).offset("entity", "msg");
        HoldingContract(proxy).bridgeToAddress(4054, SolanaAccountAddress);
        IERC721Upgradeable cert = IERC721Upgradeable(CERT);

        assertEq(cert.balanceOf(proxy), 0);
    }
}
