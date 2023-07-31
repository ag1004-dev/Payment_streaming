const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { ethers } = require("hardhat");

// Gitting addresses and return addresses
// Deploying contracts and return addresses
async function getSignersAndDeployContracts() {
	const [ admin, payer, payee1, payee2 ] = await ethers.getSigners();

  // Deploy StreamManager
  const StreamManager = await ethers.getContractFactory("StreamManager");
  const streamManager = await StreamManager.deploy(admin.address, payer.address);

  // Deploy MockUSDT
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy(
    "Mock USDT",
    "USDT",
    6
  );

  // Deploy MaliciousToken
  const MaliciousToken = await ethers.getContractFactory("MaliciousToken");
  const maliciousToken = await MaliciousToken.deploy(streamManager.address);

	return { admin, payer, payee1, payee2, streamManager, mockUSDT, maliciousToken };
}

// Creating the stream
async function createdOpenStream(param) {
  const { admin, payer, payee1, payee2, streamManager, mockUSDT, maliciousToken } = await loadFixture(getSignersAndDeployContracts)

  const rate = 1500
  const terminationPeriod = 18 * 24 * 3600; // 18 days
  const cliffPeriod = 24 * 3600; // 24 hrs
  let payee // for setting payee1/payee2

  // Setting payee
  if(param === 0) {
    payee = payee1.address
  } else {
    payee = payee2.address
  }

  // Creating stream
  await streamManager.connect(payer).createOpenStream(
    payee,
    mockUSDT.address,
    rate,
    terminationPeriod,
    cliffPeriod
  );

  return { admin, payer, payee1, payee2, streamManager, mockUSDT, maliciousToken }
}

module.exports = { getSignersAndDeployContracts, createdOpenStream }