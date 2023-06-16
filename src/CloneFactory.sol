// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

/*
Bytecode of MinimalProxy.sol
3d602d80600a3d3981f3 [creation code]
63d3d373d3d3d363d73 [delegate call]
[logic contract address]
5af43d82803e903d91602b57fd5bf3 

                   20 bytes               |                 20 bytes              |           15 bytes          |
0x3d602d80600a3d3981f3363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3
*/

contract CloneFactory {
    function createClone(
        address logicContractAddress
    ) internal returns (address result) {
        bytes20 addressBytes = bytes20(logicContractAddress);
        assembly {
            // load the minimal proxy bytecode into memory
            let clone := mload(0x40) // Load free memory pointer
            mstore(
                clone,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            ) // Store bytes starting at where memory is free
            mstore(add(clone, 0x14), addressBytes) // store the address bytes (have to add to memory pointer)
            mstore(
                add(clone, 0x28),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000 // store rest of the delegate call instruction
            )
            // deploy contract with bytecode starting at clone and size 55bytes (0x37) and return address
            result := create(0, clone, 0x37)
        }
    }
}
