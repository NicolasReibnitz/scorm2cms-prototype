function useHelpers(siteSettings: SiteSettings) {
	const logLevels = {
		error: 1,
		warn: 2,
		info: 3,
		debug: 4,
		log: 0 // default log level for `console.log`
	};

	const cmiElementTagStyle = ['font-weight:bold', 'font-size:0.8rem', 'color:'];

	const actionTagStyle = [
		'color:white',
		'padding:0 4px 0 2px',
		'border-radius:6px',
		'font-family:system-ui',
		'font-size:0.8rem',
		'font-weight:bold',
		'border-top-left-radius:0',
		'border-bottom-left-radius:0',
		'background:'
	];

	const serverTagStyle = [
		'padding:0 4px',
		`background:${siteSettings.siteColor}`,
		'border-radius:6px',
		'font-family:system-ui',
		'font-size:0.8rem',
		'font-weight:bold'
	];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function getLog(...messages: any[]) {
		return [`%c ${siteSettings.siteName.toUpperCase()} `, getServerTagStyle(), ...messages];
	}

	// Define the logger as a function
	const logger: Logger = (...messages: any[]) => {
		console.log(...getLog(...messages));
	};

	// Add log methods to the logger function
	(Object.keys(logLevels) as (keyof typeof logLevels)[]).forEach(method => {
		logger[method] = (...messages: any[]) => {
			if (siteSettings.logLevel >= logLevels[method]) {
				console[method](...getLog(...messages));
			}
		};
	});

	logger.custom = (level: keyof typeof logLevels, ...messages: any[]) => {
		if (console[level] && siteSettings.logLevel >= logLevels[level]) {
			console[level](...getLog(...messages));
		} else if (siteSettings.logLevel >= logLevels.log) {
			console.log(...getLog(...messages));
		}
	};

	logger.scorm = (action: string, ...messages: any[]) => {
		if (siteSettings.logLevel > 0) {
			const formattedMessage = getLog(...messages);
			formattedMessage[0] = `%c ${siteSettings.siteName.toUpperCase()} %c ${action.toUpperCase()} `;
			formattedMessage[1] = getServerTagStyle(true);
			formattedMessage.splice(2, 0, getScormActionTagStyle(action));
			if (messages[0]) {
				formattedMessage[0] += `%c ${messages[0]}:`;
				formattedMessage.splice(3, 1, getCmiElementTagStyle(action));
			}

			console.log(...formattedMessage);
		}
	};

	function getCmiElementTagStyle(action: string) {
		const style = cmiElementTagStyle.join(';');

		switch (action.toLowerCase()) {
			case 'get':
				return style + 'green';
			case 'set':
				return style + 'firebrick';
			case 'commit':
				return style + '#ff9900;color:black';
			default:
				return style + 'gray';
		}
	}

	function getScormActionTagStyle(action: string) {
		const style = actionTagStyle.join(';');

		switch (action.toLowerCase()) {
			case 'get':
				return style + 'green';
			case 'set':
				return style + 'firebrick';
			case 'commit':
				return style + '#ff9900;color:black';
			default:
				return style + 'gray';
		}
	}

	function getServerTagStyle(isScorm = false) {
		let style = serverTagStyle.join(';');

		if (isScorm) style += ';border-bottom-right-radius:0;border-top-right-radius:0;padding:0 2px 0 4px';
		style += ';color:';

		switch (siteSettings.siteName.toLowerCase()) {
			case 'wrapper':
				return style + 'black';
			case 'parent':
				return style + 'white';
			default:
				return style + 'gray';
		}
	}

	return { logger };
}

export default useHelpers;
