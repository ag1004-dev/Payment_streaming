//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IOpenStream {
    function getTokenBanance() external view returns (uint256);

    function calculate(uint256 claimedAt) external view returns (uint256);

    function claim() external;
}
