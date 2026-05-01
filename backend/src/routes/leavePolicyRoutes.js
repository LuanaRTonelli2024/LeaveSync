const express = require("express");
const { getPolicies, getPolicy, getMyBalance, createPolicy, updatePolicy, deletePolicy } = require("../controllers/leavePolicyController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getPolicies);
router.get("/my-balance", getMyBalance);
router.get("/:id", getPolicy);
router.post("/", createPolicy);
router.patch("/:id", updatePolicy);
router.delete("/:id", deletePolicy);

module.exports = router;