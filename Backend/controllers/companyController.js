import Company from "../models/Company.js";

// Get company profile
export const getCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ ownerId: req.user.id }).populate(
      "ownerId",
      "name email"
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found",
      });
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Create company profile
export const createCompany = async (req, res) => {
  try {
    // Check if company already exists for this user
    const existingCompany = await Company.findOne({ ownerId: req.user.id });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "Company profile already exists",
      });
    }

    const company = await Company.create({
      ...req.body,
      ownerId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Company profile created successfully",
      data: company,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create company profile",
      error: error.message,
    });
  }
};

// Update company profile
export const updateCompany = async (req, res) => {
  try {
    const company = await Company.findOneAndUpdate(
      { ownerId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found",
      });
    }

    res.json({
      success: true,
      message: "Company profile updated successfully",
      data: company,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update company profile",
      error: error.message,
    });
  }
};

// Delete company profile
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findOneAndDelete({ ownerId: req.user.id });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found",
      });
    }

    res.json({
      success: true,
      message: "Company profile deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Get all companies (for public view)
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .select("-ownerId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
