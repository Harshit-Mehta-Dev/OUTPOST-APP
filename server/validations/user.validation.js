const Joi = require('joi');

const syncUser = {
  body: Joi.object().keys({
    email: Joi.string().email().max(255).required(),
    username: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9_\-\s]+$/).required()
  })
};

const registerUser = {
  body: Joi.object().keys({
    email: Joi.string().email().max(255).required(),
    username: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9_\-\s]+$/).required(),
    password: Joi.string().min(8).max(128).required()
  })
};

const loginUser = {
  body: Joi.object().keys({
    email: Joi.string().email().max(255).required(),
    password: Joi.string().max(128).required()
  })
};

const updateProfile = {
  body: Joi.object().keys({
    email: Joi.string().email().max(255).required(),
    username: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9_\-\s]+$/),
    profilePictureUrl: Joi.string().uri().max(1024).allow(''),
    currentPassword: Joi.string().max(128),
    newPassword: Joi.string().min(8).max(128)
  }).with('newPassword', 'currentPassword')
};

module.exports = {
  syncUser,
  registerUser,
  loginUser,
  updateProfile
};
