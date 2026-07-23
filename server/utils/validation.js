const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true, // Strips fields that are not in the schema
  });
  if (error) {
    return res.status(400).json({
      message: 'Validation Error',
      details: error.details.map((x) => x.message),
    });
  }
  req.body = value; // Replace req.body with validated/stripped data
  next();
};

const registerSchema = Joi.object({
  email: Joi.string().email().required().max(255),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().max(255),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  email: Joi.string().email().max(255).optional(),
  username: Joi.string().alphanum().min(3).max(30).optional(),
  profilePictureUrl: Joi.string().uri().allow('').optional(),
  currentPassword: Joi.string().optional(),
  newPassword: Joi.string().min(8).max(128).optional(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().max(255),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  twoFactorCode: Joi.string().length(6).required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
