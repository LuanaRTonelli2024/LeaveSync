const express = require("express");
const { createRequest, getRequests, getMyRequests, updateRequest, deleteRequest, approveRequest, denyRequest } = require("../controllers/timeOffController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getRequests);
router.get("/me", getMyRequests);
router.post("/", createRequest);
router.patch("/:id", updateRequest);
router.delete("/:id", deleteRequest);
router.patch("/:id/approve", approveRequest);
router.patch("/:id/deny", denyRequest);

module.exports = router;