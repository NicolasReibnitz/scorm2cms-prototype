import useConsoleLogger from '@global/console-logger.ts';
import logScormCommunication from '@parent/log-scorm-communication.ts';
import {
	lmsGetValueHandler,
	lmsSetValueHandler,
	lmsInitializeHandler,
	lmsGetLastErrorHandler,
	lmsGetErrorStringHandler,
	lmsCommitHandler,
	fetchLmsData,
	fetchScolmUrl,
	lmsGetDiagnosticHandler,
	lmsFinishHandler
} from '@/parent/parent-event-handlers';

const devMode = true;
const loggerSettings: LoggerSettings = {
	siteName: 'Parent',
	siteColor: '#1260aa',
	logLevel: 5 // Log level for the logger (0: log, 1: error, 2: warn, 3: info, 4: debug, >=4: all)
};
const secretToken = import.meta.env.VITE_SECRET_TOKEN; // Shared secret for validation (in .env file)
const trustedDomains = import.meta.env.VITE_TRUSTED_DOMAINS.split(',').map((str: string) => str.trim()); // Trusted domains for postMessage (in .env file)
const { logger } = useConsoleLogger(loggerSettings);

document.addEventListener('DOMContentLoaded', async () => {
	logger.info('Parent DOM loaded.');

	const wrapperIframe = document.getElementById('wrapper-iframe') as HTMLIFrameElement;
	wrapperIframe.src = await fetchScolmUrl();
});

if (devMode) {
	document.body.classList.add('dev-mode');
	document.body.insertAdjacentHTML(
		'afterbegin',
		`<h1 class="dev-only">${import.meta.env.PROD ? 'PROD' : 'DEV'} parent server (cms)</h1>`
	);
}

/**
 * Event listener for messages from the wrapper.
 * The event handlers are defined in the parent-event-handlers.ts file.
 * Trusted domains and a secret token are defined in the .env file.
 */
window.addEventListener('message', async event => {
	// Check if the origin is trusted
	if (!trustedDomains.includes('*') && !trustedDomains.includes(event.origin)) {
		logger.warn('Received message from untrusted origin:', event.origin);
		if (devMode)
			logScormCommunication('IN', { type: 'error', value: 'Rejected: untrusted origin', origin: event.origin });
		return;
	}

	// Check if the token is valid
	if (event.data.token !== secretToken) {
		logger.warn('Invalid token received:', event.data.token, event.data);
		if (devMode)
			logScormCommunication('IN', { type: 'error', value: 'Rejected: invalid token', token: event.data.token });
		return;
	}

	const { data }: { data: WrapperBridgeMessage } = event;
	let result;

	if (devMode) logScormCommunication('IN', data);

	if (data.type === 'status') {
		logger.debug('Received status update message from wrapper:', data);

		if (data.methodName === 'init') {
			result = await fetchLmsData();
		} else if (data.methodName === 'iframe') {
			result = 'Gotcha!';
		}

		const response = {
			type: 'statusResponse',
			result,
			token: secretToken,
			methodName: data.methodName,
			requestId: data.requestId, // Send back the same requestId
			request: data
		};

		if (event.source) (event.source as Window).postMessage(response, event.origin as string);
	} else if (data.type === 'scormInteraction') {
		logger.debug('Received SCORM interaction from wrapper:', data);

		try {
			if (data.methodName === 'LMSGetValue') {
				result = await lmsGetValueHandler(data);
			} else if (data.methodName === 'LMSSetValue') {
				result = await lmsSetValueHandler(data);
			} else if (data.methodName === 'LMSInitialize') {
				result = await lmsInitializeHandler(data);
			} else if (data.methodName === 'LMSGetLastError') {
				result = await lmsGetLastErrorHandler(data);
			} else if (data.methodName === 'LMSGetErrorString') {
				result = await lmsGetErrorStringHandler(data);
			} else if (data.methodName === 'LMSGetDiagnostic') {
				result = await lmsGetDiagnosticHandler(data);
			} else if (data.methodName === 'LMSCommit') {
				result = await lmsCommitHandler(data);
			} else if (data.methodName === 'LMSFinish') {
				result = await lmsFinishHandler(data);
			}
		} catch (error) {
			logger.error('Error processing SCORM interaction:', error);
			result = null;
		}

		const response = {
			type: 'scormResponse',
			result,
			token: secretToken,
			requestId: data.requestId, // Send back the same requestId
			request: data
		};

		if (devMode) logScormCommunication('OUT', response);

		if (event.source) (event.source as Window).postMessage(response, event.origin as string);
	}
});
