// Define the structure for all modals
interface SiteSettings {
	siteName: string;
	siteColor: string;
	logLevel: number;
}

interface WrapperBridgeMessage {
	type?: string;
	time?: string;
	methodName?: string;
	requestId?: string;
	token?: string;
	methodName?: string;
	origin?: string;
	args?: string[];
	value?: string;
	CMIElement?: string;
	CMIElementValue?: string;
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
