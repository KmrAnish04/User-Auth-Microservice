const config = require('config')

const SSOAuthServerConfig = {
	app: {
		environment: String(config.get('environment')),
		port: parseInt(config.get('port')),
	},
	secrets: {
		GClientID: String(config.get('GOOGLE_CLIENT_ID')),
		GClientSecret: String(config.get('GOOGLE_SECRET')),
		REFRESH_TOKEN_SECRET: String(config.get('REFRESH_TOKEN_SECRET')),
		ServiceConsumerAppTokens: {},
		ServiceConsumerAppNameTokenMapping: {}
	},
	mongoDB: {
		path: String(config.get('MongoDBPath')),
	},
	redisDB: {
		path: String(config.get('RedisDBPath')),
	}
}

module.exports = SSOAuthServerConfig
