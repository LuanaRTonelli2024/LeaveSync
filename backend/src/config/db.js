const dns = require("node:dns/promises");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");

const connectDB = async () => {
    
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error("MONGO_URI is not defined in environment variables.");
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully.");
};

module.exports = { connectDB } //precisa exportar para usar em outros lugares