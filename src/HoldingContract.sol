// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

import "./CarbonOffsetSettler.sol";
import "forge-std/console.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract HoldingContract is Ownable {
    // Retirement contract (mundo CarbonOffsetSettler)
    address public retireContract;
    // Retirement details
    address public tco2;
    address public beneficiary;
    string public beneficiaryName;

    // USDC token contract
    address private usdc = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;

    event Offset(
        address indexed tco2,
        address indexed beneficiary,
        string beneficiaryName,
        uint256 amount
    );

    constructor(
        address newTco2,
        address newBeneficiary,
        string memory newBeneficiaryName
    ) public {
        tco2 = newTco2;
        beneficiary = newBeneficiary;
        beneficiaryName = newBeneficiaryName;
    }

    function setRetireContract(address newRetireContract) external onlyOwner {
        retireContract = newRetireContract;
    }

    function setBeneficiary(
        address newBeneficiary,
        string calldata newBeneficiaryName
    ) external onlyOwner {
        beneficiary = newBeneficiary;
        beneficiaryName = newBeneficiaryName;
    }

    function setTCO2(address newTco2) external onlyOwner {
        tco2 = newTco2;
    }

    function offset(string calldata entity, string calldata message) external {
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
}
