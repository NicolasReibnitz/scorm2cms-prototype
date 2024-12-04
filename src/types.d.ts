// Define the structure for all modals
interface LoggerSettings {
	siteName: string;
	siteColor: string;
	logLevel: number;
}

interface WrapperBridgeMessage {
	args?: string[];
	CMIElement?: string;
	methodName?: string;
	origin?: string;
	requestId?: string;
	time?: string;
	token?: string;
	type?: string;
	value?: string;
}

interface HandleScormInteraction {
	(methodName: string, ...args: any[]): Promise<unknown>;
}

interface Logger {
	(...messages: any[]): void;
	custom(level: keyof typeof logLevels, ...messages: any[]): void;
	scorm(action: string, ...messages: any[]): void;
	[key: string]: any; // Index signature to allow dynamic properties
}
