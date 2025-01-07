import useConsoleLogger from '@/_global/console-logger';

const loggerSettings: LoggerSettings = {
	siteName: 'Event',
	siteColor: '#ff9900',
	logLevel: 3 // Log level for the logger (0: log, 1: error, 2: warn, 3: info, 4: debug, >=4: all)
};
const { logger } = useConsoleLogger(loggerSettings);

/**
 * Fetch the LMS data from the server.
 *
 * This function sends a GET request to a mock server to retrieve the LMS data.
 * Use this function to fetch the current state of the CMI from the database.
 *
 * @return {Promise<object>} - The LMS CMI data
 */
const fetchLmsData = async (): Promise<object> => {
	if (import.meta.env.PROD) return {};

	const response = await fetch(import.meta.env.VITE_LMS_SERVER_FETCH);
	const data = await response.json();
	logger.scorm('FETCH', 'cmi', data);

	return data;
};

/**
 * Fetch the URL for the desired interactive package.
 *
 * This function sends a GET request to a mock server to retrieve the URL for
 * the desired interactive package.
 * This URL will be used to load the interactive package in an iframe.
 *
 * Please use this as a template to implement your own logic to fetch the URL.
 *
 * @return {Promise<string>} - The URL for the interactive package
 */
const fetchScolmUrl = async (): Promise<string> => {
	if (import.meta.env.PROD) return 'wrapper.html';

	const response = await fetch(import.meta.env.VITE_LMS_SERVER_URL);
	const data = await response.json();

	logger.scorm('FETCH', 'url', data.scolm_url);

	return data.scolm_url;
};

/**
 * Store the LMS data on the server.
 *
 * This function sends a POST request to a mock server to store the LMS data.
 * Use this function to store the current state of the CMI to the database.
 *
 * @param {object} cmiObject - The CMI object to store
 * @return {Promise<object | boolean>} - The response from the server or 'false' if an error occurred
 */
const storeLmsData = async (cmiObject: object): Promise<object | boolean> => {
	if (import.meta.env.PROD) {
		logger.scorm('STORE 😬', 'cmi', cmiObject);
		return cmiObject;
	}

	try {
		const response = await fetch(import.meta.env.VITE_LMS_SERVER_STORE, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(cmiObject)
		});
		const data = await response.json();
		logger.scorm('STORE', 'cmi', data.data);

		return data;
	} catch (error) {
		console.error('Error storing data on server:', error);
		return false;
	}
};

/**
 * Define the the handler for the LMSInitialize SCORM interaction.
 *
 * This function will be called when the LMSInitialize SCORM interaction is received.
 *
 * It is not very useful for our purposes, as the SCORM API is initialized by the 'scorm-again'
 * package when the SCORM API is loaded, using the values we've already send to the wrapper.
 * This function just logs the current CMI and returns 'true'.
 *
 * SCORM Run-Time API:
 *   LMSInitialize( “” )	bool	Begins a communication session with the LMS.
 *
 * @param {WrapperBridgeMessage} message - The wrapper bridge message
 * @return {Promise<boolean>} - Returns 'true'
 */
const lmsInitializeHandler = async (message: WrapperBridgeMessage): Promise<boolean> => {
	const result = message.value;
	logger.scorm('init', 'cmi', JSON.parse(result || '{}'));

	return true;
};

/**
 * Define the the handler for the 'LMSGetValue' SCORM interaction.
 *
 * 'LMSGetValue' retrieves a value from the LMS.
 *
 * This function will be called when the LMSGetValue SCORM interaction is received.
 *
 * It could be used to check the value of a specific CMI element in the database,
 * but for now it just returns the resulting value. It doesn't make much sense for
 * our purposes, as this is handled by the 'scorm-again' package, which relies on
 * the initial data that is passed to the SCORM API when it is initialized. From
 * there, it keeps track of the values and updates them as needed.
 *
 * SCORM Run-Time API:
 *   LMSGetValue( element: CMIElement )	string	Retrieves a value from the LMS.
 *
 * @param {WrapperBridgeMessage} message - The wrapper bridge message containing the CMI element to get the value of
 * @return {Promise<string>} - The value of the CMI element
 */
const lmsGetValueHandler = async (message: WrapperBridgeMessage): Promise<string | undefined> => {
	const result = message.value;
	logger.scorm('get', message.CMIElement, result);

	return result;
};

/**
 * Define the the handler for the LMSSetValue SCORM interaction.
 *
 * This function will be called when the LMSSetValue SCORM interaction is received.
 *
 * It could be used to set the value of a specific CMI element in the database,
 * but for now it just returns 'true'. I'd suggest to simply use the LMSCommit handler
 * to save the whole current state to the database, instead of setting individual values.
 *
 * SCORM Run-Time API:
 *   LMSSetValue( element: CMIElement, value: string)	string	Saves a value to the LMS.
 *
 * @param {WrapperBridgeMessage} message - The wrapper bridge message containing the CMI element and value to set
 * @return {Promise<boolean>} - 'true' if the value was set successfully
 */
