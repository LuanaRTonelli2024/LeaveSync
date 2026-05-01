const mongoose = require("mongoose");

const leavePolicySchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["vacation", "sick"],
            required: true
        },
        totalDays: {
            type: Number,
            required: true
        },
        minYears: {
            type: Number,
            required: true,
            default: 0
        },
        description: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const LeavePolicy = mongoose.model("LeavePolicy", leavePolicySchema);

module.exports = LeavePolicy;