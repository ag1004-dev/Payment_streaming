/** @type import('hardhat/config').HardhatUserConfig */
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();
require("solidity-coverage");

const {
  PRIVATE_KEY,
  ETHERSCAN_API_KEY,
} = process.env;

module.exports = {
  defaultNetwork: "hardhat", //sepolia",
  networks: {
    hardhat: {
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/_cXtbxQbXZ7hLhL6PDj5HvCIe0mAzOz8",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    }
  },
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  }
};