const lmsSetValueHandler = async (message: WrapperBridgeMessage): Promise<boolean> => {
	logger.scorm('set', message.CMIElement, message.value);

	return true;
};

/**
 * Define the the handler for the LMSGetLastError SCORM interaction.
 *
 * This function will be called when the LMSGetLastError SCORM interaction is received.
 * It does nothing but log and return 'UNKNOWN' as the 'scorm-again' package doesn't pass
 * the error code to the event.
 *
 * SCORM Run-Time API:
 *   LMSGetLastError( )	CMIErrorCode	Returns the error code that resulted from the last API call.
 *
 * @param {WrapperBridgeMessage} message - The wrapper bridge message
 * @return {Promise<number | undefined>} - The last error code
 */
const lmsGetLastErrorHandler = async (message: WrapperBridgeMessage): Promise<string | undefined> => {
	if (message.value !== 'UNKNOWN') logger.scorm('last-error', 'code', message.value);

	return message.value;
};

/**
 * Define the the handler for the LMSGetErrorString SCORM interaction.
 *
 * This function will be called when the LMSGetErrorString SCORM interaction is received.
 *
 * It does nothing but log and return 'UNKNOWN' as the 'scorm-again' package doesn't pass
 * the error string to the event.
 *
 * SCORM Run-Time API:
 *   LMSGetErrorString( errorCode: CMIErrorCode )	string	Returns a short string describing the specified error code.
 *
 * @param {WrapperBridgeMessage} message - The wrapper bridge message
 * @return {Promise<string>} - The error string
 */
const lmsGetErrorStringHandler = async (message: WrapperBridgeMessage): Promise<string | undefined> => {
	logger.scorm('error-string', '', message.value);

	return message.value;
};

/**
 * Define the the handler for the LMSGetDiagnostic SCORM interaction.
 *
 * This function will be called when the LMSGetDiagnostic SCORM interaction is received.
 * It does nothing but log and return 'UNKNOWN' as the 'scorm-again' package doesn't pass
 * the diagnostic string to the event.
 *
 * SCORM Run-Time API:
 *   LMSGetDiagnostic( errorCode: CMIErrorCode )	string	Returns detailed information about the last error that occurred.
 *
 * @param {WrapperBridgeMessage} message - The wrapper bridge message
 * @return {Promise<string>} - The error string
 */
const lmsGetDiagnosticHandler = async (message: WrapperBridgeMessage): Promise<string | undefined> => {
	logger.scorm('diagnostic', '', message.value);

	return message.value;
};

/**
 * Define the the handler for the LMSCommit SCORM interaction.
 *
 * This function will be called when the LMSCommit SCORM interaction is received.
 *
 * For our purposes it is the most important function, as this is where I would suggest
 * to save the current state of the CMI to the database.
 * The current state is passed as a JSON string in the 'value' property of the message.
 *
 * SCORM Run-Time API:
 *   LMSCommit( “” )	bool	Indicates to the LMS that all data should be persisted (support is not required from the LMS).
 *
 * @param {WrapperBridgeMessage} message - The wrapper bridge message
 * @return {Promise<object | boolean>} - The current CMI object or 'false' if an error occurred
 */
const lmsCommitHandler = async (message: WrapperBridgeMessage): Promise<object | boolean> => {
	const cmiObject = JSON.parse(message.value || '{}');
	logger.scorm('commit', 'cmi', cmiObject);
	const result = await storeLmsData(cmiObject);

	return result;
};

/**
 * Define the the handler for the LMSFinish SCORM interaction.
 *
 * This function will be called when the LMSFinish SCORM interaction is received.
 *
 * For our purposes it could be used to also save the current state of the CMI to
 * the database or do some cleanup, for analytics, etc.
 * The current state is passed as a JSON string in the 'value' property of the message.
 *
 * SCORM Run-Time API:
 *   LMSFinish( “” )	bool	Ends a communication session with the LMS.
 *
 * @param {WrapperBridgeMessage} message - The wrapper bridge message
 * @return {Promise<object>} - The current CMI object
 */
const lmsFinishHandler = async (message: WrapperBridgeMessage): Promise<object> => {
	const result = JSON.parse(message.value || '{}');
	logger.scorm('finish', 'cmi', result);

	return result;
};

export {
	lmsGetValueHandler,
	lmsSetValueHandler,
	lmsInitializeHandler,
	lmsGetLastErrorHandler,
	lmsGetErrorStringHandler,
	lmsCommitHandler,
	lmsGetDiagnosticHandler,
	lmsFinishHandler,
	fetchLmsData,
	fetchScolmUrl
};
