//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IStreamManager {
    function createOpenStream(
        address _payee,
        address _token,
        uint256 _rate,
        uint256 _terminationPeriod,
        uint256 _cliffPeriod
    ) external;
    
    function claim() external;

    function terminate(address _payee) external;

    function deposit(address _token, uint256 _amount) external;

    function accumulation(address _payee) external view returns(uint256);
}
