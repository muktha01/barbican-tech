import BoardStock_Stock from '../models/BoardStock_Stock.js';
import Company from '../models/BoardStockCompany.js';

// POST: Create new stock entry
export const createStock = async (req, res) => {
  console.log("req", req.body);
  try {
    const { companyId, stockName, unit, quantity } = req.body;

    // Validate required fields
    if (!companyId || !unit || !quantity || !stockName) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Validate company existence
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Invalid company.' });
    }

    // Create stock
    const newStock = await BoardStock_Stock.create({
      company_id: companyId,
      stock_name: stockName,
      unit,
      quantity
    });

    const stockWithCompany = await BoardStock_Stock.findByPk(newStock.id, {
      include: [{ model: Company, attributes: ['company_name'] }]
    });

    return res.status(201).json({
      message: 'Stock created successfully.',
      stock: {
        id: stockWithCompany.id,
        companyName: stockWithCompany.Company.company_name,
        company_Id: stockWithCompany.company_id,
        stock_Name: stockWithCompany.stock_name,
        unit: stockWithCompany.unit,
        quantity: stockWithCompany.quantity,
        created_at: stockWithCompany.created_at
      }
    });
  } catch (error) {
    console.error('Error creating stock:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET: Get all stock entries
export const getAllStocks = async (req, res) => {
  try {
    const stocks = await BoardStock_Stock.findAll({
      include: [{ model: Company, attributes: ['company_name'] }]
    });

    res.status(200).json(stocks);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET: Get stocks by company ID
export const getDistributedCompanyByID = async (req, res) => {
  const { id: company_id } = req.params;

  try {
    if (!company_id) {
      return res.status(400).json({ message: 'Company ID is required.' });
    }

    const company = await Company.findOne({ where: { id: company_id } });
    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const companyStocks = await BoardStock_Stock.findAll({
      where: { company_id },
      include: [{ model: Company, attributes: ['company_name'] }]
    });

    if (!companyStocks || companyStocks.length === 0) {
      return res.status(404).json({ message: 'No stocks found for this company.' });
    }

    return res.status(200).json({
      message: "Stock data fetched successfully",
      company_id,
      data: companyStocks
    });

  } catch (error) {
    console.error("Error fetching company stocks:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// PUT: Update stock quantity
export const updateStockById = async (req, res) => {
  try {
    const { id: stockId } = req.params;
    const { quantity, operation = 'direct', usedQuantity } = req.body;

    if (!stockId) {
      return res.status(400).json({ message: 'Stock ID is required.' });
    }

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ message: 'Valid quantity is required and must be non-negative.' });
    }

    const stock = await BoardStock_Stock.findByPk(stockId, {
      include: [{ model: Company, attributes: ['company_name'] }]
    });

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found.' });
    }

    const currentQuantity = parseFloat(stock.quantity);
    let newQuantity;

    switch (operation) {
      case 'subtract':
        if (usedQuantity === undefined) {
          return res.status(400).json({ message: 'Used quantity is required for subtract operation.' });
        }
        const quantityToSubtract = parseFloat(usedQuantity);
        if (quantityToSubtract > currentQuantity) {
          return res.status(400).json({
            message: `Insufficient stock. Available: ${currentQuantity} ${stock.unit}, Requested: ${quantityToSubtract} ${stock.unit}`
          });
        }
        newQuantity = currentQuantity - quantityToSubtract;
        break;
      case 'add':
        newQuantity = currentQuantity + parseFloat(quantity);
        break;
      case 'direct':
      default:
        newQuantity = parseFloat(quantity);
        break;
    }

    await stock.update({ quantity: newQuantity, updated_at: new Date() });

    const updatedStock = await BoardStock_Stock.findByPk(stockId, {
      include: [{ model: Company, attributes: ['company_name'] }]
    });

    return res.status(200).json({
      message: 'Stock updated successfully.',
      stock: {
        id: updatedStock.id,
        companyName: updatedStock.Company.company_name,
        company_id: updatedStock.company_id,
        stock_name: updatedStock.stock_name,
        unit: updatedStock.unit,
        previousQuantity: currentQuantity,
        newQuantity: updatedStock.quantity,
        operation: operation,
        updated_at: updatedStock.updated_at
      }
    });

  } catch (error) {
    console.error('Error updating stock:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET: Get stock by ID
export const getStockById = async (req, res) => {
  try {
    const { id: stockId } = req.params;

    const stock = await BoardStock_Stock.findByPk(stockId, {
      include: [{ model: Company, attributes: ['company_name'] }]
    });

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found.' });
    }

    return res.status(200).json({
      message: 'Stock retrieved successfully.',
      stock: {
        id: stock.id,
        companyName: stock.Company.company_name,
        company_id: stock.company_id,
        stock_name: stock.stock_name,
        unit: stock.unit,
        quantity: stock.quantity,
        created_at: stock.created_at,
        updated_at: stock.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching stock:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// DELETE: Delete stock by ID
export const deleteStockDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const stock = await BoardStock_Stock.findByPk(id);

    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    await stock.destroy();
    res.status(200).json({ message: "Stock deleted successfully" });
  } catch (error) {
    console.error("Error deleting stock:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
