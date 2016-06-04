/* jslint node: true, esnext: true */

'use strict';

const endpoint = require('kronos-endpoint'),
	service = require('kronos-service'),
	Gelf = require('gelf');

/**
 * Log receiving service
 */
class GelfLogger extends service.Logger {

	static get name() {
		return 'gelf-logger';
	}

	get type() {
		return GelfLogger.name;
	}

	get configurationAttributes() {
		return Object.assign({
			graylogPort: {
				description: 'gelf server port',
				type: 'integer',
				default: 12201,
				needsRestart: true
			},
			graylogHostname: {
				description: 'gelf server name',
				type: 'string',
				default: '127.0.0.1',
				needsRestart: true
			},
			connection: {
				type: 'string',
				default: 'wan',
				needsRestart: true
			},
			maxChunkSizeWan: {
				type: 'integer',
				default: 1420,
				needsRestart: true
			},
			maxChunkSizeLan: {
				type: 'integer',
				default: 8154,
				needsRestart: true
			}
		}, super.configurationAttributes);
	}

	_start() {
		const gelf = new Gelf({
			graylogPort: this.graylogPort,
			graylogHostname: this.graylogHostname,
			connection: this.connection,
			maxChunkSizeWan: this.maxChunkSizeWan,
			maxChunkSizeLan: this.maxChunkSizeLan
		});

		this.endpoints.log.receive = entry => {
			try {
				gelf.emit('gelf.log', entry);
			} catch (e) {
				console.log(`Unable to log entry with the following keys: ${Object.keys(entry)} ${e}`);
				return Promise.reject(e);
			}
			return Promise.resolve();
		};

		return Promise.resolve();
	}
}

module.exports.registerWithManager = manager => {
	return manager.registerServiceFactory(GelfLogger).then(sf => {
		return manager.declareService({
			type: GelfLogger.name,
			name: GelfLogger.name
		});
	});
}
