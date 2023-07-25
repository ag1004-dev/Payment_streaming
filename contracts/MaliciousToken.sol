// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./StreamManager.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MaliciousToken is ERC20 {
    StreamManager streamManager;

    constructor(StreamManager _streamManager)
        ERC20("Mock USDT", "USDT")
    {
        streamManager = _streamManager;
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        super.transfer(recipient, amount);
        streamManager.claim();
        return true;
    }
}