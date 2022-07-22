/** In order to test this from end to end on testnet or mainnet, we need to:
 * 1. Get our SubId from Chainlink VRF.
 * 2. Deploy our contract using the SubId.
 * 3. Register contract with Chainlink VRF and it's subId.
 * 4. Register contract with Chainlink Keepers.
 * 5. Run staging test.
 */

const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {
  isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Staging Tests", function () {
      let raffle, entranceFee, deployer;

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        raffle = await ethers.getContract("Raffle", deployer);
        entranceFee = await raffle.getEntranceFee();
      });

      describe("fulfillRandomWords", function () {
        it("works with Chainlink Keepers and VRF to get random winner"),
          async function () {
            console.log("Setting up test...");
            const startingTimeStamp = await raffle.getLatestTimeStamp();
            const accounts = await ethers.getSigners();
            // setup listener before we enter the raffle, in case blochain
            // is moving really fast. code won't complete until listener has finished.
            console.log("Starting listener...");
            await new Promise(async (resolve, reject) => {
              raffle.once("WinnerPicked", async () => {
                console.log("WinnerPicked event fired and stuff");
                try {
                  const recentWinner = await raffle.getRecentWinner();
                  const raffleState = await raffle.getRaffleState();
                  const winnerEndingBalance = await accounts[0].getBalance();
                  const endingTimeStamp = await raffle.getLatestTimeStamp();

                  await expect(raffle.getPlayer(0).to.be.reverted);
                  assert.equal(recentWinner.toString(), accounts[0].address);
                  assert.equal(raffleState, 0);
                  assert.equal(
                    winnerEndingBalance.toString(),
                    winnerStartingBalance.add(entranceFee).toString()
                  );
                  assert(endingTimeStamp > startingTimeStamp);
                  resolve();
                } catch (error) {
                  console.log(error);
                  reject(e);
                }
              });
              // Enter raffle
              console.log("Entering raffle...");
              await raffle.enterRaffle({ value: entranceFee });
              await tx.wait(1);
              console.log("Waiting for transaction...");
              const winnerStartingBalance = await accounts[0].getBalance();
            });
          };
      });
    });
