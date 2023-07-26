const { ethers } = require("hardhat")

async function main() {
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy(
    "Mock USDT",
    "USDT",
    6
  )
  console.log("MockUSDT Address: ", mockUSDT.address);

  const StreamManager = await ethers.getContractFactory("StreamManager");
  const streamManager = await StreamManager.deploy(process.env.ADMIN_ADDRESS, process.env.PAYER_ADDRESS)
  console.log("StreamManager Address: ", streamManager.address);

  const MaliciousToken = await ethers.getContractFactory("MaliciousToken");
  const maliciousToken = await MaliciousToken.deploy(streamManager.address)
  console.log("MaliciousToken Address: ", maliciousToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
