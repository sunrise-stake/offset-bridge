// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {Proxy} from "@openzeppelin/contracts/proxy/Proxy.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

// minimal proxy contract after EIP-1167 that delegates all calls to the implementation contract
contract HoldingContractProxy is Proxy, Ownable {
    // Factory contract address
    address public logicContract;

    // // nonce for sending the wormhole message
    // using Counters for Counters.Counter;
    // Counters.Counter private _nonce;
    // // Retirement details specific to the Holding Contract owner
    // address public tco2;
    // address public beneficiary;
    // string public beneficiaryName;
    // string public SolanaAccountAddress;

    function _implementation() internal view override returns (address) {
        return logicContract;
    }
}
