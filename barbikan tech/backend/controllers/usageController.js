import { Usage, Product, Factory } from "../models/index.js";
import ProductStock from "../models/ProductStock.js";

// Create usage
export const createUsage = async (req, res) => {
  try {
    const { quantity, product_id, factory_id , type} = req.body;
    console.log("req", req.body);

    if (quantity === undefined || !product_id || !factory_id || !type) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate quantity is positive
    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0." });
    }

    const product = await Product.findByPk(product_id);
    if (!product)
      return res.status(404).json({ message: "Product not found." });

    const factory = await Factory.findByPk(factory_id);
    if (!factory)
      return res.status(404).json({ message: "Factory not found." });

    // Find the product stock for this factory and product
    const productStock = await ProductStock.findOne({
      where: {
        product_id: product_id,
        factory_id: factory_id
      }
    });

    if (!productStock) {
      return res.status(404).json({ message: "Product stock not found for this factory." });
    }

    // Check if there's enough stock
    if (productStock.current_stock < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Available: ${productStock.current_stock} ${product.unit}, Requested: ${quantity} ${product.unit}` 
      });
    }

    // Create usage entry
    const usage = await Usage.create({ 
      factory_id,
      product_id,
      type,
      quantity,
    });

    // Update the current stock by reducing the usage quantity
    await productStock.update({
      current_stock: productStock.current_stock - quantity
    });

    return res
      .status(201)
      .json({ message: "Usage entry created successfully and stock updated.", usage });
  } catch (error) {
    console.error("Error creating usage:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get all usage records
export const getAllUsages = async (req, res) => {
  try {
    const usages = await Usage.findAll({
      include: [
        { model: Product, attributes: ["product_name", "unit"] },
        { model: Factory, attributes: ["factory_name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res
      .status(200)
      .json({ message: "Usages retrieved successfully", usages });
  } catch (error) {
    console.error("Error fetching usages:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get usage by ID
export const getUsageById = async (req, res) => {
  try {
    const { usageId } = req.params;

    const usage = await Usage.findByPk(usageId, {
      include: [
        { model: Product, attributes: ["product_name", "unit"] },
        { model: Factory, attributes: ["factory_name"] },
      ],
    });

    if (!usage)
      return res.status(404).json({ message: "Usage entry not found." });

    return res.status(200).json(usage);
  } catch (error) {
    console.error("Error fetching usage:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Update usage
export const updateUsage = async (req, res) => {
  try {
    const { usageId } = req.params;
    const { quantity, product_id, factory_id } = req.body;

    const usage = await Usage.findByPk(usageId);
    if (!usage)
      return res.status(404).json({ message: "Usage entry not found." });

    // If quantity is being updated, we need to adjust the stock
    if (quantity !== undefined && quantity !== usage.quantity) {
      const productStock = await ProductStock.findOne({
        where: {
          product_id: product_id || usage.product_id,
          factory_id: factory_id || usage.factory_id
        }
      });

      if (!productStock) {
        return res.status(404).json({ message: "Product stock not found." });
      }

      // Calculate the difference
      const oldQuantity = usage.quantity;
      const newQuantity = quantity;
      const difference = newQuantity - oldQuantity;

      // Check if there's enough stock for increase
      if (difference > 0 && productStock.current_stock < difference) {
        return res.status(400).json({ 
          message: `Insufficient stock for update. Available: ${productStock.current_stock}` 
        });
      }

      // Update stock: subtract the difference
      await productStock.update({
        current_stock: productStock.current_stock - difference
      });
    }

    await usage.update({
      quantity: quantity || usage.quantity,
      product_id: product_id || usage.product_id,
      factory_id: factory_id || usage.factory_id,
    });

    return res
      .status(200)
      .json({ message: "Usage updated successfully.", usage });
  } catch (error) {
    console.error("Error updating usage:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Delete usage
export const deleteUsage = async (req, res) => {
  try {
    const { usageId } = req.params;
    console.log("Deleting usage with ID:", usageId);

    const usage = await Usage.findByPk(usageId);
    if (!usage)
      return res.status(404).json({ message: "Usage entry not found." });

    // Restore the stock when deleting usage
    const productStock = await ProductStock.findOne({
      where: {
        product_id: usage.product_id,
        factory_id: usage.factory_id
      }
    });

   if (productStock) {
  console.log("Product stock found:", productStock.current_stock);
  console.log("Type of productStock.current_stock:", typeof productStock.current_stock);
  console.log("Usage quantity to restore:", usage.quantity);
  console.log("Type of usage.quantity:", typeof usage.quantity);

  // Explicitly convert to a number if they are strings
  const currentStock = parseFloat(productStock.current_stock); // This is crucial!
  const quantityToRestore = parseFloat(usage.quantity); // Good practice, though usage.quantity is already a number

  console.log("Current stock after conversion:", currentStock);
  console.log("Quantity to restore after conversion:", quantityToRestore);

  if (isNaN(currentStock) || isNaN(quantityToRestore)) {
    console.error("One of the values is not a valid number after conversion.");
    return res.status(500).json({ message: "Invalid stock or quantity value." });
  }

  // This operation will now be numerically correct: 400.03 + 50 = 450.03
  await productStock.update({
    current_stock: currentStock + quantityToRestore
  })
    } else {
        return res.status(404).json({ message: "Product stock entry not found." });
    }


    await usage.destroy();

    return res.status(200).json({ message: "Usage deleted successfully and stock restored." });
  } catch (error) {
    console.error("Error deleting usage:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};