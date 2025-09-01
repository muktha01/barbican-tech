
// productController.js - UPDATED CONTROLLER
import Product from "../models/Product.js";
import Factory from "../models/Factory.js";
import ProductStock from "../models/ProductStock.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize";

export const createProductForMultipleFactories = async (req, res) => {
  const transaction = await sequelize.transaction();
  console.log(req.body);
  
  try {
    const { product_name, type, unit, factory_stocks } = req.body;
    console.log("Received data for multi-factory product creation:", req.body);

    // Validate input
    if (!product_name || !type || !unit || !Array.isArray(factory_stocks) || factory_stocks.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Product name, type, unit, and factory_stocks array are required."
      });
    }

    // ✅ Check if product name already exists
    const existingProduct = await Product.findOne({
      where: { product_name },
      transaction
    });

    if (existingProduct) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Product "${product_name}" already exists in the database. Please choose a different product name.`,
        existing_product: {
          id: existingProduct.id,
          name: existingProduct.product_name,
          type: existingProduct.type.toUpperCase(),
          unit: existingProduct.unit
        }
      });
    }

    // ✅ Create ONE product record
    const newProduct = await Product.create({
      product_name,
      type: type.toLowerCase(),
      unit,
    }, { transaction });

    console.log("✅ Created single product:", newProduct.id);

    const stockResults = [];
    const errors = [];

    // ✅ Create multiple stock records for different factories
    for (const factoryStock of factory_stocks) {
      const { factory_id, opening_stock } = factoryStock;

      if (!factory_id || opening_stock === undefined || opening_stock < 0) {
        errors.push(`Invalid data for factory_id: ${factory_id}`);
        continue;
      }

      try {
        // Verify factory exists
        const factory = await Factory.findByPk(factory_id, { transaction });
        if (!factory) {
          errors.push(`Factory with ID ${factory_id} not found`);
          continue;
        }

        // Create stock record
        const productStock = await ProductStock.create({
          product_id: newProduct.id,
          factory_id,
          opening_stock: Number(opening_stock),
          current_stock: Number(opening_stock),
        }, { transaction });

        stockResults.push({
          factory_id,
          factory_name: factory.factory_name,
          stock_id: productStock.id,
          opening_stock: Number(opening_stock),
          current_stock: Number(opening_stock),
          status: 'created'
        });

      } catch (error) {
        console.error(`Error processing factory ${factory_id}:`, error);
        errors.push(`Error processing factory ${factory_id}: ${error.message}`);
      }
    }

    // If there were errors and no successful stocks, rollback
    if (errors.length > 0 && stockResults.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Failed to create product stocks for any factory",
        errors
      });
    }

    // Commit transaction
    await transaction.commit();

    const response = {
      message: "Product created successfully with multiple factory stocks",
      product: {
        id: newProduct.id,
        product_name: newProduct.product_name,
        type: newProduct.type.toUpperCase(),
        unit: newProduct.unit,
        created_at: newProduct.createdAt
      },
      factory_stocks: stockResults,
      total_factories_processed: stockResults.length,
      successful_operations: stockResults.length,
    };

    if (errors.length > 0) {
      response.errors = errors;
      response.error_count = errors.length;
    }

    const statusCode = errors.length > 0 ? 207 : 201;
    return res.status(statusCode).json(response);

  } catch (error) {
    await transaction.rollback();
    console.error("Error in createProductForMultipleFactories:", error);
    return res.status(500).json({
      message: "Internal server error during multi-factory product creation.",
      error: error.message
    });
  }
};

// ============================================
// UPDATE PRODUCT DETAILS
// ============================================
export const updateProduct = async (req, res) => {
  const transaction = await sequelize.transaction();

  
  try {
    const { productId } = req.params;
    const { product_name, type, unit, factory_stocks } = req.body;
    console.log("Received data for product update:", req.body);
    console.log("Product ID:", productId);

    // Find the product
    const product = await Product.findByPk(productId, { transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // Check if new product name conflicts with existing products (excluding current)
    if (product_name && product_name !== product.product_name) {
      const existingProduct = await Product.findOne({
        where: { 
          product_name,
          id: { [Op.ne]: productId }
        },
        transaction
      });

      if (existingProduct) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Product name "${product_name}" already exists. Please choose a different name.`
        });
      }
    }

    // Update product basic info
    const updateData = {};
    if (product_name) updateData.product_name = product_name;
    if (type) updateData.type = type.toLowerCase();
    if (unit) updateData.unit = unit;

    if (Object.keys(updateData).length > 0) {
      await product.update(updateData, { transaction });
    }

    let stockResults = [];
    let errors = [];

    // Update factory stocks if provided
    if (factory_stocks && Array.isArray(factory_stocks)) {
      for (const factoryStock of factory_stocks) {
        const { stock_id, factory_id, opening_stock, current_stock, action = "update" } = factoryStock;

        try {
          if (action === "delete" && stock_id) {
            // Delete existing stock
            const deletedRows = await ProductStock.destroy({
              where: { id: stock_id, product_id: productId },
              transaction
            });
            
            if (deletedRows > 0) {
              stockResults.push({
                stock_id,
                factory_id,
                action: "deleted",
                status: "success"
              });
            } else {
              errors.push(`Stock record ${stock_id} not found for deletion`);
            }

          } else if (action === "create" && factory_id) {
            // Create new stock for existing product
            const factory = await Factory.findByPk(factory_id, { transaction });
            if (!factory) {
              errors.push(`Factory with ID ${factory_id} not found`);
              continue;
            }

            // Check if stock already exists for this factory
            const existingStock = await ProductStock.findOne({
              where: { product_id: productId, factory_id },
              transaction
            });

            if (existingStock) {
              errors.push(`Stock already exists for factory ${factory_id}`);
              continue;
            }

            const newStock = await ProductStock.create({
              product_id: productId,
              factory_id,
              opening_stock: Number(opening_stock),
              current_stock: Number(current_stock || opening_stock),
            }, { transaction });

            stockResults.push({
              stock_id: newStock.id,
              factory_id,
              factory_name: factory.factory_name,
              opening_stock: Number(opening_stock),
              current_stock: Number(current_stock || opening_stock),
              action: "created",
              status: "success"
            });

          } else if (stock_id) {
            // Update existing stock
            const stockToUpdate = await ProductStock.findOne({
              where: { id: stock_id, product_id: productId },
              transaction
            });

            if (!stockToUpdate) {
              errors.push(`Stock record ${stock_id} not found`);
              continue;
            }

            const stockUpdateData = {};
            if (opening_stock !== undefined) stockUpdateData.opening_stock = Number(opening_stock);
            if (current_stock !== undefined) stockUpdateData.current_stock = Number(current_stock);

            if (Object.keys(stockUpdateData).length > 0) {
              await stockToUpdate.update(stockUpdateData, { transaction });
            }

            const factory = await Factory.findByPk(stockToUpdate.factory_id, { transaction });
            stockResults.push({
              stock_id: stockToUpdate.id,
              factory_id: stockToUpdate.factory_id,
              factory_name: factory?.factory_name,
              opening_stock: parseFloat(stockToUpdate.opening_stock),
              current_stock: parseFloat(stockToUpdate.current_stock),
              action: "updated",
              status: "success"
            });
          }

        } catch (error) {
          console.error(`Error processing stock update:`, error);
          errors.push(`Error processing stock: ${error.message}`);
        }
      }
    }

    await transaction.commit();

    // Get updated product with all stocks
    const updatedProduct = await Product.findByPk(productId, {
      include: [
        {
          model: ProductStock,
          as: 'stocks',
          include: [
            {
              model: Factory,
              as: 'factory',
              attributes: ['id', 'factory_name', 'location']
            }
          ]
        }
      ]
    });

    const response = {
      message: "Product updated successfully",
      product: {
        id: updatedProduct.id,
        product_name: updatedProduct.product_name,
        type: updatedProduct.type.toUpperCase(),
        unit: updatedProduct.unit,
        updated_at: updatedProduct.updatedAt,
        factory_stocks: updatedProduct.stocks.map(stock => ({
          stock_id: stock.id,
          factory: {
            id: stock.factory.id,
            name: stock.factory.factory_name,
            location: stock.factory.location
          },
          opening_stock: parseFloat(stock.opening_stock),
          current_stock: parseFloat(stock.current_stock),
          updated_at: stock.updatedAt
        }))
      }
    };

    if (stockResults.length > 0) {
      response.stock_operations = stockResults;
    }

    if (errors.length > 0) {
      response.errors = errors;
      response.error_count = errors.length;
    }

    const statusCode = errors.length > 0 ? 207 : 200;
    return res.status(statusCode).json(response);

  } catch (error) {
    await transaction.rollback();
    console.error("Error updating product:", error);
    res.status(500).json({
      message: "Internal server error during product update",
      error: error.message
    });
  }
};

