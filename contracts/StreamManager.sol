//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IStreamManager.sol";
import "./OpenStream.sol";

contract StreamManager is IStreamManager {
    using SafeERC20 for IERC20;

    /**
     * @dev New open stream event
     * @param _payer payer address
     * @param _itself open steam instance address
     */
    event OpenStreamCreated(address _payer, address _itself);

    constructor() {}

    /**
     * @dev Payer can create open stream instance with the params paying amounts of USDT or USDC
     * @param _payee payee address
     * @param _token token address; USDC or USDT
     * @param _amount USDC or USDT amount
     * @param _rate monthly rate
     * @param _terminationPeriod termination period
     */
    function createOpenStream(address _payee, address _token, uint256 _amount, uint256 _rate, uint256 _terminationPeriod) external {
        require(_payee != address(0), "Stream Manager: invalid address");
        require(_token != address(0), "Stream Manager: invalid address");
        require(_rate > 0, "Stream Manager: montly reate must be greater than zero");
        require(_amount > 0, "Stream Manager: invalid token amount");
        require(_terminationPeriod > 0, "Stream Manager: invalid termination period");

        /// @dev create a new open stream instance
        OpenStream openStreamInstance = new OpenStream(
            msg.sender,
            _payee,
            _token,
            _rate,
            _terminationPeriod
        );
        address streamInstance = address(openStreamInstance);
        /// @dev when creating an instance, it deposits stable coins(USDC or USDT)
        IERC20(_token).safeTransferFrom(msg.sender, streamInstance, _amount);

        emit OpenStreamCreated(msg.sender, streamInstance);
    }
}
