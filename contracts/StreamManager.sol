//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IStreamManager.sol";

contract StreamManager is IStreamManager, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /**
     * @dev New open stream event
     * @param _payer payer address
     * @param _payee payee address
     */
    event StreamCreated(address _payer, address _payee);
    /**
     * @dev Cancel open stream event
     * @param _payer payer address
     * @param _payee payee address
     */
    event StreamCancelled(address _payer, address _payee);
    /**
     * @dev Claim tokens
     * @param _payee payee address
     * @param _amount claimable amount
     */
    event TokensClaimed(address _payee, uint256 _amount);
    /**
     * @dev Terminated stream
     * @param _payee payee address
     */
    event StreamTerminated(address _payee);
    /**
     * @dev Deposit tokens
     * @param _token token address
     * @param _amount amount
     */
    event TokensDeposited(address _token, uint256 _amount);
    /**
     * @dev Payer changing
     * @param _payer new address  
     */
    event PayerChanging(address _payer);

    ///@dev errors
    error InvalidAddress();
    error InvalidValue();
    error CliffPeriodIsNotEnded();
    error NotPayer();
    error NotPayee();
    error NotAdmin();
    error CanNotClaimAnyMore();
    error InsufficientBalance();
    error AlreadyTerminatedOrTerminating();
    error AlreadyTerminated();
    error TerminatedInCliffPeriod();
    error OpenStreamExists();
    error StreamIsTerminating();
    error PreviousStreamHasBalance();

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

    constructor(address _payer) {
        payer = _payer;
        admin = msg.sender;
    }

    ///@dev check if the caller is payer
    modifier onlyPayer {
        if (payer != msg.sender) revert NotPayer();
        _;
    }

    ///@dev check if the payee is
    modifier onlyPayee {
        if (!isPayee[msg.sender]) revert NotPayee();
        _;
    }

    ///@dev check if the cliff period is ended
    modifier onlyAfterCliffPeriod {
        uint256 createdAt = streamInstances[msg.sender].createdAt;
        uint256 cliffPeriod = streamInstances[msg.sender].cliffPeriod;
        if (block.timestamp <= createdAt + cliffPeriod)
            revert CliffPeriodIsNotEnded();
        _;
    }

    ///@dev check if it's terminated or not
    modifier notTerminated {
        if (streamInstances[msg.sender].isTerminated)
            revert AlreadyTerminated();
        _;
    }

    ///@dev check if not terminated in cliff period
    modifier notTerminatedInCliffPeriod {
        bool isTerminated = streamInstances[msg.sender].isTerminated;
        uint256 terminatedAt = streamInstances[msg.sender].terminatedAt;
        uint256 createdAt = streamInstances[msg.sender].createdAt;
        uint256 cliffPeriod = streamInstances[msg.sender].cliffPeriod;

        if (isTerminated && terminatedAt <= createdAt + cliffPeriod)
            revert TerminatedInCliffPeriod();
        _;
    }

    ///@dev check if the admin is
    modifier onlyAdmin {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    ///@dev it calculates claimable amount.
    function calculate(address _payee, uint256 _claimedAt) private view returns (uint256) {
        if (_claimedAt < streamInstances[_payee].lastClaimedAt) return 0;
        unchecked {
            uint256 elapsed = _claimedAt - streamInstances[_payee].lastClaimedAt;
            return elapsed * streamInstances[_payee].rate / 30 / 24 / 3600;    
        }
    }

    ///@dev it gets token balance of the smart contract.
    function getTokenBanance(address _token) private view returns (uint256) {
        return IERC20(_token).balanceOf(address(this));
    }

    /**
     * @dev Payer can create open stream instance with the params paying amounts of USDT or USDC
     * @param _payee payee address
     * @param _token token address; USDC or USDT
     * @param _rate monthly rate
     * @param _terminationPeriod termination period
     * @param _cliffPeriod cliff period
     */
    function createOpenStream(
        address _payee,
        address _token,
        uint256 _rate,
        uint256 _terminationPeriod,
        uint256 _cliffPeriod
    ) external {
        if (_payee == address(0) || _token == address(0)) revert InvalidAddress();
        if (_rate == 0 || _terminationPeriod == 0 || _cliffPeriod == 0)
            revert InvalidValue();
        if (
            streamInstances[_payee].createdAt > 0 &&
            streamInstances[_payee].terminatedAt == 0
        ) revert OpenStreamExists();
        if (
            streamInstances[_payee].createdAt > 0 &&
            streamInstances[_payee].terminatedAt != 0 &&
            streamInstances[_payee].createdAt + streamInstances[_payee].cliffPeriod < streamInstances[_payee].terminatedAt &&
            streamInstances[_payee].terminatedAt + streamInstances[_payee].terminationPeriod > block.timestamp
        ) revert StreamIsTerminating();
        // checks if previous stream has balance
        if (accumulation(_payee) > 0) revert PreviousStreamHasBalance();

        /// @dev create a new open stream instance
        streamInstances[_payee] = OpenStream(
            _payee,
            _token,
            _rate,
            _terminationPeriod,
            _cliffPeriod,
            block.timestamp,
            block.timestamp + _cliffPeriod, // lastly claimed at
            0,                              // terminated at
            false                           // isTerminated
        );
        isPayee[_payee] = true;

        emit StreamCreated(msg.sender, _payee);
    }

    ///@dev payee can claim tokens which is proportional to elapsed time (exactly seconds).
    function claim()
        onlyPayee
        notTerminatedInCliffPeriod
        onlyAfterCliffPeriod
        nonReentrant
        external
    {
        uint256 claimedAt = block.timestamp;
        uint256 terminatedAt = streamInstances[msg.sender].terminatedAt;
        uint256 lastClaimedAt = streamInstances[msg.sender].lastClaimedAt;
        address token = streamInstances[msg.sender].token;
        uint256 terminationPeriod = streamInstances[msg.sender].terminationPeriod;
        bool isTerminated = streamInstances[msg.sender].isTerminated;
        uint256 claimableAmount;

        if (!isTerminated || isTerminated && claimedAt <= terminatedAt + terminationPeriod) {
            claimableAmount = calculate(msg.sender, claimedAt);
        } else {
            ///@dev after the stream finished, payee can claim tokens which is accumulated until the termination period and can't claim anymore.
            if (terminatedAt + terminationPeriod <= lastClaimedAt) revert CanNotClaimAnyMore();
            claimableAmount = calculate(msg.sender, terminatedAt + terminationPeriod);
        }

        uint256 balance = getTokenBanance(token);
        uint256 protocolFee = claimableAmount / 10;
        if (balance < claimableAmount + protocolFee) revert InsufficientBalance();

        /// @dev send claimable tokens to payee
        IERC20(token).safeTransfer(msg.sender, claimableAmount);
        /// @dev send 10% commission to manager contract
        IERC20(token).safeTransfer(admin, protocolFee);
        streamInstances[msg.sender].lastClaimedAt = claimedAt;

        emit TokensClaimed(msg.sender, claimableAmount);
    }

    /**
     * @dev terminate the stream instance
     * @param _payee payee's address
     */
    function terminate(address _payee) external onlyPayer notTerminated {
        uint256 terminatedAt = block.timestamp;
        if (!isPayee[_payee]) revert NotPayee();
        if (streamInstances[_payee].terminatedAt != 0) revert AlreadyTerminatedOrTerminating();
        streamInstances[_payee].isTerminated = true;
        streamInstances[_payee].terminatedAt = terminatedAt;

        emit StreamTerminated(_payee);
    }
    
    /**
     * @dev deposit tokens
     * @param _token token's address
     * @param _amount token amount to deposit
     */
    function deposit(address _token, uint256 _amount) external onlyPayer {
        if (_token == address(0)) revert InvalidAddress();
        if (_amount == 0) revert InvalidValue();

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        emit TokensDeposited(_token, _amount);
    }

    ///@dev shows accumulated amount in USDT or USDC
    function accumulation(address _payee) public view returns(uint256 amount) {
        if (block.timestamp <= streamInstances[_payee].createdAt + streamInstances[_payee].cliffPeriod)
            return 0;
        bool isTerminated = streamInstances[_payee].isTerminated;
        uint256 terminatedAt = streamInstances[_payee].terminatedAt;
        uint256 terminationPeriod = streamInstances[_payee].terminationPeriod;
        if (!isTerminated || isTerminated && block.timestamp <= terminatedAt + terminationPeriod) {
            amount = calculate(_payee, block.timestamp);
        } else {
            amount = calculate(_payee, terminatedAt + terminationPeriod);
        }
    }

    ///@dev changing address of the payer
    function changePayer(address _payer) public onlyAdmin {
        if (_payer == address(0)) revert InvalidAddress();
        if (_payer == payer) revert InvalidAddress();
        
        payer = _payer;
        emit PayerChanging(_payer);
    }
}
