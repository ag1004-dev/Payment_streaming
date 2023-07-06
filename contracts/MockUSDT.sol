// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockUSDT is ERC20, Ownable {
    event Minted(address account, uint256 amount);

    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);

        emit Minted(account, amount);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}