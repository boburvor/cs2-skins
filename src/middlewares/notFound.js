const notFound = (req, res, next) => {
  res.status(404).json({
    message: `Bunday manzil topilmadi: [${req.method}] ${req.originalUrl}`,
  });
};

module.exports = notFound;
