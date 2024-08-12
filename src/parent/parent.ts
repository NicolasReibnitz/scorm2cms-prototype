import useHelpers from '@global/helpers.ts';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import 'highlight.js/styles/default.css';
import { logScormCommunication } from './logScormCommunication.ts';
import initData from '@data/scorm-status.json';

hljs.registerLanguage('json', json);

const iframe = document.getElementById('wrapper-iframe') as HTMLIFrameElement;
const siteName = 'Parent';
const siteColor = '#1260aa';
const logLevel = 5; // Log level for the logger (0: log, 1: error, 2: warn, 3: info, 4: debug, >=4: all)
const secretToken = import.meta.env.VITE_SECRET_TOKEN; // Shared secret for validation (in .env file)
const { logger } = useHelpers({ siteName, siteColor, logLevel });
const trustedDomains = import.meta.env.VITE_TRUSTED_DOMAINS.split(',').map((str: string) => str.trim());

document.addEventListener('DOMContentLoaded', () => logger.log('Parent DOM loaded.'));

// Send a message to the iframe
if (iframe) {
	iframe.onload = () => {
		iframe?.contentWindow?.postMessage(
			{ message: `Hello from ${siteName}!`, token: secretToken, requestId: '123' },
			'*'
		);
	};
}

window.addEventListener('message', async event => {
	if (!trustedDomains.includes(event.origin)) {
		logger.warn('Received message from untrusted origin:', event.origin);
		logScormCommunication('in', { type: 'error', value: 'Rejected: untrusted origin', origin: event.origin });
		return;
	}

	const { data } = event;
	let result;

	if (data.token !== secretToken) {
		logger.warn('Invalid token received:', data.token, data);
		logScormCommunication('in', { type: 'error', value: 'Rejected: invalid token', token: data.token });
		return;
	}

	logScormCommunication('IN', data);

	if (data.type === 'scormInteraction') {
		logger.log('Received SCORM interaction from wrapper:', data);

		try {
			if (data.methodName === 'LMSGetValue') {
				result = 'Value from database';
			} else if (data.methodName === 'LMSSetValue') {
				result = 'true';
			} else if (data.methodName === 'LMSInitialize') {
				result = 'true';
			} else if (data.methodName === 'LMSGetLastError') {
				result = '0';
			} else if (data.methodName === 'LMSGetErrorString') {
				result = 'ERROR_STRING';
			}
		} catch (error) {
			logger.error('Error processing SCORM interaction:', error);
			result = null;
		}

		const response = {
			type: 'scormResponse',
			result: result,
			token: secretToken,
			requestId: data.requestId // Send back the same requestId
		};

		logScormCommunication('OUT', response);

		(event.source as Window).postMessage(response, event.origin as string);
	} else if (data.type === 'status') {
		logger.log('Received status update message from wrapper:', data);

		if (data.methodName === 'iframe') {
			result = 'Gotcha!';
		} else if (data.methodName === 'init') {
			result = initData;
		}

		const response = {
			type: 'statusResponse',
			result,
			token: secretToken,
			methodName: data.methodName,
			requestId: data.requestId // Send back the same requestId
		};

		(event.source as Window).postMessage(response, event.origin as string);
	}
});
