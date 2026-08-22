import { body, param } from 'express-validator';

export const updateProfileValidator = [
  body('rollNumber').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
  body('graduationYear').optional({ values: 'falsy' }).isInt({ min: 1950, max: 2100 }).toInt(),
  body('departmentId').optional({ values: 'falsy' }).isMongoId(),
  body('careerInterests').optional().isArray().withMessage('careerInterests must be an array'),
  body('careerInterests.*').optional().isString().trim().notEmpty(),
  body('portfolioUrl').optional({ values: 'falsy' }).isURL().withMessage('Must be a valid URL'),
  body('githubUrl').optional({ values: 'falsy' }).isURL().withMessage('Must be a valid URL'),
  body('linkedinUrl').optional({ values: 'falsy' }).isURL().withMessage('Must be a valid URL'),
];

export const itemIdParamValidator = [param('itemId').isMongoId().withMessage('Invalid item id')];

const yearField = (name, opts = {}) =>
  body(name)
    .optional(opts.optional ? { values: 'falsy' } : undefined)
    .isInt({ min: 1950, max: 2100 })
    .withMessage(`${name} must be a valid year`)
    .toInt();

const dateField = (name, required) => {
  const chain = body(name);
  return (required ? chain : chain.optional({ values: 'falsy' }))
    .isISO8601()
    .withMessage(`${name} must be a valid date`)
    .toDate();
};

const urlField = (name) =>
  body(name).optional({ values: 'falsy' }).isURL().withMessage(`${name} must be a valid URL`);

/** create/update validator pairs for each of the 8 sub-resource array fields. */
export const studentItemValidators = {
  education: {
    create: [
      body('degree').trim().notEmpty().withMessage('degree is required'),
      body('institution').trim().notEmpty().withMessage('institution is required'),
      yearField('startYear'),
      yearField('endYear', { optional: true }),
      body('cgpa').optional({ values: 'falsy' }).isFloat({ min: 0, max: 10 }),
    ],
    update: [
      body('degree').optional().trim().notEmpty(),
      body('institution').optional().trim().notEmpty(),
      yearField('startYear', { optional: true }),
      yearField('endYear', { optional: true }),
      body('cgpa').optional({ values: 'falsy' }).isFloat({ min: 0, max: 10 }),
    ],
  },

  skills: {
    create: [
      body('name').trim().notEmpty().withMessage('name is required'),
      body('proficiency').optional().isIn(['beginner', 'intermediate', 'advanced']),
    ],
    update: [
      body('name').optional().trim().notEmpty(),
      body('proficiency').optional().isIn(['beginner', 'intermediate', 'advanced']),
    ],
  },

  languages: {
    create: [
      body('name').trim().notEmpty().withMessage('name is required'),
      body('proficiency').optional().isIn(['basic', 'conversational', 'fluent', 'native']),
    ],
    update: [
      body('name').optional().trim().notEmpty(),
      body('proficiency').optional().isIn(['basic', 'conversational', 'fluent', 'native']),
    ],
  },

  projects: {
    create: [
      body('title').trim().notEmpty().withMessage('title is required'),
      body('description').optional({ values: 'falsy' }).trim(),
      body('techStack').optional().isArray(),
      body('techStack.*').optional().isString().trim().notEmpty(),
      urlField('githubUrl'),
      urlField('liveUrl'),
      dateField('startDate', false),
      dateField('endDate', false),
    ],
    update: [
      body('title').optional().trim().notEmpty(),
      body('description').optional({ values: 'falsy' }).trim(),
      body('techStack').optional().isArray(),
      body('techStack.*').optional().isString().trim().notEmpty(),
      urlField('githubUrl'),
      urlField('liveUrl'),
      dateField('startDate', false),
      dateField('endDate', false),
    ],
  },

  internships: {
    create: [
      body('company').trim().notEmpty().withMessage('company is required'),
      body('role').trim().notEmpty().withMessage('role is required'),
      dateField('startDate', true),
      dateField('endDate', false),
      body('description').optional({ values: 'falsy' }).trim(),
    ],
    update: [
      body('company').optional().trim().notEmpty(),
      body('role').optional().trim().notEmpty(),
      dateField('startDate', false),
      dateField('endDate', false),
      body('description').optional({ values: 'falsy' }).trim(),
    ],
  },

  experience: {
    create: [
      body('company').trim().notEmpty().withMessage('company is required'),
      body('role').trim().notEmpty().withMessage('role is required'),
      dateField('startDate', true),
      dateField('endDate', false),
      body('description').optional({ values: 'falsy' }).trim(),
    ],
    update: [
      body('company').optional().trim().notEmpty(),
      body('role').optional().trim().notEmpty(),
      dateField('startDate', false),
      dateField('endDate', false),
      body('description').optional({ values: 'falsy' }).trim(),
    ],
  },

  certifications: {
    create: [
      body('title').trim().notEmpty().withMessage('title is required'),
      body('issuer').trim().notEmpty().withMessage('issuer is required'),
      dateField('issueDate', false),
      urlField('certificateUrl'),
    ],
    update: [
      body('title').optional().trim().notEmpty(),
      body('issuer').optional().trim().notEmpty(),
      dateField('issueDate', false),
      urlField('certificateUrl'),
    ],
  },

  achievements: {
    create: [
      body('title').trim().notEmpty().withMessage('title is required'),
      body('description').optional({ values: 'falsy' }).trim(),
      dateField('date', false),
    ],
    update: [
      body('title').optional().trim().notEmpty(),
      body('description').optional({ values: 'falsy' }).trim(),
      dateField('date', false),
    ],
  },
};
