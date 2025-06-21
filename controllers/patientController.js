const Patient = require('../models/Patient');

// @desc    Get all unique patients
// @route   GET /api/patients
// @access  Private
const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.aggregate([
      { $sort: { visitDate: -1 } },
      {
        $group: {
          _id: { name: "$name", phone: "$phone" },
          latestVisit: { $first: "$$ROOT" },
          totalVisits: { $sum: 1 },
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [ "$latestVisit", { totalVisits: "$totalVisits" } ]
          }
        }
      }
    ]);
    res.json(patients);
  } catch (err) {
    console.error("Error fetching patients:", err);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
};

// @desc    Get a single patient/visit by ID
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json(patient);
  } catch (err) {
    console.error("Error fetching patient:", err);
    res.status(500).json({ error: "Failed to fetch patient" });
  }
};

// @desc    Get all visits for a specific patient
// @route   GET /api/patients/visits/:name/:phone
// @access  Private
const getPatientVisits = async (req, res) => {
  try {
    const { name, phone } = req.params;
    const visits = await Patient.find({
      name: decodeURIComponent(name),
      phone: decodeURIComponent(phone)
    }).sort({ visitDate: -1 });
    res.json(visits);
  } catch (err) {
    console.error("Error fetching visits:", err);
    res.status(500).json({ error: "Failed to fetch visits" });
  }
};

// @desc    Add a new patient/visit
// @route   POST /api/patients
// @access  Private
const addPatient = async (req, res) => {
    try {
        const patient = new Patient(req.body);
        await patient.save();
        res.status(201).json(patient);
    } catch (err) {
        console.error("Error adding patient:", err);
        if (err.code === 11000) {
            return res.status(409).json({ error: "A visit for this patient on this date already exists." });
        }
        res.status(500).json({ error: "Failed to add patient" });
    }
};

// @desc    Update patient demographics across all visits
// @route   PUT /api/patients/update-demographics
// @access  Private
const updateDemographics = async (req, res) => {
  const { originalPhone, originalName, updatedPatientInfo } = req.body;
  if (!originalPhone || !originalName || !updatedPatientInfo) {
    return res.status(400).json({ error: "Missing required information for update." });
  }
  try {
    const result = await Patient.updateMany(
      { name: originalName, phone: originalPhone },
      { $set: updatedPatientInfo }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "No patient records found to update." });
    }
    res.json({ message: `Successfully updated ${result.modifiedCount} records.` });
  } catch (err) {
    console.error("Error updating patient demographics:", err);
    res.status(500).json({ error: "Failed to update patient information." });
  }
};

// @desc    Update a single visit by ID
// @route   PUT /api/patients/:id
// @access  Private
const updateVisitById = async (req, res) => {
  try {
    const updatedVisit = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedVisit) {
      return res.status(404).json({ error: "Visit not found." });
    }
    res.json(updatedVisit);
  } catch (err) {
    console.error("Error updating visit:", err);
    res.status(500).json({ error: "Failed to update visit record." });
  }
};

// @desc    Delete a patient and all their visits
// @route   DELETE /api/patients/by-name-and-phone/:name/:phone
// @access  Private
const deleteAllPatientVisits = async (req, res) => {
  try {
    const { name, phone } = req.params;
    const result = await Patient.deleteMany({
      name: decodeURIComponent(name),
      phone: decodeURIComponent(phone)
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "No records found for this patient." });
    }
    res.json({ message: `Successfully deleted ${result.deletedCount} records for patient ${decodeURIComponent(name)}.` });
  } catch (err) {
    console.error("Error deleting all patient records:", err);
    res.status(500).json({ error: "Failed to delete patient records." });
  }
};

// @desc    Get all visits for a specific date
// @route   GET /api/patients/by-date/:date
// @access  Private
const getVisitsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    // We need to query for a range from the start of the day to the end of the day.
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const visits = await Patient.find({
      followUpDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ visitDate: 'asc' }); // Sort by time of day

    res.json(visits);
  } catch (err) {
    console.error("Error fetching visits by date:", err);
    res.status(500).json({ error: "Failed to fetch appointments." });
  }
};

// @desc    Get aggregated analytics data within a date range
// @route   GET /api/patients/analytics
// @access  Private
const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start date and end date are required." });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const matchStage = {
      $match: {
        visitDate: { $gte: start, $lte: end }
      }
    };

    const analytics = await Patient.aggregate([
      matchStage,
      {
        $group: {
          _id: null, // Group all documents together
          totalVisits: { $sum: 1 },
          totalFees: { $sum: "$amountPaid" },
          // To get unique patients, we need another approach
        }
      }
    ]);

    // A separate query to count unique patients in the date range
    const uniquePatients = await Patient.distinct('phone', { // Using phone as unique identifier
        visitDate: { $gte: start, $lte: end }
    });

    const result = {
      totalVisits: analytics[0]?.totalVisits || 0,
      totalFees: analytics[0]?.totalFees || 0,
      totalUniquePatients: uniquePatients.length || 0,
    };

    res.json(result);

  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ error: "Failed to fetch analytics data." });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  getPatientVisits,
  addPatient,
  updateDemographics,
  updateVisitById,
  deleteAllPatientVisits,
  getVisitsByDate,
  getAnalytics,
}; 