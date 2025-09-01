import ReelSupplier from "../../models/ReelSupplier.js";

// Create a new Reel Supplier
export const createReelSupplier = async (req, res) => {
  try {
    const { supplier_name, company_name, gst_number, mobile_number } = req.body;

    // Validation: all required fields except 'type' which does not exist in model
    if (!supplier_name || !company_name) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if supplier with same name exists
    const existingSupplier = await ReelSupplier.findOne({
      where: { supplier_name },
    });
    if (existingSupplier) {
      return res
        .status(409)
        .json({ message: "Supplier with this name already exists." });
    }

    const supplier = await ReelSupplier.create({
      supplier_name,
      company_name,
      gst_number,
      mobile_number,
    });

    return res
      .status(201)
      .json({ message: "Supplier created successfully.", supplier });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get all Reel Suppliers
export const getAllReelSuppliers = async (req, res) => {
  try {
    const suppliers = await ReelSupplier.findAll({
      order: [["createdAt", "DESC"]],
    });
    return res
      .status(200)
      .json({ message: "Suppliers retrieved successfully", suppliers });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get single Reel Supplier by ID
export const getReelSupplierById = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const supplier = await ReelSupplier.findByPk(supplierId);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found." });
    }

    return res
      .status(200)
      .json({ message: "Supplier retrieved successfully", supplier });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Update a Reel Supplier
export const updateReelSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { supplier_name, company_name, gst_number, mobile_number } = req.body;

    const supplier = await ReelSupplier.findByPk(supplierId);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found." });
    }

    await supplier.update({
      supplier_name: supplier_name || supplier.supplier_name,
      company_name: company_name || supplier.company_name,
      gst_number: gst_number || supplier.gst_number,
      mobile_number: mobile_number || supplier.mobile_number,
    });

    return res
      .status(200)
      .json({ message: "Supplier updated successfully.", supplier });
  } catch (error) {
    console.error("Error updating supplier:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Delete a Reel Supplier
export const deleteReelSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const supplier = await ReelSupplier.findByPk(supplierId);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found." });
    }

    await supplier.destroy();

    return res.status(200).json({ message: "Supplier deleted successfully." });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
