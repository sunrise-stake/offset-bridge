// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {Proxy} from "@openzeppelin/contracts/proxy/Proxy.sol";

// minimal proxy contract after EIP-1167 that delegates all calls to the implementation contract
contract HoldingContractProxy is Proxy {
    function _implementation() external override {}
}
