// import 'scorm-again/dist/scorm12.js';
import Scorm12API from 'scorm-again/src/Scorm12API.js';

import useHelpers from '@global/helpers.ts';
import interactiveURL from '/interactive/index.html?url';

const interactiveIframe = document.getElementById('interactive-iframe') as HTMLIFrameElement;
const interactiveIframeSrc = interactiveIframe.src;
const btnTerminate = document.getElementById('btn-terminate');
const secretToken = import.meta.env.VITE_SECRET_TOKEN; // Shared secret for validation (in .env file)
const trustedDomains = import.meta.env.VITE_TRUSTED_DOMAINS.split(',').map((str: string) => str.trim());
const pendingRequests = new Map();
let scormEventListenersAdded = false;

const siteSettings = {
	siteName: 'Wrapper',
	siteColor: 'rgb(0 192 204)',
	logLevel: 5,
	secretToken,
	interactiveURL
};

const { logger } = useHelpers(siteSettings);

const scormAgainSettings = {
	autocommit: true,
	autocommitSeconds: 10,
	logLevel: 3,
	selfReportSessionTime: true,
	alwaysSendTotalTime: true
};

document.addEventListener('DOMContentLoaded', () => {
	logger.log('Wrapper DOM loaded.');
	sendMessageToParent({ type: 'status', methodName: 'init', value: 'Wrapper loaded' });
});

if (interactiveIframe) {
	interactiveIframe.onload = () => {
		sendMessageToParent({ type: 'status', methodName: 'iframe', value: 'Iframe loaded' });
	};
}

// Global message handler to handle all incoming messages from the parent
window.addEventListener('message', event => {
	if (!trustedDomains.includes(event.origin)) return;
	if (event.data.token !== siteSettings.secretToken) return;

	logger.log('Message received from parent:', event.data);

	const { requestId } = event.data;

	if (!pendingRequests.has(requestId)) {
		logger.warn('Request ID not found:', requestId, 'Message ignored.');
		return;
	}

	const { resolve } = pendingRequests.get(requestId);

	if (event.data.type === 'statusResponse') {
		logger.log('Status update response message received from parent:', event.data, event.data.result);

		if (event.data.methodName === 'init') {
			initScormAPI(event.data.result);
		}
		resolve(event.data.result);
		pendingRequests.delete(requestId);
	}

	if (event.data.type === 'scormResponse') {
		resolve(event.data.result);
		pendingRequests.delete(requestId);
	}
});

btnTerminate?.addEventListener('click', () => {
	if (interactiveIframe.src === interactiveIframeSrc) {
		interactiveIframe.src = '';
		btnTerminate.innerText = 'Reload';
	} else {
		btnTerminate.innerText = 'Terminate';
		scormEventListenersAdded = false;

		sendMessageToParent({ type: 'status', methodName: 'init', value: 'Re-initialize' });
	}
});

const handleScormInteraction: HandleScormInteraction = async (methodName, ...args) => {
	logger.info(`SCORM API method called: ${methodName}`, args);

	// Send a message to the parent and return a Promise that resolves with the result
	return sendMessageToParent({
		type: 'scormInteraction',
		methodName,
		args,
		CMIElement: args[0],
		CMIElementValue: args[1] || null
	}).catch(error => {
		logger.error(`Error processing SCORM method ${methodName}:`, error);
		return null; // Return an appropriate default value on error
	});
};

function sendMessageToParent(message: WrapperBridgeMessage) {
	return new Promise((resolve, reject) => {
		const requestId = generateUniqueId();
		message.token = siteSettings.secretToken;
		message.requestId = requestId;
		message.time = new Date().toLocaleTimeString();

		// Store the resolve function in a map with the requestId as the key
		pendingRequests.set(requestId, { resolve, reject });

		// Send the message to the parent
		window.parent.postMessage(message, '*');
		logger.debug('Message sent to parent:', message);
	});
}

function getCMIValue(path: string) {
	const keys = path.split('.');
	let result = window.API;
	for (const key of keys) {
		result = result[key];
		if (result === undefined) {
			return undefined;
		}
	}
	return result;
}

function generateUniqueId() {
	return 'xxxxxx'.replace(/[xy]/g, function (char) {
		const random = (Math.random() * 16) | 0;
		return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
	});
}

function addScormEventListeners() {
	if (scormEventListenersAdded) return;
	scormEventListenersAdded = true;

	window.API.on('LMSInitialize', async () => {
		logger.scorm('init');
		await handleScormInteraction('LMSInitialize');
	});

	window.API.on('LMSCommit', async () => {
		logger.scorm('commit');
		await handleScormInteraction('LMSCommit');
	});

	window.API.on('LMSGetValue.*', async (CMIElement: string) => {
		const result = getCMIValue(CMIElement);
		logger.scorm('get', CMIElement, result);
		await handleScormInteraction('LMSGetValue', CMIElement, result);
	});

	window.API.on('LMSSetValue.*', async (CMIElement: string, value: any[]) => {
		logger.scorm('set', CMIElement, value);
		await handleScormInteraction('LMSSetValue', CMIElement, value);
	});
}

function initScormAPI(initData: object) {
	logger.log('initScormAPI:', initData);

	window.API = new Scorm12API(scormAgainSettings);
	window.API.loadFromJSON(initData);

	addScormEventListeners();

	interactiveIframe.src = siteSettings.interactiveURL;
}
