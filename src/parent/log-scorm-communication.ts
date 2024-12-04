import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import 'highlight.js/styles/default.css';

hljs.registerLanguage('json', json);

/**
 * Logs SCORM communication (wrapper bridge) messages.
 *
 * @param {'IN' | 'OUT'} messageDirection - The direction of the message (IN or OUT).
 * @param {WrapperBridgeMessage} message - The wrapper bridge message to be logged.
 */
function logScormCommunication(messageDirection: 'IN' | 'OUT', message: WrapperBridgeMessage): void {
	const logDiv = document.getElementById('scorm-log') || makeLogTableElement();
	document.getElementById('btn-clear-log') || makeBtnClearLogElement();

	// Create the container for the table if it doesn't exist
	if (!logDiv.querySelector('.log-container')) {
		const headers = ['Dir', 'Time', 'ID', 'Message Type', 'Function', 'CMI Element', 'Value'];

		const container = document.createElement('div');
		container.className = 'log-container';

		headers.forEach((headerText, index) => {
			const isLastColumn = headers.length - 1 === index;

			const column = document.createElement('div');

			column.className = `column-${index + 1} ${headerText.replace(/ /, '-').toLowerCase()} log-column`;

			const header = document.createElement('div');

			header.className = 'log-header';

			if (isLastColumn) {
				column.classList.add('log-column-last');
				header.classList.add('log-header-last');
			}

			header.appendChild(document.createTextNode(headerText));
			column.appendChild(header);
			container.appendChild(column);
		});

		logDiv.appendChild(container);
		logDiv.style.display = 'block';
	}

	const container = logDiv.querySelector('.log-container') as HTMLElement;
	if (container) container.style.display = 'flex';

	const { type: messageType, methodName, requestId } = message;

	const cellsData = {
		direction: messageDirection.toUpperCase(),
		timestamp: new Date().toLocaleTimeString(),
		requestId: requestId || '',
		messageType:
			messageType === 'error' || messageType === 'status' ? messageType.toUpperCase() : messageType || '',
		function: methodName || '',
		cmiElement: message.args?.[0] || '\u00A0',
		value: message.value || message.args?.[1] || '\u00A0'
	};

	const cellsDataKeys = Object.keys(cellsData) as Array<keyof typeof cellsData>;

	cellsDataKeys.forEach((cellsDataKey, index) => {
		const isLastCell = cellsDataKeys.length - 1 === index;
		const column = container?.querySelector(`.column-${index + 1}`);
		const cell = document.createElement('div');

		cell.className = `log-cell ${messageType?.toLowerCase()} log-cell-${messageDirection?.toLowerCase()}`;

		if (isLastCell) cell.classList.add('log-cell-last');

		// If the cell is the 'Value' cell and the value is a JSON code, create a <pre> element with a <code> element inside to use syntax highlighting.
		if (cellsDataKey === 'value' && cellsData[cellsDataKey].trim() !== '') {
			const code = cellsData[cellsDataKey];

			try {
				JSON.parse(code);
				makePreCodeElement(cellsData[cellsDataKey], cell);
			} catch (error) {
				// The value '\u00A0' is a Unicode escape sequence representing a non-breaking space character.
				cell.appendChild(document.createTextNode(cellsData[cellsDataKey] || '\u00A0'));
			}

			if (messageType !== 'error' && messageType !== 'status') cell.classList.add('log-cell-code');
		} else {
			// The value '\u00A0' is a Unicode escape sequence representing a non-breaking space character.
			cell.appendChild(document.createTextNode(cellsData[cellsDataKey] || '\u00A0'));
		}

		column?.appendChild(cell);
	});

	logDiv.scrollTop = logDiv.scrollHeight;

	/**
	 * Creates a <pre> element with a <code> element inside, containing the JSON code to use syntax highlighting.
	 *
	 * @param {string} code - The JSON code to be displayed.
	 * @param {HTMLElement} container - The container where the <pre> element will be appended to.
	 */
	function makePreCodeElement(code: string, container: HTMLElement) {
		const preElement = document.createElement('pre');
		const codeContainer = document.createElement('code');
		let highlightHTML;
		try {
			JSON.parse(code);
			highlightHTML = hljs.highlight(code, { language: 'json' });
		} catch (error) {
			// console.log('@@@@@ error: ', error);
		}

		if (highlightHTML?.value) {
			codeContainer.innerHTML = highlightHTML.value;
		} else {
			codeContainer.textContent = code;
		}

		preElement.appendChild(codeContainer);
		container.appendChild(preElement);
	}
}

function makeLogTableElement() {
	const logDiv = document.createElement('div');
	logDiv.id = 'scorm-log';
	document.body.appendChild(logDiv);

	return logDiv;
}

function makeBtnClearLogElement() {
	const btnClearLogWrapper = document.createElement('div');
	const btnClearLog = document.createElement('button');
	btnClearLog.id = 'btn-clear-log';
	btnClearLog.textContent = 'clear log';
	btnClearLog.classList.add('btn-standard');
	btnClearLog.classList.add('btn-clear-log');

	btnClearLogWrapper.appendChild(btnClearLog);
	document.body.appendChild(btnClearLogWrapper);

	btnClearLog.addEventListener('click', () => {
		const logDiv = document.querySelectorAll('#scorm-log .log-cell');
		const logContainer = document.querySelector('#scorm-log .log-container') as HTMLElement;
		if (logContainer) logContainer.style.display = 'none';
		logDiv.forEach(cell => cell.remove());
	});

	return btnClearLog;
}

export default logScormCommunication;
