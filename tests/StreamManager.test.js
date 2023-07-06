const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StreamManager", function () {
  before(async () => {
    const [admin, payer, payee1, payee2] = await ethers.getSigners()
    this.admin = admin
    this.payer = payer
    this.payee1 = payee1
    this.payee2 = payee2
    this.token = '0x8ca0e144934e49f58c228013882cd4a343dc3853' // USDT on mumbai testnet

    // Deploy StreamManager
    const StreamManager = await ethers.getContractFactory("StreamManager")
    this.streamManager = await StreamManager.deploy(this.payer)
  })
});
