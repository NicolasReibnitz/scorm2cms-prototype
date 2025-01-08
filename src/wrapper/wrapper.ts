import { Scorm12API } from 'scorm-again';

import useConsoleLogger from '@global/console-logger';
import interactiveURL from '/interactive/index.html?url';
import { Settings } from 'scorm-again/src/types/api_types';
import { Scorm12Impl } from 'scorm-again/src/Scorm12API';

const interactiveIframe = document.getElementById('interactive-iframe') as HTMLIFrameElement;
const interactiveIframeSrc = interactiveIframe.src;
const secretToken = import.meta.env.VITE_SECRET_TOKEN; // Shared secret for validation (in .env file)
const trustedDomains = import.meta.env.VITE_TRUSTED_DOMAINS.split(',').map((str: string) => str.trim());
const pendingRequests = new Map();
// const devMode = window.parent.document.body.classList.contains('dev-mode');
const devMode = true;

if (devMode) {
	document.body.classList.add('dev-mode');
	document.body.insertAdjacentHTML(
		'afterbegin',
		'<h2 class="dev-only">wrapper iframe <button id="btn-terminate" class="btn-standard" type="button">terminate</button></h2>'
	);

	const btnTerminate = document.getElementById('btn-terminate');

	btnTerminate?.addEventListener('click', () => {
		if (interactiveIframe.src === interactiveIframeSrc) {
			interactiveIframe.src = '';
			btnTerminate.innerText = 'reload';
		} else {
			btnTerminate.innerText = 'terminate';
			scormEventListenersAdded = false;

			sendMessageToParent({ type: 'status', methodName: 'init', value: 'Re-initialize' });
		}
	});
}

let scormEventListenersAdded = false;

const loggerSettings: LoggerSettings = {
	siteName: 'Wrapper',
	siteColor: 'rgb(0 192 204)',
	logLevel: 5 // Log level for the logger (0: log, 1: error, 2: warn, 3: info, 4: debug, >=4: all)
};

const { logger } = useConsoleLogger(loggerSettings);

const scormAgainSettings: Settings = {
	autocommit: true,
	autocommitSeconds: 10,
	logLevel: 3,
	selfReportSessionTime: true,
	alwaysSendTotalTime: true,
	renderCommonCommitFields: false,
	sendFullCommit: false
	// lmsCommitUrl: 'http://localhost:5174/api/lms/commit',
	// fetchMode: 'cors'

	// responseHandler: async function (response: Response): Promise<ResultObject> {
	// 	if (typeof response !== 'undefined') {
	// 		const responseText = await response.text();
	// 		let httpResult = null;
	// 		if (responseText) {
	// 			httpResult = JSON.parse(responseText);
	// 		}
	// 		if (httpResult === null || !{}.hasOwnProperty.call(httpResult, 'result')) {
	// 			if (response.status === 200) {
	// 				return {
	// 					result: APIConstants.global.SCORM_TRUE,
	// 					errorCode: 0
	// 				};
	// 			} else {
	// 				return {
	// 					result: APIConstants.global.SCORM_FALSE,
	// 					errorCode: 101
	// 				};
	// 			}
	// 		} else {
	// 			return {
	// 				result: httpResult.result,
	// 				errorCode: httpResult.errorCode
	// 					? httpResult.errorCode
	// 					: httpResult.result === APIConstants.global.SCORM_TRUE
	// 						? 0
	// 						: 101
	// 			};
	// 		}
	// 	}
	// 	return {
	// 		result: APIConstants.global.SCORM_FALSE,
	// 		errorCode: 101
	// 	};
	// },
	// requestHandler: function (commitObject: CommitObject) {
	// 	console.log('⚠️⚠️⚠️⚠️ commitObject: ', commitObject);
	// 	return commitObject;
	// }
};

document.addEventListener('DOMContentLoaded', () => {
	logger.info('Wrapper DOM loaded.');
	sendMessageToParent({ type: 'status', methodName: 'init', value: 'Wrapper loaded' });
});

if (interactiveIframe)
	interactiveIframe.onload = () => {
		sendMessageToParent({ type: 'status', methodName: 'iframe', value: 'Iframe loaded' });
	};

