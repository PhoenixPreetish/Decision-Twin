const DigitalTwin = require('../models/DigitalTwin');

// @desc Get current user's Digital Twin
// @route GET /api/digital-twin
exports.getDigitalTwin = async (req, res, next) => {
  try {
    let twin = await DigitalTwin.findOne({ userId: req.user.id });
    if (!twin) {
      return res.status(200).json({ success: true, digitalTwin: null, isComplete: false });
    }
    res.status(200).json({ success: true, digitalTwin: twin, isComplete: twin.isComplete });
  } catch (err) {
    next(err);
  }
};

// @desc Create or Update Digital Twin profile (REQ-4, REQ-5, REQ-6)
// @route POST /api/digital-twin
exports.saveDigitalTwin = async (req, res, next) => {
  try {
    const {
      age,
      highestEducation,
      fieldOfStudy,
      currentOccupation,
      yearsOfExperience,
      currentSalary,
      savings,
      debt,
      monthlyExpenses,
      keySkills,
      riskTolerance
    } = req.body;

    const isComplete = Boolean(
      age &&
      highestEducation &&
      fieldOfStudy &&
      currentOccupation &&
      yearsOfExperience !== undefined &&
      currentSalary !== undefined &&
      savings !== undefined &&
      monthlyExpenses !== undefined &&
      riskTolerance
    );

    const profileData = {
      userId: req.user.id,
      age: Number(age),
      highestEducation,
      fieldOfStudy,
      currentOccupation,
      yearsOfExperience: Number(yearsOfExperience),
      currentSalary: Number(currentSalary),
      savings: Number(savings),
      debt: Number(debt || 0),
      monthlyExpenses: Number(monthlyExpenses),
      keySkills: Array.isArray(keySkills) ? keySkills : (keySkills ? keySkills.split(',').map(s => s.trim()) : []),
      riskTolerance: riskTolerance || 'medium',
      isComplete,
      lastUpdated: Date.now()
    };

    let twin = await DigitalTwin.findOneAndUpdate(
      { userId: req.user.id },
      { $set: profileData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Digital Twin profile updated successfully',
      digitalTwin: twin,
      isComplete: twin.isComplete
    });
  } catch (err) {
    next(err);
  }
};
