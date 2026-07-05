const hre = require("hardhat");
const fs = require("fs/promises");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", (await deployer.getBalance()).toString());

  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();

  await voting.deployed();

  console.log("Voting deployed to:", voting.address);
  console.log("Tx hash:", voting.deployTransaction.hash);

  const frontendDir = path.resolve(__dirname, "../../react_frontend/src/abi");
  await fs.mkdir(frontendDir, { recursive: true });

  const data = {
    address: voting.address,
    abi: voting.interface.format("json"),
  };

  await fs.writeFile(
    path.join(frontendDir, "Voting.json"),
    JSON.stringify(data, null, 2),
    "utf-8"
  );

  console.log("ABI + address written to react_frontend/src/abi/Voting.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
