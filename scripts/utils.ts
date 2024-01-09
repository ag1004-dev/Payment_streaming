import { run } from "hardhat";

export const verify = async (contractAddress: string) => {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
    });
  } catch (e) {
    console.log(`Error while verifying: ${e}`);
  }
};

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
