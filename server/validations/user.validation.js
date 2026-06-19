const Joi = require('joi');

const syncUser = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    username: Joi.string().required()
  })
};

const registerUser = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    username: Joi.string().required(),
    password: Joi.string().min(6).required()
  })
};

const loginUser = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

const updateProfile = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    username: Joi.string(),
    profilePictureUrl: Joi.string().uri().allow(''),
    currentPassword: Joi.string(),
    newPassword: Joi.string().min(6)
  }).with('newPassword', 'currentPassword')
};

module.exports = {
  syncUser,
  registerUser,
  loginUser,
  updateProfile
};
