import { Scorm12API } from 'scorm-again';

export {};

declare global {
	interface Window {
		API: Scorm12API;
	}
}
