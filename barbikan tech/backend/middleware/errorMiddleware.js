export const errorHandler = (err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
  });
};
