//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract StreamManagerStorageV1 {
    struct OpenStream {
        address payee;
        address token;
        uint256 rate;
        uint256 terminationPeriod;
        uint256 cliffPeriod;
        uint256 createdAt;
        uint256 lastClaimedAt;
        uint256 terminatedAt;
        bool isTerminated;
    }

    ///@dev admin address
    address public admin;
    ///@dev payer address
    address public payer;
    /// @dev payee's address => instance
    mapping(address => OpenStream) public streamInstances;
    /// @dev payee's address => true/false
    mapping(address => bool) public isPayee;
    /// @dev gap for further storage expansion
    uint256[64] private __gap__;
}

abstract contract StreamManagerStorage is StreamManagerStorageV1 {}
