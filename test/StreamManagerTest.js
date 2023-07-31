const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { getSignersAndDeployContracts, createdOpenStream } = require("./fixtures");

const createOpenStreamAsPayee1 = () => createdOpenStream(0);
const createOpenStreamAsPayee2 = () => createdOpenStream(1);

describe.only("StreamManager:", async () => {
	const amount = 1000
    const rate = 1500
    const terminationPeriod = 18 * 24 * 3600; // 18 days
    const cliffPeriod = 24 * 3600; // 24 hrs
    const zero = ethers.constants.AddressZero 

	it("Checking fixtures", async () => {
	    // Returning the `decimals` for coverage*
	    const { mockUSDT } = await loadFixture(getSignersAndDeployContracts)

	    expect(await mockUSDT.decimals()).to.eq(6)
  	})
	
	describe("changeCommissionAddress();", async () => {
		// Tests for `changeCommissionAddress();`
		// Expecting revert with `NotAdmin`
		it('Chainge address fee: only the admin can call the function', async () => {

	    	const { payee1, payee2, 
	    		streamManager } = await loadFixture(getSignersAndDeployContracts)

			await expect(
				streamManager.connect(payee1).changeCommissionAddress(payee2.address)
			).to.be.revertedWith('NotAdmin')
		  })

		// Expecting revert with `InvalidAddress`
		it('Chainge address fee: not can setting address(0) how address of the admin', async () => {

	    	const { admin, streamManager } = await loadFixture(getSignersAndDeployContracts)

			await expect(
				streamManager.connect(admin).changeCommissionAddress(zero)
			).to.be.revertedWith('InvalidAddress')
		})

		// Expecting revert with `InvalidAddress`
		it('Chainge address fee: existing address and new address must not match', async () => {

	    	const { admin, streamManager } = await loadFixture(getSignersAndDeployContracts)

			await expect(
				streamManager.connect(admin).changeCommissionAddress(admin.address)
			).to.be.revertedWith('InvalidAddress')
		})
		// Changing the address of the commission
		it('Chainge address fee: address of the admin is changing', async () => {
	    	
	    	const { admin, payee1, streamManager } = await loadFixture(getSignersAndDeployContracts)

		    await expect(
		      streamManager.connect(admin).changeCommissionAddress(payee1.address)
		    ).to.emit(streamManager, "CommissionAddressChanged")
		    .withArgs(payee1.address);
		})
	})

	describe("changePayerAddress();", async () => {
		// Tests for `changePayerAddress();`
		// Expecting revert with `NotAdmin`
		it('Change address payer: only the admin can call the function', async () => {

	    	const { payee1, payee2, streamManager } = await loadFixture(getSignersAndDeployContracts)

			await expect(
				streamManager.connect(payee1).changePayerAddress(payee2.address)
			).to.be.revertedWith('NotAdmin')
		  })

		// Expecting revert with `InvalidAddress`
		it('Change address payer: not can setting address(0) how address of the admin', async () => {

	    	const { admin, streamManager } = await loadFixture(getSignersAndDeployContracts)

			await expect(
				streamManager.connect(admin).changePayerAddress(zero)
			).to.be.revertedWith('InvalidAddress')
		})

		// Expecting revert with `InvalidAddress`
		it('Change address payer: existing address and new address must not match', async () => {

	    	const { admin, payer, streamManager } = await loadFixture(getSignersAndDeployContracts)

			await expect(
				streamManager.connect(admin).changePayerAddress(payer.address)
			).to.be.revertedWith('InvalidAddress')
		})
		// Changing the address payer
		it('Change address payer: address of the admin is changing', async () => {

	    	const { admin, payee1, streamManager } = await loadFixture(getSignersAndDeployContracts)

		    await expect(
		      streamManager.connect(admin).changePayerAddress(payee1.address)
		    ).to.emit(streamManager, "PayerAddressChanged")
		    .withArgs(payee1.address);
		})
	})

	describe("deposit();", async () => {
		// Tests for `deposit();`
		// Expecting revert with `NotPayer`
		it('Deposit: only payer can call this function;', async () => {

	    	const { payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

			// Calling from other address
			await expect(
				streamManager.connect(payee1).deposit(
				mockUSDT.address,
				amount
			))
		    .to.be.revertedWith('NotPayer');
		})

		// Expecting revert with `InvalidAddress`
		it('Deposit: `_token` not set how address(0);', async () => {

			const { payer, streamManager } = await loadFixture(getSignersAndDeployContracts)

		    // Setting `_token` = address(0)
		    await expect(
				streamManager.connect(payer).deposit(
		    	zero,
		      	amount
		    ))
		    .to.be.revertedWith('InvalidAddress');
		})

		// Expecting revert with `InvalidValue`
		it('Deposit: `_amount` not set how 0;', async () => {

	    	const { payer, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

			// Setting `_amount` = 0
			await expect(
			  	streamManager.connect(payer).deposit(
			  	mockUSDT.address,
			  	0
			))
			.to.be.revertedWith('InvalidValue');
		})

		// Deposit USDT(mock)
		it('Deposit: depositing succeed;', async () => {

	    	const { payer, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

			await mockUSDT.mint(payer.address, amount)

			await mockUSDT.connect(payer).approve(streamManager.address, amount)

			await expect(
			  	streamManager.connect(payer).deposit(
			  	mockUSDT.address,
			  	amount
			))
			.to.emit(streamManager, "TokensDeposited")
			.withArgs(mockUSDT.address, amount)

			expect(await mockUSDT.balanceOf(streamManager.address)).to.equal(amount)
		})
	})

	describe("terminate();", async () => {
		// Tests for `terminate();`
		// Expecting revert with `NotPayer``
	  	it('Terminate: only the payer can terminate;', async () => {

	    	const { payee1, payee2, streamManager } = await loadFixture(getSignersAndDeployContracts)

	    	await expect(
	      		streamManager.connect(payee2).terminate(payee1.address))
	      	.to.be.revertedWith('NotPayer')
	  	})  
		
		// Expecting revert with `NotPayee``
	  	it('Terminate: payee address only;', async () => {

	    	const { admin, payer, streamManager } = await loadFixture(getSignersAndDeployContracts)

	    	await expect(
	      		streamManager.connect(payer).terminate(admin.address))
	      	.to.be.revertedWith('NotPayee')
	  	})

	  	// Expect revert with `Terminating``
		it('Terminate: stream is already terminated;', async () => {

	    	const { payer, payee1, streamManager, mockUSDT } = await loadFixture(createOpenStreamAsPayee1)

		    await time.increase(4 * 24 * 3600); // + 4 days

		    // First terminating
		    await streamManager.connect(payer).terminate(payee1.address)

		    // Second terminating for `revert`
		    await expect(
	      		streamManager.connect(payer).terminate(payee1.address))
	      	.to.be.revertedWith('Terminating')
		})

		// Expecting success
		it('Terminate: terminating succeed;', async () => {

	    	const { payer, payee1, streamManager, mockUSDT } = await loadFixture(createOpenStreamAsPayee1)

			await expect(
				streamManager.connect(payer).terminate(payee1.address))
			.to.emit(streamManager, 'StreamTerminated')
			.withArgs(payee1.address)
		})

	  	// Expecting success in the cliff period
		it('Terminate: terminating succeed in the cliff period;', async () => {

	    	const { payer, payee1, streamManager, mockUSDT } = await loadFixture(createOpenStreamAsPayee1)

		    await streamManager.connect(payer).terminate(payee1.address)
		    expect(await streamManager.accumulation(payee1.address)).to.equal(0)
		    expect(await streamManager.isPayee(payee1.address)).to.equal(false)
		  })
	})

	describe("accumulation();", async () => {
		// Tests for `accumulation();`
		// Amount is accumulated
		it('Accumulation: returning the amount;', async () => {

	    	const { payer, payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

	    	// Creating stream
		    await streamManager.connect(payer).createOpenStream(
		    	payee1.address,
		    	mockUSDT.address,
		    	rate,
		    	terminationPeriod,
		    	cliffPeriod
		    )

		    await time.increase(44 * 24 * 3600); // + 44 days

		    // Setting timestamp
			const currentTimestamp = 44 * 24 * 3600
		    const claimablePeriod = currentTimestamp - cliffPeriod

		    // Calling the `accumulation();`
		    const accumulatedAmount = await streamManager.accumulation(payee1.address)
		    // Calculating expected amount
		    const expectedAmount = Math.floor(claimablePeriod * rate / 30 / 24 / 3600)
		    expect(accumulatedAmount).to.equal(expectedAmount)
		});

		// Returning 0, because the current timestamp is less than the sum of the stream creation time and the "cliff" period 
		it('Accumulation: timestamp not less than the sum of the stream creation time and the "cliff" period;', async () => {

	    	const { payer, payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

	    	// Creating stream
		    await streamManager.connect(payer).createOpenStream(
		    	payee1.address,
		    	mockUSDT.address,
		    	rate,
		    	terminationPeriod,
		    	cliffPeriod
		    )

		    // Calling the `accumulation();`
		    const accumulatedAmount = await streamManager.accumulation(payee1.address)

		    expect(accumulatedAmount).to.equal(0)
		}); 

		// Stream must be created to return the correct amount
		it('Accumulation: stream must be created for the return amount;', async () => {

	    	const { payee1, streamManager } = await loadFixture(getSignersAndDeployContracts)

	    	// Calling the `accumulation();`
		    const accumulatedAmount = await streamManager.accumulation(payee1.address)

		    expect(accumulatedAmount).to.equal(0)
		})

		// Returning the amount if stream to not terminated
		it('Accumulation: stream not terminated', async () => {

		  	const { payer, payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

			// Creating stream
			await streamManager.connect(payer).createOpenStream(
			    payee1.address,
			    mockUSDT.address,
			    rate,
			    terminationPeriod,
			    cliffPeriod
			);

			await time.increase(44 * 24 * 3600); // + 44 days

			// Setting timestamp
			const currentTimestamp = 44 * 24 * 3600
		    const claimablePeriod = currentTimestamp - cliffPeriod

		    // Calling the `accumulation();`
		    const accumulatedAmount = await streamManager.accumulation(payee1.address)
		    // Calculating expected amount
		    const expectedAmount = Math.floor(claimablePeriod * rate / 30 / 24 / 3600)
		    expect(accumulatedAmount).to.equal(expectedAmount)
		})

		// Returning the amount if stream to terminated
		it('Accumulation: stream terminated', async () => {

		  	const { payer, payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

			// Creating stream
			await streamManager.connect(payer).createOpenStream(
			    payee1.address,
			    mockUSDT.address,
			    rate,
			    terminationPeriod,
			    cliffPeriod
			);
  
			await time.increase(44 * 24 * 3600); // + 44 days

			// Terminate the stream
			await streamManager.connect(payer).terminate(payee1.address);

			// Setting timestamp
			const currentTimestamp = 44 * 24 * 3600
		    const claimablePeriod = currentTimestamp - cliffPeriod

		    // Calling the `accumulation();`
		    const accumulatedAmount = await streamManager.accumulation(payee1.address)
		    // Calculating expected amount
		    const expectedAmount = Math.floor(claimablePeriod * rate / 30 / 24 / 3600)
		    expect(accumulatedAmount).to.equal(expectedAmount)
		})
	})

	describe("createOpenStream();", async () => {
		// Tests for `createOpenStream();`
		// Creating stream
		it('Creating stream: creating succeed;', async () => {

		  	const { payer, payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

		    await expect(streamManager.connect(payer).createOpenStream(
		      	payee1.address,
		      	mockUSDT.address,
		      	rate,
		      	terminationPeriod,
		      	cliffPeriod
		    ))
		    .to.emit(streamManager, "StreamCreated")
		    .withArgs(payer.address, payee1.address)
		})

		// Expecting revert with `NotPayer``
		it('Creating stream: only the payer can create a stream;', async () => {

		  	const { payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

		    await expect(
		      	streamManager.connect(payee1).createOpenStream(
		        payee1.address,
		        mockUSDT.address,
		        rate,
		        terminationPeriod,
		        cliffPeriod
		    )).to.be.revertedWith('NotPayer');
		})

		// Expecting revert with `InvalidAddress`
		it('Creating stream: `_payee` is not set as address(0);', async () => {

			const { payer, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

		    // Setting `_payee` = address(0)
		    await expect(
		      	streamManager.connect(payer).createOpenStream(
		        zero,
		        mockUSDT.address,
		        rate,
		        terminationPeriod,
		        cliffPeriod
		    )).to.be.revertedWith('InvalidAddress');
		})

		// Expecting revert with `InvalidAddress`
		it('Creating stream: `_token` is not set as address(0);', async () => {

			const { payer, payee1, streamManager } = await loadFixture(getSignersAndDeployContracts)

		    // Setting `_token` = address(0)
		    await expect(
		      	streamManager.connect(payer).createOpenStream(
		        payee1.address,
		        zero,
		        rate,
		        terminationPeriod,
		        cliffPeriod
		    )).to.be.revertedWith('InvalidAddress');
		})

		// Expecting revert with `InvalidValue`
		it('Creating stream: `_rate` not set how 0;', async () => {

			const { payer, payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

		    // Setting `_rate` = 0
		    await expect(
		      	streamManager.connect(payer).createOpenStream(
		        payee1.address,
		        mockUSDT.address,
		        0,
		        terminationPeriod,
		        cliffPeriod
		    )).to.be.revertedWith('InvalidValue');
		})

		// Expecting revert with `InvalidValue`
		it('Creating stream: `_terminationPeriod` not set how 0;', async () => {
		
			const { payer, payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

			// Setting `_terminationPeriod` = 0
		  	await expect(
		        streamManager.connect(payer).createOpenStream(
		        payee1.address,
		        mockUSDT.address,
		        rate,
		        0,
		        cliffPeriod
		    )).to.be.revertedWith('InvalidValue');
		})

		// Expecting revert with `InvalidValue`
		it('Creating stream: `_cliffPeriod` not set how 0;', async () => {

		  	const { payer, payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

		    // Setting `_cliffPeriod` = 0
		    await expect(
		      	streamManager.connect(payer).createOpenStream(
		        payee1.address,
		        mockUSDT.address,
		        rate,
		        terminationPeriod,
		        0
		    )).to.be.revertedWith('InvalidValue');
		})

		// Expecting revert with `OpenStreamExists`
		it('Creating stream: previous stream has not been ended', async () => {

		  	const { payer, payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

		  	// Creating stream
			await streamManager.connect(payer).createOpenStream(
			    payee1.address,
			    mockUSDT.address,
			    rate,
			    terminationPeriod,
			    cliffPeriod
			);

		    await expect(streamManager.connect(payer).createOpenStream(
		      payee1.address,
		      mockUSDT.address,
		      rate,
		      terminationPeriod,
		      cliffPeriod
		    )).to.be.revertedWith('OpenStreamExists');
		})
	})

	describe("claim();", async () => {
		// Tests for `claim();`
		// Claiming USDT
		it('Claiming: claim succeed;', async () => {

		  	const { payer, payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

		  	// Minting tokens
		  	await mockUSDT.mint(streamManager.address, amount)

		    expect(await mockUSDT.balanceOf(streamManager.address)).to.eq(amount)

		  	// Creating stream
			await streamManager.connect(payer).createOpenStream(
			    payee1.address,
			    mockUSDT.address,
			    rate,
			    terminationPeriod,
			    cliffPeriod
			);

		    const currentTimestamp = 2 * 24 * 3600
		    await time.increase(currentTimestamp) // + 2 days
		    const claimablePeriod = currentTimestamp - cliffPeriod
		    const expectedAmount = Math.floor(claimablePeriod * rate / 30 / 24 / 3600)

		    await expect(
		      streamManager.connect(payee1).claim()
		    )
		    .to.emit(streamManager, "TokensClaimed")
		    .withArgs(payee1.address, expectedAmount)
		})

		it('Claiming: should prevent reentrant calls', async () => {

		  	const { payer, payee1, streamManager, maliciousToken } = await loadFixture(getSignersAndDeployContracts)

		  	// Creating stream
		    await streamManager.connect(payer).createOpenStream(
		      payee1.address,
		      maliciousToken.address,
		      rate,
		      terminationPeriod,
		      cliffPeriod
		    )

		    // Minting tokens to `payer` and approve `streamManager contract`
		    await maliciousToken.mint(payer.address, amount)
		    await maliciousToken.connect(payer).approve(streamManager.address, amount)

		    await expect(
		      	streamManager.connect(payer).deposit(
		        maliciousToken.address,
		        amount
		    ))
		    .to.emit(streamManager, "TokensDeposited")
		    .withArgs(maliciousToken.address, amount)

		    // Try to claim the stream
		    const elapsed = 2 * 24 * 3600
		    await time.increase(elapsed)
		    await expect(
		      	streamManager.connect(payee1).claim()
		    ).to.be.revertedWith("ReentrancyGuard: reentrant call")
		})
		
		// Expect revert with `NotPayee`
		it('Claiming: only the payee can call `claim();`', async () => {

		  	const { payer, streamManager } = await loadFixture(getSignersAndDeployContracts)

		    await expect(
		      streamManager.connect(payer).claim()
		    )
		    .to.be.revertedWith("NotPayee")
		})

		// Expecting revert with `CliffPeriodIsNotEnded`
		it('Claiming: cliff period is not ended;', async () => {

			const { payer, payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

		    // Creating stream
		    await streamManager.connect(payer).createOpenStream(
		        payee1.address,
		        mockUSDT.address,
		        rate,
		        terminationPeriod,
		        cliffPeriod)

		    await expect(streamManager.connect(payee1).claim()
		    ).to.be.revertedWith("CliffPeriodIsNotEnded");
		})

		// Expecting revert with `InsufficientBalance`
		it('Claiming: insufficient funds;', async () => {

		  	const { payer, payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

		    // Creating stream
		    await streamManager.connect(payer).createOpenStream(
		        payee1.address,
		        mockUSDT.address,
		        rate,
		        terminationPeriod,
		        cliffPeriod)

		    await time.increase(17 * 24 * 3600); // + 17 days

		    await expect(
		      	streamManager.connect(payee1).claim()
		    ).to.be.revertedWith('InsufficientBalance')
		})

		it('Claiming: success creating next stream', async () => {

		  	const { payer, payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)

		    await time.increase(20 * 24 * 3600); // + 20 days

		    await expect(
		      	streamManager.connect(payer).createOpenStream(
		        payee1.address,
		        mockUSDT.address,
		        rate,
		        terminationPeriod,
		        cliffPeriod
		      )
		    ).to.emit(streamManager, "StreamCreated")
		    .withArgs(payer.address, payee1.address);
		})

		it('Claiming: succeed claiming for the first payee;', async () => {

		  	const { payer, payee1, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)
		    const amountNew = amount * 100000
			const currentTimestamp = 44 * 24 * 3600 // Setting timestamp
			const claimablePeriod = currentTimestamp - cliffPeriod

		    await mockUSDT.mint(payer.address, amountNew)
		    await mockUSDT.connect(payer).approve(streamManager.address, amountNew)
		    await streamManager.connect(payer).deposit(
		      mockUSDT.address,
		      amountNew
		    )

		    expect(await streamManager.accumulation(payee1.address)).to.equal(0) 

		    // Creating stream
		    await streamManager.connect(payer).createOpenStream(
		        payee1.address,
		        mockUSDT.address,
		        rate,
		        terminationPeriod,
		        cliffPeriod)

		    expect(await streamManager.isPayee(payee1.address)).to.eq(true)

			await time.increase(currentTimestamp); // + 44 days

		    // Calling the `accumulation();`
		    const accumulatedAmount = await streamManager.accumulation(payee1.address)
		    // Calculating expected amount
		    const expectedAmount = Math.floor(claimablePeriod * rate / 30 / 24 / 3600)
		    // Balance of the `payee1`
		    const balanceBefore = await mockUSDT.balanceOf(payee1.address);

		    expect(await streamManager.accumulation(payee1.address)).to.equal(expectedAmount)

		    await expect(
		      streamManager.connect(payee1).claim()
		    )
		    .to.emit(streamManager, "TokensClaimed")
		    .withArgs(payee1.address, expectedAmount)

		    expect(await streamManager.isPayee(payee1.address)).to.eq(true)

		    // Check the new balance of `payee1`
			const balanceAfter = await mockUSDT.balanceOf(payee1.address);
			expect(balanceAfter).to.equal(balanceBefore.add(accumulatedAmount));
		})

		it('Claiming: succeed claiming for the second payee;', async () => {

		  	const { payer, payee2, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)
		  	const amountNew = amount * 100000
		  	const currentTimestamp = 20 * 24 * 3600 // Setting timestamp
		  	const claimablePeriod = currentTimestamp - cliffPeriod

		  	await mockUSDT.mint(payer.address, amountNew);
		  	await mockUSDT.connect(payer).approve(streamManager.address, amountNew)
		  	await streamManager.connect(payer).deposit(mockUSDT.address, amountNew)

		  	// Creating stream
		  	await streamManager.connect(payer).createOpenStream(
			    payee2.address,
			    mockUSDT.address,
		    	rate,
		    	terminationPeriod,
		    	cliffPeriod
		  	);

		  	expect(await streamManager.isPayee(payee2.address)).to.eq(true)

		  	await time.increase(currentTimestamp); // + 20 days
			// Terminating the stream
			await streamManager.connect(payer).terminate(payee2.address)
			await time.increase(currentTimestamp + terminationPeriod + 1) // 20 days + 18 days + 1 sec

			// Calling the `accumulation();`
			const expectedAmount = await streamManager.accumulation(payee2.address)

			// Calling the `claim();`
			// `else`
			await expect(streamManager.connect(payee2).claim()
			).to.emit(streamManager, "TokensClaimed"
			).withArgs(payee2.address, expectedAmount)

			// Check the new balance of `payee2`
			expect(await mockUSDT.balanceOf(payee2.address)).to.equal(expectedAmount)
		})

		it('Claiming: succeed claiming after termination for the second payee;', async () => {
		  	
			const { payer, payee2, streamManager, mockUSDT } = await loadFixture(getSignersAndDeployContracts)
		  	const amountNew = amount * 100000

		  	await mockUSDT.mint(payer.address, amountNew)
		  	await mockUSDT.connect(payer).approve(streamManager.address, amountNew)
		  	await streamManager.connect(payer).deposit(mockUSDT.address, amountNew)

		  	// Creating stream
		  	await streamManager.connect(payer).createOpenStream(
			    payee2.address,
			    mockUSDT.address,
		    	rate,
		    	terminationPeriod,
		    	cliffPeriod
		  	)

		  	// Terminating the stream
		  	streamManager.connect(payer).terminate(payee2.address)
			await time.increase(terminationPeriod + 1); // 18 days + 1 sec 

			const expectedAmount = await streamManager.accumulation(payee2.address)

		  	// Calling the `claim();`
		  	// `if (isTerminated && claimedAt < terminatedAt + terminationPeriod)`
			await expect(streamManager.connect(payee2).claim()
			).to.emit(streamManager, "TokensClaimed"
			).withArgs(payee2.address, expectedAmount)

			// Check the new balance of `payee2`
		  	expect(await mockUSDT.balanceOf(payee2.address)).to.equal(expectedAmount)
		})
	})
})
