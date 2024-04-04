import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { getImplementationAddress } from "@openzeppelin/upgrades-core";
import { ethers, upgrades } from "hardhat";
import { Signers } from "types";
import { StreamManager, StreamManager__factory } from "typechain-types";

// Gitting addresses and return addresses
// Deploying contracts and return addresses
export async function getSignersAndDeployContracts() {
  const [admin, payer, payee1, payee2] = await ethers.getSigners();

  // Deploy StreamManager
  const StreamManager: StreamManager__factory = <StreamManager__factory>(
    await ethers.getContractFactory("StreamManager")
  );
  const streamManager = (await upgrades.deployProxy(
    StreamManager,
    [admin.address, payer.address],
    {
      kind: "uups",
      initializer: "initialize",
    }
  )) as unknown as StreamManager;
  const streamManagerImplAddress = await getImplementationAddress(
    ethers.provider,
    await streamManager.getAddress()
  );
  const streamManagerImpl = StreamManager.attach(
    streamManagerImplAddress
  ) as StreamManager;

  // Deploy MockUSDT
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy("Mock USDT", "USDT", 6);

  // Deploy MaliciousToken
  const MaliciousToken = await ethers.getContractFactory("MaliciousToken");
  const maliciousToken = await MaliciousToken.deploy(
    streamManager.getAddress()
  );

  return {
    admin,
    payer,
    payee1,
    payee2,
    streamManager,
    streamManagerImpl,
    mockUSDT,
    maliciousToken,
  };
}

// Creating the stream
export async function createdOpenStream(param: number) {
  const {
    admin,
    payer,
    payee1,
    payee2,
    streamManager,
    streamManagerImpl,
    mockUSDT,
    maliciousToken,
  } = await loadFixture(getSignersAndDeployContracts);

  const rate = 1500;
  const terminationPeriod = 18 * 24 * 3600; // 18 days
  const cliffPeriod = 24 * 3600; // 24 hrs
  let payee; // for setting payee1/payee2

  // Setting payee
  if (param === 0) {
    payee = payee1.address;
  } else {
    payee = payee2.address;
  }

  // Creating stream
  await streamManager
    .connect(payer)
    .createOpenStream(
      payee,
      mockUSDT.getAddress(),
      rate,
      terminationPeriod,
      cliffPeriod
    );

  return {
    admin,
    payer,
    payee1,
    payee2,
    streamManager,
    streamManagerImpl,
    mockUSDT,
    maliciousToken,
  };
}
