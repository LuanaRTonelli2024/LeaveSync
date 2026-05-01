const mongoose = require("mongoose");

const timeOffRequestSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        userName: {
            type: String,
            trim: true
        },
        type: {
            type: String,
            enum: ["vacation", "sick"],
            required: true
        },
        startDate: {
        type: String,
        required: true
        },
        endDate: {
        type: String,
        required: true
        },
        totalDays: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "approved", "denied"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

const TimeOffRequest = mongoose.model("TimeOffRequest", timeOffRequestSchema);

module.exports = TimeOffRequest;