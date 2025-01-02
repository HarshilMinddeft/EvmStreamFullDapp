const { ethers, JsonRpcProvider } = require("ethers");
const axios = require("axios");
const streamManagerAbi = require("../Backend/ABI/StreamManagerAbi.json")

// Ethers.js setup
const RPC_URL = process.env.RPC_URL;
const provider = new JsonRpcProvider("https://alfajores-forno.celo-testnet.org");
// const provider = new JsonRpcProvider("https://celo-alfajores.infura.io/v3/54168210826b4011bab024ea8c452230");

const operatorPrivateKey = "757174aa1db90055355225c655fe56c00e42bef3acc0f6b20dd4de147d238c22";
console.log("operatorPrivateKey",operatorPrivateKey)

const operatorWallet = new ethers.Wallet(operatorPrivateKey, provider);

// Smart contract setup
const STREAM_MANAGER_ADDRESS = "0x0263a3Cf6A8F6c6E4Aa4fD076f573A9D2706AeFc";
// const streamManagerAbi = [
//     "event StreamCreated(bytes32 indexed streamId,address indexed sender,address indexed receiver,int256 flowRate,uint256 startTime,uint256 fee)",
//     "function createStream(address receiver, int256 flowRate) external"
// ];

const streamManager = new ethers.Contract(STREAM_MANAGER_ADDRESS, streamManagerAbi, operatorWallet);

async function createStreamAndListen(senderAddress, reciverAddress, flowRate) {
    try {
        console.log(`Creating stream: sender=${senderAddress}, receiver=${reciverAddress}, flowRate=${flowRate}`);

        // Call the smart contract function
        const tx = await streamManager.createStream(
            reciverAddress,
            ethers.parseUnits(flowRate, 18) // Convert flowRate to smallest units
        );

        console.log("Transaction sent. Waiting for confirmation...");
        const receipt = await tx.wait();
        const logs = receipt.logs;
        console .log("Logs====>",logs)
        console.log("Stream created successfully. Transaction hash:", receipt.hash);

        // Listen for the `StreamCreated` event
        //  const event= streamManager.on(
        //     "StreamCreated",
        //     async (streamId, sender, receiver, flowRate, startTime, fee) => {
        //         console.log("StreamCreated event received:", {
        //             streamId,
        //             sender,
        //             receiver,
        //             flowRate: flowRate.toString(),
        //             startTime :startTime.toString(),
        //             fee: fee.toString(),
        //         });
        //         console.log("event",event)
        //         // Prepare data for the API call
               
        //     }
        // );

        const event = receipt.logs.find((log) => {
            try {
                // Parse the log to identify if it's the 'StreamCreated' event
                const parsedLog = streamManager.interface.parseLog(log);
                return parsedLog.name === "StreamCreated";
            } catch (e) {
                // Ignore errors for logs that don't match any known event signature
                return false;
            }
        });
        
        if (event) {
            const parsedEvent = streamManager.interface.parseLog(event);
            console.log("StreamCreated event found:", {
                streamId: parsedEvent.args.streamId,
                sender: parsedEvent.args.sender,
                receiver: parsedEvent.args.receiver,
                flowRate: parsedEvent.args.flowRate.toString(),
                startTime: parsedEvent.args.startTime.toString(),
                fee: parsedEvent.args.fee.toString(),
            });
        
            // Additional processing or state updates
        } else {
            console.error("StreamCreated event not found in transaction receipt");
        }
        
    } catch (error) {
        console.error("Error creating stream:", error.message);
        throw new Error(error.message);
    }
}

 // const streamData = {
                //     streamId,
                //     senderAddress: sender,
                //     reciverAddress: receiver,
                //     flowRate: flowRate.toString(),
                //     startTime: startTime.toString(),
                //     fee: fee.toString(),
                // };

                // Save the emitted data to MongoDB via your API
                // try {
                //     const response = await axios.post(
                //         "http://localhost:3001/api/addStream",
                //         streamData
                //     );

                //     console.log("Stream data saved to database:", response.data);
                // } catch (error) {
                //     console.error("Error saving stream to database:", error.message);
                // }
    
(async () => {
    const senderAddress = "0xe917e81c69Bf15238c63abd45d1c335C2fc80bDD";
    const reciverAddress = "0x5365d0B95AF4a11e424957419B33F61b3c551B36";
    const flowRate = "0.000001"; 

    try {
        const result = await createStreamAndListen(senderAddress, reciverAddress, flowRate);
        console.log(result);
    } catch (error) {
        console.error("Operation failed:", error.message);
    }
})();