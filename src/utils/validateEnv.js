const Joi = require('joi');
const logger = require('./logger');

// Define schema for environment variables
const envSchema = Joi.object({
    // Application
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'staging', 'local')
        .default('development'),
    PORT: Joi.number()
        .default(3000),

    // Database URLs
    MONGO_DB_URL: Joi.string()
        .required()
        .description('MongoDB connection URL is required'),
    REDIS_DB_URL: Joi.string()
        .required()
        .description('Redis connection URL is required'),

    // Google OAuth (required for SSO)
    Google_Client_ID: Joi.string()
        .required()
        .description('Google OAuth Client ID is required'),
    Google_Client_Secret: Joi.string()
        .required()
        .description('Google OAuth Client Secret is required'),

    // JWT Secret
    REFRESH_TOKEN_SECRET: Joi.string()
        .required()
        .min(32)
        .description('Refresh token secret is required (min 32 characters)'),

    // Application tokens (at least one should be defined)
    // We'll make these optional since they're dynamically added
})
    .unknown(true); // Allow other env variables (for app tokens)

function validateEnv() {
    const { error, value: validatedEnv } = envSchema.validate(process.env, {
        abortEarly: false, // Show all errors, not just first one
        stripUnknown: false, // Keep all env vars
    });

    if (error) {
        logger.error('❌ Environment validation failed:');
        error.details.forEach((detail) => {
            logger.error(`   - ${detail.message}`);
        });

        logger.error('\n💡 Please check your .env file and ensure all required variables are set.');
        logger.error('   See .env.example for reference.\n');

        process.exit(1); // Exit with error code
    }

    logger.info('✅ Environment variables validated successfully');
    return validatedEnv;
}

module.exports = validateEnv;
