const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("StreamManager:", function () {
  before(async () => {
    const [admin, payer, payee1, payee2, payee3, payee4, payee5, payee6] = await ethers.getSigners();
    this.admin = admin
    this.payer = payer
    this.payee1 = payee1
    this.payee2 = payee2
    this.payee3 = payee3
    this.payee4 = payee4
    this.payee5 = payee5
    this.payee6 = payee6
    this.zero = ethers.constants.AddressZero
    this.amount = 1000
    this.rate = 1500
    this.terminationPeriod = 18 * 24 * 3600; // 18 days
    this.cliffPeriod = 24 * 3600; // 24 hrs

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
      this.rate,
      this.terminationPeriod,
      this.cliffPeriod
    ))
    .to.emit(this.streamManager, "StreamCreated")
    .withArgs(this.admin.address, this.payee1.address)
  })

  // Expecting revert with `InvalidAddress`
  it('Creating open stream instance: `_payee` and `_token` are not set as address(0);', async () => {
    // Setting `_payee` = address(0)
    await expect(
      this.streamManager.createOpenStream(
        this.zero,
        this.mockUSDT.address,
        this.rate,
        this.terminationPeriod,
        this.cliffPeriod
      )
    ).to.be.revertedWith('InvalidAddress');

    // Setting `_token` = address(0)
    await expect(
      this.streamManager.createOpenStream(
        this.payee1.address,
        this.zero,
        this.rate,
        this.terminationPeriod,
        this.cliffPeriod
      )
    ).to.be.revertedWith('InvalidAddress');
  })

  // Expecting revert with `InvalidValue`
  it('Creating an open stream instance: `_rate`, `_terminationPeriod`, `_cliffPeriod` not set how 0;', async () => {
    // Setting `_rate` = 0
    await expect(
      this.streamManager.createOpenStream(
        this.payee1.address,
        this.mockUSDT.address,
        0,
        this.terminationPeriod,
        this.cliffPeriod
      )
    ).to.be.revertedWith('InvalidValue');

    // Setting `_terminationPeriod` = 0
    await expect(
      this.streamManager.createOpenStream(
        this.payee1.address,
        this.mockUSDT.address,
        this.rate,
        0,
        this.cliffPeriod
      )
    ).to.be.revertedWith('InvalidValue');

    // Setting `_cliffPeriod` = 0
    await expect(
      this.streamManager.createOpenStream(
        this.payee1.address,
        this.mockUSDT.address,
        this.rate,
        this.terminationPeriod,
        0
      )
    ).to.be.revertedWith('InvalidValue');
  })

  // Expecting revert with `OpenStreamExists`
  it('Creating open stream instance: Previous stream has not been ended', async () => {
    await expect(this.streamManager.createOpenStream(
      this.payee1.address,
      this.mockUSDT.address,
      this.rate,
      this.terminationPeriod,
      this.cliffPeriod
    )).to.be.revertedWith('OpenStreamExists');
  })

  // Tests for `deposit();`
  // Deposit USDT(mock)
  it('Deposit succeed;', async () => {

    await this.mockUSDT.mint(this.payer.address, this.amount)

    await this.mockUSDT.connect(this.payer).approve(this.streamManager.address, this.amount)

    await expect(
      this.streamManager.connect(this.payer).deposit(
      this.mockUSDT.address,
      this.amount
    ))
    .to.emit(this.streamManager, "TokensDeposited")
    .withArgs(this.mockUSDT.address, this.amount)

    expect(await this.mockUSDT.balanceOf(this.streamManager.address)).to.equal(this.amount)
  })

  // Expecting revert with `InvalidAddress`
  it('Deposit: `_token` not set how address(0);', async () => {
    // Setting `_token` = address(0)
    await expect(
      this.streamManager.connect(this.payer).deposit(
      this.zero,
      this.amount
    ))
    .to.be.revertedWith('InvalidAddress');
  })

  // Expecting revert with `InvalidValue`
  it('Deposit: `_amount` not set how 0;', async () => {
    // Setting `_amount` = 0
    await expect(
      this.streamManager.connect(this.payer).deposit(
      this.mockUSDT.address,
      0
    ))
    .to.be.revertedWith('InvalidValue');
  })

  // Expecting revert with `NotPayer`
  it('Deposit: only payer can call this function;', async () => {
    // Calling from other address
    await expect(
      this.streamManager.connect(this.payee1).deposit(
      this.mockUSDT.address,
      this.amount
    ))
    .to.be.revertedWith('NotPayer');
  })

  // Returning 0, because the current timestamp is less than the sum of the stream creation time and the "cliff" period 
  it('Accumulated: timestamp not less than the sum of the stream creation time and the "cliff" period;', async () => {
    // Calling the `accumulation();`
    const accumulatedAmount = await this.streamManager.accumulation(this.payee1.address)

    expect(accumulatedAmount).to.equal(0)
  });

  // Tests for `accumulation();`
  // Amount is accumulated
  it('Return accumulated amount;', async () => {
    // Setting timestamp
    const currentTimestamp = 2 * 24 * 3600
    const claimablePeriod = currentTimestamp - this.cliffPeriod
    await time.increase(currentTimestamp); // + 2 days

    // Calling the `accumulation();`
    const accumulatedAmount = await this.streamManager.accumulation(this.payee1.address)
    // Calculating expected amount
    const expectedAmount = Math.floor(claimablePeriod * this.rate / 30 / 24 / 3600)
    expect(accumulatedAmount).to.equal(expectedAmount)
  });

  // Expecting revert with NotPayer
  it('Terminating failed: only payer can terminate;', async () => {
    await expect(
      this.streamManager.connect(this.payee2).terminate(this.payee1.address))
      .to.be.revertedWith('NotPayer')
  })
  
  // Expecting success
  it('Terminating succeeding;', async () => {
    await expect(
      this.streamManager.connect(this.payer).terminate(this.payee1.address))
      .to.emit(this.streamManager, 'StreamTerminated')
      .withArgs(this.payee1.address)
    })
    
  // Expect revert with AlreadyTerminatedOrTerminating
  it('Terminating failed: stream is already terminated;', async () => {
    await expect(
      this.streamManager.connect(this.payer).terminate(this.payee1.address))
      .to.be.revertedWith('AlreadyTerminatedOrTerminating')
    })  

  // Tests for `claim();`
  // Claiming USDT
  it('Claiming succeed;', async () => {
    const currentTimestamp = 2 * 24 * 3600
    const claimablePeriod = currentTimestamp - this.cliffPeriod
    const expectedAmount = Math.floor(claimablePeriod * this.rate / 30 / 24 / 3600)

    await expect(
      this.streamManager.connect(this.payee1).claim()
    )
    .to.emit(this.streamManager, "TokensClaimed")
    .withArgs(this.payee1.address, expectedAmount)
  })

  // Expecting revert with `InsufficientBalance`
  it('Claiming failed: insufficient funds;', async () => {
    // Minting tokens to `StreamManager`
    await this.mockUSDT.mint(this.streamManager.address, 100)

    // Creating stream
    await this.streamManager.createOpenStream(
        this.payee2.address,
        this.mockUSDT.address,
        this.rate,
        this.terminationPeriod,
        this.cliffPeriod)

    await time.increase(17 * 24 * 3600); // + 17 days
    // claimed after 17 days from terminated point
    await this.streamManager.connect(this.payee2).claim()

    // tried to claim after 2 days but insufficient funds
    await time.increase(4 * 24 * 3600); // + 4 days
    await expect(
      this.streamManager.connect(this.payee2).claim()
    ).to.be.revertedWith('InsufficientBalance')
  })

  // Expecting revert with `CanNotClaimAnyMore`
  it('Claiming failed: payee claimed after the permination period, so can not claim any more;', async () => {
    // So payer deposited again.
    await this.mockUSDT.connect(this.payer).approve(this.streamManager.address, this.amount)
    await  this.streamManager.connect(this.payer).deposit(
      this.mockUSDT.address,
      this.amount
    )
    // claimed again.
    await this.streamManager.connect(this.payee1).claim()

    // Increase time to elapse the termination period
    await time.increase(this.terminationPeriod);

    // after this claim, payee1 can't claim any more becuase termination period is 18 days. but already elapsed 19 days.
    await expect(
      this.streamManager.connect(this.payee1).claim()
    ).to.be.revertedWith('CanNotClaimAnyMore')
  })

  it('Creating next open stream instance fails: previous open stream has terminated, but payee can still claim(still in termination period)', async () => {
    // Creates first open stream
    await this.streamManager.createOpenStream(
      this.payee5.address,
      this.mockUSDT.address,
      this.rate,
      this.terminationPeriod,
      this.cliffPeriod
    )

    await time.increase(10 * 24 * 3600); // + 10 days
    // terminate 
    await this.streamManager.connect(this.payer).terminate(this.payee5.address)

    await expect(
      this.streamManager.createOpenStream(
        this.payee5.address,
        this.mockUSDT.address,
        this.rate,
        this.terminationPeriod,
        this.cliffPeriod
      )
    ).to.be.revertedWith('StreamIsTerminating');
  })

  it('Creating next open stream instance success', async () => {
    await time.increase(20 * 24 * 3600); // + 20 days

    await expect(
      this.streamManager.createOpenStream(
        this.payee6.address,
        this.mockUSDT.address,
        this.rate,
        this.terminationPeriod,
        this.cliffPeriod
      )
    ).to.emit(this.streamManager, "StreamCreated")
    .withArgs(this.admin.address, this.payee6.address);
  })

  // Expecting revert with `NotPayee`
  it('Claim: only payee can call this function;', async () => {
    await expect(this.streamManager.connect(this.admin).claim()).to.be.revertedWith("NotPayee");
  })

  // Expecting revert with `CliffPeriodIsNotEnded`
  it('Claim: cliff period is not ended;', async () => {
    // Creating stream
    await this.streamManager.createOpenStream(
        this.payee3.address,
        this.mockUSDT.address,
        this.rate,
        this.terminationPeriod,
        this.cliffPeriod)

    await expect(this.streamManager.connect(this.payee3).claim()
    ).to.be.revertedWith("CliffPeriodIsNotEnded");
  })

  // Expecting revert with `ReentrancyGuardReentrantCall`
  it("Сlaim: if reentrant call is detected;", async () => {
    // Create the open stream
    await this.streamManager.createOpenStream(
      this.payee4.address,
      this.mockUSDT.address,
      this.amount,
      this.terminationPeriod,
      this.cliffPeriod
    );

    // Increase time
    await time.increase(2 * 24 * 3600) // + 2 days

    // Minting tokens
    await this.mockUSDT.mint(this.streamManager.address, this.amount)

    // The first call should succeed
    await expect(this.streamManager.connect(this.payee4).claim()).to.not.be.reverted
    // Recall should return an error
    expect(this.streamManager.connect(this.payee4).claim()).to.be.revertedWith('ReentrancyGuardReentrantCall')
  })
});
