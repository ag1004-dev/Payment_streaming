//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/IOpenStream.sol";

contract OpenStream is ReentrancyGuard, IOpenStream {
    using SafeERC20 for IERC20;

    event TokensClaimed(uint256);
    event StreamTerminated();

    error CliffPeriodIsNotEnded();
    error NotPayee();
    error NotPayer();
    error UnClaimable();
    error CanNotClaimAnyMore();
    error InsufficientBalance();
    error AlreadyTerminatedOrTerminating();

    ///@dev admin address
    address public admin;
    ///@dev payer address
    address public payer;
    ///@dev payee address
    address public payee;
    ///@dev token address; USDC or USDT
    address public token;
    ///@dev monthly rate for payee
    uint256 public rate;
    ///@dev termination period
    uint256 public terminationPeriod;
    ///@dev cliff period
    uint256 public cliffPeriod;
    ///@dev time which the instance created
    uint256 public createdAt;
    ///@dev time which the payee claimed lastly
    uint256 public lastClaimedAt;
    ///@dev time which the stream instance is terminated
    uint256 public terminatedAt;
    ///@dev flag indicating the contract's activation status.
    /// If `isClaimable` is `true`, the contract is considered active and ready for use.
    /// If `isClaimable` is `false`, the contract is considered to be terminated and certain functions may be disabled.
    bool public isClaimable;

    constructor(
        address _payer,
        address _payee,
        address _token,
        uint256 _rate,
        uint256 _terminationPeriod,
        uint256 _cliffPeriod,
        bool _isClaimable
    ) ReentrancyGuard() {
        payer = _payer;
        payee = _payee;
        token = _token;
        rate = _rate;
        terminationPeriod = _terminationPeriod;
        cliffPeriod = _cliffPeriod;
        createdAt = block.timestamp;
        lastClaimedAt = createdAt;
        admin = msg.sender;
        isClaimable = _isClaimable;
    }

    ///@dev check if the caller is payee
    modifier onlyPayee {
        if (payee != msg.sender) revert NotPayee();
        _;
    }

    ///@dev check if the caller is payer
    modifier onlyPayer {
        if (payer != msg.sender) revert NotPayer();
        _;
    }

    ///@dev check if the cliff period is ended
    modifier onlyAfterCliffPeriod {
        if (block.timestamp <= createdAt  + cliffPeriod) revert CliffPeriodIsNotEnded();
        _;
    }

    modifier onlyClaimable {
        if (!isClaimable) revert UnClaimable();
        _;
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
    function calculate(uint256 _claimedAt) public view returns (uint256) {
        uint256 elapsed = _claimedAt - lastClaimedAt;
        return elapsed * rate / 30 / 24 / 3600;
    }

    ///@dev payee can claim tokens which is proportional to elapsed time (exactly seconds).
    function claim()
        onlyClaimable
        onlyPayee
        onlyAfterCliffPeriod
        nonReentrant
        external
    {
        uint256 claimedAt = block.timestamp;
        uint256 claimableAmount;

        if (terminatedAt == 0 || terminatedAt != 0 && claimedAt <= terminatedAt + terminationPeriod) {
            claimableAmount = calculate(claimedAt);
        } else {
            ///@dev after the stream finished, payee can claim tokens which is accumulated until the termination period and can't claim anymore.
            if (terminatedAt + terminationPeriod <= lastClaimedAt) revert CanNotClaimAnyMore();
            claimableAmount = calculate(terminatedAt + terminationPeriod);
        }

        uint256 balance = getTokenBanance();
        uint256 protocolFee = claimableAmount / 10;
        if (balance < claimableAmount + protocolFee) revert InsufficientBalance();

        /// @dev send claimable tokens to payee
        IERC20(token).safeTransferFrom(address(this), msg.sender, claimableAmount);
        /// @dev send 10% commission to manager contract
        IERC20(token).safeTransferFrom(address(this), admin, protocolFee);
        lastClaimedAt = claimedAt;

        emit TokensClaimed(claimableAmount);
    }

    ///@dev terminate the stream instance
    function terminate() external onlyPayer {
        if (terminatedAt != 0) revert AlreadyTerminatedOrTerminating();
        terminatedAt = block.timestamp;
        emit StreamTerminated();
    }

}
