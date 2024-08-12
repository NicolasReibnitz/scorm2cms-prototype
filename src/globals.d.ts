import Scorm12API from 'scorm-again/src/Scorm12API.js';

export {};

declare global {
	interface Window {
		API: Scorm12API;
	}
}
