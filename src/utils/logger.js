const winston = require('winston');

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(logColors);

// Define log format based on environment
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Define transports based on environment
const transports = [];

// Console transport (always)
if (process.env.NODE_ENV !== 'production') {
    // Development: colored console output
    transports.push(
        new winston.transports.Console({
            format: consoleFormat,
        })
    );
} else {
    // Production: JSON format for log aggregation
    transports.push(
        new winston.transports.Console({
            format: logFormat,
        })
    );
}

// File transports (optional - for local dev)
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local') {
    transports.push(
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: logFormat,
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: logFormat,
        })
    );
}

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    levels: logLevels,
    format: logFormat,
    transports,
    exitOnError: false,
});

module.exports = logger;
