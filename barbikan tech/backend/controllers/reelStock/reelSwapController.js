// controllers/reelSwapController.js
import {  Op } from "sequelize";
import { ReelSwap, ReelProduct, Factory } from "../../models/index.js";
import ReelProductStock from "../../models/ReelProductStock.js";

// Create a ReelSwap with stock updates
export const createReelSwap = async (req, res) => {
  try {
    const { quantity, product_id, from_factory_id, to_factory_id } = req.body;

    console.log("Received data:", req.body);

    // Validation
    if (!quantity || !product_id || !from_factory_id || !to_factory_id) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (from_factory_id === to_factory_id) {
      return res.status(400).json({ message: "From factory and to factory cannot be the same." });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0." });
    }

    // Start transaction
    const transaction = await ReelProductStock.sequelize.transaction();

    try {
      // Check if from factory has enough stock
      const fromStock = await ReelProductStock.findOne({
        where: {
          product_id,
          factory_id: from_factory_id
        },
        transaction
      });

      if (!fromStock) {
        await transaction.rollback();
        return res.status(404).json({ message: "Product not found in source factory." });
      }

      if (parseFloat(fromStock.current_stock) < parseFloat(quantity)) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: `Insufficient stock. Available: ${fromStock.current_stock}, Requested: ${quantity}` 
        });
      }

      // Find or create stock entry for destination factory
      let toStock = await ReelProductStock.findOne({
        where: {
          product_id,
          factory_id: to_factory_id
        },
        transaction
      });

      if (!toStock) {
        // Create new stock entry for destination factory
        toStock = await ReelProductStock.create({
          product_id,
          factory_id: to_factory_id,
          opening_stock: 0,
          current_stock: parseFloat(quantity)
        }, { transaction });
      } else {
        // Update existing stock
        await toStock.update({
          current_stock: parseFloat(toStock.current_stock) + parseFloat(quantity)
        }, { transaction });
      }

      // Update source factory stock (subtract quantity)
      await fromStock.update({
        current_stock: parseFloat(fromStock.current_stock) - parseFloat(quantity)
      }, { transaction });

      // Create ReelSwap record
      const reelSwap = await ReelSwap.create({
        quantity: parseFloat(quantity),
        product_id,
        from_factory_id,
        to_factory_id,
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      // Fetch the created reelSwap with related data
      const createdReelSwap = await ReelSwap.findByPk(reelSwap.id, {
        include: [
          { model: ReelProduct, as: "Product", attributes: ['id', 'product_name'] },
          { model: Factory, as: "fromFactory", attributes: ['id', 'factory_name'] },
          { model: Factory, as: "toFactory", attributes: ['id', 'factory_name'] },
        ]
      });

      return res.status(201).json({
        message: "ReelSwap created successfully and stock updated",
        reelSwap: createdReelSwap,
      });
    } catch (error) {
      await Transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      message: error.message || "Internal Server Error" 
    });
  }
};

