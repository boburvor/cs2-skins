const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      if (req.file) require("fs").promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        message: "Kiritilgan ma'lumotlarda xatolik bor",
        errors: error.details.map((detail) => detail.message),
      });
    }

    req[source] = value;

    next();
  };
};

module.exports = validate;
