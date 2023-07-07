const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StreamManager", function () {
  before(async () => {
    const [admin, payer, payee1, payee2] = await ethers.getSigners();
    this.admin = admin
    this.payer = payer
    this.payee1 = payee1
    this.payee2 = payee2
    this.zero = ethers.constants.AddressZero;

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

  // Minting USDT(mock)
  it('Minting to payer succeed;', async () => {
    const amount = ethers.BigNumber.from("10000000000")

    await expect(this.mockUSDT.mint(this.payer.address, amount))
      .to.emit(this.mockUSDT, "Minted")
      .withArgs(this.payer.address, amount)
    
    await expect(this.mockUSDT.mint(this.payer.address, amount))
      .to.emit(this.mockUSDT, "Minted")
      .withArgs(this.payer.address, amount)

    expect(await this.mockUSDT.balanceOf(this.payer.address)).to.equal(ethers.BigNumber.from("20000000000"))
  })

  // Tests for `createOpenStream();`
  // Creating stream
  it('Creating an open stream instance succeed;', async () => {

    await expect(this.streamManager.createOpenStream(
      this.payee1.address,
      this.mockUSDT.address,
      1500,
      30,
      30
    ))
    .to.emit(this.streamManager, "StreamCreated")
    .withArgs(this.admin.address, this.payee1.address)
  })

  // Expercing rever with `InvalidAddress`
  it('Creating open stream instance: `_payee` and `_token` are not set as address(0);', async () => {
    // Setting `_payee` = address(0)
    await expect(
      this.streamManager.createOpenStream(
        this.zero,
        this.mockUSDT.address,
        1500,
        30,
        30
      )
    ).to.be.revertedWith('InvalidAddress');

    // Setting `_token` = address(0)
    await expect(
      this.streamManager.createOpenStream(
        this.payee1.address,
        this.zero,
        1500,
        30,
        30
      )
    ).to.be.revertedWith('InvalidAddress');
  })

  // Expercing rever with `InvalidValue`
  it('Creating an open stream instance: `_rate`, `_terminationPeriod`, `_cliffPeriod` not set how 0;', async () => {
    // Setting `_rate` = 0
    await expect(
      this.streamManager.createOpenStream(
        this.payee1.address,
        this.mockUSDT.address,
        0,
        30,
        30
      )
    ).to.be.revertedWith('InvalidValue');

    // Setting `_terminationPeriod` = 0
    await expect(
      this.streamManager.createOpenStream(
        this.payee1.address,
        this.mockUSDT.address,
        1500,
        0,
        30
      )
    ).to.be.revertedWith('InvalidValue');

    // Setting `_cliffPeriod` = 0
    await expect(
      this.streamManager.createOpenStream(
        this.payee1.address,
        this.mockUSDT.address,
        1500,
        30,
        0
      )
    ).to.be.revertedWith('InvalidValue');
  })
});