// Get all ReelSwaps
export const getAllReelSwaps = async (req, res) => {
  try {
    const reelSwaps = await ReelSwap.findAll({
      include: [
        { model: ReelProduct, as: "Product", attributes: ['id', 'product_name'] },
        { model: Factory, as: "fromFactory", attributes: ['id', 'factory_name'] },
        { model: Factory, as: "toFactory", attributes: ['id', 'factory_name'] },
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ 
      message: "ReelSwaps retrieved successfully", 
      swaps: reelSwaps // Changed from reelSwaps to swaps to match frontend
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      message: error.message || "Internal Server Error" 
    });
  }
};

// Get reel products with stock information
export const getReelProductsWithStock = async (req, res) => {
  try {
    const reelProducts = await ReelProduct.findAll({
      include: [
        {
          model: ReelProductStock,
          as: 'stocks',
          attributes: ['id', 'product_id', 'factory_id', 'current_stock', 'opening_stock'],
          include: [
            {
              model: Factory,
              as: 'factory',
              attributes: ['id', 'factory_name', 'location']
            }
          ]
        }
      ],
      attributes: ['id', 'product_name', 'unit']
    });

    // Transform the data to make it easier to work with on frontend
    const transformedProducts = reelProducts.map(product => ({
      id: product.id,
      product_name: product.product_name,
      unit: product.unit,
      stocks: product.stocks.map(stock => ({
        stock_id: stock.id,
        product_id: stock.product_id,
        factory_id: stock.factory_id,
        current_stock: stock.current_stock,
        opening_stock: stock.opening_stock,
        factory: stock.factory
      }))
    }));

    return res.status(200).json({
      message: "Reel products retrieved successfully",
      products: transformedProducts
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Internal Server Error"
    });
  }
};

// Get products by type - NEW FUNCTION ADDED
export const getProductsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!type) {
      return res.status(400).json({ message: "Type parameter is required" });
    }

    // Filter products based on type - you may need to adjust this based on your ReelProduct model structure
    const reelProducts = await ReelProduct.findAll({
      where: {
        // Assuming you have a type field or category field in ReelProduct
        // Adjust this condition based on your actual model structure
        [Op.or]: [
          { product_name: { [Op.iLike]: `%${type}%` } },
          // Add other conditions if you have a specific type field
        ]
      },
      include: [
        {
          model: ReelProductStock,
          as: 'stocks',
          attributes: ['id', 'product_id', 'factory_id', 'current_stock', 'opening_stock'],
          where: {
            current_stock: { [Op.gt]: 0 } // Only include stocks with quantity > 0
          },
          required: false, // LEFT JOIN to include products even without stock
          include: [
            {
              model: Factory,
              as: 'factory',
              attributes: ['id', 'factory_name', 'location']
            }
          ]
        }
      ],
      attributes: ['id', 'product_name', 'unit']
    });

    // Transform the data to make it easier to work with on frontend
    const transformedProducts = reelProducts.map(product => ({
      id: product.id,
      product_name: product.product_name,
      unit: product.unit,
      stocks: product.stocks.map(stock => ({
        stock_id: stock.id,
        product_id: stock.product_id,
        factory_id: stock.factory_id,
        current_stock: stock.current_stock,
        opening_stock: stock.opening_stock,
        factory: stock.factory
      }))
    }));

    return res.status(200).json({
      message: "Products retrieved successfully",
      products: transformedProducts
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Internal Server Error"
    });
  }
};

// Get factories that have stock for a specific reel product (excluding the selected factory)
export const getFactoriesByReelProduct = async (req, res) => {
  try {
    const { product_id, exclude_factory_id } = req.query;
    console.log("Query parameters received:", req.query);

    if (!product_id) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const whereClause = {
      product_id,
      current_stock: { [Op.gt]: 0 } // Only show factories with stock > 0
    };

    if (exclude_factory_id) {
      whereClause.factory_id = { [Op.ne]: exclude_factory_id };
    }

    const reelProductStocks = await ReelProductStock.findAll({
      where: whereClause,
      include: [
        { 
          model: Factory, 
          as: 'factory',
          attributes: ['id', 'factory_name', 'location'] 
        }
      ],
      attributes: ['factory_id', 'current_stock']
    });

    const factories = reelProductStocks.map(ps => ({
      ...ps.factory.toJSON(),
      current_stock: ps.current_stock
    }));

    return res.status(200).json({
      message: "Factories retrieved successfully",
      factories
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      message: error.message || "Internal Server Error" 
    });
  }
};

// Get ReelSwap by ID
export const getReelSwapById = async (req, res) => {
  try {
    const { reelSwapId } = req.params;

    const reelSwap = await ReelSwap.findByPk(reelSwapId, {
      include: [
        { model: ReelProduct, as: "Product", attributes: ['id', 'product_name'] },
        { model: Factory, as: "fromFactory", attributes: ['id', 'factory_name'] },
        { model: Factory, as: "toFactory", attributes: ['id', 'factory_name'] },
      ],
    });

    if (!reelSwap) {
      return res.status(404).json({ message: "ReelSwap not found" });
    }

    return res.status(200).json({ 
      message: "ReelSwap retrieved successfully", 
      reelSwap 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      message: error.message || "Internal Server Error" 
    });
  }
};

