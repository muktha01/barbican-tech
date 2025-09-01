import JobCard from "../models/BoardStock_JobCard.js";
import Company from "../models/BoardStockCompany.js";
import DistributorCompany from "../models/BoardStockDistributorCompany.js";
import BoardStock_Stock from '../models/BoardStock_Stock.js';

export const createJobCard = async (req, res) => {
  console.log(req.body)
  try {
    const {
      press,
      matter,
      stock_id, // Changed from board to stock_id
      company,
      printingSize,
      quantity,
      unit,
      plate,
      color,
      extraColor,
      contactDetails,
      printingDetails
    } = req.body;

    // Validate required fields
    if (!press || !matter || !stock_id || !company || !printingSize  || !quantity || !unit || !plate || !color) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    // Validate quantity is a positive number
    const jobQuantity = parseFloat(quantity);
    if (isNaN(jobQuantity) || jobQuantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be a valid positive number.' });
    }

    // Validate existence of related entities
    const companyId = await Company.findByPk(press);
    const matterId = await DistributorCompany.findByPk(matter);
    const stock = await BoardStock_Stock.findByPk(stock_id);

    if (!companyId) {
      return res.status(404).json({ message: 'Invalid company.' });
    }
    if (!matterId) {
      return res.status(404).json({ message: 'Invalid matter.' });
    }
    if (!stock) {
      return res.status(404).json({ message: 'Invalid stock.' });
    }

    const currentStockQuantity = parseFloat(stock.quantity);
    
    // Check if sufficient stock is available
    if (jobQuantity > currentStockQuantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Available: ${currentStockQuantity} ${stock.unit}, Requested: ${jobQuantity} ${stock.unit}` 
      });
    }

    // Calculate new stock quantity
    const newStockQuantity = currentStockQuantity - jobQuantity;

    // Update stock quantity
    await stock.update({
      quantity: newStockQuantity,
      updated_at: new Date()
    });

    console.log(`Stock updated: ${stock.stock_name} - From ${currentStockQuantity} to ${newStockQuantity} ${stock.unit}`);

    // Create new job card
    const newJobCard = await JobCard.create({
      company_id: press,
      matter_id: matter,
      stock_id: stock_id,
      company,
      printingSize,
      currentStock:currentStockQuantity,
      quantity: jobQuantity,
      unit,
      plate,
      color,
      extraColor,
      contactDetails,
      printingDetails,
      date: new Date().toLocaleDateString(),
    });

    // Fetch the job card with relations using the correct alias
    const jobCardWithRelations = await JobCard.findByPk(newJobCard.id, {
      include: [
        { 
          model: Company, 
          attributes: ['id', 'company_name'] 
        },
        { 
          model: DistributorCompany, 
          attributes: ['id', 'matter'] 
        },
        { 
          model: BoardStock_Stock, 
          as: 'stock', // Use the alias defined in associations
          attributes: ['id', 'stock_name', 'unit', 'quantity'] 
        }
      ]
    });

    console.log(jobCardWithRelations)

    const savedJobCard = {
      id: jobCardWithRelations.id,
      press: jobCardWithRelations.Company.company_name,
      matterName: jobCardWithRelations.DistributorCompany.matter,
      stock: {
        id: jobCardWithRelations.stock.id,
        stock_name: jobCardWithRelations.stock.stock_name,
        unit: jobCardWithRelations.stock.unit,
        available_quantity: jobCardWithRelations.stock.quantity
      },
      currentStock: jobCardWithRelations.currentStock,
      company: jobCardWithRelations.company,
      printingSize: jobCardWithRelations.printingSize,
      quantity: jobCardWithRelations.quantity,
      unit: jobCardWithRelations.unit,
      plate: jobCardWithRelations.plate,
      color: jobCardWithRelations.color,
      extraColor: jobCardWithRelations.extraColor,
      contactDetails: jobCardWithRelations.contactDetails,
      printingDetails: jobCardWithRelations.printingDetails,
      date: jobCardWithRelations.date,
      createdAt: jobCardWithRelations.createdAt
    }

    res.status(201).json({
      message: 'Job card created successfully and stock updated.',
      jobCard: savedJobCard
    });

  } catch (error) {
    console.error('Error creating Job Card:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

export const getAllJobCards = async (req, res) => {
  try {
    const jobcards = await JobCard.findAll({
      include: [
        { 
          model: Company, 
          attributes: ['id', 'company_name'] 
        },
        { 
          model: DistributorCompany, 
          attributes: ['id', 'matter'] 
        },
        { 
          model: BoardStock_Stock, 
          as: 'stock', // Use the alias defined in associations
          attributes: ['id', 'stock_name', 'unit', 'quantity'] 
        }
      ],
      order: [['createdAt', 'DESC']] // Order by newest first
    });

    // Format the response
    const formattedJobCards = jobcards.map(card => ({
      id: card.id,
      press: card.Company?.company_name || 'N/A',
      matterName: card.DistributorCompany?.matter || 'N/A',
      stock: {
        id: card.stock?.id || null,
        stock_name: card.stock?.stock_name || 'N/A',
        unit: card.stock?.unit || 'N/A',
        available_quantity: card.stock?.quantity || 0
      },
      company: card.company,
      printingSize: card.printingSize,
      currentStock: card.currentStock,
      quantity: card.quantity,
      unit: card.unit,
      plate: card.plate,
      color: card.color,
      extraColor: card.extraColor,
      contactDetails: card.contactDetails,
      printingDetails: card.printingDetails,
      date: card.date,
      createdAt: card.createdAt,
      // Keep original for backward compatibility if needed
      Company: card.Company,
      DistributorCompany: card.DistributorCompany,
      Stock: card.stock // Updated to use the lowercase alias
    }));

    res.status(200).json(formattedJobCards);
  } catch (error) {
    console.error('Error fetching job cards:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET: Get job card by ID
export const getJobCardById = async (req, res) => {
  try {
    const { id } = req.params;

    const jobCard = await JobCard.findByPk(id, {
      include: [
        { 
          model: Company, 
          attributes: ['company_name'] 
        },
        { 
          model: DistributorCompany, 
          attributes: ['matter'] 
        },
        { 
          model: BoardStock_Stock, 
          as: 'stock', // Use the alias defined in associations
          attributes: ['id', 'stock_name', 'unit', 'quantity'] 
        }
      ]
    });

    if (!jobCard) {
      return res.status(404).json({ message: 'Job card not found.' });
    }

    const formattedJobCard = {
      id: jobCard.id,
      press: jobCard.Company?.company_name || 'N/A',
      matterName: jobCard.DistributorCompany?.matter || 'N/A',
      stock: {
        id: jobCard.stock?.id || null,
        stock_name: jobCard.stock?.stock_name || 'N/A',
        unit: jobCard.stock?.unit || 'N/A',
        available_quantity: jobCard.stock?.quantity || 0
      },
      company: jobCard.company,
      printingSize: jobCard.printingSize,
      currentStock: jobCard.currentStock,
      quantity: jobCard.quantity,
      unit: jobCard.unit,
      plate: jobCard.plate,
      color: jobCard.color,
      extraColor: jobCard.extraColor,
      contactDetails: jobCard.contactDetails,
      printingDetails: jobCard.printingDetails,
      stock_id: jobCard.stock_id,
      date: jobCard.date,
      createdAt: jobCard.createdAt
    };

    res.status(200).json({
      message: 'Job card retrieved successfully.',
      jobCard: formattedJobCard
    });

  } catch (error) {
    console.error('Error fetching job card:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT: Update job card (if needed)
export const updateJobCard = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the existing job card
    const jobCard = await JobCard.findByPk(id, {
      include: [
        { 
          model: BoardStock_Stock, 
          as: 'stock',
          attributes: ['id', 'stock_name', 'unit', 'quantity'] 
        }
      ]
    });
    
    if (!jobCard) {
      return res.status(404).json({ message: 'Job card not found.' });
    }

    // Store original values for stock calculation
    const originalQuantity = parseFloat(jobCard.quantity);
    const originalStockId = jobCard.stock_id;

    // Handle stock updates if quantity or stock_id changes
    let stockUpdateRequired = false;
    let newQuantity = originalQuantity;
    let newStockId = originalStockId;

    // Check if quantity is being updated
    if (updateData.quantity !== undefined) {
      newQuantity = parseFloat(updateData.quantity);
      if (isNaN(newQuantity) || newQuantity <= 0) {
        return res.status(400).json({ message: 'Quantity must be a valid positive number.' });
      }
      stockUpdateRequired = true;
    }

    // Check if stock_id is being updated
    if (updateData.stock_id !== undefined) {
      newStockId = updateData.stock_id;
      stockUpdateRequired = true;
    }

    if (stockUpdateRequired) {
      // If stock_id changed, we need to handle two different stocks
      if (newStockId !== originalStockId) {
        // Restore quantity to original stock
        const originalStock = await BoardStock_Stock.findByPk(originalStockId);
        if (originalStock) {
          const restoredQuantity = parseFloat(originalStock.quantity) + originalQuantity;
          await originalStock.update({
            quantity: restoredQuantity,
            updated_at: new Date()
          });
          console.log(`Original stock restored: ${originalStock.stock_name} - Quantity: ${restoredQuantity} ${originalStock.unit}`);
        }

        // Validate and update new stock
        const newStock = await BoardStock_Stock.findByPk(newStockId);
        if (!newStock) {
          return res.status(404).json({ message: 'Invalid new stock.' });
        }

        const newStockCurrentQuantity = parseFloat(newStock.quantity);
        if (newQuantity > newStockCurrentQuantity) {
          return res.status(400).json({ 
            message: `Insufficient stock. Available: ${newStockCurrentQuantity} ${newStock.unit}, Requested: ${newQuantity} ${newStock.unit}` 
          });
        }

        const updatedNewStockQuantity = newStockCurrentQuantity - newQuantity;
        await newStock.update({
          quantity: updatedNewStockQuantity,
          updated_at: new Date()
        });
        console.log(`New stock updated: ${newStock.stock_name} - From ${newStockCurrentQuantity} to ${updatedNewStockQuantity} ${newStock.unit}`);

      } else {
        // Same stock, different quantity - calculate the difference
        const currentStock = jobCard.stock;
        const quantityDifference = newQuantity - originalQuantity;
        const currentStockQuantity = parseFloat(currentStock.quantity);

        // If we need more stock than available
        if (quantityDifference > currentStockQuantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for increase. Available: ${currentStockQuantity} ${currentStock.unit}, Additional needed: ${quantityDifference} ${currentStock.unit}` 
          });
        }

        // Update stock quantity (subtract the difference)
        const newStockQuantity = currentStockQuantity - quantityDifference;
        await currentStock.update({
          quantity: newStockQuantity,
          updated_at: new Date()
        });
        console.log(`Stock updated: ${currentStock.stock_name} - From ${currentStockQuantity} to ${newStockQuantity} ${currentStock.unit} (difference: ${quantityDifference})`);
      }
    }

    // Validate other related entities if they're being updated
    if (updateData.press) {
      const companyExists = await Company.findByPk(updateData.press);
      if (!companyExists) {
        return res.status(404).json({ message: 'Invalid company.' });
      }
    }

    if (updateData.matter) {
      const matterExists = await DistributorCompany.findByPk(updateData.matter);
      if (!matterExists) {
        return res.status(404).json({ message: 'Invalid matter.' });
      }
    }

    // Update the job card
    await jobCard.update({
      ...updateData,
      updated_at: new Date()
    });

    // Fetch updated job card with relations
    const updatedJobCard = await JobCard.findByPk(id, {
      include: [
        { 
          model: Company, 
          attributes: ['id', 'company_name'] 
        },
        { 
          model: DistributorCompany, 
          attributes: ['id', 'matter'] 
        },
        { 
          model: BoardStock_Stock, 
          as: 'stock',
          attributes: ['id', 'stock_name', 'unit', 'quantity'] 
        }
      ]
    });

    // Format response similar to create endpoint
    const formattedJobCard = {
      id: updatedJobCard.id,
      press: updatedJobCard.Company.company_name,
      matterName: updatedJobCard.DistributorCompany.matter,
      stock: {
        id: updatedJobCard.stock.id,
        stock_name: updatedJobCard.stock.stock_name,
        unit: updatedJobCard.stock.unit,
        available_quantity: updatedJobCard.stock.quantity
      },
      currentStock: updatedJobCard.currentStock,
      company: updatedJobCard.company,
      printingSize: updatedJobCard.printingSize,
      quantity: updatedJobCard.quantity,
      unit: updatedJobCard.unit,
      plate: updatedJobCard.plate,
      color: updatedJobCard.color,
      extraColor: updatedJobCard.extraColor,
      contactDetails: updatedJobCard.contactDetails,
      printingDetails: updatedJobCard.printingDetails,
      date: updatedJobCard.date,
      createdAt: updatedJobCard.createdAt,
      updatedAt: updatedJobCard.updatedAt
    };

    res.status(200).json({
      message: 'Job card updated successfully and stock adjusted.',
      jobCard: formattedJobCard
    });

  } catch (error) {
    console.error('Error updating job card:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// DELETE: Delete job card
export const deleteJobCard = async (req, res) => {
  try {
    const { id } = req.params;

    const jobCard = await JobCard.findByPk(id);
    
    if (!jobCard) {
      return res.status(404).json({ message: 'Job card not found.' });
    }

    // Optional: Return stock quantity if needed
    if (jobCard.stock_id) {
      const stock = await BoardStock_Stock.findByPk(jobCard.stock_id);
      if (stock) {
        const returnQuantity = parseFloat(jobCard.quantity);
        const newStockQuantity = parseFloat(stock.quantity) + returnQuantity;
        
        await stock.update({
          quantity: newStockQuantity,
          updated_at: new Date()
        });

        console.log(`Stock returned: ${stock.stock_name} - From ${stock.quantity} to ${newStockQuantity} ${stock.unit}`);
      }
    }

    await jobCard.destroy();
    
    res.status(200).json({ message: 'Job card deleted successfully and stock returned.' });

  } catch (error) {
    console.error('Error deleting job card:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};