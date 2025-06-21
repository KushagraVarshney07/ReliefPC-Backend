// routes/patientRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllPatients,
  getPatientById,
  getPatientVisits,
  addPatient,
  updateDemographics,
  updateVisitById,
  deleteAllPatientVisits,
  getVisitsByDate,
  getAnalytics,
} = require("../controllers/patientController");

// --- GET Routes ---
router.get("/analytics", getAnalytics);
router.get("/", getAllPatients);
router.get("/by-date/:date", getVisitsByDate);
router.get("/visits/:name/:phone", getPatientVisits);
router.get("/:id", getPatientById);

// --- POST Routes ---
router.post("/", addPatient);

// --- PUT Routes ---
router.put("/update-demographics", updateDemographics);
router.put("/:id", updateVisitById);

// --- DELETE Routes ---
router.delete("/by-name-and-phone/:name/:phone", deleteAllPatientVisits);

module.exports = router;
