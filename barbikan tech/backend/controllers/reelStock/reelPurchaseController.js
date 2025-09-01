import ReelProduct from "../../models/ReelProduct.js";
import Factory from "../../models/Factory.js";
import ReelPurchaseEntry from "../../models/ReelPurchaseEntry.js";
import ReelSupplier from "../../models/ReelSupplier.js";
import moment from "moment";
import ReelProductStock from "../../models/ReelProductStock.js";
// Note: You'll need to create this model if you want stock management for reels
// import ReelProductStock from "../../models/ReelProductStock.js";

// Create a new Reel Purchase Entry
export const createReelPurchaseEntry = async (req, res) => {
  try {
    const {
      purchase_date,
      bill_no,
      quantity,
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

    // Verify that the reel product exists
    const reelProduct = await ReelProduct.findByPk(product_id);
    if (!reelProduct) {
      return res.status(404).json({ message: "Reel product not found." });
    }

    // Verify that the factory exists
    const factory = await Factory.findByPk(factory_id);
    if (!factory) {
      return res.status(404).json({ message: "Factory not found." });
    }

    // Verify that the reel supplier exists
    const reelSupplier = await ReelSupplier.findByPk(supplier_id);
    if (!reelSupplier) {
      return res.status(404).json({ message: "Reel supplier not found." });
    }

    
    // Uncomment this section if you implement ReelProductStock model
    // Check if ReelProductStock entry exists for this product and factory
    let reelProductStock = await ReelProductStock.findOne({
      where: {
        product_id: product_id,
        factory_id: factory_id
      }
    });

    if (!reelProductStock) {
      // Create new ReelProductStock entry if it doesn't exist
      reelProductStock = await ReelProductStock.create({
        product_id: product_id,
        factory_id: factory_id,
        opening_stock: 0,
        current_stock: 0
      });
    }

    // Start transaction to ensure data consistency
    const transaction = await ReelProductStock.sequelize.transaction();

    try {
      // Create reel purchase entry
      const purchase = await ReelPurchaseEntry.create({
        purchase_date: isoFormattedDate,
        bill_no,
        quantity: parseFloat(quantity),
        supplier_id,
        product_id,
        factory_id,
      }, { transaction });

      // Update current stock by adding the purchased quantity
      const updatedCurrentStock = parseFloat(reelProductStock.current_stock) + parseFloat(quantity);
      
      await reelProductStock.update({
        current_stock: updatedCurrentStock
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      // Fetch full data of related entities for response
      const fullPurchase = await ReelPurchaseEntry.findByPk(purchase.id, {
        include: [
          { model: ReelSupplier, as: "supplier" },
          { model: ReelProduct, as: "product" },
          { model: Factory, as: "factory" },
        ],
      });

      return res.status(201).json({
        message: "Reel purchase entry created successfully.",
        purchase: fullPurchase,
        stock_updated: {
          previous_stock: reelProductStock.current_stock,
          added_quantity: quantity,
          new_stock: updatedCurrentStock
        }
      });

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }


    // Simple version without stock management (current implementation)
    // Create reel purchase entry
    const purchase = await ReelPurchaseEntry.create({
      purchase_date: isoFormattedDate,
      bill_no,
      quantity: parseFloat(quantity),
      supplier_id,
      product_id,
      factory_id,
    });

    // Fetch full data of related entities for response
    const fullPurchase = await ReelPurchaseEntry.findByPk(purchase.id, {
      include: [
        { model: ReelSupplier, as: "supplier" },
        { model: ReelProduct, as: "product" },
        { model: Factory, as: "factory" },
      ],
    });

    return res.status(201).json({
      message: "Reel purchase entry created successfully.",
      purchase: fullPurchase,
    });

  } catch (error) {
    console.error("Error creating reel purchase entry:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get all Reel Purchase Entries
export const getAllReelPurchaseEntries = async (req, res) => {
  try {
    const purchases = await ReelPurchaseEntry.findAll({
      include: [
        { model: ReelProduct, as: "product" },
        { model: Factory, as: "factory" },
        { model: ReelSupplier, as: "supplier" },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res
      .status(200)
      .json({ message: "Reel purchase entries retrieved successfully", purchases });
  } catch (error) {
    console.error("Error fetching reel purchase entries:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get single Reel Purchase Entry by ID
export const getReelPurchaseEntryById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await ReelPurchaseEntry.findByPk(id, {
      include: [
        { model: ReelProduct, as: "product" },
        { model: Factory, as: "factory" },
        { model: ReelSupplier, as: "supplier" },
      ],
    });

    if (!purchase) {
      return res.status(404).json({ message: "Reel purchase entry not found." });
    }

    return res
      .status(200)
      .json({ message: "Reel purchase entry retrieved successfully", purchase });
  } catch (error) {
    console.error("Error fetching reel purchase entry:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Update a Reel Purchase Entry
export const updateReelPurchaseEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      purchase_date,
      bill_no,
      quantity,
      supplier_id,
      product_id,
      factory_id,
    } = req.body;

    console.log("Update request data:", req.body);

    const purchase = await ReelPurchaseEntry.findByPk(id);

    if (!purchase) {
      return res.status(404).json({ message: "Reel purchase entry not found." });
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
    const transaction = await ReelPurchaseEntry.sequelize.transaction();

    try {
      // If product or factory changed, we need to handle stock updates for both old and new
      if ((product_id && product_id !== purchase.product_id) || 
          (factory_id && factory_id !== purchase.factory_id)) {
        
        // Revert stock from original product-factory combination
        const originalProductStock = await ReelProductStock.findOne({
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
        let newProductStock = await ReelProductStock.findOne({
          where: {
            product_id: targetProductId,
            factory_id: targetFactoryId
          }
        });

        if (!newProductStock) {
          newProductStock = await ReelProductStock.create({
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
        const productStock = await ReelProductStock.findOne({
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
        supplier_id: supplier_id || purchase.supplier_id,
        product_id: targetProductId,
        factory_id: targetFactoryId,
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      // Fetch updated purchase with full related data
      const updatedPurchase = await ReelPurchaseEntry.findByPk(id, {
        include: [
          { model: ReelSupplier, as: "supplier" },
          { model: ReelProduct, as: "product" },
          { model: Factory, as: "factory" },
        ],
      });

      return res.status(200).json({
        message: "Reel purchase entry updated successfully.",
        purchase: updatedPurchase,
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error("Error updating reel purchase entry:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Delete a Reel Purchase Entry
export const deleteReelPurchaseEntry = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Deleting Reel Purchase Entry with ID:", req.params);

    const purchase = await ReelPurchaseEntry.findByPk(id);

    if (!purchase) {
      return res.status(404).json({ message: "Reel purchase entry not found." });
    }

    
    // Uncomment this section if you implement ReelProductStock model
    // Start transaction
    const transaction = await ReelPurchaseEntry.sequelize.transaction();

    try {
      // Find the corresponding ReelProductStock entry
      const reelProductStock = await ReelProductStock.findOne({
        where: {
          product_id: purchase.product_id,
          factory_id: purchase.factory_id
        }
      });

      if (reelProductStock) {
        // Subtract the purchased quantity from current stock
        console.log("Reverting stock for product:", reelProductStock.current_stock, "in purchase quantity:", purchase.quantity);
        const updatedStock = parseFloat(reelProductStock.current_stock) - parseFloat(purchase.quantity);
        
        await reelProductStock.update({
          current_stock: Math.max(0, updatedStock) // Ensure stock doesn't go negative
        }, { transaction });
      }

      // Delete the reel purchase entry
      await purchase.destroy({ transaction });

      // Commit transaction
      await transaction.commit();

      return res.status(200).json({ 
        message: "Reel purchase entry deleted successfully.",
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
    

    // Simple version without stock management (current implementation)
    await purchase.destroy();

    return res
      .status(200)
      .json({ message: "Reel purchase entry deleted successfully." });

  } catch (error) {
    console.error("Error deleting reel purchase entry:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getReelProductStocksByFactory = async (req, res) => {
  try {
    const { factory_id } = req.query;

    if (!factory_id) {
      return res.status(400).json({ message: "Factory ID is required." });
    }

    /* 
    // Uncomment this section if you implement ReelProductStock model
    const reelProductStocks = await ReelProductStock.findAll({
      include: [
        {
          model: ReelProduct,
          as: "product",
          attributes: ['id', 'product_name', 'unit']
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
      message: "Reel product stocks retrieved successfully",
      stocks: reelProductStocks
    });
    */

    // Temporary response without stock management
    return res.status(501).json({
      message: "Reel product stock management not implemented yet. Please implement ReelProductStock model first."
    });

  } catch (error) {
    console.error("Error fetching reel product stocks:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};