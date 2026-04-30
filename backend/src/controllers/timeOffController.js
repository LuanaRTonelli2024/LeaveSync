const mongoose = require("mongoose");
const TimeOffRequest = require("../models/TimeOffRequest");
const { emitRequestCreated, emitRequestUpdated, emitRequestDeleted } = require("../socket");

const createRequest = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized." });
        }

        const { type, startDate, endDate, totalDays } = req.body;

        if (!type || !startDate || !endDate || !totalDays) {
            return res.status(400).json({ message: "Type, startDate, endDate and totalDays are required." });
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

        if (request.status !== "pending") {
            return res.status(400).json({ message: "Only pending requests can be edited." });
        }

        const { type, startDate, endDate, totalDays } = req.body;

        const updatePayload = {};
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

        const request = await TimeOffRequest.findByIdAndUpdate(
            id,
            { status: "approved" },
            { new: true, runValidators: true }
        );

        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        emitRequestUpdated(request);

        return res.status(200).json({
            message: "Request approved successfully.",
            data: { request }
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