// ============================================
// DELETE PRODUCT (WITH ALL STOCKS)
// ============================================
export const deleteProduct = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { productId } = req.params;

    // Find product with stocks
    const product = await Product.findByPk(productId, {
      include: [
        {
          model: ProductStock,
          as: 'stocks'
        }
      ],
      transaction
    });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Product not found"
      });
    }

    const stockCount = product.stocks.length;

    // Delete all associated stocks first (cascade should handle this, but being explicit)
    await ProductStock.destroy({
      where: { product_id: productId },
      transaction
    });

    // Delete the product
    await product.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      message: "Product deleted successfully",
      deleted_product: {
        id: product.id,
        product_name: product.product_name,
        type: product.type.toUpperCase(),
        unit: product.unit,
        stocks_deleted: stockCount
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting product:", error);
    res.status(500).json({
      message: "Internal server error during product deletion",
      error: error.message
    });
  }
};

// ============================================
// DELETE SPECIFIC STOCK RECORD
// ============================================
export const deleteProductStock = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { stockId } = req.params;

    // Find the stock record
    const stock = await ProductStock.findByPk(stockId, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'product_name']
        },
        {
          model: Factory,
          as: 'factory',
          attributes: ['id', 'factory_name']
        }
      ],
      transaction
    });

    if (!stock) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Stock record not found"
      });
    }

    const stockInfo = {
      stock_id: stock.id,
      product_name: stock.product.product_name,
      factory_name: stock.factory.factory_name,
      opening_stock: parseFloat(stock.opening_stock),
      current_stock: parseFloat(stock.current_stock)
    };

    // Delete the stock record
    await stock.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      message: "Stock record deleted successfully",
      deleted_stock: stockInfo
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting stock record:", error);
    res.status(500).json({
      message: "Internal server error during stock deletion",
      error: error.message
    });
  }
};

