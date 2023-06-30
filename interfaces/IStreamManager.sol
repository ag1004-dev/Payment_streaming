//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IStreamManager {
    function createOpenStream(
        address _payee,
        address _token,
        uint256 _amount,
        uint256 _rate,
        uint256 _terminationPeriod
    ) external;
}
