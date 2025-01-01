const express = require("express");
const Users = require("../Model/userModel.js");
const router = express.Router();

// POST API to add a new stream
router.post("/addStream", async (req, res) => {
    try {
        // Destructure data from the request body
        const { senderAddress, reciverAddress, fee, currentTime, flowRate } = req.body;

        // Validate required fields
        if (!senderAddress || !reciverAddress || !fee || !currentTime || !flowRate) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Create a new stream document
        const newStream = new Users({
            senderAddress,
            reciverAddress,
            fee,
            currentTime,
            flowRate,
        });

        // Save the stream to the database
        await newStream.save();

        // Respond with success message
        res.status(201).json({ message: "Stream added successfully.", stream: newStream });
    } catch (error) {
        console.error("Error adding stream:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
});

module.exports = router;
