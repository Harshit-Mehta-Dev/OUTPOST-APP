const Joi = require('joi');

const createCampsite = {
  body: Joi.object().keys({
    id: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.string().required(),
    icon: Joi.string().required(),
    totalScouts: Joi.number().integer().min(0),
    activeScouts: Joi.number().integer().min(0),
    color: Joi.string(),
    adminEmail: Joi.string().email().required(),
    adminUsername: Joi.string().required(),
    isPublic: Joi.boolean().default(false),
    template: Joi.string().allow(''),
    imageUrl: Joi.string().allow(''),
    members: Joi.array().items(Joi.string()),
    expeditions: Joi.array().items(
      Joi.object({
        id: Joi.string(),
        name: Joi.string(),
        type: Joi.string().valid('text', 'voice')
      })
    )
  })
};

module.exports = {
  createCampsite
};
