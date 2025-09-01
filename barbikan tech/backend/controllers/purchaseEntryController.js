import { Product, Factory, Supplier, PurchaseEntry } from "../models/index.js";
import moment from "moment";
import ProductStock from "../models/ProductStock.js";

// Create a new purchase entry
export const createPurchaseEntry = async (req, res) => {
  try {
    const {
      purchase_date,
      bill_no,
      quantity,
      type,
      supplier_id,
      product_id,
      factory_id,
    } = req.body;

    console.log("Received data:", req.body);

    // Validation
    if (
      !purchase_date ||
      !bill_no ||
      !quantity ||
      !type ||
      !supplier_id ||
      !product_id ||
      !factory_id
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate quantity is positive
    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0." });
    }

    const formattedDate = moment(purchase_date, "DD-MM-YYYY", true);
    if (!formattedDate.isValid()) {
      return res.status(400).json({ message: "Invalid purchase date format." });
    }

    const isoFormattedDate = formattedDate.format("YYYY-MM-DD");

    // Verify that the product exists and belongs to the specified factory
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Verify that the factory exists
    const factory = await Factory.findByPk(factory_id);
    if (!factory) {
      return res.status(404).json({ message: "Factory not found." });
    }

    // Verify that the supplier exists
    const supplier = await Supplier.findByPk(supplier_id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found." });
    }

    // Check if ProductStock entry exists for this product and factory
    let productStock = await ProductStock.findOne({
      where: {
        product_id: product_id,
        factory_id: factory_id
      }
    });

    if (!productStock) {
      // Create new ProductStock entry if it doesn't exist
      productStock = await ProductStock.create({
        product_id: product_id,
        factory_id: factory_id,
        opening_stock: 0,
        current_stock: 0
      });
    }

    // Start transaction to ensure data consistency
    const transaction = await ProductStock.sequelize.transaction();

    try {
      // Create purchase entry
      const purchase = await PurchaseEntry.create({
        purchase_date: isoFormattedDate,
        bill_no,
        quantity: parseFloat(quantity),
        type: type.toLowerCase(),
        supplier_id,
        product_id,
        factory_id,
      }, { transaction });

      // Update current stock by adding the purchased quantity
      const updatedCurrentStock = parseFloat(productStock.current_stock) + parseFloat(quantity);
      
      await productStock.update({
        current_stock: updatedCurrentStock
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      // Fetch full data of related entities for response
      const fullPurchase = await PurchaseEntry.findByPk(purchase.id, {
        include: [
          { model: Supplier, as: "supplier" },
          { model: Product, as: "product" },
          { model: Factory, as: "factory" },
        ],
      });

      return res.status(201).json({
        message: "Purchase entry created successfully.",
        purchase: fullPurchase,
        stock_updated: {
          previous_stock: productStock.current_stock,
          added_quantity: quantity,
          new_stock: updatedCurrentStock
        }
      });

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error("Error creating purchase entry:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get all purchase entries
export const getAllPurchaseEntries = async (req, res) => {
  try {
    const purchases = await PurchaseEntry.findAll({
      include: [
        { model: Product, as: "product" },
        { model: Factory, as: "factory" }, 
        { model: Supplier, as: "supplier" }
      ],
      order: [["createdAt", "DESC"]],
    });

    return res
      .status(200)
      .json({ message: "Purchase entries retrieved successfully", purchases });
  } catch (error) {
    console.error("Error fetching purchase entries:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get single purchase entry by ID
export const getPurchaseEntryById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await PurchaseEntry.findByPk(id, {
      include: [
        { model: Product, as: "product" },
        { model: Factory, as: "factory" },
        { model: Supplier, as: "supplier" }
      ],
    });

    if (!purchase) {
      return res.status(404).json({ message: "Purchase entry not found." });
    }

    return res
      .status(200)
      .json({ message: "Purchase entry retrieved successfully", purchase });
  } catch (error) {
    console.error("Error fetching purchase entry:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Update a purchase entry
export const updatePurchaseEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      purchase_date,
      bill_no,
      quantity,
      type,
      supplier_id,
      product_id,
      factory_id,
    } = req.body;

    console.log("Update request data:", req.body);

    const purchase = await PurchaseEntry.findByPk(id);

    if (!purchase) {
      return res.status(404).json({ message: "Purchase entry not found." });
    }

    // Store original quantity for stock calculation
    const originalQuantity = parseFloat(purchase.quantity);
    const newQuantity = quantity ? parseFloat(quantity) : originalQuantity;
    const quantityDifference = newQuantity - originalQuantity;

    // If purchase_date is provided, validate and format it
    let formattedDate = purchase.purchase_date;
    if (purchase_date) {
      const momentDate = moment(purchase_date, "DD-MM-YYYY", true);
      if (!momentDate.isValid()) {
        return res
          .status(400)
          .json({ message: "Invalid purchase date format." });
      }
      formattedDate = momentDate.format("YYYY-MM-DD");
    }

    // Determine which product and factory to update stock for
    const targetProductId = product_id || purchase.product_id;
    const targetFactoryId = factory_id || purchase.factory_id;

    // Start transaction
    const transaction = await PurchaseEntry.sequelize.transaction();

    try {
      // If product or factory changed, we need to handle stock updates for both old and new
      if ((product_id && product_id !== purchase.product_id) || 
          (factory_id && factory_id !== purchase.factory_id)) {
        
        // Revert stock from original product-factory combination
        const originalProductStock = await ProductStock.findOne({
          where: {
            product_id: purchase.product_id,
            factory_id: purchase.factory_id
          }
        });

        if (originalProductStock) {
          await originalProductStock.update({
            current_stock: parseFloat(originalProductStock.current_stock) - originalQuantity
          }, { transaction });
        }

        // Add stock to new product-factory combination
        let newProductStock = await ProductStock.findOne({
          where: {
            product_id: targetProductId,
            factory_id: targetFactoryId
          }
        });

        if (!newProductStock) {
          newProductStock = await ProductStock.create({
            product_id: targetProductId,
            factory_id: targetFactoryId,
            opening_stock: 0,
            current_stock: newQuantity
          }, { transaction });
        } else {
          await newProductStock.update({
            current_stock: parseFloat(newProductStock.current_stock) + newQuantity
          }, { transaction });
        }

      } else if (quantityDifference !== 0) {
        // Only quantity changed, update the same product-factory stock
        const productStock = await ProductStock.findOne({
          where: {
            product_id: targetProductId,
            factory_id: targetFactoryId
          }
        });

        if (productStock) {
          await productStock.update({
            current_stock: parseFloat(productStock.current_stock) + quantityDifference
          }, { transaction });
        }
      }

      // Update the purchase entry
      await purchase.update({
        purchase_date: formattedDate,
        bill_no: bill_no || purchase.bill_no,
        quantity: newQuantity,
        type: type ? type.toLowerCase() : purchase.type,
        supplier_id: supplier_id || purchase.supplier_id,
        product_id: targetProductId,
        factory_id: targetFactoryId,
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      // Fetch updated purchase with full related data
      const updatedPurchase = await PurchaseEntry.findByPk(id, {
        include: [
          { model: Supplier, as: "supplier" },
          { model: Product, as: "product" },
          { model: Factory, as: "factory" },
        ],
      });

      return res.status(200).json({
        message: "Purchase entry updated successfully.",
        purchase: updatedPurchase,
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error("Error updating purchase entry:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Delete a purchase entry
export const deletePurchaseEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await PurchaseEntry.findByPk(id);

    if (!purchase) {
      return res.status(404).json({ message: "Purchase entry not found." });
    }

    // Start transaction
    const transaction = await PurchaseEntry.sequelize.transaction();

    try {
      // Find the corresponding ProductStock entry
      const productStock = await ProductStock.findOne({
        where: {
          product_id: purchase.product_id,
          factory_id: purchase.factory_id
        }
      });

      if (productStock) {
        // Subtract the purchased quantity from current stock
        const updatedStock = parseFloat(productStock.current_stock) - parseFloat(purchase.quantity);
        
        await productStock.update({
          current_stock: Math.max(0, updatedStock) // Ensure stock doesn't go negative
        }, { transaction });
      }

      // Delete the purchase entry
      await purchase.destroy({ transaction });

      // Commit transaction
      await transaction.commit();

      return res.status(200).json({ 
        message: "Purchase entry deleted successfully.",
        stock_reverted: {
          quantity_removed: purchase.quantity,
          product_id: purchase.product_id,
          factory_id: purchase.factory_id
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error("Error deleting purchase entry:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get product stocks by factory and type (helper endpoint for frontend)
export const getProductStocksByFactoryAndType = async (req, res) => {
  try {
    const { factory_id, type } = req.query;

    if (!factory_id || !type) {
      return res.status(400).json({ message: "Factory ID and type are required." });
    }

    const productStocks = await ProductStock.findAll({
      include: [
        {
          model: Product,
          as: "product",
          where: { type: type.toLowerCase() },
          attributes: ['id', 'product_name', 'type', 'unit']
        },
        {
          model: Factory,
          as: "factory",
          where: { id: factory_id },
          attributes: ['id', 'factory_name']
        }
      ],
      attributes: ['id', 'opening_stock', 'current_stock', 'created_at', 'updated_at']
    });

    return res.status(200).json({
      message: "Product stocks retrieved successfully",
      stocks: productStocks
    });

  } catch (error) {
    console.error("Error fetching product stocks:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};