import Company from '../models/BoardStockCompany.js'

export const createCompany = async (req, res) => {
  console.log("req", req.body)
  try {
    const { company_name, person_name, phone_number, gst_number, address } = req.body;
    
    if (!company_name) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const newCompany = await Company.create({
      company_name,
      person_name,
      phone_number,
      gst_number,
      address,
    });

    res.status(201).json(newCompany);
  } catch (error) {
    console.error("Error creating company:", error);
    
    // Handle unique constraint error
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Company name already exists" });
    }
    
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({
      order: [['createdAt', 'DESC']] // Order by newest first
    });
    res.status(200).json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    res.status(200).json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCompany = async (req, res) => {
  console.log("Update request:", req.body);
  try {
    const { id } = req.params;
    const { company_name, person_name, phone_number, gst_number, address } = req.body;
    
    if (!company_name) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const company = await Company.findByPk(id);
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Update the company
    const updatedCompany = await company.update({
      company_name,
      person_name,
      phone_number,
      gst_number,
      address,
    });

    res.status(200).json(updatedCompany);
  } catch (error) {
    console.error("Error updating company:", error);
    
    // Handle unique constraint error
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Company name already exists" });
    }
    
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCompanyById = async (req, res) => {
  console.log("Delete request:", req.params);
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    await company.destroy();
    res.status(200).json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};