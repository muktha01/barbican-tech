import { Factory } from "../models/index.js";

export const createFactory = async (req, res) => {
  try {
    const {
      factory_name,
      location,
      contact_person_name,
      contact_person_mobile,
    } = req.body;

    const existingFactory = await Factory.findOne({
      where: { factory_name },
    });

    if (existingFactory) {
      return res.status(400).json({
        message: "Factory already exists",
      });
    }

    const newFactory = await Factory.create({
      factory_name,
      location,
      contact_person_mobile,
      contact_person_name,
    });

    return res.status(201).json({
      message: "Factory created successfully",
      factory: newFactory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const getAllFactories = async (req, res) => {
  try {
    const factories = await Factory.findAll();

    if (!factories || factories.length === 0) {
      return res.status(404).json({
        message: "No factories found",
      });
    }

    return res.status(200).json({
      message: "Factories retrieved successfully",
      factories,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const getFactoryById = async (req, res) => {
  try {
    const { factoryId } = req.params;
    const factory = await Factory.findByPk(factoryId);

    if (!factory) {
      return res.status(404).json({
        message: "Factory not found",
      });
    }

    return res.status(200).json({
      message: "Factory retrieved successfully",
      factory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const updateFactory = async (req, res) => {
  try {
    const { factoryId } = req.params;
    const {
      factory_name,
      location,
      contact_person_name,
      contact_person_mobile,
    } = req.body;

    const factory = await Factory.findByPk(factoryId);

    if (!factory) {
      return res.status(404).json({
        message: "Factory not found",
      });
    }

    await factory.update({
      factory_name: factory_name || factory.factory_name,
      location: location || factory.location,
      contact_person_mobile:
        contact_person_mobile || factory.contact_person_mobile,
      contact_person_name: contact_person_name || factory.contact_person_name,
    });

    return res.status(200).json({
      message: "Factory updated successfully",
      factory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const deleteFactory = async (req, res) => {
  try {
    const { factoryId } = req.params;
    const factory = await Factory.findByPk(factoryId);

    if (!factory) {
      return res.status(404).json({
        message: "Factory not found",
      });
    }

    await factory.destroy();

    return res.status(200).json({
      message: "Factory deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};
