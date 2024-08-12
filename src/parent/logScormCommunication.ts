import hljs from 'highlight.js/lib/core';

const btnClearLog = document.getElementById('btn-clear-log');

btnClearLog?.addEventListener('click', () => {
	const logDiv = document.querySelectorAll('#scorm-log .log-cell');
	const logContainer = document.querySelector('#scorm-log .log-container') as HTMLElement;
	if (logContainer) logContainer.style.display = 'none';
	logDiv.forEach(cell => cell.remove());
});

export function logScormCommunication(logType: string, message: WrapperBridgeMessage): void {
	let logDiv = document.getElementById('scorm-log');

	if (!logDiv) {
		logDiv = document.createElement('div');
		logDiv.id = 'scorm-log';
		document.body.appendChild(logDiv);
	}

	// Create the container for the table if it doesn't exist
	if (!logDiv.querySelector('.log-container')) {
		const headers = [
			'Dir',
			'Time',
			'ID',
			'Message Type',
			'Function',
			'CMI Element',
			'Value'
			//  'Description'
		];

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
		direction: logType.toUpperCase(),
		timestamp: new Date().toLocaleTimeString(),
		requestId: requestId || '',
		messageType:
			messageType === 'error' || messageType === 'status' ? messageType.toUpperCase() : messageType || '',
		function: methodName || '',
		cmiElement: message.args?.[0] || '\u00A0',
		cmiElementValue: message.value || message.args?.[1] || '\u00A0'
	};

	const cellsDataKeys = Object.keys(cellsData) as Array<keyof typeof cellsData>;

	cellsDataKeys.forEach((cellsDataKey, index) => {
		const isLastCell = cellsDataKeys.length - 1 === index;
		const column = container?.querySelector(`.column-${index + 1}`);
		const cell = document.createElement('div');

		cell.className = `log-cell ${messageType?.toLowerCase()} log-cell-${logType?.toLowerCase()}`;

		if (isLastCell) cell.classList.add('log-cell-last');

		if (cellsDataKey === 'cmiElementValue' && cellsData[cellsDataKey].trim() !== '') {
			const code = cellsData[cellsDataKey];

			try {
				JSON.parse(code);
				makePreCodeElement(cellsData[cellsDataKey], cell);
			} catch (error) {
				cell.appendChild(document.createTextNode(cellsData[cellsDataKey] || '\u00A0'));
			}

			if (messageType !== 'error' && messageType !== 'status') cell.classList.add('log-cell-code');
		} else {
			cell.appendChild(document.createTextNode(cellsData[cellsDataKey] || '\u00A0'));
		}

		column?.appendChild(cell);
	});

	logDiv.scrollTop = logDiv.scrollHeight;
}

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

	// console.log('@@@@@ codeElement: ', highlightHTML);

	if (highlightHTML?.value) {
		codeContainer.innerHTML = highlightHTML.value;
	} else {
		codeContainer.textContent = code;
	}

	preElement.appendChild(codeContainer);
	container.appendChild(preElement);
}
