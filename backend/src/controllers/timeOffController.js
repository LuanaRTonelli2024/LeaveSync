const mongoose = require("mongoose");
const TimeOffRequest = require("../models/TimeOffRequest");
const LeavePolicy = require("../models/LeavePolicy");
const User = require("../models/User");
const { emitRequestCreated, emitRequestUpdated, emitRequestDeleted } = require("../socket");

// Helper: calculate available balance for a user and type in the current year
const calculateAvailableBalance = async (userId, type, excludeRequestId = null) => {
    const user = await User.findById(userId);
    if (!user) return 0;

    const currentYear = new Date().getFullYear();

    const now = new Date();
    const hireDate = new Date(user.hireDate);
    const yearsOfService = Math.floor((now - hireDate) / (1000 * 60 * 60 * 24 * 365.25));

    let totalDays = 0;
    if (type === "vacation") {
        const vacationPolicies = await LeavePolicy.find({ type: "vacation" }).sort({ minYears: -1 });
        const policy = vacationPolicies.find(p => p.minYears <= yearsOfService);
        totalDays = policy ? policy.totalDays : 0;
    } else if (type === "sick") {
        const sickPolicies = await LeavePolicy.find({ type: "sick" }).sort({ minYears: 1 });
        totalDays = sickPolicies[0] ? sickPolicies[0].totalDays : 0;
    }

    const query = {
        userId,
        type,
        status: "approved",
        startDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
        }
    };

    if (excludeRequestId) {
        query._id = { $ne: excludeRequestId };
    }

    const approvedRequests = await TimeOffRequest.find(query);
    const usedDays = approvedRequests.reduce((acc, r) => acc + r.totalDays, 0);

    return totalDays - usedDays;
};

// Helper: check if a date is in the past (before today)
const isPastDate = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date < today;
};

const createRequest = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        const { type, startDate, endDate, totalDays } = req.body;

        if (!type || !startDate || !endDate || !totalDays) {
            return res.status(400).json({ message: "Type, startDate, endDate and totalDays are required." });
        }

        if (isPastDate(startDate)) {
            return res.status(400).json({ message: "Start date cannot be in the past." });
        }

        const available = await calculateAvailableBalance(req.user.id, type);
        if (totalDays > available) {
            return res.status(400).json({
                message: `Insufficient balance. You have ${available} ${type} days available for this year.`
            });
        }

        const request = await TimeOffRequest.create({
            userId: req.user.id,
            userName: req.user.name,
            type,
            startDate,
            endDate,
            totalDays,
            status: "pending"
        });

        emitRequestCreated(request);

        return res.status(201).json({
            message: "Time off request created successfully.",
            data: { request }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error while creating the request." });
    }
};

const getRequests = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        const requests = await TimeOffRequest.find()
            .populate("userId", "name email role department")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Requests fetched successfully.",
            data: { requests }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error while fetching requests." });
    }
};

const getMyRequests = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        const requests = await TimeOffRequest.find({ userId: req.user.id })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Requests fetched successfully.",
            data: { requests }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error while fetching requests." });
    }
};

const updateRequest = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid request id." });
        }

        const request = await TimeOffRequest.findById(id);

        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        if (request.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only edit your own requests." });
        }

        // Only denied requests cannot be edited
        if (request.status === "denied") {
            return res.status(400).json({ message: "Denied requests cannot be edited." });
        }

        const { type, startDate, endDate, totalDays } = req.body;

        const newStartDate = startDate || request.startDate;
        if (isPastDate(newStartDate)) {
            return res.status(400).json({ message: "Start date cannot be in the past." });
        }

        const requestType = type || request.type;
        const requestTotalDays = totalDays || request.totalDays;
        const available = await calculateAvailableBalance(req.user.id, requestType, id);
        if (requestTotalDays > available) {
            return res.status(400).json({
                message: `Insufficient balance. You have ${available} ${requestType} days available for this year.`
            });
        }

        const updatePayload = { status: "pending" };
        if ("type" in req.body) updatePayload.type = type;
        if ("startDate" in req.body) updatePayload.startDate = startDate;
        if ("endDate" in req.body) updatePayload.endDate = endDate;
        if ("totalDays" in req.body) updatePayload.totalDays = totalDays;

        const updatedRequest = await TimeOffRequest.findByIdAndUpdate(id, updatePayload, {
            new: true,
            runValidators: true
        });

        emitRequestUpdated(updatedRequest);

        return res.status(200).json({
            message: "Request updated successfully.",
            data: { request: updatedRequest }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error while updating the request." });
    }
};

const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid request id." });
        }

        const request = await TimeOffRequest.findById(id);

        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        if (request.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your own requests." });
        }

        await request.deleteOne();

        emitRequestDeleted(request);

        return res.status(200).json({
            message: "Request deleted successfully.",
            data: { request }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error while deleting the request." });
    }
};

const approveRequest = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid request id." });
        }

        const request = await TimeOffRequest.findById(id);

        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        // Validate balance before approving
        const available = await calculateAvailableBalance(request.userId, request.type, id);
        if (request.totalDays > available) {
            return res.status(400).json({
                message: `Cannot approve. Employee has insufficient balance. Available: ${available} ${request.type} days for this year.`
            });
        }

        const updatedRequest = await TimeOffRequest.findByIdAndUpdate(
            id,
            { status: "approved" },
            { new: true, runValidators: true }
        );

        emitRequestUpdated(updatedRequest);

        return res.status(200).json({
            message: "Request approved successfully.",
            data: { request: updatedRequest }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error while approving the request." });
    }
};

const denyRequest = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid request id." });
        }

        const request = await TimeOffRequest.findByIdAndUpdate(
            id,
            { status: "denied" },
            { new: true, runValidators: true }
        );

        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        emitRequestUpdated(request);

        return res.status(200).json({
            message: "Request denied successfully.",
            data: { request }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error while denying the request." });
    }
};

module.exports = { createRequest, getRequests, getMyRequests, updateRequest, deleteRequest, approveRequest, denyRequest };