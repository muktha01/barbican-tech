import { Supplier } from "../models/index.js";

// Create Supplier
export const createSupplier = async (req, res) => {
  try {
    const {
      supplier_name,
      company_name,
      gst_number,
      mobile_number,
      type,
    } = req.body;

    if (!supplier_name || !company_name || !type) {
      return res.status(400).json({
        message: "supplier_name, company_name, and type are required fields.",
      });
    }

    const existingSupplier = await Supplier.findOne({
      where: {
        supplier_name,
        company_name,
      },
    });

    if (existingSupplier) {
      return res.status(409).json({
        message: "Supplier with this name already exists for this company.",
      });
    }

    const supplier = await Supplier.create({
      supplier_name,
      company_name,
      gst_number,
      mobile_number,
      type,
    });

    return res.status(201).json({
      message: "Supplier created successfully.",
      supplier,
    });
  } catch (error) {
    console.error("Error creating supplier:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get All Suppliers
export const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Suppliers retrieved successfully.",
      suppliers,
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get Supplier by ID
export const getSupplierById = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const supplier = await Supplier.findByPk(supplierId);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found." });
    }

    return res.status(200).json({
      message: "Supplier retrieved successfully.",
      supplier,
    });
  } catch (error) {
    console.error("Error fetching supplier:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Update Supplier
export const updateSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const updates = req.body;

    const supplier = await Supplier.findByPk(supplierId);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found." });
    }

    await supplier.update(updates);

    return res.status(200).json({
      message: "Supplier updated successfully.",
      supplier,
    });
  } catch (error) {
    console.error("Error updating supplier:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Delete Supplier (Soft Delete)
export const deleteSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const supplier = await Supplier.findByPk(supplierId);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found." });
    }

    await supplier.destroy(); // paranoid true enables soft delete

    return res.status(200).json({ message: "Supplier deleted successfully." });
  } catch (error) {
    console.error("Error deleting supplier:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};
