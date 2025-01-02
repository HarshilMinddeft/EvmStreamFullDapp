require('dotenv').config();
const { ethers ,JsonRpcProvider } = require('ethers');
const cron = require('cron');

// const RPC_url = process.env.RPC_URL;
// console.log("Ethers library loaded:", ethers);
// Load environment variables
const provider = new JsonRpcProvider("https://alfajores-forno.celo-testnet.org");
const operatorPrivateKey = "c9d79de828fb9bf47dd389d2f1b6269a2313c3eab39c84a33dc69e642c7490eb";
const operatorWallet = new ethers.Wallet(operatorPrivateKey, provider);

// SuperToken and StreamManager contract addresses
const SUPER_TOKEN_ADDRESS = "0x974e8884f4B44c91594fE3Ea6Fc4130C5a465814";
const STREAM_MANAGER_ADDRESS = "0x0263a3Cf6A8F6c6E4Aa4fD076f573A9D2706AeFc"

// ABI files
const superTokenAbi = [
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)"
];

const streamManagerAbi = [
    "function stopStream(bytes32 streamId) public",
    "function stopAllStreams(address sender) external" 
];

// Initialize contract instances
const superToken = new ethers.Contract(SUPER_TOKEN_ADDRESS, superTokenAbi, provider);
const streamManager = new ethers.Contract(STREAM_MANAGER_ADDRESS, streamManagerAbi, operatorWallet);

// Convert 0.0003 to the token's smallest unit (assuming 18 decimals)
const MINIMUM_BALANCE = ethers.parseUnits("1.3", 18);
console.log("MINBAL==>",MINIMUM_BALANCE)

async function checkAndStopStream(sender) {
    try {
        // Fetch sender's token balance
        const balance = await superToken.balanceOf(sender);

        // Convert MINIMUM_BALANCE to BigInt for comparison
        const minimumBalanceBigInt = BigInt(MINIMUM_BALANCE.toString());

        console.log(`Balance of ${sender}: ${ethers.formatUnits(balance, 18)} tokens`);

        // Check if balance is below threshold
        if (BigInt(balance) < minimumBalanceBigInt) {
            console.log(`Balance too low. Stopping stream for sender: ${sender}`);

            // Call stopStream from operator address
            const tx = await streamManager.stopAllStreams(sender);
            console.log(`Stream stopped. Transaction hash: ${tx.hash}`);
            // Remove the stream from the list
            const index = streamsToCheck.findIndex(stream => stream.sender === sender);
              if (index !== -1) {
                  streamsToCheck.splice(index, 1); // Remove from monitoring
              }
        }
    } catch (error) {
        console.error(`Error checking or stopping stream: ${error.message}`);
    }
}

const streamsToCheck = [
    { sender: "0xe917e81c69Bf15238c63abd45d1c335C2fc80bDD"  
    },
    // { sender: "0x98b8bcad3f314ca03e2d0eb20bab5c666434409b"}
];

// Schedule the job every 2 seconds
const job = new cron.CronJob('*/2 * * * * *', async () => {
    for (const stream of [...streamsToCheck]) { // Use a shallow copy to avoid mutation issues
        await checkAndStopStream(stream.sender);
    }

    // Stop the job if there are no more streams to monitor
    if (streamsToCheck.length === 0) {
        console.log("No active streams. Stopping monitoring...");
        job.stop();
    }
});

// Start the cron job
job.start();

console.log("Backend monitoring started...");