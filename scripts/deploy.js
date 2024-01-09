const { defender, ethers, hardhatArguments } = require("hardhat");

async function main() {
  const { network } = hardhatArguments;
  if (!network) {
    throw new Error("Please specify the target network. Aborting...");
  }

  const StreamManager = await ethers.getContractFactory("StreamManager");
  const streamManager = await defender.deployProxy(
    StreamManager,
    [process.env.ADMIN_ADDRESS, process.env.PAYER_ADDRESS],
    { initializer: "initialize" }
  );
  await streamManager.waitForDeployment();

  const proxyAddress = await streamManager.getAddress();
  const implementationAddress = await defender.erc1967.getImplementationAddress(
    proxyAddress
  );

  console.log("StreamManager proxy contract deployed at: ", proxyAddress);
  console.log("StreamManager contract deployed at: ", implementationAddress);
  addDeployment(network, proxyAddress);

  // wait x seconds for transaction to be confirmed
  const ms = 20 * 1000;
  console.log(
    `Waiting ${ms / 1000} seconds before sending for verification...`
  );
  await delay(ms);

  if (networksConfig[network].verifyContracts) {
    console.log(`Sent for verification...`);
    await verify(proxyAddress);
    console.log(`Successfully verified!`);
  }

  const MaliciousToken = await ethers.getContractFactory("MaliciousToken");
  const maliciousToken = await MaliciousToken.deploy(streamManager.address);
  console.log("MaliciousToken Address: ", maliciousToken.address);

  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy("Mock USDT", "USDT", 6);
  console.log("MockUSDT Address: ", mockUSDT.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
