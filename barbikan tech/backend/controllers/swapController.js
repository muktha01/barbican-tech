// controllers/swapController.js
import { Op } from "sequelize";
import { Swap, Product, Factory } from "../models/index.js";
import ProductStock from "../models/ProductStock.js";

// Create a Swap with stock updates
export const createSwap = async (req, res) => {
  try {
    const { type, quantity, product_id, from_factory_id, to_factory_id } = req.body;

    console.log("Received data:", req.body);

    // Validation
    if (!type || !quantity || !product_id || !from_factory_id || !to_factory_id) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (from_factory_id === to_factory_id) {
      return res.status(400).json({ message: "From factory and to factory cannot be the same." });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0." });
    }

    // Start transaction
    const transaction = await ProductStock.sequelize.transaction();

    try {
      // Check if from factory has enough stock
      const fromStock = await ProductStock.findOne({
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
      let toStock = await ProductStock.findOne({
        where: {
          product_id,
          factory_id: to_factory_id
        },
        transaction
      });

      if (!toStock) {
        // Create new stock entry for destination factory
        toStock = await ProductStock.create({
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

      // Create Swap record
      const swap = await Swap.create({
        type: type.toUpperCase(),
        quantity: parseFloat(quantity),
        product_id,
        from_factory_id,
        to_factory_id,
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      // Fetch the created swap with related data
      const createdSwap = await Swap.findByPk(swap.id, {
        include: [
          { model: Product, attributes: ['id', 'product_name'] },
          { model: Factory, as: "fromFactory", attributes: ['id', 'factory_name'] },
          { model: Factory, as: "toFactory", attributes: ['id', 'factory_name'] },
        ]
      });

      return res.status(201).json({
        message: "Swap created successfully and stock updated",
        swap: createdSwap,
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

// Get all Swaps
export const getAllSwaps = async (req, res) => {
  try {
    const swaps = await Swap.findAll({
      include: [
        { model: Product, attributes: ['id', 'product_name'] },
        { model: Factory, as: "fromFactory", attributes: ['id', 'factory_name'] },
        { model: Factory, as: "toFactory", attributes: ['id', 'factory_name'] },
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ 
      message: "Swaps retrieved successfully", 
      swaps 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      message: error.message || "Internal Server Error" 
    });
  }
};

// Get products by type with stock information
export const getProductsByType = async (req, res) => {
  try {
    const { type } = req.params;
    console.log("Type received:", type);

    if (!type) {
      return res.status(400).json({ message: "Type is required" });
    }

    const products = await Product.findAll({
      where: {
        type: type.toUpperCase()
      },
      include: [
        {
          model: ProductStock,
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
      attributes: ['id', 'product_name', 'type', 'unit']
    });

    // Transform the data to make it easier to work with on frontend
    const transformedProducts = products.map(product => ({
      id: product.id,
      product_name: product.product_name,
      type: product.type,
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

// Get factories that have stock for a specific product (excluding the selected factory)
export const getFactoriesByProduct = async (req, res) => {
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

    const productStocks = await ProductStock.findAll({
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

    const factories = productStocks.map(ps => ({
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

// Get Swap by ID
export const getSwapById = async (req, res) => {
  try {
    const { swapId } = req.params;

    const swap = await Swap.findByPk(swapId, {
      include: [
        { model: Product, attributes: ['id', 'product_name'] },
        { model: Factory, as: "fromFactory", attributes: ['id', 'factory_name'] },
        { model: Factory, as: "toFactory", attributes: ['id', 'factory_name'] },
      ],
    });

    if (!swap) {
      return res.status(404).json({ message: "Swap not found" });
    }

    return res.status(200).json({ 
      message: "Swap retrieved successfully", 
      swap 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      message: error.message || "Internal Server Error" 
    });
  }
};

// Update a Swap (with stock reversal and new stock update)
export const updateSwap = async (req, res) => {
  try {
    const { swapId } = req.params;
    const { type, quantity, product_id, from_factory_id, to_factory_id } = req.body;

    const swap = await Swap.findByPk(swapId);

    if (!swap) {
      return res.status(404).json({ message: "Swap not found" });
    }

    // Start transaction
    const transaction = await ProductStock.sequelize.transaction();

    try {
      // Always reverse the old stock changes first
      const oldFromStock = await ProductStock.findOne({
        where: {
          product_id: swap.product_id,
          factory_id: swap.from_factory_id
        },
        transaction
      });

      const oldToStock = await ProductStock.findOne({
        where: {
          product_id: swap.product_id,
          factory_id: swap.to_factory_id
        },
        transaction
      });

      // Reverse old changes (add back to from_factory, subtract from to_factory)
      if (oldFromStock) {
        await oldFromStock.update({
          current_stock: parseFloat(oldFromStock.current_stock) + parseFloat(swap.quantity)
        }, { transaction });
      }

      if (oldToStock) {
        await oldToStock.update({
          current_stock: parseFloat(oldToStock.current_stock) - parseFloat(swap.quantity)
        }, { transaction });
      }

      // Apply new stock changes
      const newQuantity = quantity || swap.quantity;
      const newProductId = product_id || swap.product_id;
      const newFromFactoryId = from_factory_id || swap.from_factory_id;
      const newToFactoryId = to_factory_id || swap.to_factory_id;
      const newType = type || swap.type;

      // Check if new from factory has enough stock
      const newFromStock = await ProductStock.findOne({
        where: {
          product_id: newProductId,
          factory_id: newFromFactoryId
        },
        transaction
      });

      if (!newFromStock || parseFloat(newFromStock.current_stock) < parseFloat(newQuantity)) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: "Insufficient stock in source factory for the update" 
        });
      }

      // Find or create destination stock
      let newToStock = await ProductStock.findOne({
        where: {
          product_id: newProductId,
          factory_id: newToFactoryId
        },
        transaction
      });

      if (!newToStock) {
        newToStock = await ProductStock.create({
          product_id: newProductId,
          factory_id: newToFactoryId,
          opening_stock: 0,
          current_stock: parseFloat(newQuantity)
        }, { transaction });
      } else {
        await newToStock.update({
          current_stock: parseFloat(newToStock.current_stock) + parseFloat(newQuantity)
        }, { transaction });
      }

      // Update from factory stock
      await newFromStock.update({
        current_stock: parseFloat(newFromStock.current_stock) - parseFloat(newQuantity)
      }, { transaction });

      // Update the swap record
      await swap.update({
        type: newType.toUpperCase(),
        quantity: parseFloat(newQuantity),
        product_id: newProductId,
        from_factory_id: newFromFactoryId,
        to_factory_id: newToFactoryId,
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      // Fetch updated swap with related data
      const updatedSwap = await Swap.findByPk(swapId, {
        include: [
          { model: Product, attributes: ['id', 'product_name'] },
          { model: Factory, as: "fromFactory", attributes: ['id', 'factory_name'] },
          { model: Factory, as: "toFactory", attributes: ['id', 'factory_name'] },
        ]
      });

      return res.status(200).json({
        message: "Swap updated successfully",
        swap: updatedSwap,
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

// Delete a Swap (with stock reversal)
export const deleteSwap = async (req, res) => {
  try {
    const { swapId } = req.params;

    const swap = await Swap.findByPk(swapId);

    if (!swap) {
      return res.status(404).json({ message: "Swap not found" });
    }

    // Start transaction
    const transaction = await ProductStock.sequelize.transaction();

    try {
      // Reverse the stock changes
      const fromStock = await ProductStock.findOne({
        where: {
          product_id: swap.product_id,
          factory_id: swap.from_factory_id
        },
        transaction
      });

      const toStock = await ProductStock.findOne({
        where: {
          product_id: swap.product_id,
          factory_id: swap.to_factory_id
        },
        transaction
      });

      // Add back to from factory
      if (fromStock) {
        await fromStock.update({
          current_stock: parseFloat(fromStock.current_stock) + parseFloat(swap.quantity)
        }, { transaction });
      }

      // Subtract from to factory
      if (toStock) {
        await toStock.update({
          current_stock: parseFloat(toStock.current_stock) - parseFloat(swap.quantity)
        }, { transaction });
      }

      // Delete the swap
      await swap.destroy({ transaction });

      // Commit transaction
      await transaction.commit();

      return res.status(200).json({ 
        message: "Swap deleted successfully and stock restored" 
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