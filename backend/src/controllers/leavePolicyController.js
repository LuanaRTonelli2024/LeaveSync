const mongoose = require("mongoose");
const LeavePolicy = require("../models/LeavePolicy");
const User = require("../models/User");

const getPolicies = async (req, res) => {
    try {
        const policies = await LeavePolicy.find().sort({ type: 1, minYears: 1 });

        return res.status(200).json({
            message: "Policies fetched successfully.",
            data: { policies }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error while fetching policies." });
    }
};

const getPolicy = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid policy id." });
        }

        const policy = await LeavePolicy.findById(id);

        if (!policy) {
            return res.status(404).json({ message: "Policy not found." });
        }

        return res.status(200).json({
            message: "Policy fetched successfully.",
            data: { policy }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error while fetching the policy." });
    }
};

const getMyBalance = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Calculate years of service based on hireDate
        const now = new Date();
        const hireDate = new Date(user.hireDate);
        const yearsOfService = Math.floor(
            (now - hireDate) / (1000 * 60 * 60 * 24 * 365.25)
        );

        // Find the best matching vacation policy (highest minYears <= yearsOfService)
        const vacationPolicies = await LeavePolicy.find({ type: "vacation" }).sort({ minYears: -1 });
        const vacationPolicy = vacationPolicies.find(p => p.minYears <= yearsOfService);

        // Find sick policy (use the one with lowest minYears, typically 0)
        const sickPolicies = await LeavePolicy.find({ type: "sick" }).sort({ minYears: 1 });
        const sickPolicy = sickPolicies[0] ?? null;

        return res.status(200).json({
            message: "Balance fetched successfully.",
            data: {
                vacationDays: vacationPolicy ? vacationPolicy.totalDays : 0,
                sickDays: sickPolicy ? sickPolicy.totalDays : 0,
                yearsOfService
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error while fetching balance." });
    }
};

const createPolicy = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        const { type, totalDays, minYears, description } = req.body;

        if (!type || totalDays === undefined || minYears === undefined) {
            return res.status(400).json({ message: "Type, totalDays and minYears are required." });
        }

        const policy = await LeavePolicy.create({
            type,
            totalDays,
            minYears,
            description
        });

        return res.status(201).json({
            message: "Policy created successfully.",
            data: { policy }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error while creating the policy." });
    }
};

const updatePolicy = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid policy id." });
        }

        const { type, totalDays, minYears, description } = req.body;

        const updatePayload = {};
        if ("type" in req.body) updatePayload.type = type;
        if ("totalDays" in req.body) updatePayload.totalDays = totalDays;
        if ("minYears" in req.body) updatePayload.minYears = minYears;
        if ("description" in req.body) updatePayload.description = description;

        const policy = await LeavePolicy.findByIdAndUpdate(id, updatePayload, {
            new: true,
            runValidators: true
        });

        if (!policy) {
            return res.status(404).json({ message: "Policy not found." });
        }

        return res.status(200).json({
            message: "Policy updated successfully.",
            data: { policy }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error while updating the policy." });
    }
};

const deletePolicy = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid policy id." });
        }

        const policy = await LeavePolicy.findById(id);

        if (!policy) {
            return res.status(404).json({ message: "Policy not found." });
        }

        await policy.deleteOne();

        return res.status(200).json({
            message: "Policy deleted successfully.",
            data: { policy }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error while deleting the policy." });
    }
};

module.exports = { getPolicies, getPolicy, getMyBalance, createPolicy, updatePolicy, deletePolicy };