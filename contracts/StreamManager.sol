//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../interfaces/IStreamManager.sol";
import "./OpenStream.sol";

contract StreamManager is IStreamManager {
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
     * @param _rate monthly rate
     */
    function createOpenStream(address _payee, address _token, uint256 _rate) external payable {
        require(_payee != address(0), "Stream Manager: invalid address");
        require(_token != address(0), "Stream Manager: invalid address");
        require(_rate > 0, "Stream Manager: montly reate must be greater than zero");
        require(msg.value > 0, "Stream Manager: payer can't send non-zero tokens");

        /// @dev create a new open stream instance
        OpenStream openStreamInstance = new OpenStream(
            _payee,
            _token,
            _rate
        );
        address streamInstance = address(openStreamInstance);
        /// @dev when creating an instance, it deposits stable coins(USDC or USDT)
        (bool sent, ) = payable(streamInstance).call{value: msg.value}("");
        require(sent, "Stream Manager: it sent tokens successfully");

        emit OpenStreamCreated(msg.sender, streamInstance);
    }
}