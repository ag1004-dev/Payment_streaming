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
  const streamManager = await StreamManager.deploy("0xa074577Ad65Ea0E17c64Dd3A1AB51a284055b757")
  console.log("StreamManager Address: ", streamManager.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