// Update a ReelSwap (with stock reversal and new stock update)
export const updateReelSwap = async (req, res) => {
  try {
    const { reelSwapId } = req.params;
    const { quantity, product_id, from_factory_id, to_factory_id } = req.body;

    if (!quantity || !product_id || !from_factory_id || !to_factory_id) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (from_factory_id === to_factory_id) {
      return res.status(400).json({ message: "From and to factories must be different." });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0." });
    }

    const transaction = await ReelProductStock.sequelize.transaction();

    try {
      const reelSwap = await ReelSwap.findByPk(reelSwapId, { transaction });

      if (!reelSwap) {
        await transaction.rollback();
        return res.status(404).json({ message: "ReelSwap not found." });
      }

      // Reverse previous swap stock updates
      const previousQuantity = reelSwap.quantity;

      // Update source factory stock - add back the old quantity
      const fromStock = await ReelProductStock.findOne({
        where: {
          product_id,
          factory_id: reelSwap.from_factory_id
        },
        transaction
      });

      if (!fromStock) {
        await transaction.rollback();
        return res.status(404).json({ message: "Source factory stock not found." });
      }

      await fromStock.update({
        current_stock: parseFloat(fromStock.current_stock) + parseFloat(previousQuantity)
      }, { transaction });

      // Update destination factory stock - subtract the old quantity
      const toStock = await ReelProductStock.findOne({
        where: {
          product_id,
          factory_id: reelSwap.to_factory_id
        },
        transaction
      });

      if (!toStock) {
        await transaction.rollback();
        return res.status(404).json({ message: "Destination factory stock not found." });
      }

      await toStock.update({
        current_stock: parseFloat(toStock.current_stock) - parseFloat(previousQuantity)
      }, { transaction });

      // Validate new quantity availability in new source factory
      let newFromStock = await ReelProductStock.findOne({
        where: {
          product_id,
          factory_id: from_factory_id
        },
        transaction
      });

      if (!newFromStock || parseFloat(newFromStock.current_stock) < parseFloat(quantity)) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Insufficient stock in new source factory. Available: ${newFromStock?.current_stock || 0}, Requested: ${quantity}`
        });
      }

      // Update new source factory stock (subtract quantity)
      await newFromStock.update({
        current_stock: parseFloat(newFromStock.current_stock) - parseFloat(quantity)
      }, { transaction });

      // Update new destination factory stock (add quantity)
      let newToStock = await ReelProductStock.findOne({
        where: {
          product_id,
          factory_id: to_factory_id
        },
        transaction
      });

      if (!newToStock) {
        // Create new stock entry
        newToStock = await ReelProductStock.create({
          product_id,
          factory_id: to_factory_id,
          opening_stock: 0,
          current_stock: parseFloat(quantity)
        }, { transaction });
      } else {
        await newToStock.update({
          current_stock: parseFloat(newToStock.current_stock) + parseFloat(quantity)
        }, { transaction });
      }

      // Update the reelSwap record
      await reelSwap.update({
        quantity: parseFloat(quantity),
        product_id,
        from_factory_id,
        to_factory_id
      }, { transaction });

      await transaction.commit();

      // Return updated swap with relationships
      const updatedSwap = await ReelSwap.findByPk(reelSwap.id, {
        include: [
          { model: ReelProduct, as: "Product", attributes: ['id', 'product_name'] },
          { model: Factory, as: "fromFactory", attributes: ['id', 'factory_name'] },
          { model: Factory, as: "toFactory", attributes: ['id', 'factory_name'] },
        ]
      });

      return res.status(200).json({
        message: "ReelSwap updated successfully and stock adjusted",
        reelSwap: updatedSwap
      });

    } catch (err) {
      await transaction.rollback();
      console.error(err);
      return res.status(500).json({ message: err.message || "Failed to update ReelSwap" });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};


// Delete a ReelSwap (with stock reversal)
export const deleteReelSwap = async (req, res) => {
  try {
    const { reelSwapId } = req.params;

    const reelSwap = await ReelSwap.findByPk(reelSwapId);

    if (!reelSwap) {
      return res.status(404).json({ message: "ReelSwap not found" });
    }

    // Start transaction
    const transaction = await ReelProductStock.sequelize.transaction();

    try {
      // Reverse the stock changes
      const fromStock = await ReelProductStock.findOne({
        where: {
          product_id: reelSwap.product_id,
          factory_id: reelSwap.from_factory_id
        },
        transaction
      });

      const toStock = await ReelProductStock.findOne({
        where: {
          product_id: reelSwap.product_id,
          factory_id: reelSwap.to_factory_id
        },
        transaction
      });

      // Add back to from factory
      if (fromStock) {
        await fromStock.update({
          current_stock: parseFloat(fromStock.current_stock) + parseFloat(reelSwap.quantity)
        }, { transaction });
      }

      // Subtract from to factory
      if (toStock) {
        await toStock.update({
          current_stock: parseFloat(toStock.current_stock) - parseFloat(reelSwap.quantity)
        }, { transaction });
      }

      // Delete the reelSwap
      await reelSwap.destroy({ transaction });

      // Commit transaction
      await transaction.commit();

      return res.status(200).json({ 
        message: "ReelSwap deleted successfully and stock restored" 
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      message: error.message || "Internal Server Error" 
    });
  }
};