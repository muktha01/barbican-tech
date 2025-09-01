import { ReelUsage, ReelProduct, Factory } from "../../models/index.js";
import ReelProductStock from "../../models/ReelProductStock.js";
// Note: You'll need to create this model if you want stock management for reels
// import ReelProductStock from "../../models/ReelProductStock.js";

// Create ReelUsage
export const createReelUsage = async (req, res) => {
  try {
    const { quantity, product_id, factory_id } = req.body;
    console.log("req", req.body);

    if (quantity === undefined || !product_id || !factory_id) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate quantity is positive
    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0." });
    }

    const product = await ReelProduct.findByPk(product_id);
    if (!product)
      return res.status(404).json({ message: "Reel product not found." });

    const factory = await Factory.findByPk(factory_id);
    if (!factory)
      return res.status(404).json({ message: "Factory not found." });

  
    // Uncomment this section if you implement ReelProductStock model
    // Find the reel product stock for this factory and product
    const reelProductStock = await ReelProductStock.findOne({
      where: {
        product_id: product_id,
        factory_id: factory_id
      }
    });

    if (!reelProductStock) {
      return res.status(404).json({ message: "Reel product stock not found for this factory." });
    }

    // Check if there's enough stock
    if (reelProductStock.current_stock < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Available: ${reelProductStock.current_stock} ${product.unit}, Requested: ${quantity} ${product.unit}` 
      });
    }

    // Start transaction for stock management
    const transaction = await ReelUsage.sequelize.transaction();

    try {
      // Create reel usage entry
      const reelUsage = await ReelUsage.create({ 
        factory_id,
        product_id,
        quantity,
      }, { transaction });

      // Update the current stock by reducing the usage quantity
      await reelProductStock.update({
        current_stock: reelProductStock.current_stock - quantity
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      return res
        .status(201)
        .json({ 
          message: "Reel usage entry created successfully and stock updated.", 
          reelUsage,
          stock_updated: {
            previous_stock: reelProductStock.current_stock + quantity,
            used_quantity: quantity,
            remaining_stock: reelProductStock.current_stock
          }
        });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }


    // Simple version without stock management (current implementation)
    const reelUsage = await ReelUsage.create({
      quantity,
      product_id,
      factory_id,
    });

    return res
      .status(201)
      .json({ message: "Reel usage entry created successfully.", reelUsage });

  } catch (error) {
    console.error("Error creating reel usage:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get all ReelUsage records
export const getAllReelUsages = async (req, res) => {
  try {
    const reelUsages = await ReelUsage.findAll({
      include: [
        { model: ReelProduct, attributes: ["product_name", "unit"] },
        { model: Factory, attributes: ["factory_name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res
      .status(200)
      .json({ message: "Reel usages retrieved successfully", reelUsages });
  } catch (error) {
    console.error("Error fetching reel usages:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get ReelUsage by ID
export const getReelUsageById = async (req, res) => {
  try {
    const { usageId } = req.params;

    const reelUsage = await ReelUsage.findByPk(usageId, {
      include: [
        { model: ReelProduct, attributes: ["product_name", "unit"] },
        { model: Factory, attributes: ["factory_name"] },
      ],
    });

    if (!reelUsage)
      return res.status(404).json({ message: "Reel usage entry not found." });

    return res.status(200).json({
      message: "Reel usage retrieved successfully",
      reelUsage
    });
  } catch (error) {
    console.error("Error fetching reel usage:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Update ReelUsage
export const updateReelUsage = async (req, res) => {
  try {
    const { usageId } = req.params;
    const { quantity, product_id, factory_id } = req.body;

    const reelUsage = await ReelUsage.findByPk(usageId);
    if (!reelUsage)
      return res.status(404).json({ message: "Reel usage entry not found." });

   
    // Uncomment this section if you implement ReelProductStock model
    // If quantity is being updated, we need to adjust the stock
    if (quantity !== undefined && quantity !== reelUsage.quantity) {
      const reelProductStock = await ReelProductStock.findOne({
        where: {
          product_id: product_id || reelUsage.product_id,
          factory_id: factory_id || reelUsage.factory_id
        }
      });

      if (!reelProductStock) {
        return res.status(404).json({ message: "Reel product stock not found." });
      }

      // Calculate the difference
      const oldQuantity = reelUsage.quantity;
      const newQuantity = quantity;
      const difference = newQuantity - oldQuantity;

      // Check if there's enough stock for increase
      if (difference > 0 && reelProductStock.current_stock < difference) {
        return res.status(400).json({ 
          message: `Insufficient stock for update. Available: ${reelProductStock.current_stock}` 
        });
      }

      // Start transaction
      const transaction = await ReelUsage.sequelize.transaction();

      try {
        // Update stock: subtract the difference
        await reelProductStock.update({
          current_stock: reelProductStock.current_stock - difference
        }, { transaction });

        // Update the reel usage entry
        await reelUsage.update({
          quantity: quantity || reelUsage.quantity,
          product_id: product_id || reelUsage.product_id,
          factory_id: factory_id || reelUsage.factory_id,
        }, { transaction });

        // Commit transaction
        await transaction.commit();

        return res
          .status(200)
          .json({ 
            message: "Reel usage updated successfully.", 
            reelUsage,
            stock_updated: {
              quantity_difference: difference,
              new_stock: reelProductStock.current_stock - difference
            }
          });

      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      // No quantity change, just update other fields
      await reelUsage.update({
        quantity: quantity || reelUsage.quantity,
        product_id: product_id || reelUsage.product_id,
        factory_id: factory_id || reelUsage.factory_id,
      });

      return res
        .status(200)
        .json({ message: "Reel usage updated successfully.", reelUsage });
    }
  

    await reelUsage.update({
      quantity: quantity ?? reelUsage.quantity,
      product_id: product_id ?? reelUsage.product_id,
      factory_id: factory_id ?? reelUsage.factory_id,
    });

    return res
      .status(200)
      .json({ message: "Reel usage updated successfully.", reelUsage });

  } catch (error) {
    console.error("Error updating reel usage:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Delete ReelUsage
export const deleteReelUsage = async (req, res) => {
  console.log('-------------------------------------------');
  console.log('Attempting to delete reel usage entry.');
  const { usageId } = req.params;
  console.log(`Received usageId: ${usageId}`);

  try {
    const reelUsage = await ReelUsage.findByPk(usageId);
    if (!reelUsage) {
      console.warn(`Reel usage entry with ID ${usageId} not found.`);
      return res.status(404).json({ message: "Reel usage entry not found." });
    }
    console.log(`Found reel usage entry: ${JSON.stringify(reelUsage.toJSON())}`);

    // Store the quantity used before starting the transaction.
    const quantityUsed = reelUsage.quantity;
    console.log(`Quantity to be restored: ${quantityUsed}`);

    // Start a transaction
    console.log('Starting database transaction...');
    const transaction = await ReelUsage.sequelize.transaction();
    console.log('Transaction started.');

    try {
      // Find the corresponding ReelProductStock entry
      console.log(`Attempting to find ReelProductStock for product_id: ${reelUsage.product_id}, factory_id: ${reelUsage.factory_id}`);
      const reelProductStock = await ReelProductStock.findOne({
        where: {
          product_id: reelUsage.product_id,
          factory_id: reelUsage.factory_id
        },
        transaction
      });

     if (reelProductStock) {
        console.log(`ReelProductStock found. Current stock before update: ${reelProductStock.current_stock}`);
        // Restore the stock when deleting usage
        await reelProductStock.update({
          // FIX: Ensure current_stock is treated as a number
          current_stock: parseFloat(reelProductStock.current_stock) + quantityUsed
        }, { transaction });
        console.log(`ReelProductStock updated. New stock: ${parseFloat(reelProductStock.current_stock) + quantityUsed}`); // Log the expected new value
      }

      // Delete the reel usage entry
      console.log(`Attempting to destroy reel usage entry with ID: ${reelUsage.id}`);
      await reelUsage.destroy({ transaction });
      console.log(`Reel usage entry with ID ${reelUsage.id} destroyed successfully within transaction.`);

      // Commit transaction if all operations are successful
      await transaction.commit();
      console.log('Transaction committed successfully.');

      return res.status(200).json({
        message: "Reel usage deleted successfully and stock restored.",
        stock_restored: {
          quantity_restored: quantityUsed,
          product_id: reelUsage.product_id,
          factory_id: reelUsage.factory_id
        },
        total_amount_used_for_this_entry: quantityUsed
      });

    } catch (transactionError) {
      // Rollback transaction if any error occurs within the try block
      console.error('Error occurred during transaction. Rolling back...', transactionError);
      await transaction.rollback();
      console.log('Transaction rolled back.');
      return res.status(500).json({ message: "Failed to delete reel usage and restore stock due to a transaction error." });
    }

  } catch (error) {
    // Catch errors that occur before or outside the transaction initiation
    console.error("An unexpected error occurred before or during transaction initiation:", error);
    return res.status(500).json({ message: "Internal server error." });
  } finally {
    console.log('-------------------------------------------');
  }
};