// Global message handler to handle all incoming messages from the parent
window.addEventListener('message', event => {
	if (!trustedDomains.includes('*') && !trustedDomains.includes(event.origin)) return;
	if (event.data.token !== secretToken) return;

	logger.debug(
		`[${event.data.requestId}] Message received from parent (${event.data.type}: ${event.data.result}):`,
		event.data
	);

	const { requestId } = event.data;

	if (!pendingRequests.has(requestId)) {
		logger.debug('Request ID not found:', requestId, 'Message ignored.');
		return;
	}

	const { resolve } = pendingRequests.get(requestId);

	if (event.data.type === 'statusResponse') {
		// logger.debug('Status update response message received from parent:', event.data, event.data.result);

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

const handleScormInteraction: HandleScormInteraction = async (methodName, ...args) => {
	// logger.debug(`SCORM API method called: ${methodName}`, args);

	// Send a message to the parent and return a Promise that resolves with the result
	return sendMessageToParent({
		type: 'scormInteraction',
		methodName,
		args,
		CMIElement: args[0],
		value: args[1]
	}).catch(error => {
		logger.error(`Error processing SCORM method ${methodName}:`, error);
		return null; // Return an appropriate default value on error
	});
};

function sendMessageToParent(message: WrapperBridgeMessage) {
	return new Promise((resolve, reject) => {
		const requestId = generateUniqueId();
		message.token = secretToken;
		message.requestId = requestId;
		message.time = new Date().toLocaleTimeString();

		// Store the resolve function in a map with the requestId as the key
		pendingRequests.set(requestId, { resolve, reject });

		// Send the message to the parent
		window.parent.postMessage(message, '*');
		logger.debug(`[${message.requestId}] Message sent to parent (${message.type}/${message.methodName}):`, message);
	});
}

function getCMIValue(path: string) {
	if (!path) return undefined;
	const keys = path.split('.') as (keyof Scorm12API)[];
	let api = window.API;
	let result;
	for (const key of keys) {
		result = api[key];
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

	// Callback function has no parameters
	window.API.on('LMSGetErrorString', async () => {
		const result = 'UNKNOWN';
		logger.scorm('error-string', '', result);
		await handleScormInteraction('LMSGetErrorString', '', result);
	});

	// Callback function has no parameters
	window.API.on('LMSGetDiagnostic', async () => {
		const result = 'UNKNOWN';
		logger.scorm('diagnostic', '', result);
		await handleScormInteraction('LMSGetDiagnostic', '', result);
	});

	// Callback function has no parameters
	window.API.on('LMSGetLastError', async () => {
		const result = 'UNKNOWN';
		if (result !== 'UNKNOWN') logger.scorm('last-error', 'code', result);
		await handleScormInteraction('LMSGetLastError', '', result);
	});

	// Callback function has no parameters
	window.API.on('LMSInitialize', async () => {
		const result = window.API.renderCommitCMI(true) as Scorm12Impl;
		logger.scorm('init', 'cmi', result.cmi);
		await handleScormInteraction('LMSInitialize', '', JSON.stringify(result.cmi));
	});

	// Callback function has no parameters
	window.API.on('LMSFinish', async () => {
		const result = window.API.renderCommitCMI(true) as Scorm12Impl;

		logger.scorm('finish', 'cmi', result.cmi);
		await handleScormInteraction('LMSFinish', '', JSON.stringify(result.cmi));
	});

	// Callback function has no parameters
	window.API.on('LMSCommit', async () => {
		const result = window.API.renderCommitCMI(true) as Scorm12Impl;
		logger.scorm('commit', 'cmi', result.cmi);
		await handleScormInteraction('LMSCommit', 'cmi', JSON.stringify(result.cmi));
	});

	// Callback function has one parameter
	window.API.on('LMSGetValue.*', async (CMIElement: string) => {
		const result = getCMIValue(CMIElement);
		logger.scorm('get', CMIElement, result);
		await handleScormInteraction('LMSGetValue', CMIElement, result);
	});

	// Callback function has two parameters
	window.API.on('LMSSetValue.*', async (CMIElement: string, value: any[]) => {
		logger.scorm('set', CMIElement, value);
		await handleScormInteraction('LMSSetValue', CMIElement, value);
	});
}

function initScormAPI(initData: object) {
	logger.debug('initScormAPI:', initData);

	window.API = new Scorm12API(scormAgainSettings);
	window.API.loadFromJSON({ cmi: initData });

	addScormEventListeners();

	interactiveIframe.src = import.meta.env.PROD ? 'index.html' : interactiveURL;
}
