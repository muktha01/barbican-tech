
import Company from "../models/BoardStockCompany.js"; // Assuming this is the correct path for your Company model
import DistributorCompany from '../models/BoardStockDistributorCompany.js';



// @access  Public (or Protected, depending on your auth setup)
export const createDistributorCompany = async (req, res) => {
  console.log(req.body);
  try {
    const {
      press,
      matter,
      printingSize,
      plate,
      color,
      extraColor,
      contactDetails,
      printingDetails
    } = req.body;

    const newCompany = await DistributorCompany.create({
      company_id: press,
      matter,
      printingSize,
      plate,
      color,
      extraColor,
      contactDetails,
      printingDetails
    });

    // Refetch with associated company to get name
    const distributorWithCompany = await DistributorCompany.findOne({
      where: { id: newCompany.id },
      include: [
        { model: Company, attributes: ['company_name'] },
      ]
    });

    console.log("distributorWithCompany", distributorWithCompany)

    res.status(201).json({
      success: true,
      message: 'Distributor company created successfully.',
      data: {
        id: distributorWithCompany.id,
        company_id:distributorWithCompany.company_id,
        color:distributorWithCompany.color,
        company_name:distributorWithCompany.Company.company_name,
        contactDetails:distributorWithCompany.contactDetails,
        createdAt:distributorWithCompany.createdAt,
        extraColor:distributorWithCompany.extraColor,
        matter:distributorWithCompany.matter,
        plate:distributorWithCompany.plate,
        printingDetails:distributorWithCompany.printingDetails,
        printingSize:distributorWithCompany.printingSize
      }
    });
  } catch (error) {
    console.error('Error creating distributor company:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};


// @desc    Get all distributor companies
// @route   GET /api/distributor-companies
export const getAllDistributorCompanies = async (req, res) => {
  try {
    const companies = await DistributorCompany.findAll({
      include: [
        { model: Company, attributes: ['company_name'] },
      ]
    });

    res.status(200).json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Error fetching distributor companies:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

export const getDistributedCompanyByID=async (req,res)=>{
  console.log("req.params",req.params)
  try{
    const { id } = req.params;
    const company_id=id;
     const company = await DistributorCompany.findAll({
      where: { company_id }, // assuming 'company_id' is a column (foreign key)
    });

    console.log(company)
    if (!company || company.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }
     res.status(200).json({ message: "Company deleted successfully",data:company });
  }
   catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const deleteDistributorCompanyById = async (req, res) => {
  console.log("request", req)
  try {
    const { id } = req.params;
    const company = await DistributorCompany.findByPk(id);
    console.log(company)
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


export const updateDistributorCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      company_name, // This is what the frontend is likely sending for the company's name
      matter,
      printingSize,
      plate,
      color,
      extraColor,
      contactDetails,
      printingDetails
    } = req.body;

    const companyToUpdate = await DistributorCompany.findByPk(id);

    if (!companyToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Distributor company not found.'
      });
    }

    let companyIdToSet = companyToUpdate.company_id; // Default to existing company_id

    // If company_name is provided in the request, we need to find its ID
    if (company_name !== undefined && company_name !== null && company_name !== '') {
        const companyRecord = await Company.findOne({
            where: { company_name: company_name }
        });

        if (!companyRecord) {
            // If the company_name doesn't exist, return an error
            return res.status(400).json({
                success: false,
                message: `Company with name '${company_name}' not found. Please provide an existing company name.`
            });
        }
        companyIdToSet = companyRecord.id; // Use the found company's ID
    }

    // Update the company's attributes
    await companyToUpdate.update({
      company_id: companyIdToSet, // Use the dynamically determined companyIdToSet
      matter,
      printingSize,
      plate,
      color,
      extraColor,
      contactDetails,
      printingDetails
    });

    // Refetch the updated company with its associated Company details
    const updatedDistributorCompany = await DistributorCompany.findOne({
      where: { id: id },
      include: [
        { model: Company, attributes: ['company_name'] },
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Distributor company updated successfully.',
      data: {
        id: updatedDistributorCompany.id,
        company_id: updatedDistributorCompany.company_id,
        color: updatedDistributorCompany.color,
        // Ensure Company is not null before accessing company_name
        Company: updatedDistributorCompany.Company ? { company_name: updatedDistributorCompany.Company.company_name } : null,
        contactDetails: updatedDistributorCompany.contactDetails,
        createdAt: updatedDistributorCompany.createdAt,
        extraColor: updatedDistributorCompany.extraColor,
        matter: updatedDistributorCompany.matter,
        plate: updatedDistributorCompany.plate,
        printingDetails: updatedDistributorCompany.printingDetails,
        printingSize: updatedDistributorCompany.printingSize,
        updatedAt: updatedDistributorCompany.updatedAt // Include updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating distributor company:', error);
    // Provide a more specific error message if it's a foreign key constraint issue
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID provided. The referenced company does not exist.',
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};