const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StreamManager", function () {
  before(async () => {
    const [admin, payer, payee1, payee2] = await ethers.getSigners();
    this.admin = admin
    this.payer = payer
    this.payee1 = payee1
    this.payee2 = payee2

    // Deploy StreamManager
    const StreamManager = await ethers.getContractFactory("StreamManager")
    this.streamManager = await StreamManager.deploy(this.payer.address)

    // Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT")
    this.mockUSDT = await MockUSDT.deploy(
      "Mock USDT",
      "USDT",
      6
    )
  })

  it('Minting to payer succeed', async () => {
    const amount = ethers.BigNumber.from("10000000000")

    await expect(this.mockUSDT.mint(this.payer.address, amount))
      .to.emit(this.mockUSDT, "Minted")
      .withArgs(this.payer.address, amount)
    
    await expect(this.mockUSDT.mint(this.payer.address, amount))
      .to.emit(this.mockUSDT, "Minted")
      .withArgs(this.payer.address, amount)

    expect(await this.mockUSDT.balanceOf(this.payer.address)).to.equal(ethers.BigNumber.from("20000000000"))
  })

});