// ============================================
// GET ALL PRODUCTS WITH FACTORY STOCKS
// ============================================
export const getAllProductsWithStocks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, factory_id } = req.query;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = {};
    if (search) {
      whereConditions.product_name = {
        [Op.iLike]: `%${search}%`
      };
    }
    if (type) {
      whereConditions.type = type.toLowerCase();
    }

    // Build include conditions for factory filter
    const stockInclude = {
      model: ProductStock,
      as: 'stocks',
      include: [
        {
          model: Factory,
          as: 'factory',
          attributes: ['id', 'factory_name', 'location'],
          required: false // ← This allows LEFT JOIN instead of INNER JOIN
        }
      ]
    };

    if (factory_id) {
      stockInclude.where = { factory_id };
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereConditions,
      include: [stockInclude],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    const formattedProducts = products.map(product => ({
      id: product.id,
      product_name: product.product_name,
      type: product.type.toUpperCase(),
      unit: product.unit,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
      total_factories: product.stocks ? product.stocks.length : 0,
      factory_stocks: product.stocks ? product.stocks.map(stock => {
        // ✅ Add null checks for factory
        const factoryData = stock.factory ? {
          id: stock.factory.id,
          name: stock.factory.factory_name,
          location: stock.factory.location
        } : {
          id: null,
          name: 'Factory Not Found',
          location: 'Unknown'
        };

        return {
          stock_id: stock.id,
          factory: factoryData,
          opening_stock: parseFloat(stock.opening_stock),
          current_stock: parseFloat(stock.current_stock),
          created_at: stock.createdAt,
          updated_at: stock.updatedAt
        };
      }).filter(stock => stock.factory.id !== null) : [] // ✅ Filter out stocks with missing factories
    }));

    res.status(200).json({
      message: "Products retrieved successfully",
      data: {
        products: formattedProducts,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_records: count,
          per_page: parseInt(limit),
          has_next: page < Math.ceil(count / limit),
          has_prev: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error retrieving all products:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};
// ============================================
// GET SINGLE PRODUCT WITH ALL FACTORY STOCKS
// ============================================
export const getProductWithStocks = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId, {
      include: [
        {
          model: ProductStock,
          as: 'stocks',
          include: [
            {
              model: Factory,
              as: 'factory',
              attributes: ['id', 'factory_name', 'location']
            }
          ]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json({
      message: "Product retrieved successfully",
      product: {
        id: product.id,
        product_name: product.product_name,
        type: product.type.toUpperCase(),
        unit: product.unit,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
        factory_stocks: product.stocks.map(stock => ({
          stock_id: stock.id,
          factory: {
            id: stock.factory.id,
            name: stock.factory.factory_name,
            location: stock.factory.location
          },
          opening_stock: parseFloat(stock.opening_stock),
          current_stock: parseFloat(stock.current_stock),
          created_at: stock.createdAt,
          updated_at: stock.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error("Error retrieving product with stocks:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};