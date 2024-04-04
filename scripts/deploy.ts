import { upgrades, ethers, hardhatArguments } from "hardhat";
import { StreamManager__factory } from "typechain-types";
import { delay, verify } from "scripts/utils";

async function main() {
  const { network } = hardhatArguments;
  if (!network) {
    throw new Error("Please specify the target network. Aborting...");
  }

  console.log("Deploying 3 contracts...");
  const StreamManager: StreamManager__factory = <StreamManager__factory>(
    await ethers.getContractFactory("StreamManager")
  );
  const streamManager = await upgrades.deployProxy(
    StreamManager,
    [process.env.ADMIN_ADDRESS, process.env.PAYER_ADDRESS],
    { initializer: "initialize" }
  );
  await streamManager.waitForDeployment();

  const proxyAddress = await streamManager.getAddress();
  const implementationAddress =
    await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("\nStreamManager proxy contract deployed at: ", proxyAddress);
  console.log("\nStreamManager contract deployed at: ", implementationAddress);

  // wait x seconds for transaction to be confirmed
  const ms = 20 * 1000;
  console.log(
    `\nWaiting ${ms / 1000} seconds before sending for verification...`
  );
  await delay(ms);

  console.log(`Sent for verification...`);
  await verify(proxyAddress);
  console.log(`Successfully verified!`);

  const MaliciousToken = await ethers.getContractFactory("MaliciousToken");
  const maliciousToken = await MaliciousToken.deploy(
    streamManager.getAddress()
  );
  console.log("MaliciousToken Address: ", await maliciousToken.getAddress());

  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy("Mock USDT", "USDT", 6);
  console.log("MockUSDT Address: ", await mockUSDT.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
