//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/IOpenStream.sol";

contract OpenStream is ReentrancyGuard, IOpenStream {
    using SafeERC20 for IERC20;

    event TokensClaimed(uint256);

    ///@dev payee address
    address public payee;
    ///@dev token address; USDC or USDT
    address public token;
    ///@dev monthly rate for payee
    uint256 public rate;
    ///@dev time which the instance created
    uint256 public createdAt;
    ///@dev time which the payee claimed lastly
    uint256 public lastClaimedAt;
    ///@dev flag indicating the contract's activation status.
    /// If `isClaimable` is `true`, the contract is considered active and ready for use.
    /// If `isClaimable` is `false`, the contract is considered to be terminated and certain functions may be disabled.
    bool public isClaimable;

    constructor(
        address _payee,
        address _token,
        uint256 _rate,
        bool _isClaimable
    ) ReentrancyGuard() {
        payee = _payee;
        token = _token;
        rate = _rate;
        createdAt = block.timestamp;
        lastClaimedAt = createdAt;
        isClaimable = _isClaimable;
    }
    
    ///@dev it gets token balance of the smart contract.
    function getTokenBanance() public view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    ///@dev it gets token address of the smart contract.
    function getTokenAddress() public view returns (address) {
        return token;
    }

    ///@dev changes `isClaimable` status into `false/true`.
    function setClaimable(bool _isClaimable) public {
        isClaimable = _isClaimable;
    }

    ///@dev it calculates redeemed amount.
    function calculate(uint256 claimedAt) public view returns (uint256) {
        uint256 elapsed = claimedAt - lastClaimedAt;
        return elapsed * rate / 30 / 24 / 3600;
    }

    ///@dev payee can claim tokens which is proportional to elapsed time (exactly seconds).`
    function claim() external nonReentrant {
        uint256 claimedAt = block.timestamp;
        require(payee == msg.sender, "OpenStream: Only registered payee can claim tokens");
        require(isClaimable == true, "OpenStream: Stream is canceled and not claimable anymore");

        uint256 balance = getTokenBanance();
        uint256 redeemedAmount = calculate(claimedAt);
        require(balance >= redeemedAmount, "OpenStream: Not enough balance");

        IERC20(token).safeTransferFrom(address(this), msg.sender, redeemedAmount);
        lastClaimedAt = claimedAt;

        emit TokensClaimed(redeemedAmount);
    }

}
