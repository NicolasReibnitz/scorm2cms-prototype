console.log('INTERACTIVE BUILD ON: Nov 28 2024 9:20:34 PM');
var globalVar = {
	homeSlide: 3, //1=first slide
	devMode: false,
	scormSettings: {
		useScorm: true,
		useLocal: false,
		standard: 'scorm', // if standard is set to "aicc", the AICC API is used in setScormCompletion(), every other value will be ignored.
		bookmarking: {
			useBookmarking: true,
			videoBookmarking: true,
			name: 'curChapter'
		},
		minScore: '0',
		maxScore: '100',
		personalize: {
			studentName: true,
			studentId: true,
			totalTime: true
		}
	},
	clientTemplate: false, // false or 'bms'  -> should alter nav style, swap logos, turns on lockSubmitIfUnattempted and lockClosersDuringFeedbackVO -> check bms.scss for style changes and search 'setClientTemplate()' to find the js that handles it
	video: {
		progressControl: false // Set it to false to globally disable seeking for all videos. Setting the 'videoSeeking' attribute in data.js will overwrite this.
	},
	fontSizeFactor: 45,
	randomizeSlides: {
		useRandomize: false,
		slides: {
			yourKEYvalue: [4, 8, 9] // Slidenumbers 4,5,6,7,8 gets shuffled and return to 9 after going through all of them
		}
	},
	randomizedArray: [], // don't edit
	dndAnswers: {}, // don't edit
	sendData: '', // don't edit
	shuffledSlides: {}, // don't edit
	videoSeen: {},
	fadeNavigation: true, // fades nav controls on videos
	buttonType: 'clean', // classic, clean, or custom
	progressType: 'circle', //options are circle or line
	earnCoins: true,
	lockClosersDuringFeedbackVO: false,
	lockSubmitIfUnattempted: false,
	i6Modal: false
};

var charts = {};
function chartInitiate() {
	var progressID = 'si-progress-meter';
	var $progressMeter = $('#si-progress-meter');
	if (globalVar.progressType === 'line') {
		$('#si-progress').addClass('line');

		var bar = new ProgressBar.Line('#' + progressID, {
			strokeWidth: 8,
			easing: 'easeInOut',
			duration: 1400,
			trailWidth: 6,
			svgStyle: null,
			text: {
				style: {
					transform: null
				},
				autoStyleContainer: false
			},
			step: function (state, bar) {
				return bar.setText(Math.round(bar.value() * 100) + '% ' + $progressMeter.data('name'));
			}
		});
	} else {
		var bar = new ProgressBar.Circle('#' + progressID, {
			strokeWidth: 8,
			easing: 'easeInOut',
			duration: 1400,
			trailWidth: 6,
			svgStyle: null,
			text: {
				style: {
					transform: null
				},
				autoStyleContainer: false
			},
			step: function (state, bar) {
				return bar.setText(Math.round(bar.value() * 100) + '% ' + $progressMeter.data('name'));
			}
		});
	}
	charts[progressID] = bar;
}

////////*Feature:Progress Meter///////////////////////////////////////////////////////////////////////////////////////////////////////////////

function chartProgress() {
	var slideCompletion = saveData.slideCompletion;
	var pathSelected = saveData.pathSelected;
	var pathsCounted = [];
	var increments = 0;
	var answersCorrect = 0;

	for (var key in slideCompletion) {
		for (var slide in slideCompletion[key]) {
			var alreadyCounted = pathsCounted.indexOf(slide) >= 0;
			var shouldBeCounted = key === 'mainPath' || !pathSelected || key === pathSelected;
			if (!alreadyCounted && shouldBeCounted) {
				increments++;
				pathsCounted.push(slide);
				if (slideCompletion[key][slide]) answersCorrect++;
			}
		}
	}

	getPgr(answersCorrect / increments);
}

function getPgr(percentage) {
	var progressID = 'si-progress-meter';
	var $progressMeter = $('#si-progress-meter');

	charts[progressID].animate(percentage);

	//not updating when increments shift
	$progressMeter.attr('data-percent', percentage);
}

if (typeof si === 'undefined' || si === null) {
	var si = {};
}

si.log = [];

si.formatLog = function () {
	if (window.console.table) {
		console.table(si.log);
	} else {
		console.log(si.log);
	}
};

function siLog() {
	var args = [];
	var label = '[]';
	var tag = arguments[0];
	var emoji = '❌';
	var action = '';
	var key = '';
	var value = '';
	var mainMessage = arguments[1];

	args[0] = arguments[0] || '';
	args[1] = arguments[1] || '';
	args[2] = arguments[2] || '';
	args[3] = arguments[3] || '';
	args[4] = arguments[4] || '';

	if (arguments.length < 2) {
		// JUST A SUPER SIMPLE CONSOLE.LOG WITH STACK TRACE
		label = '[🤚SSI]';
		var action = '💡SIMPLE';
		var key = args[0];
		var value = '';
	} else {
		// SOMETHING MORE INVOLVED, HOPEFULLY WITH TAG AND ALL
		// COMING EITHER FROM FRAMEWORK OR PIPWERKS SCORM API WRAPPER
		// console.error.apply(this, arguments);

		if (tag === 'pipwerks') {
			// DEALING WITH PIPWERKS DEBUG MESSAGES THAT WE HIJACKED
			pipwerksParser.apply(this, arguments);
		} else {
			// DEALING WITH OUR OWN MESSAGES, COMING FROM INSIDE THE FRAMEWORK
			interactiveParser.apply(this, arguments);
		}
	}

	// Nasty hack to make sure that the SCORM API object is actually available
	// (which seems to take a few ticks after initialization) to log to console.
	// That's why we have that timeout here.
	if (action.indexOf('API:') > -1) {
		setTimeout(function () {
			console.groupCollapsed(label + action + key, value);
			console.trace('Stack trace:');
			console.groupEnd();
		}, 1);
	} else {
		console.groupCollapsed(label + action + key + ' ' + value);
		console.trace('Stack trace:');
		console.groupEnd();
	}

	// For situations where the console isn't enough, because it might not have been loggging
	// right from the start (looking at you internet explorer!), we also want to have all the
	// log worthy events in a neat array. That way we can look at it (or export it even!)
	// whenever we want!
	var logEntry = {
		label: label,
		action: action,
		key: key,
		value: value
	};

	si.log.push(logEntry);

	function pipwerksParser() {
		tag = 'PIP:SCORM';

		if (typeof arguments[1] === 'string') {
			// traceMsgPrefix = "SCORM.data.get('" + parameter + "') ";
			// traceMsgPrefix = "SCORM.data.set('" + parameter + "') ";
			if (mainMessage.indexOf('SCORM.data') > -1) {
				emoji = '💾';
				if (mainMessage.indexOf('.get') > -1) {
					mainMessage = mainMessage.replace(/SCORM.data.get\(/gi, '');
					action = '⏪ GET';
				} else if (mainMessage.indexOf('.set') > -1) {
					mainMessage = mainMessage.replace(/SCORM.data.set\(/gi, '');
					action = 'SET ⏩';
				}
				mainMessage = mainMessage.replace(/\)/gi, ':');
				key = mainMessage.split('  value: ')[0] || '';
				value = mainMessage.split('  value: ')[1] || '';
			}

			// traceMsgPrefix = 'SCORM.connection.initialize ';
			// traceMsgPrefix = 'SCORM.connection.terminate ';
			if (mainMessage.indexOf('SCORM.connection') > -1 || mainMessage.indexOf('connection.initialize') > -1) {
				emoji = '🔌';
				if (mainMessage.indexOf('.initialize') > -1) {
					mainMessage = mainMessage.replace(/SCORM.connection.initialize /gi, '');
					action = '🤝 INIT';
					if (mainMessage.indexOf('connection.initialize called.') > -1) {
						mainMessage = mainMessage.replace(/connection.initialize called./gi, '');
						key = 'Initializing LMS connection...';
					}
				} else if (mainMessage.indexOf('.terminate') > -1) {
					mainMessage = mainMessage.replace(/SCORM.connection.terminate /gi, '');
					action = '💀 TERM';
				}
				if (mainMessage.indexOf('failed') > -1 || mainMessage.indexOf('aborted') > -1) {
					mainMessage = mainMessage.replace(/failed/gi, '❌ FAILED');
					mainMessage = mainMessage.replace(/aborted/gi, '❌ ABORTED');
				}
			}

			// traceMsgPrefix = 'SCORM.API.find',
			if (mainMessage.indexOf('API') > -1) {
				emoji = '📖';
				if (mainMessage.indexOf('.find') > -1) {
					mainMessage = mainMessage.replace(/SCORM.API.find: /gi, '');
					mainMessage = mainMessage.replace(/. Version: /gi, ': v');
					action = '🔍 FIND';
					value = '(It will be available for inspection in a few ticks.)';
				}
				if (mainMessage.indexOf('API:') > -1) {
					action = '🔗 API';
					setTimeout(function () {
						key = pipwerks.SCORM.API.handle;
					}, 1);
				}
			}
		}

		if (action !== '') {
			action = '(' + action + ') ';
		}
		key = key || mainMessage;
		value = isNaN(parseInt(value, 10)) ? value : parseInt(value, 10);
		label = '[' + emoji + tag + '] ';
	}

	function interactiveParser() {
		tag = 'SSI:' + tag;
		emoji = '🤚';
		action = args[1] || '';
		key = args[2] || '';
		value = args[3] || '';

		if (typeof arguments[1] === 'string') {
			if (args[1] === 'SET') {
				action = '(SET ⏩) ';
			} else if (args[1] === 'GET') {
				action = '(⏪ GET) ';
			} else if (args[1] === 'INIT') {
				action = '(🤝 INIT) ';
			} else if (args[1] === 'COMPLETE') {
				action = '(🏆 COMPLETE) ';
			} else if (args[1] === 'INFO') {
				action = '(💡 INFO) ';
			} else if (args[1] === 'API') {
				action = '(🔗 API) ';
			}

			if (args[2].indexOf('SUCCESS') > -1) {
				key = '✅ ' + args[2];
			}
			if (args[2].indexOf('ERROR') > -1) {
				key = '❌ ' + args[2];
			}

			//   key = mainMessage.split("  value: ")[0];
			//   value = mainMessage.split("  value: ")[1] || "";
		}

		value = isNaN(parseInt(value, 10)) ? value : parseInt(value, 10);
		label = '[' + emoji + tag + '] ';
	}
}
pipwerks.UTILS.trace = function (msg) {
	if (pipwerks.debug.isActive) {
		if (window.console && window.console.log) {
			siLog('pipwerks', msg);
		}
	}
};

// [💾SCORM] ⬅️GET ('cmi.core.student_name')  value: interactive,

// traceMsgPrefix = 'SCORM.data.save failed';
// traceMsgPrefix = 'SCORM.getStatus failed',

// args[0] = '[💡SCORM]';
// args[0] = '[☝️SCORM]';
// args[0] = '[👆SCORM]';
// args[0] = '[🤞SCORM]';

//Some shortcuts for functions
/**
 *
 */
function nextSlide() {
	Reveal.right();
}

/**
 *
 */
function prevSlide() {
	Reveal.left();
}

/**
 *
 */
function downSlide() {
	Reveal.down();
}

/**
 *
 */
function upSlide() {
	Reveal.up();
}

/**
 *
 */
function nextHide() {
	$('#si-next').hide();
}

/**
 *
 */
function nextShow() {
	$('#si-next').show();
}

/**
 *
 */
function backHide() {
	$('#si-back').hide();
}

/**
 *
 */
function backShow() {
	$('#si-back').show();
}

/**
 * @param n
 */
function jumpToSlide(n) {
	Reveal.slide(n - 1);
}

/**
 * @param id
 */
function jumpToId(id) {
	var num = slides[id].slideNumber;
	Reveal.slide(num - 1);
}

/**
 * @param $element
 */
function lock($element) {
	$element.addClass('noEvents');
	$element.attr('disabled', 'disabled');
}

/**
 * @param $element
 */
function unlock($element) {
	$element.removeClass('noEvents');
	$element.removeAttr('disabled');
}

/**
 * @param pathName
 */
function setPath(pathName) {
	if (!checkWholePath(pathName) && lmsConnected) {
		setScormIncomplete();
	}
	return (saveData.pathSelected = pathName);
}

/**
 * @param input
 */
function getCompletionStatus(input) {
	if (Array.isArray(input))
		return input.every(function (slide) {
			return getCompletionStatus(slide);
		});

	var checkSpecificPath = input && input[0] === '@';

	if (checkSpecificPath) return checkWholePath(input.split('@')[1]);

	var slide = !input ? globalVar.slide : { id: input, data: slides[input], $: $('#' + input) };

	if (!slide.data) return console.warn('invalid slide');
	if (!slide.data.include) return; //console.warn('include: false');

	var onCurSlide = slide.id === globalVar.slide.id;
	var slideCompletion = saveData.slideCompletion;
	var pathSelected = saveData.pathSelected;
	var specifiedPath = slide.data.completionPath;
	var pathObj = slideCompletion.mainPath;

	if (specifiedPath) {
		if (Array.isArray(specifiedPath)) {
			if (pathSelected && specifiedPath.indexOf(pathSelected) >= 0) {
				pathObj = slideCompletion[pathSelected];
			} else {
				pathObj = slideCompletion[specifiedPath[0]];
				if (onCurSlide) setPath(specifiedPath[0]);
			}
		} else {
			pathObj = slideCompletion[specifiedPath];
			if (onCurSlide) setPath(specifiedPath);
		}
	}

	return pathObj[slide.id];
}

function checkWholePath(path) {
	var pathObj = saveData.slideCompletion[path];
	for (var key in pathObj) {
		if (!pathObj[key]) return 0;
	}
	return pathObj ? 1 : 0;
}

function completeSlide(input) {
	if (Array.isArray(input))
		return input.forEach(function (slideID) {
			completeSlide(slideID);
		});

	var slide = input ? getSlideHelpers(input) : globalVar.slide;

	if (!slide.data.include) return;

	var specifiedPath = slide.data.completionPath;
	var slideCompletion = saveData.slideCompletion;

	if (specifiedPath) {
		if (Array.isArray(specifiedPath)) {
			specifiedPath.forEach(function (path, idx) {
				slideCompletion[path][slide.id] = 1;
			});
		} else slideCompletion[specifiedPath][slide.id] = 1;
	} else slideCompletion.mainPath[slide.id] = 1;
}

/**
 * @param navElem
 * @param styleClass
 * @param styleClassInput
 * @param html
 */
function customNavStyle(navElem, styleClassInput, html) {
	var isIcon = navElem.indexOf('icon') !== -1;
	var elem = isIcon ? $('.si-helper-icon') : $('#si-' + navElem);
	var uninjectedSVG = elem.find('.inject-me:not(.injected-svg)');
	waitForSVGS(uninjectedSVG, function () {
		var slide = globalVar.slide;
		var initialHTML = elem.html();
		var defaultClass = slide.id + '-' + navElem;
		var styleClass = styleClassInput ? styleClassInput : defaultClass;

		if (html) elem.html(html);

		elem.addClass(styleClass);

		addToFunctionKey(slide.data, 'onExitAction', function () {
			elem.html(initialHTML);
			elem.removeClass(styleClass);
		});
	});
}

function addToFunctionKey(obj, functionKey, functionalityToAdd) {
	obj[functionKey] = (function () {
		var originalKey = obj[functionKey];
		return function () {
			if (originalKey) originalKey.apply(this);
			functionalityToAdd();
		};
	})();
}

/**
 * @param uninjectedSVGs
 * @param uninjectedSVG
 * @param doAfterWaiting
 */
function waitForSVGS(uninjectedSVG, doAfterWaiting) {
	if (uninjectedSVG.length > 0) {
		setTimeout(function () {
			var stillUninjectedSVGs = uninjectedSVG.parent().find('.inject-me:not(.injected-svg)');
			waitForSVGS(stillUninjectedSVGs, doAfterWaiting);
		}, 10);
	} else {
		doAfterWaiting();
	}
}

function slideAction(id, action) {
	var slide = getSlideHelpers(id);

	var hasMaster = typeof masterSlide !== 'undefined';
	var masterAction = hasMaster && masterSlide[action];

	var groups = Array.isArray(slide.data.groups) ? slide.data.groups : [slide.data.groups];
	var hasGroup = groups[0] !== undefined;

	var slideAction = slide.data[action];
	var startingSlide = slide.id;
	var sameSlide;

	masterAction && masterAction(slide);
	hasGroup &&
		groups.forEach(function (group) {
			return group[action] && group[action](slide);
		});
	slideAction && slideAction(slide);

	sameSlide = startingSlide === globalVar.slide.id;

	if (sameSlide) {
		switch (action) {
			case 'nextAction':
				nextSlide();
				break;
			case 'backAction':
				prevSlide();
				break;
		}
	}

	return masterAction || slideAction;
}

function addCoins(num) {
	var slide = globalVar.slide;
	var slideCoinData = saveData.coinScore[slide.id];
	var slideEarned = slideCoinData.earned || 0;
	var multiplier = slide.data.coinSettings.multiplier || 1;

	var curTotal = saveData.coinScore.totalScore || 0;

	if (slideEarned < multiplier) {
		slideCoinData.earned = multiplier;
		saveData.coinScore.totalScore = multiplier + curTotal;
		updateOnScreenTotal(saveData.coinScore.totalScore);
	} else return;
}
function addCoinForAnswer(answerId) {
	var slide = globalVar.slide;

	if (saveData.coinScore[slide.id][answerId]) {
		return;
	}
	var curTotal = saveData.coinScore.totalScore || 0;
	var individualMultipler = slides[slide.id].coinSettings.individualMultiplier || 1;
	saveData.coinScore[slide.id].earned = (saveData.coinScore[slide.id].earned || 0) + individualMultipler;
	saveData.coinScore[slide.id][answerId] = individualMultipler;
	saveData.coinScore.totalScore = curTotal + individualMultipler;
	updateOnScreenTotal(saveData.coinScore.totalScore);
}

function updateOnScreenTotal(total) {
	$('#coin-text').html(total);
}

function filterObj(obj, key, conditionFunc) {
	return Object.keys(obj)
		.filter(function (i) {
			return conditionFunc(obj[i][key]);
		})
		.reduce(rebuildObj(obj), {});
}
function rebuildObj(obj) {
	return function (rebuiltObj, key) {
		rebuiltObj[key] = JSON.parse(JSON.stringify(obj[key]));
		return rebuiltObj;
	};
}
function copyObj(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function checkLockSubmitIfUnattempted(data) {
	var settings = data[data.type];
	var override = settings.lockSubmitIfUnattempted === false;

	return (globalVar.lockSubmitIfUnattempted && !override) || settings.lockSubmitIfUnattempted;
}
function lockButtonNowUnlockOnExit($button, slideObj) {
	var slideObj = slideObj || globalVar.slide.data;

	lock($button);

	if (slideObj.visited) return;

	addToFunctionKey(slideObj, 'onExitAction', function () {
		unlock($button);
	});
}

function getSlideHelpers(id) {
	var id = id;
	return {
		id: id,
		$dom: $('#' + id),
		data: slides[id]
	};
}

const eachSlide = callback => Object.keys(slides).forEach((slideID, idx) => callback(getSlideHelpers(slideID), idx));

const makeTrueArray = falseArray => Array.prototype.slice.call(falseArray);

////////////*Feature:idebehold///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function instaCheatAddon() {
	console.log("Hello, I'm your instaCheat™ addon for today!");
}

//the holy cheatfunction!!!
/**
 *
 */
function devMode() {
	var slide = globalVar.slide;
	// Cheat code. See Doom.

	$('body').addClass('dev-mode');
	console.log('GOD MODE!');
	$('#guidelines').show();

	$(document).keyup(function (e) {
		// 'g' key toggles grid lines
		if (e.which == 71) {
			if ($('#guidelines').css('display') != 'none') {
				$('#guidelines').hide();
			} else {
				$('#guidelines').show();
			}
		}

		// shift + arrow keys allow navigation through horizontal and vertical slides
		if (e.shiftKey && e.which == 37) {
			Reveal.left();
		}
		if (e.shiftKey && e.which == 39) {
			Reveal.right();
		}
		if (e.shiftKey && e.which == 38) {
			Reveal.up();
		}
		if (e.shiftKey && e.which == 40) {
			Reveal.down();
		}

		// 'j' key reveals positive feedback
		if (e.which === 74) {
			simpleModalClose();
			simpleModalOpen('positive');
		}
		//  'k' key reveals negative feedback 1
		if (e.which === 75) {
			simpleModalClose();
			if (slide.data.modal.negative) {
				simpleModalOpen('negative');
			} else if (slide.data.modal.negative1) {
				simpleModalOpen('negative1');
			}
		}
		// 'l' key reveals negative feedback 2
		if (e.which === 76) {
			simpleModalClose();
			simpleModalOpen('negativeFinal');
		}
		// 1 - 9 for hotspots
		if (e.which === 49 && slide.data.modal.hs1) {
			simpleModalClose();
			simpleModalOpen('hs1');
		}
		if (e.which === 50 && slide.data.modal.hs2) {
			simpleModalClose();
			simpleModalOpen('hs2');
		}
		if (e.which === 51 && slide.data.modal.hs3) {
			simpleModalClose();
			simpleModalOpen('hs3');
		}
		if (e.which === 52 && slide.data.modal.hs4) {
			simpleModalClose();
			simpleModalOpen('hs4');
		}
		if (e.which === 53 && slide.data.modal.hs5) {
			simpleModalClose();
			simpleModalOpen('hs5');
		}
		if (e.which === 54 && slide.data.modal.hs6) {
			simpleModalClose();
			simpleModalOpen('hs6');
		}
		if (e.which === 55 && slide.data.modal.hs7) {
			simpleModalClose();
			simpleModalOpen('hs7');
		}
		if (e.which === 56 && slide.data.modal.hs8) {
			simpleModalClose();
			simpleModalOpen('hs8');
		}
		if (e.which === 57 && slide.data.modal.hs9) {
			simpleModalClose();
			simpleModalOpen('hs9');
		}

		//  ';' key hides all feedbacks
		if (e.which == 186) {
			simpleModalClose();
		}
	});
}

/**
 * Displays the input variable prettified and expanded in the console.
 *
 * @param {string} name  Name of the variable to be displayed.
 * @param {any} data The variable to be displayed.
 * @param {number} maxDepth The maximum depth of the object to be displayed (default: 100). Set it to 0 to have everything collapsed.
 * @param {number} depth The current depth of the object to be displayed (default: 0) Ignore. Used internally.
 * @returns {any} The input variable.
 */
 function dump(name, data, maxDepth = 100, depth = 1) {
	if (typeof data === 'undefined') {
		data = name;
		name = 'variable';
	}
	const styleBoldUnderline = 'font-weight: bold; text-decoration: underline;';
	const styleNoUnderline = 'text-decoration: none;';
	const styleFontNormal = 'font-weight: normal;';
	const styleFontBold = 'font-weight: bold;';
	const styleFunction = 'font-weight: normal; font-style: italic; color: teal;';
	const styleString = 'font-weight: normal; font-style: normal; color: #f00;';
	const styleBoolean = 'font-weight: normal; font-style: normal; color: teal;';
	const styleNumber = 'font-weight: normal; font-style: normal; color: teal;';

	let startBracket = '';
	let endBracket = '';

	if (Array.isArray(data) && arrayValuesAreAllNonObjects(data)) {
		const values = [];
		data.forEach(element => {
			values.push(element);
		});
		console.log(`%c${name}%c:`, styleBoldUnderline, styleFontNormal, values);
	} else if (typeof data === 'string') {
		data = `"${data}"`;
		console.log(`%c${name}%c: %c${data}`, styleBoldUnderline, styleFontNormal, styleString);
	} else if (typeof data === 'boolean') {
		console.log(`%c${name}%c: %c${data}`, styleBoldUnderline, styleFontNormal, styleBoolean);
	} else if (typeof data === 'number') {
		console.log(`%c${name}%c: %c${data}`, styleBoldUnderline, styleFontNormal, styleNumber);
	} else if (typeof data === 'function') {
		console.groupCollapsed(`%c${name}%c: %cƒ()`, styleBoldUnderline, styleFontNormal, styleFunction);
		console.log(data);
		console.groupEnd();
	} else if (typeof data === 'object' && Object.keys(data).length === 0) {
		console.log(`%c${name}%c: {}`, styleBoldUnderline, styleNoUnderline);
	} else {
		if (Array.isArray(data)) {
			startBracket = '[';
			endBracket = ']';
		} else {
			startBracket = '{';
			endBracket = '}';
		}
		console.log(`\n%c${name}%c: ${startBracket}`, styleBoldUnderline, styleNoUnderline);
		parseObject(data, maxDepth, depth);
		console.log(`%c${endBracket}\n\n`, styleFontNormal);
	}

	return data;
	function parseObject(data, maxDepth = 100, depth = 0) {
		if (typeof data === 'object' && data !== null) {
			Object.entries(data).forEach(([key, value], index) => {
				const itemLength = Object.keys(data).length;
				if (typeof value === 'object') {
					let startBracket = '';
					let endBracket = '';
					let valueIsEmpty = false;

					if (Array.isArray(value)) {
						startBracket = '[';
						endBracket = ']';
						if (value.length === 0) {
							valueIsEmpty = true;
						} else if (arrayValuesAreAllNonObjects(value)) {
							const values = [];
							value.forEach(element => {
								values.push(element);
							});
							console.log(
								`  %c${key}%c:`,
								styleFontBold,
								styleFontNormal,
								values,
								`${index + 1 === itemLength ? '' : ','}`
							);
							return;
						}
					} else {
						startBracket = '{';
						endBracket = '}';
						if (Object.keys(value).length === 0) {
							valueIsEmpty = true;
						}
					}

					if (valueIsEmpty) {
						console.log(
							`  %c${key}: %c${startBracket}${endBracket}${index + 1 === itemLength ? '' : ','}`,
							styleFontBold,
							styleFontNormal
						);
					} else {
						if (depth > maxDepth) {
							console.groupCollapsed(`  %c${key}: %c${startBracket}`, styleFontBold, styleFontNormal);
						} else {
							console.group(`  %c${key}: %c${startBracket}`, styleFontBold, styleFontNormal);
						}
						parseObject(value, maxDepth, depth + 1);
						console.log(`%c${endBracket}${index + 1 === itemLength ? '' : ','}`, styleFontNormal);
						console.groupEnd();
					}
				} else {
					if (Number.isNaN(parseInt(key))) {
						if (typeof value === 'string') {
							value = `"${value}"`;
							console.log(
								`  %c${key}: %c${value}${index + 1 === itemLength ? '' : ','}`,
								styleFontBold,
								styleString
							);
						} else if (typeof value === 'boolean') {
							console.log(
								`  %c${key}: %c${value}${index + 1 === itemLength ? '' : ','}`,
								styleFontBold,
								styleBoolean
							);
						} else if (typeof value === 'number') {
							console.log(
								`  %c${key}: %c${value}${index + 1 === itemLength ? '' : ','}`,
								styleFontBold,
								styleNumber
							);
						} else if (typeof value === 'function') {
							console.groupCollapsed(
								`  %c${key}: %cƒ()%c${index + 1 === itemLength ? '' : ','}`,
								styleFontBold,
								styleFunction,
								styleFontNormal
							);
							console.log(`%c${value}`, styleFontNormal);
							console.groupEnd();
						} else {
							console.log(
								`  %c${key} (${typeof value}): %c${value}${index + 1 === itemLength ? '' : ','}`,
								styleFontBold,
								styleFontNormal
							);
						}
					} else {
						console.log(`  %c${value}${index + 1 === itemLength ? '' : ','}`, styleFontNormal);
					}
				}
			});
		} else {
			console.log(data);
		}
	}
	function arrayValuesAreAllNonObjects(array) {
		return array.every(value => typeof value !== 'object');
	}
}

/**
 * A simple prettified console output.
 *
 * @param {any} data The variable to be displayed.
 * @returns {any} The input variable.
 */
function pretty(data) {
	console.log(JSON.stringify(data, null, 2));
	return data;
}

/**
 * A simple console output of values, sans the proxy part.
 *
 * @param  {...any} values One or more values to be displayed.
 * @returns {any} The input variable.
 */
function unproxify(...values) {
	const output = [];
	values.forEach(value => {
		output.push(JSON.parse(JSON.stringify(value)));
	});
	console.log(...output);
	return values;
}

window.console.var = window.console.dump = dump;
window.console.pretty = pretty;
window.console.unproxify = window.dp = unproxify;

// do not use the id 'test' for a slide
$(document).ready(function () {
	var videoSlide = {
		type: 'video',
		navElements: ['video-home'],
		nextAction: function () {
			completeSlide();
			nextSlide();
		},
		videoLoaded: false //don't edit
	};

	slides = {
		start: {
			type: 'text',
			navElements: ['start-slide', 'logo'],
			backAction: function (slide) {}, //leave Start backAction as function to prevent IE9 errors
			onEnterAction: function (slide) {},
			audio: {
				onEnter: 'media/audio/vo/start.mp3'
			},
			include: false // this key determines if the slide will be used as part of the completion of the progress meter. default is true.  do not call completeSlide() on any slide where this is set to false
		},
		v1: {
			groups: videoSlide,
			navElements: ['!home'] //exclude home or menu button on intro videos that come before main menu
		},
		menu: {
			type: 'menu',
			menu: {
				linear: true,
				menuClass: 'si-menu__js',
				navigation: ['v2', 'v4', 'i4', 'v5', 'i6'],
				completionIDs: ['i2', 'i3', 'i4b', 'v6', 'i6']
			},
			include: false
		},
		v2: {
			groups: videoSlide,
			backAction: function () {
				jumpToId('menu');
			},
			navElements: ['!home'] //exclude home or menu button on intro videos that come before main menu
		},
		i1: {
			type: 'hotspot',
			navElements: ['standard-home', 'submit', 'reset'],
			nextAction: function (slide) {
				completeSlide();
				nextSlide();
			},
			onEnterAction: function (slide) {
				$('#car').attr('class', 'pos0');
			},
			hotspot: {
				userAttempts: 2,
				quiz: {
					type: 'mcq',
					answers: [4, 5, 6, 7, 8, 9]
				},
				onClick: function (hotspot, modal) {
					var id = $(hotspot).attr('id').charAt(1);

					var pos = 'pos' + id;
					console.log(pos);
					$('#car').attr('class', pos);
				}
			},
			audio: {
				onEnter: 'media/audio/vo/i1.mp3',
				positive: 'media/audio/vo/i1P.mp3',
				negative: 'media/audio/vo/i1N.mp3',
				negativeFinal: 'media/audio/vo/i1NN.mp3'
			},
			modal: {
				// noFeedback: true, //defaults to false, set to true if you do not want feedbacks
				positive: 'i1-positive',
				negative: 'i1-negative',
				negativeFinal: 'i1-negative-final'
			}
		},
		v3: {
			groups: videoSlide,
			navElements: ['!home'] //exclude home or menu button on intro videos that come before main menu
		},
		i2: {
			navElements: ['standard-home', 'submit', 'reset'],
			nextAction: function (slide) {
				completeSlide();
				jumpToId('menu');
			},
			type: 'quiz',

			quiz: {
				userAttempts: 2,
				radio: false,
				answers: {
					'i2-correct': 1,
					'i2-correct2': 1
				}
			},
			audio: {
				onEnter: 'media/audio/vo/i2.mp3',
				positive: 'media/audio/vo/i2P.mp3',
				negative: 'media/audio/vo/i2N.mp3',
				negativeFinal: 'media/audio/vo/i2NN.mp3'
			},
			modal: {
				// noFeedback: true, //defaults to false, set to true if you do not want feedbacks
				positive: 'i2-positive',
				negative: 'i2-negative',
				negativeFinal: 'i2-negative-final'
			}
		},
		v4: {
			groups: videoSlide,
			backAction: function () {
				jumpToId('menu');
			},
			navElements: ['!home'] //exclude home or menu button on intro videos that come before main menu
		},
		i3: {
			navElements: ['standard-home'],
			nextAction: function (slide) {
				completeSlide();
				jumpToId('menu');
			},
			type: 'dnd',
			dnd: {
				type: 'dnd_2', //other options are 'dnd_2' or 'line'
				userAttempts: 2,
				droppableData: {
					'i3-drop1': {
						dropCounter: 5,
						answers: ['']
					}
				},
				droppableGroups: {
					'#i3-drop1': {
						events: {
							drop: function (event, ui) {
								if (
									globalVar.slide.data.dnd.droppableData['i3-drop1'].containedDraggables.length == 4
								) {
									handleAnswer(true);
								}
							}
						}
					}
				}
			},
			audio: {
				onEnter: 'media/audio/vo/i3.mp3',
				positive: 'media/audio/vo/i3P.mp3'
			},
			modal: {
				// noFeedback: true, //defaults to false, set to true if you do not want feedbacks
				positive: 'i3-positive'
			}
		},
		i4: {
			type: 'hotspot',
			navElements: ['standard-home'],
			nextAction: function (slide) {
				completeSlide();
				nextSlide();
			},
			backAction: function (slide) {
				completeSlide();
				jumpToId('menu');
			},
			onEnterAction: function (slide) {
				$('.txt').hide();
			},
			hotspot: {
				useModals: false,
				onWin: function () {
					$('#si-next').addClass('shadow-pulse');
					nextShow();
				},
				onClick: function (hotspot, modal) {
					var id = $(hotspot).attr('id').charAt(1);
					var txt = 'txt' + id;
					$('.' + txt).fadeIn();
				}
			},
			audio: {
				onEnter: 'media/audio/vo/i4.mp3'
			},
			modal: {
				// noFeedback: true, //defaults to false, set to true if you do not want feedbacks
				positive: 'i1-positive',
				negative: 'i1-negative',
				negativeFinal: 'i1-negative-final'
			}
		},
		i4b: {
			type: 'hotspot',
			navElements: ['standard-home'],
			nextAction: function (slide) {
				completeSlide();
				jumpToId('menu');
			},
			onEnterAction: function (slide) {
				$('#i4b .txt').hide();
			},
			hotspot: {
				useModals: false,
				onWin: function () {
					$('#si-next').addClass('shadow-pulse');
					nextShow();
				},
				onClick: function (hotspot, modal) {
					var id = $(hotspot).attr('id').charAt(1);
					var txt = 'txt' + id;
					$('.' + txt).fadeIn();
				}
			},
			audio: {
				onEnter: 'media/audio/vo/nothing.mp3',
				positive: 'media/audio/vo/nothing.mp3',
				negative: 'media/audio/vo/nothing.mp3',
				negativeFinal: 'media/audio/vo/nothing.mp3'
			},
			modal: {
				// noFeedback: true, //defaults to false, set to true if you do not want feedbacks
				positive: 'i1-positive',
				negative: 'i1-negative',
				negativeFinal: 'i1-negative-final'
			}
		},
		v5: {
			groups: videoSlide,
			backAction: function () {
				jumpToId('menu');
			},
			navElements: ['!home'] //exclude home or menu button on intro videos that come before main menu
		},
		i5: {
			type: 'hotspot',
			navElements: ['standard-home'],
			nextAction: function (slide) {
				completeSlide();
				nextSlide();
			},
			onEnterAction: function (slide) {
				$('.girl').removeClass('p2 p3 p4');
				$('.hotspot-button').show();
			},
			hotspot: {
				linear: true,
				onWin: function () {
					handleAnswer(true);
				},
				items: {
					1: {
						onModalClose: function (hotspot, modal) {
							$(hotspot).hide();
							$('.girl').addClass('p2');
						}
					},
					2: {
						onModalClose: function (hotspot, modal) {
							$(hotspot).hide();
							$('.girl').addClass('p3');
						}
					},
					3: {
						onModalClose: function (hotspot, modal) {
							$(hotspot).hide();
							$('.girl').addClass('p4');
						}
					}
				}
			},
			audio: {
				onEnter: 'media/audio/vo/i5.mp3',
				positive: 'media/audio/vo/i5P.mp3'
			},
			modal: {
				// noFeedback: true, //defaults to false, set to true if you do not want feedbacks
				positive: 'i5-positive',
				hs1: 'i5-hs1',
				hs2: 'i5-hs2',
				hs3: 'i5-hs3'
			}
		},
		v6: {
			type: 'video',
			navElements: ['video-home'],
			nextAction: function (slide) {
				completeSlide();
				jumpToId('menu');
			},
			videoLoaded: false //don't edit //exclude home or menu button on intro videos that come before main menu
		},
		i6: {
			navElements: ['standard-home', 'submit', 'reset'],
			backAction: function () {
				jumpToId('menu');
			},
			nextAction: function (slide) {
				completeSlide();
				nextSlide();
			},

			type: 'dnd',
			dnd: {
				type: 'dnd_1', //other options are 'dnd_2' or 'line'
				userAttempts: 2,
				droppableData: {
					'i6-drop1': {
						dropCounter: 1,
						answers: {
							0: ['i6-drag2'],
							1: ['i6-drag3']
						}
					},
					'i6-drop2': {
						dropCounter: 1,
						answers: {
							0: ['i6-drag2'],
							1: ['i6-drag3']
						}
					},
					'i6-drop3': {
						dropCounter: 1,
						answers: {
							0: ['i6-drag1'],
							1: ['i6-drag4']
						}
					},
					'i6-drop4': {
						dropCounter: 1,
						answers: {
							0: ['i6-drag1'],
							1: ['i6-drag4']
						}
					}
				}
			},
			audio: {
				onEnter: 'media/audio/vo/i6.mp3',
				positive: 'media/audio/vo/i6P.mp3',
				negative: 'media/audio/vo/i6N.mp3',
				negativeFinal: 'media/audio/vo/i6NN.mp3',
				end: 'media/audio/vo/i6.1.mp3'
			},
			modal: {
				// noFeedback: true, //defaults to false, set to true if you do not want feedbacks
				positive: 'i6-positive',
				negative: 'i6-negative',
				negativeFinal: 'i6-negative-final',
				end: 'i6-end'
			}
		},
		q1: {
			navElements: ['standard-home', 'submit'],
			nextAction: function (slide) {
				completeSlide();
				nextSlide();
			},
			type: 'quiz',
			quiz: {
				userAttempts: 2,
				radio: true,
				answers: {
					'q1-correct': 1
				}
			},
			audio: {
				onEnter: 'media/audio/vo/Q1.mp3',
				positive: 'media/audio/vo/Q1P.mp3',
				negative: 'media/audio/vo/Q1N.mp3',
				negativeFinal: 'media/audio/vo/Q1NN.mp3'
			},
			modal: {
				// noFeedback: true, //defaults to false, set to true if you do not want feedbacks
				positive: 'q1-positive',
				negative: 'q1-negative',
				negativeFinal: 'q1-negative-final'
			}
		},
		q2: {
			navElements: ['standard-home', 'submit', 'reset'],
			nextAction: function (slide) {
				completeSlide();
				nextSlide();
			},
			type: 'quiz',
			quiz: {
				userAttempts: 2,
				radio: false,
				answers: {
					'q2-correct': 1,
					'q2-correct2': 1,
					'q2-correct3': 1
				}
			},
			audio: {
				onEnter: 'media/audio/vo/Q2.mp3',
				positive: 'media/audio/vo/Q2P.mp3',
				negative: 'media/audio/vo/Q2N.mp3',
				negativeFinal: 'media/audio/vo/Q2NN.mp3'
			},
			modal: {
				// noFeedback: true, //defaults to false, set to true if you do not want feedbacks
				positive: 'q2-positive',
				negative: 'q2-negative',
				negativeFinal: 'q2-negative-final'
			}
		},
		q3: {
			navElements: ['standard-home', 'submit'],
			nextAction: function (slide) {
				completeSlide();
				jumpToId('end');
			},
			type: 'quiz',
			quiz: {
				userAttempts: 2,
				radio: true,
				answers: {
					'q3-correct': 1
				}
			},
			audio: {
				onEnter: 'media/audio/vo/Q3.mp3',
				positive: 'media/audio/vo/Q3P.mp3',
				negative: 'media/audio/vo/Q3N.mp3',
				negativeFinal: 'media/audio/vo/Q3NN.mp3'
			},
			modal: {
				// noFeedback: true, //defaults to false, set to true if you do not want feedbacks
				positive: 'q3-positive',
				negative: 'q3-negative',
				negativeFinal: 'q3-negative-final'
			}
		},
		end: {
			type: 'text',
			navElements: ['exit-slide', 'home', 'logo'],
			backAction: prevSlide,
			nextAction: function (slide) {},
			onEnterAction: function (slide) {
				// Do not check for "lmsConnected", because that's done in setScormCompletion() anyways and AICC wouldn't work anymore.
				setScormCompletion();
			},
			audio: {
				onEnter: 'media/audio/vo/end.mp3'
			},
			include: false
		}
	};
});

//  slideID:{
// 	type: 'text', // types include text,video,quiz,dnd,sort,hotspot
// 	navElements:['standard-home'], //any id from nav-container minus "si-",'drag-right-icon','drag-left-icon','drag-up-icon','drag-down-icon','click-icon', put a '!' before any id to exclude e.g. '!home' will exclude home button from standard-home group
// }

function carouselInit(
	{ id, data, $dom } = globalVar.slide,
	state = (data.carousel = data.carousel || {}),
	$carouselItems = $dom.find('.carousel-item__js'),
	$leftArrow = $dom.find('.carousel-arrow-left__js'),
	$rightArrow = $dom.find('.carousel-arrow-right__js'),
	$shortcuts = $dom.find('.carousel-shortcut__js')
) {
	var validShortcuts = $shortcuts && $shortcuts.length > 0;

	state.activePos = state.activePos || 0;

	$leftArrow.on('click.carousel-arrow-left', () => {
		carouselMove('left', { id, data, $dom }, state, $carouselItems, $shortcuts);
	});
	$rightArrow.on('click.carousel-arrow-right', () => {
		carouselMove('right', { id, data, $dom }, state, $carouselItems, $shortcuts);
	});

	if (!validShortcuts) return;

	$($shortcuts[0]).addClass('active');

	$shortcuts.each(function (idx, shortcut) {
		shortcut.addEventListener('click', () => {
			carouselMove(idx, { id, data, $dom }, state, $carouselItems, $shortcuts);
		});
	});
}

function carouselMove(
	direction,
	{ data, $dom } = globalVar.slide,
	state = data.carousel,
	$carouselItems = $dom.find('.carousel-item__js'),
	$shortcuts = $dom.find('.carousel-shortcut__js')
) {
	var validShortcuts = $shortcuts && $shortcuts.length > 0;

	if (validShortcuts) $($shortcuts[state.activePos]).removeClass('active');

	state.activePos = carouselParseDirection(direction, $carouselItems.length, state.activePos);

	if (validShortcuts) $($shortcuts[state.activePos]).addClass('active');

	carouselRenderMove($carouselItems, state.activePos);
}

function carouselParseDirection(direction, carouselLength, activePos) {
	var stringInput = typeof direction === 'string';
	var newPos;
	var beginningOfList = activePos === 0;
	var endOfList = activePos === carouselLength - 1;

	if (!stringInput) return direction;
	else if (direction === 'left' && !beginningOfList) newPos = activePos - 1;
	else if (direction === 'left') newPos = carouselLength - 1;
	else if (!endOfList) newPos = activePos + 1;
	else newPos = 0;

	return newPos;
}

function carouselRenderMove($carouselItems, pos) {
	$carouselItems[pos].style.left = '0%';
	$carouselItems.each((idx, item) => {
		var posDif = idx - pos;
		var newPercentage = '' + posDif + '00' + '%';
		item.style.left = newPercentage;
	});
}

function carousel3DInit(
	{ id, data, $dom } = globalVar.slide,
	state = (data.carousel3D = data.carousel3D || {}),
	$carouselItems = $dom.find('.carousel-3d-item__js'),
	$leftArrow = $dom.find('.carousel-3d-left__js'),
	$rightArrow = $dom.find('.carousel-3d-right__js')
) {
	state.activePos = 0;

	cssSetup($carouselItems);

	//Makes only the front button clickable
	lock($carouselItems);
	unlock($($carouselItems[0]));

	$leftArrow.on('click.threedcarousel', function () {
		carousel3DMove('left', { id, data, $dom }, state, $carouselItems);
	});
	$rightArrow.on('click.threedcarousel', function () {
		carousel3DMove('right', { id, data, $dom }, state, $carouselItems);
	});
}

function cssSetup($carouselItems) {
	var numberOfItems = $carouselItems.length;

	//assign first positions
	$carouselItems.each(function (idx, item) {
		var itemNum = idx + 1;

		item.dataset.pos = idx;

		$(item).addClass('carousel-3d-item');
		$(item).addClass('carousel-3d-item-' + itemNum);
		$(item).addClass(`item${itemNum}of${numberOfItems}`);
	});
}

function carousel3DMove(
	direction,
	{ data, $dom } = globalVar.slide,
	state = data.carousel3D,
	$carouselItems = $dom.find('.carousel-3d-item__js')
) {
	var numberOfItems = $carouselItems.length;
	var turn = carousel3DParseDirection(direction, numberOfItems, $carouselItems);

	if (!turn) return;
	else if (turn === 1 || turn === numberOfItems - 1)
		carousel3DRenderMove(turn, $carouselItems, state, numberOfItems, data);
	else {
		var direction = turn < numberOfItems / 2 ? 'left' : 'right';
		var turns = direction === 'right' ? numberOfItems - turn : turn;

		carousel3DScroll(turns, $carouselItems, state, numberOfItems, direction, data);
	}
}

function carousel3DParseDirection(direction, numberOfItems, $carouselItems) {
	if (typeof direction === 'string')
		switch (direction) {
			case 'right':
				return numberOfItems - 1;
			case 'left':
				return 1;
			default:
				var item = $(`#${direction}`)[0];
				if (item) return (numberOfItems - item.dataset.pos) % numberOfItems;
		}
	else if (!isNaN(direction)) return (numberOfItems - $carouselItems[direction].dataset.pos) % numberOfItems;
}

function carousel3DRenderMove(turns, $carouselItems, state, numberOfItems, data) {
	const pos = state.activePos;
	const isLinearMenu = data.type === 'menu' && data.menu.linear;

	$carouselItems.each((idx, item) => {
		var currentItemNum = ((idx + pos) % numberOfItems) + 1;
		var nextItemNum = ((idx + turns + pos) % numberOfItems) + 1;

		item.dataset.pos = nextItemNum - 1; // -1 for 0 index

		$(item).removeClass(`item${currentItemNum}of${numberOfItems}`);
		$(item).addClass(`item${nextItemNum}of${numberOfItems}`);

		//Makes only the new front button clickable
		if (nextItemNum !== 1) return;

		lock($carouselItems);
		lock($(this));

		if (!isLinearMenu || $(item).hasClass('unlocked')) unlock($(item));
	});

	state.activePos = (pos + turns) % numberOfItems;
}

function carousel3DScroll(turn, $carouselItems, state, numberOfItems, direction, data) {
	setTimeout(() => {
		carousel3DRenderMove(direction === 'right' ? numberOfItems - 1 : 1, $carouselItems, state, numberOfItems, data);

		if (turn - 1) carousel3DScroll(turn - 1, $carouselItems, state, numberOfItems, direction);
	}, 100);
}

function carousel3DAutoFocus(
	{ data, $dom } = globalVar.slide,
	state = data.carousel3D,
	$carouselItems = $dom.find('.carousel-3d-item__js'),
	completionIDs = data.menu.completionIDs
) {
	var nextIncompleteIdx = completionIDs.reduce(
		(result, slideID, idx) => (result === undefined && !getCompletionStatus(slideID) ? idx : result),
		undefined
	);

	carousel3DMove(nextIncompleteIdx, { data, $dom }, state, $carouselItems);
}

var siAudio = {};

function initAudio() {
	siAudio['sfx'] = {};
	siAudio['sfx']['click'] = new Howl({
		src: ['media/audio/sounds/mouse_click.mp3'],
		volume: 0.8
	});
	siAudio['sfx'].wrong = new Howl({
		src: ['media/audio/sounds/negative.mp3'],
		volume: 0.5
	});
	siAudio['sfx'].right = new Howl({
		src: ['media/audio/sounds/positive.mp3'],
		volume: 0.5
	});
	siAudio['sfx'].nothing = new Howl({
		src: ['media/audio/sounds/nothing.mp3']
	});

	for (key in slides) {
		siAudio[key] = {};
		if (slides[key]['audio']) {
			var audio = slides[key]['audio'];
			for (track in audio) {
				siAudio[key][track] = new Howl({
					src: audio[track],
					onplay: onplayClosure(track),
					onend: onendClosure(track, key)
				});
			}
		} else {
			slides[key]['audio'] = {};
		}
	}
}

function onplayClosure(track) {
	return function () {
		if (!globalVar.lockClosersDuringFeedbackVO) return;

		if (track === 'onEnter') return;
		var $closers = $('.si-modal-container__js, .si-modal-closer__js');

		lock($closers);
	};
}
function onendClosure(track, key) {
	return function () {
		if (!globalVar.lockClosersDuringFeedbackVO) return;

		if (track === 'onEnter') return;

		var $closers = $('.si-modal-container__js, .si-modal-closer__js');

		unlock($closers);
	};
}

function videoCheck() {
	var slide = globalVar.slide;

	if (slide.data.type == 'video') {
		var video = slide.$dom.find('video')[0];
		var videoID = slide.$dom.find('video')[0].id;

		if (slide.data.videoLoaded == false) videoInit(slide, videoID);
		else videoRestart(videoID);
	} else {
		if ($('section').find('video').length > 0) {
			$('section').find('video')[0].pause();
		}
	}

	if (slide.data.transcript) $('#si-transcript').attr('href', slide.data.transcript);
}

function videoInit(slide, videoID) {
	videojs(videoID, {
		language: 'en',
		autoplay: true,
		controlBar: {
			volumePanel: {
				inline: true
			}
		},
		html5: {
			// https://docs.videojs.com/docs/guides/text-tracks.html#emulated-text-tracks
			// prevents iPhone and safari from using their own subtitle system
			nativeTextTracks: false
		},
		plugins: {
			// https://github.com/kmoskwiak/videojs-resolution-switcher#plugin-options
			videoJsResolutionSwitcher: {
				default: 'high',
				dynamicLabel: true
			},
			// https://github.com/ctd1500/videojs-hotkeys#options
			hotkeys: {
				enableNumbers: false,
				enableModifiersForNumbers: false,
				alwaysCaptureHotkeys: true
			},
			seekButtons: {
				back: 10
			}
		}
	}).ready(function () {
		// disable progress control (seeking) if globalVar or data.js is configured that way.
		// videoSeeking (data.js) is overruling progressControl (globalVar).
		// if devMode is on, seeking is always enabled.

		if (!globalVar.devMode) {
			if (!slide.data.videoSeeking) {
				if (slide.data.videoSeeking === false || globalVar.video.progressControl === false) {
					videojs(videoID).controlBar.progressControl.disable();
				}
			}
		}

		if (videojs(videoID).textTracks().tracks_.length > 0) {
			// subtitle/captions style is set up here (defaults in comments)
			// NOTE: use #XXX hex style for colors! #xxx or #xxxxxx will not work!
			var subtitleSettings = {
				backgroundOpacity: '0.5', //				"1"
				edgeStyle: 'dropshadow', //					not set (none, null, 0, '' doesn't work, only not setting it at all will set it to 'none')
				color: '#FFF', //							"#FFF"
				backgroundColor: '#000', //					"#000"
				textOpacity: '1', //						"1"
				windowOpacity: '0', //						"0"
				fontFamily: 'proportionalSansSerif', //		"proportionalSansSerif"
				windowColor: '#FFF' //						"#000"
				//fontPercent: 1 //							not set (1, 1.0, 1.00, etc doesn't work, only not setting it at all will set it to 100%)
			};
			videojs(videoID).textTrackSettings.setValues(subtitleSettings);
			videojs(videoID).textTrackSettings.updateDisplay();

			// this would show the first subtitle track
			// videojs(videoID).textTracks_[0].mode = "showing"

			// prints out a nice table of the current subtitle style settings
			// console.table(videojs(videoID).textTrackSettings.getValues());
		}

		slide.data.videoLoaded = true;

		videojs(videoID).play();

		// Old way of disabling seeking.
		// Obsolete because it's not reliable in IE. New native method is.
		/* if (slide.data.videoSeeking == false) {
		var supposedCurrentTime = 0;
		video.addEventListener('timeupdate', function() {
			if (!video.seeking) {
				supposedCurrentTime = video.currentTime;
			}
		});
		//allows backwards movement of trackbar but can't move trackbar forward
		video.addEventListener('seeking', function() {
			if (video.currentTime > supposedCurrentTime) {
				video.currentTime = supposedCurrentTime;
			}
		});
	} */
	});
	videojs(videoID).on('ended', function () {
		globalVar.videoSeen[slide.id] = true;
		if (slide.data.coinSettings.include === true) {
			addCoins();
		}
		slideAction(slide.id, 'nextAction');
	});
	if (globalVar.fadeNavigation) {
		videojs(videoID).on('useractive', function () {
			$('#si-nav-container').removeClass('vjs-fade-out');
		});

		videojs(videoID).on('userinactive', function () {
			if (!videojs(videoID).paused()) {
				$('#si-nav-container').addClass('vjs-fade-out');
			}
		});
	}
}

function videoRestart(videoID) {
	videojs(videoID).currentTime(0);
	videojs(videoID).play();
}

var unlockerSound = new Howl({
	src: ['media/audio/sounds/nothing.mp3']
});
unlockerSound.on('unlock', function () {
	// console.log('HOWLER: Audio unlocked.');
	hidePreloader();
	unlockerSound.play();
});
unlockerSound.on('play', function () {
	// console.log('HOWLER: Audio playing.');
	hidePreloader();
});
unlockerSound.play();

function initPreloader() {
	function onLoaded() {
		$('#preloader_text_1').fadeOut('slow', function () {
			$('#preloader_text_2').fadeIn('slow');
		});
		$('#Preloader').on('click touch', function (e) {
			e.preventDefault();
			siAudio.sfx.click.play();
			hidePreloader();
		});
	}

	if (document.readyState === 'complete' || document.readyState === 'loaded') {
		// document is already ready to go
		onLoaded();
	} else {
		// SETUP THE PRELOADER
		window.onload = function () {
			onLoaded();
		};
	}
	// $('section.present').hide();
}

function hidePreloader() {
	$('#Preloader').fadeOut('slow', function () {
		$('section.present').fadeIn('slow', function () {
			var slide = globalVar.slide;
			if (slide.data !== undefined && slide.data.type == 'video') {
				var video = globalVar.$curSlide.find('video')[0];
				if ((lmsConnected || globalVar.scormSettings.useLocal) && saveData.currentVideoTime > 0) {
					videojs(video.playerId).currentTime(saveData.currentVideoTime);
				} else {
					videojs(video.playerId).currentTime(0);
				}
				videojs(video.playerId).play();
			}
		});
	});
}

// initPreloader()

////////////*Feature:Positive Feedback Function///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 *
 */
function initFeedbacks() {
	var modalContainer = $('.si-modal-container__js');
	var modals = $('.si-modal__js');
	var modalClosers = $('.si-modal-closer__js');

	modals.on('click.prevent', function (e) {
		var isHotspotModal = globalVar.currentModalType === 'hotspot';
		var hotspot = slides[globalVar.slide.id].hotspot;
		var clickAnywhereHotspot = hotspot && hotspot.modals && hotspot.modals.clickAnywhere;

		if (e.target.tagName !== 'A') e.preventDefault();

		if (!(isHotspotModal && clickAnywhereHotspot)) e.stopPropagation();
	});
	modalContainer.on('click.close', function () {
		modalClosingActions();
	});
	modalClosers.each(function (idx, closer) {
		$(closer).on('click.close', function (e) {
			e.stopPropagation();
			modalClosingActions();
		});
	});
}

/**
 *
 */
function answerCorrect() {
	var slide = globalVar.slide;
	var currentModal = slide.data.modal.positive;
	var modalContainer = $('.si-modal-container__js');
	$('.leader-line').addClass('hide');
	modalContainer.addClass('si-modal-container-open');
	$('#' + currentModal).addClass('si-current-modal');
	globalVar.currentModal = currentModal;
	globalVar.currentModalType = 'positive';
	var type = slide.data.type;
	slide.data[type].trys = 0;
	if (siAudio[slide.id].positive) {
		siAudio.sfx.right.once('end', function () {
			siAudio[slide.id].positive.play();
		});
		siAudio.sfx.right.play();
	} else {
		siAudio.sfx.right.play();
	}

	slideAction(slide.id, 'onSuccessAction');
}

////////////*Feature:Negative Feedback Functions///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 *
 */
function answerIncorrect() {
	var slide = globalVar.slide;

	var type = slide.data.type;
	var trys = slide.data[type].trys;
	var attempts = slide.data[type].userAttempts;
	var modalContainer = $('.si-modal-container__js');
	if (attempts === 0) {
		trys = 0;
	} else {
		trys++;
	}
	slide.data[type].trys = trys;

	if (trys < attempts || attempts === 0) {
		var currentModal;
		if (slide.data.modal['negative' + trys]) {
			currentModal = slide.data.modal['negative' + trys];
			globalVar.currentModal = currentModal;
			globalVar.currentModalType = 'negative' + trys;
		} else if (slide.data.modal.negative) {
			currentModal = slide.data.modal.negative;
			globalVar.currentModal = currentModal;
			globalVar.currentModalType = 'negative';
		}
		$('.leader-line').addClass('hide');
		modalContainer.addClass('si-modal-container-open');
		$('#' + currentModal).addClass('si-current-modal');
		if (siAudio[slide.id]['negative' + trys]) {
			siAudio.sfx.wrong.once('end', function () {
				siAudio[slide.id]['negative' + trys].play();
			});
			siAudio.sfx.wrong.play();
		} else if (siAudio[slide.id].negative) {
			siAudio.sfx.wrong.once('end', function () {
				siAudio[slide.id].negative.play();
			});
			siAudio.sfx.wrong.play();
		} else {
			siAudio.sfx.wrong.play();
		}

		slideAction(slide.id, 'onFailureAction1');
	} else if (attempts !== 0 && trys === attempts) {
		currentModal = slide.data.modal.negativeFinal;
		globalVar.currentModal = currentModal;
		globalVar.currentModalType = 'negativeFinal';
		$('.leader-line').addClass('hide');
		modalContainer.addClass('si-modal-container-open');
		$('#' + currentModal).addClass('si-current-modal');
		slide.data[type].trys = 0;

		if (siAudio[slide.id].negativeFinal) {
			siAudio.sfx.wrong.once('end', function () {
				siAudio[slide.id].negativeFinal.play();
			});
			siAudio.sfx.wrong.play();
		} else {
			siAudio.sfx.wrong.play();
		}

		slideAction(slide.id, 'onFailureAction2');
	}
}
////////////*Feature:Positive and Negative Feedback Handler & closeFeedbackAction///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * @param bol
 */
function handleAnswer(bol) {
	var slide = globalVar.slide;
	var type = slide.data.type;
	var trys = slide.data[type].trys;
	var modalType = bol ? 'positive' : 'negative';
	var hasModal =
		slide.data.modal &&
		(slide.data.modal[modalType] || slide.data.modal[modalType + 'Final'] || slide.data.modal[modalType + trys]);

	Howler.stop();

	if (bol) {
		if (globalVar.earnCoins === true && slide.data.coinSettings.include) {
			addCoins();
		}
	}

	if (!hasModal) {
		if (bol) {
			slideAction(slide.id, 'onSuccessAction');
		} else {
			slideAction(slide.id, 'onFailureAction1');
		}
		slideAction(slide.id, 'nextAction');
	} else {
		// $('#si-nav-container').addClass('feedback-open');
		if (bol == true) {
			answerCorrect();
		} else {
			answerIncorrect();
		}
	}
}

/**
 * @param item
 */
function closeFeedbackAction(item) {
	var slide = globalVar.slide;
	$('.leader-line').removeClass('hide');
	if (globalVar.currentModal == 'i6-end') {
		slideAction(slide.id, 'nextAction');
	} else {
		switch (item) {
			case 'positive':
				if (slide.id == 'i6') {
					simpleModalOpen('end');
				} else {
					slideAction(slide.id, 'nextAction');
				}

				break;
			case 'negative':
				break;
			case 'hotspot':
				var $hotspots = slide.$dom.find(' .hotspot-button__js');
				var itemNum = globalVar.hotspotItemNum;
				var $hotspot = $($hotspots[itemNum - 1]);
				var $curModal = $('#' + globalVar.currentModal);
				var modals = getHotspotModals($hotspots.length);

				handleHotspotClose(slide.data.hotspot, $hotspots, modals, itemNum, $hotspot, $curModal);

				break;
			case 'negativeFinal':
				if (slide.id == 'i6') {
					simpleModalOpen('end');
				} else {
					slideAction(slide.id, 'nextAction');
				}
				break;
			default:
				break;
		}
	}

}

/**
 *
 */
function FBKeyboard() {
	// var key = $("#FBKey")
	var FBitems = $('.si-current-modal').children().children();
	var idx;
	if ($(FBitems[0]).hasClass('ie9hack')) {
		idx = 1;
	} else {
		idx = 0;
	}
	$(FBitems[idx]).focus();

	$('body').on('keydown.drag', function (event) {
		switch (event.keyCode) {
			case 9: //cycles through only FB elements while it is open
				event.preventDefault();
				if (idx < FBitems.length - 1) {
					idx += 1;
				} else {
					idx = 0;
				}
				$(FBitems[idx]).focus();
				break;
			case 27: // allows user to press escape key to return to normal and places focus on previous element
				$('.si-current-modal').trigger('click');
				$(document.activeElement).blur();
				break;
			case 13: // allows user to press enter key to return to normal and removes all focus (so that submit key is not clicked when FB closes)
				$('.si-current-modal').trigger('click');
				$(document.activeElement).blur();
				break;
			default:
				return true;
		}
	});
}

/**
 *
 */
function handleHotspotClose(settings, $hotspots, modals, itemNum, $hotspot, $modal) {
	var itemSettings = getItemSettings(settings.items, $hotspot[0].id, itemNum);

	hotspotCustomAction(settings.onModalClose, itemSettings && itemSettings.onModalClose, $hotspot, $modal);

	hotspotItemComplete(settings, $hotspots, itemSettings, $hotspot, $modal);

	if (settings.linear)
		hotspotUnlockNext(settings, $hotspots, itemNum + 1, $($hotspots[itemNum]), modals && modals[itemNum]);
}

/**
 * @param container
 */
function modalClosingActions() {
	var slide = globalVar.slide;
	Howler.stop();
	if (slide.data.type === 'hotspot' && slide.data.hotspot.modals && slide.data.hotspot.modals.hover) {
		// console.log('hover-hotspot, no click audio');
	} else {
		siAudio.sfx.click.play();
	}

	var isFeedbackModal = globalVar.currentModalType && globalVar.currentModalType !== 'hotspot';

	switch (isFeedbackModal && slide.data.type) {
		case 'dnd':
			resetDnd();
			break;
		case 'sort':
			resetSort();
			break;
		case 'quiz':
			resetQuiz();
			break;
		case 'scratch':
			resetScratch();
			break;
		case 'hotspot':
			var $hotspots = slide.$dom.find(' .hotspot-button__js');

			resetHotspot(slide.data.hotspot, $hotspots, getHotspotModals($hotspots.length));
			break;

		default:
			if (slide.data.customReset) {
				slide.data.customReset();
			}
	}
	if (slide.data[slide.data.type].customReset) {
		slide.data[slide.data.type].customReset();
	}

	$('body').off('keydown.drag');

	$('.si-modal-container__js').removeClass('si-modal-container-open si-hover-hotspot');
	// console.log($('#' + globalVar.currentModal));
	$('#' + globalVar.currentModal).removeClass('si-current-modal');

	if (slide.data.closeFeedbackAction) slide.data.closeFeedbackAction(globalVar.currentModalType);
	else closeFeedbackAction(globalVar.currentModalType);
}

/**
 * @param id
 */
function simpleModalOpen(id) {
	var slide = globalVar.slide;
	if (slide.data.modal[id]) {
		var currentModal = slide.data.modal[id];
		if (siAudio[slide.id][id]) {
			siAudio[slide.id][id].play();
		}
		$('.si-modal-container__js').addClass('si-modal-container-open');
		$('#' + currentModal).addClass('si-current-modal');
		globalVar.currentModal = currentModal;
	}
}

/**
 *
 */
function simpleModalClose() {
	Howler.stop();
	$('.si-modal-container__js').removeClass('si-modal-container-open');
	$('#' + globalVar.currentModal).removeClass('si-current-modal');
}

////////////*Feature:Drag and Drop///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function resetDnd(slideID) {
	slide = slideID ? getSlideHelpers(slideID) : globalVar.slide;
	var $draggables = slide.$dom.find('.draggable');
	var $droppables = slide.$dom.find('.droppable');
	var dndInfo = slide.data.dnd ? slide.data.dnd : {};

	// animate back to start position and reset all position storage to the original.  Remove dnd2 class
	$draggables.each(function (idx, draggable) {
		var currentDraggableData = dndInfo.draggableData[draggable.id];
		var startPosition = currentDraggableData.originalPosition;
		$(draggable).animate(startPosition, 500);
		currentDraggableData.currentPosition = startPosition;
		currentDraggableData.previousPosition = startPosition;
		currentDraggableData.currentDropID = '';
		if (slide.data.dnd.type === 'dnd_2') {
			$(draggable).fadeIn().removeClass('shrink');
		}
		if (slide.data.dnd.type === 'line') {
			$(draggable).fadeIn().removeClass('shrink');
			resetLeaderLines();
		}
	});
	// wipe contained draggable info
	$droppables.each(function (idx, droppable) {
		dndInfo.droppableData[droppable.id].containedDraggables = [];
		dndInfo.droppableData[droppable.id].lastDraggableAccepted = [];
	});

	var { data } = slide;
	if (checkLockSubmitIfUnattempted(data)) lockButtonNowUnlockOnExit($('#si-submit, #si-custom-submit'), data);
	return true;
}

function dndFunction() {
	var slide = globalVar.slide;
	var $draggables = slide.$dom.find('.draggable');
	var $droppables = slide.$dom.find('.droppable');

	var { data } = slide;
	if (checkLockSubmitIfUnattempted(data)) lockButtonNowUnlockOnExit($('#si-submit, #si-custom-submit'), data);

	// The reason we wait until the slide is visited to initialize the dnd is because the positioning of the draggables will be incorrect when the reveal slide is hidden.
	if (!slide.data.visited) {
		var slide = globalVar.slide;
		addToFunctionKey(slide.data, 'onExitAction', function () {
			resetDnd(slide.id);
		});
		var dndInfo = slide.data.dnd ? slide.data.dnd : {};
		dndInfo.draggableData = dndInfo.draggableData ? dndInfo.draggableData : {};
		dndInfo.droppableData = dndInfo.droppableData ? dndInfo.droppableData : {};

		dndInfo.type = dndInfo.type ? dndInfo.type : 'dnd_1';
		if (dndInfo.type === 'line') {
			window.leaderlines[slide.id] = {};

			addToFunctionKey(slide.data, 'onExitAction', function () {
				quickResetLeaderLines(slide);
			});
		}
		dndInfo.snapping = dndInfo.snapping ? dndInfo.snapping : true;
		dndInfo.alignmentOnDrop = dndInfo.alignmentOnDrop ? dndInfo.alignmentOnDrop : 'snapping';
		// First time to the slide store the top and left positions of the draggables
		$draggables.each(function (idx, draggable) {
			dndInfo.draggableData[draggable.id] = dndInfo.draggableData[draggable.id]
				? dndInfo.draggableData[draggable.id]
				: {};
			var initialTop =
				((parseInt($(draggable).css('top')) / $(draggable).parent().height()) * 100).toString() + '%';
			var initialLeft =
				((parseInt($(draggable).css('left')) / $(draggable).parent().width()) * 100).toString() + '%';

			var alignment = dndInfo.draggableData[draggable.id].alignmentOnDrop
				? dndInfo.draggableData[draggable.id].alignmentOnDrop
				: '';

			if (dndInfo.type === 'line') {
				var correspondingLeaderLineName = slide.id + '_leaderline_' + draggable.id;

				var lineName = slide.id + '_leaderline_' + draggable.id;
				var startElement = document.getElementById(slide.data.dnd.leaderLineSetup[draggable.id].startElement);
				var endElement = document.getElementById(draggable.id);
				// console.log(startElement, lineName, endElement);
				window.leaderlines[slide.id][lineName] = new LeaderLine(startElement, endElement, {
					startPlug: slide.data.dnd.leaderLineSetup.startPlug || 'behind',
					startSocket: slide.data.dnd.leaderLineSetup.startSocket || 'auto',
					startPlugColor: slide.data.dnd.leaderLineSetup.startPlugColor || 'auto',
					startPlugSize: slide.data.dnd.leaderLineSetup.startPlugSize || 1,
					startPlugOutline: slide.data.dnd.leaderLineSetup.startPlugOutline || false,
					startPlugOutlineColor: slide.data.dnd.leaderLineSetup.startPlugOutlineColor || 'auto',
					startPlugOutlineSize: slide.data.dnd.leaderLineSetup.startPlugOutlineSize || 1,
					endPlugOutline: slide.data.dnd.leaderLineSetup.endPlugOutline || false,
					endPlugOutlineColor: slide.data.dnd.leaderLineSetup.endPlugOutlineColor || 'auto',
					endPlugOutlineSize: slide.data.dnd.leaderLineSetup.endPlugOutlineSize || 1,
					endPlugSize: slide.data.dnd.leaderLineSetup.endPlugSize || 1,
					endPlugColor: slide.data.dnd.leaderLineSetup.endPlugColor || 'auto',
					endSocket: slide.data.dnd.leaderLineSetup.endSocket || 'auto',
					endPlug: 'behind',
					hide: 'true',
					color: slide.data.dnd.leaderLineSetup.color || 'black',
					size: slide.data.dnd.leaderLineSetup.size || 4,
					path: slide.data.dnd.leaderLineSetup.path || 'fluid',
					dash: slide.data.dnd.leaderLineSetup.dash || false
				});
				window.leaderlines[slide.id][lineName].originalEndPoint = endElement;
			}
			dndInfo.draggableData[draggable.id] = {
				originalPosition: {
					top: initialTop,
					left: initialLeft
				},
				currentPosition: {
					top: initialTop,
					left: initialLeft
				},
				previousPosition: {
					top: initialTop,
					left: initialLeft
				},
				currentDropID: '',
				alignmentOnDrop: alignment,
				correspondingLeaderLine: correspondingLeaderLineName
			};

			// makes dnd keyboard accessible
			$(draggable).attr('tabindex', '0');
			keyBoardAccess(draggable);
		});

		$droppables.each(function (idx, droppable) {
			// set defaults for answer and dropcounter if they are not provided, create place to store draggable info
			if (dndInfo.droppableData[droppable.id]) {
				var currentDroppableData = dndInfo.droppableData[droppable.id];
				var correctAnswer;
				if (currentDroppableData.answers || currentDroppableData.answers === 0) {
					correctAnswer = currentDroppableData.answers;
				} else {
					correctAnswer = [$($draggables[idx])[0].id];
				}
				var dropCount = currentDroppableData.dropCounter ? currentDroppableData.dropCounter : 1;
				var snapTo = currentDroppableData.snapTo;
				dndInfo.droppableData[droppable.id] = {
					answers: correctAnswer,
					containedDraggables: [],
					dropCounter: dropCount,
					lastDraggableAccepted: [],
					snapTo: snapTo
				};
			} else {
				dndInfo.droppableData[droppable.id] = {
					answers: [$($draggables[idx])[0].id],
					containedDraggables: [],
					dropCounter: 1,
					lastDraggableAccepted: []
				};
			}

			// necessary to make dnd keyboard accessible
			$(droppable).attr('tabindex', '-1');
		});

		// basic draggable initialize
		$draggables.draggable({
			drag: function (event, ui) {
				draggable = ui.helper[0];
				currentDraggableData = dndInfo.draggableData[draggable.id];
				if (slide.data.dnd.type === 'line') {
					window.leaderlines[slide.id][currentDraggableData.correspondingLeaderLine].position().show();
				}
			},
			revert: function (validArea) {
				if (!validArea) {
					if (slide.data.dnd.type === 'line') {
						resetSpecificLeaderLine(currentDraggableData.correspondingLeaderLine);
					}
					return true;
				} else {
					return false;
				}
			},
			stack: '.draggable'
		});
		// attach custom events and options if provided
		if (dndInfo.draggableGroups) {
			for (group in dndInfo.draggableGroups) {
				if (dndInfo.draggableGroups[group].events) {
					for (action in dndInfo.draggableGroups[group].events) {
						slide.$dom.find(group).on(action, dndInfo.draggableGroups[group].events[action]);
					}
				}
				if (dndInfo.draggableGroups[group].options) {
					slide.$dom.find(group).draggable('option', dndInfo.draggableGroups[group].options);
				}
			}
		}
		// basic droppable initialize
		$droppables.droppable({
			drop: function (event, ui) {
				handleDrop($(event.target), $(ui.draggable));

				if (globalVar.lockSubmitIfUnattempted) {
					unlock($('#si-submit'));
				}
			}
		});
		// attach custom events and options if provided
		if (dndInfo.droppableGroups) {
			for (group in dndInfo.droppableGroups) {
				if (dndInfo.droppableGroups[group].events) {
					for (action in dndInfo.droppableGroups[group].events) {
						slide.$dom.find(group).on(action, dndInfo.droppableGroups[group].events[action]);
					}
				}
				if (dndInfo.droppableGroups[group].options) {
					slide.$dom.find(group).droppable('option', dndInfo.droppableGroups[group].options);
				}
			}
		}
	}
	// moved reset dnd to exit action
	// else {
	// 	resetDnd();
	// }

	return true;
} //end dndFunction
function alignedPosition($droppable, $draggable) {
	var slide = globalVar.slide;
	var dndInfo = slide.data.dnd;
	var dragData = dndInfo.draggableData[$draggable[0].id];
	var newPosition = {
		top: 0,
		left: 0
	};
	var alignment = dragData.alignmentOnDrop ? dragData.alignmentOnDrop : dndInfo.alignmentOnDrop;
	switch (typeof alignment) {
		case 'string':
			switch (alignment) {
				case 'snapping':
					newPosition.top =
						((parseInt($droppable.css('top')) / $droppable.parent().height()) * 100).toString() + '%';
					newPosition.left =
						((parseInt($droppable.css('left')) / $droppable.parent().width()) * 100).toString() + '%';
					break;
				case 'fixed':
					newPosition.top =
						((parseInt($draggable.css('top')) / $('.reveal').height()) * 100).toString() + '%';
					newPosition.left =
						((parseInt($draggable.css('left')) / $('.reveal').width()) * 100).toString() + '%';
					break;
				case 'center':
					newPosition.top =
						(
							((parseInt($droppable.css('top')) + $droppable.height() / 2 - $draggable.height() / 2) /
								$droppable.parent().height()) *
							100
						).toString() + '%';
					newPosition.left =
						(
							((parseInt($droppable.css('left')) + $droppable.width() / 2 - $draggable.width() / 2) /
								$droppable.parent().width()) *
							100
						).toString() + '%';
					break;
				case 'h-center':
					newPosition.top =
						((parseInt($droppable.css('top')) / $droppable.parent().height()) * 100).toString() + '%';
					newPosition.left =
						(
							((parseInt($droppable.css('left')) + $droppable.width() / 2 - $draggable.width() / 2) /
								$droppable.parent().width()) *
							100
						).toString() + '%';
					break;
				case 'v-center':
					newPosition.top =
						(
							((parseInt($droppable.css('top')) + $droppable.height() / 2 - $draggable.height() / 2) /
								$droppable.parent().height()) *
							100
						).toString() + '%';
					newPosition.left =
						((parseInt($droppable.css('left')) / $droppable.parent().width()) * 100).toString() + '%';
					break;
				default:
					break;
			}
			break;
		case 'object':
			if (Array.isArray(alignment)) {
				if (alignment.length === 2) {
					switch (alignment[0]) {
						case 'v-center':
							newPosition.top =
								(
									((parseInt($droppable.css('top')) +
										$droppable.height() / 2 -
										$draggable.height() / 2) /
										$droppable.parent().height()) *
									100
								).toString() + '%';
							break;
						case 'top':
							newPosition.top =
								((parseInt($droppable.css('top')) / $droppable.parent().height()) * 100).toString() +
								'%';
							break;
						case 'middle':
							newPosition.top =
								(
									((parseInt($droppable.css('top')) + $droppable.height() / 2) /
										$droppable.parent().height()) *
									100
								).toString() + '%';
							break;
						case 'bottom':
							newPosition.top =
								(
									((parseInt($droppable.css('top')) + $droppable.height() - $draggable.height()) /
										$droppable.parent().height()) *
									100
								).toString() + '%';
							break;
						case 'under':
							newPosition.top =
								(
									((parseInt($droppable.css('top')) + $droppable.height()) /
										$droppable.parent().height()) *
									100
								).toString() + '%';
							break;
						case 'over':
							newPosition.top =
								(
									((parseInt($droppable.css('top')) - $draggable.height()) /
										$droppable.parent().height()) *
									100
								).toString() + '%';
							break;
						default:
							break;
					}

					switch (alignment[1]) {
						case 'h-center':
							newPosition.left =
								(
									((parseInt($droppable.css('left')) +
										$droppable.width() / 2 -
										$draggable.width() / 2) /
										$droppable.parent().width()) *
									100
								).toString() + '%';
							break;
						case 'left':
							newPosition.left =
								((parseInt($droppable.css('left')) / $droppable.parent().width()) * 100).toString() +
								'%';
							break;
						case 'middle':
							newPosition.left =
								(
									((parseInt($droppable.css('left')) + $droppable.width() / 2) /
										$droppable.parent().width()) *
									100
								).toString() + '%';
							break;
						case 'right':
							newPosition.left =
								(
									((parseInt($droppable.css('left')) + $droppable.width() - $draggable.width()) /
										$droppable.parent().width()) *
									100
								).toString() + '%';
							break;
						case 'outside-right':
							newPosition.left =
								(
									((parseInt($droppable.css('left')) + $droppable.width()) /
										$droppable.parent().width()) *
									100
								).toString() + '%';
							break;
						case 'outside-left':
							newPosition.left =
								(
									((parseInt($droppable.css('left')) - $draggable.width()) /
										$droppable.parent().width()) *
									100
								).toString() + '%';
							break;
						default:
							break;
					}
				}
			} else {
				newPosition = alignment;
			}
		default:
			break;
	}

	return newPosition;
}
//handle drop into valid drop area for all dnd types///
function handleDrop($droppable, $draggable) {
	var slide = globalVar.slide;
	var dndInfo = slide.data.dnd;
	var currentDropData = dndInfo.droppableData[$droppable[0].id];
	var currentDragData = dndInfo.draggableData[$draggable[0].id];

	// determine if a drop area can accept more draggables
	// var spaceAvailable = Object.keys(currentDropData.containedDraggables).length < currentDropData.dropCounter;
	var spaceAvailable = currentDropData.containedDraggables.length < currentDropData.dropCounter;

	if (spaceAvailable) {
		// remove draggable info from previous drop area if moving between droppables
		if (currentDragData.currentDropID) {
			var previousDropData = dndInfo.droppableData[currentDragData.currentDropID];
			if (previousDropData.containedDraggables.indexOf($draggable[0].id) > -1) {
				previousDropData.containedDraggables.splice(
					previousDropData.containedDraggables.indexOf($draggable[0].id),
					1
				);
			}
			if (previousDropData.lastDraggableAccepted.indexOf($draggable[0].id) > -1) {
				previousDropData.lastDraggableAccepted.splice(
					previousDropData.lastDraggableAccepted.indexOf($draggable[0].id),
					1
				);
			}
		}
		// add draggable id to the drop data
		currentDropData.containedDraggables.push($draggable[0].id);
		currentDropData.lastDraggableAccepted.push($draggable[0].id);
		// update draggable data
		currentDragData.currentDropID = $droppable[0].id;
		currentDragData.previousPosition = currentDragData.currentPosition;
		currentDragData.currentPosition = alignedPosition($droppable, $draggable);
		// handle movement based on dnd type
		if (dndInfo.type === 'dnd_2') {
			$draggable.addClass('shrink');
		} else if (dndInfo.type === 'line') {
			$draggable.addClass('shrink');

			window.leaderlines[slide.id][currentDragData.correspondingLeaderLine].setOptions({
				endPlug: dndInfo.leaderLineSetup.endPlug,
				end: document.getElementById(currentDropData.snapTo || $droppable[0].id)
			});
		} else {
			$draggable.animate(currentDragData.currentPosition, 500);
		}
	} else {
		// revert draggable if dnd2
		if (dndInfo.type === 'dnd_2') {
			$draggable.animate(currentDragData.previousPosition, 500);
		} else if (dndInfo.type === 'line') {
			$draggable.animate(currentDragData.previousPosition, 500);
			resetSpecificLeaderLine(currentDragData.correspondingLeaderLine);
		} else {
			// handle swapping elements if dnd1. swaps last draggable dropped with the current drop
			var lastDraggable = currentDropData.lastDraggableAccepted.pop();
			var previousDragData = dndInfo.draggableData[lastDraggable];

			// swap droppable information if moving from one droppable to another
			if (currentDragData.currentDropID) {
				var previousDropData = dndInfo.droppableData[currentDragData.currentDropID];
				previousDropData.containedDraggables.push(lastDraggable);
				if (previousDropData.containedDraggables.indexOf($draggable[0].id) > -1) {
					previousDropData.containedDraggables.splice(
						previousDropData.containedDraggables.indexOf($draggable[0].id),
						1
					);
				}
				if (previousDropData.lastDraggableAccepted.indexOf($draggable[0].id) > -1) {
					previousDropData.lastDraggableAccepted.splice(
						previousDropData.lastDraggableAccepted.indexOf($draggable[0].id),
						1
					);
				}
				previousDropData.lastDraggableAccepted.push(lastDraggable);
				previousDragData.currentDropID = currentDragData.currentDropID;
				previousDragData.previousPosition = previousDragData.currentPosition;
				previousDragData.currentPosition = alignedPosition(
					$('#' + currentDragData.currentDropID),
					$('#' + lastDraggable)
				);
			} else {
				previousDragData.previousPosition = previousDragData.currentPosition;
				previousDragData.currentPosition = currentDragData.currentPosition;
			}
			// add draggable data to droppable and remove the data of the draggable being swapped
			currentDropData.containedDraggables.push($draggable[0].id);
			if (currentDropData.containedDraggables.indexOf(lastDraggable) > -1) {
				currentDropData.containedDraggables.splice(
					currentDropData.containedDraggables.indexOf(lastDraggable),
					1
				);
			}
			currentDropData.lastDraggableAccepted.push($draggable[0].id);
			// update new and old draggable dropID
			previousDragData.currentDropID = currentDragData.currentDropID;
			currentDragData.currentDropID = $droppable[0].id;

			// swap positions. The draggable being removed will move to the current position the new draggable was moved from and the new draggable will now be in the drop area

			currentDragData.previousPosition = currentDragData.currentPosition;
			currentDragData.currentPosition = alignedPosition($droppable, $draggable);
			// move both draggables
			$draggable.animate(currentDragData.currentPosition, 500);
			$('#' + lastDraggable).animate(previousDragData.currentPosition, 500);
		}
	}

	return true;
} //end handleDrop

function checkDnd() {
	var slide = globalVar.slide;
	var $droppables = slide.$dom.find('.droppable');
	var isCorrect = true;
	$droppables.each(function (idx, droppable) {
		var currentDroppableData = slide.data.dnd.droppableData[droppable.id];
		var submittedAnswer = currentDroppableData.containedDraggables;
		var correctAnswers = currentDroppableData.answers;

		if (!isCorrect) {
			return isCorrect;
		}
		switch (typeof correctAnswers) {
			case 'string':
				switch (correctAnswers) {
					case 'empty':
						if (submittedAnswer.length > 0) {
							isCorrect = false;
							return;
						}
						break;
					case 'any':
						if (submittedAnswer.length === 0) {
							isCorrect = false;
							return;
						}
						break;
					default:
						break;
				}
				break;
			case 'number':
				if (submittedAnswer.length !== correctAnswers) {
					isCorrect = false;
					return;
				}

				break;
			case 'boolean':
				isCorrect = correctAnswers;
				return;
			case 'object':
				if (Array.isArray(correctAnswers)) {
					if (correctAnswers.length !== submittedAnswer.length) {
						isCorrect = false;
						return;
					}
					var sortedCorrectAnswer = correctAnswers.sort();
					var sortedSubmittedAnswer = submittedAnswer.sort();
					isCorrect = sortedCorrectAnswer.every(function (answer, idx) {
						return sortedSubmittedAnswer[idx] === answer;
					});
					return isCorrect;
				} else {
					for (answerKey in correctAnswers) {
						var sortedAnswerArray = correctAnswers[answerKey].sort();
						var sortedSubmittedArray = submittedAnswer.sort();
						if (sortedAnswerArray.length !== sortedSubmittedArray.length) {
							isCorrect = false;
							continue;
						}

						isCorrect = sortedAnswerArray.every(function (answer, idx) {
							return sortedSubmittedArray[idx] === answer;
						});
						if (isCorrect) {
							return;
						} else {
							continue;
						}
					}
				}
				break;
			default:
				break;
		}
	});

	return isCorrect;
} //end checkDnd
function keyBoardAccess(dragElement) {
	var slide = globalVar.slide;
	var accessibility = function (event) {
		var drops = slide.$dom.find('.droppable');
		var dropIdx = 0;
		var $drag = $(this);
		if (event.which === 32) {
			//spacebar selects drag element

			$(drops[dropIdx]).focus(); //focuses on first drop area
			$drag.off('keydown.access'); //removes spacebar selector
			dragging($drag[0]); //takes care of drag events

			$('body').on('keydown.drag', function (event) {
				switch (event.keyCode) {
					case 9: //removes ability to tab while drag element is selected
						event.preventDefault();
						break;
					case 27: // allows user to press escape key to return to normal and places focus on drag element
						$drag.animate(
							{
								top: $drag.data('originalTop'),
								left: $drag.data('originalLeft')
							},
							revertTime
						);
						$drag.focus();

						$drag.on('keydown.access', accessibility);
						$('body').off('keydown.drag');
						break;
					case 38: //up arrow cycles through drop targets
						if (dropIdx < drops.length - 1) {
							dropIdx += 1;
						} else {
							dropIdx = 0;
						}
						$(drops[dropIdx]).focus();
						break;
					case 40: //down arrow cycles through drop targets
						if (dropIdx > 0) {
							dropIdx -= 1;
						} else {
							dropIdx = drops.length - 1;
						}
						$(drops[dropIdx]).focus();
						break;
					case 13: //enter key drops selected drag element into currently focused drop area
						dropped(drops[dropIdx], $drag[0]);
						if (slide.data.dnd.type === 'dnd_2') {
							$drag.blur();
						} else {
							$drag.focus();
						}
						$drag.on('keydown.access', accessibility);
						$('body').off('keydown.drag');
						break;
					default:
						return true;
				}
			});
		}
	};
	$(dragElement).on('keydown.access', accessibility);
}

function resetLeaderLines(slide) {
	var slide = globalVar.slide;
	// console.log('reset');
	for (var lineNameKey in leaderlines[slide.id]) {
		leaderlines[slide.id][lineNameKey].hide('draw');
	}
	setTimeout(function () {
		for (var lineNameKey2 in leaderlines[slide.id]) {
			leaderlines[slide.id][lineNameKey2].setOptions({
				end: leaderlines[slide.id][lineNameKey2].originalEndPoint,
				endPlug: 'behind'
			});
		}
	}, 500);
}
function quickResetLeaderLines(slide) {
	// console.log('quick reset');
	for (var lineNameKey in leaderlines[slide]) {
		leaderlines[slide][lineNameKey].hide('none');
	}
	setTimeout(function () {
		for (var lineNameKey2 in leaderlines[slide]) {
			leaderlines[slide][lineNameKey2].setOptions({
				end: leaderlines[slide][lineNameKey2].originalEndPoint,
				endPlug: 'behind'
			});
		}
	}, 500);
}
function resetSpecificLeaderLine(line) {
	var slide = globalVar.slide;
	// console.log(id);
	// leaderlines[slide.id][id].hide('draw');
	leaderlines[slide.id][line].hide('draw');

	setTimeout(function () {
		leaderlines[slide.id][line].setOptions({
			end: leaderlines[slide.id][line].originalEndPoint,
			endPlug: 'behind'
		});
	}, 500);
}

function DNDOldFrameworkAdapter() {
	for (var slide in slides) {
		// console.log(slides[slide].type);
		if (slides[slide].type === 'dnd') {
			if (slides[slide].dnd.quiz === undefined) {
				slides[slide].dnd.quiz = [];
				for (var dropTarget in slides[slide].dnd.droppableData) {
					for (var draggableIndex in slides[slide].dnd.droppableData[dropTarget].answers) {
						slides[slide].dnd.quiz[dropTarget] = [];
						// console.log(dropTarget, slides[slide].dnd.droppableData[dropTarget].answers[draggableIndex]);
						slides[slide].dnd.quiz[dropTarget].push(
							slides[slide].dnd.droppableData[dropTarget].answers[draggableIndex]
						);
					}
				}
			}
		}
	}
}

function solveDND() {
	var currentSlideID = globalVar.curSlide;

	DNDOldFrameworkAdapter();

	if (slides[currentSlideID].type === 'dnd') {
		$('.draggable').css('zIndex', 3);
		var dndAnswersArray = slides[currentSlideID].dnd.quiz;
		for (var dropTarget in dndAnswersArray) {
			// console.log('🚀 ~ file: data.js ~ line 6 ~ solveDND ~ dndAnswersArray', dndAnswersArray);
			var draggablesArray = dndAnswersArray[dropTarget];
			// console.log('🚀 ~ file: data.js ~ line 7 ~ solveDND ~ draggablesArray', draggablesArray);
			for (var draggableIndex in draggablesArray) {
				// console.log(dropTarget, draggable);
				var draggable = draggablesArray[draggableIndex];
				// console.log('🚀 ~ file: data.js ~ line 12 ~ solveDND ~ draggable', draggable);
				$('#' + draggable).animate($('#' + dropTarget).position(), 0);
				if (typeof dropped === 'function') {
					dropped($('#' + dropTarget)[0], $('#' + draggable)[0]);
				} else if (typeof handleDrop === 'function') {
					handleDrop($('#' + dropTarget), $('#' + draggable));
				} else {
					console.error(
						"Neither 'dopped' nor 'handleDrop' function is available. Must be an unsupported version of the framework. Sorry."
					);
				}
			}
		}
	} else {
		console.error('Not even a DND slide, bro!');
	}
}

/*
WISHLIST

classes nested in "classes" object
hover events
groups

*/

/**
 * @param slideObj
 * @param settings
 * @param $hotspots
 * @param modals
 */
function hotspotFunctions(slide, settings, $hotspots, modals) {
	var slide = slide || globalVar.slide;
	var { data } = slide;
	var settings = settings || data.hotspot || (data.hotspot = {});
	var $hotspots = $hotspots || slide.$dom.find('.hotspot-button__js');
	var modals = modals || getHotspotModals($hotspots.length);

	if (!data.visited) hotspotInit(data, settings, $hotspots, modals);
	if (checkLockSubmitIfUnattempted(data)) lockButtonNowUnlockOnExit($('#si-submit, #si-custom-submit'), data);
	resetHotspot(settings, $hotspots, modals);
}

/**
 * @param slideObj
 * @param settings
 * @param $hotspots
 * @param modals
 */
function hotspotInit(slideObj, settings, $hotspots, modals) {
	hotspotSetDefaults(settings, modals);
	hotspotDOMSetup(slideObj, settings, $hotspots, modals);
	hotspotAudioInit(settings.audio);

	hotspotListeners(settings, $hotspots, function (idx, hotspot) {
		return function () {
			hotspotOnInteract(settings, $hotspots, modals, idx, $(hotspot), modals[idx]);
		};
	});

	hotspotOnExit(slideObj);
}

/**
 * @param settings
 * @param $hotspots
 * @param modals
 */
function resetHotspot(settings, $hotspots, modals) {
	var slide = globalVar.slide;
	var { data } = slide;

	var settings = settings || data.hotspot;
	var $hotspots = $hotspots || slide.$dom.find('.hotspot-button__js');
	var modals = modals || getHotspotModals($hotspots.length);

	$hotspots.removeClass(settings.classes.completed);

	if (settings.linear) hotspotLinearReset(settings, $hotspots, modals);
	if (settings.quiz) hotspotQuizReset(settings, $hotspots);
	if (checkLockSubmitIfUnattempted(data)) lockButtonNowUnlockOnExit($('#si-submit, #si-custom-submit'), data);
}

/**
 * @param settings
 * @param $hotspots
 * @param idx
 * @param $selectedHotspot
 * @param $modal
 */

function hotspotOnInteract(settings, $hotspots, modals, idx, $selectedHotspot, $modal) {
	var itemNum = idx + 1;
	var hasModals = settings.modals;
	var itemSettings = getItemSettings(settings.items, $selectedHotspot[0].id, itemNum);
	var modalDoesNotTriggerCompletion = !hasModals || settings.modals.noModalClose;

	unlock($('#si-submit'));
	hotspotCustomAction(settings.onClick, itemSettings && itemSettings.onClick, $selectedHotspot, $modal);
	hotspotPlayVO(settings, itemNum);

	if (settings.quiz) return hotspotOnQuizItemSelected(settings, $hotspots, $selectedHotspot);

	if (hasModals) {
		hotspotCloseRemainingModals(settings, $('.si-current-modal'), $('.hotspot-open'));
		hotspotOpenModal(settings, itemNum, $selectedHotspot, $modal);

		if (settings.modals.hover) hotspotCloseOnMouseOut($selectedHotspot, $modal);
	}

	if (modalDoesNotTriggerCompletion) {
		hotspotItemComplete(settings, $hotspots, itemSettings, $selectedHotspot, $modal);

		if (settings.linear)
			hotspotUnlockNext(settings, $hotspots, itemNum + 1, $($hotspots[idx + 1]), modals[idx + 1]);
	}
}

function hotspotSetDefaults(settings, useModals) {
	settings.modals = !useModals ? false : settings.modals ? settings.modals : {};
	settings.items = settings.items || {};
	settings.classes = settings.classes || {};

	settings.classes.hotspot = settings.classes.hotspot || 'hotspot-style';
	settings.classes.modal = settings.classes.modal || 'modal-style';

	settings.classes.completed = settings.classes.completed || 'completed';
	settings.classes.linearUnlocked = settings.classes.linearUnlocked || 'unlocked';
	settings.classes.quizItemSelected = settings.classes.quizItemSelected || 'selected-hotspot';

	return settings;
}

function hotspotDOMSetup(slideObj, settings, $hotspots, modals) {
	$hotspots.addClass(settings.classes.hotspot);
	$hotspots.each(function (idx, hotspot) {
		$(hotspot).addClass(settings.classes.hotspot + '-' + (idx + 1));
	});

	if (!modals) return;

	var $modalContainer = modals && modals[0].parent();

	modals.forEach(function ($modal, idx) {
		$modal.addClass(settings.classes.modal);
		$modal.addClass(settings.classes.modal + '-' + (idx + 1));

		if (settings.modals.clickAnywhere) $modal.addClass('modal-click-anywhere');
	});
	if (settings.modals.hover || settings.modals.noModalClose) {
		addToFunctionKey(slideObj, 'onExitAction', function () {
			$modalContainer.removeClass('passthrough-modal');
		});
	}
}

function hotspotAudioInit(audioObj) {
	for (var key in audioObj) {
		audioObj[key] = new Howl({
			src: [audioObj[key]]
		});
	}
}

function hotspotOnWin(settings) {
	if (settings.onWin) settings.onWin();
	else slideAction(globalVar.slide.id, 'nextAction');
}

function hotspotUnlockNext(settings, $hotspots, nextHotspotItemNum, $nextHotspot, $nextModal) {
	var nextHotspotSettings = getItemSettings(settings.items, $nextHotspot.id, nextHotspotItemNum);

	$hotspots.removeClass(settings.classes.linearUnlocked);

	unlock($nextHotspot);
	$nextHotspot.addClass(settings.classes.linearUnlocked);

	hotspotCustomAction(
		settings.onUnlock,
		nextHotspotSettings && nextHotspotSettings.onUnlock,
		$nextHotspot,
		$nextModal
	);
}

function hotspotCloseRemainingModals(settings, $modalToClose, $hotspotToClose) {
	// Howler.stop();
	if ($modalToClose.length <= 0) return;
	var itemToCloseSettings = getItemSettings(settings.items, $hotspotToClose[0].id, globalVar.hotspotItemNum);

	hotspotCustomAction(
		settings.onModalClose,
		itemToCloseSettings && itemToCloseSettings.onModalClose,
		$hotspotToClose,
		$modalToClose
	);
	$modalToClose.removeClass('si-current-modal');
	$modalToClose.parent().removeClass('si-modal-container-open');
	$hotspotToClose.removeClass('hotspot-open');
	$modalToClose.parent().removeClass('passthrough-modal');
}

function getHotspotModals(numOfModals) {
	var slide = globalVar.slide;
	var modals = [];

	if (slide.data.modal)
		for (var i = 1; i < numOfModals + 1; i++) {
			if (slide.data.modal['hs' + i]) modals.push($('#' + slide.data.modal['hs' + i]));
		}
	return modals.length > 0 && modals; //returns false if no modals found
}

function hotspotListeners(settings, $hotspots, onInteract) {
	$hotspots.each(function (idx, hotspot) {
		var $hotspot = $(hotspot);

		if (settings.modals.hover) $hotspot.on('mouseover.hotspot', onInteract(idx, hotspot));
		else $hotspot.on('click.hotspot', onInteract(idx, hotspot));
	});
}

function hotspotPlayVO(settings, itemNum) {
	if (settings.audio) {
		Howler.stop();
		for (var key in settings.audio) settings.audio[key].stop();

		settings.audio[itemNum] && settings.audio[itemNum].play();
	}
}

function hotspotOnQuizItemSelected(settings, $hotspots, $selectedHotspot) {
	if (settings.quiz.type === 'scq') $hotspots.removeClass(settings.classes.quizItemSelected);

	$selectedHotspot.toggleClass(settings.classes.quizItemSelected);

	settings.quiz.selectedAnswers = [];
	$hotspots.each(function (idx, quizHotspot) {
		if ($(quizHotspot).hasClass(settings.classes.quizItemSelected)) settings.quiz.selectedAnswers.push(idx + 1);
	});
}

function hotspotItemComplete(settings, $hotspots, itemSettings, $completedButton, $completedModal) {
	hotspotCustomAction(
		settings.onItemComplete,
		itemSettings && itemSettings.onItemComplete,
		$completedButton,
		$completedModal
	);

	$completedButton.addClass(settings.classes.completed);

	if (allHotspotsCompleted($hotspots)) hotspotOnWin(settings, $hotspots);
}

function allHotspotsCompleted($hotspots) {
	return $hotspots.filter('.completed').length === $hotspots.length;
}

function hotspotSaveModalInfo(saveTo, itemNum, ID) {
	saveTo.currentModal = ID;
	saveTo.currentModalType = 'hotspot';
	saveTo.hotspotItemNum = itemNum;
}

function hotspotOpenModal(settings, itemNum, $selectedHotspot, $modal) {
	var $modalContainer = $modal.parent();

	$selectedHotspot.addClass('hotspot-open');

	if (settings.modals.hover || settings.modals.noModalClose) $modalContainer.addClass('passthrough-modal');

	$modalContainer.addClass('si-modal-container-open');
	$modal.addClass('si-current-modal');

	hotspotSaveModalInfo(globalVar, itemNum, $modal[0].id);
}

function hotspotOnExit(slideObj) {
	addToFunctionKey(slideObj, 'onExitAction', function () {
		var $modalToClose = $('.si-current-modal');

		hotspotCloseRemainingModals(slideObj.hotspot, $modalToClose, $('.hotspot-open'));
	});
}

function hotspotCloseOnMouseOut($selectedHotspot, $modal) {
	var $modalContainer = $modal.parent();

	$selectedHotspot.one('mouseout.hotspot', function () {
		$modalContainer.trigger('click');

		$modalContainer.removeClass('passthrough-modal');
	});
}

function hotspotLinearReset(settings, $hotspots, modals) {
	var $firstHotspot = $($hotspots[0]);
	var $firstModal = modals && modals[0];

	$hotspots.removeClass(settings.classes.linearUnlocked);

	lock($hotspots);
	hotspotUnlockNext(settings, $hotspots, 1, $firstHotspot, $firstModal);
}

function hotspotQuizReset(settings, $hotspots) {
	$hotspots.removeClass(settings.classes.quizItemSelected);
	settings.quiz.selectedAnswers = [];
}

function hotspotCustomAction(mainAction, itemAction, $hotspot, $modal) {
	mainAction && mainAction($hotspot, $modal);
	itemAction && itemAction($hotspot, $modal);
}

function getItemSettings(settingsDir, id, itemNum) {
	return settingsDir[itemNum] || settingsDir[id];
}

function checkHotspot() {
	var slide = globalVar.slide;
	var quiz = slide.data.hotspot.quiz;
	if (!quiz) throw '\nHotspot Error:\nyou have to turn on the "quiz" settings to use hotspots this way';
	var correctAnswers = quiz.answers;
	var selectedAnswers = quiz.selectedAnswers;
	return JSON.stringify(selectedAnswers) === JSON.stringify(correctAnswers);
}

function initMenu() {
	eachSlide(function ({ id: id, data: data, $dom: $dom }) {
		if (data.type === 'menu') {
			if (data.menu) {
				// set default menu class if one is not present
				if (!data.menu.menuClass) {
					data.menu.menuClass = 'si-menu__js';
				}
				// set menu default to nonlinear if linear slide key is not present/true
				if (!data.menu.linear) {
					data.menu.linear = false;
				}
				// set menu default menu navigation if not present.  Will match buttons to subsequent slides after the menu
				if (!data.menu.navigation) {
					var number = data.slideNumber;
					var buttons = $dom.find('.' + data.menu.menuClass);
					var length = buttons.length;
					var defaultNav = [];
					for (var i = 1; i <= length; i++) {
						defaultNav.push(number + i);
					}
					data.menu.navigation = defaultNav;
				}
				// set default completion requirements for each button if not given.  Will match buttons to subsequent slides after the menu
				if (!data.menu.completionIDs) {
					var number = data.slideNumber;
					var buttons = $dom.find('.' + data.menu.menuClass);
					var length = buttons.length;
					var completionIDs = [];
					for (var i = 1; i <= length; i++) {
						for (slideID in slides) {
							if (slides[slideID].slideNumber == (number + i).toString()) {
								completionIDs.push(slideID);
							}
						}
					}
					data.menu.completionIDs = completionIDs;
				}
			} else {
				// set all menu defaults if the 'menu' key is entirely absent
				data.menu = {};
				data.menu.menuClass = 'si-menu__js';
				data.menu.linear = false;
				data.menu.completionIDs = completionIDs;
				var buttons = $dom.find('.' + data.menu.menuClass);
				var number = data.slideNumber;
				var length = buttons.length;
				var defaultNav = [];
				var completionIDs = [];
				for (var i = 1; i <= length; i++) {
					defaultNav.push(number + i);
					for (slideID in slides) {
						if (slides[slideID].slideNumber == (number + i).toString()) {
							completionIDs.push(slideID);
						}
					}
				}
				data.menu.navigation = defaultNav;
				data.menu.completionIDs = completionIDs;
			}
			// attach click event to the buttons using navigation array
			if (data.menu.navigation.length) {
				var buttons = $dom.find('.' + data.menu.menuClass);

				buttons.each(function (idx, button) {
					var slide = data;

					$(button).on('click.nav', function () {
						siAudio.sfx.click.play();
						jumpToId(slide.menu.navigation[idx]);
					});
				});
			}
			// lock buttons if linear and unlock the first one
			if (data.menu.linear) {
				var buttons = $dom.find('.' + data.menu.menuClass);
				lock(buttons);
				unlock($(buttons[0]));
				$(buttons[0]).addClass('unlocked');
			}
		}
	});
}

function menuFunctions() {
	var slide = globalVar.slide;
	var menuButtons = slide.$dom.find('.' + slide.data.menu.menuClass);
	var linear = slide.data.menu.linear;
	var completionIDs = slide.data.menu.completionIDs;
	var allComplete = true;

	if (completionIDs.length) {
		completionIDs.forEach(function (id, idx) {
			if (getCompletionStatus(id)) {
				$(menuButtons[idx]).addClass('completed');
				$(menuButtons).removeClass('unlocked');
				if (linear && menuButtons[idx + 1]) {
					unlock($(menuButtons[idx + 1]));
					$(menuButtons[idx + 1]).addClass('unlocked');
				}
			} else {
				allComplete = false;
			}
		});
	}

	if (allComplete) {
		slide.data.menu.allComplete = true;
	} else {
		slide.data.menu.allComplete = false;
	}
}

//image fill
//scratch off logic
//all complete
//different strokes for different folks
function scratchFunctions(slide) {
	var slide = slide || globalVar.slide;
	var settings = slide.data.scratch;
	var scratchItems = slide.$dom.find('.scratch__js');

	setTimeout(function () {
		if (!settings.init) scratchInit(settings, scratchItems);
		else resetScratch(scratchItems, settings);
	}, 3);
}

function scratchInit(settings, scratchItems) {
	settings.items = settings.items || {};
	settings.brushSize = settings.brushSize || 20;
	settings.fillColor = settings.fillColor || 'white';
	settings.fillImg = settings.fillImg || false;
	settings.padding = settings.padding || '0';
	settings.locked = settings.locked || false;
	settings.onComplete = settings.onComplete || function () {};
	settings.percentageToComplete = settings.percentageToComplete || 90;
	settings.onWin =
		settings.onWin ||
		function () {
			handleAnswer(true);
		};

	scratchItems.addClass('scratch-style');

	scratchItems.each(function (i, scratchItem) {
		var itemID = scratchItem.id || i + 1;

		settings.items[itemID] = settings.items[itemID] || {};
		var itemSettings = settings.items[itemID];

		itemSettings.canvasElem = document.createElement('canvas');
		var canvasElem = itemSettings.canvasElem;

		itemSettings.canvas = canvasElem.getContext('2d');
		itemSettings.completed = false;
		itemSettings.onComplete = itemSettings.onComplete || function () {};

		if (settings.lottoMode) itemSettings.lottoWinner = winningScratch(settings.lottoMode, itemID);

		$(canvasElem).addClass('canvas-style');
		$(scratchItem).parent().append(canvasElem);
		$(scratchItem).addClass('scratch-style-' + (i + 1));
		if (settings.lottoMode && winningScratch(settings.lottoMode, itemID))
			$(scratchItem).addClass('winning-scratch');

		resizeCanvas(scratchItem, settings, itemSettings);

		canvasElem.addEventListener(
			'mousemove',
			function (e) {
				handleScratch(e, scratchItem, settings, itemSettings);
			},
			false
		);

		canvasElem.addEventListener(
			'touchmove',
			function (e) {
				handleScratch(e, scratchItem, settings, itemSettings);
			},
			false
		);

		window.addEventListener('resize', function () {
			setTimeout(function () {
				resizeCanvas(scratchItem, settings, itemSettings);
			}, 3);
		});
	});
	settings.init = true;
}

function handleScratch(e, scratchItem, settings, itemSettings) {
	if (itemSettings.completed || settings.locked) return;

	var canvasElem = itemSettings.canvasElem;
	var canvas = itemSettings.canvas;
	var scratch, coords;

	if (e.type === 'touchmove') {
		e.preventDefault();
		scratch = coords = e.targetTouches[0];
	} else {
		scratch = detectLeftButton(e);
		coords = e;
	}

	if (!scratch && !settings.noClick) return;

	scratchOff(canvasElem, canvas, coords, settings);

	if (!readyToComplete(canvasElem, settings)) return;

	clearCanvas(canvasElem, canvas);

	itemSettings.completed = true;

	settings.onComplete(scratchItem);
	itemSettings.onComplete(scratchItem);

	if (settings.lottoMode && !itemSettings.lottoWinner) {
		handleAnswer(false);
	}

	if (!allScratched(settings.items, settings)) return;

	settings.onWin();
}

function resetScratch(scratchItems, settings) {
	var scratchItems = scratchItems ? scratchItems : globalVar.slide.$dom.find('.scratch__js');
	var settings = settings ? settings : globalVar.slide.data.scratch;

	scratchItems.each(function (i, scratchItem) {
		var itemID = scratchItem.id || i + 1;
		var itemSettings = settings.items[itemID];

		itemSettings.completed = false;

		resizeCanvas(scratchItem, settings, itemSettings);
	});
}

function allScratched(itemsObj, settings) {
	for (var item in itemsObj) {
		var itemSettings = itemsObj[item];

		if (settings.lottoMode) {
			if (itemSettings.lottoWinner && !itemSettings.completed) return false;
		} else if (!itemSettings.completed) return false;
	}

	return true;
}
function readyToComplete(canvasElem, settings) {
	return percentComplete(canvasElem) > settings.percentageToComplete;
}
function scratchOff(canvasElem, canvas, e, settings) {
	var brushPos = getBrushPos(canvasElem, e.clientX, e.clientY);

	drawDot(canvasElem, canvas, brushPos, settings.brushSize);
}
function percentComplete(canvas) {
	var data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
	var dataArr = makeTrueArray(data);
	var blankness = dataArr.reduce((accumulator, currentValue) => accumulator + (currentValue === 0 ? 1 : 0));

	return (blankness * 100) / data.length;
}
function getBrushPos(canvasElem, xRef, yRef) {
	var canvasRect = canvasElem.getBoundingClientRect();
	return {
		x: Math.floor(((xRef - canvasRect.left) / (canvasRect.right - canvasRect.left)) * canvasElem.width),
		y: Math.floor(((yRef - canvasRect.top) / (canvasRect.bottom - canvasRect.top)) * canvasElem.height)
	};
}
function clearCanvas(canvasElem, canvas) {
	canvas.beginPath();
	canvas.rect(0, 0, canvasElem.width, canvasElem.height);
	canvas.fillStyle = '#000';
	canvas.fill();
}
function drawDot(canvasElem, canvas, brushPos, brushSize) {
	canvas.beginPath();
	canvas.arc(brushPos.x, brushPos.y, calcBrushSize(canvasElem.width, brushSize), 0, 2 * Math.PI, true);
	canvas.fillStyle = '#000';
	canvas.globalCompositeOperation = 'destination-out';
	canvas.fill();

	// var img = document.getElementById('stroke');
	// canvas.translate(brushPos.x + 20, brushPos.y + 10);
	// canvas.rotate((2 * Math.PI) / 180);
	// canvas.translate((brushPos.x + 20) * -1, (brushPos.y + 10) * -1);
	// canvas.drawImage(img, brushPos.x, brushPos.y, 40, 20);
}
function resizeCanvas(scratchItem, settings, itemSettings) {
	var canvasElem = itemSettings.canvasElem;
	var canvas = itemSettings.canvas;

	$(canvasElem).css('top', scratchItem.offsetTop);
	$(canvasElem).css('left', scratchItem.offsetLeft);
	canvas.canvas.width = scratchItem.offsetWidth;
	canvas.canvas.height = scratchItem.offsetHeight;

	if (!itemSettings.completed) resetCanvas(settings, itemSettings);
}
function resetCanvas(settings, itemSettings) {
	var canvasElem = itemSettings.canvasElem;
	var canvas = itemSettings.canvas;
	var fillColor = itemSettings.fillColor || settings.fillColor;
	var fillImg = itemSettings.fillImg || settings.fillImg;

	canvasFillColor(canvasElem, canvas, fillColor);
	if (fillImg) canvasImg(canvasElem, canvas, fillImg, settings, itemSettings);
}
function detectLeftButton(event) {
	if ('buttons' in event) {
		return event.buttons === 1;
	} else if ('which' in event) {
		return event.which === 1;
	} else {
		return event.button === 1;
	}
}
function calcBrushSize(canvasWidth, brushSize) {
	return (canvasWidth / 100) * brushSize;
}
function winningScratch(lottoAnswers, itemID) {
	return lottoAnswers.some(function (id) {
		return id === itemID;
	});
}

function canvasFillColor(canvasElem, canvas, color) {
	canvas.beginPath();
	canvas.rect(0, 0, canvasElem.width, canvasElem.height);
	canvas.fillStyle = color;
	canvas.globalCompositeOperation = 'source-over';
	canvas.fill();
}

function canvasImg(canvasElem, canvas, imgPath, settings, itemSettings) {
	var img = new Image();

	canvas.drawImage(img, 10, 10);

	img.onload = function () {
		var measurements = calcMeasurements(canvasElem, img, settings, itemSettings);

		canvas.drawImage(img, measurements.x, measurements.y, measurements.width, measurements.height);
	};

	img.src = imgPath;
}

function calcMeasurements(canvasElem, img, settings, itemSettings) {
	var x, y;

	var pos = parsePositioning(canvasElem, settings, itemSettings);
	var padding = parsePadding(canvasElem, settings.padding, itemSettings.padding);
	var desiredDimensions = parseDimensions(canvasElem, img, settings, itemSettings);
	var availableDimensions = {
		width: canvasElem.width - (padding.right + padding.left),
		height: canvasElem.height - (padding.top + padding.bottom)
	};
	var combinedDimensions = combineDimensions(availableDimensions, desiredDimensions);
	var dimensions = calcWidthHeight(combinedDimensions.width, combinedDimensions.height, img);

	x = parsePosition(pos.left, calcMiddle(availableDimensions.width, dimensions.width) + padding.left);
	y = parsePosition(pos.top, calcMiddle(availableDimensions.height, dimensions.height) + padding.top);

	return {
		x: x,
		y: y,
		height: dimensions.height,
		width: dimensions.width
	};
}

function parsePositioning(canvasElem, settings, itemSettings) {
	var topPercentage = parsePosition(itemSettings.top, settings.top);
	var leftPercentage = parsePosition(itemSettings.left, settings.left);

	return {
		top: topPercentage !== undefined ? canvasElem.height * (topPercentage / 100) : undefined,
		left: leftPercentage !== undefined ? canvasElem.width * (leftPercentage / 100) : undefined
	};
}
function parsePosition(pos1, pos2) {
	if (pos1 !== undefined) {
		return pos1;
	} else if (pos2 !== undefined) {
		return pos2;
	} else return undefined;
}

function combineDimensions(availableDimensions, desiredDimensions) {
	return {
		width:
			desiredDimensions.width <= availableDimensions.width ? desiredDimensions.width : availableDimensions.width,
		height:
			desiredDimensions.height <= availableDimensions.height
				? desiredDimensions.height
				: availableDimensions.height
	};
}

function parseDimensions(canvasElem, img, settings, itemSettings) {
	var dimensions;
	var width = itemSettings.width || settings.width;
	var height = itemSettings.height || settings.height;

	if (!width && !height) {
		dimensions = { width: canvasElem.width, height: canvasElem.height };
	} else if (width && !height) {
		var desiredWidth = canvasElem.width * (width / 100);
		dimensions = resizeDimension(desiredWidth, img);
	} else if (height && !width) {
		var desiredHeight = canvasElem.height * (height / 100);
		dimensions = resizeDimension(desiredHeight, img);
	} else {
		dimensions = { width: width, height: height };
	}
	return dimensions;
}

function resizeDimension(desiredDimension, img) {
	var dimensions = {};
	var percentageLarger = calcPercentageLarger(desiredDimension, img.width);

	if (percentageLarger > 0) {
		dimensions.width = decreaseByPercentage(img.width, percentageLarger);
		dimensions.height = decreaseByPercentage(img.height, percentageLarger);
	} else {
		dimensions.width = -increaseByPercentage(img.width, percentageLarger);
		dimensions.height = -increaseByPercentage(img.height, percentageLarger);
	}

	return dimensions;
}

function calcWidthHeight(availableWidth, availableHeight, img) {
	var dimensions = {};
	var percentageWider = calcPercentageLarger(availableWidth, img.width);
	var percentageTaller = calcPercentageLarger(availableHeight, img.height);

	if (percentageWider > 0 && percentageTaller > 0) {
		var greaterPercentage = percentageTaller > percentageWider ? percentageTaller : percentageWider;
		dimensions.width = decreaseByPercentage(img.width, greaterPercentage);
		dimensions.height = decreaseByPercentage(img.height, greaterPercentage);
	} else if (percentageWider > 0) {
		dimensions.width = decreaseByPercentage(img.width, percentageWider);
		dimensions.height = decreaseByPercentage(img.height, percentageWider);
	} else if (percentageTaller > 0) {
		dimensions.width = decreaseByPercentage(img.width, percentageTaller);
		dimensions.height = decreaseByPercentage(img.height, percentageTaller);
	} else {
		var smallerPercentage = percentageTaller < percentageWider ? percentageTaller : percentageWider;
		dimensions.width = -increaseByPercentage(img.width, smallerPercentage);
		dimensions.height = -increaseByPercentage(img.height, smallerPercentage);
	}

	return dimensions;
}

function calcPercentageLarger(num1, num2) {
	return ((num2 - num1) / num2) * 100;
}
function decreaseByPercentage(num, percentage) {
	return num - (num / 100) * percentage;
}
function increaseByPercentage(num, percentage) {
	return num + (num / 100) * percentage;
}
function calcMiddle(num1, num2) {
	return num1 / 2 - num2 / 2;
}
function parsePadding(canvasElem, masterPadding, itemPadding) {
	var paddingToParse = itemPadding || masterPadding;
	var padding;

	var paddingArr = paddingToParse.split(' ').map(function (pad) {
		return parseInt(pad) / 100;
	});
	switch (paddingArr.length) {
		case 2:
			padding = {
				top: canvasElem.height * paddingArr[0],
				right: canvasElem.width * paddingArr[1],
				bottom: canvasElem.height * paddingArr[0],
				left: canvasElem.width * paddingArr[1]
			};
			break;
		case 3:
			padding = {
				top: canvasElem.height * paddingArr[0],
				right: canvasElem.width * paddingArr[1],
				bottom: canvasElem.height * paddingArr[2],
				left: canvasElem.width * paddingArr[1]
			};
			break;
		case 4:
			padding = {
				top: canvasElem.height * paddingArr[0],
				right: canvasElem.width * paddingArr[1],
				bottom: canvasElem.height * paddingArr[2],
				left: canvasElem.width * paddingArr[3]
			};

			break;
		default:
			padding = {
				top: canvasElem.height * paddingArr[0],
				right: canvasElem.width * paddingArr[0],
				bottom: canvasElem.height * paddingArr[0],
				left: canvasElem.width * paddingArr[0]
			};

			break;
	}
	return padding;
}

//////////////////*Feature:Sortables/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function sortFunctions() {
	var slide = globalVar.slide;
	// first visit setup
	// assigns original positions in order to make reset work
	var { data } = slide;
	if (checkLockSubmitIfUnattempted(data)) lockButtonNowUnlockOnExit($('#si-submit'), slide.data);
	if (slide.data.visited === false) {
		var $sortables = globalVar.$curSlide.find('.sortable');
		$sortables.each(function (idx, sortable) {
			var id = sortable.id;

			// initialize sortables with or without options
			if (slide.data.sort.sortables[id]) {
				if (slide.data.sort.sortables[id].options) {
					$(sortable).sortable(slide.data.sort.sortables[id].options);
				} else {
					$(sortable).sortable();
				}

				//makes beginning order default answer if no answer is given
				if (!slide.data.sort.sortables[id].answer) {
					slide.data.sort.sortables[id].answer = $(sortable).sortable('toArray');
				}
			} else {
				$(sortable).sortable();
				$(sortable).on('click', function () {
					unlock($('#si-submit'));
				});
			}

			var sortableElements = $('#' + id + '> div');
			// necessary to make a copy otherwise reassigning one of the data elements overwrites the other
			var shuffleElements = $('#' + id + '> div');

			// This handles keyboard accessibility for sortables

			sortableElements.each(function (idx, sort) {
				sortKeyboard(sort, sortable);
			});

			$(sortable).data({
				elements: sortableElements,
				shuffle: shuffleElements
			});
		});
	}

	// randomizes placement of divs every time the slide is entered
	if (slide.data.sort.randomize === true) {
		var $sortables2 = globalVar.$curSlide.find('.sortable');
		$sortables2.each(function (idx, sortable) {
			var elements = $(sortable).data('elements');
			var shuffleArr = [];

			// create an array of unique random numbers to serve as indices
			while (shuffleArr.length < elements.length) {
				var num = Math.floor(Math.random() * elements.length);
				// tests that the num variable has not already been added to the array
				if (
					!shuffleArr.some(function (el) {
						return el === num;
					})
				) {
					shuffleArr.push(num);
				}
			}

			// use the array of random numbers to reassign elements in the shuffle data attribute
			for (var i = 0; i < elements.length; i++) {
				$(sortable).data('shuffle')[i] = $(sortable).data('elements')[shuffleArr[i]];
			}
		});
	}

	// randomizes across connected lists
	if (slide.data.sort.randomizeConnect && typeof slide.data.sort.randomizeConnect === 'string') {
		var lists = $('.' + slide.data.sort.randomizeConnect);
		var elementArr = [];
		var shuffled = [];
		lists.each(function (idx, list) {
			$(list)
				.find('div')
				.each(function (idx2, div) {
					elementArr.push(div);
				});
		});

		while (elementArr.length) {
			var num = Math.floor(Math.random() * elementArr.length);
			element = elementArr.splice(num, 1);
			shuffled.push(element[0]);
		}

		var i = 0;
		while (shuffled.length) {
			lists.each(function (idx, list) {
				$(list).data('shuffle')[i] = shuffled.shift();
			});
			i++;
		}
	}

	resetSort();
}

// reset works for both randomized and non-randomized sort slides.  you do not need to put the randomize key if you don't need it.
// reset will either reset to the html order of divs or to the current randomized order
function resetSort() {
	var slide = globalVar.slide;
	var $sortables = globalVar.$curSlide.find('.sortable');
	$sortables.each(function (idx, sortable) {
		if (slide.data.sort.randomizeConnect) {
			$(sortable).append($(sortable).data('shuffle'));
		} else if (slide.data.sort.randomize === false || slide.data.sort.randomize === undefined) {
			$(sortable).append($(sortable).data('elements'));
		} else {
			$(sortable).append($(sortable).data('shuffle'));
		}
	});

	var { data } = slide;
	if (checkLockSubmitIfUnattempted(data)) lockButtonNowUnlockOnExit($('#si-submit, #si-custom-submit'), data);
}

// accessibility function
function sortKeyboard(sortItem, sortList) {
	var connected = $(sortList).sortable('option', 'connectWith');

	$(sortItem)
		.attr('tabindex', 0)
		.on('keydown', function (event) {
			if (event.which === 87 || event.which === 65) {
				// left or up one space ('w', 'a')
				$(this).insertBefore($(this).prev());
			}
			if (event.which === 83 || event.which === 68) {
				// right or down one space ('s','d')
				$(this).insertAfter($(this).next());
			}
			if (event.which === 81) {
				// "q" top of list
				$(this).parent().prepend($(this));
			}
			if (event.which === 69) {
				// "e" bottom of list
				$(this).parent().append($(this));
			}
			if (connected && event.which === 88) {
				// 'x' move item to connected lists
				var newLists = [];
				var parentIndex;
				$(connected).each(function (idx, list) {
					if (!$(list).find(event.target)[0]) {
						newLists.push(list);
					} else {
						parentIndex = idx;
					}
				});
				if (newLists[parentIndex]) {
					$(newLists[parentIndex]).append($(this));
				} else {
					$(newLists[0]).append($(this));
				}
			}
			$(this).focus();
		});
}

////////////*Feature:Multiple Choice/Single Choice Questions///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function resetQuiz() {
	var { data, $dom } = globalVar.slide;
	var choices = $dom.find('.si-quiz__js li');
	choices.removeClass('si-quiz-selected');

	if (checkLockSubmitIfUnattempted(data)) lockButtonNowUnlockOnExit($('#si-submit, #si-custom-submit'), data);
}
function initQuiz() {
	eachSlide(({ id, data, $dom }) => {
		if (data.type !== 'quiz') return;

		if (data.quiz.radio === 'undefined') data.quiz.radio = false;
		else if (data.quiz.radio) $(`#${id} .si-quiz__js`).addClass('si-radio__js');
	});

	var quizzes = $('.si-quiz__js');
	var buttonType = globalVar.buttonType;
	quizzes.each(function (idx, quiz) {
		var $choices = $(quiz).find('li');
		var buttons = $(quiz).find('div');
		var isRadio = $(quiz).hasClass('si-radio__js') ? true : false;
		$choices.each(function (idx, choice) {
			$(choice).addClass('si-quiz-answer').attr('tabindex', '0');
			$(choice).on('click.quiz', function () {
				quizHandleAnswerSelected($(this), $(quiz), $choices, isRadio);
			});
			$(choice).on('keyup.quiz', function () {
				if (event.which === 13) {
					quizHandleAnswerSelected($(this), $(quiz), $choices, isRadio);
				}
			});
		});
		buttons.each(function (idx, button) {
			var image = $(button).children().eq(0);
			if (isRadio) {
				$(image).attr('src', function (index, attr) {
					return attr.replace('mcq', 'scq');
				});
			} else {
				$(image).attr('src', function (index, attr) {
					return attr.replace('scq', 'mcq');
				});
			}

			$(button)
				.find('img')
				.attr('src', function (index, attr) {
					return attr.replace('classic', buttonType);
				});
		});
	});
}
function quizFunction() {
	var slide = globalVar.slide;
	var answers = slide.data['quiz']['answers'];
	var $choices = slide.$dom.find('.si-quiz__js li');

	var { data } = slide;
	if (checkLockSubmitIfUnattempted(data)) lockButtonNowUnlockOnExit($('#si-submit'), slide.data);

	if (!slide.data['visited'] && globalVar.devMode) {
		$choices.each(function (idx, choice) {
			if (answers[$(choice).attr('id')]) {
				$(choice).css('color', 'blue');
			}
		});
	} else {
		resetQuiz();
	}
}

function handleSubmitAccess(selectedAnswers, $submit) {
	var $submit = $submit ? $submit : $('#si-submit');
	if (selectedAnswers.length > 0) unlock($submit);
	else lock($submit);
}

function quizHandleAnswerSelected($selectedAnswer, $quiz, $choices, isRadio) {
	siAudio.sfx.click.play();
	if (isRadio) {
		$choices.removeClass('si-quiz-selected');
	}
	if ($selectedAnswer.hasClass('si-quiz-selected')) {
		$selectedAnswer.removeClass('si-quiz-selected');
	} else {
		$selectedAnswer.addClass('si-quiz-selected');
	}

	handleSubmitAccess($quiz.find('.si-quiz-selected'), $('#si-submit'));
}

function formFunctions({ id, data, $dom } = globalVar.slide, $form = $dom.find('form')) {
	if (!data.visited) formInit({ id, data, $dom }, $form);
	else formReset();
}
function formReset({ id, data, $dom } = globalVar.slide, $form = $dom.find('form')) {
	$form[0].reset();
}

function formInit({ id, data, $dom } = globalVar.slide, $form = $dom.find('form')) {
	if (!data.form.dontGenerate) generateForm({ id, data, $dom }, $form);

	var hasSubmit = !!$form.find('input[type=submit]').length;

	$form.addClass('form-style');
	$form.trigger('reset');

	if (!hasSubmit) $form.append('<input type="submit"/>');

	$form.on('submit.req-form', function (e) {
		e.preventDefault();
	});

	var inputs = $form.find('input');

	inputs.keyup(function () {
		var $this = $(this);
		var characters = $this.val().length;
		var maxLength = $this.attr('maxLength');
		var lastInput = $this.next().hasClass('checkbox');

		if (characters == maxLength && !lastInput) {
			$this.next().focus();
		}
	});

	inputs.keydown(function (e) {
		if ((e.which == 8 || e.which == 46) && $(this).val() == '') {
			$(this).prev('input').focus();
		}
	});
}

function checkForm({ $dom, data } = globalVar.slide) {
	var { fields, debug } = data.form;

	for (var key in fields) {
		var {
			[key]: { caseSensitive, answer, type, className }
		} = fields;

		var inputs = $dom.find('.' + className);
		var result = '';
		var userAnswer = '';

		if (answer) {
			if (type === 'checkbox') {
				var selectedAnswer = inputs.filter(':checked')[0];

				if (selectedAnswer) userAnswer = selectedAnswer.value;
			} else {
				inputs.each(function (i, input) {
					userAnswer += input.value;
				});
			}
			if (!caseSensitive) {
				answer = answer.toLowerCase();
				userAnswer = userAnswer.toLowerCase();
			}

			result = userAnswer === answer;

			if (debug) {
				console.log(
					`${key.toUpperCase()}\nUser Answer: ${userAnswer}\nActual Answer: ${answer}\nResult: ${result}`
				);
			}
			if (!result) {
				return false;
			}
		}
	}
	return true;
}

function validForm({ $dom } = globalVar.slide) {
	var valid = true;
	var requiredFields = $dom.find('input,textarea,select').filter('[required]');

	requiredFields.each((i, { value }) => {
		if (value === '') {
			valid = false;

			$dom.find('form').find('input[type=submit]').trigger('click');

			return false;
		}
	});
	return valid;
}

function generateForm({ id, data, $dom } = globalVar.slide, $form = $dom.find('form')) {
	var { fields } = data.form;

	$form.html('');

	for (var key in fields) {
		var field = fields[key];
		var { className, type, label } = field;

		var fieldID = id.toLowerCase() + '-' + className;

		if (label) {
			var labelElem = document.createElement('label');

			labelElem.htmlFor = fieldID;

			$(labelElem).text(label);

			$form.append(labelElem);
		}
		// establish type
		switch (type) {
			case 'checkbox':
				var { options, optional, style, labels } = field;

				options.forEach(function (option) {
					var optionLabel = option.toLowerCase().split(' ').join('-');
					var radio = document.createElement('input');
					var radioLabel = document.createElement('label');

					radioLabel.htmlFor = className + '-' + optionLabel;

					$(radioLabel).addClass(className + '-container radio-container');

					radio.setAttribute('type', 'radio');
					radio.id = className + '-' + optionLabel;
					radio.required = !optional;
					radio.name = className;
					radio.value = option;

					$(radio).addClass(className);

					$form.append(radioLabel);
					$(radioLabel).append(radio);

					if (style) {
						var customCheck = document.createElement('span');

						$(radio).addClass('hide-radio');
						$(customCheck).addClass('custom-checkmark');
						$(radioLabel).append(customCheck);

						switch (style) {
							case 'x':
								$(radioLabel).addClass(className + '-style x-style');
								break;
							case 'dot':
								$(radioLabel).addClass(className + '-style dot-style');
								break;
							case 'button':
								$(radioLabel).addClass(className + '-style button-style');
								break;
						}
					}

					if (labels) {
						var sLabel = document.createElement('span');

						$(sLabel).addClass(className + '-option-label');

						$(sLabel).text(option);

						$(radioLabel).append(sLabel);
					}
				});
				break;
			case 'dropdown':
				var { options, optional, placeholder, hideIcon } = field;

				var dropdown = document.createElement('select');

				dropdown.id = fieldID;
				dropdown.required = !optional;

				$(dropdown).addClass(className + ' ' + className + '-style');
				$(dropdown).append('<option value="">' + (placeholder ? placeholder : 'Select One') + '</option>');

				options.forEach(function (option) {
					$(dropdown).append('<option value="' + option + '">' + option + '</option>');
				});

				if (hideIcon) $(dropdown).addClass('hidden-icon');

				$form.append(dropdown);
				break;
			case 'date':
				var { optional, hideIcon, min, max } = field;

				var dateInput = document.createElement('input');

				dateInput.setAttribute('type', 'date');

				dateInput.required = !optional;
				dateInput.id = fieldID;

				if (min) dateInput.min = min;
				if (max) dateInput.max = max;
				if (hideIcon) $(dateInput).addClass('hidden-icon');

				$(dateInput).addClass(className + ' ' + className + '-style');

				$form.append(dateInput);
				break;
			case 'number':
				var { optional, placeholder, hideIcon, min, max, step } = field;

				var numberInput = document.createElement('input');

				numberInput.setAttribute('type', 'number');
				numberInput.required = !optional;
				numberInput.id = fieldID;

				if (min) numberInput.min = min;
				if (max) numberInput.max = max;
				if (step) numberInput.step = step;
				if (hideIcon) $(numberInput).addClass('hidden-icon');
				if (placeholder) numberInput.placeholder = placeholder;

				$(numberInput).addClass(className + ' ' + className + '-style');

				$form.append(numberInput);
				break;
			default:
				var { separate, optional, placeholder, answer, maxLength } = field;

				// create field
				if (!separate) {
					var textInput = document.createElement('input');

					textInput.setAttribute('type', 'text');
					textInput.required = !optional;
					textInput.id = fieldID;

					if (maxLength) textInput.maxLength = maxLength;
					if (placeholder) textInput.placeholder = placeholder;

					$(textInput).addClass(className + ' ' + className + '-style');

					$form.append(textInput);
				} else {
					// separate fields per letter
					for (var i = 0; i < answer.length; i++) {
						var textInput = document.createElement('input');

						if (i === 0) textInput.id = fieldID;

						textInput.setAttribute('type', 'text');
						textInput.maxLength = 1;
						textInput.required = !optional;

						$(textInput).addClass(
							className + ' ' + className + '-style ' + className + '-' + (i + 1) + '-style separated'
						);

						$form.append(textInput);
					}
				}
				break;
		}
	}
}

var chapterNavigationSlides = ['v1', 'i1', 'i2', 'i3'];
var chapterCompletionSlides = ['v1', 'i1', 'i2', 'i3'];

function initSideMenu() {
	var $menu = $('#si-side-menu');
	var $container = $('#si-side-menu-container');
	var buttons = $('.si-menu-navigation').find('button');

	$menu.on('click.stop', function (e) {
		e.stopPropagation();
	});
	$container.on('click.side', function (e) {
		closeSideMenu();
	});

	buttons.each(function (idx, button) {
		$(button).on('click.side', function () {
			var id = chapterNavigationSlides[idx];
			jumpToId(id);
			closeSideMenu();
		});
	});
}

function openSideMenu() {
	var slide = globalVar.slide;

	var $menu = $('#si-side-menu');
	var $container = $('#si-side-menu-container');

	$container.addClass('menu-open');
	$menu.addClass('menu-open');
	// this is for pausing the video when you open the side menu
	var type = slide.data.type;
	if (slide.data.videoLoaded && type == 'video') {
		videojs(globalVar.$curSlide.find('video')[0].id).pause();
	}

	handleSideButtons();
}

function closeSideMenu() {
	var slide = globalVar.slide;
	var $menu = $('#si-side-menu');
	var $container = $('#si-side-menu-container');

	$container.removeClass('menu-open');
	$menu.removeClass('menu-open');
	// unpause the video when you close the side menu
	var type = slide.data.type;
	if (slide.data.videoLoaded && type == 'video') {
		if (videojs(globalVar.$curSlide.find('video')[0].id).paused()) {
			videojs(globalVar.$curSlide.find('video')[0].id).play();
		}
	}
}

function handleSideButtons() {
	var buttons = $('.si-menu-navigation').find('button');
	var checks = $('.si-menu-checks__js');

	lock($(buttons));
	unlock($(buttons[0]));
	buttons.each(function (idx, button) {
		if (getCompletionStatus(chapterCompletionSlides[idx])) {
			$(checks[idx]).addClass('completed');
			if (buttons[idx + 1]) {
				unlock($(buttons[idx + 1]));
			}
		}
	});
}

function initNavigation() {
	var swapStyles = $('.si-nav-style__js');
	var swapImages = $('.si-img-swap__js');
	var buttonType = globalVar.buttonType;

	// swap all style related images
	swapImages.each(function (idx, image) {
		$(image).attr('src', function (index, attr) {
			return attr.replace('classic', buttonType);
		});
	});
	swapStyles.each(function (idx, nav) {
		$(nav).addClass('si-nav-style-' + buttonType);
	});

	attachNavEventListeners();
}

function showNavElements() {
	var slide = globalVar.slide;
	var navButtons = $('.si-nav__js');
	var navigation = slide.data.navElements || [];

	$(navButtons).hide();

	navigation.forEach(function (nav) {
		switch (nav) {
			case 'start-slide':
				$('#si-clock').show();
				$('#si-start').show();
				$('#si-mute').show();
				break;
			case 'standard-home':
				$('#si-logo').show();
				$('#si-progress').show();
				$('#si-home').show();
				$('#si-back').show();
				if (getCompletionStatus()) {
					$('#si-next').show();
				}
				break;
			case 'video-home':
				// $('#si-logo').show();
				// $('#si-progress').show();
				$('#si-home').show();
				$('#si-back').show();
				// $('#si-mute').show();
				if (getCompletionStatus()) {
					$('#si-next').show();
				}
				break;
			case 'standard-menu':
				$('#si-logo').show();
				$('#si-progress').show();
				$('#si-menu').show();
				$('#si-back').show();
				$('#si-mute').show();
				if (getCompletionStatus()) {
					$('#si-next').show();
				}
				break;
			case 'video-menu':
				// $('#si-logo').show();
				// $('#si-progress').show();
				$('#si-menu').show();
				$('#si-back').show();
				// $('#si-mute').show();
				if (getCompletionStatus()) {
					$('#si-next').show();
				}
				break;
			case 'exit-slide':
				$('#si-progress').show();
				$('#si-exit').show();
				$('#si-replay').show();
				$('#si-mute').show();
				break;
			default:
				if (nav.indexOf('icon') !== -1) iconActions(nav);
				else if (nav[0] === '!') $('#si-' + nav.split('!')[1]).hide();
				else $('#si-' + nav).show();
				break;
		}
	});

	function iconActions(navStr) {
		var navData = navStr.split('*');

		var nav = navData[0];
		var multiplier = parseInt(navData[1]) || 1;

		var slideID = globalVar.slide.id;
		var iconTemplate = $($('.si-helper-icon')[0]);

		for (var i = 0; i < multiplier; i++) {
			var $icon = iconTemplate.clone();

			$icon
				.appendTo('#si-nav-container')
				.show()
				.addClass('si-' + nav)
				.addClass('si-' + nav + '-' + (i + 1));

			hideClickIcon($icon, slideID, i);
		}
	}
}

function attachNavEventListeners() {
	$('#si-home').on('click touch', function () {
		siAudio.sfx.click.play();
		jumpToSlide(globalVar.homeSlide);
	});

	$('#si-mute').on('click touch', function () {
		siAudio.sfx.click.play();
		toggleMute();
	});

	$('#si-menu').on('click touch', function () {
		siAudio.sfx.click.play();
		openSideMenu();
	});

	$('#si-full').on('click touch', function () {
		siAudio.sfx.click.play();
		toggleFullscreen();
	});

	$('#si-back').on('click touch', function () {
		siAudio.sfx.click.play();
		setTimeout(function () {
			slideAction(globalVar.slide.id, 'backAction');
		}, 100);
	});

	$('#si-next').on('click touch', function () {
		siAudio.sfx.click.play();
		setTimeout(function () {
			slideAction(globalVar.slide.id, 'nextAction');
		}, 100);
	});

	$('#si-replay').on('click touch', function () {
		siAudio.sfx.click.play();
		jumpToSlide(0);
	});

	$('#si-exit').on('click touch', function () {
		siAudio.sfx.click.play();
		window.top.close();
	});

	$('#si-start').on('click touch', function () {
		siAudio.sfx.click.play();
		slideAction(globalVar.slide.id, 'nextAction');
	});

	$('#si-submit').on('click touch', function () {
		var slideObj = globalVar.slide.data;

		if (slideObj.type === 'form' && !validForm()) return;

		siAudio.sfx.click.play();
		var bol = checkQuestion(slideObj.type);
		handleAnswer(bol);
	});

	$('#si-reset').on('click touch', function () {
		var slide = globalVar.slide;
		var type = slide.data.type;

		siAudio.sfx.click.play();
		switch (slide.data.type) {
			case 'dnd':
				resetDnd();
				break;
			case 'sort':
				resetSort();
				break;
			case 'quiz':
				resetQuiz();
				break;
			case 'hotspot':
				var $hotspots = slide.$dom.find(' .hotspot-button__js');

				resetHotspot(slide.data.hotspot, $hotspots, getHotspotModals($hotspots.length));
				break;
			case 'scratch':
				resetScratch();
				break;
			case 'form':
				formReset();
				break;
			default:
				if (slide.data.customReset) {
					slide.data.customReset();
				}
		}
		if (slide.data[type].customReset) {
			slide.data[type].customReset();
		}
	});
	$('#si-custom-submit').on('click touch', function () {
		var slideObj = globalVar.slide.data;

		if (slideObj.type === 'form' && !validForm()) return;

		siAudio.sfx.click.play();
		if (slideObj.customSubmit) {
			slideObj.customSubmit();
		}
	});

	$('.si-menu-closer').on('click touch', function () {
		closeSideMenu();
	});
}

function hideClickIcon($icon, slideID, i) {
	var $slide = $('#' + slideID);

	$slide.off('mousedown.icon' + i);
	$slide.on('mousedown.icon' + i, function () {
		$icon.remove();
		$slide.off('mousedown.icon');
	});

	addToFunctionKey(slides[slideID], 'onExitAction', function () {
		if ($icon) $icon.remove();
	});
}

// function used by fullscreen nav button
function toggleFullscreen() {
	var element = document.documentElement;
	var fullscreen =
		document.fullscreenElement ||
		document.mozFullScreenElement ||
		document.msFullscreenElement ||
		document.webkitFullscreenElement;
	if (fullscreen) {
		var requestMethod =
			document.exitFullscreen ||
			document.webkitExitFullscreen ||
			document.webkitExitFullScreen ||
			document.mozCancelFullScreen ||
			document.msExitFullscreen;

		if (requestMethod) {
			requestMethod.apply(document);
		}
	} else {
		var requestMethod =
			element.requestFullscreen ||
			element.webkitRequestFullscreen ||
			element.webkitRequestFullScreen ||
			element.mozRequestFullScreen ||
			element.msRequestFullscreen;

		if (requestMethod) {
			requestMethod.apply(element);
		}
	}
}

function toggleMute() {
	if (globalVar.muted === undefined) {
		globalVar.muted = false;
	}

	var muted = globalVar.muted;
	var $muteButton = $('#si-mute');

	// If the course is already muted, we want to turn 'mute' off
	if (muted) {
		$muteButton.removeClass('muted');
		globalVar.muted = false;
		muteAudio(false);
		muteVideo(false);
	}
	// If the course is not muted, we want to turn 'mute' on
	else {
		$muteButton.addClass('muted');
		globalVar.muted = true;
		muteAudio(true);
		muteVideo(true);
	}
}

function muteAudio(muteIt) {
	if (muteIt === true) {
		console.log('Muting audio.');
		Howler.mute(true);
	} else {
		console.log('Unmuting audio.');
		Howler.mute(false);
	}
}

function muteVideo(muteIt) {
	var allVideoPlayers = videojs.getAllPlayers();

	if (muteIt === true) {
		console.log('Muting video.');
		// Make sure that all players that are not yet initialized will get set to muted by default
		videojs.options.muted = true;
		// Find all initialized players and mute them
		allVideoPlayers.forEach(function (player) {
			player.muted(true);
		});
	} else {
		console.log('Unmuting video.');
		// Make sure that all players that are not yet initialized will NOT get set to muted by default
		videojs.options.muted = false;
		// Find all initialized players and unmute them
		allVideoPlayers.forEach(function (player) {
			player.muted(false);
		});
	}
}

// function infoKeyboard() {
//     var infoItems = $('.infoItem');
//     var idx = 0;
//     $('#Info_Closer').focus();

//     $('body').on('keydown.drag', function (event) {
//         switch (event.keyCode) {
//             case 9: //restricts tab movement to info overlay elements
//                 event.preventDefault();
//                 if (idx < infoItems.length - 1) {
//                     idx += 1;
//                 } else {
//                     idx = 0;
//                 }
//                 $(infoItems[idx]).focus();
//                 break;
//             case 27: // allows user to press escape key to return to normal
//                 $('#Info_Closer').trigger('click');
//                 break;
//             default:
//                 return true;
//         }
//     });
// }

var curChapter;
var saveData = {};
var chartProgressRecorded = {};
$(document).ready(function () {
	initCourse();
	documentSetup();
	chartProgress();
	if (!globalVar.devMode && (lmsConnected || globalVar.scormSettings.useLocal)) {
		jumpToSlide(saveData.bookmark);
	}
	// Elements to inject
	var mySVGsToInject = document.querySelectorAll('img.inject-me');
	// Do the injection. keep last!!!
	SVGInjector(mySVGsToInject);
});

function firstTimeSetup() {
	//first and only execution of code, when the course starts first time gives all slides a number and sets defaults for user attempts and trys

	handleMasterAndGroups();

	setModalDefaults();
	setDataDefaults();
	setCoinDefaults();
	setSlideCompletionDefaults();
	setClientTemplate();
	window.leaderlines = {};
}

function documentSetup() {
	initPreloader();
	setGlobalVars($('section' + '.present')[0].id);
	firstTimeSetup();
	initAudio();
	$('aside').remove();
	initNavigation();
	initSideMenu();

	if (globalVar.devMode) devMode();

	if ($('#si-progress-meter').length != 0) {
		chartInitiate();
	}
	initFeedbacks();
	initQuiz();
	initMenu();
	functionCalls();
	randomizeQuestionSlides();

	Reveal.addEventListener('slidechanged', function (e) {
		$('#si-nav-container').removeClass('vjs-fade-out');
		unlock($('#si-submit'));
		setGlobalVars(e.currentSlide.id);

		closeSideMenu();

		slideAction(e.previousSlide.id, 'onExitAction');
		e.previousSlide.id;
		functionCalls();
	});

	//set font sizes
	var fontSize = $('.slides').width() / globalVar.fontSizeFactor;
	$('html').css('font-size', fontSize);

	$(window).resize(function () {
		setTimeout(function () {
			var fontSize = $('.slides').width() / globalVar.fontSizeFactor;
			$('html').css('font-size', fontSize);
		}, 1);
	});

	$('img').on('dragstart', function (event) {
		event.preventDefault();
	});
}

function setGlobalVars(slideID) {
	// DEPRECIATED
	globalVar.curSlide = slideID;
	// DEPRECIATED
	globalVar.$curSlide = $('#' + slideID);

	globalVar.slide = getSlideHelpers(slideID);
}
function setClientTemplate() {
	if (globalVar.clientTemplate) {
		$('body').addClass('si-' + globalVar.clientTemplate);
		if (globalVar.clientTemplate === 'bms') {
			globalVar.buttonType = 'custom';
			globalVar.lockClosersDuringFeedbackVO = true;
			globalVar.lockSubmitIfUnattempted = true;
			globalVar.video.progressControl = false;
			$('#si-course-nav').prepend($('#si-logo'));
		}
		var logoPath = './media/imgs/_imgs/client-template/' + globalVar.clientTemplate + '-logo.svg';
		$('.si-logo-swap__js img').attr('src', logoPath);
		return true;
	} else {
		// console.log('No client template set')
		return false;
	}
}

function actionsOnEverySlideEnter() {
	//whatever you want to execute on every slide change
}

//execute whatever is inside onEnterAction, sets visited to true
function onEnterAction({ id: id, data: data, $dom: $dom }) {
	if (data.visited === undefined) {
		data.visited = false;
	}

	$('section:not(.present)').each(function (idx, slide) {
		$('body').removeClass(slide.id);
		if (slides[slide.id].styleLabel) $('body').removeClass(slides[slide.id].styleLabel);
	});

	$('body').addClass(id);
	if (data.styleLabel) $('body').addClass(data.styleLabel);

	$(document.activeElement).blur();
	if (siAudio[id].initial && data.visited === false) {
		if (siAudio.sfx.click.playing()) {
			siAudio.sfx.click.once('end', function () {
				Howler.stop();
				siAudio[id].initial.play();
			});
		} else {
			Howler.stop();
			siAudio[id].initial.play();
		}
	} else if (siAudio[id].onEnter) {
		if (siAudio.sfx.click.playing()) {
			siAudio.sfx.click.once('end', function () {
				Howler.stop();
				siAudio[id].onEnter.play();
			});
		} else {
			Howler.stop();
			siAudio[id].onEnter.play();
		}
	} else {
		if (siAudio.sfx.click.playing()) {
			siAudio.sfx.click.once('end', function () {
				Howler.stop();
			});
		} else {
			Howler.stop();
		}
	}

	setTimeout(function () {
		slideAction(id, 'onEnterAction');

		data.visited = true;
	}, 10);
	if (lmsConnected && data.slideNumber !== 1) {
		setTimeout(function () {
			saveLMS();
		}, 1000);
	}
	if (globalVar.scormSettings.useLocal && data.slideNumber !== 1) {
		saveProgressLocally();
	}
}

//Order of calling the functions to generate the current slide
function functionCalls() {
	$('body').off();

	setGlobalVars($('.slides > .present')[0].id);

	var slide = globalVar.slide;

	onEnterAction(slide);
	actionsOnEverySlideEnter();
	showNavElements();
	elementsFadingOnSlide(slide);

	switch (slide.data.type) {
		case 'menu':
			menuFunctions();
			break;
		case 'dnd':
			dndFunction();
			break;
		case 'sort':
			sortFunctions();
			break;
		case 'hotspot':
			hotspotFunctions();
			break;
		case 'form':
			formFunctions();
			break;
		case 'quiz':
			quizFunction();
			break;
		case 'scratch':
			scratchFunctions(slide);
			break;
		case 'video':
			videoCheck();
			break;
		default:
			break;
	}

	if ($('#si-progress-meter').length != 0) {
		chartProgress();
	}

	// IE9 Bugfix
	setTimeout(function () {
		$('section.future').css('display', 'none');
		$('section.past').css('display', 'none');
	}, 55);
}

////////////*Feature: Question Check ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// This function contains the main logic in determining if a question is right or wrong
// It determines the question type, runs the logic for that type and returns a boolean
// This boolean, called bol,  is fed as an argument to handleAnswer(bol) which is responsible for handling feedback responses

// To add unique logic for a custom type, extend the main switch statement, assign true or false to bol, then 'break'
function checkQuestion(type) {
	var slide = globalVar.slide;
	var bol = true;
	var bol2;
	switch (type) {
		case 'quiz':
			var correctAnswers = slide.data.quiz.answers;
			var selectedAnswers = {};
			var choices = slide.$dom.find('.si-quiz-answer');
			choices.each(function (idx, choice) {
				var id = $(choice).attr('id') || 'wrong' + idx;
				if ($(choice).hasClass('si-quiz-selected')) {
					selectedAnswers[id] = 1;
				} else {
					selectedAnswers[id] = 0;
				}
				if (!correctAnswers[id]) {
					correctAnswers[id] = 0;
				}
			});
			for (answer in selectedAnswers) {
				if (correctAnswers[answer] !== selectedAnswers[answer]) {
					bol = false;
					return bol;
				} else if (slide.data.coinSettings.earnByAnswerChoice) {
					if (selectedAnswers[answer] === 1) {
						addCoinForAnswer(answer);
					}
				}
			}
			if (!bol) {
				return bol;
			}
			break;
		case 'hotspot':
			bol = checkHotspot();
			if (!bol) return;

			break;
		case 'form':
			bol = checkForm();
			if (!bol) return;
			break;
		case 'dnd':
			bol = checkDnd();
			break;
		case 'sort':
			bol = true;
			var listArray = Object.keys(slide.data[type].sortables);
			var answerArray = [];
			listArray.forEach(function (list) {
				answerArray.push(slide.data[type].sortables[list].answer);
			});

			// check that answers have been provided for all sortable lists before proceeding
			if (listArray.length !== answerArray.length) {
				bol = false;
				return bol;
			}

			listArray.forEach(function (listId, idx) {
				var possibleAnswer = $('#' + listId).sortable('toArray');

				// Incorrect if the amount of items in the checked sortable does not match the amount of answers provided in the answer key
				if (possibleAnswer.length !== answerArray[idx].length) {
					bol = false;
					return bol;
				}

				// Excutes if unordered key is set to false or if key is absent
				// This branch is only correct if the submitted answer matches the answer key in both content AND order
				if (slide.data[type].unordered === false || slide.data[type].unordered === undefined) {
					possibleAnswer.forEach(function (answer, idx2) {
						if (answer !== answerArray[idx][idx2]) {
							bol = false;
							return bol;
						}
					});
					// Executes if unordered key is set to true.
					// This branch is correct if the submitted answer matches the answer key in content only. Order is irrelevant
				} else {
					possibleAnswer.forEach(function (answer) {
						if (
							!answerArray[idx].some(function (el) {
								return el === answer;
							})
						) {
							bol = false;
							return bol;
						}
					});
				}
			});
			break;
		default:
			bol = false;
			break;
	} //end switch
	return bol;
} //checkQuestion
//////////*Feature:Shuffled Slides/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function jumpToShuffledSlide(part) {
	var n = globalVar.shuffledSlides[part].pointer;
	if (n < globalVar.shuffledSlides[part].slides.length) {
		if (n == null) {
			//first time call
			n = 0;
		}
		jumpToSlide(globalVar.shuffledSlides[part].slides[n]);
		n++;
		globalVar.shuffledSlides[part].pointer = n;
	}
}

function resetShuffledSlide(part) {
	globalVar.shuffledSlides[part].pointer = null;
}

/////////*Feature:Randomize Questions//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function randomizeQuestionSlides() {
	if (globalVar.randomizeSlides.useRandomize == true) {
		var x = globalVar.randomizeSlides.slides;
		var n = [];
		if (Object.keys(x) != 0) {
			for (key in x) {
				n = [];
				if (x[key][0] < x[key][1]) {
					//1st value must be less than 2nd
					for (var i = x[key][0]; i <= x[key][1]; i++) {
						n.push(i);
					}
					shuffle(n);
					n.push(x[key][2]);
					globalVar.shuffledSlides[key] = {
						slides: n,
						pointer: null
					};
				}
			}
		}
	}
}

////////////*Feature:Fading///////////////////////////////////////////////////////////////////////////////////////////////////////////

function elementsFadingOnSlide({ id: id, data: data, $dom: $dom }) {
	if ($dom.find('[data-fadeInOrder]').length != 0) {
		var ary = [];
		$dom.find('[data-fadeInOrder]').each(function () {
			$(this).css('opacity', '0');
			$(this).css('display', 'none');
			$(this).hide();
			var temp = [];
			var str = $(this).data('fadeinorder');
			temp[0] = str;
			temp[1] = $(this)[0];
			ary.push(temp);
		});
		ary.sort(sortArrayMatrixFunction);
		for (var i = 0; i < ary.length; i++) {
			elementsFadeIn(ary[i][1], ary[i][0]);
		}
	}

	if ($dom.find('[data-fadeoutorder]').length != 0) {
		var ary = [];
		$dom.find('[data-fadeoutorder]').each(function () {
			$(this).css('opacity', '1');
			$(this).css('display', 'block');
			$(this).show();
			var temp = [];
			var str = $(this).data('fadeoutorder');
			temp[0] = str;
			temp[1] = $(this)[0];
			ary.push(temp);
		});
		ary.sort(sortArrayMatrixFunction);
		for (var i = 0; i < ary.length; i++) {
			elementsFadeOut(ary[i][1], ary[i][0]);
		}
	}
}

function elementsFadeIn(el, x) {
	setTimeout(function () {
		$(el).fadeTo('fast', 1);
	}, x);
}

function elementsFadeOut(el, x) {
	setTimeout(function () {
		$(el).fadeTo('fast', 0);
	}, x);
}

// ary.sort(sortArrayMatrixFunction); must be ary=[[4,xx],[2,xx],[1,xx]]
function sortArrayMatrixFunction(a, b) {
	if (a[0] === b[0]) {
		return 0;
	} else {
		return a[0] < b[0] ? -1 : 1;
	}
}

////////////*Feature:Miscellaneous///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//shuffle an array, returns shuffled array
// used in slide randomizer and mcq/scq randomizer
function shuffle(array) {
	var currentIndex = array.length,
		temporaryValue,
		randomIndex;
	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}

//adds equals/checks to see if arrays equal each other
Array.prototype.equals = function (array) {
	// if the other array is a falsy value, return
	if (!array) return false;

	// compare lengths - can save a lot of time
	if (this.length != array.length) return false;

	for (var i = 0, l = this.length; i < l; i++) {
		// Check if we have nested arrays
		if (this[i] instanceof Array && array[i] instanceof Array) {
			// recurse into the nested arrays
			if (!this[i].equals(array[i])) return false;
		} else if (this[i] != array[i]) {
			// Warning - two different object instances will never be equal: {x:20} != {x:20}
			return false;
		}
	}
	return true;
};
// Hide method from for-in loops
Object.defineProperty(Array.prototype, 'equals', {
	enumerable: false
});
const validGroups = group => group && group[0] !== null && group[0] !== undefined && group[0];

function handleMasterAndGroups() {
	eachSlide(function ({ id, data }) {
		var hasMaster = typeof masterSlide !== 'undefined';
		var groups = getGroups(data.groups);

		const hasGroup = groups[0] !== null && groups[0] !== undefined;

		if (hasGroup) {
			groups.reverse().forEach(function (group) {
				for (var setting in group) {
					copySettingFromTo(setting, group, data, id);
				}
			});
			groups.reverse();
		}
		if (hasMaster) {
			for (var setting in masterSlide) {
				copySettingFromTo(setting, masterSlide, data, id);
			}
		}
	});
}

function getGroups(groupInput) {
	const mainGroups = Array.isArray(groupInput) ? groupInput : [groupInput];
	let nestedGroups;

	if (!validGroups(mainGroups)) return [];

	nestedGroups = mainGroups
		.filter(group => group.groups)
		.map(group => {
			if (!Array.isArray(group.groups)) group.groups = [group.groups];
			return group;
		})
		.reduce((newArr, group) => newArr.concat(group.groups), []);

	return [].concat(getGroups(nestedGroups), mainGroups);
}

function copySettingFromTo(setting, fromObj, toObj, slideID, calledRecursively) {
	var isActionFunction = setting.indexOf('Action') >= 0 || setting.indexOf('customSubmit') >= 0;

	if (isActionFunction) return;

	var isTemplateFunction = typeof fromObj[setting] === 'function' && !calledRecursively;
	var fromSetting = isTemplateFunction ? fromObj[setting](getSlideHelpers(slideID)) : fromObj[setting];

	var notPreviouslySet = toObj[setting] === undefined;
	var notObject = typeof fromSetting !== 'object';

	if (notPreviouslySet) return (toObj[setting] = fromSetting);
	else if (Array.isArray(fromSetting)) return (toObj[setting] = fromSetting.concat(toObj[setting]));
	else if (notObject) return;

	for (var key in fromSetting) {
		copySettingFromTo(key, fromSetting, toObj[setting], slideID, true);
	}
}

function changeGroupSetting(group, setting, newValue) {}

function setModalDefaults() {
	moveModalsToModalContainer();
	prependModalCloserTo($('.si-modal__js'));
}

const moveModalsToModalContainer = function () {
	return $('section').find('.si-modal__js').appendTo($('.si-modal-container'));
};

const prependModalCloserTo = function ($modals) {
	return $modals
		.not('.no-closer')
		.not(function (_, modal) {
			return $(modal).find('.si-modal-closer__js').length > 0;
		})
		.prepend(
			'<button class="si-modal-closer si-modal-closer__js"><img class="si-img-swap__js inject-me" src="./media/imgs/navigation/classic/close-cross.svg" alt="" /></button>'
		);
};

function setDataDefaults() {
	eachSlide(function ({ data: data, id: id }, idx) {
		data.type = data.type || 'text';
		data[data.type] = data[data.type] || {};
		data[data.type].trys = data[data.type].trys || 0;
		data[data.type].userAttempts = data[data.type].userAttempts || 0;

		data.include = data.include === undefined ? true : false;
		data.slideNumber = data.slideNumber || idx + 1;

		if (data.type === 'video') globalVar.videoSeen[id] = false;
	});
}

function setCoinDefaults() {
	if (globalVar.earnCoins === true && !saveData.coinScore) saveData.coinScore = {};

	eachSlide(function ({ data: data, id: id }) {
		if (globalVar.earnCoins === true) {
			if (!saveData.coinScore[id]) saveData.coinScore[id] = {};
			if (data.coinSettings === undefined) {
				data.coinSettings = {};
				data.coinSettings.include = true;
			}
		}
	});
}

function setSlideCompletionDefaults() {
	eachSlide(function ({ data: data, id: id }) {
		if (!data.include) return;

		var slideCompletion = (saveData.slideCompletion = saveData.slideCompletion || {});

		if (data.completionPath) {
			if (Array.isArray(data.completionPath)) {
				data.completionPath.forEach(function (p, i) {
					slideCompletion[p] = slideCompletion[p] || {};
					slideCompletion[p][id] = slideCompletion[p][id] || 0;
				});
			} else {
				slideCompletion[data.completionPath] = slideCompletion[data.completionPath] || {};
				slideCompletion[data.completionPath][id] = slideCompletion[data.completionPath][id] || 0;
			}
		} else {
			slideCompletion.mainPath = slideCompletion.mainPath || {};
			slideCompletion.mainPath[id] = slideCompletion.mainPath[id] || 0;
		}
	});
}

var scorm = pipwerks.SCORM; //Shortcut
var lmsConnected = false;
var unloaded = false;
var courseURL = btoa(window.location.href.toString());
var progressURL = 'progress' + courseURL;
var bookmarkURL = 'bookmark' + courseURL;

function initCourse() {
	// Do we even want to talk to the LMS?
	if (globalVar.scormSettings.useScorm) {
		if (globalVar.scormSettings.standard.toLowerCase() !== 'aicc') {
			connectToSCORMAPI();
		} else {
			connectToAICCAPI();
		}
	} else if (globalVar.scormSettings.useLocal) {
		connectToLocalStorage();
	} else {
		siLog('SCORM', 'INFO', 'SCORM is disabled.');
	}
}

function connectToAICCAPI() {
	var SD = window.parent;

	if (typeof SD.SetReachedEnd === 'function' && typeof SD.CommitData === 'function') {
		siLog('AICC', 'API', 'SUCCESS: AICC API found!');
		siLog('AICC', 'INIT', 'SUCCESS: Course is now connected to the LMS!');
	} else {
		siLog('AICC', 'API', 'ERROR: AICC API not found!');
		siLog('AICC', 'INIT', 'ERROR: Course could not connect to the LMS!');
	}
}
function connectToLocalStorage() {
	if (storageAvailable('localStorage')) {
		var rawLocalData = localStorage.getItem(progressURL);
		if (rawLocalData && typeof rawLocalData === 'string') {
			var localData = JSON.parse(rawLocalData);
			saveData = localData;
		} else {
			saveData = {
				completionStatus: 'incomplete',
				learnerName: 'Marianna',
				learnerId: '12345',
				totalTime: '0',
				bookmark: 1,
				score: '0',
				lastSlideType: 'text',
				currentVideoTime: 0
			};
		}
		window.addEventListener('unload', unloadHandler);
		window.addEventListener('beforeunload', unloadHandler);
	}
}

function connectToSCORMAPI() {
	//scorm.init returns a boolean
	lmsConnected = scorm.init();
	//If the scorm.init function succeeded...
	if (lmsConnected) {
		siLog('SCORM', 'INIT', 'SUCCESS: Course is now connected with the LMS!');
		var completionstatus;
		var learnername, learnerId, totalTime, learnerScore;
		var rawData = scorm.get('cmi.suspend_data');
		var bookmarkScorm;
		var scormData;
		if (scorm.version === '2004') {
			completionstatus = scorm.get('cmi.completion_status');
			learnername = scorm.get('cmi.learner_name');
			learnerId = scorm.get('cmi.learner_id');
			totalTime = scorm.get('cmi.total_time');
			learnerScore = scorm.get('cmi.score.raw');
			bookmarkScorm = scorm.get('cmi.location');
		} else {
			completionstatus = scorm.get('cmi.core.lesson_status');
			learnername = scorm.get('cmi.core.student_name');
			learnerId = scorm.get('cmi.core.student_id');
			totalTime = scorm.get('cmi.core.total_time');
			learnerScore = scorm.get('cmi.core.score.raw');
			bookmarkScorm = scorm.get('cmi.core.lesson_location');
		}
		if (rawData && typeof rawData === 'string') {
			scormData = JSON.parse(rawData);
			saveData = scormData;
			// compare information received from LMS to what we stored.  Give priority to higher values
			if (bookmarkScorm) {
				saveData.bookmark = bookmarkScorm > saveData.bookmark ? bookmarkScorm : saveData.bookmark;
			}
			if (learnerScore) {
				saveData.score = learnerScore > saveData.score ? learnerScore : saveData.score;
			}
			if (totalTime) {
				saveData.totalTime = totalTime > saveData.totalTime ? totalTime : saveData.totalTime;
			}
		} else {
			saveData = {
				completionStatus: completionstatus ? completionstatus : 'incomplete',
				learnerName: learnername ? learnername : 'Marianna',
				learnerId: learnerId ? learnerId : '12345',
				totalTime: totalTime ? totalTime : '0',
				bookmark: bookmarkScorm ? bookmarkScorm : 1,
				score: learnerScore ? learnerScore : '0',
				lastSlideType: 'text',
				currentVideoTime: 0
			};
		}

		window.addEventListener('unload', unloadHandler);
		window.addEventListener('beforeunload', unloadHandler);
		//If the course couldn't connect to the LMS for some reason...
	} else if (globalVar.scormSettings.useLocal) {
		siLog('SCORM', 'INIT', 'ERROR: Course could not connect with the LMS, attempting local storage');
		connectToLocalStorage();
	} else {
		//... let's alert the user then close the window.
		siLog('SCORM', 'INIT', 'ERROR: Course could not connect with the LMS');
	}
}

function setScormCompletion() {
	var success = false;

	// Do we even want to talk to the LMS?
	if (globalVar.scormSettings.useScorm) {
		// AICC:
		// On the off chance that we want to use AICC instead of SCORM

		if (globalVar.scormSettings.standard === 'aicc') {
			var SD = window.parent;

			// Check if the AICC API is available in parent and tell it to set the course to complete

			if (typeof SD.SetReachedEnd === 'function' && typeof SD.CommitData === 'function') {
				// If both of the following AICC API functions return true, we are done here!
				success = SD.SetReachedEnd() && SD.CommitData();
				if (success) {
					siLog('AICC', 'COMPLETE', 'SUCCESS: Course was successfully set to complete!');
				}
				// otherwise something went horribly wrong.
				else {
					siLog('AICC', 'COMPLETE', 'ERROR: Course could not be set to complete!');
				}
			}
			// otherwise the API isn't available
			else {
				siLog('AICC', 'COMPLETE', 'ERROR: Course is not connected to the LMS');
			}
		}

		// SCORM:

		//If lmsConnected is true (which only happens if we are using the SCORM standard)...
		else if (lmsConnected) {
			//... try setting the course status to "completed"
			if (scorm.version === '2004') {
				success = scorm.set('cmi.completion_status', 'completed');
				scorm.set('cmi.success_status', 'passed');
				scorm.set('cmi.score.raw', '100');
				scorm.set('cmi.score.scaled', '1');
				// scorm.set("cmi.score.min", globalVar.minScore);
				// scorm.set("cmi.score.max", globalVar.maxScore);
				// scorm.set("adl.nav.request", "exit")
			} else {
				success = scorm.set('cmi.core.lesson_status', 'completed');
				scorm.set('cmi.core.score.raw', '100');
				// scorm.set("cmi.core.score.min", globalVar.minScore);
				// scorm.set("cmi.core.score.max", globalVar.maxScore);
			}
			//If the course was successfully set to "completed"...
			if (success) {
				scorm.save();
				siLog('SCORM', 'COMPLETE', 'SUCCESS: Course was successfully set to complete!');
			}
			//If the course couldn't be set to completed for some reason...
			else {
				//alert the user
				siLog('SCORM', 'COMPLETE', 'ERROR: Course could not be set to complete!');
			}
		}
		// otherwise the course isn't connected to the LMS for some reason...
		else {
			//alert the user
			siLog('SCORM', 'COMPLETE', 'ERROR: Course is not connected to the LMS');
		}
	}
}

function setScormIncomplete() {
	if (lmsConnected) {
		var success;
		//... try setting the course status to "completed"
		if (scorm.version === '2004') {
			success = scorm.set('cmi.completion_status', 'completed');
			scorm.set('cmi.success_status', 'failed');
			scorm.set('cmi.score.raw', '0');
			scorm.set('cmi.score.scaled', '1');
			// scorm.set("cmi.score.min", globalVar.minScore);
			// scorm.set("cmi.score.max", globalVar.maxScore);
			// scorm.set("adl.nav.request", "exit")
		} else {
			success = scorm.set('cmi.core.lesson_status', 'incomplete');
			scorm.set('cmi.core.score.raw', '0');
			// scorm.set("cmi.core.score.min", globalVar.minScore);
			// scorm.set("cmi.core.score.max", globalVar.maxScore);
		}
		//If the course was successfully set to "incomplete"...
		if (success) {
			scorm.save();
			siLog('SCORM', 'INCOMPLETE', 'SUCCESS: Course was successfully set to incomplete!');
		}
		//If the course couldn't be set to incomplete for some reason...
		else {
			//alert the user
			siLog('SCORM', 'INCOMPLETE', 'ERROR: Course could not be set to incomplete!');
		}
	}
	//If the course isn't connected to the LMS for some reason...
	else {
		//alert the user
		siLog('SCORM', 'INCOMPLETE', 'ERROR: Course is not connected to the LMS');
	}
}

function unloadHandler() {
	var slide = globalVar.slide;

	saveData.lastSlideType = slide.data.type;
	if (slide.data.type === 'video' && globalVar.scormSettings.bookmarking.videoBookmarking) {
		saveData.currentVideoTime = videojs(slide.$dom.find('video')[0].id).currentTime();
	}
	if (lmsConnected && !unloaded) {
		saveLMS();
		scorm.save(); //save all data that has already been sent
		scorm.quit(); //close the SCORM API connection properly
		unloaded = true;
	} else if (globalVar.scormSettings.useLocal && !unloaded) {
		saveProgressLocally();
		unloaded = true;
	}
}
function saveLMS() {
	if (saveCourseProgress() && saveBookmark()) {
		scorm.save();
	} else {
		siLog('SCORM', 'Failed to Save');
	}
}

function saveCourseProgress() {
	var success;
	var dataString;
	if (lmsConnected) {
		if (scorm.version === '2004') {
			scorm.set('cmi.score.raw', saveData.score);
			saveData.totalTime = scorm.get('cmi.total_time') || saveData.totalTime;
		} else {
			scorm.set('cmi.core.score.raw', saveData.score);
			saveData.totalTime = scorm.get('cmi.core.total_time') || saveData.totalTime;
		}
		dataString = JSON.stringify(saveData);
		success = scorm.set('cmi.suspend_data', dataString);
	}
	return success;
}
function saveBookmark() {
	var slide = globalVar.slide;
	var success;

	saveData.bookmark = slide.data.slideNumber || '1';
	if (lmsConnected) {
		if (scorm.version === '2004') {
			success = scorm.set('cmi.location', saveData.bookmark);
		} else {
			success = scorm.set('cmi.core.lesson_location', saveData.bookmark);
		}
	}

	return success;
}

function saveProgressLocally() {
	var slide = globalVar.slide;

	saveData.bookmark = slide.data.slideNumber || '1';
	var dataString = JSON.stringify(saveData);
	if (storageAvailable('localStorage')) {
		localStorage.setItem(progressURL, dataString);
	}
}

function storageAvailable(type) {
	var storage;
	try {
		storage = window[type];
		var x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		return true;
	} catch (e) {
		return (
			e instanceof DOMException &&
			// everything except Firefox
			(e.code === 22 ||
				// Firefox
				e.code === 1014 ||
				// test name field too, because code might not be present
				// everything except Firefox
				e.name === 'QuotaExceededError' ||
				// Firefox
				e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
			// acknowledge QuotaExceededError only if there's something already stored
			storage &&
			storage.length !== 0
		);
	}
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2pzL3NldHRpbmdzLmpzIiwiLi4vanMvX2pzL2NoYXJ0LmpzIiwiLi4vanMvX2pzL2xvZ2dlci5qcyIsIi4uL2pzL19qcy9oZWxwZXIuanMiLCIuLi9qcy9kYXRhLmpzIiwiLi4vanMvX2pzL2NvbXBvbmVudHMvY2Fyb3VzZWwuanMiLCIuLi9qcy9fanMvY29tcG9uZW50cy9jYXJvdXNlbDNkLmpzIiwiLi4vanMvX2pzL2NvbXBvbmVudHMvYXVkaW8uanMiLCIuLi9qcy9fanMvY29tcG9uZW50cy92aWRlby5qcyIsIi4uL2pzL19qcy9jb21wb25lbnRzL3ByZWxvYWRlci5qcyIsIi4uL2pzL19qcy9jb21wb25lbnRzL2ZlZWRiYWNrLmpzIiwiLi4vanMvX2pzL2NvbXBvbmVudHMvZG5kLmpzIiwiLi4vanMvX2pzL2NvbXBvbmVudHMvaG90c3BvdC5qcyIsIi4uL2pzL19qcy9jb21wb25lbnRzL21lbnUuanMiLCIuLi9qcy9fanMvY29tcG9uZW50cy9zY3JhdGNoLmpzIiwiLi4vanMvX2pzL2NvbXBvbmVudHMvc29ydGFibGUuanMiLCIuLi9qcy9fanMvY29tcG9uZW50cy9xdWl6LmpzIiwiLi4vanMvX2pzL2NvbXBvbmVudHMvZm9ybS5qcyIsIi4uL2pzL19qcy9jb21wb25lbnRzL3NpZGVfbWVudS5qcyIsIi4uL2pzL19qcy9jb21wb25lbnRzL25hdmlnYXRpb24uanMiLCIuLi9qcy9fanMvaW50ZXJhY3RpdmUuanMiLCIuLi9qcy9fanMvaW50ZXJhY3RpdmUuc2Nvcm0uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMW5CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNWNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3Z2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9RQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMVZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNybUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJqcy9pbnRlcmFjdGl2ZS5taW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZ2xvYmFsVmFyID0ge1xuXHRob21lU2xpZGU6IDMsIC8vMT1maXJzdCBzbGlkZVxuXHRkZXZNb2RlOiBmYWxzZSxcblx0c2Nvcm1TZXR0aW5nczoge1xuXHRcdHVzZVNjb3JtOiB0cnVlLFxuXHRcdHVzZUxvY2FsOiBmYWxzZSxcblx0XHRzdGFuZGFyZDogJ3Njb3JtJywgLy8gaWYgc3RhbmRhcmQgaXMgc2V0IHRvIFwiYWljY1wiLCB0aGUgQUlDQyBBUEkgaXMgdXNlZCBpbiBzZXRTY29ybUNvbXBsZXRpb24oKSwgZXZlcnkgb3RoZXIgdmFsdWUgd2lsbCBiZSBpZ25vcmVkLlxuXHRcdGJvb2ttYXJraW5nOiB7XG5cdFx0XHR1c2VCb29rbWFya2luZzogdHJ1ZSxcblx0XHRcdHZpZGVvQm9va21hcmtpbmc6IHRydWUsXG5cdFx0XHRuYW1lOiAnY3VyQ2hhcHRlcidcblx0XHR9LFxuXHRcdG1pblNjb3JlOiAnMCcsXG5cdFx0bWF4U2NvcmU6ICcxMDAnLFxuXHRcdHBlcnNvbmFsaXplOiB7XG5cdFx0XHRzdHVkZW50TmFtZTogdHJ1ZSxcblx0XHRcdHN0dWRlbnRJZDogdHJ1ZSxcblx0XHRcdHRvdGFsVGltZTogdHJ1ZVxuXHRcdH1cblx0fSxcblx0Y2xpZW50VGVtcGxhdGU6IGZhbHNlLCAvLyBmYWxzZSBvciAnYm1zJyAgLT4gc2hvdWxkIGFsdGVyIG5hdiBzdHlsZSwgc3dhcCBsb2dvcywgdHVybnMgb24gbG9ja1N1Ym1pdElmVW5hdHRlbXB0ZWQgYW5kIGxvY2tDbG9zZXJzRHVyaW5nRmVlZGJhY2tWTyAtPiBjaGVjayBibXMuc2NzcyBmb3Igc3R5bGUgY2hhbmdlcyBhbmQgc2VhcmNoICdzZXRDbGllbnRUZW1wbGF0ZSgpJyB0byBmaW5kIHRoZSBqcyB0aGF0IGhhbmRsZXMgaXRcblx0dmlkZW86IHtcblx0XHRwcm9ncmVzc0NvbnRyb2w6IGZhbHNlIC8vIFNldCBpdCB0byBmYWxzZSB0byBnbG9iYWxseSBkaXNhYmxlIHNlZWtpbmcgZm9yIGFsbCB2aWRlb3MuIFNldHRpbmcgdGhlICd2aWRlb1NlZWtpbmcnIGF0dHJpYnV0ZSBpbiBkYXRhLmpzIHdpbGwgb3ZlcndyaXRlIHRoaXMuXG5cdH0sXG5cdGZvbnRTaXplRmFjdG9yOiA0NSxcblx0cmFuZG9taXplU2xpZGVzOiB7XG5cdFx0dXNlUmFuZG9taXplOiBmYWxzZSxcblx0XHRzbGlkZXM6IHtcblx0XHRcdHlvdXJLRVl2YWx1ZTogWzQsIDgsIDldIC8vIFNsaWRlbnVtYmVycyA0LDUsNiw3LDggZ2V0cyBzaHVmZmxlZCBhbmQgcmV0dXJuIHRvIDkgYWZ0ZXIgZ29pbmcgdGhyb3VnaCBhbGwgb2YgdGhlbVxuXHRcdH1cblx0fSxcblx0cmFuZG9taXplZEFycmF5OiBbXSwgLy8gZG9uJ3QgZWRpdFxuXHRkbmRBbnN3ZXJzOiB7fSwgLy8gZG9uJ3QgZWRpdFxuXHRzZW5kRGF0YTogJycsIC8vIGRvbid0IGVkaXRcblx0c2h1ZmZsZWRTbGlkZXM6IHt9LCAvLyBkb24ndCBlZGl0XG5cdHZpZGVvU2Vlbjoge30sXG5cdGZhZGVOYXZpZ2F0aW9uOiB0cnVlLCAvLyBmYWRlcyBuYXYgY29udHJvbHMgb24gdmlkZW9zXG5cdGJ1dHRvblR5cGU6ICdjbGVhbicsIC8vIGNsYXNzaWMsIGNsZWFuLCBvciBjdXN0b21cblx0cHJvZ3Jlc3NUeXBlOiAnY2lyY2xlJywgLy9vcHRpb25zIGFyZSBjaXJjbGUgb3IgbGluZVxuXHRlYXJuQ29pbnM6IHRydWUsXG5cdGxvY2tDbG9zZXJzRHVyaW5nRmVlZGJhY2tWTzogZmFsc2UsXG5cdGxvY2tTdWJtaXRJZlVuYXR0ZW1wdGVkOiBmYWxzZSxcblx0aTZNb2RhbDogZmFsc2Vcbn07XG4iLCJ2YXIgY2hhcnRzID0ge307XG5mdW5jdGlvbiBjaGFydEluaXRpYXRlKCkge1xuXHR2YXIgcHJvZ3Jlc3NJRCA9ICdzaS1wcm9ncmVzcy1tZXRlcic7XG5cdHZhciAkcHJvZ3Jlc3NNZXRlciA9ICQoJyNzaS1wcm9ncmVzcy1tZXRlcicpO1xuXHRpZiAoZ2xvYmFsVmFyLnByb2dyZXNzVHlwZSA9PT0gJ2xpbmUnKSB7XG5cdFx0JCgnI3NpLXByb2dyZXNzJykuYWRkQ2xhc3MoJ2xpbmUnKTtcblxuXHRcdHZhciBiYXIgPSBuZXcgUHJvZ3Jlc3NCYXIuTGluZSgnIycgKyBwcm9ncmVzc0lELCB7XG5cdFx0XHRzdHJva2VXaWR0aDogOCxcblx0XHRcdGVhc2luZzogJ2Vhc2VJbk91dCcsXG5cdFx0XHRkdXJhdGlvbjogMTQwMCxcblx0XHRcdHRyYWlsV2lkdGg6IDYsXG5cdFx0XHRzdmdTdHlsZTogbnVsbCxcblx0XHRcdHRleHQ6IHtcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHR0cmFuc2Zvcm06IG51bGxcblx0XHRcdFx0fSxcblx0XHRcdFx0YXV0b1N0eWxlQ29udGFpbmVyOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHN0ZXA6IGZ1bmN0aW9uIChzdGF0ZSwgYmFyKSB7XG5cdFx0XHRcdHJldHVybiBiYXIuc2V0VGV4dChNYXRoLnJvdW5kKGJhci52YWx1ZSgpICogMTAwKSArICclICcgKyAkcHJvZ3Jlc3NNZXRlci5kYXRhKCduYW1lJykpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdHZhciBiYXIgPSBuZXcgUHJvZ3Jlc3NCYXIuQ2lyY2xlKCcjJyArIHByb2dyZXNzSUQsIHtcblx0XHRcdHN0cm9rZVdpZHRoOiA4LFxuXHRcdFx0ZWFzaW5nOiAnZWFzZUluT3V0Jyxcblx0XHRcdGR1cmF0aW9uOiAxNDAwLFxuXHRcdFx0dHJhaWxXaWR0aDogNixcblx0XHRcdHN2Z1N0eWxlOiBudWxsLFxuXHRcdFx0dGV4dDoge1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdHRyYW5zZm9ybTogbnVsbFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRhdXRvU3R5bGVDb250YWluZXI6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0c3RlcDogZnVuY3Rpb24gKHN0YXRlLCBiYXIpIHtcblx0XHRcdFx0cmV0dXJuIGJhci5zZXRUZXh0KE1hdGgucm91bmQoYmFyLnZhbHVlKCkgKiAxMDApICsgJyUgJyArICRwcm9ncmVzc01ldGVyLmRhdGEoJ25hbWUnKSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblx0Y2hhcnRzW3Byb2dyZXNzSURdID0gYmFyO1xufVxuXG4vLy8vLy8vLypGZWF0dXJlOlByb2dyZXNzIE1ldGVyLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmZ1bmN0aW9uIGNoYXJ0UHJvZ3Jlc3MoKSB7XG5cdHZhciBzbGlkZUNvbXBsZXRpb24gPSBzYXZlRGF0YS5zbGlkZUNvbXBsZXRpb247XG5cdHZhciBwYXRoU2VsZWN0ZWQgPSBzYXZlRGF0YS5wYXRoU2VsZWN0ZWQ7XG5cdHZhciBwYXRoc0NvdW50ZWQgPSBbXTtcblx0dmFyIGluY3JlbWVudHMgPSAwO1xuXHR2YXIgYW5zd2Vyc0NvcnJlY3QgPSAwO1xuXG5cdGZvciAodmFyIGtleSBpbiBzbGlkZUNvbXBsZXRpb24pIHtcblx0XHRmb3IgKHZhciBzbGlkZSBpbiBzbGlkZUNvbXBsZXRpb25ba2V5XSkge1xuXHRcdFx0dmFyIGFscmVhZHlDb3VudGVkID0gcGF0aHNDb3VudGVkLmluZGV4T2Yoc2xpZGUpID49IDA7XG5cdFx0XHR2YXIgc2hvdWxkQmVDb3VudGVkID0ga2V5ID09PSAnbWFpblBhdGgnIHx8ICFwYXRoU2VsZWN0ZWQgfHwga2V5ID09PSBwYXRoU2VsZWN0ZWQ7XG5cdFx0XHRpZiAoIWFscmVhZHlDb3VudGVkICYmIHNob3VsZEJlQ291bnRlZCkge1xuXHRcdFx0XHRpbmNyZW1lbnRzKys7XG5cdFx0XHRcdHBhdGhzQ291bnRlZC5wdXNoKHNsaWRlKTtcblx0XHRcdFx0aWYgKHNsaWRlQ29tcGxldGlvbltrZXldW3NsaWRlXSkgYW5zd2Vyc0NvcnJlY3QrKztcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRnZXRQZ3IoYW5zd2Vyc0NvcnJlY3QgLyBpbmNyZW1lbnRzKTtcbn1cblxuZnVuY3Rpb24gZ2V0UGdyKHBlcmNlbnRhZ2UpIHtcblx0dmFyIHByb2dyZXNzSUQgPSAnc2ktcHJvZ3Jlc3MtbWV0ZXInO1xuXHR2YXIgJHByb2dyZXNzTWV0ZXIgPSAkKCcjc2ktcHJvZ3Jlc3MtbWV0ZXInKTtcblxuXHRjaGFydHNbcHJvZ3Jlc3NJRF0uYW5pbWF0ZShwZXJjZW50YWdlKTtcblxuXHQvL25vdCB1cGRhdGluZyB3aGVuIGluY3JlbWVudHMgc2hpZnRcblx0JHByb2dyZXNzTWV0ZXIuYXR0cignZGF0YS1wZXJjZW50JywgcGVyY2VudGFnZSk7XG59XG4iLCJpZiAodHlwZW9mIHNpID09PSAndW5kZWZpbmVkJyB8fCBzaSA9PT0gbnVsbCkge1xuXHR2YXIgc2kgPSB7fTtcbn1cblxuc2kubG9nID0gW107XG5cbnNpLmZvcm1hdExvZyA9IGZ1bmN0aW9uICgpIHtcblx0aWYgKHdpbmRvdy5jb25zb2xlLnRhYmxlKSB7XG5cdFx0Y29uc29sZS50YWJsZShzaS5sb2cpO1xuXHR9IGVsc2Uge1xuXHRcdGNvbnNvbGUubG9nKHNpLmxvZyk7XG5cdH1cbn07XG5cbmZ1bmN0aW9uIHNpTG9nKCkge1xuXHR2YXIgYXJncyA9IFtdO1xuXHR2YXIgbGFiZWwgPSAnW10nO1xuXHR2YXIgdGFnID0gYXJndW1lbnRzWzBdO1xuXHR2YXIgZW1vamkgPSAn4p2MJztcblx0dmFyIGFjdGlvbiA9ICcnO1xuXHR2YXIga2V5ID0gJyc7XG5cdHZhciB2YWx1ZSA9ICcnO1xuXHR2YXIgbWFpbk1lc3NhZ2UgPSBhcmd1bWVudHNbMV07XG5cblx0YXJnc1swXSA9IGFyZ3VtZW50c1swXSB8fCAnJztcblx0YXJnc1sxXSA9IGFyZ3VtZW50c1sxXSB8fCAnJztcblx0YXJnc1syXSA9IGFyZ3VtZW50c1syXSB8fCAnJztcblx0YXJnc1szXSA9IGFyZ3VtZW50c1szXSB8fCAnJztcblx0YXJnc1s0XSA9IGFyZ3VtZW50c1s0XSB8fCAnJztcblxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcblx0XHQvLyBKVVNUIEEgU1VQRVIgU0lNUExFIENPTlNPTEUuTE9HIFdJVEggU1RBQ0sgVFJBQ0Vcblx0XHRsYWJlbCA9ICdb8J+kmlNTSV0nO1xuXHRcdHZhciBhY3Rpb24gPSAn8J+SoVNJTVBMRSc7XG5cdFx0dmFyIGtleSA9IGFyZ3NbMF07XG5cdFx0dmFyIHZhbHVlID0gJyc7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gU09NRVRISU5HIE1PUkUgSU5WT0xWRUQsIEhPUEVGVUxMWSBXSVRIIFRBRyBBTkQgQUxMXG5cdFx0Ly8gQ09NSU5HIEVJVEhFUiBGUk9NIEZSQU1FV09SSyBPUiBQSVBXRVJLUyBTQ09STSBBUEkgV1JBUFBFUlxuXHRcdC8vIGNvbnNvbGUuZXJyb3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuXHRcdGlmICh0YWcgPT09ICdwaXB3ZXJrcycpIHtcblx0XHRcdC8vIERFQUxJTkcgV0lUSCBQSVBXRVJLUyBERUJVRyBNRVNTQUdFUyBUSEFUIFdFIEhJSkFDS0VEXG5cdFx0XHRwaXB3ZXJrc1BhcnNlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBERUFMSU5HIFdJVEggT1VSIE9XTiBNRVNTQUdFUywgQ09NSU5HIEZST00gSU5TSURFIFRIRSBGUkFNRVdPUktcblx0XHRcdGludGVyYWN0aXZlUGFyc2VyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gTmFzdHkgaGFjayB0byBtYWtlIHN1cmUgdGhhdCB0aGUgU0NPUk0gQVBJIG9iamVjdCBpcyBhY3R1YWxseSBhdmFpbGFibGVcblx0Ly8gKHdoaWNoIHNlZW1zIHRvIHRha2UgYSBmZXcgdGlja3MgYWZ0ZXIgaW5pdGlhbGl6YXRpb24pIHRvIGxvZyB0byBjb25zb2xlLlxuXHQvLyBUaGF0J3Mgd2h5IHdlIGhhdmUgdGhhdCB0aW1lb3V0IGhlcmUuXG5cdGlmIChhY3Rpb24uaW5kZXhPZignQVBJOicpID4gLTEpIHtcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdGNvbnNvbGUuZ3JvdXBDb2xsYXBzZWQobGFiZWwgKyBhY3Rpb24gKyBrZXksIHZhbHVlKTtcblx0XHRcdGNvbnNvbGUudHJhY2UoJ1N0YWNrIHRyYWNlOicpO1xuXHRcdFx0Y29uc29sZS5ncm91cEVuZCgpO1xuXHRcdH0sIDEpO1xuXHR9IGVsc2Uge1xuXHRcdGNvbnNvbGUuZ3JvdXBDb2xsYXBzZWQobGFiZWwgKyBhY3Rpb24gKyBrZXkgKyAnICcgKyB2YWx1ZSk7XG5cdFx0Y29uc29sZS50cmFjZSgnU3RhY2sgdHJhY2U6Jyk7XG5cdFx0Y29uc29sZS5ncm91cEVuZCgpO1xuXHR9XG5cblx0Ly8gRm9yIHNpdHVhdGlvbnMgd2hlcmUgdGhlIGNvbnNvbGUgaXNuJ3QgZW5vdWdoLCBiZWNhdXNlIGl0IG1pZ2h0IG5vdCBoYXZlIGJlZW4gbG9nZ2dpbmdcblx0Ly8gcmlnaHQgZnJvbSB0aGUgc3RhcnQgKGxvb2tpbmcgYXQgeW91IGludGVybmV0IGV4cGxvcmVyISksIHdlIGFsc28gd2FudCB0byBoYXZlIGFsbCB0aGVcblx0Ly8gbG9nIHdvcnRoeSBldmVudHMgaW4gYSBuZWF0IGFycmF5LiBUaGF0IHdheSB3ZSBjYW4gbG9vayBhdCBpdCAob3IgZXhwb3J0IGl0IGV2ZW4hKVxuXHQvLyB3aGVuZXZlciB3ZSB3YW50IVxuXHR2YXIgbG9nRW50cnkgPSB7XG5cdFx0bGFiZWw6IGxhYmVsLFxuXHRcdGFjdGlvbjogYWN0aW9uLFxuXHRcdGtleToga2V5LFxuXHRcdHZhbHVlOiB2YWx1ZVxuXHR9O1xuXG5cdHNpLmxvZy5wdXNoKGxvZ0VudHJ5KTtcblxuXHRmdW5jdGlvbiBwaXB3ZXJrc1BhcnNlcigpIHtcblx0XHR0YWcgPSAnUElQOlNDT1JNJztcblxuXHRcdGlmICh0eXBlb2YgYXJndW1lbnRzWzFdID09PSAnc3RyaW5nJykge1xuXHRcdFx0Ly8gdHJhY2VNc2dQcmVmaXggPSBcIlNDT1JNLmRhdGEuZ2V0KCdcIiArIHBhcmFtZXRlciArIFwiJykgXCI7XG5cdFx0XHQvLyB0cmFjZU1zZ1ByZWZpeCA9IFwiU0NPUk0uZGF0YS5zZXQoJ1wiICsgcGFyYW1ldGVyICsgXCInKSBcIjtcblx0XHRcdGlmIChtYWluTWVzc2FnZS5pbmRleE9mKCdTQ09STS5kYXRhJykgPiAtMSkge1xuXHRcdFx0XHRlbW9qaSA9ICfwn5K+Jztcblx0XHRcdFx0aWYgKG1haW5NZXNzYWdlLmluZGV4T2YoJy5nZXQnKSA+IC0xKSB7XG5cdFx0XHRcdFx0bWFpbk1lc3NhZ2UgPSBtYWluTWVzc2FnZS5yZXBsYWNlKC9TQ09STS5kYXRhLmdldFxcKC9naSwgJycpO1xuXHRcdFx0XHRcdGFjdGlvbiA9ICfij6ogR0VUJztcblx0XHRcdFx0fSBlbHNlIGlmIChtYWluTWVzc2FnZS5pbmRleE9mKCcuc2V0JykgPiAtMSkge1xuXHRcdFx0XHRcdG1haW5NZXNzYWdlID0gbWFpbk1lc3NhZ2UucmVwbGFjZSgvU0NPUk0uZGF0YS5zZXRcXCgvZ2ksICcnKTtcblx0XHRcdFx0XHRhY3Rpb24gPSAnU0VUIOKPqSc7XG5cdFx0XHRcdH1cblx0XHRcdFx0bWFpbk1lc3NhZ2UgPSBtYWluTWVzc2FnZS5yZXBsYWNlKC9cXCkvZ2ksICc6Jyk7XG5cdFx0XHRcdGtleSA9IG1haW5NZXNzYWdlLnNwbGl0KCcgIHZhbHVlOiAnKVswXSB8fCAnJztcblx0XHRcdFx0dmFsdWUgPSBtYWluTWVzc2FnZS5zcGxpdCgnICB2YWx1ZTogJylbMV0gfHwgJyc7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHRyYWNlTXNnUHJlZml4ID0gJ1NDT1JNLmNvbm5lY3Rpb24uaW5pdGlhbGl6ZSAnO1xuXHRcdFx0Ly8gdHJhY2VNc2dQcmVmaXggPSAnU0NPUk0uY29ubmVjdGlvbi50ZXJtaW5hdGUgJztcblx0XHRcdGlmIChtYWluTWVzc2FnZS5pbmRleE9mKCdTQ09STS5jb25uZWN0aW9uJykgPiAtMSB8fCBtYWluTWVzc2FnZS5pbmRleE9mKCdjb25uZWN0aW9uLmluaXRpYWxpemUnKSA+IC0xKSB7XG5cdFx0XHRcdGVtb2ppID0gJ/CflIwnO1xuXHRcdFx0XHRpZiAobWFpbk1lc3NhZ2UuaW5kZXhPZignLmluaXRpYWxpemUnKSA+IC0xKSB7XG5cdFx0XHRcdFx0bWFpbk1lc3NhZ2UgPSBtYWluTWVzc2FnZS5yZXBsYWNlKC9TQ09STS5jb25uZWN0aW9uLmluaXRpYWxpemUgL2dpLCAnJyk7XG5cdFx0XHRcdFx0YWN0aW9uID0gJ/CfpJ0gSU5JVCc7XG5cdFx0XHRcdFx0aWYgKG1haW5NZXNzYWdlLmluZGV4T2YoJ2Nvbm5lY3Rpb24uaW5pdGlhbGl6ZSBjYWxsZWQuJykgPiAtMSkge1xuXHRcdFx0XHRcdFx0bWFpbk1lc3NhZ2UgPSBtYWluTWVzc2FnZS5yZXBsYWNlKC9jb25uZWN0aW9uLmluaXRpYWxpemUgY2FsbGVkLi9naSwgJycpO1xuXHRcdFx0XHRcdFx0a2V5ID0gJ0luaXRpYWxpemluZyBMTVMgY29ubmVjdGlvbi4uLic7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2UgaWYgKG1haW5NZXNzYWdlLmluZGV4T2YoJy50ZXJtaW5hdGUnKSA+IC0xKSB7XG5cdFx0XHRcdFx0bWFpbk1lc3NhZ2UgPSBtYWluTWVzc2FnZS5yZXBsYWNlKC9TQ09STS5jb25uZWN0aW9uLnRlcm1pbmF0ZSAvZ2ksICcnKTtcblx0XHRcdFx0XHRhY3Rpb24gPSAn8J+SgCBURVJNJztcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAobWFpbk1lc3NhZ2UuaW5kZXhPZignZmFpbGVkJykgPiAtMSB8fCBtYWluTWVzc2FnZS5pbmRleE9mKCdhYm9ydGVkJykgPiAtMSkge1xuXHRcdFx0XHRcdG1haW5NZXNzYWdlID0gbWFpbk1lc3NhZ2UucmVwbGFjZSgvZmFpbGVkL2dpLCAn4p2MIEZBSUxFRCcpO1xuXHRcdFx0XHRcdG1haW5NZXNzYWdlID0gbWFpbk1lc3NhZ2UucmVwbGFjZSgvYWJvcnRlZC9naSwgJ+KdjCBBQk9SVEVEJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gdHJhY2VNc2dQcmVmaXggPSAnU0NPUk0uQVBJLmZpbmQnLFxuXHRcdFx0aWYgKG1haW5NZXNzYWdlLmluZGV4T2YoJ0FQSScpID4gLTEpIHtcblx0XHRcdFx0ZW1vamkgPSAn8J+Tlic7XG5cdFx0XHRcdGlmIChtYWluTWVzc2FnZS5pbmRleE9mKCcuZmluZCcpID4gLTEpIHtcblx0XHRcdFx0XHRtYWluTWVzc2FnZSA9IG1haW5NZXNzYWdlLnJlcGxhY2UoL1NDT1JNLkFQSS5maW5kOiAvZ2ksICcnKTtcblx0XHRcdFx0XHRtYWluTWVzc2FnZSA9IG1haW5NZXNzYWdlLnJlcGxhY2UoLy4gVmVyc2lvbjogL2dpLCAnOiB2Jyk7XG5cdFx0XHRcdFx0YWN0aW9uID0gJ/CflI0gRklORCc7XG5cdFx0XHRcdFx0dmFsdWUgPSAnKEl0IHdpbGwgYmUgYXZhaWxhYmxlIGZvciBpbnNwZWN0aW9uIGluIGEgZmV3IHRpY2tzLiknO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChtYWluTWVzc2FnZS5pbmRleE9mKCdBUEk6JykgPiAtMSkge1xuXHRcdFx0XHRcdGFjdGlvbiA9ICfwn5SXIEFQSSc7XG5cdFx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRrZXkgPSBwaXB3ZXJrcy5TQ09STS5BUEkuaGFuZGxlO1xuXHRcdFx0XHRcdH0sIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGFjdGlvbiAhPT0gJycpIHtcblx0XHRcdGFjdGlvbiA9ICcoJyArIGFjdGlvbiArICcpICc7XG5cdFx0fVxuXHRcdGtleSA9IGtleSB8fCBtYWluTWVzc2FnZTtcblx0XHR2YWx1ZSA9IGlzTmFOKHBhcnNlSW50KHZhbHVlLCAxMCkpID8gdmFsdWUgOiBwYXJzZUludCh2YWx1ZSwgMTApO1xuXHRcdGxhYmVsID0gJ1snICsgZW1vamkgKyB0YWcgKyAnXSAnO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW50ZXJhY3RpdmVQYXJzZXIoKSB7XG5cdFx0dGFnID0gJ1NTSTonICsgdGFnO1xuXHRcdGVtb2ppID0gJ/CfpJonO1xuXHRcdGFjdGlvbiA9IGFyZ3NbMV0gfHwgJyc7XG5cdFx0a2V5ID0gYXJnc1syXSB8fCAnJztcblx0XHR2YWx1ZSA9IGFyZ3NbM10gfHwgJyc7XG5cblx0XHRpZiAodHlwZW9mIGFyZ3VtZW50c1sxXSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdGlmIChhcmdzWzFdID09PSAnU0VUJykge1xuXHRcdFx0XHRhY3Rpb24gPSAnKFNFVCDij6kpICc7XG5cdFx0XHR9IGVsc2UgaWYgKGFyZ3NbMV0gPT09ICdHRVQnKSB7XG5cdFx0XHRcdGFjdGlvbiA9ICco4o+qIEdFVCkgJztcblx0XHRcdH0gZWxzZSBpZiAoYXJnc1sxXSA9PT0gJ0lOSVQnKSB7XG5cdFx0XHRcdGFjdGlvbiA9ICco8J+knSBJTklUKSAnO1xuXHRcdFx0fSBlbHNlIGlmIChhcmdzWzFdID09PSAnQ09NUExFVEUnKSB7XG5cdFx0XHRcdGFjdGlvbiA9ICco8J+PhiBDT01QTEVURSkgJztcblx0XHRcdH0gZWxzZSBpZiAoYXJnc1sxXSA9PT0gJ0lORk8nKSB7XG5cdFx0XHRcdGFjdGlvbiA9ICco8J+SoSBJTkZPKSAnO1xuXHRcdFx0fSBlbHNlIGlmIChhcmdzWzFdID09PSAnQVBJJykge1xuXHRcdFx0XHRhY3Rpb24gPSAnKPCflJcgQVBJKSAnO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoYXJnc1syXS5pbmRleE9mKCdTVUNDRVNTJykgPiAtMSkge1xuXHRcdFx0XHRrZXkgPSAn4pyFICcgKyBhcmdzWzJdO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGFyZ3NbMl0uaW5kZXhPZignRVJST1InKSA+IC0xKSB7XG5cdFx0XHRcdGtleSA9ICfinYwgJyArIGFyZ3NbMl07XG5cdFx0XHR9XG5cblx0XHRcdC8vICAga2V5ID0gbWFpbk1lc3NhZ2Uuc3BsaXQoXCIgIHZhbHVlOiBcIilbMF07XG5cdFx0XHQvLyAgIHZhbHVlID0gbWFpbk1lc3NhZ2Uuc3BsaXQoXCIgIHZhbHVlOiBcIilbMV0gfHwgXCJcIjtcblx0XHR9XG5cblx0XHR2YWx1ZSA9IGlzTmFOKHBhcnNlSW50KHZhbHVlLCAxMCkpID8gdmFsdWUgOiBwYXJzZUludCh2YWx1ZSwgMTApO1xuXHRcdGxhYmVsID0gJ1snICsgZW1vamkgKyB0YWcgKyAnXSAnO1xuXHR9XG59XG5waXB3ZXJrcy5VVElMUy50cmFjZSA9IGZ1bmN0aW9uIChtc2cpIHtcblx0aWYgKHBpcHdlcmtzLmRlYnVnLmlzQWN0aXZlKSB7XG5cdFx0aWYgKHdpbmRvdy5jb25zb2xlICYmIHdpbmRvdy5jb25zb2xlLmxvZykge1xuXHRcdFx0c2lMb2coJ3BpcHdlcmtzJywgbXNnKTtcblx0XHR9XG5cdH1cbn07XG5cbi8vIFvwn5K+U0NPUk1dIOKshe+4j0dFVCAoJ2NtaS5jb3JlLnN0dWRlbnRfbmFtZScpICB2YWx1ZTogaW50ZXJhY3RpdmUsXG5cbi8vIHRyYWNlTXNnUHJlZml4ID0gJ1NDT1JNLmRhdGEuc2F2ZSBmYWlsZWQnO1xuLy8gdHJhY2VNc2dQcmVmaXggPSAnU0NPUk0uZ2V0U3RhdHVzIGZhaWxlZCcsXG5cbi8vIGFyZ3NbMF0gPSAnW/CfkqFTQ09STV0nO1xuLy8gYXJnc1swXSA9ICdb4pid77iPU0NPUk1dJztcbi8vIGFyZ3NbMF0gPSAnW/CfkYZTQ09STV0nO1xuLy8gYXJnc1swXSA9ICdb8J+knlNDT1JNXSc7XG4iLCIvL1NvbWUgc2hvcnRjdXRzIGZvciBmdW5jdGlvbnNcbi8qKlxuICpcbiAqL1xuZnVuY3Rpb24gbmV4dFNsaWRlKCkge1xuXHRSZXZlYWwucmlnaHQoKTtcbn1cblxuLyoqXG4gKlxuICovXG5mdW5jdGlvbiBwcmV2U2xpZGUoKSB7XG5cdFJldmVhbC5sZWZ0KCk7XG59XG5cbi8qKlxuICpcbiAqL1xuZnVuY3Rpb24gZG93blNsaWRlKCkge1xuXHRSZXZlYWwuZG93bigpO1xufVxuXG4vKipcbiAqXG4gKi9cbmZ1bmN0aW9uIHVwU2xpZGUoKSB7XG5cdFJldmVhbC51cCgpO1xufVxuXG4vKipcbiAqXG4gKi9cbmZ1bmN0aW9uIG5leHRIaWRlKCkge1xuXHQkKCcjc2ktbmV4dCcpLmhpZGUoKTtcbn1cblxuLyoqXG4gKlxuICovXG5mdW5jdGlvbiBuZXh0U2hvdygpIHtcblx0JCgnI3NpLW5leHQnKS5zaG93KCk7XG59XG5cbi8qKlxuICpcbiAqL1xuZnVuY3Rpb24gYmFja0hpZGUoKSB7XG5cdCQoJyNzaS1iYWNrJykuaGlkZSgpO1xufVxuXG4vKipcbiAqXG4gKi9cbmZ1bmN0aW9uIGJhY2tTaG93KCkge1xuXHQkKCcjc2ktYmFjaycpLnNob3coKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gblxuICovXG5mdW5jdGlvbiBqdW1wVG9TbGlkZShuKSB7XG5cdFJldmVhbC5zbGlkZShuIC0gMSk7XG59XG5cbi8qKlxuICogQHBhcmFtIGlkXG4gKi9cbmZ1bmN0aW9uIGp1bXBUb0lkKGlkKSB7XG5cdHZhciBudW0gPSBzbGlkZXNbaWRdLnNsaWRlTnVtYmVyO1xuXHRSZXZlYWwuc2xpZGUobnVtIC0gMSk7XG59XG5cbi8qKlxuICogQHBhcmFtICRlbGVtZW50XG4gKi9cbmZ1bmN0aW9uIGxvY2soJGVsZW1lbnQpIHtcblx0JGVsZW1lbnQuYWRkQ2xhc3MoJ25vRXZlbnRzJyk7XG5cdCRlbGVtZW50LmF0dHIoJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJyk7XG59XG5cbi8qKlxuICogQHBhcmFtICRlbGVtZW50XG4gKi9cbmZ1bmN0aW9uIHVubG9jaygkZWxlbWVudCkge1xuXHQkZWxlbWVudC5yZW1vdmVDbGFzcygnbm9FdmVudHMnKTtcblx0JGVsZW1lbnQucmVtb3ZlQXR0cignZGlzYWJsZWQnKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gcGF0aE5hbWVcbiAqL1xuZnVuY3Rpb24gc2V0UGF0aChwYXRoTmFtZSkge1xuXHRpZiAoIWNoZWNrV2hvbGVQYXRoKHBhdGhOYW1lKSAmJiBsbXNDb25uZWN0ZWQpIHtcblx0XHRzZXRTY29ybUluY29tcGxldGUoKTtcblx0fVxuXHRyZXR1cm4gKHNhdmVEYXRhLnBhdGhTZWxlY3RlZCA9IHBhdGhOYW1lKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gaW5wdXRcbiAqL1xuZnVuY3Rpb24gZ2V0Q29tcGxldGlvblN0YXR1cyhpbnB1dCkge1xuXHRpZiAoQXJyYXkuaXNBcnJheShpbnB1dCkpXG5cdFx0cmV0dXJuIGlucHV0LmV2ZXJ5KGZ1bmN0aW9uIChzbGlkZSkge1xuXHRcdFx0cmV0dXJuIGdldENvbXBsZXRpb25TdGF0dXMoc2xpZGUpO1xuXHRcdH0pO1xuXG5cdHZhciBjaGVja1NwZWNpZmljUGF0aCA9IGlucHV0ICYmIGlucHV0WzBdID09PSAnQCc7XG5cblx0aWYgKGNoZWNrU3BlY2lmaWNQYXRoKSByZXR1cm4gY2hlY2tXaG9sZVBhdGgoaW5wdXQuc3BsaXQoJ0AnKVsxXSk7XG5cblx0dmFyIHNsaWRlID0gIWlucHV0ID8gZ2xvYmFsVmFyLnNsaWRlIDogeyBpZDogaW5wdXQsIGRhdGE6IHNsaWRlc1tpbnB1dF0sICQ6ICQoJyMnICsgaW5wdXQpIH07XG5cblx0aWYgKCFzbGlkZS5kYXRhKSByZXR1cm4gY29uc29sZS53YXJuKCdpbnZhbGlkIHNsaWRlJyk7XG5cdGlmICghc2xpZGUuZGF0YS5pbmNsdWRlKSByZXR1cm47IC8vY29uc29sZS53YXJuKCdpbmNsdWRlOiBmYWxzZScpO1xuXG5cdHZhciBvbkN1clNsaWRlID0gc2xpZGUuaWQgPT09IGdsb2JhbFZhci5zbGlkZS5pZDtcblx0dmFyIHNsaWRlQ29tcGxldGlvbiA9IHNhdmVEYXRhLnNsaWRlQ29tcGxldGlvbjtcblx0dmFyIHBhdGhTZWxlY3RlZCA9IHNhdmVEYXRhLnBhdGhTZWxlY3RlZDtcblx0dmFyIHNwZWNpZmllZFBhdGggPSBzbGlkZS5kYXRhLmNvbXBsZXRpb25QYXRoO1xuXHR2YXIgcGF0aE9iaiA9IHNsaWRlQ29tcGxldGlvbi5tYWluUGF0aDtcblxuXHRpZiAoc3BlY2lmaWVkUGF0aCkge1xuXHRcdGlmIChBcnJheS5pc0FycmF5KHNwZWNpZmllZFBhdGgpKSB7XG5cdFx0XHRpZiAocGF0aFNlbGVjdGVkICYmIHNwZWNpZmllZFBhdGguaW5kZXhPZihwYXRoU2VsZWN0ZWQpID49IDApIHtcblx0XHRcdFx0cGF0aE9iaiA9IHNsaWRlQ29tcGxldGlvbltwYXRoU2VsZWN0ZWRdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGF0aE9iaiA9IHNsaWRlQ29tcGxldGlvbltzcGVjaWZpZWRQYXRoWzBdXTtcblx0XHRcdFx0aWYgKG9uQ3VyU2xpZGUpIHNldFBhdGgoc3BlY2lmaWVkUGF0aFswXSk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHBhdGhPYmogPSBzbGlkZUNvbXBsZXRpb25bc3BlY2lmaWVkUGF0aF07XG5cdFx0XHRpZiAob25DdXJTbGlkZSkgc2V0UGF0aChzcGVjaWZpZWRQYXRoKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gcGF0aE9ialtzbGlkZS5pZF07XG59XG5cbmZ1bmN0aW9uIGNoZWNrV2hvbGVQYXRoKHBhdGgpIHtcblx0dmFyIHBhdGhPYmogPSBzYXZlRGF0YS5zbGlkZUNvbXBsZXRpb25bcGF0aF07XG5cdGZvciAodmFyIGtleSBpbiBwYXRoT2JqKSB7XG5cdFx0aWYgKCFwYXRoT2JqW2tleV0pIHJldHVybiAwO1xuXHR9XG5cdHJldHVybiBwYXRoT2JqID8gMSA6IDA7XG59XG5cbmZ1bmN0aW9uIGNvbXBsZXRlU2xpZGUoaW5wdXQpIHtcblx0aWYgKEFycmF5LmlzQXJyYXkoaW5wdXQpKVxuXHRcdHJldHVybiBpbnB1dC5mb3JFYWNoKGZ1bmN0aW9uIChzbGlkZUlEKSB7XG5cdFx0XHRjb21wbGV0ZVNsaWRlKHNsaWRlSUQpO1xuXHRcdH0pO1xuXG5cdHZhciBzbGlkZSA9IGlucHV0ID8gZ2V0U2xpZGVIZWxwZXJzKGlucHV0KSA6IGdsb2JhbFZhci5zbGlkZTtcblxuXHRpZiAoIXNsaWRlLmRhdGEuaW5jbHVkZSkgcmV0dXJuO1xuXG5cdHZhciBzcGVjaWZpZWRQYXRoID0gc2xpZGUuZGF0YS5jb21wbGV0aW9uUGF0aDtcblx0dmFyIHNsaWRlQ29tcGxldGlvbiA9IHNhdmVEYXRhLnNsaWRlQ29tcGxldGlvbjtcblxuXHRpZiAoc3BlY2lmaWVkUGF0aCkge1xuXHRcdGlmIChBcnJheS5pc0FycmF5KHNwZWNpZmllZFBhdGgpKSB7XG5cdFx0XHRzcGVjaWZpZWRQYXRoLmZvckVhY2goZnVuY3Rpb24gKHBhdGgsIGlkeCkge1xuXHRcdFx0XHRzbGlkZUNvbXBsZXRpb25bcGF0aF1bc2xpZGUuaWRdID0gMTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSBzbGlkZUNvbXBsZXRpb25bc3BlY2lmaWVkUGF0aF1bc2xpZGUuaWRdID0gMTtcblx0fSBlbHNlIHNsaWRlQ29tcGxldGlvbi5tYWluUGF0aFtzbGlkZS5pZF0gPSAxO1xufVxuXG4vKipcbiAqIEBwYXJhbSBuYXZFbGVtXG4gKiBAcGFyYW0gc3R5bGVDbGFzc1xuICogQHBhcmFtIHN0eWxlQ2xhc3NJbnB1dFxuICogQHBhcmFtIGh0bWxcbiAqL1xuZnVuY3Rpb24gY3VzdG9tTmF2U3R5bGUobmF2RWxlbSwgc3R5bGVDbGFzc0lucHV0LCBodG1sKSB7XG5cdHZhciBpc0ljb24gPSBuYXZFbGVtLmluZGV4T2YoJ2ljb24nKSAhPT0gLTE7XG5cdHZhciBlbGVtID0gaXNJY29uID8gJCgnLnNpLWhlbHBlci1pY29uJykgOiAkKCcjc2ktJyArIG5hdkVsZW0pO1xuXHR2YXIgdW5pbmplY3RlZFNWRyA9IGVsZW0uZmluZCgnLmluamVjdC1tZTpub3QoLmluamVjdGVkLXN2ZyknKTtcblx0d2FpdEZvclNWR1ModW5pbmplY3RlZFNWRywgZnVuY3Rpb24gKCkge1xuXHRcdHZhciBzbGlkZSA9IGdsb2JhbFZhci5zbGlkZTtcblx0XHR2YXIgaW5pdGlhbEhUTUwgPSBlbGVtLmh0bWwoKTtcblx0XHR2YXIgZGVmYXVsdENsYXNzID0gc2xpZGUuaWQgKyAnLScgKyBuYXZFbGVtO1xuXHRcdHZhciBzdHlsZUNsYXNzID0gc3R5bGVDbGFzc0lucHV0ID8gc3R5bGVDbGFzc0lucHV0IDogZGVmYXVsdENsYXNzO1xuXG5cdFx0aWYgKGh0bWwpIGVsZW0uaHRtbChodG1sKTtcblxuXHRcdGVsZW0uYWRkQ2xhc3Moc3R5bGVDbGFzcyk7XG5cblx0XHRhZGRUb0Z1bmN0aW9uS2V5KHNsaWRlLmRhdGEsICdvbkV4aXRBY3Rpb24nLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRlbGVtLmh0bWwoaW5pdGlhbEhUTUwpO1xuXHRcdFx0ZWxlbS5yZW1vdmVDbGFzcyhzdHlsZUNsYXNzKTtcblx0XHR9KTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGFkZFRvRnVuY3Rpb25LZXkob2JqLCBmdW5jdGlvbktleSwgZnVuY3Rpb25hbGl0eVRvQWRkKSB7XG5cdG9ialtmdW5jdGlvbktleV0gPSAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBvcmlnaW5hbEtleSA9IG9ialtmdW5jdGlvbktleV07XG5cdFx0cmV0dXJuIGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChvcmlnaW5hbEtleSkgb3JpZ2luYWxLZXkuYXBwbHkodGhpcyk7XG5cdFx0XHRmdW5jdGlvbmFsaXR5VG9BZGQoKTtcblx0XHR9O1xuXHR9KSgpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB1bmluamVjdGVkU1ZHc1xuICogQHBhcmFtIHVuaW5qZWN0ZWRTVkdcbiAqIEBwYXJhbSBkb0FmdGVyV2FpdGluZ1xuICovXG5mdW5jdGlvbiB3YWl0Rm9yU1ZHUyh1bmluamVjdGVkU1ZHLCBkb0FmdGVyV2FpdGluZykge1xuXHRpZiAodW5pbmplY3RlZFNWRy5sZW5ndGggPiAwKSB7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgc3RpbGxVbmluamVjdGVkU1ZHcyA9IHVuaW5qZWN0ZWRTVkcucGFyZW50KCkuZmluZCgnLmluamVjdC1tZTpub3QoLmluamVjdGVkLXN2ZyknKTtcblx0XHRcdHdhaXRGb3JTVkdTKHN0aWxsVW5pbmplY3RlZFNWR3MsIGRvQWZ0ZXJXYWl0aW5nKTtcblx0XHR9LCAxMCk7XG5cdH0gZWxzZSB7XG5cdFx0ZG9BZnRlcldhaXRpbmcoKTtcblx0fVxufVxuXG5mdW5jdGlvbiBzbGlkZUFjdGlvbihpZCwgYWN0aW9uKSB7XG5cdHZhciBzbGlkZSA9IGdldFNsaWRlSGVscGVycyhpZCk7XG5cblx0dmFyIGhhc01hc3RlciA9IHR5cGVvZiBtYXN0ZXJTbGlkZSAhPT0gJ3VuZGVmaW5lZCc7XG5cdHZhciBtYXN0ZXJBY3Rpb24gPSBoYXNNYXN0ZXIgJiYgbWFzdGVyU2xpZGVbYWN0aW9uXTtcblxuXHR2YXIgZ3JvdXBzID0gQXJyYXkuaXNBcnJheShzbGlkZS5kYXRhLmdyb3VwcykgPyBzbGlkZS5kYXRhLmdyb3VwcyA6IFtzbGlkZS5kYXRhLmdyb3Vwc107XG5cdHZhciBoYXNHcm91cCA9IGdyb3Vwc1swXSAhPT0gdW5kZWZpbmVkO1xuXG5cdHZhciBzbGlkZUFjdGlvbiA9IHNsaWRlLmRhdGFbYWN0aW9uXTtcblx0dmFyIHN0YXJ0aW5nU2xpZGUgPSBzbGlkZS5pZDtcblx0dmFyIHNhbWVTbGlkZTtcblxuXHRtYXN0ZXJBY3Rpb24gJiYgbWFzdGVyQWN0aW9uKHNsaWRlKTtcblx0aGFzR3JvdXAgJiZcblx0XHRncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZ3JvdXApIHtcblx0XHRcdHJldHVybiBncm91cFthY3Rpb25dICYmIGdyb3VwW2FjdGlvbl0oc2xpZGUpO1xuXHRcdH0pO1xuXHRzbGlkZUFjdGlvbiAmJiBzbGlkZUFjdGlvbihzbGlkZSk7XG5cblx0c2FtZVNsaWRlID0gc3RhcnRpbmdTbGlkZSA9PT0gZ2xvYmFsVmFyLnNsaWRlLmlkO1xuXG5cdGlmIChzYW1lU2xpZGUpIHtcblx0XHRzd2l0Y2ggKGFjdGlvbikge1xuXHRcdFx0Y2FzZSAnbmV4dEFjdGlvbic6XG5cdFx0XHRcdG5leHRTbGlkZSgpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2JhY2tBY3Rpb24nOlxuXHRcdFx0XHRwcmV2U2xpZGUoKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIG1hc3RlckFjdGlvbiB8fCBzbGlkZUFjdGlvbjtcbn1cblxuZnVuY3Rpb24gYWRkQ29pbnMobnVtKSB7XG5cdHZhciBzbGlkZSA9IGdsb2JhbFZhci5zbGlkZTtcblx0dmFyIHNsaWRlQ29pbkRhdGEgPSBzYXZlRGF0YS5jb2luU2NvcmVbc2xpZGUuaWRdO1xuXHR2YXIgc2xpZGVFYXJuZWQgPSBzbGlkZUNvaW5EYXRhLmVhcm5lZCB8fCAwO1xuXHR2YXIgbXVsdGlwbGllciA9IHNsaWRlLmRhdGEuY29pblNldHRpbmdzLm11bHRpcGxpZXIgfHwgMTtcblxuXHR2YXIgY3VyVG90YWwgPSBzYXZlRGF0YS5jb2luU2NvcmUudG90YWxTY29yZSB8fCAwO1xuXG5cdGlmIChzbGlkZUVhcm5lZCA8IG11bHRpcGxpZXIpIHtcblx0XHRzbGlkZUNvaW5EYXRhLmVhcm5lZCA9IG11bHRpcGxpZXI7XG5cdFx0c2F2ZURhdGEuY29pblNjb3JlLnRvdGFsU2NvcmUgPSBtdWx0aXBsaWVyICsgY3VyVG90YWw7XG5cdFx0dXBkYXRlT25TY3JlZW5Ub3RhbChzYXZlRGF0YS5jb2luU2NvcmUudG90YWxTY29yZSk7XG5cdH0gZWxzZSByZXR1cm47XG59XG5mdW5jdGlvbiBhZGRDb2luRm9yQW5zd2VyKGFuc3dlcklkKSB7XG5cdHZhciBzbGlkZSA9IGdsb2JhbFZhci5zbGlkZTtcblxuXHRpZiAoc2F2ZURhdGEuY29pblNjb3JlW3NsaWRlLmlkXVthbnN3ZXJJZF0pIHtcblx0XHRyZXR1cm47XG5cdH1cblx0dmFyIGN1clRvdGFsID0gc2F2ZURhdGEuY29pblNjb3JlLnRvdGFsU2NvcmUgfHwgMDtcblx0dmFyIGluZGl2aWR1YWxNdWx0aXBsZXIgPSBzbGlkZXNbc2xpZGUuaWRdLmNvaW5TZXR0aW5ncy5pbmRpdmlkdWFsTXVsdGlwbGllciB8fCAxO1xuXHRzYXZlRGF0YS5jb2luU2NvcmVbc2xpZGUuaWRdLmVhcm5lZCA9IChzYXZlRGF0YS5jb2luU2NvcmVbc2xpZGUuaWRdLmVhcm5lZCB8fCAwKSArIGluZGl2aWR1YWxNdWx0aXBsZXI7XG5cdHNhdmVEYXRhLmNvaW5TY29yZVtzbGlkZS5pZF1bYW5zd2VySWRdID0gaW5kaXZpZHVhbE11bHRpcGxlcjtcblx0c2F2ZURhdGEuY29pblNjb3JlLnRvdGFsU2NvcmUgPSBjdXJUb3RhbCArIGluZGl2aWR1YWxNdWx0aXBsZXI7XG5cdHVwZGF0ZU9uU2NyZWVuVG90YWwoc2F2ZURhdGEuY29pblNjb3JlLnRvdGFsU2NvcmUpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVPblNjcmVlblRvdGFsKHRvdGFsKSB7XG5cdCQoJyNjb2luLXRleHQnKS5odG1sKHRvdGFsKTtcbn1cblxuZnVuY3Rpb24gZmlsdGVyT2JqKG9iaiwga2V5LCBjb25kaXRpb25GdW5jKSB7XG5cdHJldHVybiBPYmplY3Qua2V5cyhvYmopXG5cdFx0LmZpbHRlcihmdW5jdGlvbiAoaSkge1xuXHRcdFx0cmV0dXJuIGNvbmRpdGlvbkZ1bmMob2JqW2ldW2tleV0pO1xuXHRcdH0pXG5cdFx0LnJlZHVjZShyZWJ1aWxkT2JqKG9iaiksIHt9KTtcbn1cbmZ1bmN0aW9uIHJlYnVpbGRPYmoob2JqKSB7XG5cdHJldHVybiBmdW5jdGlvbiAocmVidWlsdE9iaiwga2V5KSB7XG5cdFx0cmVidWlsdE9ialtrZXldID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvYmpba2V5XSkpO1xuXHRcdHJldHVybiByZWJ1aWx0T2JqO1xuXHR9O1xufVxuZnVuY3Rpb24gY29weU9iaihvYmopIHtcblx0cmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkob2JqKSk7XG59XG5cbmZ1bmN0aW9uIGNoZWNrTG9ja1N1Ym1pdElmVW5hdHRlbXB0ZWQoZGF0YSkge1xuXHR2YXIgc2V0dGluZ3MgPSBkYXRhW2RhdGEudHlwZV07XG5cdHZhciBvdmVycmlkZSA9IHNldHRpbmdzLmxvY2tTdWJtaXRJZlVuYXR0ZW1wdGVkID09PSBmYWxzZTtcblxuXHRyZXR1cm4gKGdsb2JhbFZhci5sb2NrU3VibWl0SWZVbmF0dGVtcHRlZCAmJiAhb3ZlcnJpZGUpIHx8IHNldHRpbmdzLmxvY2tTdWJtaXRJZlVuYXR0ZW1wdGVkO1xufVxuZnVuY3Rpb24gbG9ja0J1dHRvbk5vd1VubG9ja09uRXhpdCgkYnV0dG9uLCBzbGlkZU9iaikge1xuXHR2YXIgc2xpZGVPYmogPSBzbGlkZU9iaiB8fCBnbG9iYWxWYXIuc2xpZGUuZGF0YTtcblxuXHRsb2NrKCRidXR0b24pO1xuXG5cdGlmIChzbGlkZU9iai52aXNpdGVkKSByZXR1cm47XG5cblx0YWRkVG9GdW5jdGlvbktleShzbGlkZU9iaiwgJ29uRXhpdEFjdGlvbicsIGZ1bmN0aW9uICgpIHtcblx0XHR1bmxvY2soJGJ1dHRvbik7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBnZXRTbGlkZUhlbHBlcnMoaWQpIHtcblx0dmFyIGlkID0gaWQ7XG5cdHJldHVybiB7XG5cdFx0aWQ6IGlkLFxuXHRcdCRkb206ICQoJyMnICsgaWQpLFxuXHRcdGRhdGE6IHNsaWRlc1tpZF1cblx0fTtcbn1cblxuY29uc3QgZWFjaFNsaWRlID0gY2FsbGJhY2sgPT4gT2JqZWN0LmtleXMoc2xpZGVzKS5mb3JFYWNoKChzbGlkZUlELCBpZHgpID0+IGNhbGxiYWNrKGdldFNsaWRlSGVscGVycyhzbGlkZUlEKSwgaWR4KSk7XG5cbmNvbnN0IG1ha2VUcnVlQXJyYXkgPSBmYWxzZUFycmF5ID0+IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGZhbHNlQXJyYXkpO1xuXG4vLy8vLy8vLy8vLy8qRmVhdHVyZTppZGViZWhvbGQvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmZ1bmN0aW9uIGluc3RhQ2hlYXRBZGRvbigpIHtcblx0Y29uc29sZS5sb2coXCJIZWxsbywgSSdtIHlvdXIgaW5zdGFDaGVhdOKEoiBhZGRvbiBmb3IgdG9kYXkhXCIpO1xufVxuXG4vL3RoZSBob2x5IGNoZWF0ZnVuY3Rpb24hISFcbi8qKlxuICpcbiAqL1xuZnVuY3Rpb24gZGV2TW9kZSgpIHtcblx0dmFyIHNsaWRlID0gZ2xvYmFsVmFyLnNsaWRlO1xuXHQvLyBDaGVhdCBjb2RlLiBTZWUgRG9vbS5cblxuXHQkKCdib2R5JykuYWRkQ2xhc3MoJ2Rldi1tb2RlJyk7XG5cdGNvbnNvbGUubG9nKCdHT0QgTU9ERSEnKTtcblx0JCgnI2d1aWRlbGluZXMnKS5zaG93KCk7XG5cblx0JChkb2N1bWVudCkua2V5dXAoZnVuY3Rpb24gKGUpIHtcblx0XHQvLyAnZycga2V5IHRvZ2dsZXMgZ3JpZCBsaW5lc1xuXHRcdGlmIChlLndoaWNoID09IDcxKSB7XG5cdFx0XHRpZiAoJCgnI2d1aWRlbGluZXMnKS5jc3MoJ2Rpc3BsYXknKSAhPSAnbm9uZScpIHtcblx0XHRcdFx0JCgnI2d1aWRlbGluZXMnKS5oaWRlKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkKCcjZ3VpZGVsaW5lcycpLnNob3coKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBzaGlmdCArIGFycm93IGtleXMgYWxsb3cgbmF2aWdhdGlvbiB0aHJvdWdoIGhvcml6b250YWwgYW5kIHZlcnRpY2FsIHNsaWRlc1xuXHRcdGlmIChlLnNoaWZ0S2V5ICYmIGUud2hpY2ggPT0gMzcpIHtcblx0XHRcdFJldmVhbC5sZWZ0KCk7XG5cdFx0fVxuXHRcdGlmIChlLnNoaWZ0S2V5ICYmIGUud2hpY2ggPT0gMzkpIHtcblx0XHRcdFJldmVhbC5yaWdodCgpO1xuXHRcdH1cblx0XHRpZiAoZS5zaGlmdEtleSAmJiBlLndoaWNoID09IDM4KSB7XG5cdFx0XHRSZXZlYWwudXAoKTtcblx0XHR9XG5cdFx0aWYgKGUuc2hpZnRLZXkgJiYgZS53aGljaCA9PSA0MCkge1xuXHRcdFx0UmV2ZWFsLmRvd24oKTtcblx0XHR9XG5cblx0XHQvLyAnaicga2V5IHJldmVhbHMgcG9zaXRpdmUgZmVlZGJhY2tcblx0XHRpZiAoZS53aGljaCA9PT0gNzQpIHtcblx0XHRcdHNpbXBsZU1vZGFsQ2xvc2UoKTtcblx0XHRcdHNpbXBsZU1vZGFsT3BlbigncG9zaXRpdmUnKTtcblx0XHR9XG5cdFx0Ly8gICdrJyBrZXkgcmV2ZWFscyBuZWdhdGl2ZSBmZWVkYmFjayAxXG5cdFx0aWYgKGUud2hpY2ggPT09IDc1KSB7XG5cdFx0XHRzaW1wbGVNb2RhbENsb3NlKCk7XG5cdFx0XHRpZiAoc2xpZGUuZGF0YS5tb2RhbC5uZWdhdGl2ZSkge1xuXHRcdFx0XHRzaW1wbGVNb2RhbE9wZW4oJ25lZ2F0aXZlJyk7XG5cdFx0XHR9IGVsc2UgaWYgKHNsaWRlLmRhdGEubW9kYWwubmVnYXRpdmUxKSB7XG5cdFx0XHRcdHNpbXBsZU1vZGFsT3BlbignbmVnYXRpdmUxJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vICdsJyBrZXkgcmV2ZWFscyBuZWdhdGl2ZSBmZWVkYmFjayAyXG5cdFx0aWYgKGUud2hpY2ggPT09IDc2KSB7XG5cdFx0XHRzaW1wbGVNb2RhbENsb3NlKCk7XG5cdFx0XHRzaW1wbGVNb2RhbE9wZW4oJ25lZ2F0aXZlRmluYWwnKTtcblx0XHR9XG5cdFx0Ly8gMSAtIDkgZm9yIGhvdHNwb3RzXG5cdFx0aWYgKGUud2hpY2ggPT09IDQ5ICYmIHNsaWRlLmRhdGEubW9kYWwuaHMxKSB7XG5cdFx0XHRzaW1wbGVNb2RhbENsb3NlKCk7XG5cdFx0XHRzaW1wbGVNb2RhbE9wZW4oJ2hzMScpO1xuXHRcdH1cblx0XHRpZiAoZS53aGljaCA9PT0gNTAgJiYgc2xpZGUuZGF0YS5tb2RhbC5oczIpIHtcblx0XHRcdHNpbXBsZU1vZGFsQ2xvc2UoKTtcblx0XHRcdHNpbXBsZU1vZGFsT3BlbignaHMyJyk7XG5cdFx0fVxuXHRcdGlmIChlLndoaWNoID09PSA1MSAmJiBzbGlkZS5kYXRhLm1vZGFsLmhzMykge1xuXHRcdFx0c2ltcGxlTW9kYWxDbG9zZSgpO1xuXHRcdFx0c2ltcGxlTW9kYWxPcGVuKCdoczMnKTtcblx0XHR9XG5cdFx0aWYgKGUud2hpY2ggPT09IDUyICYmIHNsaWRlLmRhdGEubW9kYWwuaHM0KSB7XG5cdFx0XHRzaW1wbGVNb2RhbENsb3NlKCk7XG5cdFx0XHRzaW1wbGVNb2RhbE9wZW4oJ2hzNCcpO1xuXHRcdH1cblx0XHRpZiAoZS53aGljaCA9PT0gNTMgJiYgc2xpZGUuZGF0YS5tb2RhbC5oczUpIHtcblx0XHRcdHNpbXBsZU1vZGFsQ2xvc2UoKTtcblx0XHRcdHNpbXBsZU1vZGFsT3BlbignaHM1Jyk7XG5cdFx0fVxuXHRcdGlmIChlLndoaWNoID09PSA1NCAmJiBzbGlkZS5kYXRhLm1vZGFsLmhzNikge1xuXHRcdFx0c2ltcGxlTW9kYWxDbG9zZSgpO1xuXHRcdFx0c2ltcGxlTW9kYWxPcGVuKCdoczYnKTtcblx0XHR9XG5cdFx0aWYgKGUud2hpY2ggPT09IDU1ICYmIHNsaWRlLmRhdGEubW9kYWwuaHM3KSB7XG5cdFx0XHRzaW1wbGVNb2RhbENsb3NlKCk7XG5cdFx0XHRzaW1wbGVNb2RhbE9wZW4oJ2hzNycpO1xuXHRcdH1cblx0XHRpZiAoZS53aGljaCA9PT0gNTYgJiYgc2xpZGUuZGF0YS5tb2RhbC5oczgpIHtcblx0XHRcdHNpbXBsZU1vZGFsQ2xvc2UoKTtcblx0XHRcdHNpbXBsZU1vZGFsT3BlbignaHM4Jyk7XG5cdFx0fVxuXHRcdGlmIChlLndoaWNoID09PSA1NyAmJiBzbGlkZS5kYXRhLm1vZGFsLmhzOSkge1xuXHRcdFx0c2ltcGxlTW9kYWxDbG9zZSgpO1xuXHRcdFx0c2ltcGxlTW9kYWxPcGVuKCdoczknKTtcblx0XHR9XG5cblx0XHQvLyAgJzsnIGtleSBoaWRlcyBhbGwgZmVlZGJhY2tzXG5cdFx0aWYgKGUud2hpY2ggPT0gMTg2KSB7XG5cdFx0XHRzaW1wbGVNb2RhbENsb3NlKCk7XG5cdFx0fVxuXHR9KTtcbn1cblxuLyoqXG4gKiBEaXNwbGF5cyB0aGUgaW5wdXQgdmFyaWFibGUgcHJldHRpZmllZCBhbmQgZXhwYW5kZWQgaW4gdGhlIGNvbnNvbGUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgIE5hbWUgb2YgdGhlIHZhcmlhYmxlIHRvIGJlIGRpc3BsYXllZC5cbiAqIEBwYXJhbSB7YW55fSBkYXRhIFRoZSB2YXJpYWJsZSB0byBiZSBkaXNwbGF5ZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gbWF4RGVwdGggVGhlIG1heGltdW0gZGVwdGggb2YgdGhlIG9iamVjdCB0byBiZSBkaXNwbGF5ZWQgKGRlZmF1bHQ6IDEwMCkuIFNldCBpdCB0byAwIHRvIGhhdmUgZXZlcnl0aGluZyBjb2xsYXBzZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gZGVwdGggVGhlIGN1cnJlbnQgZGVwdGggb2YgdGhlIG9iamVjdCB0byBiZSBkaXNwbGF5ZWQgKGRlZmF1bHQ6IDApIElnbm9yZS4gVXNlZCBpbnRlcm5hbGx5LlxuICogQHJldHVybnMge2FueX0gVGhlIGlucHV0IHZhcmlhYmxlLlxuICovXG4gZnVuY3Rpb24gZHVtcChuYW1lLCBkYXRhLCBtYXhEZXB0aCA9IDEwMCwgZGVwdGggPSAxKSB7XG5cdGlmICh0eXBlb2YgZGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRkYXRhID0gbmFtZTtcblx0XHRuYW1lID0gJ3ZhcmlhYmxlJztcblx0fVxuXHRjb25zdCBzdHlsZUJvbGRVbmRlcmxpbmUgPSAnZm9udC13ZWlnaHQ6IGJvbGQ7IHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lOyc7XG5cdGNvbnN0IHN0eWxlTm9VbmRlcmxpbmUgPSAndGV4dC1kZWNvcmF0aW9uOiBub25lOyc7XG5cdGNvbnN0IHN0eWxlRm9udE5vcm1hbCA9ICdmb250LXdlaWdodDogbm9ybWFsOyc7XG5cdGNvbnN0IHN0eWxlRm9udEJvbGQgPSAnZm9udC13ZWlnaHQ6IGJvbGQ7Jztcblx0Y29uc3Qgc3R5bGVGdW5jdGlvbiA9ICdmb250LXdlaWdodDogbm9ybWFsOyBmb250LXN0eWxlOiBpdGFsaWM7IGNvbG9yOiB0ZWFsOyc7XG5cdGNvbnN0IHN0eWxlU3RyaW5nID0gJ2ZvbnQtd2VpZ2h0OiBub3JtYWw7IGZvbnQtc3R5bGU6IG5vcm1hbDsgY29sb3I6ICNmMDA7Jztcblx0Y29uc3Qgc3R5bGVCb29sZWFuID0gJ2ZvbnQtd2VpZ2h0OiBub3JtYWw7IGZvbnQtc3R5bGU6IG5vcm1hbDsgY29sb3I6IHRlYWw7Jztcblx0Y29uc3Qgc3R5bGVOdW1iZXIgPSAnZm9udC13ZWlnaHQ6IG5vcm1hbDsgZm9udC1zdHlsZTogbm9ybWFsOyBjb2xvcjogdGVhbDsnO1xuXG5cdGxldCBzdGFydEJyYWNrZXQgPSAnJztcblx0bGV0IGVuZEJyYWNrZXQgPSAnJztcblxuXHRpZiAoQXJyYXkuaXNBcnJheShkYXRhKSAmJiBhcnJheVZhbHVlc0FyZUFsbE5vbk9iamVjdHMoZGF0YSkpIHtcblx0XHRjb25zdCB2YWx1ZXMgPSBbXTtcblx0XHRkYXRhLmZvckVhY2goZWxlbWVudCA9PiB7XG5cdFx0XHR2YWx1ZXMucHVzaChlbGVtZW50KTtcblx0XHR9KTtcblx0XHRjb25zb2xlLmxvZyhgJWMke25hbWV9JWM6YCwgc3R5bGVCb2xkVW5kZXJsaW5lLCBzdHlsZUZvbnROb3JtYWwsIHZhbHVlcyk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG5cdFx0ZGF0YSA9IGBcIiR7ZGF0YX1cImA7XG5cdFx0Y29uc29sZS5sb2coYCVjJHtuYW1lfSVjOiAlYyR7ZGF0YX1gLCBzdHlsZUJvbGRVbmRlcmxpbmUsIHN0eWxlRm9udE5vcm1hbCwgc3R5bGVTdHJpbmcpO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBkYXRhID09PSAnYm9vbGVhbicpIHtcblx0XHRjb25zb2xlLmxvZyhgJWMke25hbWV9JWM6ICVjJHtkYXRhfWAsIHN0eWxlQm9sZFVuZGVybGluZSwgc3R5bGVGb250Tm9ybWFsLCBzdHlsZUJvb2xlYW4pO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBkYXRhID09PSAnbnVtYmVyJykge1xuXHRcdGNvbnNvbGUubG9nKGAlYyR7bmFtZX0lYzogJWMke2RhdGF9YCwgc3R5bGVCb2xkVW5kZXJsaW5lLCBzdHlsZUZvbnROb3JtYWwsIHN0eWxlTnVtYmVyKTtcblx0fSBlbHNlIGlmICh0eXBlb2YgZGF0YSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdGNvbnNvbGUuZ3JvdXBDb2xsYXBzZWQoYCVjJHtuYW1lfSVjOiAlY8aSKClgLCBzdHlsZUJvbGRVbmRlcmxpbmUsIHN0eWxlRm9udE5vcm1hbCwgc3R5bGVGdW5jdGlvbik7XG5cdFx0Y29uc29sZS5sb2coZGF0YSk7XG5cdFx0Y29uc29sZS5ncm91cEVuZCgpO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBkYXRhID09PSAnb2JqZWN0JyAmJiBPYmplY3Qua2V5cyhkYXRhKS5sZW5ndGggPT09IDApIHtcblx0XHRjb25zb2xlLmxvZyhgJWMke25hbWV9JWM6IHt9YCwgc3R5bGVCb2xkVW5kZXJsaW5lLCBzdHlsZU5vVW5kZXJsaW5lKTtcblx0fSBlbHNlIHtcblx0XHRpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuXHRcdFx0c3RhcnRCcmFja2V0ID0gJ1snO1xuXHRcdFx0ZW5kQnJhY2tldCA9ICddJztcblx0XHR9IGVsc2Uge1xuXHRcdFx0c3RhcnRCcmFja2V0ID0gJ3snO1xuXHRcdFx0ZW5kQnJhY2tldCA9ICd9Jztcblx0XHR9XG5cdFx0Y29uc29sZS5sb2coYFxcbiVjJHtuYW1lfSVjOiAke3N0YXJ0QnJhY2tldH1gLCBzdHlsZUJvbGRVbmRlcmxpbmUsIHN0eWxlTm9VbmRlcmxpbmUpO1xuXHRcdHBhcnNlT2JqZWN0KGRhdGEsIG1heERlcHRoLCBkZXB0aCk7XG5cdFx0Y29uc29sZS5sb2coYCVjJHtlbmRCcmFja2V0fVxcblxcbmAsIHN0eWxlRm9udE5vcm1hbCk7XG5cdH1cblxuXHRyZXR1cm4gZGF0YTtcblx0ZnVuY3Rpb24gcGFyc2VPYmplY3QoZGF0YSwgbWF4RGVwdGggPSAxMDAsIGRlcHRoID0gMCkge1xuXHRcdGlmICh0eXBlb2YgZGF0YSA9PT0gJ29iamVjdCcgJiYgZGF0YSAhPT0gbnVsbCkge1xuXHRcdFx0T2JqZWN0LmVudHJpZXMoZGF0YSkuZm9yRWFjaCgoW2tleSwgdmFsdWVdLCBpbmRleCkgPT4ge1xuXHRcdFx0XHRjb25zdCBpdGVtTGVuZ3RoID0gT2JqZWN0LmtleXMoZGF0YSkubGVuZ3RoO1xuXHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRcdGxldCBzdGFydEJyYWNrZXQgPSAnJztcblx0XHRcdFx0XHRsZXQgZW5kQnJhY2tldCA9ICcnO1xuXHRcdFx0XHRcdGxldCB2YWx1ZUlzRW1wdHkgPSBmYWxzZTtcblxuXHRcdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuXHRcdFx0XHRcdFx0c3RhcnRCcmFja2V0ID0gJ1snO1xuXHRcdFx0XHRcdFx0ZW5kQnJhY2tldCA9ICddJztcblx0XHRcdFx0XHRcdGlmICh2YWx1ZS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRcdFx0dmFsdWVJc0VtcHR5ID0gdHJ1ZTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoYXJyYXlWYWx1ZXNBcmVBbGxOb25PYmplY3RzKHZhbHVlKSkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCB2YWx1ZXMgPSBbXTtcblx0XHRcdFx0XHRcdFx0dmFsdWUuZm9yRWFjaChlbGVtZW50ID0+IHtcblx0XHRcdFx0XHRcdFx0XHR2YWx1ZXMucHVzaChlbGVtZW50KTtcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdFx0XHRcdGAgICVjJHtrZXl9JWM6YCxcblx0XHRcdFx0XHRcdFx0XHRzdHlsZUZvbnRCb2xkLFxuXHRcdFx0XHRcdFx0XHRcdHN0eWxlRm9udE5vcm1hbCxcblx0XHRcdFx0XHRcdFx0XHR2YWx1ZXMsXG5cdFx0XHRcdFx0XHRcdFx0YCR7aW5kZXggKyAxID09PSBpdGVtTGVuZ3RoID8gJycgOiAnLCd9YFxuXHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHN0YXJ0QnJhY2tldCA9ICd7Jztcblx0XHRcdFx0XHRcdGVuZEJyYWNrZXQgPSAnfSc7XG5cdFx0XHRcdFx0XHRpZiAoT2JqZWN0LmtleXModmFsdWUpLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdFx0XHR2YWx1ZUlzRW1wdHkgPSB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmICh2YWx1ZUlzRW1wdHkpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdFx0XHRgICAlYyR7a2V5fTogJWMke3N0YXJ0QnJhY2tldH0ke2VuZEJyYWNrZXR9JHtpbmRleCArIDEgPT09IGl0ZW1MZW5ndGggPyAnJyA6ICcsJ31gLFxuXHRcdFx0XHRcdFx0XHRzdHlsZUZvbnRCb2xkLFxuXHRcdFx0XHRcdFx0XHRzdHlsZUZvbnROb3JtYWxcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmIChkZXB0aCA+IG1heERlcHRoKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUuZ3JvdXBDb2xsYXBzZWQoYCAgJWMke2tleX06ICVjJHtzdGFydEJyYWNrZXR9YCwgc3R5bGVGb250Qm9sZCwgc3R5bGVGb250Tm9ybWFsKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUuZ3JvdXAoYCAgJWMke2tleX06ICVjJHtzdGFydEJyYWNrZXR9YCwgc3R5bGVGb250Qm9sZCwgc3R5bGVGb250Tm9ybWFsKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHBhcnNlT2JqZWN0KHZhbHVlLCBtYXhEZXB0aCwgZGVwdGggKyAxKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGAlYyR7ZW5kQnJhY2tldH0ke2luZGV4ICsgMSA9PT0gaXRlbUxlbmd0aCA/ICcnIDogJywnfWAsIHN0eWxlRm9udE5vcm1hbCk7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmdyb3VwRW5kKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmIChOdW1iZXIuaXNOYU4ocGFyc2VJbnQoa2V5KSkpIHtcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0XHRcdHZhbHVlID0gYFwiJHt2YWx1ZX1cImA7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdFx0XHRcdGAgICVjJHtrZXl9OiAlYyR7dmFsdWV9JHtpbmRleCArIDEgPT09IGl0ZW1MZW5ndGggPyAnJyA6ICcsJ31gLFxuXHRcdFx0XHRcdFx0XHRcdHN0eWxlRm9udEJvbGQsXG5cdFx0XHRcdFx0XHRcdFx0c3R5bGVTdHJpbmdcblx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicpIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXG5cdFx0XHRcdFx0XHRcdFx0YCAgJWMke2tleX06ICVjJHt2YWx1ZX0ke2luZGV4ICsgMSA9PT0gaXRlbUxlbmd0aCA/ICcnIDogJywnfWAsXG5cdFx0XHRcdFx0XHRcdFx0c3R5bGVGb250Qm9sZCxcblx0XHRcdFx0XHRcdFx0XHRzdHlsZUJvb2xlYW5cblx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcblx0XHRcdFx0XHRcdFx0XHRgICAlYyR7a2V5fTogJWMke3ZhbHVlfSR7aW5kZXggKyAxID09PSBpdGVtTGVuZ3RoID8gJycgOiAnLCd9YCxcblx0XHRcdFx0XHRcdFx0XHRzdHlsZUZvbnRCb2xkLFxuXHRcdFx0XHRcdFx0XHRcdHN0eWxlTnVtYmVyXG5cdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmdyb3VwQ29sbGFwc2VkKFxuXHRcdFx0XHRcdFx0XHRcdGAgICVjJHtrZXl9OiAlY8aSKCklYyR7aW5kZXggKyAxID09PSBpdGVtTGVuZ3RoID8gJycgOiAnLCd9YCxcblx0XHRcdFx0XHRcdFx0XHRzdHlsZUZvbnRCb2xkLFxuXHRcdFx0XHRcdFx0XHRcdHN0eWxlRnVuY3Rpb24sXG5cdFx0XHRcdFx0XHRcdFx0c3R5bGVGb250Tm9ybWFsXG5cdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGAlYyR7dmFsdWV9YCwgc3R5bGVGb250Tm9ybWFsKTtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5ncm91cEVuZCgpO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXG5cdFx0XHRcdFx0XHRcdFx0YCAgJWMke2tleX0gKCR7dHlwZW9mIHZhbHVlfSk6ICVjJHt2YWx1ZX0ke2luZGV4ICsgMSA9PT0gaXRlbUxlbmd0aCA/ICcnIDogJywnfWAsXG5cdFx0XHRcdFx0XHRcdFx0c3R5bGVGb250Qm9sZCxcblx0XHRcdFx0XHRcdFx0XHRzdHlsZUZvbnROb3JtYWxcblx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coYCAgJWMke3ZhbHVlfSR7aW5kZXggKyAxID09PSBpdGVtTGVuZ3RoID8gJycgOiAnLCd9YCwgc3R5bGVGb250Tm9ybWFsKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLmxvZyhkYXRhKTtcblx0XHR9XG5cdH1cblx0ZnVuY3Rpb24gYXJyYXlWYWx1ZXNBcmVBbGxOb25PYmplY3RzKGFycmF5KSB7XG5cdFx0cmV0dXJuIGFycmF5LmV2ZXJ5KHZhbHVlID0+IHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpO1xuXHR9XG59XG5cbi8qKlxuICogQSBzaW1wbGUgcHJldHRpZmllZCBjb25zb2xlIG91dHB1dC5cbiAqXG4gKiBAcGFyYW0ge2FueX0gZGF0YSBUaGUgdmFyaWFibGUgdG8gYmUgZGlzcGxheWVkLlxuICogQHJldHVybnMge2FueX0gVGhlIGlucHV0IHZhcmlhYmxlLlxuICovXG5mdW5jdGlvbiBwcmV0dHkoZGF0YSkge1xuXHRjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKSk7XG5cdHJldHVybiBkYXRhO1xufVxuXG4vKipcbiAqIEEgc2ltcGxlIGNvbnNvbGUgb3V0cHV0IG9mIHZhbHVlcywgc2FucyB0aGUgcHJveHkgcGFydC5cbiAqXG4gKiBAcGFyYW0gIHsuLi5hbnl9IHZhbHVlcyBPbmUgb3IgbW9yZSB2YWx1ZXMgdG8gYmUgZGlzcGxheWVkLlxuICogQHJldHVybnMge2FueX0gVGhlIGlucHV0IHZhcmlhYmxlLlxuICovXG5mdW5jdGlvbiB1bnByb3hpZnkoLi4udmFsdWVzKSB7XG5cdGNvbnN0IG91dHB1dCA9IFtdO1xuXHR2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB7XG5cdFx0b3V0cHV0LnB1c2goSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh2YWx1ZSkpKTtcblx0fSk7XG5cdGNvbnNvbGUubG9nKC4uLm91dHB1dCk7XG5cdHJldHVybiB2YWx1ZXM7XG59XG5cbndpbmRvdy5jb25zb2xlLnZhciA9IHdpbmRvdy5jb25zb2xlLmR1bXAgPSBkdW1wO1xud2luZG93LmNvbnNvbGUucHJldHR5ID0gcHJldHR5O1xud2luZG93LmNvbnNvbGUudW5wcm94aWZ5ID0gd2luZG93LmRwID0gdW5wcm94aWZ5O1xuIiwiLy8gZG8gbm90IHVzZSB0aGUgaWQgJ3Rlc3QnIGZvciBhIHNsaWRlXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XG5cdHZhciB2aWRlb1NsaWRlID0ge1xuXHRcdHR5cGU6ICd2aWRlbycsXG5cdFx0bmF2RWxlbWVudHM6IFsndmlkZW8taG9tZSddLFxuXHRcdG5leHRBY3Rpb246IGZ1bmN0aW9uICgpIHtcblx0XHRcdGNvbXBsZXRlU2xpZGUoKTtcblx0XHRcdG5leHRTbGlkZSgpO1xuXHRcdH0sXG5cdFx0dmlkZW9Mb2FkZWQ6IGZhbHNlIC8vZG9uJ3QgZWRpdFxuXHR9O1xuXG5cdHNsaWRlcyA9IHtcblx0XHRzdGFydDoge1xuXHRcdFx0dHlwZTogJ3RleHQnLFxuXHRcdFx0bmF2RWxlbWVudHM6IFsnc3RhcnQtc2xpZGUnLCAnbG9nbyddLFxuXHRcdFx0YmFja0FjdGlvbjogZnVuY3Rpb24gKHNsaWRlKSB7fSwgLy9sZWF2ZSBTdGFydCBiYWNrQWN0aW9uIGFzIGZ1bmN0aW9uIHRvIHByZXZlbnQgSUU5IGVycm9yc1xuXHRcdFx0b25FbnRlckFjdGlvbjogZnVuY3Rpb24gKHNsaWRlKSB7fSxcblx0XHRcdGF1ZGlvOiB7XG5cdFx0XHRcdG9uRW50ZXI6ICdtZWRpYS9hdWRpby92by9zdGFydC5tcDMnXG5cdFx0XHR9LFxuXHRcdFx0aW5jbHVkZTogZmFsc2UgLy8gdGhpcyBrZXkgZGV0ZXJtaW5lcyBpZiB0aGUgc2xpZGUgd2lsbCBiZSB1c2VkIGFzIHBhcnQgb2YgdGhlIGNvbXBsZXRpb24gb2YgdGhlIHByb2dyZXNzIG1ldGVyLiBkZWZhdWx0IGlzIHRydWUuICBkbyBub3QgY2FsbCBjb21wbGV0ZVNsaWRlKCkgb24gYW55IHNsaWRlIHdoZXJlIHRoaXMgaXMgc2V0IHRvIGZhbHNlXG5cdFx0fSxcblx0XHR2MToge1xuXHRcdFx0Z3JvdXBzOiB2aWRlb1NsaWRlLFxuXHRcdFx0bmF2RWxlbWVudHM6IFsnIWhvbWUnXSAvL2V4Y2x1ZGUgaG9tZSBvciBtZW51IGJ1dHRvbiBvbiBpbnRybyB2aWRlb3MgdGhhdCBjb21lIGJlZm9yZSBtYWluIG1lbnVcblx0XHR9LFxuXHRcdG1lbnU6IHtcblx0XHRcdHR5cGU6ICdtZW51Jyxcblx0XHRcdG1lbnU6IHtcblx0XHRcdFx0bGluZWFyOiB0cnVlLFxuXHRcdFx0XHRtZW51Q2xhc3M6ICdzaS1tZW51X19qcycsXG5cdFx0XHRcdG5hdmlnYXRpb246IFsndjInLCAndjQnLCAnaTQnLCAndjUnLCAnaTYnXSxcblx0XHRcdFx0Y29tcGxldGlvbklEczogWydpMicsICdpMycsICdpNGInLCAndjYnLCAnaTYnXVxuXHRcdFx0fSxcblx0XHRcdGluY2x1ZGU6IGZhbHNlXG5cdFx0fSxcblx0XHR2Mjoge1xuXHRcdFx0Z3JvdXBzOiB2aWRlb1NsaWRlLFxuXHRcdFx0YmFja0FjdGlvbjogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRqdW1wVG9JZCgnbWVudScpO1xuXHRcdFx0fSxcblx0XHRcdG5hdkVsZW1lbnRzOiBbJyFob21lJ10gLy9leGNsdWRlIGhvbWUgb3IgbWVudSBidXR0b24gb24gaW50cm8gdmlkZW9zIHRoYXQgY29tZSBiZWZvcmUgbWFpbiBtZW51XG5cdFx0fSxcblx0XHRpMToge1xuXHRcdFx0dHlwZTogJ2hvdHNwb3QnLFxuXHRcdFx0bmF2RWxlbWVudHM6IFsnc3RhbmRhcmQtaG9tZScsICdzdWJtaXQnLCAncmVzZXQnXSxcblx0XHRcdG5leHRBY3Rpb246IGZ1bmN0aW9uIChzbGlkZSkge1xuXHRcdFx0XHRjb21wbGV0ZVNsaWRlKCk7XG5cdFx0XHRcdG5leHRTbGlkZSgpO1xuXHRcdFx0fSxcblx0XHRcdG9uRW50ZXJBY3Rpb246IGZ1bmN0aW9uIChzbGlkZSkge1xuXHRcdFx0XHQkKCcjY2FyJykuYXR0cignY2xhc3MnLCAncG9zMCcpO1xuXHRcdFx0fSxcblx0XHRcdGhvdHNwb3Q6IHtcblx0XHRcdFx0dXNlckF0dGVtcHRzOiAyLFxuXHRcdFx0XHRxdWl6OiB7XG5cdFx0XHRcdFx0dHlwZTogJ21jcScsXG5cdFx0XHRcdFx0YW5zd2VyczogWzQsIDUsIDYsIDcsIDgsIDldXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uQ2xpY2s6IGZ1bmN0aW9uIChob3RzcG90LCBtb2RhbCkge1xuXHRcdFx0XHRcdHZhciBpZCA9ICQoaG90c3BvdCkuYXR0cignaWQnKS5jaGFyQXQoMSk7XG5cblx0XHRcdFx0XHR2YXIgcG9zID0gJ3BvcycgKyBpZDtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhwb3MpO1xuXHRcdFx0XHRcdCQoJyNjYXInKS5hdHRyKCdjbGFzcycsIHBvcyk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRhdWRpbzoge1xuXHRcdFx0XHRvbkVudGVyOiAnbWVkaWEvYXVkaW8vdm8vaTEubXAzJyxcblx0XHRcdFx0cG9zaXRpdmU6ICdtZWRpYS9hdWRpby92by9pMVAubXAzJyxcblx0XHRcdFx0bmVnYXRpdmU6ICdtZWRpYS9hdWRpby92by9pMU4ubXAzJyxcblx0XHRcdFx0bmVnYXRpdmVGaW5hbDogJ21lZGlhL2F1ZGlvL3ZvL2kxTk4ubXAzJ1xuXHRcdFx0fSxcblx0XHRcdG1vZGFsOiB7XG5cdFx0XHRcdC8vIG5vRmVlZGJhY2s6IHRydWUsIC8vZGVmYXVsdHMgdG8gZmFsc2UsIHNldCB0byB0cnVlIGlmIHlvdSBkbyBub3Qgd2FudCBmZWVkYmFja3Ncblx0XHRcdFx0cG9zaXRpdmU6ICdpMS1wb3NpdGl2ZScsXG5cdFx0XHRcdG5lZ2F0aXZlOiAnaTEtbmVnYXRpdmUnLFxuXHRcdFx0XHRuZWdhdGl2ZUZpbmFsOiAnaTEtbmVnYXRpdmUtZmluYWwnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR2Mzoge1xuXHRcdFx0Z3JvdXBzOiB2aWRlb1NsaWRlLFxuXHRcdFx0bmF2RWxlbWVudHM6IFsnIWhvbWUnXSAvL2V4Y2x1ZGUgaG9tZSBvciBtZW51IGJ1dHRvbiBvbiBpbnRybyB2aWRlb3MgdGhhdCBjb21lIGJlZm9yZSBtYWluIG1lbnVcblx0XHR9LFxuXHRcdGkyOiB7XG5cdFx0XHRuYXZFbGVtZW50czogWydzdGFuZGFyZC1ob21lJywgJ3N1Ym1pdCcsICdyZXNldCddLFxuXHRcdFx0bmV4dEFjdGlvbjogZnVuY3Rpb24gKHNsaWRlKSB7XG5cdFx0XHRcdGNvbXBsZXRlU2xpZGUoKTtcblx0XHRcdFx0anVtcFRvSWQoJ21lbnUnKTtcblx0XHRcdH0sXG5cdFx0XHR0eXBlOiAncXVpeicsXG5cblx0XHRcdHF1aXo6IHtcblx0XHRcdFx0dXNlckF0dGVtcHRzOiAyLFxuXHRcdFx0XHRyYWRpbzogZmFsc2UsXG5cdFx0XHRcdGFuc3dlcnM6IHtcblx0XHRcdFx0XHQnaTItY29ycmVjdCc6IDEsXG5cdFx0XHRcdFx0J2kyLWNvcnJlY3QyJzogMVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0YXVkaW86IHtcblx0XHRcdFx0b25FbnRlcjogJ21lZGlhL2F1ZGlvL3ZvL2kyLm1wMycsXG5cdFx0XHRcdHBvc2l0aXZlOiAnbWVkaWEvYXVkaW8vdm8vaTJQLm1wMycsXG5cdFx0XHRcdG5lZ2F0aXZlOiAnbWVkaWEvYXVkaW8vdm8vaTJOLm1wMycsXG5cdFx0XHRcdG5lZ2F0aXZlRmluYWw6ICdtZWRpYS9hdWRpby92by9pMk5OLm1wMydcblx0XHRcdH0sXG5cdFx0XHRtb2RhbDoge1xuXHRcdFx0XHQvLyBub0ZlZWRiYWNrOiB0cnVlLCAvL2RlZmF1bHRzIHRvIGZhbHNlLCBzZXQgdG8gdHJ1ZSBpZiB5b3UgZG8gbm90IHdhbnQgZmVlZGJhY2tzXG5cdFx0XHRcdHBvc2l0aXZlOiAnaTItcG9zaXRpdmUnLFxuXHRcdFx0XHRuZWdhdGl2ZTogJ2kyLW5lZ2F0aXZlJyxcblx0XHRcdFx0bmVnYXRpdmVGaW5hbDogJ2kyLW5lZ2F0aXZlLWZpbmFsJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0djQ6IHtcblx0XHRcdGdyb3VwczogdmlkZW9TbGlkZSxcblx0XHRcdGJhY2tBY3Rpb246IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0anVtcFRvSWQoJ21lbnUnKTtcblx0XHRcdH0sXG5cdFx0XHRuYXZFbGVtZW50czogWychaG9tZSddIC8vZXhjbHVkZSBob21lIG9yIG1lbnUgYnV0dG9uIG9uIGludHJvIHZpZGVvcyB0aGF0IGNvbWUgYmVmb3JlIG1haW4gbWVudVxuXHRcdH0sXG5cdFx0aTM6IHtcblx0XHRcdG5hdkVsZW1lbnRzOiBbJ3N0YW5kYXJkLWhvbWUnXSxcblx0XHRcdG5leHRBY3Rpb246IGZ1bmN0aW9uIChzbGlkZSkge1xuXHRcdFx0XHRjb21wbGV0ZVNsaWRlKCk7XG5cdFx0XHRcdGp1bXBUb0lkKCdtZW51Jyk7XG5cdFx0XHR9LFxuXHRcdFx0dHlwZTogJ2RuZCcsXG5cdFx0XHRkbmQ6IHtcblx0XHRcdFx0dHlwZTogJ2RuZF8yJywgLy9vdGhlciBvcHRpb25zIGFyZSAnZG5kXzInIG9yICdsaW5lJ1xuXHRcdFx0XHR1c2VyQXR0ZW1wdHM6IDIsXG5cdFx0XHRcdGRyb3BwYWJsZURhdGE6IHtcblx0XHRcdFx0XHQnaTMtZHJvcDEnOiB7XG5cdFx0XHRcdFx0XHRkcm9wQ291bnRlcjogNSxcblx0XHRcdFx0XHRcdGFuc3dlcnM6IFsnJ11cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGRyb3BwYWJsZUdyb3Vwczoge1xuXHRcdFx0XHRcdCcjaTMtZHJvcDEnOiB7XG5cdFx0XHRcdFx0XHRldmVudHM6IHtcblx0XHRcdFx0XHRcdFx0ZHJvcDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xuXHRcdFx0XHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdFx0XHRcdGdsb2JhbFZhci5zbGlkZS5kYXRhLmRuZC5kcm9wcGFibGVEYXRhWydpMy1kcm9wMSddLmNvbnRhaW5lZERyYWdnYWJsZXMubGVuZ3RoID09IDRcblx0XHRcdFx0XHRcdFx0XHQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGhhbmRsZUFuc3dlcih0cnVlKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRhdWRpbzoge1xuXHRcdFx0XHRvbkVudGVyOiAnbWVkaWEvYXVkaW8vdm8vaTMubXAzJyxcblx0XHRcdFx0cG9zaXRpdmU6ICdtZWRpYS9hdWRpby92by9pM1AubXAzJ1xuXHRcdFx0fSxcblx0XHRcdG1vZGFsOiB7XG5cdFx0XHRcdC8vIG5vRmVlZGJhY2s6IHRydWUsIC8vZGVmYXVsdHMgdG8gZmFsc2UsIHNldCB0byB0cnVlIGlmIHlvdSBkbyBub3Qgd2FudCBmZWVkYmFja3Ncblx0XHRcdFx0cG9zaXRpdmU6ICdpMy1wb3NpdGl2ZSdcblx0XHRcdH1cblx0XHR9LFxuXHRcdGk0OiB7XG5cdFx0XHR0eXBlOiAnaG90c3BvdCcsXG5cdFx0XHRuYXZFbGVtZW50czogWydzdGFuZGFyZC1ob21lJ10sXG5cdFx0XHRuZXh0QWN0aW9uOiBmdW5jdGlvbiAoc2xpZGUpIHtcblx0XHRcdFx0Y29tcGxldGVTbGlkZSgpO1xuXHRcdFx0XHRuZXh0U2xpZGUoKTtcblx0XHRcdH0sXG5cdFx0XHRiYWNrQWN0aW9uOiBmdW5jdGlvbiAoc2xpZGUpIHtcblx0XHRcdFx0Y29tcGxldGVTbGlkZSgpO1xuXHRcdFx0XHRqdW1wVG9JZCgnbWVudScpO1xuXHRcdFx0fSxcblx0XHRcdG9uRW50ZXJBY3Rpb246IGZ1bmN0aW9uIChzbGlkZSkge1xuXHRcdFx0XHQkKCcudHh0JykuaGlkZSgpO1xuXHRcdFx0fSxcblx0XHRcdGhvdHNwb3Q6IHtcblx0XHRcdFx0dXNlTW9kYWxzOiBmYWxzZSxcblx0XHRcdFx0b25XaW46IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQkKCcjc2ktbmV4dCcpLmFkZENsYXNzKCdzaGFkb3ctcHVsc2UnKTtcblx0XHRcdFx0XHRuZXh0U2hvdygpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbkNsaWNrOiBmdW5jdGlvbiAoaG90c3BvdCwgbW9kYWwpIHtcblx0XHRcdFx0XHR2YXIgaWQgPSAkKGhvdHNwb3QpLmF0dHIoJ2lkJykuY2hhckF0KDEpO1xuXHRcdFx0XHRcdHZhciB0eHQgPSAndHh0JyArIGlkO1xuXHRcdFx0XHRcdCQoJy4nICsgdHh0KS5mYWRlSW4oKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGF1ZGlvOiB7XG5cdFx0XHRcdG9uRW50ZXI6ICdtZWRpYS9hdWRpby92by9pNC5tcDMnXG5cdFx0XHR9LFxuXHRcdFx0bW9kYWw6IHtcblx0XHRcdFx0Ly8gbm9GZWVkYmFjazogdHJ1ZSwgLy9kZWZhdWx0cyB0byBmYWxzZSwgc2V0IHRvIHRydWUgaWYgeW91IGRvIG5vdCB3YW50IGZlZWRiYWNrc1xuXHRcdFx0XHRwb3NpdGl2ZTogJ2kxLXBvc2l0aXZlJyxcblx0XHRcdFx0bmVnYXRpdmU6ICdpMS1uZWdhdGl2ZScsXG5cdFx0XHRcdG5lZ2F0aXZlRmluYWw6ICdpMS1uZWdhdGl2ZS1maW5hbCdcblx0XHRcdH1cblx0XHR9LFxuXHRcdGk0Yjoge1xuXHRcdFx0dHlwZTogJ2hvdHNwb3QnLFxuXHRcdFx0bmF2RWxlbWVudHM6IFsnc3RhbmRhcmQtaG9tZSddLFxuXHRcdFx0bmV4dEFjdGlvbjogZnVuY3Rpb24gKHNsaWRlKSB7XG5cdFx0XHRcdGNvbXBsZXRlU2xpZGUoKTtcblx0XHRcdFx0anVtcFRvSWQoJ21lbnUnKTtcblx0XHRcdH0sXG5cdFx0XHRvbkVudGVyQWN0aW9uOiBmdW5jdGlvbiAoc2xpZGUpIHtcblx0XHRcdFx0JCgnI2k0YiAudHh0JykuaGlkZSgpO1xuXHRcdFx0fSxcblx0XHRcdGhvdHNwb3Q6IHtcblx0XHRcdFx0dXNlTW9kYWxzOiBmYWxzZSxcblx0XHRcdFx0b25XaW46IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQkKCcjc2ktbmV4dCcpLmFkZENsYXNzKCdzaGFkb3ctcHVsc2UnKTtcblx0XHRcdFx0XHRuZXh0U2hvdygpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbkNsaWNrOiBmdW5jdGlvbiAoaG90c3BvdCwgbW9kYWwpIHtcblx0XHRcdFx0XHR2YXIgaWQgPSAkKGhvdHNwb3QpLmF0dHIoJ2lkJykuY2hhckF0KDEpO1xuXHRcdFx0XHRcdHZhciB0eHQgPSAndHh0JyArIGlkO1xuXHRcdFx0XHRcdCQoJy4nICsgdHh0KS5mYWRlSW4oKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGF1ZGlvOiB7XG5cdFx0XHRcdG9uRW50ZXI6ICdtZWRpYS9hdWRpby92by9ub3RoaW5nLm1wMycsXG5cdFx0XHRcdHBvc2l0aXZlOiAnbWVkaWEvYXVkaW8vdm8vbm90aGluZy5tcDMnLFxuXHRcdFx0XHRuZWdhdGl2ZTogJ21lZGlhL2F1ZGlvL3ZvL25vdGhpbmcubXAzJyxcblx0XHRcdFx0bmVnYXRpdmVGaW5hbDogJ21lZGlhL2F1ZGlvL3ZvL25vdGhpbmcubXAzJ1xuXHRcdFx0fSxcblx0XHRcdG1vZGFsOiB7XG5cdFx0XHRcdC8vIG5vRmVlZGJhY2s6IHRydWUsIC8vZGVmYXVsdHMgdG8gZmFsc2UsIHNldCB0byB0cnVlIGlmIHlvdSBkbyBub3Qgd2FudCBmZWVkYmFja3Ncblx0XHRcdFx0cG9zaXRpdmU6ICdpMS1wb3NpdGl2ZScsXG5cdFx0XHRcdG5lZ2F0aXZlOiAnaTEtbmVnYXRpdmUnLFxuXHRcdFx0XHRuZWdhdGl2ZUZpbmFsOiAnaTEtbmVnYXRpdmUtZmluYWwnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR2NToge1xuXHRcdFx0Z3JvdXBzOiB2aWRlb1NsaWRlLFxuXHRcdFx0YmFja0FjdGlvbjogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRqdW1wVG9JZCgnbWVudScpO1xuXHRcdFx0fSxcblx0XHRcdG5hdkVsZW1lbnRzOiBbJyFob21lJ10gLy9leGNsdWRlIGhvbWUgb3IgbWVudSBidXR0b24gb24gaW50cm8gdmlkZW9zIHRoYXQgY29tZSBiZWZvcmUgbWFpbiBtZW51XG5cdFx0fSxcblx0XHRpNToge1xuXHRcdFx0dHlwZTogJ2hvdHNwb3QnLFxuXHRcdFx0bmF2RWxlbWVudHM6IFsnc3RhbmRhcmQtaG9tZSddLFxuXHRcdFx0bmV4dEFjdGlvbjogZnVuY3Rpb24gKHNsaWRlKSB7XG5cdFx0XHRcdGNvbXBsZXRlU2xpZGUoKTtcblx0XHRcdFx0bmV4dFNsaWRlKCk7XG5cdFx0XHR9LFxuXHRcdFx0b25FbnRlckFjdGlvbjogZnVuY3Rpb24gKHNsaWRlKSB7XG5cdFx0XHRcdCQoJy5naXJsJykucmVtb3ZlQ2xhc3MoJ3AyIHAzIHA0Jyk7XG5cdFx0XHRcdCQoJy5ob3RzcG90LWJ1dHRvbicpLnNob3coKTtcblx0XHRcdH0sXG5cdFx0XHRob3RzcG90OiB7XG5cdFx0XHRcdGxpbmVhcjogdHJ1ZSxcblx0XHRcdFx0b25XaW46IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRoYW5kbGVBbnN3ZXIodHJ1ZSk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGl0ZW1zOiB7XG5cdFx0XHRcdFx0MToge1xuXHRcdFx0XHRcdFx0b25Nb2RhbENsb3NlOiBmdW5jdGlvbiAoaG90c3BvdCwgbW9kYWwpIHtcblx0XHRcdFx0XHRcdFx0JChob3RzcG90KS5oaWRlKCk7XG5cdFx0XHRcdFx0XHRcdCQoJy5naXJsJykuYWRkQ2xhc3MoJ3AyJyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQyOiB7XG5cdFx0XHRcdFx0XHRvbk1vZGFsQ2xvc2U6IGZ1bmN0aW9uIChob3RzcG90LCBtb2RhbCkge1xuXHRcdFx0XHRcdFx0XHQkKGhvdHNwb3QpLmhpZGUoKTtcblx0XHRcdFx0XHRcdFx0JCgnLmdpcmwnKS5hZGRDbGFzcygncDMnKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdDM6IHtcblx0XHRcdFx0XHRcdG9uTW9kYWxDbG9zZTogZnVuY3Rpb24gKGhvdHNwb3QsIG1vZGFsKSB7XG5cdFx0XHRcdFx0XHRcdCQoaG90c3BvdCkuaGlkZSgpO1xuXHRcdFx0XHRcdFx0XHQkKCcuZ2lybCcpLmFkZENsYXNzKCdwNCcpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGF1ZGlvOiB7XG5cdFx0XHRcdG9uRW50ZXI6ICdtZWRpYS9hdWRpby92by9pNS5tcDMnLFxuXHRcdFx0XHRwb3NpdGl2ZTogJ21lZGlhL2F1ZGlvL3ZvL2k1UC5tcDMnXG5cdFx0XHR9LFxuXHRcdFx0bW9kYWw6IHtcblx0XHRcdFx0Ly8gbm9GZWVkYmFjazogdHJ1ZSwgLy9kZWZhdWx0cyB0byBmYWxzZSwgc2V0IHRvIHRydWUgaWYgeW91IGRvIG5vdCB3YW50IGZlZWRiYWNrc1xuXHRcdFx0XHRwb3NpdGl2ZTogJ2k1LXBvc2l0aXZlJyxcblx0XHRcdFx0aHMxOiAnaTUtaHMxJyxcblx0XHRcdFx0aHMyOiAnaTUtaHMyJyxcblx0XHRcdFx0aHMzOiAnaTUtaHMzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0djY6IHtcblx0XHRcdHR5cGU6ICd2aWRlbycsXG5cdFx0XHRuYXZFbGVtZW50czogWyd2aWRlby1ob21lJ10sXG5cdFx0XHRuZXh0QWN0aW9uOiBmdW5jdGlvbiAoc2xpZGUpIHtcblx0XHRcdFx0Y29tcGxldGVTbGlkZSgpO1xuXHRcdFx0XHRqdW1wVG9JZCgnbWVudScpO1xuXHRcdFx0fSxcblx0XHRcdHZpZGVvTG9hZGVkOiBmYWxzZSAvL2Rvbid0IGVkaXQgLy9leGNsdWRlIGhvbWUgb3IgbWVudSBidXR0b24gb24gaW50cm8gdmlkZW9zIHRoYXQgY29tZSBiZWZvcmUgbWFpbiBtZW51XG5cdFx0fSxcblx0XHRpNjoge1xuXHRcdFx0bmF2RWxlbWVudHM6IFsnc3RhbmRhcmQtaG9tZScsICdzdWJtaXQnLCAncmVzZXQnXSxcblx0XHRcdGJhY2tBY3Rpb246IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0anVtcFRvSWQoJ21lbnUnKTtcblx0XHRcdH0sXG5cdFx0XHRuZXh0QWN0aW9uOiBmdW5jdGlvbiAoc2xpZGUpIHtcblx0XHRcdFx0Y29tcGxldGVTbGlkZSgpO1xuXHRcdFx0XHRuZXh0U2xpZGUoKTtcblx0XHRcdH0sXG5cblx0XHRcdHR5cGU6ICdkbmQnLFxuXHRcdFx0ZG5kOiB7XG5cdFx0XHRcdHR5cGU6ICdkbmRfMScsIC8vb3RoZXIgb3B0aW9ucyBhcmUgJ2RuZF8yJyBvciAnbGluZSdcblx0XHRcdFx0dXNlckF0dGVtcHRzOiAyLFxuXHRcdFx0XHRkcm9wcGFibGVEYXRhOiB7XG5cdFx0XHRcdFx0J2k2LWRyb3AxJzoge1xuXHRcdFx0XHRcdFx0ZHJvcENvdW50ZXI6IDEsXG5cdFx0XHRcdFx0XHRhbnN3ZXJzOiB7XG5cdFx0XHRcdFx0XHRcdDA6IFsnaTYtZHJhZzInXSxcblx0XHRcdFx0XHRcdFx0MTogWydpNi1kcmFnMyddXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQnaTYtZHJvcDInOiB7XG5cdFx0XHRcdFx0XHRkcm9wQ291bnRlcjogMSxcblx0XHRcdFx0XHRcdGFuc3dlcnM6IHtcblx0XHRcdFx0XHRcdFx0MDogWydpNi1kcmFnMiddLFxuXHRcdFx0XHRcdFx0XHQxOiBbJ2k2LWRyYWczJ11cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdCdpNi1kcm9wMyc6IHtcblx0XHRcdFx0XHRcdGRyb3BDb3VudGVyOiAxLFxuXHRcdFx0XHRcdFx0YW5zd2Vyczoge1xuXHRcdFx0XHRcdFx0XHQwOiBbJ2k2LWRyYWcxJ10sXG5cdFx0XHRcdFx0XHRcdDE6IFsnaTYtZHJhZzQnXVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0J2k2LWRyb3A0Jzoge1xuXHRcdFx0XHRcdFx0ZHJvcENvdW50ZXI6IDEsXG5cdFx0XHRcdFx0XHRhbnN3ZXJzOiB7XG5cdFx0XHRcdFx0XHRcdDA6IFsnaTYtZHJhZzEnXSxcblx0XHRcdFx0XHRcdFx0MTogWydpNi1kcmFnNCddXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0YXVkaW86IHtcblx0XHRcdFx0b25FbnRlcjogJ21lZGlhL2F1ZGlvL3ZvL2k2Lm1wMycsXG5cdFx0XHRcdHBvc2l0aXZlOiAnbWVkaWEvYXVkaW8vdm8vaTZQLm1wMycsXG5cdFx0XHRcdG5lZ2F0aXZlOiAnbWVkaWEvYXVkaW8vdm8vaTZOLm1wMycsXG5cdFx0XHRcdG5lZ2F0aXZlRmluYWw6ICdtZWRpYS9hdWRpby92by9pNk5OLm1wMycsXG5cdFx0XHRcdGVuZDogJ21lZGlhL2F1ZGlvL3ZvL2k2LjEubXAzJ1xuXHRcdFx0fSxcblx0XHRcdG1vZGFsOiB7XG5cdFx0XHRcdC8vIG5vRmVlZGJhY2s6IHRydWUsIC8vZGVmYXVsdHMgdG8gZmFsc2UsIHNldCB0byB0cnVlIGlmIHlvdSBkbyBub3Qgd2FudCBmZWVkYmFja3Ncblx0XHRcdFx0cG9zaXRpdmU6ICdpNi1wb3NpdGl2ZScsXG5cdFx0XHRcdG5lZ2F0aXZlOiAnaTYtbmVnYXRpdmUnLFxuXHRcdFx0XHRuZWdhdGl2ZUZpbmFsOiAnaTYtbmVnYXRpdmUtZmluYWwnLFxuXHRcdFx0XHRlbmQ6ICdpNi1lbmQnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRxMToge1xuXHRcdFx0bmF2RWxlbWVudHM6IFsnc3RhbmRhcmQtaG9tZScsICdzdWJtaXQnXSxcblx0XHRcdG5leHRBY3Rpb246IGZ1bmN0aW9uIChzbGlkZSkge1xuXHRcdFx0XHRjb21wbGV0ZVNsaWRlKCk7XG5cdFx0XHRcdG5leHRTbGlkZSgpO1xuXHRcdFx0fSxcblx0XHRcdHR5cGU6ICdxdWl6Jyxcblx0XHRcdHF1aXo6IHtcblx0XHRcdFx0dXNlckF0dGVtcHRzOiAyLFxuXHRcdFx0XHRyYWRpbzogdHJ1ZSxcblx0XHRcdFx0YW5zd2Vyczoge1xuXHRcdFx0XHRcdCdxMS1jb3JyZWN0JzogMVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0YXVkaW86IHtcblx0XHRcdFx0b25FbnRlcjogJ21lZGlhL2F1ZGlvL3ZvL1ExLm1wMycsXG5cdFx0XHRcdHBvc2l0aXZlOiAnbWVkaWEvYXVkaW8vdm8vUTFQLm1wMycsXG5cdFx0XHRcdG5lZ2F0aXZlOiAnbWVkaWEvYXVkaW8vdm8vUTFOLm1wMycsXG5cdFx0XHRcdG5lZ2F0aXZlRmluYWw6ICdtZWRpYS9hdWRpby92by9RMU5OLm1wMydcblx0XHRcdH0sXG5cdFx0XHRtb2RhbDoge1xuXHRcdFx0XHQvLyBub0ZlZWRiYWNrOiB0cnVlLCAvL2RlZmF1bHRzIHRvIGZhbHNlLCBzZXQgdG8gdHJ1ZSBpZiB5b3UgZG8gbm90IHdhbnQgZmVlZGJhY2tzXG5cdFx0XHRcdHBvc2l0aXZlOiAncTEtcG9zaXRpdmUnLFxuXHRcdFx0XHRuZWdhdGl2ZTogJ3ExLW5lZ2F0aXZlJyxcblx0XHRcdFx0bmVnYXRpdmVGaW5hbDogJ3ExLW5lZ2F0aXZlLWZpbmFsJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cTI6IHtcblx0XHRcdG5hdkVsZW1lbnRzOiBbJ3N0YW5kYXJkLWhvbWUnLCAnc3VibWl0JywgJ3Jlc2V0J10sXG5cdFx0XHRuZXh0QWN0aW9uOiBmdW5jdGlvbiAoc2xpZGUpIHtcblx0XHRcdFx0Y29tcGxldGVTbGlkZSgpO1xuXHRcdFx0XHRuZXh0U2xpZGUoKTtcblx0XHRcdH0sXG5cdFx0XHR0eXBlOiAncXVpeicsXG5cdFx0XHRxdWl6OiB7XG5cdFx0XHRcdHVzZXJBdHRlbXB0czogMixcblx0XHRcdFx0cmFkaW86IGZhbHNlLFxuXHRcdFx0XHRhbnN3ZXJzOiB7XG5cdFx0XHRcdFx0J3EyLWNvcnJlY3QnOiAxLFxuXHRcdFx0XHRcdCdxMi1jb3JyZWN0Mic6IDEsXG5cdFx0XHRcdFx0J3EyLWNvcnJlY3QzJzogMVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0YXVkaW86IHtcblx0XHRcdFx0b25FbnRlcjogJ21lZGlhL2F1ZGlvL3ZvL1EyLm1wMycsXG5cdFx0XHRcdHBvc2l0aXZlOiAnbWVkaWEvYXVkaW8vdm8vUTJQLm1wMycsXG5cdFx0XHRcdG5lZ2F0aXZlOiAnbWVkaWEvYXVkaW8vdm8vUTJOLm1wMycsXG5cdFx0XHRcdG5lZ2F0aXZlRmluYWw6ICdtZWRpYS9hdWRpby92by9RMk5OLm1wMydcblx0XHRcdH0sXG5cdFx0XHRtb2RhbDoge1xuXHRcdFx0XHQvLyBub0ZlZWRiYWNrOiB0cnVlLCAvL2RlZmF1bHRzIHRvIGZhbHNlLCBzZXQgdG8gdHJ1ZSBpZiB5b3UgZG8gbm90IHdhbnQgZmVlZGJhY2tzXG5cdFx0XHRcdHBvc2l0aXZlOiAncTItcG9zaXRpdmUnLFxuXHRcdFx0XHRuZWdhdGl2ZTogJ3EyLW5lZ2F0aXZlJyxcblx0XHRcdFx0bmVnYXRpdmVGaW5hbDogJ3EyLW5lZ2F0aXZlLWZpbmFsJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cTM6IHtcblx0XHRcdG5hdkVsZW1lbnRzOiBbJ3N0YW5kYXJkLWhvbWUnLCAnc3VibWl0J10sXG5cdFx0XHRuZXh0QWN0aW9uOiBmdW5jdGlvbiAoc2xpZGUpIHtcblx0XHRcdFx0Y29tcGxldGVTbGlkZSgpO1xuXHRcdFx0XHRqdW1wVG9JZCgnZW5kJyk7XG5cdFx0XHR9LFxuXHRcdFx0dHlwZTogJ3F1aXonLFxuXHRcdFx0cXVpejoge1xuXHRcdFx0XHR1c2VyQXR0ZW1wdHM6IDIsXG5cdFx0XHRcdHJhZGlvOiB0cnVlLFxuXHRcdFx0XHRhbnN3ZXJzOiB7XG5cdFx0XHRcdFx0J3EzLWNvcnJlY3QnOiAxXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRhdWRpbzoge1xuXHRcdFx0XHRvbkVudGVyOiAnbWVkaWEvYXVkaW8vdm8vUTMubXAzJyxcblx0XHRcdFx0cG9zaXRpdmU6ICdtZWRpYS9hdWRpby92by9RM1AubXAzJyxcblx0XHRcdFx0bmVnYXRpdmU6ICdtZWRpYS9hdWRpby92by9RM04ubXAzJyxcblx0XHRcdFx0bmVnYXRpdmVGaW5hbDogJ21lZGlhL2F1ZGlvL3ZvL1EzTk4ubXAzJ1xuXHRcdFx0fSxcblx0XHRcdG1vZGFsOiB7XG5cdFx0XHRcdC8vIG5vRmVlZGJhY2s6IHRydWUsIC8vZGVmYXVsdHMgdG8gZmFsc2UsIHNldCB0byB0cnVlIGlmIHlvdSBkbyBub3Qgd2FudCBmZWVkYmFja3Ncblx0XHRcdFx0cG9zaXRpdmU6ICdxMy1wb3NpdGl2ZScsXG5cdFx0XHRcdG5lZ2F0aXZlOiAncTMtbmVnYXRpdmUnLFxuXHRcdFx0XHRuZWdhdGl2ZUZpbmFsOiAncTMtbmVnYXRpdmUtZmluYWwnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRlbmQ6IHtcblx0XHRcdHR5cGU6ICd0ZXh0Jyxcblx0XHRcdG5hdkVsZW1lbnRzOiBbJ2V4aXQtc2xpZGUnLCAnaG9tZScsICdsb2dvJ10sXG5cdFx0XHRiYWNrQWN0aW9uOiBwcmV2U2xpZGUsXG5cdFx0XHRuZXh0QWN0aW9uOiBmdW5jdGlvbiAoc2xpZGUpIHt9LFxuXHRcdFx0b25FbnRlckFjdGlvbjogZnVuY3Rpb24gKHNsaWRlKSB7XG5cdFx0XHRcdC8vIERvIG5vdCBjaGVjayBmb3IgXCJsbXNDb25uZWN0ZWRcIiwgYmVjYXVzZSB0aGF0J3MgZG9uZSBpbiBzZXRTY29ybUNvbXBsZXRpb24oKSBhbnl3YXlzIGFuZCBBSUNDIHdvdWxkbid0IHdvcmsgYW55bW9yZS5cblx0XHRcdFx0c2V0U2Nvcm1Db21wbGV0aW9uKCk7XG5cdFx0XHR9LFxuXHRcdFx0YXVkaW86IHtcblx0XHRcdFx0b25FbnRlcjogJ21lZGlhL2F1ZGlvL3ZvL2VuZC5tcDMnXG5cdFx0XHR9LFxuXHRcdFx0aW5jbHVkZTogZmFsc2Vcblx0XHR9XG5cdH07XG59KTtcblxuLy8gIHNsaWRlSUQ6e1xuLy8gXHR0eXBlOiAndGV4dCcsIC8vIHR5cGVzIGluY2x1ZGUgdGV4dCx2aWRlbyxxdWl6LGRuZCxzb3J0LGhvdHNwb3Rcbi8vIFx0bmF2RWxlbWVudHM6WydzdGFuZGFyZC1ob21lJ10sIC8vYW55IGlkIGZyb20gbmF2LWNvbnRhaW5lciBtaW51cyBcInNpLVwiLCdkcmFnLXJpZ2h0LWljb24nLCdkcmFnLWxlZnQtaWNvbicsJ2RyYWctdXAtaWNvbicsJ2RyYWctZG93bi1pY29uJywnY2xpY2staWNvbicsIHB1dCBhICchJyBiZWZvcmUgYW55IGlkIHRvIGV4Y2x1ZGUgZS5nLiAnIWhvbWUnIHdpbGwgZXhjbHVkZSBob21lIGJ1dHRvbiBmcm9tIHN0YW5kYXJkLWhvbWUgZ3JvdXBcbi8vIH1cbiIsImZ1bmN0aW9uIGNhcm91c2VsSW5pdChcblx0eyBpZCwgZGF0YSwgJGRvbSB9ID0gZ2xvYmFsVmFyLnNsaWRlLFxuXHRzdGF0ZSA9IChkYXRhLmNhcm91c2VsID0gZGF0YS5jYXJvdXNlbCB8fCB7fSksXG5cdCRjYXJvdXNlbEl0ZW1zID0gJGRvbS5maW5kKCcuY2Fyb3VzZWwtaXRlbV9fanMnKSxcblx0JGxlZnRBcnJvdyA9ICRkb20uZmluZCgnLmNhcm91c2VsLWFycm93LWxlZnRfX2pzJyksXG5cdCRyaWdodEFycm93ID0gJGRvbS5maW5kKCcuY2Fyb3VzZWwtYXJyb3ctcmlnaHRfX2pzJyksXG5cdCRzaG9ydGN1dHMgPSAkZG9tLmZpbmQoJy5jYXJvdXNlbC1zaG9ydGN1dF9fanMnKVxuKSB7XG5cdHZhciB2YWxpZFNob3J0Y3V0cyA9ICRzaG9ydGN1dHMgJiYgJHNob3J0Y3V0cy5sZW5ndGggPiAwO1xuXG5cdHN0YXRlLmFjdGl2ZVBvcyA9IHN0YXRlLmFjdGl2ZVBvcyB8fCAwO1xuXG5cdCRsZWZ0QXJyb3cub24oJ2NsaWNrLmNhcm91c2VsLWFycm93LWxlZnQnLCAoKSA9PiB7XG5cdFx0Y2Fyb3VzZWxNb3ZlKCdsZWZ0JywgeyBpZCwgZGF0YSwgJGRvbSB9LCBzdGF0ZSwgJGNhcm91c2VsSXRlbXMsICRzaG9ydGN1dHMpO1xuXHR9KTtcblx0JHJpZ2h0QXJyb3cub24oJ2NsaWNrLmNhcm91c2VsLWFycm93LXJpZ2h0JywgKCkgPT4ge1xuXHRcdGNhcm91c2VsTW92ZSgncmlnaHQnLCB7IGlkLCBkYXRhLCAkZG9tIH0sIHN0YXRlLCAkY2Fyb3VzZWxJdGVtcywgJHNob3J0Y3V0cyk7XG5cdH0pO1xuXG5cdGlmICghdmFsaWRTaG9ydGN1dHMpIHJldHVybjtcblxuXHQkKCRzaG9ydGN1dHNbMF0pLmFkZENsYXNzKCdhY3RpdmUnKTtcblxuXHQkc2hvcnRjdXRzLmVhY2goZnVuY3Rpb24gKGlkeCwgc2hvcnRjdXQpIHtcblx0XHRzaG9ydGN1dC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdGNhcm91c2VsTW92ZShpZHgsIHsgaWQsIGRhdGEsICRkb20gfSwgc3RhdGUsICRjYXJvdXNlbEl0ZW1zLCAkc2hvcnRjdXRzKTtcblx0XHR9KTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGNhcm91c2VsTW92ZShcblx0ZGlyZWN0aW9uLFxuXHR7IGRhdGEsICRkb20gfSA9IGdsb2JhbFZhci5zbGlkZSxcblx0c3RhdGUgPSBkYXRhLmNhcm91c2VsLFxuXHQkY2Fyb3VzZWxJdGVtcyA9ICRkb20uZmluZCgnLmNhcm91c2VsLWl0ZW1fX2pzJyksXG5cdCRzaG9ydGN1dHMgPSAkZG9tLmZpbmQoJy5jYXJvdXNlbC1zaG9ydGN1dF9fanMnKVxuKSB7XG5cdHZhciB2YWxpZFNob3J0Y3V0cyA9ICRzaG9ydGN1dHMgJiYgJHNob3J0Y3V0cy5sZW5ndGggPiAwO1xuXG5cdGlmICh2YWxpZFNob3J0Y3V0cykgJCgkc2hvcnRjdXRzW3N0YXRlLmFjdGl2ZVBvc10pLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcblxuXHRzdGF0ZS5hY3RpdmVQb3MgPSBjYXJvdXNlbFBhcnNlRGlyZWN0aW9uKGRpcmVjdGlvbiwgJGNhcm91c2VsSXRlbXMubGVuZ3RoLCBzdGF0ZS5hY3RpdmVQb3MpO1xuXG5cdGlmICh2YWxpZFNob3J0Y3V0cykgJCgkc2hvcnRjdXRzW3N0YXRlLmFjdGl2ZVBvc10pLmFkZENsYXNzKCdhY3RpdmUnKTtcblxuXHRjYXJvdXNlbFJlbmRlck1vdmUoJGNhcm91c2VsSXRlbXMsIHN0YXRlLmFjdGl2ZVBvcyk7XG59XG5cbmZ1bmN0aW9uIGNhcm91c2VsUGFyc2VEaXJlY3Rpb24oZGlyZWN0aW9uLCBjYXJvdXNlbExlbmd0aCwgYWN0aXZlUG9zKSB7XG5cdHZhciBzdHJpbmdJbnB1dCA9IHR5cGVvZiBkaXJlY3Rpb24gPT09ICdzdHJpbmcnO1xuXHR2YXIgbmV3UG9zO1xuXHR2YXIgYmVnaW5uaW5nT2ZMaXN0ID0gYWN0aXZlUG9zID09PSAwO1xuXHR2YXIgZW5kT2ZMaXN0ID0gYWN0aXZlUG9zID09PSBjYXJvdXNlbExlbmd0aCAtIDE7XG5cblx0aWYgKCFzdHJpbmdJbnB1dCkgcmV0dXJuIGRpcmVjdGlvbjtcblx0ZWxzZSBpZiAoZGlyZWN0aW9uID09PSAnbGVmdCcgJiYgIWJlZ2lubmluZ09mTGlzdCkgbmV3UG9zID0gYWN0aXZlUG9zIC0gMTtcblx0ZWxzZSBpZiAoZGlyZWN0aW9uID09PSAnbGVmdCcpIG5ld1BvcyA9IGNhcm91c2VsTGVuZ3RoIC0gMTtcblx0ZWxzZSBpZiAoIWVuZE9mTGlzdCkgbmV3UG9zID0gYWN0aXZlUG9zICsgMTtcblx0ZWxzZSBuZXdQb3MgPSAwO1xuXG5cdHJldHVybiBuZXdQb3M7XG59XG5cbmZ1bmN0aW9uIGNhcm91c2VsUmVuZGVyTW92ZSgkY2Fyb3VzZWxJdGVtcywgcG9zKSB7XG5cdCRjYXJvdXNlbEl0ZW1zW3Bvc10uc3R5bGUubGVmdCA9ICcwJSc7XG5cdCRjYXJvdXNlbEl0ZW1zLmVhY2goKGlkeCwgaXRlbSkgPT4ge1xuXHRcdHZhciBwb3NEaWYgPSBpZHggLSBwb3M7XG5cdFx0dmFyIG5ld1BlcmNlbnRhZ2UgPSAnJyArIHBvc0RpZiArICcwMCcgKyAnJSc7XG5cdFx0aXRlbS5zdHlsZS5sZWZ0ID0gbmV3UGVyY2VudGFnZTtcblx0fSk7XG59XG4iLCJmdW5jdGlvbiBjYXJvdXNlbDNESW5pdChcblx0eyBpZCwgZGF0YSwgJGRvbSB9ID0gZ2xvYmFsVmFyLnNsaWRlLFxuXHRzdGF0ZSA9IChkYXRhLmNhcm91c2VsM0QgPSBkYXRhLmNhcm91c2VsM0QgfHwge30pLFxuXHQkY2Fyb3VzZWxJdGVtcyA9ICRkb20uZmluZCgnLmNhcm91c2VsLTNkLWl0ZW1fX2pzJyksXG5cdCRsZWZ0QXJyb3cgPSAkZG9tLmZpbmQoJy5jYXJvdXNlbC0zZC1sZWZ0X19qcycpLFxuXHQkcmlnaHRBcnJvdyA9ICRkb20uZmluZCgnLmNhcm91c2VsLTNkLXJpZ2h0X19qcycpXG4pIHtcblx0c3RhdGUuYWN0aXZlUG9zID0gMDtcblxuXHRjc3NTZXR1cCgkY2Fyb3VzZWxJdGVtcyk7XG5cblx0Ly9NYWtlcyBvbmx5IHRoZSBmcm9udCBidXR0b24gY2xpY2thYmxlXG5cdGxvY2soJGNhcm91c2VsSXRlbXMpO1xuXHR1bmxvY2soJCgkY2Fyb3VzZWxJdGVtc1swXSkpO1xuXG5cdCRsZWZ0QXJyb3cub24oJ2NsaWNrLnRocmVlZGNhcm91c2VsJywgZnVuY3Rpb24gKCkge1xuXHRcdGNhcm91c2VsM0RNb3ZlKCdsZWZ0JywgeyBpZCwgZGF0YSwgJGRvbSB9LCBzdGF0ZSwgJGNhcm91c2VsSXRlbXMpO1xuXHR9KTtcblx0JHJpZ2h0QXJyb3cub24oJ2NsaWNrLnRocmVlZGNhcm91c2VsJywgZnVuY3Rpb24gKCkge1xuXHRcdGNhcm91c2VsM0RNb3ZlKCdyaWdodCcsIHsgaWQsIGRhdGEsICRkb20gfSwgc3RhdGUsICRjYXJvdXNlbEl0ZW1zKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGNzc1NldHVwKCRjYXJvdXNlbEl0ZW1zKSB7XG5cdHZhciBudW1iZXJPZkl0ZW1zID0gJGNhcm91c2VsSXRlbXMubGVuZ3RoO1xuXG5cdC8vYXNzaWduIGZpcnN0IHBvc2l0aW9uc1xuXHQkY2Fyb3VzZWxJdGVtcy5lYWNoKGZ1bmN0aW9uIChpZHgsIGl0ZW0pIHtcblx0XHR2YXIgaXRlbU51bSA9IGlkeCArIDE7XG5cblx0XHRpdGVtLmRhdGFzZXQucG9zID0gaWR4O1xuXG5cdFx0JChpdGVtKS5hZGRDbGFzcygnY2Fyb3VzZWwtM2QtaXRlbScpO1xuXHRcdCQoaXRlbSkuYWRkQ2xhc3MoJ2Nhcm91c2VsLTNkLWl0ZW0tJyArIGl0ZW1OdW0pO1xuXHRcdCQoaXRlbSkuYWRkQ2xhc3MoYGl0ZW0ke2l0ZW1OdW19b2Yke251bWJlck9mSXRlbXN9YCk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBjYXJvdXNlbDNETW92ZShcblx0ZGlyZWN0aW9uLFxuXHR7IGRhdGEsICRkb20gfSA9IGdsb2JhbFZhci5zbGlkZSxcblx0c3RhdGUgPSBkYXRhLmNhcm91c2VsM0QsXG5cdCRjYXJvdXNlbEl0ZW1zID0gJGRvbS5maW5kKCcuY2Fyb3VzZWwtM2QtaXRlbV9fanMnKVxuKSB7XG5cdHZhciBudW1iZXJPZkl0ZW1zID0gJGNhcm91c2VsSXRlbXMubGVuZ3RoO1xuXHR2YXIgdHVybiA9IGNhcm91c2VsM0RQYXJzZURpcmVjdGlvbihkaXJlY3Rpb24sIG51bWJlck9mSXRlbXMsICRjYXJvdXNlbEl0ZW1zKTtcblxuXHRpZiAoIXR1cm4pIHJldHVybjtcblx0ZWxzZSBpZiAodHVybiA9PT0gMSB8fCB0dXJuID09PSBudW1iZXJPZkl0ZW1zIC0gMSlcblx0XHRjYXJvdXNlbDNEUmVuZGVyTW92ZSh0dXJuLCAkY2Fyb3VzZWxJdGVtcywgc3RhdGUsIG51bWJlck9mSXRlbXMsIGRhdGEpO1xuXHRlbHNlIHtcblx0XHR2YXIgZGlyZWN0aW9uID0gdHVybiA8IG51bWJlck9mSXRlbXMgLyAyID8gJ2xlZnQnIDogJ3JpZ2h0Jztcblx0XHR2YXIgdHVybnMgPSBkaXJlY3Rpb24gPT09ICdyaWdodCcgPyBudW1iZXJPZkl0ZW1zIC0gdHVybiA6IHR1cm47XG5cblx0XHRjYXJvdXNlbDNEU2Nyb2xsKHR1cm5zLCAkY2Fyb3VzZWxJdGVtcywgc3RhdGUsIG51bWJlck9mSXRlbXMsIGRpcmVjdGlvbiwgZGF0YSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gY2Fyb3VzZWwzRFBhcnNlRGlyZWN0aW9uKGRpcmVjdGlvbiwgbnVtYmVyT2ZJdGVtcywgJGNhcm91c2VsSXRlbXMpIHtcblx0aWYgKHR5cGVvZiBkaXJlY3Rpb24gPT09ICdzdHJpbmcnKVxuXHRcdHN3aXRjaCAoZGlyZWN0aW9uKSB7XG5cdFx0XHRjYXNlICdyaWdodCc6XG5cdFx0XHRcdHJldHVybiBudW1iZXJPZkl0ZW1zIC0gMTtcblx0XHRcdGNhc2UgJ2xlZnQnOlxuXHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHZhciBpdGVtID0gJChgIyR7ZGlyZWN0aW9ufWApWzBdO1xuXHRcdFx0XHRpZiAoaXRlbSkgcmV0dXJuIChudW1iZXJPZkl0ZW1zIC0gaXRlbS5kYXRhc2V0LnBvcykgJSBudW1iZXJPZkl0ZW1zO1xuXHRcdH1cblx0ZWxzZSBpZiAoIWlzTmFOKGRpcmVjdGlvbikpIHJldHVybiAobnVtYmVyT2ZJdGVtcyAtICRjYXJvdXNlbEl0ZW1zW2RpcmVjdGlvbl0uZGF0YXNldC5wb3MpICUgbnVtYmVyT2ZJdGVtcztcbn1cblxuZnVuY3Rpb24gY2Fyb3VzZWwzRFJlbmRlck1vdmUodHVybnMsICRjYXJvdXNlbEl0ZW1zLCBzdGF0ZSwgbnVtYmVyT2ZJdGVtcywgZGF0YSkge1xuXHRjb25zdCBwb3MgPSBzdGF0ZS5hY3RpdmVQb3M7XG5cdGNvbnN0IGlzTGluZWFyTWVudSA9IGRhdGEudHlwZSA9PT0gJ21lbnUnICYmIGRhdGEubWVudS5saW5lYXI7XG5cblx0JGNhcm91c2VsSXRlbXMuZWFjaCgoaWR4LCBpdGVtKSA9PiB7XG5cdFx0dmFyIGN1cnJlbnRJdGVtTnVtID0gKChpZHggKyBwb3MpICUgbnVtYmVyT2ZJdGVtcykgKyAxO1xuXHRcdHZhciBuZXh0SXRlbU51bSA9ICgoaWR4ICsgdHVybnMgKyBwb3MpICUgbnVtYmVyT2ZJdGVtcykgKyAxO1xuXG5cdFx0aXRlbS5kYXRhc2V0LnBvcyA9IG5leHRJdGVtTnVtIC0gMTsgLy8gLTEgZm9yIDAgaW5kZXhcblxuXHRcdCQoaXRlbSkucmVtb3ZlQ2xhc3MoYGl0ZW0ke2N1cnJlbnRJdGVtTnVtfW9mJHtudW1iZXJPZkl0ZW1zfWApO1xuXHRcdCQoaXRlbSkuYWRkQ2xhc3MoYGl0ZW0ke25leHRJdGVtTnVtfW9mJHtudW1iZXJPZkl0ZW1zfWApO1xuXG5cdFx0Ly9NYWtlcyBvbmx5IHRoZSBuZXcgZnJvbnQgYnV0dG9uIGNsaWNrYWJsZVxuXHRcdGlmIChuZXh0SXRlbU51bSAhPT0gMSkgcmV0dXJuO1xuXG5cdFx0bG9jaygkY2Fyb3VzZWxJdGVtcyk7XG5cdFx0bG9jaygkKHRoaXMpKTtcblxuXHRcdGlmICghaXNMaW5lYXJNZW51IHx8ICQoaXRlbSkuaGFzQ2xhc3MoJ3VubG9ja2VkJykpIHVubG9jaygkKGl0ZW0pKTtcblx0fSk7XG5cblx0c3RhdGUuYWN0aXZlUG9zID0gKHBvcyArIHR1cm5zKSAlIG51bWJlck9mSXRlbXM7XG59XG5cbmZ1bmN0aW9uIGNhcm91c2VsM0RTY3JvbGwodHVybiwgJGNhcm91c2VsSXRlbXMsIHN0YXRlLCBudW1iZXJPZkl0ZW1zLCBkaXJlY3Rpb24sIGRhdGEpIHtcblx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0Y2Fyb3VzZWwzRFJlbmRlck1vdmUoZGlyZWN0aW9uID09PSAncmlnaHQnID8gbnVtYmVyT2ZJdGVtcyAtIDEgOiAxLCAkY2Fyb3VzZWxJdGVtcywgc3RhdGUsIG51bWJlck9mSXRlbXMsIGRhdGEpO1xuXG5cdFx0aWYgKHR1cm4gLSAxKSBjYXJvdXNlbDNEU2Nyb2xsKHR1cm4gLSAxLCAkY2Fyb3VzZWxJdGVtcywgc3RhdGUsIG51bWJlck9mSXRlbXMsIGRpcmVjdGlvbik7XG5cdH0sIDEwMCk7XG59XG5cbmZ1bmN0aW9uIGNhcm91c2VsM0RBdXRvRm9jdXMoXG5cdHsgZGF0YSwgJGRvbSB9ID0gZ2xvYmFsVmFyLnNsaWRlLFxuXHRzdGF0ZSA9IGRhdGEuY2Fyb3VzZWwzRCxcblx0JGNhcm91c2VsSXRlbXMgPSAkZG9tLmZpbmQoJy5jYXJvdXNlbC0zZC1pdGVtX19qcycpLFxuXHRjb21wbGV0aW9uSURzID0gZGF0YS5tZW51LmNvbXBsZXRpb25JRHNcbikge1xuXHR2YXIgbmV4dEluY29tcGxldGVJZHggPSBjb21wbGV0aW9uSURzLnJlZHVjZShcblx0XHQocmVzdWx0LCBzbGlkZUlELCBpZHgpID0+IChyZXN1bHQgPT09IHVuZGVmaW5lZCAmJiAhZ2V0Q29tcGxldGlvblN0YXR1cyhzbGlkZUlEKSA/IGlkeCA6IHJlc3VsdCksXG5cdFx0dW5kZWZpbmVkXG5cdCk7XG5cblx0Y2Fyb3VzZWwzRE1vdmUobmV4dEluY29tcGxldGVJZHgsIHsgZGF0YSwgJGRvbSB9LCBzdGF0ZSwgJGNhcm91c2VsSXRlbXMpO1xufVxuIiwidmFyIHNpQXVkaW8gPSB7fTtcblxuZnVuY3Rpb24gaW5pdEF1ZGlvKCkge1xuXHRzaUF1ZGlvWydzZngnXSA9IHt9O1xuXHRzaUF1ZGlvWydzZngnXVsnY2xpY2snXSA9IG5ldyBIb3dsKHtcblx0XHRzcmM6IFsnbWVkaWEvYXVkaW8vc291bmRzL21vdXNlX2NsaWNrLm1wMyddLFxuXHRcdHZvbHVtZTogMC44XG5cdH0pO1xuXHRzaUF1ZGlvWydzZngnXS53cm9uZyA9IG5ldyBIb3dsKHtcblx0XHRzcmM6IFsnbWVkaWEvYXVkaW8vc291bmRzL25lZ2F0aXZlLm1wMyddLFxuXHRcdHZvbHVtZTogMC41XG5cdH0pO1xuXHRzaUF1ZGlvWydzZngnXS5yaWdodCA9IG5ldyBIb3dsKHtcblx0XHRzcmM6IFsnbWVkaWEvYXVkaW8vc291bmRzL3Bvc2l0aXZlLm1wMyddLFxuXHRcdHZvbHVtZTogMC41XG5cdH0pO1xuXHRzaUF1ZGlvWydzZngnXS5ub3RoaW5nID0gbmV3IEhvd2woe1xuXHRcdHNyYzogWydtZWRpYS9hdWRpby9zb3VuZHMvbm90aGluZy5tcDMnXVxuXHR9KTtcblxuXHRmb3IgKGtleSBpbiBzbGlkZXMpIHtcblx0XHRzaUF1ZGlvW2tleV0gPSB7fTtcblx0XHRpZiAoc2xpZGVzW2tleV1bJ2F1ZGlvJ10pIHtcblx0XHRcdHZhciBhdWRpbyA9IHNsaWRlc1trZXldWydhdWRpbyddO1xuXHRcdFx0Zm9yICh0cmFjayBpbiBhdWRpbykge1xuXHRcdFx0XHRzaUF1ZGlvW2tleV1bdHJhY2tdID0gbmV3IEhvd2woe1xuXHRcdFx0XHRcdHNyYzogYXVkaW9bdHJhY2tdLFxuXHRcdFx0XHRcdG9ucGxheTogb25wbGF5Q2xvc3VyZSh0cmFjayksXG5cdFx0XHRcdFx0b25lbmQ6IG9uZW5kQ2xvc3VyZSh0cmFjaywga2V5KVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0c2xpZGVzW2tleV1bJ2F1ZGlvJ10gPSB7fTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gb25wbGF5Q2xvc3VyZSh0cmFjaykge1xuXHRyZXR1cm4gZnVuY3Rpb24gKCkge1xuXHRcdGlmICghZ2xvYmFsVmFyLmxvY2tDbG9zZXJzRHVyaW5nRmVlZGJhY2tWTykgcmV0dXJuO1xuXG5cdFx0aWYgKHRyYWNrID09PSAnb25FbnRlcicpIHJldHVybjtcblx0XHR2YXIgJGNsb3NlcnMgPSAkKCcuc2ktbW9kYWwtY29udGFpbmVyX19qcywgLnNpLW1vZGFsLWNsb3Nlcl9fanMnKTtcblxuXHRcdGxvY2soJGNsb3NlcnMpO1xuXHR9O1xufVxuZnVuY3Rpb24gb25lbmRDbG9zdXJlKHRyYWNrLCBrZXkpIHtcblx0cmV0dXJuIGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoIWdsb2JhbFZhci5sb2NrQ2xvc2Vyc0R1cmluZ0ZlZWRiYWNrVk8pIHJldHVybjtcblxuXHRcdGlmICh0cmFjayA9PT0gJ29uRW50ZXInKSByZXR1cm47XG5cblx0XHR2YXIgJGNsb3NlcnMgPSAkKCcuc2ktbW9kYWwtY29udGFpbmVyX19qcywgLnNpLW1vZGFsLWNsb3Nlcl9fanMnKTtcblxuXHRcdHVubG9jaygkY2xvc2Vycyk7XG5cdH07XG59XG4iLCJmdW5jdGlvbiB2aWRlb0NoZWNrKCkge1xuXHR2YXIgc2xpZGUgPSBnbG9iYWxWYXIuc2xpZGU7XG5cblx0aWYgKHNsaWRlLmRhdGEudHlwZSA9PSAndmlkZW8nKSB7XG5cdFx0dmFyIHZpZGVvID0gc2xpZGUuJGRvbS5maW5kKCd2aWRlbycpWzBdO1xuXHRcdHZhciB2aWRlb0lEID0gc2xpZGUuJGRvbS5maW5kKCd2aWRlbycpWzBdLmlkO1xuXG5cdFx0aWYgKHNsaWRlLmRhdGEudmlkZW9Mb2FkZWQgPT0gZmFsc2UpIHZpZGVvSW5pdChzbGlkZSwgdmlkZW9JRCk7XG5cdFx0ZWxzZSB2aWRlb1Jlc3RhcnQodmlkZW9JRCk7XG5cdH0gZWxzZSB7XG5cdFx0aWYgKCQoJ3NlY3Rpb24nKS5maW5kKCd2aWRlbycpLmxlbmd0aCA+IDApIHtcblx0XHRcdCQoJ3NlY3Rpb24nKS5maW5kKCd2aWRlbycpWzBdLnBhdXNlKCk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKHNsaWRlLmRhdGEudHJhbnNjcmlwdCkgJCgnI3NpLXRyYW5zY3JpcHQnKS5hdHRyKCdocmVmJywgc2xpZGUuZGF0YS50cmFuc2NyaXB0KTtcbn1cblxuZnVuY3Rpb24gdmlkZW9Jbml0KHNsaWRlLCB2aWRlb0lEKSB7XG5cdHZpZGVvanModmlkZW9JRCwge1xuXHRcdGxhbmd1YWdlOiAnZW4nLFxuXHRcdGF1dG9wbGF5OiB0cnVlLFxuXHRcdGNvbnRyb2xCYXI6IHtcblx0XHRcdHZvbHVtZVBhbmVsOiB7XG5cdFx0XHRcdGlubGluZTogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0aHRtbDU6IHtcblx0XHRcdC8vIGh0dHBzOi8vZG9jcy52aWRlb2pzLmNvbS9kb2NzL2d1aWRlcy90ZXh0LXRyYWNrcy5odG1sI2VtdWxhdGVkLXRleHQtdHJhY2tzXG5cdFx0XHQvLyBwcmV2ZW50cyBpUGhvbmUgYW5kIHNhZmFyaSBmcm9tIHVzaW5nIHRoZWlyIG93biBzdWJ0aXRsZSBzeXN0ZW1cblx0XHRcdG5hdGl2ZVRleHRUcmFja3M6IGZhbHNlXG5cdFx0fSxcblx0XHRwbHVnaW5zOiB7XG5cdFx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20va21vc2t3aWFrL3ZpZGVvanMtcmVzb2x1dGlvbi1zd2l0Y2hlciNwbHVnaW4tb3B0aW9uc1xuXHRcdFx0dmlkZW9Kc1Jlc29sdXRpb25Td2l0Y2hlcjoge1xuXHRcdFx0XHRkZWZhdWx0OiAnaGlnaCcsXG5cdFx0XHRcdGR5bmFtaWNMYWJlbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9jdGQxNTAwL3ZpZGVvanMtaG90a2V5cyNvcHRpb25zXG5cdFx0XHRob3RrZXlzOiB7XG5cdFx0XHRcdGVuYWJsZU51bWJlcnM6IGZhbHNlLFxuXHRcdFx0XHRlbmFibGVNb2RpZmllcnNGb3JOdW1iZXJzOiBmYWxzZSxcblx0XHRcdFx0YWx3YXlzQ2FwdHVyZUhvdGtleXM6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRzZWVrQnV0dG9uczoge1xuXHRcdFx0XHRiYWNrOiAxMFxuXHRcdFx0fVxuXHRcdH1cblx0fSkucmVhZHkoZnVuY3Rpb24gKCkge1xuXHRcdC8vIGRpc2FibGUgcHJvZ3Jlc3MgY29udHJvbCAoc2Vla2luZykgaWYgZ2xvYmFsVmFyIG9yIGRhdGEuanMgaXMgY29uZmlndXJlZCB0aGF0IHdheS5cblx0XHQvLyB2aWRlb1NlZWtpbmcgKGRhdGEuanMpIGlzIG92ZXJydWxpbmcgcHJvZ3Jlc3NDb250cm9sIChnbG9iYWxWYXIpLlxuXHRcdC8vIGlmIGRldk1vZGUgaXMgb24sIHNlZWtpbmcgaXMgYWx3YXlzIGVuYWJsZWQuXG5cblx0XHRpZiAoIWdsb2JhbFZhci5kZXZNb2RlKSB7XG5cdFx0XHRpZiAoIXNsaWRlLmRhdGEudmlkZW9TZWVraW5nKSB7XG5cdFx0XHRcdGlmIChzbGlkZS5kYXRhLnZpZGVvU2Vla2luZyA9PT0gZmFsc2UgfHwgZ2xvYmFsVmFyLnZpZGVvLnByb2dyZXNzQ29udHJvbCA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHR2aWRlb2pzKHZpZGVvSUQpLmNvbnRyb2xCYXIucHJvZ3Jlc3NDb250cm9sLmRpc2FibGUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICh2aWRlb2pzKHZpZGVvSUQpLnRleHRUcmFja3MoKS50cmFja3NfLmxlbmd0aCA+IDApIHtcblx0XHRcdC8vIHN1YnRpdGxlL2NhcHRpb25zIHN0eWxlIGlzIHNldCB1cCBoZXJlIChkZWZhdWx0cyBpbiBjb21tZW50cylcblx0XHRcdC8vIE5PVEU6IHVzZSAjWFhYIGhleCBzdHlsZSBmb3IgY29sb3JzISAjeHh4IG9yICN4eHh4eHggd2lsbCBub3Qgd29yayFcblx0XHRcdHZhciBzdWJ0aXRsZVNldHRpbmdzID0ge1xuXHRcdFx0XHRiYWNrZ3JvdW5kT3BhY2l0eTogJzAuNScsIC8vXHRcdFx0XHRcIjFcIlxuXHRcdFx0XHRlZGdlU3R5bGU6ICdkcm9wc2hhZG93JywgLy9cdFx0XHRcdFx0bm90IHNldCAobm9uZSwgbnVsbCwgMCwgJycgZG9lc24ndCB3b3JrLCBvbmx5IG5vdCBzZXR0aW5nIGl0IGF0IGFsbCB3aWxsIHNldCBpdCB0byAnbm9uZScpXG5cdFx0XHRcdGNvbG9yOiAnI0ZGRicsIC8vXHRcdFx0XHRcdFx0XHRcIiNGRkZcIlxuXHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3I6ICcjMDAwJywgLy9cdFx0XHRcdFx0XCIjMDAwXCJcblx0XHRcdFx0dGV4dE9wYWNpdHk6ICcxJywgLy9cdFx0XHRcdFx0XHRcIjFcIlxuXHRcdFx0XHR3aW5kb3dPcGFjaXR5OiAnMCcsIC8vXHRcdFx0XHRcdFx0XCIwXCJcblx0XHRcdFx0Zm9udEZhbWlseTogJ3Byb3BvcnRpb25hbFNhbnNTZXJpZicsIC8vXHRcdFwicHJvcG9ydGlvbmFsU2Fuc1NlcmlmXCJcblx0XHRcdFx0d2luZG93Q29sb3I6ICcjRkZGJyAvL1x0XHRcdFx0XHRcdFwiIzAwMFwiXG5cdFx0XHRcdC8vZm9udFBlcmNlbnQ6IDEgLy9cdFx0XHRcdFx0XHRcdG5vdCBzZXQgKDEsIDEuMCwgMS4wMCwgZXRjIGRvZXNuJ3Qgd29yaywgb25seSBub3Qgc2V0dGluZyBpdCBhdCBhbGwgd2lsbCBzZXQgaXQgdG8gMTAwJSlcblx0XHRcdH07XG5cdFx0XHR2aWRlb2pzKHZpZGVvSUQpLnRleHRUcmFja1NldHRpbmdzLnNldFZhbHVlcyhzdWJ0aXRsZVNldHRpbmdzKTtcblx0XHRcdHZpZGVvanModmlkZW9JRCkudGV4dFRyYWNrU2V0dGluZ3MudXBkYXRlRGlzcGxheSgpO1xuXG5cdFx0XHQvLyB0aGlzIHdvdWxkIHNob3cgdGhlIGZpcnN0IHN1YnRpdGxlIHRyYWNrXG5cdFx0XHQvLyB2aWRlb2pzKHZpZGVvSUQpLnRleHRUcmFja3NfWzBdLm1vZGUgPSBcInNob3dpbmdcIlxuXG5cdFx0XHQvLyBwcmludHMgb3V0IGEgbmljZSB0YWJsZSBvZiB0aGUgY3VycmVudCBzdWJ0aXRsZSBzdHlsZSBzZXR0aW5nc1xuXHRcdFx0Ly8gY29uc29sZS50YWJsZSh2aWRlb2pzKHZpZGVvSUQpLnRleHRUcmFja1NldHRpbmdzLmdldFZhbHVlcygpKTtcblx0XHR9XG5cblx0XHRzbGlkZS5kYXRhLnZpZGVvTG9hZGVkID0gdHJ1ZTtcblxuXHRcdHZpZGVvanModmlkZW9JRCkucGxheSgpO1xuXG5cdFx0Ly8gT2xkIHdheSBvZiBkaXNhYmxpbmcgc2Vla2luZy5cblx0XHQvLyBPYnNvbGV0ZSBiZWNhdXNlIGl0J3Mgbm90IHJlbGlhYmxlIGluIElFLiBOZXcgbmF0aXZlIG1ldGhvZCBpcy5cblx0XHQvKiBpZiAoc2xpZGUuZGF0YS52aWRlb1NlZWtpbmcgPT0gZmFsc2UpIHtcblx0XHR2YXIgc3VwcG9zZWRDdXJyZW50VGltZSA9IDA7XG5cdFx0dmlkZW8uYWRkRXZlbnRMaXN0ZW5lcigndGltZXVwZGF0ZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCF2aWRlby5zZWVraW5nKSB7XG5cdFx0XHRcdHN1cHBvc2VkQ3VycmVudFRpbWUgPSB2aWRlby5jdXJyZW50VGltZTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHQvL2FsbG93cyBiYWNrd2FyZHMgbW92ZW1lbnQgb2YgdHJhY2tiYXIgYnV0IGNhbid0IG1vdmUgdHJhY2tiYXIgZm9yd2FyZFxuXHRcdHZpZGVvLmFkZEV2ZW50TGlzdGVuZXIoJ3NlZWtpbmcnLCBmdW5jdGlvbigpIHtcblx0XHRcdGlmICh2aWRlby5jdXJyZW50VGltZSA+IHN1cHBvc2VkQ3VycmVudFRpbWUpIHtcblx0XHRcdFx0dmlkZW8uY3VycmVudFRpbWUgPSBzdXBwb3NlZEN1cnJlbnRUaW1lO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9ICovXG5cdH0pO1xuXHR2aWRlb2pzKHZpZGVvSUQpLm9uKCdlbmRlZCcsIGZ1bmN0aW9uICgpIHtcblx0XHRnbG9iYWxWYXIudmlkZW9TZWVuW3NsaWRlLmlkXSA9IHRydWU7XG5cdFx0aWYgKHNsaWRlLmRhdGEuY29pblNldHRpbmdzLmluY2x1ZGUgPT09IHRydWUpIHtcblx0XHRcdGFkZENvaW5zKCk7XG5cdFx0fVxuXHRcdHNsaWRlQWN0aW9uKHNsaWRlLmlkLCAnbmV4dEFjdGlvbicpO1xuXHR9KTtcblx0aWYgKGdsb2JhbFZhci5mYWRlTmF2aWdhdGlvbikge1xuXHRcdHZpZGVvanModmlkZW9JRCkub24oJ3VzZXJhY3RpdmUnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkKCcjc2ktbmF2LWNvbnRhaW5lcicpLnJlbW92ZUNsYXNzKCd2anMtZmFkZS1vdXQnKTtcblx0XHR9KTtcblxuXHRcdHZpZGVvanModmlkZW9JRCkub24oJ3VzZXJpbmFjdGl2ZScsIGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICghdmlkZW9qcyh2aWRlb0lEKS5wYXVzZWQoKSkge1xuXHRcdFx0XHQkKCcjc2ktbmF2LWNvbnRhaW5lcicpLmFkZENsYXNzKCd2anMtZmFkZS1vdXQnKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxufVxuXG5mdW5jdGlvbiB2aWRlb1Jlc3RhcnQodmlkZW9JRCkge1xuXHR2aWRlb2pzKHZpZGVvSUQpLmN1cnJlbnRUaW1lKDApO1xuXHR2aWRlb2pzKHZpZGVvSUQpLnBsYXkoKTtcbn1cbiIsInZhciB1bmxvY2tlclNvdW5kID0gbmV3IEhvd2woe1xuXHRzcmM6IFsnbWVkaWEvYXVkaW8vc291bmRzL25vdGhpbmcubXAzJ11cbn0pO1xudW5sb2NrZXJTb3VuZC5vbigndW5sb2NrJywgZnVuY3Rpb24gKCkge1xuXHQvLyBjb25zb2xlLmxvZygnSE9XTEVSOiBBdWRpbyB1bmxvY2tlZC4nKTtcblx0aGlkZVByZWxvYWRlcigpO1xuXHR1bmxvY2tlclNvdW5kLnBsYXkoKTtcbn0pO1xudW5sb2NrZXJTb3VuZC5vbigncGxheScsIGZ1bmN0aW9uICgpIHtcblx0Ly8gY29uc29sZS5sb2coJ0hPV0xFUjogQXVkaW8gcGxheWluZy4nKTtcblx0aGlkZVByZWxvYWRlcigpO1xufSk7XG51bmxvY2tlclNvdW5kLnBsYXkoKTtcblxuZnVuY3Rpb24gaW5pdFByZWxvYWRlcigpIHtcblx0ZnVuY3Rpb24gb25Mb2FkZWQoKSB7XG5cdFx0JCgnI3ByZWxvYWRlcl90ZXh0XzEnKS5mYWRlT3V0KCdzbG93JywgZnVuY3Rpb24gKCkge1xuXHRcdFx0JCgnI3ByZWxvYWRlcl90ZXh0XzInKS5mYWRlSW4oJ3Nsb3cnKTtcblx0XHR9KTtcblx0XHQkKCcjUHJlbG9hZGVyJykub24oJ2NsaWNrIHRvdWNoJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHNpQXVkaW8uc2Z4LmNsaWNrLnBsYXkoKTtcblx0XHRcdGhpZGVQcmVsb2FkZXIoKTtcblx0XHR9KTtcblx0fVxuXG5cdGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnIHx8IGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkZWQnKSB7XG5cdFx0Ly8gZG9jdW1lbnQgaXMgYWxyZWFkeSByZWFkeSB0byBnb1xuXHRcdG9uTG9hZGVkKCk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gU0VUVVAgVEhFIFBSRUxPQURFUlxuXHRcdHdpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRvbkxvYWRlZCgpO1xuXHRcdH07XG5cdH1cblx0Ly8gJCgnc2VjdGlvbi5wcmVzZW50JykuaGlkZSgpO1xufVxuXG5mdW5jdGlvbiBoaWRlUHJlbG9hZGVyKCkge1xuXHQkKCcjUHJlbG9hZGVyJykuZmFkZU91dCgnc2xvdycsIGZ1bmN0aW9uICgpIHtcblx0XHQkKCdzZWN0aW9uLnByZXNlbnQnKS5mYWRlSW4oJ3Nsb3cnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgc2xpZGUgPSBnbG9iYWxWYXIuc2xpZGU7XG5cdFx0XHRpZiAoc2xpZGUuZGF0YSAhPT0gdW5kZWZpbmVkICYmIHNsaWRlLmRhdGEudHlwZSA9PSAndmlkZW8nKSB7XG5cdFx0XHRcdHZhciB2aWRlbyA9IGdsb2JhbFZhci4kY3VyU2xpZGUuZmluZCgndmlkZW8nKVswXTtcblx0XHRcdFx0aWYgKChsbXNDb25uZWN0ZWQgfHwgZ2xvYmFsVmFyLnNjb3JtU2V0dGluZ3MudXNlTG9jYWwpICYmIHNhdmVEYXRhLmN1cnJlbnRWaWRlb1RpbWUgPiAwKSB7XG5cdFx0XHRcdFx0dmlkZW9qcyh2aWRlby5wbGF5ZXJJZCkuY3VycmVudFRpbWUoc2F2ZURhdGEuY3VycmVudFZpZGVvVGltZSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dmlkZW9qcyh2aWRlby5wbGF5ZXJJZCkuY3VycmVudFRpbWUoMCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmlkZW9qcyh2aWRlby5wbGF5ZXJJZCkucGxheSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcbn1cblxuLy8gaW5pdFByZWxvYWRlcigpXG4iLCIvLy8vLy8vLy8vLy8qRmVhdHVyZTpQb3NpdGl2ZSBGZWVkYmFjayBGdW5jdGlvbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyoqXG4gKlxuICovXG5mdW5jdGlvbiBpbml0RmVlZGJhY2tzKCkge1xuXHR2YXIgbW9kYWxDb250YWluZXIgPSAkKCcuc2ktbW9kYWwtY29udGFpbmVyX19qcycpO1xuXHR2YXIgbW9kYWxzID0gJCgnLnNpLW1vZGFsX19qcycpO1xuXHR2YXIgbW9kYWxDbG9zZXJzID0gJCgnLnNpLW1vZGFsLWNsb3Nlcl9fanMnKTtcblxuXHRtb2RhbHMub24oJ2NsaWNrLnByZXZlbnQnLCBmdW5jdGlvbiAoZSkge1xuXHRcdHZhciBpc0hvdHNwb3RNb2RhbCA9IGdsb2JhbFZhci5jdXJyZW50TW9kYWxUeXBlID09PSAnaG90c3BvdCc7XG5cdFx0dmFyIGhvdHNwb3QgPSBzbGlkZXNbZ2xvYmFsVmFyLnNsaWRlLmlkXS5ob3RzcG90O1xuXHRcdHZhciBjbGlja0FueXdoZXJlSG90c3BvdCA9IGhvdHNwb3QgJiYgaG90c3BvdC5tb2RhbHMgJiYgaG90c3BvdC5tb2RhbHMuY2xpY2tBbnl3aGVyZTtcblxuXHRcdGlmIChlLnRhcmdldC50YWdOYW1lICE9PSAnQScpIGUucHJldmVudERlZmF1bHQoKTtcblxuXHRcdGlmICghKGlzSG90c3BvdE1vZGFsICYmIGNsaWNrQW55d2hlcmVIb3RzcG90KSkgZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0fSk7XG5cdG1vZGFsQ29udGFpbmVyLm9uKCdjbGljay5jbG9zZScsIGZ1bmN0aW9uICgpIHtcblx0XHRtb2RhbENsb3NpbmdBY3Rpb25zKCk7XG5cdH0pO1xuXHRtb2RhbENsb3NlcnMuZWFjaChmdW5jdGlvbiAoaWR4LCBjbG9zZXIpIHtcblx0XHQkKGNsb3Nlcikub24oJ2NsaWNrLmNsb3NlJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRtb2RhbENsb3NpbmdBY3Rpb25zKCk7XG5cdFx0fSk7XG5cdH0pO1xufVxuXG4vKipcbiAqXG4gKi9cbmZ1bmN0aW9uIGFuc3dlckNvcnJlY3QoKSB7XG5cdHZhciBzbGlkZSA9IGdsb2JhbFZhci5zbGlkZTtcblx0dmFyIGN1cnJlbnRNb2RhbCA9IHNsaWRlLmRhdGEubW9kYWwucG9zaXRpdmU7XG5cdHZhciBtb2RhbENvbnRhaW5lciA9ICQoJy5zaS1tb2RhbC1jb250YWluZXJfX2pzJyk7XG5cdCQoJy5sZWFkZXItbGluZScpLmFkZENsYXNzKCdoaWRlJyk7XG5cdG1vZGFsQ29udGFpbmVyLmFkZENsYXNzKCdzaS1tb2RhbC1jb250YWluZXItb3BlbicpO1xuXHQkKCcjJyArIGN1cnJlbnRNb2RhbCkuYWRkQ2xhc3MoJ3NpLWN1cnJlbnQtbW9kYWwnKTtcblx0Z2xvYmFsVmFyLmN1cnJlbnRNb2RhbCA9IGN1cnJlbnRNb2RhbDtcblx0Z2xvYmFsVmFyLmN1cnJlbnRNb2RhbFR5cGUgPSAncG9zaXRpdmUnO1xuXHR2YXIgdHlwZSA9IHNsaWRlLmRhdGEudHlwZTtcblx0c2xpZGUuZGF0YVt0eXBlXS50cnlzID0gMDtcblx0aWYgKHNpQXVkaW9bc2xpZGUuaWRdLnBvc2l0aXZlKSB7XG5cdFx0c2lBdWRpby5zZngucmlnaHQub25jZSgnZW5kJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0c2lBdWRpb1tzbGlkZS5pZF0ucG9zaXRpdmUucGxheSgpO1xuXHRcdH0pO1xuXHRcdHNpQXVkaW8uc2Z4LnJpZ2h0LnBsYXkoKTtcblx0fSBlbHNlIHtcblx0XHRzaUF1ZGlvLnNmeC5yaWdodC5wbGF5KCk7XG5cdH1cblxuXHRzbGlkZUFjdGlvbihzbGlkZS5pZCwgJ29uU3VjY2Vzc0FjdGlvbicpO1xufVxuXG4vLy8vLy8vLy8vLy8qRmVhdHVyZTpOZWdhdGl2ZSBGZWVkYmFjayBGdW5jdGlvbnMvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qKlxuICpcbiAqL1xuZnVuY3Rpb24gYW5zd2VySW5jb3JyZWN0KCkge1xuXHR2YXIgc2xpZGUgPSBnbG9iYWxWYXIuc2xpZGU7XG5cblx0dmFyIHR5cGUgPSBzbGlkZS5kYXRhLnR5cGU7XG5cdHZhciB0cnlzID0gc2xpZGUuZGF0YVt0eXBlXS50cnlzO1xuXHR2YXIgYXR0ZW1wdHMgPSBzbGlkZS5kYXRhW3R5cGVdLnVzZXJBdHRlbXB0cztcblx0dmFyIG1vZGFsQ29udGFpbmVyID0gJCgnLnNpLW1vZGFsLWNvbnRhaW5lcl9fanMnKTtcblx0aWYgKGF0dGVtcHRzID09PSAwKSB7XG5cdFx0dHJ5cyA9IDA7XG5cdH0gZWxzZSB7XG5cdFx0dHJ5cysrO1xuXHR9XG5cdHNsaWRlLmRhdGFbdHlwZV0udHJ5cyA9IHRyeXM7XG5cblx0aWYgKHRyeXMgPCBhdHRlbXB0cyB8fCBhdHRlbXB0cyA9PT0gMCkge1xuXHRcdHZhciBjdXJyZW50TW9kYWw7XG5cdFx0aWYgKHNsaWRlLmRhdGEubW9kYWxbJ25lZ2F0aXZlJyArIHRyeXNdKSB7XG5cdFx0XHRjdXJyZW50TW9kYWwgPSBzbGlkZS5kYXRhLm1vZGFsWyduZWdhdGl2ZScgKyB0cnlzXTtcblx0XHRcdGdsb2JhbFZhci5jdXJyZW50TW9kYWwgPSBjdXJyZW50TW9kYWw7XG5cdFx0XHRnbG9iYWxWYXIuY3VycmVudE1vZGFsVHlwZSA9ICduZWdhdGl2ZScgKyB0cnlzO1xuXHRcdH0gZWxzZSBpZiAoc2xpZGUuZGF0YS5tb2RhbC5uZWdhdGl2ZSkge1xuXHRcdFx0Y3VycmVudE1vZGFsID0gc2xpZGUuZGF0YS5tb2RhbC5uZWdhdGl2ZTtcblx0XHRcdGdsb2JhbFZhci5jdXJyZW50TW9kYWwgPSBjdXJyZW50TW9kYWw7XG5cdFx0XHRnbG9iYWxWYXIuY3VycmVudE1vZGFsVHlwZSA9ICduZWdhdGl2ZSc7XG5cdFx0fVxuXHRcdCQoJy5sZWFkZXItbGluZScpLmFkZENsYXNzKCdoaWRlJyk7XG5cdFx0bW9kYWxDb250YWluZXIuYWRkQ2xhc3MoJ3NpLW1vZGFsLWNvbnRhaW5lci1vcGVuJyk7XG5cdFx0JCgnIycgKyBjdXJyZW50TW9kYWwpLmFkZENsYXNzKCdzaS1jdXJyZW50LW1vZGFsJyk7XG5cdFx0aWYgKHNpQXVkaW9bc2xpZGUuaWRdWyduZWdhdGl2ZScgKyB0cnlzXSkge1xuXHRcdFx0c2lBdWRpby5zZngud3Jvbmcub25jZSgnZW5kJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRzaUF1ZGlvW3NsaWRlLmlkXVsnbmVnYXRpdmUnICsgdHJ5c10ucGxheSgpO1xuXHRcdFx0fSk7XG5cdFx0XHRzaUF1ZGlvLnNmeC53cm9uZy5wbGF5KCk7XG5cdFx0fSBlbHNlIGlmIChzaUF1ZGlvW3NsaWRlLmlkXS5uZWdhdGl2ZSkge1xuXHRcdFx0c2lBdWRpby5zZngud3Jvbmcub25jZSgnZW5kJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRzaUF1ZGlvW3NsaWRlLmlkXS5uZWdhdGl2ZS5wbGF5KCk7XG5cdFx0XHR9KTtcblx0XHRcdHNpQXVkaW8uc2Z4Lndyb25nLnBsYXkoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2lBdWRpby5zZngud3JvbmcucGxheSgpO1xuXHRcdH1cblxuXHRcdHNsaWRlQWN0aW9uKHNsaWRlLmlkLCAnb25GYWlsdXJlQWN0aW9uMScpO1xuXHR9IGVsc2UgaWYgKGF0dGVtcHRzICE9PSAwICYmIHRyeXMgPT09IGF0dGVtcHRzKSB7XG5cdFx0Y3VycmVudE1vZGFsID0gc2xpZGUuZGF0YS5tb2RhbC5uZWdhdGl2ZUZpbmFsO1xuXHRcdGdsb2JhbFZhci5jdXJyZW50TW9kYWwgPSBjdXJyZW50TW9kYWw7XG5cdFx0Z2xvYmFsVmFyLmN1cnJlbnRNb2RhbFR5cGUgPSAnbmVnYXRpdmVGaW5hbCc7XG5cdFx0JCgnLmxlYWRlci1saW5lJykuYWRkQ2xhc3MoJ2hpZGUnKTtcblx0XHRtb2RhbENvbnRhaW5lci5hZGRDbGFzcygnc2ktbW9kYWwtY29udGFpbmVyLW9wZW4nKTtcblx0XHQkKCcjJyArIGN1cnJlbnRNb2RhbCkuYWRkQ2xhc3MoJ3NpLWN1cnJlbnQtbW9kYWwnKTtcblx0XHRzbGlkZS5kYXRhW3R5cGVdLnRyeXMgPSAwO1xuXG5cdFx0aWYgKHNpQXVkaW9bc2xpZGUuaWRdLm5lZ2F0aXZlRmluYWwpIHtcblx0XHRcdHNpQXVkaW8uc2Z4Lndyb25nLm9uY2UoJ2VuZCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0c2lBdWRpb1tzbGlkZS5pZF0ubmVnYXRpdmVGaW5hbC5wbGF5KCk7XG5cdFx0XHR9KTtcblx0XHRcdHNpQXVkaW8uc2Z4Lndyb25nLnBsYXkoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2lBdWRpby5zZngud3JvbmcucGxheSgpO1xuXHRcdH1cblxuXHRcdHNsaWRlQWN0aW9uKHNsaWRlLmlkLCAnb25GYWlsdXJlQWN0aW9uMicpO1xuXHR9XG59XG4vLy8vLy8vLy8vLy8qRmVhdHVyZTpQb3NpdGl2ZSBhbmQgTmVnYXRpdmUgRmVlZGJhY2sgSGFuZGxlciAmIGNsb3NlRmVlZGJhY2tBY3Rpb24vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qKlxuICogQHBhcmFtIGJvbFxuICovXG5mdW5jdGlvbiBoYW5kbGVBbnN3ZXIoYm9sKSB7XG5cdHZhciBzbGlkZSA9IGdsb2JhbFZhci5zbGlkZTtcblx0dmFyIHR5cGUgPSBzbGlkZS5kYXRhLnR5cGU7XG5cdHZhciB0cnlzID0gc2xpZGUuZGF0YVt0eXBlXS50cnlzO1xuXHR2YXIgbW9kYWxUeXBlID0gYm9sID8gJ3Bvc2l0aXZlJyA6ICduZWdhdGl2ZSc7XG5cdHZhciBoYXNNb2RhbCA9XG5cdFx0c2xpZGUuZGF0YS5tb2RhbCAmJlxuXHRcdChzbGlkZS5kYXRhLm1vZGFsW21vZGFsVHlwZV0gfHwgc2xpZGUuZGF0YS5tb2RhbFttb2RhbFR5cGUgKyAnRmluYWwnXSB8fCBzbGlkZS5kYXRhLm1vZGFsW21vZGFsVHlwZSArIHRyeXNdKTtcblxuXHRIb3dsZXIuc3RvcCgpO1xuXG5cdGlmIChib2wpIHtcblx0XHRpZiAoZ2xvYmFsVmFyLmVhcm5Db2lucyA9PT0gdHJ1ZSAmJiBzbGlkZS5kYXRhLmNvaW5TZXR0aW5ncy5pbmNsdWRlKSB7XG5cdFx0XHRhZGRDb2lucygpO1xuXHRcdH1cblx0fVxuXG5cdGlmICghaGFzTW9kYWwpIHtcblx0XHRpZiAoYm9sKSB7XG5cdFx0XHRzbGlkZUFjdGlvbihzbGlkZS5pZCwgJ29uU3VjY2Vzc0FjdGlvbicpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzbGlkZUFjdGlvbihzbGlkZS5pZCwgJ29uRmFpbHVyZUFjdGlvbjEnKTtcblx0XHR9XG5cdFx0c2xpZGVBY3Rpb24oc2xpZGUuaWQsICduZXh0QWN0aW9uJyk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gJCgnI3NpLW5hdi1jb250YWluZXInKS5hZGRDbGFzcygnZmVlZGJhY2stb3BlbicpO1xuXHRcdGlmIChib2wgPT0gdHJ1ZSkge1xuXHRcdFx0YW5zd2VyQ29ycmVjdCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRhbnN3ZXJJbmNvcnJlY3QoKTtcblx0XHR9XG5cdH1cbn1cblxuLyoqXG4gKiBAcGFyYW0gaXRlbVxuICovXG5mdW5jdGlvbiBjbG9zZUZlZWRiYWNrQWN0aW9uKGl0ZW0pIHtcblx0dmFyIHNsaWRlID0gZ2xvYmFsVmFyLnNsaWRlO1xuXHQkKCcubGVhZGVyLWxpbmUnKS5yZW1vdmVDbGFzcygnaGlkZScpO1xuXHRpZiAoZ2xvYmFsVmFyLmN1cnJlbnRNb2RhbCA9PSAnaTYtZW5kJykge1xuXHRcdHNsaWRlQWN0aW9uKHNsaWRlLmlkLCAnbmV4dEFjdGlvbicpO1xuXHR9IGVsc2Uge1xuXHRcdHN3aXRjaCAoaXRlbSkge1xuXHRcdFx0Y2FzZSAncG9zaXRpdmUnOlxuXHRcdFx0XHRpZiAoc2xpZGUuaWQgPT0gJ2k2Jykge1xuXHRcdFx0XHRcdHNpbXBsZU1vZGFsT3BlbignZW5kJyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2xpZGVBY3Rpb24oc2xpZGUuaWQsICduZXh0QWN0aW9uJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ25lZ2F0aXZlJzpcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdob3RzcG90Jzpcblx0XHRcdFx0dmFyICRob3RzcG90cyA9IHNsaWRlLiRkb20uZmluZCgnIC5ob3RzcG90LWJ1dHRvbl9fanMnKTtcblx0XHRcdFx0dmFyIGl0ZW1OdW0gPSBnbG9iYWxWYXIuaG90c3BvdEl0ZW1OdW07XG5cdFx0XHRcdHZhciAkaG90c3BvdCA9ICQoJGhvdHNwb3RzW2l0ZW1OdW0gLSAxXSk7XG5cdFx0XHRcdHZhciAkY3VyTW9kYWwgPSAkKCcjJyArIGdsb2JhbFZhci5jdXJyZW50TW9kYWwpO1xuXHRcdFx0XHR2YXIgbW9kYWxzID0gZ2V0SG90c3BvdE1vZGFscygkaG90c3BvdHMubGVuZ3RoKTtcblxuXHRcdFx0XHRoYW5kbGVIb3RzcG90Q2xvc2Uoc2xpZGUuZGF0YS5ob3RzcG90LCAkaG90c3BvdHMsIG1vZGFscywgaXRlbU51bSwgJGhvdHNwb3QsICRjdXJNb2RhbCk7XG5cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICduZWdhdGl2ZUZpbmFsJzpcblx0XHRcdFx0aWYgKHNsaWRlLmlkID09ICdpNicpIHtcblx0XHRcdFx0XHRzaW1wbGVNb2RhbE9wZW4oJ2VuZCcpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNsaWRlQWN0aW9uKHNsaWRlLmlkLCAnbmV4dEFjdGlvbicpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cbn1cblxuLyoqXG4gKlxuICovXG5mdW5jdGlvbiBGQktleWJvYXJkKCkge1xuXHQvLyB2YXIga2V5ID0gJChcIiNGQktleVwiKVxuXHR2YXIgRkJpdGVtcyA9ICQoJy5zaS1jdXJyZW50LW1vZGFsJykuY2hpbGRyZW4oKS5jaGlsZHJlbigpO1xuXHR2YXIgaWR4O1xuXHRpZiAoJChGQml0ZW1zWzBdKS5oYXNDbGFzcygnaWU5aGFjaycpKSB7XG5cdFx0aWR4ID0gMTtcblx0fSBlbHNlIHtcblx0XHRpZHggPSAwO1xuXHR9XG5cdCQoRkJpdGVtc1tpZHhdKS5mb2N1cygpO1xuXG5cdCQoJ2JvZHknKS5vbigna2V5ZG93bi5kcmFnJywgZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0c3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG5cdFx0XHRjYXNlIDk6IC8vY3ljbGVzIHRocm91Z2ggb25seSBGQiBlbGVtZW50cyB3aGlsZSBpdCBpcyBvcGVuXG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdGlmIChpZHggPCBGQml0ZW1zLmxlbmd0aCAtIDEpIHtcblx0XHRcdFx0XHRpZHggKz0gMTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRpZHggPSAwO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCQoRkJpdGVtc1tpZHhdKS5mb2N1cygpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgMjc6IC8vIGFsbG93cyB1c2VyIHRvIHByZXNzIGVzY2FwZSBrZXkgdG8gcmV0dXJuIHRvIG5vcm1hbCBhbmQgcGxhY2VzIGZvY3VzIG9uIHByZXZpb3VzIGVsZW1lbnRcblx0XHRcdFx0JCgnLnNpLWN1cnJlbnQtbW9kYWwnKS50cmlnZ2VyKCdjbGljaycpO1xuXHRcdFx0XHQkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIDEzOiAvLyBhbGxvd3MgdXNlciB0byBwcmVzcyBlbnRlciBrZXkgdG8gcmV0dXJuIHRvIG5vcm1hbCBhbmQgcmVtb3ZlcyBhbGwgZm9jdXMgKHNvIHRoYXQgc3VibWl0IGtleSBpcyBub3QgY2xpY2tlZCB3aGVuIEZCIGNsb3Nlcylcblx0XHRcdFx0JCgnLnNpLWN1cnJlbnQtbW9kYWwnKS50cmlnZ2VyKCdjbGljaycpO1xuXHRcdFx0XHQkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH0pO1xufVxuXG4vKipcbiAqXG4gKi9cbmZ1bmN0aW9uIGhhbmRsZUhvdHNwb3RDbG9zZShzZXR0aW5ncywgJGhvdHNwb3RzLCBtb2RhbHMsIGl0ZW1OdW0sICRob3RzcG90LCAkbW9kYWwpIHtcblx0dmFyIGl0ZW1TZXR0aW5ncyA9IGdldEl0ZW1TZXR0aW5ncyhzZXR0aW5ncy5pdGVtcywgJGhvdHNwb3RbMF0uaWQsIGl0ZW1OdW0pO1xuXG5cdGhvdHNwb3RDdXN0b21BY3Rpb24oc2V0dGluZ3Mub25Nb2RhbENsb3NlLCBpdGVtU2V0dGluZ3MgJiYgaXRlbVNldHRpbmdzLm9uTW9kYWxDbG9zZSwgJGhvdHNwb3QsICRtb2RhbCk7XG5cblx0aG90c3BvdEl0ZW1Db21wbGV0ZShzZXR0aW5ncywgJGhvdHNwb3RzLCBpdGVtU2V0dGluZ3MsICRob3RzcG90LCAkbW9kYWwpO1xuXG5cdGlmIChzZXR0aW5ncy5saW5lYXIpXG5cdFx0aG90c3BvdFVubG9ja05leHQoc2V0dGluZ3MsICRob3RzcG90cywgaXRlbU51bSArIDEsICQoJGhvdHNwb3RzW2l0ZW1OdW1dKSwgbW9kYWxzICYmIG1vZGFsc1tpdGVtTnVtXSk7XG59XG5cbi8qKlxuICogQHBhcmFtIGNvbnRhaW5lclxuICovXG5mdW5jdGlvbiBtb2RhbENsb3NpbmdBY3Rpb25zKCkge1xuXHR2YXIgc2xpZGUgPSBnbG9iYWxWYXIuc2xpZGU7XG5cdEhvd2xlci5zdG9wKCk7XG5cdGlmIChzbGlkZS5kYXRhLnR5cGUgPT09ICdob3RzcG90JyAmJiBzbGlkZS5kYXRhLmhvdHNwb3QubW9kYWxzICYmIHNsaWRlLmRhdGEuaG90c3BvdC5tb2RhbHMuaG92ZXIpIHtcblx0XHQvLyBjb25zb2xlLmxvZygnaG92ZXItaG90c3BvdCwgbm8gY2xpY2sgYXVkaW8nKTtcblx0fSBlbHNlIHtcblx0XHRzaUF1ZGlvLnNmeC5jbGljay5wbGF5KCk7XG5cdH1cblxuXHR2YXIgaXNGZWVkYmFja01vZGFsID0gZ2xvYmFsVmFyLmN1cnJlbnRNb2RhbFR5cGUgJiYgZ2xvYmFsVmFyLmN1cnJlbnRNb2RhbFR5cGUgIT09ICdob3RzcG90JztcblxuXHRzd2l0Y2ggKGlzRmVlZGJhY2tNb2RhbCAmJiBzbGlkZS5kYXRhLnR5cGUpIHtcblx0XHRjYXNlICdkbmQnOlxuXHRcdFx0cmVzZXREbmQoKTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ3NvcnQnOlxuXHRcdFx0cmVzZXRTb3J0KCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdxdWl6Jzpcblx0XHRcdHJlc2V0UXVpeigpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnc2NyYXRjaCc6XG5cdFx0XHRyZXNldFNjcmF0Y2goKTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ2hvdHNwb3QnOlxuXHRcdFx0dmFyICRob3RzcG90cyA9IHNsaWRlLiRkb20uZmluZCgnIC5ob3RzcG90LWJ1dHRvbl9fanMnKTtcblxuXHRcdFx0cmVzZXRIb3RzcG90KHNsaWRlLmRhdGEuaG90c3BvdCwgJGhvdHNwb3RzLCBnZXRIb3RzcG90TW9kYWxzKCRob3RzcG90cy5sZW5ndGgpKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0ZGVmYXVsdDpcblx0XHRcdGlmIChzbGlkZS5kYXRhLmN1c3RvbVJlc2V0KSB7XG5cdFx0XHRcdHNsaWRlLmRhdGEuY3VzdG9tUmVzZXQoKTtcblx0XHRcdH1cblx0fVxuXHRpZiAoc2xpZGUuZGF0YVtzbGlkZS5kYXRhLnR5cGVdLmN1c3RvbVJlc2V0KSB7XG5cdFx0c2xpZGUuZGF0YVtzbGlkZS5kYXRhLnR5cGVdLmN1c3RvbVJlc2V0KCk7XG5cdH1cblxuXHQkKCdib2R5Jykub2ZmKCdrZXlkb3duLmRyYWcnKTtcblxuXHQkKCcuc2ktbW9kYWwtY29udGFpbmVyX19qcycpLnJlbW92ZUNsYXNzKCdzaS1tb2RhbC1jb250YWluZXItb3BlbiBzaS1ob3Zlci1ob3RzcG90Jyk7XG5cdC8vIGNvbnNvbGUubG9nKCQoJyMnICsgZ2xvYmFsVmFyLmN1cnJlbnRNb2RhbCkpO1xuXHQkKCcjJyArIGdsb2JhbFZhci5jdXJyZW50TW9kYWwpLnJlbW92ZUNsYXNzKCdzaS1jdXJyZW50LW1vZGFsJyk7XG5cblx0aWYgKHNsaWRlLmRhdGEuY2xvc2VGZWVkYmFja0FjdGlvbikgc2xpZGUuZGF0YS5jbG9zZUZlZWRiYWNrQWN0aW9uKGdsb2JhbFZhci5jdXJyZW50TW9kYWxUeXBlKTtcblx0ZWxzZSBjbG9zZUZlZWRiYWNrQWN0aW9uKGdsb2JhbFZhci5jdXJyZW50TW9kYWxUeXBlKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gaWRcbiAqL1xuZnVuY3Rpb24gc2ltcGxlTW9kYWxPcGVuKGlkKSB7XG5cdHZhciBzbGlkZSA9IGdsb2JhbFZhci5zbGlkZTtcblx0aWYgKHNsaWRlLmRhdGEubW9kYWxbaWRdKSB7XG5cdFx0dmFyIGN1cnJlbnRNb2RhbCA9IHNsaWRlLmRhdGEubW9kYWxbaWRdO1xuXHRcdGlmIChzaUF1ZGlvW3NsaWRlLmlkXVtpZF0pIHtcblx0XHRcdHNpQXVkaW9bc2xpZGUuaWRdW2lkXS5wbGF5KCk7XG5cdFx0fVxuXHRcdCQoJy5zaS1tb2RhbC1jb250YWluZXJfX2pzJykuYWRkQ2xhc3MoJ3NpLW1vZGFsLWNvbnRhaW5lci1vcGVuJyk7XG5cdFx0JCgnIycgKyBjdXJyZW50TW9kYWwpLmFkZENsYXNzKCdzaS1jdXJyZW50LW1vZGFsJyk7XG5cdFx0Z2xvYmFsVmFyLmN1cnJlbnRNb2RhbCA9IGN1cnJlbnRNb2RhbDtcblx0fVxufVxuXG4vKipcbiAqXG4gKi9cbmZ1bmN0aW9uIHNpbXBsZU1vZGFsQ2xvc2UoKSB7XG5cdEhvd2xlci5zdG9wKCk7XG5cdCQoJy5zaS1tb2RhbC1jb250YWluZXJfX2pzJykucmVtb3ZlQ2xhc3MoJ3NpLW1vZGFsLWNvbnRhaW5lci1vcGVuJyk7XG5cdCQoJyMnICsgZ2xvYmFsVmFyLmN1cnJlbnRNb2RhbCkucmVtb3ZlQ2xhc3MoJ3NpLWN1cnJlbnQtbW9kYWwnKTtcbn1cbiIsIi8vLy8vLy8vLy8vLypGZWF0dXJlOkRyYWcgYW5kIERyb3AvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gcmVzZXREbmQoc2xpZGVJRCkge1xuXHRzbGlkZSA9IHNsaWRlSUQgPyBnZXRTbGlkZUhlbHBlcnMoc2xpZGVJRCkgOiBnbG9iYWxWYXIuc2xpZGU7XG5cdHZhciAkZHJhZ2dhYmxlcyA9IHNsaWRlLiRkb20uZmluZCgnLmRyYWdnYWJsZScpO1xuXHR2YXIgJGRyb3BwYWJsZXMgPSBzbGlkZS4kZG9tLmZpbmQoJy5kcm9wcGFibGUnKTtcblx0dmFyIGRuZEluZm8gPSBzbGlkZS5kYXRhLmRuZCA/IHNsaWRlLmRhdGEuZG5kIDoge307XG5cblx0Ly8gYW5pbWF0ZSBiYWNrIHRvIHN0YXJ0IHBvc2l0aW9uIGFuZCByZXNldCBhbGwgcG9zaXRpb24gc3RvcmFnZSB0byB0aGUgb3JpZ2luYWwuICBSZW1vdmUgZG5kMiBjbGFzc1xuXHQkZHJhZ2dhYmxlcy5lYWNoKGZ1bmN0aW9uIChpZHgsIGRyYWdnYWJsZSkge1xuXHRcdHZhciBjdXJyZW50RHJhZ2dhYmxlRGF0YSA9IGRuZEluZm8uZHJhZ2dhYmxlRGF0YVtkcmFnZ2FibGUuaWRdO1xuXHRcdHZhciBzdGFydFBvc2l0aW9uID0gY3VycmVudERyYWdnYWJsZURhdGEub3JpZ2luYWxQb3NpdGlvbjtcblx0XHQkKGRyYWdnYWJsZSkuYW5pbWF0ZShzdGFydFBvc2l0aW9uLCA1MDApO1xuXHRcdGN1cnJlbnREcmFnZ2FibGVEYXRhLmN1cnJlbnRQb3NpdGlvbiA9IHN0YXJ0UG9zaXRpb247XG5cdFx0Y3VycmVudERyYWdnYWJsZURhdGEucHJldmlvdXNQb3NpdGlvbiA9IHN0YXJ0UG9zaXRpb247XG5cdFx0Y3VycmVudERyYWdnYWJsZURhdGEuY3VycmVudERyb3BJRCA9ICcnO1xuXHRcdGlmIChzbGlkZS5kYXRhLmRuZC50eXBlID09PSAnZG5kXzInKSB7XG5cdFx0XHQkKGRyYWdnYWJsZSkuZmFkZUluKCkucmVtb3ZlQ2xhc3MoJ3NocmluaycpO1xuXHRcdH1cblx0XHRpZiAoc2xpZGUuZGF0YS5kbmQudHlwZSA9PT0gJ2xpbmUnKSB7XG5cdFx0XHQkKGRyYWdnYWJsZSkuZmFkZUluKCkucmVtb3ZlQ2xhc3MoJ3NocmluaycpO1xuXHRcdFx0cmVzZXRMZWFkZXJMaW5lcygpO1xuXHRcdH1cblx0fSk7XG5cdC8vIHdpcGUgY29udGFpbmVkIGRyYWdnYWJsZSBpbmZvXG5cdCRkcm9wcGFibGVzLmVhY2goZnVuY3Rpb24gKGlkeCwgZHJvcHBhYmxlKSB7XG5cdFx0ZG5kSW5mby5kcm9wcGFibGVEYXRhW2Ryb3BwYWJsZS5pZF0uY29udGFpbmVkRHJhZ2dhYmxlcyA9IFtdO1xuXHRcdGRuZEluZm8uZHJvcHBhYmxlRGF0YVtkcm9wcGFibGUuaWRdLmxhc3REcmFnZ2FibGVBY2NlcHRlZCA9IFtdO1xuXHR9KTtcblxuXHR2YXIgeyBkYXRhIH0gPSBzbGlkZTtcblx0aWYgKGNoZWNrTG9ja1N1Ym1pdElmVW5hdHRlbXB0ZWQoZGF0YSkpIGxvY2tCdXR0b25Ob3dVbmxvY2tPbkV4aXQoJCgnI3NpLXN1Ym1pdCwgI3NpLWN1c3RvbS1zdWJtaXQnKSwgZGF0YSk7XG5cdHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBkbmRGdW5jdGlvbigpIHtcblx0dmFyIHNsaWRlID0gZ2xvYmFsVmFyLnNsaWRlO1xuXHR2YXIgJGRyYWdnYWJsZXMgPSBzbGlkZS4kZG9tLmZpbmQoJy5kcmFnZ2FibGUnKTtcblx0dmFyICRkcm9wcGFibGVzID0gc2xpZGUuJGRvbS5maW5kKCcuZHJvcHBhYmxlJyk7XG5cblx0dmFyIHsgZGF0YSB9ID0gc2xpZGU7XG5cdGlmIChjaGVja0xvY2tTdWJtaXRJZlVuYXR0ZW1wdGVkKGRhdGEpKSBsb2NrQnV0dG9uTm93VW5sb2NrT25FeGl0KCQoJyNzaS1zdWJtaXQsICNzaS1jdXN0b20tc3VibWl0JyksIGRhdGEpO1xuXG5cdC8vIFRoZSByZWFzb24gd2Ugd2FpdCB1bnRpbCB0aGUgc2xpZGUgaXMgdmlzaXRlZCB0byBpbml0aWFsaXplIHRoZSBkbmQgaXMgYmVjYXVzZSB0aGUgcG9zaXRpb25pbmcgb2YgdGhlIGRyYWdnYWJsZXMgd2lsbCBiZSBpbmNvcnJlY3Qgd2hlbiB0aGUgcmV2ZWFsIHNsaWRlIGlzIGhpZGRlbi5cblx0aWYgKCFzbGlkZS5kYXRhLnZpc2l0ZWQpIHtcblx0XHR2YXIgc2xpZGUgPSBnbG9iYWxWYXIuc2xpZGU7XG5cdFx0YWRkVG9GdW5jdGlvbktleShzbGlkZS5kYXRhLCAnb25FeGl0QWN0aW9uJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0cmVzZXREbmQoc2xpZGUuaWQpO1xuXHRcdH0pO1xuXHRcdHZhciBkbmRJbmZvID0gc2xpZGUuZGF0YS5kbmQgPyBzbGlkZS5kYXRhLmRuZCA6IHt9O1xuXHRcdGRuZEluZm8uZHJhZ2dhYmxlRGF0YSA9IGRuZEluZm8uZHJhZ2dhYmxlRGF0YSA/IGRuZEluZm8uZHJhZ2dhYmxlRGF0YSA6IHt9O1xuXHRcdGRuZEluZm8uZHJvcHBhYmxlRGF0YSA9IGRuZEluZm8uZHJvcHBhYmxlRGF0YSA/IGRuZEluZm8uZHJvcHBhYmxlRGF0YSA6IHt9O1xuXG5cdFx0ZG5kSW5mby50eXBlID0gZG5kSW5mby50eXBlID8gZG5kSW5mby50eXBlIDogJ2RuZF8xJztcblx0XHRpZiAoZG5kSW5mby50eXBlID09PSAnbGluZScpIHtcblx0XHRcdHdpbmRvdy5sZWFkZXJsaW5lc1tzbGlkZS5pZF0gPSB7fTtcblxuXHRcdFx0YWRkVG9GdW5jdGlvbktleShzbGlkZS5kYXRhLCAnb25FeGl0QWN0aW9uJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRxdWlja1Jlc2V0TGVhZGVyTGluZXMoc2xpZGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGRuZEluZm8uc25hcHBpbmcgPSBkbmRJbmZvLnNuYXBwaW5nID8gZG5kSW5mby5zbmFwcGluZyA6IHRydWU7XG5cdFx0ZG5kSW5mby5hbGlnbm1lbnRPbkRyb3AgPSBkbmRJbmZvLmFsaWdubWVudE9uRHJvcCA/IGRuZEluZm8uYWxpZ25tZW50T25Ecm9wIDogJ3NuYXBwaW5nJztcblx0XHQvLyBGaXJzdCB0aW1lIHRvIHRoZSBzbGlkZSBzdG9yZSB0aGUgdG9wIGFuZCBsZWZ0IHBvc2l0aW9ucyBvZiB0aGUgZHJhZ2dhYmxlc1xuXHRcdCRkcmFnZ2FibGVzLmVhY2goZnVuY3Rpb24gKGlkeCwgZHJhZ2dhYmxlKSB7XG5cdFx0XHRkbmRJbmZvLmRyYWdnYWJsZURhdGFbZHJhZ2dhYmxlLmlkXSA9IGRuZEluZm8uZHJhZ2dhYmxlRGF0YVtkcmFnZ2FibGUuaWRdXG5cdFx0XHRcdD8gZG5kSW5mby5kcmFnZ2FibGVEYXRhW2RyYWdnYWJsZS5pZF1cblx0XHRcdFx0OiB7fTtcblx0XHRcdHZhciBpbml0aWFsVG9wID1cblx0XHRcdFx0KChwYXJzZUludCgkKGRyYWdnYWJsZSkuY3NzKCd0b3AnKSkgLyAkKGRyYWdnYWJsZSkucGFyZW50KCkuaGVpZ2h0KCkpICogMTAwKS50b1N0cmluZygpICsgJyUnO1xuXHRcdFx0dmFyIGluaXRpYWxMZWZ0ID1cblx0XHRcdFx0KChwYXJzZUludCgkKGRyYWdnYWJsZSkuY3NzKCdsZWZ0JykpIC8gJChkcmFnZ2FibGUpLnBhcmVudCgpLndpZHRoKCkpICogMTAwKS50b1N0cmluZygpICsgJyUnO1xuXG5cdFx0XHR2YXIgYWxpZ25tZW50ID0gZG5kSW5mby5kcmFnZ2FibGVEYXRhW2RyYWdnYWJsZS5pZF0uYWxpZ25tZW50T25Ecm9wXG5cdFx0XHRcdD8gZG5kSW5mby5kcmFnZ2FibGVEYXRhW2RyYWdnYWJsZS5pZF0uYWxpZ25tZW50T25Ecm9wXG5cdFx0XHRcdDogJyc7XG5cblx0XHRcdGlmIChkbmRJbmZvLnR5cGUgPT09ICdsaW5lJykge1xuXHRcdFx0XHR2YXIgY29ycmVzcG9uZGluZ0xlYWRlckxpbmVOYW1lID0gc2xpZGUuaWQgKyAnX2xlYWRlcmxpbmVfJyArIGRyYWdnYWJsZS5pZDtcblxuXHRcdFx0XHR2YXIgbGluZU5hbWUgPSBzbGlkZS5pZCArICdfbGVhZGVybGluZV8nICsgZHJhZ2dhYmxlLmlkO1xuXHRcdFx0XHR2YXIgc3RhcnRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoc2xpZGUuZGF0YS5kbmQubGVhZGVyTGluZVNldHVwW2RyYWdnYWJsZS5pZF0uc3RhcnRFbGVtZW50KTtcblx0XHRcdFx0dmFyIGVuZEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkcmFnZ2FibGUuaWQpO1xuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyhzdGFydEVsZW1lbnQsIGxpbmVOYW1lLCBlbmRFbGVtZW50KTtcblx0XHRcdFx0d2luZG93LmxlYWRlcmxpbmVzW3NsaWRlLmlkXVtsaW5lTmFtZV0gPSBuZXcgTGVhZGVyTGluZShzdGFydEVsZW1lbnQsIGVuZEVsZW1lbnQsIHtcblx0XHRcdFx0XHRzdGFydFBsdWc6IHNsaWRlLmRhdGEuZG5kLmxlYWRlckxpbmVTZXR1cC5zdGFydFBsdWcgfHwgJ2JlaGluZCcsXG5cdFx0XHRcdFx0c3RhcnRTb2NrZXQ6IHNsaWRlLmRhdGEuZG5kLmxlYWRlckxpbmVTZXR1cC5zdGFydFNvY2tldCB8fCAnYXV0bycsXG5cdFx0XHRcdFx0c3RhcnRQbHVnQ29sb3I6IHNsaWRlLmRhdGEuZG5kLmxlYWRlckxpbmVTZXR1cC5zdGFydFBsdWdDb2xvciB8fCAnYXV0bycsXG5cdFx0XHRcdFx0c3RhcnRQbHVnU2l6ZTogc2xpZGUuZGF0YS5kbmQubGVhZGVyTGluZVNldHVwLnN0YXJ0UGx1Z1NpemUgfHwgMSxcblx0XHRcdFx0XHRzdGFydFBsdWdPdXRsaW5lOiBzbGlkZS5kYXRhLmRuZC5sZWFkZXJMaW5lU2V0dXAuc3RhcnRQbHVnT3V0bGluZSB8fCBmYWxzZSxcblx0XHRcdFx0XHRzdGFydFBsdWdPdXRsaW5lQ29sb3I6IHNsaWRlLmRhdGEuZG5kLmxlYWRlckxpbmVTZXR1cC5zdGFydFBsdWdPdXRsaW5lQ29sb3IgfHwgJ2F1dG8nLFxuXHRcdFx0XHRcdHN0YXJ0UGx1Z091dGxpbmVTaXplOiBzbGlkZS5kYXRhLmRuZC5sZWFkZXJMaW5lU2V0dXAuc3RhcnRQbHVnT3V0bGluZVNpemUgfHwgMSxcblx0XHRcdFx0XHRlbmRQbHVnT3V0bGluZTogc2xpZGUuZGF0YS5kbmQubGVhZGVyTGluZVNldHVwLmVuZFBsdWdPdXRsaW5lIHx8IGZhbHNlLFxuXHRcdFx0XHRcdGVuZFBsdWdPdXRsaW5lQ29sb3I6IHNsaWRlLmRhdGEuZG5kLmxlYWRlckxpbmVTZXR1cC5lbmRQbHVnT3V0bGluZUNvbG9yIHx8ICdhdXRvJyxcblx0XHRcdFx0XHRlbmRQbHVnT3V0bGluZVNpemU6IHNsaWRlLmRhdGEuZG5kLmxlYWRlckxpbmVTZXR1cC5lbmRQbHVnT3V0bGluZVNpemUgfHwgMSxcblx0XHRcdFx0XHRlbmRQbHVnU2l6ZTogc2xpZGUuZGF0YS5kbmQubGVhZGVyTGluZVNldHVwLmVuZFBsdWdTaXplIHx8IDEsXG5cdFx0XHRcdFx0ZW5kUGx1Z0NvbG9yOiBzbGlkZS5kYXRhLmRuZC5sZWFkZXJMaW5lU2V0dXAuZW5kUGx1Z0NvbG9yIHx8ICdhdXRvJyxcblx0XHRcdFx0XHRlbmRTb2NrZXQ6IHNsaWRlLmRhdGEuZG5kLmxlYWRlckxpbmVTZXR1cC5lbmRTb2NrZXQgfHwgJ2F1dG8nLFxuXHRcdFx0XHRcdGVuZFBsdWc6ICdiZWhpbmQnLFxuXHRcdFx0XHRcdGhpZGU6ICd0cnVlJyxcblx0XHRcdFx0XHRjb2xvcjogc2xpZGUuZGF0YS5kbmQubGVhZGVyTGluZVNldHVwLmNvbG9yIHx8ICdibGFjaycsXG5cdFx0XHRcdFx0c2l6ZTogc2xpZGUuZGF0YS5kbmQubGVhZGVyTGluZVNldHVwLnNpemUgfHwgNCxcblx0XHRcdFx0XHRwYXRoOiBzbGlkZS5kYXRhLmRuZC5sZWFkZXJMaW5lU2V0dXAucGF0aCB8fCAnZmx1aWQnLFxuXHRcdFx0XHRcdGRhc2g6IHNsaWRlLmRhdGEuZG5kLmxlYWRlckxpbmVTZXR1cC5kYXNoIHx8IGZhbHNlXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHR3aW5kb3cubGVhZGVybGluZXNbc2xpZGUuaWRdW2xpbmVOYW1lXS5vcmlnaW5hbEVuZFBvaW50ID0gZW5kRWxlbWVudDtcblx0XHRcdH1cblx0XHRcdGRuZEluZm8uZHJhZ2dhYmxlRGF0YVtkcmFnZ2FibGUuaWRdID0ge1xuXHRcdFx0XHRvcmlnaW5hbFBvc2l0aW9uOiB7XG5cdFx0XHRcdFx0dG9wOiBpbml0aWFsVG9wLFxuXHRcdFx0XHRcdGxlZnQ6IGluaXRpYWxMZWZ0XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGN1cnJlbnRQb3NpdGlvbjoge1xuXHRcdFx0XHRcdHRvcDogaW5pdGlhbFRvcCxcblx0XHRcdFx0XHRsZWZ0OiBpbml0aWFsTGVmdFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRwcmV2aW91c1Bvc2l0aW9uOiB7XG5cdFx0XHRcdFx0dG9wOiBpbml0aWFsVG9wLFxuXHRcdFx0XHRcdGxlZnQ6IGluaXRpYWxMZWZ0XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGN1cnJlbnREcm9wSUQ6ICcnLFxuXHRcdFx0XHRhbGlnbm1lbnRPbkRyb3A6IGFsaWdubWVudCxcblx0XHRcdFx0Y29ycmVzcG9uZGluZ0xlYWRlckxpbmU6IGNvcnJlc3BvbmRpbmdMZWFkZXJMaW5lTmFtZVxuXHRcdFx0fTtcblxuXHRcdFx0Ly8gbWFrZXMgZG5kIGtleWJvYXJkIGFjY2Vzc2libGVcblx0XHRcdCQoZHJhZ2dhYmxlKS5hdHRyKCd0YWJpbmRleCcsICcwJyk7XG5cdFx0XHRrZXlCb2FyZEFjY2VzcyhkcmFnZ2FibGUpO1xuXHRcdH0pO1xuXG5cdFx0JGRyb3BwYWJsZXMuZWFjaChmdW5jdGlvbiAoaWR4LCBkcm9wcGFibGUpIHtcblx0XHRcdC8vIHNldCBkZWZhdWx0cyBmb3IgYW5zd2VyIGFuZCBkcm9wY291bnRlciBpZiB0aGV5IGFyZSBub3QgcHJvdmlkZWQsIGNyZWF0ZSBwbGFjZSB0byBzdG9yZSBkcmFnZ2FibGUgaW5mb1xuXHRcdFx0aWYgKGRuZEluZm8uZHJvcHBhYmxlRGF0YVtkcm9wcGFibGUuaWRdKSB7XG5cdFx0XHRcdHZhciBjdXJyZW50RHJvcHBhYmxlRGF0YSA9IGRuZEluZm8uZHJvcHBhYmxlRGF0YVtkcm9wcGFibGUuaWRdO1xuXHRcdFx0XHR2YXIgY29ycmVjdEFuc3dlcjtcblx0XHRcdFx0aWYgKGN1cnJlbnREcm9wcGFibGVEYXRhLmFuc3dlcnMgfHwgY3VycmVudERyb3BwYWJsZURhdGEuYW5zd2VycyA9PT0gMCkge1xuXHRcdFx0XHRcdGNvcnJlY3RBbnN3ZXIgPSBjdXJyZW50RHJvcHBhYmxlRGF0YS5hbnN3ZXJzO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNvcnJlY3RBbnN3ZXIgPSBbJCgkZHJhZ2dhYmxlc1tpZHhdKVswXS5pZF07XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIGRyb3BDb3VudCA9IGN1cnJlbnREcm9wcGFibGVEYXRhLmRyb3BDb3VudGVyID8gY3VycmVudERyb3BwYWJsZURhdGEuZHJvcENvdW50ZXIgOiAxO1xuXHRcdFx0XHR2YXIgc25hcFRvID0gY3VycmVudERyb3BwYWJsZURhdGEuc25hcFRvO1xuXHRcdFx0XHRkbmRJbmZvLmRyb3BwYWJsZURhdGFbZHJvcHBhYmxlLmlkXSA9IHtcblx0XHRcdFx0XHRhbnN3ZXJzOiBjb3JyZWN0QW5zd2VyLFxuXHRcdFx0XHRcdGNvbnRhaW5lZERyYWdnYWJsZXM6IFtdLFxuXHRcdFx0XHRcdGRyb3BDb3VudGVyOiBkcm9wQ291bnQsXG5cdFx0XHRcdFx0bGFzdERyYWdnYWJsZUFjY2VwdGVkOiBbXSxcblx0XHRcdFx0XHRzbmFwVG86IHNuYXBUb1xuXHRcdFx0XHR9O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZG5kSW5mby5kcm9wcGFibGVEYXRhW2Ryb3BwYWJsZS5pZF0gPSB7XG5cdFx0XHRcdFx0YW5zd2VyczogWyQoJGRyYWdnYWJsZXNbaWR4XSlbMF0uaWRdLFxuXHRcdFx0XHRcdGNvbnRhaW5lZERyYWdnYWJsZXM6IFtdLFxuXHRcdFx0XHRcdGRyb3BDb3VudGVyOiAxLFxuXHRcdFx0XHRcdGxhc3REcmFnZ2FibGVBY2NlcHRlZDogW11cblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gbmVjZXNzYXJ5IHRvIG1ha2UgZG5kIGtleWJvYXJkIGFjY2Vzc2libGVcblx0XHRcdCQoZHJvcHBhYmxlKS5hdHRyKCd0YWJpbmRleCcsICctMScpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gYmFzaWMgZHJhZ2dhYmxlIGluaXRpYWxpemVcblx0XHQkZHJhZ2dhYmxlcy5kcmFnZ2FibGUoe1xuXHRcdFx0ZHJhZzogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xuXHRcdFx0XHRkcmFnZ2FibGUgPSB1aS5oZWxwZXJbMF07XG5cdFx0XHRcdGN1cnJlbnREcmFnZ2FibGVEYXRhID0gZG5kSW5mby5kcmFnZ2FibGVEYXRhW2RyYWdnYWJsZS5pZF07XG5cdFx0XHRcdGlmIChzbGlkZS5kYXRhLmRuZC50eXBlID09PSAnbGluZScpIHtcblx0XHRcdFx0XHR3aW5kb3cubGVhZGVybGluZXNbc2xpZGUuaWRdW2N1cnJlbnREcmFnZ2FibGVEYXRhLmNvcnJlc3BvbmRpbmdMZWFkZXJMaW5lXS5wb3NpdGlvbigpLnNob3coKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHJldmVydDogZnVuY3Rpb24gKHZhbGlkQXJlYSkge1xuXHRcdFx0XHRpZiAoIXZhbGlkQXJlYSkge1xuXHRcdFx0XHRcdGlmIChzbGlkZS5kYXRhLmRuZC50eXBlID09PSAnbGluZScpIHtcblx0XHRcdFx0XHRcdHJlc2V0U3BlY2lmaWNMZWFkZXJMaW5lKGN1cnJlbnREcmFnZ2FibGVEYXRhLmNvcnJlc3BvbmRpbmdMZWFkZXJMaW5lKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0c3RhY2s6ICcuZHJhZ2dhYmxlJ1xuXHRcdH0pO1xuXHRcdC8vIGF0dGFjaCBjdXN0b20gZXZlbnRzIGFuZCBvcHRpb25zIGlmIHByb3ZpZGVkXG5cdFx0aWYgKGRuZEluZm8uZHJhZ2dhYmxlR3JvdXBzKSB7XG5cdFx0XHRmb3IgKGdyb3VwIGluIGRuZEluZm8uZHJhZ2dhYmxlR3JvdXBzKSB7XG5cdFx0XHRcdGlmIChkbmRJbmZvLmRyYWdnYWJsZUdyb3Vwc1tncm91cF0uZXZlbnRzKSB7XG5cdFx0XHRcdFx0Zm9yIChhY3Rpb24gaW4gZG5kSW5mby5kcmFnZ2FibGVHcm91cHNbZ3JvdXBdLmV2ZW50cykge1xuXHRcdFx0XHRcdFx0c2xpZGUuJGRvbS5maW5kKGdyb3VwKS5vbihhY3Rpb24sIGRuZEluZm8uZHJhZ2dhYmxlR3JvdXBzW2dyb3VwXS5ldmVudHNbYWN0aW9uXSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChkbmRJbmZvLmRyYWdnYWJsZUdyb3Vwc1tncm91cF0ub3B0aW9ucykge1xuXHRcdFx0XHRcdHNsaWRlLiRkb20uZmluZChncm91cCkuZHJhZ2dhYmxlKCdvcHRpb24nLCBkbmRJbmZvLmRyYWdnYWJsZUdyb3Vwc1tncm91cF0ub3B0aW9ucyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gYmFzaWMgZHJvcHBhYmxlIGluaXRpYWxpemVcblx0XHQkZHJvcHBhYmxlcy5kcm9wcGFibGUoe1xuXHRcdFx0ZHJvcDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xuXHRcdFx0XHRoYW5kbGVEcm9wKCQoZXZlbnQudGFyZ2V0KSwgJCh1aS5kcmFnZ2FibGUpKTtcblxuXHRcdFx0XHRpZiAoZ2xvYmFsVmFyLmxvY2tTdWJtaXRJZlVuYXR0ZW1wdGVkKSB7XG5cdFx0XHRcdFx0dW5sb2NrKCQoJyNzaS1zdWJtaXQnKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblx0XHQvLyBhdHRhY2ggY3VzdG9tIGV2ZW50cyBhbmQgb3B0aW9ucyBpZiBwcm92aWRlZFxuXHRcdGlmIChkbmRJbmZvLmRyb3BwYWJsZUdyb3Vwcykge1xuXHRcdFx0Zm9yIChncm91cCBpbiBkbmRJbmZvLmRyb3BwYWJsZUdyb3Vwcykge1xuXHRcdFx0XHRpZiAoZG5kSW5mby5kcm9wcGFibGVHcm91cHNbZ3JvdXBdLmV2ZW50cykge1xuXHRcdFx0XHRcdGZvciAoYWN0aW9uIGluIGRuZEluZm8uZHJvcHBhYmxlR3JvdXBzW2dyb3VwXS5ldmVudHMpIHtcblx0XHRcdFx0XHRcdHNsaWRlLiRkb20uZmluZChncm91cCkub24oYWN0aW9uLCBkbmRJbmZvLmRyb3BwYWJsZUdyb3Vwc1tncm91cF0uZXZlbnRzW2FjdGlvbl0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZG5kSW5mby5kcm9wcGFibGVHcm91cHNbZ3JvdXBdLm9wdGlvbnMpIHtcblx0XHRcdFx0XHRzbGlkZS4kZG9tLmZpbmQoZ3JvdXApLmRyb3BwYWJsZSgnb3B0aW9uJywgZG5kSW5mby5kcm9wcGFibGVHcm91cHNbZ3JvdXBdLm9wdGlvbnMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdC8vIG1vdmVkIHJlc2V0IGRuZCB0byBleGl0IGFjdGlvblxuXHQvLyBlbHNlIHtcblx0Ly8gXHRyZXNldERuZCgpO1xuXHQvLyB9XG5cblx0cmV0dXJuIHRydWU7XG59IC8vZW5kIGRuZEZ1bmN0aW9uXG5mdW5jdGlvbiBhbGlnbmVkUG9zaXRpb24oJGRyb3BwYWJsZSwgJGRyYWdnYWJsZSkge1xuXHR2YXIgc2xpZGUgPSBnbG9iYWxWYXIuc2xpZGU7XG5cdHZhciBkbmRJbmZvID0gc2xpZGUuZGF0YS5kbmQ7XG5cdHZhciBkcmFnRGF0YSA9IGRuZEluZm8uZHJhZ2dhYmxlRGF0YVskZHJhZ2dhYmxlWzBdLmlkXTtcblx0dmFyIG5ld1Bvc2l0aW9uID0ge1xuXHRcdHRvcDogMCxcblx0XHRsZWZ0OiAwXG5cdH07XG5cdHZhciBhbGlnbm1lbnQgPSBkcmFnRGF0YS5hbGlnbm1lbnRPbkRyb3AgPyBkcmFnRGF0YS5hbGlnbm1lbnRPbkRyb3AgOiBkbmRJbmZvLmFsaWdubWVudE9uRHJvcDtcblx0c3dpdGNoICh0eXBlb2YgYWxpZ25tZW50KSB7XG5cdFx0Y2FzZSAnc3RyaW5nJzpcblx0XHRcdHN3aXRjaCAoYWxpZ25tZW50KSB7XG5cdFx0XHRcdGNhc2UgJ3NuYXBwaW5nJzpcblx0XHRcdFx0XHRuZXdQb3NpdGlvbi50b3AgPVxuXHRcdFx0XHRcdFx0KChwYXJzZUludCgkZHJvcHBhYmxlLmNzcygndG9wJykpIC8gJGRyb3BwYWJsZS5wYXJlbnQoKS5oZWlnaHQoKSkgKiAxMDApLnRvU3RyaW5nKCkgKyAnJSc7XG5cdFx0XHRcdFx0bmV3UG9zaXRpb24ubGVmdCA9XG5cdFx0XHRcdFx0XHQoKHBhcnNlSW50KCRkcm9wcGFibGUuY3NzKCdsZWZ0JykpIC8gJGRyb3BwYWJsZS5wYXJlbnQoKS53aWR0aCgpKSAqIDEwMCkudG9TdHJpbmcoKSArICclJztcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnZml4ZWQnOlxuXHRcdFx0XHRcdG5ld1Bvc2l0aW9uLnRvcCA9XG5cdFx0XHRcdFx0XHQoKHBhcnNlSW50KCRkcmFnZ2FibGUuY3NzKCd0b3AnKSkgLyAkKCcucmV2ZWFsJykuaGVpZ2h0KCkpICogMTAwKS50b1N0cmluZygpICsgJyUnO1xuXHRcdFx0XHRcdG5ld1Bvc2l0aW9uLmxlZnQgPVxuXHRcdFx0XHRcdFx0KChwYXJzZUludCgkZHJhZ2dhYmxlLmNzcygnbGVmdCcpKSAvICQoJy5yZXZlYWwnKS53aWR0aCgpKSAqIDEwMCkudG9TdHJpbmcoKSArICclJztcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnY2VudGVyJzpcblx0XHRcdFx0XHRuZXdQb3NpdGlvbi50b3AgPVxuXHRcdFx0XHRcdFx0KFxuXHRcdFx0XHRcdFx0XHQoKHBhcnNlSW50KCRkcm9wcGFibGUuY3NzKCd0b3AnKSkgKyAkZHJvcHBhYmxlLmhlaWdodCgpIC8gMiAtICRkcmFnZ2FibGUuaGVpZ2h0KCkgLyAyKSAvXG5cdFx0XHRcdFx0XHRcdFx0JGRyb3BwYWJsZS5wYXJlbnQoKS5oZWlnaHQoKSkgKlxuXHRcdFx0XHRcdFx0XHQxMDBcblx0XHRcdFx0XHRcdCkudG9TdHJpbmcoKSArICclJztcblx0XHRcdFx0XHRuZXdQb3NpdGlvbi5sZWZ0ID1cblx0XHRcdFx0XHRcdChcblx0XHRcdFx0XHRcdFx0KChwYXJzZUludCgkZHJvcHBhYmxlLmNzcygnbGVmdCcpKSArICRkcm9wcGFibGUud2lkdGgoKSAvIDIgLSAkZHJhZ2dhYmxlLndpZHRoKCkgLyAyKSAvXG5cdFx0XHRcdFx0XHRcdFx0JGRyb3BwYWJsZS5wYXJlbnQoKS53aWR0aCgpKSAqXG5cdFx0XHRcdFx0XHRcdDEwMFxuXHRcdFx0XHRcdFx0KS50b1N0cmluZygpICsgJyUnO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdoLWNlbnRlcic6XG5cdFx0XHRcdFx0bmV3UG9zaXRpb24udG9wID1cblx0XHRcdFx0XHRcdCgocGFyc2VJbnQoJGRyb3BwYWJsZS5jc3MoJ3RvcCcpKSAvICRkcm9wcGFibGUucGFyZW50KCkuaGVpZ2h0KCkpICogMTAwKS50b1N0cmluZygpICsgJyUnO1xuXHRcdFx0XHRcdG5ld1Bvc2l0aW9uLmxlZnQgPVxuXHRcdFx0XHRcdFx0KFxuXHRcdFx0XHRcdFx0XHQoKHBhcnNlSW50KCRkcm9wcGFibGUuY3NzKCdsZWZ0JykpICsgJGRyb3BwYWJsZS53aWR0aCgpIC8gMiAtICRkcmFnZ2FibGUud2lkdGgoKSAvIDIpIC9cblx0XHRcdFx0XHRcdFx0XHQkZHJvcHBhYmxlLnBhcmVudCgpLndpZHRoKCkpICpcblx0XHRcdFx0XHRcdFx0MTAwXG5cdFx0XHRcdFx0XHQpLnRvU3RyaW5nKCkgKyAnJSc7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3YtY2VudGVyJzpcblx0XHRcdFx0XHRuZXdQb3NpdGlvbi50b3AgPVxuXHRcdFx0XHRcdFx0KFxuXHRcdFx0XHRcdFx0XHQoKHBhcnNlSW50KCRkcm9wcGFibGUuY3NzKCd0b3AnKSkgKyAkZHJvcHBhYmxlLmhlaWdodCgpIC8gMiAtICRkcmFnZ2FibGUuaGVpZ2h0KCkgLyAyKSAvXG5cdFx0XHRcdFx0XHRcdFx0JGRyb3BwYWJsZS5wYXJlbnQoKS5oZWlnaHQoKSkgKlxuXHRcdFx0XHRcdFx0XHQxMDBcblx0XHRcdFx0XHRcdCkudG9TdHJpbmcoKSArICclJztcblx0XHRcdFx0XHRuZXdQb3NpdGlvbi5sZWZ0ID1cblx0XHRcdFx0XHRcdCgocGFyc2VJbnQoJGRyb3BwYWJsZS5jc3MoJ2xlZnQnKSkgLyAkZHJvcHBhYmxlLnBhcmVudCgpLndpZHRoKCkpICogMTAwKS50b1N0cmluZygpICsgJyUnO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnb2JqZWN0Jzpcblx0XHRcdGlmIChBcnJheS5pc0FycmF5KGFsaWdubWVudCkpIHtcblx0XHRcdFx0aWYgKGFsaWdubWVudC5sZW5ndGggPT09IDIpIHtcblx0XHRcdFx0XHRzd2l0Y2ggKGFsaWdubWVudFswXSkge1xuXHRcdFx0XHRcdFx0Y2FzZSAndi1jZW50ZXInOlxuXHRcdFx0XHRcdFx0XHRuZXdQb3NpdGlvbi50b3AgPVxuXHRcdFx0XHRcdFx0XHRcdChcblx0XHRcdFx0XHRcdFx0XHRcdCgocGFyc2VJbnQoJGRyb3BwYWJsZS5jc3MoJ3RvcCcpKSArXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCRkcm9wcGFibGUuaGVpZ2h0KCkgLyAyIC1cblx0XHRcdFx0XHRcdFx0XHRcdFx0JGRyYWdnYWJsZS5oZWlnaHQoKSAvIDIpIC9cblx0XHRcdFx0XHRcdFx0XHRcdFx0JGRyb3BwYWJsZS5wYXJlbnQoKS5oZWlnaHQoKSkgKlxuXHRcdFx0XHRcdFx0XHRcdFx0MTAwXG5cdFx0XHRcdFx0XHRcdFx0KS50b1N0cmluZygpICsgJyUnO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdGNhc2UgJ3RvcCc6XG5cdFx0XHRcdFx0XHRcdG5ld1Bvc2l0aW9uLnRvcCA9XG5cdFx0XHRcdFx0XHRcdFx0KChwYXJzZUludCgkZHJvcHBhYmxlLmNzcygndG9wJykpIC8gJGRyb3BwYWJsZS5wYXJlbnQoKS5oZWlnaHQoKSkgKiAxMDApLnRvU3RyaW5nKCkgK1xuXHRcdFx0XHRcdFx0XHRcdCclJztcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRjYXNlICdtaWRkbGUnOlxuXHRcdFx0XHRcdFx0XHRuZXdQb3NpdGlvbi50b3AgPVxuXHRcdFx0XHRcdFx0XHRcdChcblx0XHRcdFx0XHRcdFx0XHRcdCgocGFyc2VJbnQoJGRyb3BwYWJsZS5jc3MoJ3RvcCcpKSArICRkcm9wcGFibGUuaGVpZ2h0KCkgLyAyKSAvXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCRkcm9wcGFibGUucGFyZW50KCkuaGVpZ2h0KCkpICpcblx0XHRcdFx0XHRcdFx0XHRcdDEwMFxuXHRcdFx0XHRcdFx0XHRcdCkudG9TdHJpbmcoKSArICclJztcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRjYXNlICdib3R0b20nOlxuXHRcdFx0XHRcdFx0XHRuZXdQb3NpdGlvbi50b3AgPVxuXHRcdFx0XHRcdFx0XHRcdChcblx0XHRcdFx0XHRcdFx0XHRcdCgocGFyc2VJbnQoJGRyb3BwYWJsZS5jc3MoJ3RvcCcpKSArICRkcm9wcGFibGUuaGVpZ2h0KCkgLSAkZHJhZ2dhYmxlLmhlaWdodCgpKSAvXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCRkcm9wcGFibGUucGFyZW50KCkuaGVpZ2h0KCkpICpcblx0XHRcdFx0XHRcdFx0XHRcdDEwMFxuXHRcdFx0XHRcdFx0XHRcdCkudG9TdHJpbmcoKSArICclJztcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRjYXNlICd1bmRlcic6XG5cdFx0XHRcdFx0XHRcdG5ld1Bvc2l0aW9uLnRvcCA9XG5cdFx0XHRcdFx0XHRcdFx0KFxuXHRcdFx0XHRcdFx0XHRcdFx0KChwYXJzZUludCgkZHJvcHBhYmxlLmNzcygndG9wJykpICsgJGRyb3BwYWJsZS5oZWlnaHQoKSkgL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQkZHJvcHBhYmxlLnBhcmVudCgpLmhlaWdodCgpKSAqXG5cdFx0XHRcdFx0XHRcdFx0XHQxMDBcblx0XHRcdFx0XHRcdFx0XHQpLnRvU3RyaW5nKCkgKyAnJSc7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0Y2FzZSAnb3Zlcic6XG5cdFx0XHRcdFx0XHRcdG5ld1Bvc2l0aW9uLnRvcCA9XG5cdFx0XHRcdFx0XHRcdFx0KFxuXHRcdFx0XHRcdFx0XHRcdFx0KChwYXJzZUludCgkZHJvcHBhYmxlLmNzcygndG9wJykpIC0gJGRyYWdnYWJsZS5oZWlnaHQoKSkgL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQkZHJvcHBhYmxlLnBhcmVudCgpLmhlaWdodCgpKSAqXG5cdFx0XHRcdFx0XHRcdFx0XHQxMDBcblx0XHRcdFx0XHRcdFx0XHQpLnRvU3RyaW5nKCkgKyAnJSc7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c3dpdGNoIChhbGlnbm1lbnRbMV0pIHtcblx0XHRcdFx0XHRcdGNhc2UgJ2gtY2VudGVyJzpcblx0XHRcdFx0XHRcdFx0bmV3UG9zaXRpb24ubGVmdCA9XG5cdFx0XHRcdFx0XHRcdFx0KFxuXHRcdFx0XHRcdFx0XHRcdFx0KChwYXJzZUludCgkZHJvcHBhYmxlLmNzcygnbGVmdCcpKSArXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCRkcm9wcGFibGUud2lkdGgoKSAvIDIgLVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQkZHJhZ2dhYmxlLndpZHRoKCkgLyAyKSAvXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCRkcm9wcGFibGUucGFyZW50KCkud2lkdGgoKSkgKlxuXHRcdFx0XHRcdFx0XHRcdFx0MTAwXG5cdFx0XHRcdFx0XHRcdFx0KS50b1N0cmluZygpICsgJyUnO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdGNhc2UgJ2xlZnQnOlxuXHRcdFx0XHRcdFx0XHRuZXdQb3NpdGlvbi5sZWZ0ID1cblx0XHRcdFx0XHRcdFx0XHQoKHBhcnNlSW50KCRkcm9wcGFibGUuY3NzKCdsZWZ0JykpIC8gJGRyb3BwYWJsZS5wYXJlbnQoKS53aWR0aCgpKSAqIDEwMCkudG9TdHJpbmcoKSArXG5cdFx0XHRcdFx0XHRcdFx0JyUnO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdGNhc2UgJ21pZGRsZSc6XG5cdFx0XHRcdFx0XHRcdG5ld1Bvc2l0aW9uLmxlZnQgPVxuXHRcdFx0XHRcdFx0XHRcdChcblx0XHRcdFx0XHRcdFx0XHRcdCgocGFyc2VJbnQoJGRyb3BwYWJsZS5jc3MoJ2xlZnQnKSkgKyAkZHJvcHBhYmxlLndpZHRoKCkgLyAyKSAvXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCRkcm9wcGFibGUucGFyZW50KCkud2lkdGgoKSkgKlxuXHRcdFx0XHRcdFx0XHRcdFx0MTAwXG5cdFx0XHRcdFx0XHRcdFx0KS50b1N0cmluZygpICsgJyUnO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdGNhc2UgJ3JpZ2h0Jzpcblx0XHRcdFx0XHRcdFx0bmV3UG9zaXRpb24ubGVmdCA9XG5cdFx0XHRcdFx0XHRcdFx0KFxuXHRcdFx0XHRcdFx0XHRcdFx0KChwYXJzZUludCgkZHJvcHBhYmxlLmNzcygnbGVmdCcpKSArICRkcm9wcGFibGUud2lkdGgoKSAtICRkcmFnZ2FibGUud2lkdGgoKSkgL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQkZHJvcHBhYmxlLnBhcmVudCgpLndpZHRoKCkpICpcblx0XHRcdFx0XHRcdFx0XHRcdDEwMFxuXHRcdFx0XHRcdFx0XHRcdCkudG9TdHJpbmcoKSArICclJztcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRjYXNlICdvdXRzaWRlLXJpZ2h0Jzpcblx0XHRcdFx0XHRcdFx0bmV3UG9zaXRpb24ubGVmdCA9XG5cdFx0XHRcdFx0XHRcdFx0KFxuXHRcdFx0XHRcdFx0XHRcdFx0KChwYXJzZUludCgkZHJvcHBhYmxlLmNzcygnbGVmdCcpKSArICRkcm9wcGFibGUud2lkdGgoKSkgL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQkZHJvcHBhYmxlLnBhcmVudCgpLndpZHRoKCkpICpcblx0XHRcdFx0XHRcdFx0XHRcdDEwMFxuXHRcdFx0XHRcdFx0XHRcdCkudG9TdHJpbmcoKSArICclJztcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRjYXNlICdvdXRzaWRlLWxlZnQnOlxuXHRcdFx0XHRcdFx0XHRuZXdQb3NpdGlvbi5sZWZ0ID1cblx0XHRcdFx0XHRcdFx0XHQoXG5cdFx0XHRcdFx0XHRcdFx0XHQoKHBhcnNlSW50KCRkcm9wcGFibGUuY3NzKCdsZWZ0JykpIC0gJGRyYWdnYWJsZS53aWR0aCgpKSAvXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCRkcm9wcGFibGUucGFyZW50KCkud2lkdGgoKSkgKlxuXHRcdFx0XHRcdFx0XHRcdFx0MTAwXG5cdFx0XHRcdFx0XHRcdFx0KS50b1N0cmluZygpICsgJyUnO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bmV3UG9zaXRpb24gPSBhbGlnbm1lbnQ7XG5cdFx0XHR9XG5cdFx0ZGVmYXVsdDpcblx0XHRcdGJyZWFrO1xuXHR9XG5cblx0cmV0dXJuIG5ld1Bvc2l0aW9uO1xufVxuLy9oYW5kbGUgZHJvcCBpbnRvIHZhbGlkIGRyb3AgYXJlYSBmb3IgYWxsIGRuZCB0eXBlcy8vL1xuZnVuY3Rpb24gaGFuZGxlRHJvcCgkZHJvcHBhYmxlLCAkZHJhZ2dhYmxlKSB7XG5cdHZhciBzbGlkZSA9IGdsb2JhbFZhci5zbGlkZTtcblx0dmFyIGRuZEluZm8gPSBzbGlkZS5kYXRhLmRuZDtcblx0dmFyIGN1cnJlbnREcm9wRGF0YSA9IGRuZEluZm8uZHJvcHBhYmxlRGF0YVskZHJvcHBhYmxlWzBdLmlkXTtcblx0dmFyIGN1cnJlbnREcmFnRGF0YSA9IGRuZEluZm8uZHJhZ2dhYmxlRGF0YVskZHJhZ2dhYmxlWzBdLmlkXTtcblxuXHQvLyBkZXRlcm1pbmUgaWYgYSBkcm9wIGFyZWEgY2FuIGFjY2VwdCBtb3JlIGRyYWdnYWJsZXNcblx0Ly8gdmFyIHNwYWNlQXZhaWxhYmxlID0gT2JqZWN0LmtleXMoY3VycmVudERyb3BEYXRhLmNvbnRhaW5lZERyYWdnYWJsZXMpLmxlbmd0aCA8IGN1cnJlbnREcm9wRGF0YS5kcm9wQ291bnRlcjtcblx0dmFyIHNwYWNlQXZhaWxhYmxlID0gY3VycmVudERyb3BEYXRhLmNvbnRhaW5lZERyYWdnYWJsZXMubGVuZ3RoIDwgY3VycmVudERyb3BEYXRhLmRyb3BDb3VudGVyO1xuXG5cdGlmIChzcGFjZUF2YWlsYWJsZSkge1xuXHRcdC8vIHJlbW92ZSBkcmFnZ2FibGUgaW5mbyBmcm9tIHByZXZpb3VzIGRyb3AgYXJlYSBpZiBtb3ZpbmcgYmV0d2VlbiBkcm9wcGFibGVzXG5cdFx0aWYgKGN1cnJlbnREcmFnRGF0YS5jdXJyZW50RHJvcElEKSB7XG5cdFx0XHR2YXIgcHJldmlvdXNEcm9wRGF0YSA9IGRuZEluZm8uZHJvcHBhYmxlRGF0YVtjdXJyZW50RHJhZ0RhdGEuY3VycmVudERyb3BJRF07XG5cdFx0XHRpZiAocHJldmlvdXNEcm9wRGF0YS5jb250YWluZWREcmFnZ2FibGVzLmluZGV4T2YoJGRyYWdnYWJsZVswXS5pZCkgPiAtMSkge1xuXHRcdFx0XHRwcmV2aW91c0Ryb3BEYXRhLmNvbnRhaW5lZERyYWdnYWJsZXMuc3BsaWNlKFxuXHRcdFx0XHRcdHByZXZpb3VzRHJvcERhdGEuY29udGFpbmVkRHJhZ2dhYmxlcy5pbmRleE9mKCRkcmFnZ2FibGVbMF0uaWQpLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdGlmIChwcmV2aW91c0Ryb3BEYXRhLmxhc3REcmFnZ2FibGVBY2NlcHRlZC5pbmRleE9mKCRkcmFnZ2FibGVbMF0uaWQpID4gLTEpIHtcblx0XHRcdFx0cHJldmlvdXNEcm9wRGF0YS5sYXN0RHJhZ2dhYmxlQWNjZXB0ZWQuc3BsaWNlKFxuXHRcdFx0XHRcdHByZXZpb3VzRHJvcERhdGEubGFzdERyYWdnYWJsZUFjY2VwdGVkLmluZGV4T2YoJGRyYWdnYWJsZVswXS5pZCksXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBhZGQgZHJhZ2dhYmxlIGlkIHRvIHRoZSBkcm9wIGRhdGFcblx0XHRjdXJyZW50RHJvcERhdGEuY29udGFpbmVkRHJhZ2dhYmxlcy5wdXNoKCRkcmFnZ2FibGVbMF0uaWQpO1xuXHRcdGN1cnJlbnREcm9wRGF0YS5sYXN0RHJhZ2dhYmxlQWNjZXB0ZWQucHVzaCgkZHJhZ2dhYmxlWzBdLmlkKTtcblx0XHQvLyB1cGRhdGUgZHJhZ2dhYmxlIGRhdGFcblx0XHRjdXJyZW50RHJhZ0RhdGEuY3VycmVudERyb3BJRCA9ICRkcm9wcGFibGVbMF0uaWQ7XG5cdFx0Y3VycmVudERyYWdEYXRhLnByZXZpb3VzUG9zaXRpb24gPSBjdXJyZW50RHJhZ0RhdGEuY3VycmVudFBvc2l0aW9uO1xuXHRcdGN1cnJlbnREcmFnRGF0YS5jdXJyZW50UG9zaXRpb24gPSBhbGlnbmVkUG9zaXRpb24oJGRyb3BwYWJsZSwgJGRyYWdnYWJsZSk7XG5cdFx0Ly8gaGFuZGxlIG1vdmVtZW50IGJhc2VkIG9uIGRuZCB0eXBlXG5cdFx0aWYgKGRuZEluZm8udHlwZSA9PT0gJ2RuZF8yJykge1xuXHRcdFx0JGRyYWdnYWJsZS5hZGRDbGFzcygnc2hyaW5rJyk7XG5cdFx0fSBlbHNlIGlmIChkbmRJbmZvLnR5cGUgPT09ICdsaW5lJykge1xuXHRcdFx0JGRyYWdnYWJsZS5hZGRDbGFzcygnc2hyaW5rJyk7XG5cblx0XHRcdHdpbmRvdy5sZWFkZXJsaW5lc1tzbGlkZS5pZF1bY3VycmVudERyYWdEYXRhLmNvcnJlc3BvbmRpbmdMZWFkZXJMaW5lXS5zZXRPcHRpb25zKHtcblx0XHRcdFx0ZW5kUGx1ZzogZG5kSW5mby5sZWFkZXJMaW5lU2V0dXAuZW5kUGx1Zyxcblx0XHRcdFx0ZW5kOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjdXJyZW50RHJvcERhdGEuc25hcFRvIHx8ICRkcm9wcGFibGVbMF0uaWQpXG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JGRyYWdnYWJsZS5hbmltYXRlKGN1cnJlbnREcmFnRGF0YS5jdXJyZW50UG9zaXRpb24sIDUwMCk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdC8vIHJldmVydCBkcmFnZ2FibGUgaWYgZG5kMlxuXHRcdGlmIChkbmRJbmZvLnR5cGUgPT09ICdkbmRfMicpIHtcblx0XHRcdCRkcmFnZ2FibGUuYW5pbWF0ZShjdXJyZW50RHJhZ0RhdGEucHJldmlvdXNQb3NpdGlvbiwgNTAwKTtcblx0XHR9IGVsc2UgaWYgKGRuZEluZm8udHlwZSA9PT0gJ2xpbmUnKSB7XG5cdFx0XHQkZHJhZ2dhYmxlLmFuaW1hdGUoY3VycmVudERyYWdEYXRhLnByZXZpb3VzUG9zaXRpb24sIDUwMCk7XG5cdFx0XHRyZXNldFNwZWNpZmljTGVhZGVyTGluZShjdXJyZW50RHJhZ0RhdGEuY29ycmVzcG9uZGluZ0xlYWRlckxpbmUpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBoYW5kbGUgc3dhcHBpbmcgZWxlbWVudHMgaWYgZG5kMS4gc3dhcHMgbGFzdCBkcmFnZ2FibGUgZHJvcHBlZCB3aXRoIHRoZSBjdXJyZW50IGRyb3Bcblx0XHRcdHZhciBsYXN0RHJhZ2dhYmxlID0gY3VycmVudERyb3BEYXRhLmxhc3REcmFnZ2FibGVBY2NlcHRlZC5wb3AoKTtcblx0XHRcdHZhciBwcmV2aW91c0RyYWdEYXRhID0gZG5kSW5mby5kcmFnZ2FibGVEYXRhW2xhc3REcmFnZ2FibGVdO1xuXG5cdFx0XHQvLyBzd2FwIGRyb3BwYWJsZSBpbmZvcm1hdGlvbiBpZiBtb3ZpbmcgZnJvbSBvbmUgZHJvcHBhYmxlIHRvIGFub3RoZXJcblx0XHRcdGlmIChjdXJyZW50RHJhZ0RhdGEuY3VycmVudERyb3BJRCkge1xuXHRcdFx0XHR2YXIgcHJldmlvdXNEcm9wRGF0YSA9IGRuZEluZm8uZHJvcHBhYmxlRGF0YVtjdXJyZW50RHJhZ0RhdGEuY3VycmVudERyb3BJRF07XG5cdFx0XHRcdHByZXZpb3VzRHJvcERhdGEuY29udGFpbmVkRHJhZ2dhYmxlcy5wdXNoKGxhc3REcmFnZ2FibGUpO1xuXHRcdFx0XHRpZiAocHJldmlvdXNEcm9wRGF0YS5jb250YWluZWREcmFnZ2FibGVzLmluZGV4T2YoJGRyYWdnYWJsZVswXS5pZCkgPiAtMSkge1xuXHRcdFx0XHRcdHByZXZpb3VzRHJvcERhdGEuY29udGFpbmVkRHJhZ2dhYmxlcy5zcGxpY2UoXG5cdFx0XHRcdFx0XHRwcmV2aW91c0Ryb3BEYXRhLmNvbnRhaW5lZERyYWdnYWJsZXMuaW5kZXhPZigkZHJhZ2dhYmxlWzBdLmlkKSxcblx0XHRcdFx0XHRcdDFcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChwcmV2aW91c0Ryb3BEYXRhLmxhc3REcmFnZ2FibGVBY2NlcHRlZC5pbmRleE9mKCRkcmFnZ2FibGVbMF0uaWQpID4gLTEpIHtcblx0XHRcdFx0XHRwcmV2aW91c0Ryb3BEYXRhLmxhc3REcmFnZ2FibGVBY2NlcHRlZC5zcGxpY2UoXG5cdFx0XHRcdFx0XHRwcmV2aW91c0Ryb3BEYXRhLmxhc3REcmFnZ2FibGVBY2NlcHRlZC5pbmRleE9mKCRkcmFnZ2FibGVbMF0uaWQpLFxuXHRcdFx0XHRcdFx0MVxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cHJldmlvdXNEcm9wRGF0YS5sYXN0RHJhZ2dhYmxlQWNjZXB0ZWQucHVzaChsYXN0RHJhZ2dhYmxlKTtcblx0XHRcdFx0cHJldmlvdXNEcmFnRGF0YS5jdXJyZW50RHJvcElEID0gY3VycmVudERyYWdEYXRhLmN1cnJlbnREcm9wSUQ7XG5cdFx0XHRcdHByZXZpb3VzRHJhZ0RhdGEucHJldmlvdXNQb3NpdGlvbiA9IHByZXZpb3VzRHJhZ0RhdGEuY3VycmVudFBvc2l0aW9uO1xuXHRcdFx0XHRwcmV2aW91c0RyYWdEYXRhLmN1cnJlbnRQb3NpdGlvbiA9IGFsaWduZWRQb3NpdGlvbihcblx0XHRcdFx0XHQkKCcjJyArIGN1cnJlbnREcmFnRGF0YS5jdXJyZW50RHJvcElEKSxcblx0XHRcdFx0XHQkKCcjJyArIGxhc3REcmFnZ2FibGUpXG5cdFx0XHRcdCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwcmV2aW91c0RyYWdEYXRhLnByZXZpb3VzUG9zaXRpb24gPSBwcmV2aW91c0RyYWdEYXRhLmN1cnJlbnRQb3NpdGlvbjtcblx0XHRcdFx0cHJldmlvdXNEcmFnRGF0YS5jdXJyZW50UG9zaXRpb24gPSBjdXJyZW50RHJhZ0RhdGEuY3VycmVudFBvc2l0aW9uO1xuXHRcdFx0fVxuXHRcdFx0Ly8gYWRkIGRyYWdnYWJsZSBkYXRhIHRvIGRyb3BwYWJsZSBhbmQgcmVtb3ZlIHRoZSBkYXRhIG9mIHRoZSBkcmFnZ2FibGUgYmVpbmcgc3dhcHBlZFxuXHRcdFx0Y3VycmVudERyb3BEYXRhLmNvbnRhaW5lZERyYWdnYWJsZXMucHVzaCgkZHJhZ2dhYmxlWzBdLmlkKTtcblx0XHRcdGlmIChjdXJyZW50RHJvcERhdGEuY29udGFpbmVkRHJhZ2dhYmxlcy5pbmRleE9mKGxhc3REcmFnZ2FibGUpID4gLTEpIHtcblx0XHRcdFx0Y3VycmVudERyb3BEYXRhLmNvbnRhaW5lZERyYWdnYWJsZXMuc3BsaWNlKFxuXHRcdFx0XHRcdGN1cnJlbnREcm9wRGF0YS5jb250YWluZWREcmFnZ2FibGVzLmluZGV4T2YobGFzdERyYWdnYWJsZSksXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0Y3VycmVudERyb3BEYXRhLmxhc3REcmFnZ2FibGVBY2NlcHRlZC5wdXNoKCRkcmFnZ2FibGVbMF0uaWQpO1xuXHRcdFx0Ly8gdXBkYXRlIG5ldyBhbmQgb2xkIGRyYWdnYWJsZSBkcm9wSURcblx0XHRcdHByZXZpb3VzRHJhZ0RhdGEuY3VycmVudERyb3BJRCA9IGN1cnJlbnREcmFnRGF0YS5jdXJyZW50RHJvcElEO1xuXHRcdFx0Y3VycmVudERyYWdEYXRhLmN1cnJlbnREcm9wSUQgPSAkZHJvcHBhYmxlWzBdLmlkO1xuXG5cdFx0XHQvLyBzd2FwIHBvc2l0aW9ucy4gVGhlIGRyYWdnYWJsZSBiZWluZyByZW1vdmVkIHdpbGwgbW92ZSB0byB0aGUgY3VycmVudCBwb3NpdGlvbiB0aGUgbmV3IGRyYWdnYWJsZSB3YXMgbW92ZWQgZnJvbSBhbmQgdGhlIG5ldyBkcmFnZ2FibGUgd2lsbCBub3cgYmUgaW4gdGhlIGRyb3AgYXJlYVxuXG5cdFx0XHRjdXJyZW50RHJhZ0RhdGEucHJldmlvdXNQb3NpdGlvbiA9IGN1cnJlbnREcmFnRGF0YS5jdXJyZW50UG9zaXRpb247XG5cdFx0XHRjdXJyZW50RHJhZ0RhdGEuY3VycmVudFBvc2l0aW9uID0gYWxpZ25lZFBvc2l0aW9uKCRkcm9wcGFibGUsICRkcmFnZ2FibGUpO1xuXHRcdFx0Ly8gbW92ZSBib3RoIGRyYWdnYWJsZXNcblx0XHRcdCRkcmFnZ2FibGUuYW5pbWF0ZShjdXJyZW50RHJhZ0RhdGEuY3VycmVudFBvc2l0aW9uLCA1MDApO1xuXHRcdFx0JCgnIycgKyBsYXN0RHJhZ2dhYmxlKS5hbmltYXRlKHByZXZpb3VzRHJhZ0RhdGEuY3VycmVudFBvc2l0aW9uLCA1MDApO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0cnVlO1xufSAvL2VuZCBoYW5kbGVEcm9wXG5cbmZ1bmN0aW9uIGNoZWNrRG5kKCkge1xuXHR2YXIgc2xpZGUgPSBnbG9iYWxWYXIuc2xpZGU7XG5cdHZhciAkZHJvcHBhYmxlcyA9IHNsaWRlLiRkb20uZmluZCgnLmRyb3BwYWJsZScpO1xuXHR2YXIgaXNDb3JyZWN0ID0gdHJ1ZTtcblx0JGRyb3BwYWJsZXMuZWFjaChmdW5jdGlvbiAoaWR4LCBkcm9wcGFibGUpIHtcblx0XHR2YXIgY3VycmVudERyb3BwYWJsZURhdGEgPSBzbGlkZS5kYXRhLmRuZC5kcm9wcGFibGVEYXRhW2Ryb3BwYWJsZS5pZF07XG5cdFx0dmFyIHN1Ym1pdHRlZEFuc3dlciA9IGN1cnJlbnREcm9wcGFibGVEYXRhLmNvbnRhaW5lZERyYWdnYWJsZXM7XG5cdFx0dmFyIGNvcnJlY3RBbnN3ZXJzID0gY3VycmVudERyb3BwYWJsZURhdGEuYW5zd2VycztcblxuXHRcdGlmICghaXNDb3JyZWN0KSB7XG5cdFx0XHRyZXR1cm4gaXNDb3JyZWN0O1xuXHRcdH1cblx0XHRzd2l0Y2ggKHR5cGVvZiBjb3JyZWN0QW5zd2Vycykge1xuXHRcdFx0Y2FzZSAnc3RyaW5nJzpcblx0XHRcdFx0c3dpdGNoIChjb3JyZWN0QW5zd2Vycykge1xuXHRcdFx0XHRcdGNhc2UgJ2VtcHR5Jzpcblx0XHRcdFx0XHRcdGlmIChzdWJtaXR0ZWRBbnN3ZXIubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdFx0XHRpc0NvcnJlY3QgPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnYW55Jzpcblx0XHRcdFx0XHRcdGlmIChzdWJtaXR0ZWRBbnN3ZXIubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0XHRcdGlzQ29ycmVjdCA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdudW1iZXInOlxuXHRcdFx0XHRpZiAoc3VibWl0dGVkQW5zd2VyLmxlbmd0aCAhPT0gY29ycmVjdEFuc3dlcnMpIHtcblx0XHRcdFx0XHRpc0NvcnJlY3QgPSBmYWxzZTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2Jvb2xlYW4nOlxuXHRcdFx0XHRpc0NvcnJlY3QgPSBjb3JyZWN0QW5zd2Vycztcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Y2FzZSAnb2JqZWN0Jzpcblx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoY29ycmVjdEFuc3dlcnMpKSB7XG5cdFx0XHRcdFx0aWYgKGNvcnJlY3RBbnN3ZXJzLmxlbmd0aCAhPT0gc3VibWl0dGVkQW5zd2VyLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0aXNDb3JyZWN0ID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHZhciBzb3J0ZWRDb3JyZWN0QW5zd2VyID0gY29ycmVjdEFuc3dlcnMuc29ydCgpO1xuXHRcdFx0XHRcdHZhciBzb3J0ZWRTdWJtaXR0ZWRBbnN3ZXIgPSBzdWJtaXR0ZWRBbnN3ZXIuc29ydCgpO1xuXHRcdFx0XHRcdGlzQ29ycmVjdCA9IHNvcnRlZENvcnJlY3RBbnN3ZXIuZXZlcnkoZnVuY3Rpb24gKGFuc3dlciwgaWR4KSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gc29ydGVkU3VibWl0dGVkQW5zd2VyW2lkeF0gPT09IGFuc3dlcjtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZXR1cm4gaXNDb3JyZWN0O1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGZvciAoYW5zd2VyS2V5IGluIGNvcnJlY3RBbnN3ZXJzKSB7XG5cdFx0XHRcdFx0XHR2YXIgc29ydGVkQW5zd2VyQXJyYXkgPSBjb3JyZWN0QW5zd2Vyc1thbnN3ZXJLZXldLnNvcnQoKTtcblx0XHRcdFx0XHRcdHZhciBzb3J0ZWRTdWJtaXR0ZWRBcnJheSA9IHN1Ym1pdHRlZEFuc3dlci5zb3J0KCk7XG5cdFx0XHRcdFx0XHRpZiAoc29ydGVkQW5zd2VyQXJyYXkubGVuZ3RoICE9PSBzb3J0ZWRTdWJtaXR0ZWRBcnJheS5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdFx0aXNDb3JyZWN0ID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpc0NvcnJlY3QgPSBzb3J0ZWRBbnN3ZXJBcnJheS5ldmVyeShmdW5jdGlvbiAoYW5zd2VyLCBpZHgpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHNvcnRlZFN1Ym1pdHRlZEFycmF5W2lkeF0gPT09IGFuc3dlcjtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0aWYgKGlzQ29ycmVjdCkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cdH0pO1xuXG5cdHJldHVybiBpc0NvcnJlY3Q7XG59IC8vZW5kIGNoZWNrRG5kXG5mdW5jdGlvbiBrZXlCb2FyZEFjY2VzcyhkcmFnRWxlbWVudCkge1xuXHR2YXIgc2xpZGUgPSBnbG9iYWxWYXIuc2xpZGU7XG5cdHZhciBhY2Nlc3NpYmlsaXR5ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0dmFyIGRyb3BzID0gc2xpZGUuJGRvbS5maW5kKCcuZHJvcHBhYmxlJyk7XG5cdFx0dmFyIGRyb3BJZHggPSAwO1xuXHRcdHZhciAkZHJhZyA9ICQodGhpcyk7XG5cdFx0aWYgKGV2ZW50LndoaWNoID09PSAzMikge1xuXHRcdFx0Ly9zcGFjZWJhciBzZWxlY3RzIGRyYWcgZWxlbWVudFxuXG5cdFx0XHQkKGRyb3BzW2Ryb3BJZHhdKS5mb2N1cygpOyAvL2ZvY3VzZXMgb24gZmlyc3QgZHJvcCBhcmVhXG5cdFx0XHQkZHJhZy5vZmYoJ2tleWRvd24uYWNjZXNzJyk7IC8vcmVtb3ZlcyBzcGFjZWJhciBzZWxlY3RvclxuXHRcdFx0ZHJhZ2dpbmcoJGRyYWdbMF0pOyAvL3Rha2VzIGNhcmUgb2YgZHJhZyBldmVudHNcblxuXHRcdFx0JCgnYm9keScpLm9uKCdrZXlkb3duLmRyYWcnLCBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHRcdFx0c3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG5cdFx0XHRcdFx0Y2FzZSA5OiAvL3JlbW92ZXMgYWJpbGl0eSB0byB0YWIgd2hpbGUgZHJhZyBlbGVtZW50IGlzIHNlbGVjdGVkXG5cdFx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAyNzogLy8gYWxsb3dzIHVzZXIgdG8gcHJlc3MgZXNjYXBlIGtleSB0byByZXR1cm4gdG8gbm9ybWFsIGFuZCBwbGFjZXMgZm9jdXMgb24gZHJhZyBlbGVtZW50XG5cdFx0XHRcdFx0XHQkZHJhZy5hbmltYXRlKFxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0dG9wOiAkZHJhZy5kYXRhKCdvcmlnaW5hbFRvcCcpLFxuXHRcdFx0XHRcdFx0XHRcdGxlZnQ6ICRkcmFnLmRhdGEoJ29yaWdpbmFsTGVmdCcpXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdHJldmVydFRpbWVcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHQkZHJhZy5mb2N1cygpO1xuXG5cdFx0XHRcdFx0XHQkZHJhZy5vbigna2V5ZG93bi5hY2Nlc3MnLCBhY2Nlc3NpYmlsaXR5KTtcblx0XHRcdFx0XHRcdCQoJ2JvZHknKS5vZmYoJ2tleWRvd24uZHJhZycpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAzODogLy91cCBhcnJvdyBjeWNsZXMgdGhyb3VnaCBkcm9wIHRhcmdldHNcblx0XHRcdFx0XHRcdGlmIChkcm9wSWR4IDwgZHJvcHMubGVuZ3RoIC0gMSkge1xuXHRcdFx0XHRcdFx0XHRkcm9wSWR4ICs9IDE7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRkcm9wSWR4ID0gMDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdCQoZHJvcHNbZHJvcElkeF0pLmZvY3VzKCk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlIDQwOiAvL2Rvd24gYXJyb3cgY3ljbGVzIHRocm91Z2ggZHJvcCB0YXJnZXRzXG5cdFx0XHRcdFx0XHRpZiAoZHJvcElkeCA+IDApIHtcblx0XHRcdFx0XHRcdFx0ZHJvcElkeCAtPSAxO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0ZHJvcElkeCA9IGRyb3BzLmxlbmd0aCAtIDE7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQkKGRyb3BzW2Ryb3BJZHhdKS5mb2N1cygpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAxMzogLy9lbnRlciBrZXkgZHJvcHMgc2VsZWN0ZWQgZHJhZyBlbGVtZW50IGludG8gY3VycmVudGx5IGZvY3VzZWQgZHJvcCBhcmVhXG5cdFx0XHRcdFx0XHRkcm9wcGVkKGRyb3BzW2Ryb3BJZHhdLCAkZHJhZ1swXSk7XG5cdFx0XHRcdFx0XHRpZiAoc2xpZGUuZGF0YS5kbmQudHlwZSA9PT0gJ2RuZF8yJykge1xuXHRcdFx0XHRcdFx0XHQkZHJhZy5ibHVyKCk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQkZHJhZy5mb2N1cygpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0JGRyYWcub24oJ2tleWRvd24uYWNjZXNzJywgYWNjZXNzaWJpbGl0eSk7XG5cdFx0XHRcdFx0XHQkKCdib2R5Jykub2ZmKCdrZXlkb3duLmRyYWcnKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xuXHQkKGRyYWdFbGVtZW50KS5vbigna2V5ZG93bi5hY2Nlc3MnLCBhY2Nlc3NpYmlsaXR5KTtcbn1cblxuZnVuY3Rpb24gcmVzZXRMZWFkZXJMaW5lcyhzbGlkZSkge1xuXHR2YXIgc2xpZGUgPSBnbG9iYWxWYXIuc2xpZGU7XG5cdC8vIGNvbnNvbGUubG9nKCdyZXNldCcpO1xuXHRmb3IgKHZhciBsaW5lTmFtZUtleSBpbiBsZWFkZXJsaW5lc1tzbGlkZS5pZF0pIHtcblx0XHRsZWFkZXJsaW5lc1tzbGlkZS5pZF1bbGluZU5hbWVLZXldLmhpZGUoJ2RyYXcnKTtcblx0fVxuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRmb3IgKHZhciBsaW5lTmFtZUtleTIgaW4gbGVhZGVybGluZXNbc2xpZGUuaWRdKSB7XG5cdFx0XHRsZWFkZXJsaW5lc1tzbGlkZS5pZF1bbGluZU5hbWVLZXkyXS5zZXRPcHRpb25zKHtcblx0XHRcdFx0ZW5kOiBsZWFkZXJsaW5lc1tzbGlkZS5pZF1bbGluZU5hbWVLZXkyXS5vcmlnaW5hbEVuZFBvaW50LFxuXHRcdFx0XHRlbmRQbHVnOiAnYmVoaW5kJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LCA1MDApO1xufVxuZnVuY3Rpb24gcXVpY2tSZXNldExlYWRlckxpbmVzKHNsaWRlKSB7XG5cdC8vIGNvbnNvbGUubG9nKCdxdWljayByZXNldCcpO1xuXHRmb3IgKHZhciBsaW5lTmFtZUtleSBpbiBsZWFkZXJsaW5lc1tzbGlkZV0pIHtcblx0XHRsZWFkZXJsaW5lc1tzbGlkZV1bbGluZU5hbWVLZXldLmhpZGUoJ25vbmUnKTtcblx0fVxuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRmb3IgKHZhciBsaW5lTmFtZUtleTIgaW4gbGVhZGVybGluZXNbc2xpZGVdKSB7XG5cdFx0XHRsZWFkZXJsaW5lc1tzbGlkZV1bbGluZU5hbWVLZXkyXS5zZXRPcHRpb25zKHtcblx0XHRcdFx0ZW5kOiBsZWFkZXJsaW5lc1tzbGlkZV1bbGluZU5hbWVLZXkyXS5vcmlnaW5hbEVuZFBvaW50LFxuXHRcdFx0XHRlbmRQbHVnOiAnYmVoaW5kJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LCA1MDApO1xufVxuZnVuY3Rpb24gcmVzZXRTcGVjaWZpY0xlYWRlckxpbmUobGluZSkge1xuXHR2YXIgc2xpZGUgPSBnbG9iYWxWYXIuc2xpZGU7XG5cdC8vIGNvbnNvbGUubG9nKGlkKTtcblx0Ly8gbGVhZGVybGluZXNbc2xpZGUuaWRdW2lkXS5oaWRlKCdkcmF3Jyk7XG5cdGxlYWRlcmxpbmVzW3NsaWRlLmlkXVtsaW5lXS5oaWRlKCdkcmF3Jyk7XG5cblx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0bGVhZGVybGluZXNbc2xpZGUuaWRdW2xpbmVdLnNldE9wdGlvbnMoe1xuXHRcdFx0ZW5kOiBsZWFkZXJsaW5lc1tzbGlkZS5pZF1bbGluZV0ub3JpZ2luYWxFbmRQb2ludCxcblx0XHRcdGVuZFBsdWc6ICdiZWhpbmQnXG5cdFx0fSk7XG5cdH0sIDUwMCk7XG59XG5cbmZ1bmN0aW9uIERORE9sZEZyYW1ld29ya0FkYXB0ZXIoKSB7XG5cdGZvciAodmFyIHNsaWRlIGluIHNsaWRlcykge1xuXHRcdC8vIGNvbnNvbGUubG9nKHNsaWRlc1tzbGlkZV0udHlwZSk7XG5cdFx0aWYgKHNsaWRlc1tzbGlkZV0udHlwZSA9PT0gJ2RuZCcpIHtcblx0XHRcdGlmIChzbGlkZXNbc2xpZGVdLmRuZC5xdWl6ID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0c2xpZGVzW3NsaWRlXS5kbmQucXVpeiA9IFtdO1xuXHRcdFx0XHRmb3IgKHZhciBkcm9wVGFyZ2V0IGluIHNsaWRlc1tzbGlkZV0uZG5kLmRyb3BwYWJsZURhdGEpIHtcblx0XHRcdFx0XHRmb3IgKHZhciBkcmFnZ2FibGVJbmRleCBpbiBzbGlkZXNbc2xpZGVdLmRuZC5kcm9wcGFibGVEYXRhW2Ryb3BUYXJnZXRdLmFuc3dlcnMpIHtcblx0XHRcdFx0XHRcdHNsaWRlc1tzbGlkZV0uZG5kLnF1aXpbZHJvcFRhcmdldF0gPSBbXTtcblx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKGRyb3BUYXJnZXQsIHNsaWRlc1tzbGlkZV0uZG5kLmRyb3BwYWJsZURhdGFbZHJvcFRhcmdldF0uYW5zd2Vyc1tkcmFnZ2FibGVJbmRleF0pO1xuXHRcdFx0XHRcdFx0c2xpZGVzW3NsaWRlXS5kbmQucXVpeltkcm9wVGFyZ2V0XS5wdXNoKFxuXHRcdFx0XHRcdFx0XHRzbGlkZXNbc2xpZGVdLmRuZC5kcm9wcGFibGVEYXRhW2Ryb3BUYXJnZXRdLmFuc3dlcnNbZHJhZ2dhYmxlSW5kZXhdXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBzb2x2ZURORCgpIHtcblx0dmFyIGN1cnJlbnRTbGlkZUlEID0gZ2xvYmFsVmFyLmN1clNsaWRlO1xuXG5cdERORE9sZEZyYW1ld29ya0FkYXB0ZXIoKTtcblxuXHRpZiAoc2xpZGVzW2N1cnJlbnRTbGlkZUlEXS50eXBlID09PSAnZG5kJykge1xuXHRcdCQoJy5kcmFnZ2FibGUnKS5jc3MoJ3pJbmRleCcsIDMpO1xuXHRcdHZhciBkbmRBbnN3ZXJzQXJyYXkgPSBzbGlkZXNbY3VycmVudFNsaWRlSURdLmRuZC5xdWl6O1xuXHRcdGZvciAodmFyIGRyb3BUYXJnZXQgaW4gZG5kQW5zd2Vyc0FycmF5KSB7XG5cdFx0XHQvLyBjb25zb2xlLmxvZygn8J+agCB+IGZpbGU6IGRhdGEuanMgfiBsaW5lIDYgfiBzb2x2ZURORCB+IGRuZEFuc3dlcnNBcnJheScsIGRuZEFuc3dlcnNBcnJheSk7XG5cdFx0XHR2YXIgZHJhZ2dhYmxlc0FycmF5ID0gZG5kQW5zd2Vyc0FycmF5W2Ryb3BUYXJnZXRdO1xuXHRcdFx0Ly8gY29uc29sZS5sb2coJ/CfmoAgfiBmaWxlOiBkYXRhLmpzIH4gbGluZSA3IH4gc29sdmVETkQgfiBkcmFnZ2FibGVzQXJyYXknLCBkcmFnZ2FibGVzQXJyYXkpO1xuXHRcdFx0Zm9yICh2YXIgZHJhZ2dhYmxlSW5kZXggaW4gZHJhZ2dhYmxlc0FycmF5KSB7XG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKGRyb3BUYXJnZXQsIGRyYWdnYWJsZSk7XG5cdFx0XHRcdHZhciBkcmFnZ2FibGUgPSBkcmFnZ2FibGVzQXJyYXlbZHJhZ2dhYmxlSW5kZXhdO1xuXHRcdFx0XHQvLyBjb25zb2xlLmxvZygn8J+agCB+IGZpbGU6IGRhdGEuanMgfiBsaW5lIDEyIH4gc29sdmVETkQgfiBkcmFnZ2FibGUnLCBkcmFnZ2FibGUpO1xuXHRcdFx0XHQkKCcjJyArIGRyYWdnYWJsZSkuYW5pbWF0ZSgkKCcjJyArIGRyb3BUYXJnZXQpLnBvc2l0aW9uKCksIDApO1xuXHRcdFx0XHRpZiAodHlwZW9mIGRyb3BwZWQgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRkcm9wcGVkKCQoJyMnICsgZHJvcFRhcmdldClbMF0sICQoJyMnICsgZHJhZ2dhYmxlKVswXSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIGhhbmRsZURyb3AgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRoYW5kbGVEcm9wKCQoJyMnICsgZHJvcFRhcmdldCksICQoJyMnICsgZHJhZ2dhYmxlKSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihcblx0XHRcdFx0XHRcdFwiTmVpdGhlciAnZG9wcGVkJyBub3IgJ2hhbmRsZURyb3AnIGZ1bmN0aW9uIGlzIGF2YWlsYWJsZS4gTXVzdCBiZSBhbiB1bnN1cHBvcnRlZCB2ZXJzaW9uIG9mIHRoZSBmcmFtZXdvcmsuIFNvcnJ5LlwiXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRjb25zb2xlLmVycm9yKCdOb3QgZXZlbiBhIERORCBzbGlkZSwgYnJvIScpO1xuXHR9XG59XG4iLCIvKlxuV0lTSExJU1RcblxuY2xhc3NlcyBuZXN0ZWQgaW4gXCJjbGFzc2VzXCIgb2JqZWN0XG5ob3ZlciBldmVudHNcbmdyb3Vwc1xuXG4qL1xuXG4vKipcbiAqIEBwYXJhbSBzbGlkZU9ialxuICogQHBhcmFtIHNldHRpbmdzXG4gKiBAcGFyYW0gJGhvdHNwb3RzXG4gKiBAcGFyYW0gbW9kYWxzXG4gKi9cbmZ1bmN0aW9uIGhvdHNwb3RGdW5jdGlvbnMoc2xpZGUsIHNldHRpbmdzLCAkaG90c3BvdHMsIG1vZGFscykge1xuXHR2YXIgc2xpZGUgPSBzbGlkZSB8fCBnbG9iYWxWYXIuc2xpZGU7XG5cdHZhciB7IGRhdGEgfSA9IHNsaWRlO1xuXHR2YXIgc2V0dGluZ3MgPSBzZXR0aW5ncyB8fCBkYXRhLmhvdHNwb3QgfHwgKGRhdGEuaG90c3BvdCA9IHt9KTtcblx0dmFyICRob3RzcG90cyA9ICRob3RzcG90cyB8fCBzbGlkZS4kZG9tLmZpbmQoJy5ob3RzcG90LWJ1dHRvbl9fanMnKTtcblx0dmFyIG1vZGFscyA9IG1vZGFscyB8fCBnZXRIb3RzcG90TW9kYWxzKCRob3RzcG90cy5sZW5ndGgpO1xuXG5cdGlmICghZGF0YS52aXNpdGVkKSBob3RzcG90SW5pdChkYXRhLCBzZXR0aW5ncywgJGhvdHNwb3RzLCBtb2RhbHMpO1xuXHRpZiAoY2hlY2tMb2NrU3VibWl0SWZVbmF0dGVtcHRlZChkYXRhKSkgbG9ja0J1dHRvbk5vd1VubG9ja09uRXhpdCgkKCcjc2ktc3VibWl0LCAjc2ktY3VzdG9tLXN1Ym1pdCcpLCBkYXRhKTtcblx0cmVzZXRIb3RzcG90KHNldHRpbmdzLCAkaG90c3BvdHMsIG1vZGFscyk7XG59XG5cbi8qKlxuICogQHBhcmFtIHNsaWRlT2JqXG4gKiBAcGFyYW0gc2V0dGluZ3NcbiAqIEBwYXJhbSAkaG90c3BvdHNcbiAqIEBwYXJhbSBtb2RhbHNcbiAqL1xuZnVuY3Rpb24gaG90c3BvdEluaXQoc2xpZGVPYmosIHNldHRpbmdzLCAkaG90c3BvdHMsIG1vZGFscykge1xuXHRob3RzcG90U2V0RGVmYXVsdHMoc2V0dGluZ3MsIG1vZGFscyk7XG5cdGhvdHNwb3RET01TZXR1cChzbGlkZU9iaiwgc2V0dGluZ3MsICRob3RzcG90cywgbW9kYWxzKTtcblx0aG90c3BvdEF1ZGlvSW5pdChzZXR0aW5ncy5hdWRpbyk7XG5cblx0aG90c3BvdExpc3RlbmVycyhzZXR0aW5ncywgJGhvdHNwb3RzLCBmdW5jdGlvbiAoaWR4LCBob3RzcG90KSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uICgpIHtcblx0XHRcdGhvdHNwb3RPbkludGVyYWN0KHNldHRpbmdzLCAkaG90c3BvdHMsIG1vZGFscywgaWR4LCAkKGhvdHNwb3QpLCBtb2RhbHNbaWR4XSk7XG5cdFx0fTtcblx0fSk7XG5cblx0aG90c3BvdE9uRXhpdChzbGlkZU9iaik7XG59XG5cbi8qKlxuICogQHBhcmFtIHNldHRpbmdzXG4gKiBAcGFyYW0gJGhvdHNwb3RzXG4gKiBAcGFyYW0gbW9kYWxzXG4gKi9cbmZ1bmN0aW9uIHJlc2V0SG90c3BvdChzZXR0aW5ncywgJGhvdHNwb3RzLCBtb2RhbHMpIHtcblx0dmFyIHNsaWRlID0gZ2xvYmFsVmFyLnNsaWRlO1xuXHR2YXIgeyBkYXRhIH0gPSBzbGlkZTtcblxuXHR2YXIgc2V0dGluZ3MgPSBzZXR0aW5ncyB8fCBkYXRhLmhvdHNwb3Q7XG5cdHZhciAkaG90c3BvdHMgPSAkaG90c3BvdHMgfHwgc2xpZGUuJGRvbS5maW5kKCcuaG90c3BvdC1idXR0b25fX2pzJyk7XG5cdHZhciBtb2RhbHMgPSBtb2RhbHMgfHwgZ2V0SG90c3BvdE1vZGFscygkaG90c3BvdHMubGVuZ3RoKTtcblxuXHQkaG90c3BvdHMucmVtb3ZlQ2xhc3Moc2V0dGluZ3MuY2xhc3Nlcy5jb21wbGV0ZWQpO1xuXG5cdGlmIChzZXR0aW5ncy5saW5lYXIpIGhvdHNwb3RMaW5lYXJSZXNldChzZXR0aW5ncywgJGhvdHNwb3RzLCBtb2RhbHMpO1xuXHRpZiAoc2V0dGluZ3MucXVpeikgaG90c3BvdFF1aXpSZXNldChzZXR0aW5ncywgJGhvdHNwb3RzKTtcblx0aWYgKGNoZWNrTG9ja1N1Ym1pdElmVW5hdHRlbXB0ZWQoZGF0YSkpIGxvY2tCdXR0b25Ob3dVbmxvY2tPbkV4aXQoJCgnI3NpLXN1Ym1pdCwgI3NpLWN1c3RvbS1zdWJtaXQnKSwgZGF0YSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHNldHRpbmdzXG4gKiBAcGFyYW0gJGhvdHNwb3RzXG4gKiBAcGFyYW0gaWR4XG4gKiBAcGFyYW0gJHNlbGVjdGVkSG90c3BvdFxuICogQHBhcmFtICRtb2RhbFxuICovXG5cbmZ1bmN0aW9uIGhvdHNwb3RPbkludGVyYWN0KHNldHRpbmdzLCAkaG90c3BvdHMsIG1vZGFscywgaWR4LCAkc2VsZWN0ZWRIb3RzcG90LCAkbW9kYWwpIHtcblx0dmFyIGl0ZW1OdW0gPSBpZHggKyAxO1xuXHR2YXIgaGFzTW9kYWxzID0gc2V0dGluZ3MubW9kYWxzO1xuXHR2YXIgaXRlbVNldHRpbmdzID0gZ2V0SXRlbVNldHRpbmdzKHNldHRpbmdzLml0ZW1zLCAkc2VsZWN0ZWRIb3RzcG90WzBdLmlkLCBpdGVtTnVtKTtcblx0dmFyIG1vZGFsRG9lc05vdFRyaWdnZXJDb21wbGV0aW9uID0gIWhhc01vZGFscyB8fCBzZXR0aW5ncy5tb2RhbHMubm9Nb2RhbENsb3NlO1xuXG5cdHVubG9jaygkKCcjc2ktc3VibWl0JykpO1xuXHRob3RzcG90Q3VzdG9tQWN0aW9uKHNldHRpbmdzLm9uQ2xpY2ssIGl0ZW1TZXR0aW5ncyAmJiBpdGVtU2V0dGluZ3Mub25DbGljaywgJHNlbGVjdGVkSG90c3BvdCwgJG1vZGFsKTtcblx0aG90c3BvdFBsYXlWTyhzZXR0aW5ncywgaXRlbU51bSk7XG5cblx0aWYgKHNldHRpbmdzLnF1aXopIHJldHVybiBob3RzcG90T25RdWl6SXRlbVNlbGVjdGVkKHNldHRpbmdzLCAkaG90c3BvdHMsICRzZWxlY3RlZEhvdHNwb3QpO1xuXG5cdGlmIChoYXNNb2RhbHMpIHtcblx0XHRob3RzcG90Q2xvc2VSZW1haW5pbmdNb2RhbHMoc2V0dGluZ3MsICQoJy5zaS1jdXJyZW50LW1vZGFsJyksICQoJy5ob3RzcG90LW9wZW4nKSk7XG5cdFx0aG90c3BvdE9wZW5Nb2RhbChzZXR0aW5ncywgaXRlbU51bSwgJHNlbGVjdGVkSG90c3BvdCwgJG1vZGFsKTtcblxuXHRcdGlmIChzZXR0aW5ncy5tb2RhbHMuaG92ZXIpIGhvdHNwb3RDbG9zZU9uTW91c2VPdXQoJHNlbGVjdGVkSG90c3BvdCwgJG1vZGFsKTtcblx0fVxuXG5cdGlmIChtb2RhbERvZXNOb3RUcmlnZ2VyQ29tcGxldGlvbikge1xuXHRcdGhvdHNwb3RJdGVtQ29tcGxldGUoc2V0dGluZ3MsICRob3RzcG90cywgaXRlbVNldHRpbmdzLCAkc2VsZWN0ZWRIb3RzcG90LCAkbW9kYWwpO1xuXG5cdFx0aWYgKHNldHRpbmdzLmxpbmVhcilcblx0XHRcdGhvdHNwb3RVbmxvY2tOZXh0KHNldHRpbmdzLCAkaG90c3BvdHMsIGl0ZW1OdW0gKyAxLCAkKCRob3RzcG90c1tpZHggKyAxXSksIG1vZGFsc1tpZHggKyAxXSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gaG90c3BvdFNldERlZmF1bHRzKHNldHRpbmdzLCB1c2VNb2RhbHMpIHtcblx0c2V0dGluZ3MubW9kYWxzID0gIXVzZU1vZGFscyA/IGZhbHNlIDogc2V0dGluZ3MubW9kYWxzID8gc2V0dGluZ3MubW9kYWxzIDoge307XG5cdHNldHRpbmdzLml0ZW1zID0gc2V0dGluZ3MuaXRlbXMgfHwge307XG5cdHNldHRpbmdzLmNsYXNzZXMgPSBzZXR0aW5ncy5jbGFzc2VzIHx8IHt9O1xuXG5cdHNldHRpbmdzLmNsYXNzZXMuaG90c3BvdCA9IHNldHRpbmdzLmNsYXNzZXMuaG90c3BvdCB8fCAnaG90c3BvdC1zdHlsZSc7XG5cdHNldHRpbmdzLmNsYXNzZXMubW9kYWwgPSBzZXR0aW5ncy5jbGFzc2VzLm1vZGFsIHx8ICdtb2RhbC1zdHlsZSc7XG5cblx0c2V0dGluZ3MuY2xhc3Nlcy5jb21wbGV0ZWQgPSBzZXR0aW5ncy5jbGFzc2VzLmNvbXBsZXRlZCB8fCAnY29tcGxldGVkJztcblx0c2V0dGluZ3MuY2xhc3Nlcy5saW5lYXJVbmxvY2tlZCA9IHNldHRpbmdzLmNsYXNzZXMubGluZWFyVW5sb2NrZWQgfHwgJ3VubG9ja2VkJztcblx0c2V0dGluZ3MuY2xhc3Nlcy5xdWl6SXRlbVNlbGVjdGVkID0gc2V0dGluZ3MuY2xhc3Nlcy5xdWl6SXRlbVNlbGVjdGVkIHx8ICdzZWxlY3RlZC1ob3RzcG90JztcblxuXHRyZXR1cm4gc2V0dGluZ3M7XG59XG5cbmZ1bmN0aW9uIGhvdHNwb3RET01TZXR1cChzbGlkZU9iaiwgc2V0dGluZ3MsICRob3RzcG90cywgbW9kYWxzKSB7XG5cdCRob3RzcG90cy5hZGRDbGFzcyhzZXR0aW5ncy5jbGFzc2VzLmhvdHNwb3QpO1xuXHQkaG90c3BvdHMuZWFjaChmdW5jdGlvbiAoaWR4LCBob3RzcG90KSB7XG5cdFx0JChob3RzcG90KS5hZGRDbGFzcyhzZXR0aW5ncy5jbGFzc2VzLmhvdHNwb3QgKyAnLScgKyAoaWR4ICsgMSkpO1xuXHR9KTtcblxuXHRpZiAoIW1vZGFscykgcmV0dXJuO1xuXG5cdHZhciAkbW9kYWxDb250YWluZXIgPSBtb2RhbHMgJiYgbW9kYWxzWzBdLnBhcmVudCgpO1xuXG5cdG1vZGFscy5mb3JFYWNoKGZ1bmN0aW9uICgkbW9kYWwsIGlkeCkge1xuXHRcdCRtb2RhbC5hZGRDbGFzcyhzZXR0aW5ncy5jbGFzc2VzLm1vZGFsKTtcblx0XHQkbW9kYWwuYWRkQ2xhc3Moc2V0dGluZ3MuY2xhc3Nlcy5tb2RhbCArICctJyArIChpZHggKyAxKSk7XG5cblx0XHRpZiAoc2V0dGluZ3MubW9kYWxzLmNsaWNrQW55d2hlcmUpICRtb2RhbC5hZGRDbGFzcygnbW9kYWwtY2xpY2stYW55d2hlcmUnKTtcblx0fSk7XG5cdGlmIChzZXR0aW5ncy5tb2RhbHMuaG92ZXIgfHwgc2V0dGluZ3MubW9kYWxzLm5vTW9kYWxDbG9zZSkge1xuXHRcdGFkZFRvRnVuY3Rpb25LZXkoc2xpZGVPYmosICdvbkV4aXRBY3Rpb24nLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkbW9kYWxDb250YWluZXIucmVtb3ZlQ2xhc3MoJ3Bhc3N0aHJvdWdoLW1vZGFsJyk7XG5cdFx0fSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gaG90c3BvdEF1ZGlvSW5pdChhdWRpb09iaikge1xuXHRmb3IgKHZhciBrZXkgaW4gYXVkaW9PYmopIHtcblx0XHRhdWRpb09ialtrZXldID0gbmV3IEhvd2woe1xuXHRcdFx0c3JjOiBbYXVkaW9PYmpba2V5XV1cblx0XHR9KTtcblx0fVxufVxuXG5mdW5jdGlvbiBob3RzcG90T25XaW4oc2V0dGluZ3MpIHtcblx0aWYgKHNldHRpbmdzLm9uV2luKSBzZXR0aW5ncy5vbldpbigpO1xuXHRlbHNlIHNsaWRlQWN0aW9uKGdsb2JhbFZhci5zbGlkZS5pZCwgJ25leHRBY3Rpb24nKTtcbn1cblxuZnVuY3Rpb24gaG90c3BvdFVubG9ja05leHQoc2V0dGluZ3MsICRob3RzcG90cywgbmV4dEhvdHNwb3RJdGVtTnVtLCAkbmV4dEhvdHNwb3QsICRuZXh0TW9kYWwpIHtcblx0dmFyIG5leHRIb3RzcG90U2V0dGluZ3MgPSBnZXRJdGVtU2V0dGluZ3Moc2V0dGluZ3MuaXRlbXMsICRuZXh0SG90c3BvdC5pZCwgbmV4dEhvdHNwb3RJdGVtTnVtKTtcblxuXHQkaG90c3BvdHMucmVtb3ZlQ2xhc3Moc2V0dGluZ3MuY2xhc3Nlcy5saW5lYXJVbmxvY2tlZCk7XG5cblx0dW5sb2NrKCRuZXh0SG90c3BvdCk7XG5cdCRuZXh0SG90c3BvdC5hZGRDbGFzcyhzZXR0aW5ncy5jbGFzc2VzLmxpbmVhclVubG9ja2VkKTtcblxuXHRob3RzcG90Q3VzdG9tQWN0aW9uKFxuXHRcdHNldHRpbmdzLm9uVW5sb2NrLFxuXHRcdG5leHRIb3RzcG90U2V0dGluZ3MgJiYgbmV4dEhvdHNwb3RTZXR0aW5ncy5vblVubG9jayxcblx0XHQkbmV4dEhvdHNwb3QsXG5cdFx0JG5leHRNb2RhbFxuXHQpO1xufVxuXG5mdW5jdGlvbiBob3RzcG90Q2xvc2VSZW1haW5pbmdNb2RhbHMoc2V0dGluZ3MsICRtb2RhbFRvQ2xvc2UsICRob3RzcG90VG9DbG9zZSkge1xuXHQvLyBIb3dsZXIuc3RvcCgpO1xuXHRpZiAoJG1vZGFsVG9DbG9zZS5sZW5ndGggPD0gMCkgcmV0dXJuO1xuXHR2YXIgaXRlbVRvQ2xvc2VTZXR0aW5ncyA9IGdldEl0ZW1TZXR0aW5ncyhzZXR0aW5ncy5pdGVtcywgJGhvdHNwb3RUb0Nsb3NlWzBdLmlkLCBnbG9iYWxWYXIuaG90c3BvdEl0ZW1OdW0pO1xuXG5cdGhvdHNwb3RDdXN0b21BY3Rpb24oXG5cdFx0c2V0dGluZ3Mub25Nb2RhbENsb3NlLFxuXHRcdGl0ZW1Ub0Nsb3NlU2V0dGluZ3MgJiYgaXRlbVRvQ2xvc2VTZXR0aW5ncy5vbk1vZGFsQ2xvc2UsXG5cdFx0JGhvdHNwb3RUb0Nsb3NlLFxuXHRcdCRtb2RhbFRvQ2xvc2Vcblx0KTtcblx0JG1vZGFsVG9DbG9zZS5yZW1vdmVDbGFzcygnc2ktY3VycmVudC1tb2RhbCcpO1xuXHQkbW9kYWxUb0Nsb3NlLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdzaS1tb2RhbC1jb250YWluZXItb3BlbicpO1xuXHQkaG90c3BvdFRvQ2xvc2UucmVtb3ZlQ2xhc3MoJ2hvdHNwb3Qtb3BlbicpO1xuXHQkbW9kYWxUb0Nsb3NlLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdwYXNzdGhyb3VnaC1tb2RhbCcpO1xufVxuXG5mdW5jdGlvbiBnZXRIb3RzcG90TW9kYWxzKG51bU9mTW9kYWxzKSB7XG5cdHZhciBzbGlkZSA9IGdsb2JhbFZhci5zbGlkZTtcblx0dmFyIG1vZGFscyA9IFtdO1xuXG5cdGlmIChzbGlkZS5kYXRhLm1vZGFsKVxuXHRcdGZvciAodmFyIGkgPSAxOyBpIDwgbnVtT2ZNb2RhbHMgKyAxOyBpKyspIHtcblx0XHRcdGlmIChzbGlkZS5kYXRhLm1vZGFsWydocycgKyBpXSkgbW9kYWxzLnB1c2goJCgnIycgKyBzbGlkZS5kYXRhLm1vZGFsWydocycgKyBpXSkpO1xuXHRcdH1cblx0cmV0dXJuIG1vZGFscy5sZW5ndGggPiAwICYmIG1vZGFsczsgLy9yZXR1cm5zIGZhbHNlIGlmIG5vIG1vZGFscyBmb3VuZFxufVxuXG5mdW5jdGlvbiBob3RzcG90TGlzdGVuZXJzKHNldHRpbmdzLCAkaG90c3BvdHMsIG9uSW50ZXJhY3QpIHtcblx0JGhvdHNwb3RzLmVhY2goZnVuY3Rpb24gKGlkeCwgaG90c3BvdCkge1xuXHRcdHZhciAkaG90c3BvdCA9ICQoaG90c3BvdCk7XG5cblx0XHRpZiAoc2V0dGluZ3MubW9kYWxzLmhvdmVyKSAkaG90c3BvdC5vbignbW91c2VvdmVyLmhvdHNwb3QnLCBvbkludGVyYWN0KGlkeCwgaG90c3BvdCkpO1xuXHRcdGVsc2UgJGhvdHNwb3Qub24oJ2NsaWNrLmhvdHNwb3QnLCBvbkludGVyYWN0KGlkeCwgaG90c3BvdCkpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gaG90c3BvdFBsYXlWTyhzZXR0aW5ncywgaXRlbU51bSkge1xuXHRpZiAoc2V0dGluZ3MuYXVkaW8pIHtcblx0XHRIb3dsZXIuc3RvcCgpO1xuXHRcdGZvciAodmFyIGtleSBpbiBzZXR0aW5ncy5hdWRpbykgc2V0dGluZ3MuYXVkaW9ba2V5XS5zdG9wKCk7XG5cblx0XHRzZXR0aW5ncy5hdWRpb1tpdGVtTnVtXSAmJiBzZXR0aW5ncy5hdWRpb1tpdGVtTnVtXS5wbGF5KCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gaG90c3BvdE9uUXVpekl0ZW1TZWxlY3RlZChzZXR0aW5ncywgJGhvdHNwb3RzLCAkc2VsZWN0ZWRIb3RzcG90KSB7XG5cdGlmIChzZXR0aW5ncy5xdWl6LnR5cGUgPT09ICdzY3EnKSAkaG90c3BvdHMucmVtb3ZlQ2xhc3Moc2V0dGluZ3MuY2xhc3Nlcy5xdWl6SXRlbVNlbGVjdGVkKTtcblxuXHQkc2VsZWN0ZWRIb3RzcG90LnRvZ2dsZUNsYXNzKHNldHRpbmdzLmNsYXNzZXMucXVpekl0ZW1TZWxlY3RlZCk7XG5cblx0c2V0dGluZ3MucXVpei5zZWxlY3RlZEFuc3dlcnMgPSBbXTtcblx0JGhvdHNwb3RzLmVhY2goZnVuY3Rpb24gKGlkeCwgcXVpekhvdHNwb3QpIHtcblx0XHRpZiAoJChxdWl6SG90c3BvdCkuaGFzQ2xhc3Moc2V0dGluZ3MuY2xhc3Nlcy5xdWl6SXRlbVNlbGVjdGVkKSkgc2V0dGluZ3MucXVpei5zZWxlY3RlZEFuc3dlcnMucHVzaChpZHggKyAxKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGhvdHNwb3RJdGVtQ29tcGxldGUoc2V0dGluZ3MsICRob3RzcG90cywgaXRlbVNldHRpbmdzLCAkY29tcGxldGVkQnV0dG9uLCAkY29tcGxldGVkTW9kYWwpIHtcblx0aG90c3BvdEN1c3RvbUFjdGlvbihcblx0XHRzZXR0aW5ncy5vbkl0ZW1Db21wbGV0ZSxcblx0XHRpdGVtU2V0dGluZ3MgJiYgaXRlbVNldHRpbmdzLm9uSXRlbUNvbXBsZXRlLFxuXHRcdCRjb21wbGV0ZWRCdXR0b24sXG5cdFx0JGNvbXBsZXRlZE1vZGFsXG5cdCk7XG5cblx0JGNvbXBsZXRlZEJ1dHRvbi5hZGRDbGFzcyhzZXR0aW5ncy5jbGFzc2VzLmNvbXBsZXRlZCk7XG5cblx0aWYgKGFsbEhvdHNwb3RzQ29tcGxldGVkKCRob3RzcG90cykpIGhvdHNwb3RPbldpbihzZXR0aW5ncywgJGhvdHNwb3RzKTtcbn1cblxuZnVuY3Rpb24gYWxsSG90c3BvdHNDb21wbGV0ZWQoJGhvdHNwb3RzKSB7XG5cdHJldHVybiAkaG90c3BvdHMuZmlsdGVyKCcuY29tcGxldGVkJykubGVuZ3RoID09PSAkaG90c3BvdHMubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBob3RzcG90U2F2ZU1vZGFsSW5mbyhzYXZlVG8sIGl0ZW1OdW0sIElEKSB7XG5cdHNhdmVUby5jdXJyZW50TW9kYWwgPSBJRDtcblx0c2F2ZVRvLmN1cnJlbnRNb2RhbFR5cGUgPSAnaG90c3BvdCc7XG5cdHNhdmVUby5ob3RzcG90SXRlbU51bSA9IGl0ZW1OdW07XG59XG5cbmZ1bmN0aW9uIGhvdHNwb3RPcGVuTW9kYWwoc2V0dGluZ3MsIGl0ZW1OdW0sICRzZWxlY3RlZEhvdHNwb3QsICRtb2RhbCkge1xuXHR2YXIgJG1vZGFsQ29udGFpbmVyID0gJG1vZGFsLnBhcmVudCgpO1xuXG5cdCRzZWxlY3RlZEhvdHNwb3QuYWRkQ2xhc3MoJ2hvdHNwb3Qtb3BlbicpO1xuXG5cdGlmIChzZXR0aW5ncy5tb2RhbHMuaG92ZXIgfHwgc2V0dGluZ3MubW9kYWxzLm5vTW9kYWxDbG9zZSkgJG1vZGFsQ29udGFpbmVyLmFkZENsYXNzKCdwYXNzdGhyb3VnaC1tb2RhbCcpO1xuXG5cdCRtb2RhbENvbnRhaW5lci5hZGRDbGFzcygnc2ktbW9kYWwtY29udGFpbmVyLW9wZW4nKTtcblx0JG1vZGFsLmFkZENsYXNzKCdzaS1jdXJyZW50LW1vZGFsJyk7XG5cblx0aG90c3BvdFNhdmVNb2RhbEluZm8oZ2xvYmFsVmFyLCBpdGVtTnVtLCAkbW9kYWxbMF0uaWQpO1xufVxuXG5mdW5jdGlvbiBob3RzcG90T25FeGl0KHNsaWRlT2JqKSB7XG5cdGFkZFRvRnVuY3Rpb25LZXkoc2xpZGVPYmosICdvbkV4aXRBY3Rpb24nLCBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyICRtb2RhbFRvQ2xvc2UgPSAkKCcuc2ktY3VycmVudC1tb2RhbCcpO1xuXG5cdFx0aG90c3BvdENsb3NlUmVtYWluaW5nTW9kYWxzKHNsaWRlT2JqLmhvdHNwb3QsICRtb2RhbFRvQ2xvc2UsICQoJy5ob3RzcG90LW9wZW4nKSk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBob3RzcG90Q2xvc2VPbk1vdXNlT3V0KCRzZWxlY3RlZEhvdHNwb3QsICRtb2RhbCkge1xuXHR2YXIgJG1vZGFsQ29udGFpbmVyID0gJG1vZGFsLnBhcmVudCgpO1xuXG5cdCRzZWxlY3RlZEhvdHNwb3Qub25lKCdtb3VzZW91dC5ob3RzcG90JywgZnVuY3Rpb24gKCkge1xuXHRcdCRtb2RhbENvbnRhaW5lci50cmlnZ2VyKCdjbGljaycpO1xuXG5cdFx0JG1vZGFsQ29udGFpbmVyLnJlbW92ZUNsYXNzKCdwYXNzdGhyb3VnaC1tb2RhbCcpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gaG90c3BvdExpbmVhclJlc2V0KHNldHRpbmdzLCAkaG90c3BvdHMsIG1vZGFscykge1xuXHR2YXIgJGZpcnN0SG90c3BvdCA9ICQoJGhvdHNwb3RzWzBdKTtcblx0dmFyICRmaXJzdE1vZGFsID0gbW9kYWxzICYmIG1vZGFsc1swXTtcblxuXHQkaG90c3BvdHMucmVtb3ZlQ2xhc3Moc2V0dGluZ3MuY2xhc3Nlcy5saW5lYXJVbmxvY2tlZCk7XG5cblx0bG9jaygkaG90c3BvdHMpO1xuXHRob3RzcG90VW5sb2NrTmV4dChzZXR0aW5ncywgJGhvdHNwb3RzLCAxLCAkZmlyc3RIb3RzcG90LCAkZmlyc3RNb2RhbCk7XG59XG5cbmZ1bmN0aW9uIGhvdHNwb3RRdWl6UmVzZXQoc2V0dGluZ3MsICRob3RzcG90cykge1xuXHQkaG90c3BvdHMucmVtb3ZlQ2xhc3Moc2V0dGluZ3MuY2xhc3Nlcy5xdWl6SXRlbVNlbGVjdGVkKTtcblx0c2V0dGluZ3MucXVpei5zZWxlY3RlZEFuc3dlcnMgPSBbXTtcbn1cblxuZnVuY3Rpb24gaG90c3BvdEN1c3RvbUFjdGlvbihtYWluQWN0aW9uLCBpdGVtQWN0aW9uLCAkaG90c3BvdCwgJG1vZGFsKSB7XG5cdG1haW5BY3Rpb24gJiYgbWFpbkFjdGlvbigkaG90c3BvdCwgJG1vZGFsKTtcblx0aXRlbUFjdGlvbiAmJiBpdGVtQWN0aW9uKCRob3RzcG90LCAkbW9kYWwpO1xufVxuXG5mdW5jdGlvbiBnZXRJdGVtU2V0dGluZ3Moc2V0dGluZ3NEaXIsIGlkLCBpdGVtTnVtKSB7XG5cdHJldHVybiBzZXR0aW5nc0RpcltpdGVtTnVtXSB8fCBzZXR0aW5nc0RpcltpZF07XG59XG5cbmZ1bmN0aW9uIGNoZWNrSG90c3BvdCgpIHtcblx0dmFyIHNsaWRlID0gZ2xvYmFsVmFyLnNsaWRlO1xuXHR2YXIgcXVpeiA9IHNsaWRlLmRhdGEuaG90c3BvdC5xdWl6O1xuXHRpZiAoIXF1aXopIHRocm93ICdcXG5Ib3RzcG90IEVycm9yOlxcbnlvdSBoYXZlIHRvIHR1cm4gb24gdGhlIFwicXVpelwiIHNldHRpbmdzIHRvIHVzZSBob3RzcG90cyB0aGlzIHdheSc7XG5cdHZhciBjb3JyZWN0QW5zd2VycyA9IHF1aXouYW5zd2Vycztcblx0dmFyIHNlbGVjdGVkQW5zd2VycyA9IHF1aXouc2VsZWN0ZWRBbnN3ZXJzO1xuXHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkoc2VsZWN0ZWRBbnN3ZXJzKSA9PT0gSlNPTi5zdHJpbmdpZnkoY29ycmVjdEFuc3dlcnMpO1xufVxuIiwiZnVuY3Rpb24gaW5pdE1lbnUoKSB7XG5cdGVhY2hTbGlkZShmdW5jdGlvbiAoeyBpZDogaWQsIGRhdGE6IGRhdGEsICRkb206ICRkb20gfSkge1xuXHRcdGlmIChkYXRhLnR5cGUgPT09ICdtZW51Jykge1xuXHRcdFx0aWYgKGRhdGEubWVudSkge1xuXHRcdFx0XHQvLyBzZXQgZGVmYXVsdCBtZW51IGNsYXNzIGlmIG9uZSBpcyBub3QgcHJlc2VudFxuXHRcdFx0XHRpZiAoIWRhdGEubWVudS5tZW51Q2xhc3MpIHtcblx0XHRcdFx0XHRkYXRhLm1lbnUubWVudUNsYXNzID0gJ3NpLW1lbnVfX2pzJztcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBzZXQgbWVudSBkZWZhdWx0IHRvIG5vbmxpbmVhciBpZiBsaW5lYXIgc2xpZGUga2V5IGlzIG5vdCBwcmVzZW50L3RydWVcblx0XHRcdFx0aWYgKCFkYXRhLm1lbnUubGluZWFyKSB7XG5cdFx0XHRcdFx0ZGF0YS5tZW51LmxpbmVhciA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIHNldCBtZW51IGRlZmF1bHQgbWVudSBuYXZpZ2F0aW9uIGlmIG5vdCBwcmVzZW50LiAgV2lsbCBtYXRjaCBidXR0b25zIHRvIHN1YnNlcXVlbnQgc2xpZGVzIGFmdGVyIHRoZSBtZW51XG5cdFx0XHRcdGlmICghZGF0YS5tZW51Lm5hdmlnYXRpb24pIHtcblx0XHRcdFx0XHR2YXIgbnVtYmVyID0gZGF0YS5zbGlkZU51bWJlcjtcblx0XHRcdFx0XHR2YXIgYnV0dG9ucyA9ICRkb20uZmluZCgnLicgKyBkYXRhLm1lbnUubWVudUNsYXNzKTtcblx0XHRcdFx0XHR2YXIgbGVuZ3RoID0gYnV0dG9ucy5sZW5ndGg7XG5cdFx0XHRcdFx0dmFyIGRlZmF1bHROYXYgPSBbXTtcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMTsgaSA8PSBsZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0ZGVmYXVsdE5hdi5wdXNoKG51bWJlciArIGkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkYXRhLm1lbnUubmF2aWdhdGlvbiA9IGRlZmF1bHROYXY7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gc2V0IGRlZmF1bHQgY29tcGxldGlvbiByZXF1aXJlbWVudHMgZm9yIGVhY2ggYnV0dG9uIGlmIG5vdCBnaXZlbi4gIFdpbGwgbWF0Y2ggYnV0dG9ucyB0byBzdWJzZXF1ZW50IHNsaWRlcyBhZnRlciB0aGUgbWVudVxuXHRcdFx0XHRpZiAoIWRhdGEubWVudS5jb21wbGV0aW9uSURzKSB7XG5cdFx0XHRcdFx0dmFyIG51bWJlciA9IGRhdGEuc2xpZGVOdW1iZXI7XG5cdFx0XHRcdFx0dmFyIGJ1dHRvbnMgPSAkZG9tLmZpbmQoJy4nICsgZGF0YS5tZW51Lm1lbnVDbGFzcyk7XG5cdFx0XHRcdFx0dmFyIGxlbmd0aCA9IGJ1dHRvbnMubGVuZ3RoO1xuXHRcdFx0XHRcdHZhciBjb21wbGV0aW9uSURzID0gW107XG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDE7IGkgPD0gbGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdGZvciAoc2xpZGVJRCBpbiBzbGlkZXMpIHtcblx0XHRcdFx0XHRcdFx0aWYgKHNsaWRlc1tzbGlkZUlEXS5zbGlkZU51bWJlciA9PSAobnVtYmVyICsgaSkudG9TdHJpbmcoKSkge1xuXHRcdFx0XHRcdFx0XHRcdGNvbXBsZXRpb25JRHMucHVzaChzbGlkZUlEKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkYXRhLm1lbnUuY29tcGxldGlvbklEcyA9IGNvbXBsZXRpb25JRHM7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIHNldCBhbGwgbWVudSBkZWZhdWx0cyBpZiB0aGUgJ21lbnUnIGtleSBpcyBlbnRpcmVseSBhYnNlbnRcblx0XHRcdFx0ZGF0YS5tZW51ID0ge307XG5cdFx0XHRcdGRhdGEubWVudS5tZW51Q2xhc3MgPSAnc2ktbWVudV9fanMnO1xuXHRcdFx0XHRkYXRhLm1lbnUubGluZWFyID0gZmFsc2U7XG5cdFx0XHRcdGRhdGEubWVudS5jb21wbGV0aW9uSURzID0gY29tcGxldGlvbklEcztcblx0XHRcdFx0dmFyIGJ1dHRvbnMgPSAkZG9tLmZpbmQoJy4nICsgZGF0YS5tZW51Lm1lbnVDbGFzcyk7XG5cdFx0XHRcdHZhciBudW1iZXIgPSBkYXRhLnNsaWRlTnVtYmVyO1xuXHRcdFx0XHR2YXIgbGVuZ3RoID0gYnV0dG9ucy5sZW5ndGg7XG5cdFx0XHRcdHZhciBkZWZhdWx0TmF2ID0gW107XG5cdFx0XHRcdHZhciBjb21wbGV0aW9uSURzID0gW107XG5cdFx0XHRcdGZvciAodmFyIGkgPSAxOyBpIDw9IGxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0ZGVmYXVsdE5hdi5wdXNoKG51bWJlciArIGkpO1xuXHRcdFx0XHRcdGZvciAoc2xpZGVJRCBpbiBzbGlkZXMpIHtcblx0XHRcdFx0XHRcdGlmIChzbGlkZXNbc2xpZGVJRF0uc2xpZGVOdW1iZXIgPT0gKG51bWJlciArIGkpLnRvU3RyaW5nKCkpIHtcblx0XHRcdFx0XHRcdFx0Y29tcGxldGlvbklEcy5wdXNoKHNsaWRlSUQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRkYXRhLm1lbnUubmF2aWdhdGlvbiA9IGRlZmF1bHROYXY7XG5cdFx0XHRcdGRhdGEubWVudS5jb21wbGV0aW9uSURzID0gY29tcGxldGlvbklEcztcblx0XHRcdH1cblx0XHRcdC8vIGF0dGFjaCBjbGljayBldmVudCB0byB0aGUgYnV0dG9ucyB1c2luZyBuYXZpZ2F0aW9uIGFycmF5XG5cdFx0XHRpZiAoZGF0YS5tZW51Lm5hdmlnYXRpb24ubGVuZ3RoKSB7XG5cdFx0XHRcdHZhciBidXR0b25zID0gJGRvbS5maW5kKCcuJyArIGRhdGEubWVudS5tZW51Q2xhc3MpO1xuXG5cdFx0XHRcdGJ1dHRvbnMuZWFjaChmdW5jdGlvbiAoaWR4LCBidXR0b24pIHtcblx0XHRcdFx0XHR2YXIgc2xpZGUgPSBkYXRhO1xuXG5cdFx0XHRcdFx0JChidXR0b24pLm9uKCdjbGljay5uYXYnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRzaUF1ZGlvLnNmeC5jbGljay5wbGF5KCk7XG5cdFx0XHRcdFx0XHRqdW1wVG9JZChzbGlkZS5tZW51Lm5hdmlnYXRpb25baWR4XSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0Ly8gbG9jayBidXR0b25zIGlmIGxpbmVhciBhbmQgdW5sb2NrIHRoZSBmaXJzdCBvbmVcblx0XHRcdGlmIChkYXRhLm1lbnUubGluZWFyKSB7XG5cdFx0XHRcdHZhciBidXR0b25zID0gJGRvbS5maW5kKCcuJyArIGRhdGEubWVudS5tZW51Q2xhc3MpO1xuXHRcdFx0XHRsb2NrKGJ1dHRvbnMpO1xuXHRcdFx0XHR1bmxvY2soJChidXR0b25zWzBdKSk7XG5cdFx0XHRcdCQoYnV0dG9uc1swXSkuYWRkQ2xhc3MoJ3VubG9ja2VkJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gbWVudUZ1bmN0aW9ucygpIHtcblx0dmFyIHNsaWRlID0gZ2xvYmFsVmFyLnNsaWRlO1xuXHR2YXIgbWVudUJ1dHRvbnMgPSBzbGlkZS4kZG9tLmZpbmQoJy4nICsgc2xpZGUuZGF0YS5tZW51Lm1lbnVDbGFzcyk7XG5cdHZhciBsaW5lYXIgPSBzbGlkZS5kYXRhLm1lbnUubGluZWFyO1xuXHR2YXIgY29tcGxldGlvbklEcyA9IHNsaWRlLmRhdGEubWVudS5jb21wbGV0aW9uSURzO1xuXHR2YXIgYWxsQ29tcGxldGUgPSB0cnVlO1xuXG5cdGlmIChjb21wbGV0aW9uSURzLmxlbmd0aCkge1xuXHRcdGNvbXBsZXRpb25JRHMuZm9yRWFjaChmdW5jdGlvbiAoaWQsIGlkeCkge1xuXHRcdFx0aWYgKGdldENvbXBsZXRpb25TdGF0dXMoaWQpKSB7XG5cdFx0XHRcdCQobWVudUJ1dHRvbnNbaWR4XSkuYWRkQ2xhc3MoJ2NvbXBsZXRlZCcpO1xuXHRcdFx0XHQkKG1lbnVCdXR0b25zKS5yZW1vdmVDbGFzcygndW5sb2NrZWQnKTtcblx0XHRcdFx0aWYgKGxpbmVhciAmJiBtZW51QnV0dG9uc1tpZHggKyAxXSkge1xuXHRcdFx0XHRcdHVubG9jaygkKG1lbnVCdXR0b25zW2lkeCArIDFdKSk7XG5cdFx0XHRcdFx0JChtZW51QnV0dG9uc1tpZHggKyAxXSkuYWRkQ2xhc3MoJ3VubG9ja2VkJyk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFsbENvbXBsZXRlID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRpZiAoYWxsQ29tcGxldGUpIHtcblx0XHRzbGlkZS5kYXRhLm1lbnUuYWxsQ29tcGxldGUgPSB0cnVlO1xuXHR9IGVsc2Uge1xuXHRcdHNsaWRlLmRhdGEubWVudS5hbGxDb21wbGV0ZSA9IGZhbHNlO1xuXHR9XG59XG4iLCIvL2ltYWdlIGZpbGxcbi8vc2NyYXRjaCBvZmYgbG9naWNcbi8vYWxsIGNvbXBsZXRlXG4vL2RpZmZlcmVudCBzdHJva2VzIGZvciBkaWZmZXJlbnQgZm9sa3NcbmZ1bmN0aW9uIHNjcmF0Y2hGdW5jdGlvbnMoc2xpZGUpIHtcblx0dmFyIHNsaWRlID0gc2xpZGUgfHwgZ2xvYmFsVmFyLnNsaWRlO1xuXHR2YXIgc2V0dGluZ3MgPSBzbGlkZS5kYXRhLnNjcmF0Y2g7XG5cdHZhciBzY3JhdGNoSXRlbXMgPSBzbGlkZS4kZG9tLmZpbmQoJy5zY3JhdGNoX19qcycpO1xuXG5cdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdGlmICghc2V0dGluZ3MuaW5pdCkgc2NyYXRjaEluaXQoc2V0dGluZ3MsIHNjcmF0Y2hJdGVtcyk7XG5cdFx0ZWxzZSByZXNldFNjcmF0Y2goc2NyYXRjaEl0ZW1zLCBzZXR0aW5ncyk7XG5cdH0sIDMpO1xufVxuXG5mdW5jdGlvbiBzY3JhdGNoSW5pdChzZXR0aW5ncywgc2NyYXRjaEl0ZW1zKSB7XG5cdHNldHRpbmdzLml0ZW1zID0gc2V0dGluZ3MuaXRlbXMgfHwge307XG5cdHNldHRpbmdzLmJydXNoU2l6ZSA9IHNldHRpbmdzLmJydXNoU2l6ZSB8fCAyMDtcblx0c2V0dGluZ3MuZmlsbENvbG9yID0gc2V0dGluZ3MuZmlsbENvbG9yIHx8ICd3aGl0ZSc7XG5cdHNldHRpbmdzLmZpbGxJbWcgPSBzZXR0aW5ncy5maWxsSW1nIHx8IGZhbHNlO1xuXHRzZXR0aW5ncy5wYWRkaW5nID0gc2V0dGluZ3MucGFkZGluZyB8fCAnMCc7XG5cdHNldHRpbmdzLmxvY2tlZCA9IHNldHRpbmdzLmxvY2tlZCB8fCBmYWxzZTtcblx0c2V0dGluZ3Mub25Db21wbGV0ZSA9IHNldHRpbmdzLm9uQ29tcGxldGUgfHwgZnVuY3Rpb24gKCkge307XG5cdHNldHRpbmdzLnBlcmNlbnRhZ2VUb0NvbXBsZXRlID0gc2V0dGluZ3MucGVyY2VudGFnZVRvQ29tcGxldGUgfHwgOTA7XG5cdHNldHRpbmdzLm9uV2luID1cblx0XHRzZXR0aW5ncy5vbldpbiB8fFxuXHRcdGZ1bmN0aW9uICgpIHtcblx0XHRcdGhhbmRsZUFuc3dlcih0cnVlKTtcblx0XHR9O1xuXG5cdHNjcmF0Y2hJdGVtcy5hZGRDbGFzcygnc2NyYXRjaC1zdHlsZScpO1xuXG5cdHNjcmF0Y2hJdGVtcy5lYWNoKGZ1bmN0aW9uIChpLCBzY3JhdGNoSXRlbSkge1xuXHRcdHZhciBpdGVtSUQgPSBzY3JhdGNoSXRlbS5pZCB8fCBpICsgMTtcblxuXHRcdHNldHRpbmdzLml0ZW1zW2l0ZW1JRF0gPSBzZXR0aW5ncy5pdGVtc1tpdGVtSURdIHx8IHt9O1xuXHRcdHZhciBpdGVtU2V0dGluZ3MgPSBzZXR0aW5ncy5pdGVtc1tpdGVtSURdO1xuXG5cdFx0aXRlbVNldHRpbmdzLmNhbnZhc0VsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHR2YXIgY2FudmFzRWxlbSA9IGl0ZW1TZXR0aW5ncy5jYW52YXNFbGVtO1xuXG5cdFx0aXRlbVNldHRpbmdzLmNhbnZhcyA9IGNhbnZhc0VsZW0uZ2V0Q29udGV4dCgnMmQnKTtcblx0XHRpdGVtU2V0dGluZ3MuY29tcGxldGVkID0gZmFsc2U7XG5cdFx0aXRlbVNldHRpbmdzLm9uQ29tcGxldGUgPSBpdGVtU2V0dGluZ3Mub25Db21wbGV0ZSB8fCBmdW5jdGlvbiAoKSB7fTtcblxuXHRcdGlmIChzZXR0aW5ncy5sb3R0b01vZGUpIGl0ZW1TZXR0aW5ncy5sb3R0b1dpbm5lciA9IHdpbm5pbmdTY3JhdGNoKHNldHRpbmdzLmxvdHRvTW9kZSwgaXRlbUlEKTtcblxuXHRcdCQoY2FudmFzRWxlbSkuYWRkQ2xhc3MoJ2NhbnZhcy1zdHlsZScpO1xuXHRcdCQoc2NyYXRjaEl0ZW0pLnBhcmVudCgpLmFwcGVuZChjYW52YXNFbGVtKTtcblx0XHQkKHNjcmF0Y2hJdGVtKS5hZGRDbGFzcygnc2NyYXRjaC1zdHlsZS0nICsgKGkgKyAxKSk7XG5cdFx0aWYgKHNldHRpbmdzLmxvdHRvTW9kZSAmJiB3aW5uaW5nU2NyYXRjaChzZXR0aW5ncy5sb3R0b01vZGUsIGl0ZW1JRCkpXG5cdFx0XHQkKHNjcmF0Y2hJdGVtKS5hZGRDbGFzcygnd2lubmluZy1zY3JhdGNoJyk7XG5cblx0XHRyZXNpemVDYW52YXMoc2NyYXRjaEl0ZW0sIHNldHRpbmdzLCBpdGVtU2V0dGluZ3MpO1xuXG5cdFx0Y2FudmFzRWxlbS5hZGRFdmVudExpc3RlbmVyKFxuXHRcdFx0J21vdXNlbW92ZScsXG5cdFx0XHRmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRoYW5kbGVTY3JhdGNoKGUsIHNjcmF0Y2hJdGVtLCBzZXR0aW5ncywgaXRlbVNldHRpbmdzKTtcblx0XHRcdH0sXG5cdFx0XHRmYWxzZVxuXHRcdCk7XG5cblx0XHRjYW52YXNFbGVtLmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHQndG91Y2htb3ZlJyxcblx0XHRcdGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRcdGhhbmRsZVNjcmF0Y2goZSwgc2NyYXRjaEl0ZW0sIHNldHRpbmdzLCBpdGVtU2V0dGluZ3MpO1xuXHRcdFx0fSxcblx0XHRcdGZhbHNlXG5cdFx0KTtcblxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0cmVzaXplQ2FudmFzKHNjcmF0Y2hJdGVtLCBzZXR0aW5ncywgaXRlbVNldHRpbmdzKTtcblx0XHRcdH0sIDMpO1xuXHRcdH0pO1xuXHR9KTtcblx0c2V0dGluZ3MuaW5pdCA9IHRydWU7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVNjcmF0Y2goZSwgc2NyYXRjaEl0ZW0sIHNldHRpbmdzLCBpdGVtU2V0dGluZ3MpIHtcblx0aWYgKGl0ZW1TZXR0aW5ncy5jb21wbGV0ZWQgfHwgc2V0dGluZ3MubG9ja2VkKSByZXR1cm47XG5cblx0dmFyIGNhbnZhc0VsZW0gPSBpdGVtU2V0dGluZ3MuY2FudmFzRWxlbTtcblx0dmFyIGNhbnZhcyA9IGl0ZW1TZXR0aW5ncy5jYW52YXM7XG5cdHZhciBzY3JhdGNoLCBjb29yZHM7XG5cblx0aWYgKGUudHlwZSA9PT0gJ3RvdWNobW92ZScpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0c2NyYXRjaCA9IGNvb3JkcyA9IGUudGFyZ2V0VG91Y2hlc1swXTtcblx0fSBlbHNlIHtcblx0XHRzY3JhdGNoID0gZGV0ZWN0TGVmdEJ1dHRvbihlKTtcblx0XHRjb29yZHMgPSBlO1xuXHR9XG5cblx0aWYgKCFzY3JhdGNoICYmICFzZXR0aW5ncy5ub0NsaWNrKSByZXR1cm47XG5cblx0c2NyYXRjaE9mZihjYW52YXNFbGVtLCBjYW52YXMsIGNvb3Jkcywgc2V0dGluZ3MpO1xuXG5cdGlmICghcmVhZHlUb0NvbXBsZXRlKGNhbnZhc0VsZW0sIHNldHRpbmdzKSkgcmV0dXJuO1xuXG5cdGNsZWFyQ2FudmFzKGNhbnZhc0VsZW0sIGNhbnZhcyk7XG5cblx0aXRlbVNldHRpbmdzLmNvbXBsZXRlZCA9IHRydWU7XG5cblx0c2V0dGluZ3Mub25Db21wbGV0ZShzY3JhdGNoSXRlbSk7XG5cdGl0ZW1TZXR0aW5ncy5vbkNvbXBsZXRlKHNjcmF0Y2hJdGVtKTtcblxuXHRpZiAoc2V0dGluZ3MubG90dG9Nb2RlICYmICFpdGVtU2V0dGluZ3MubG90dG9XaW5uZXIpIHtcblx0XHRoYW5kbGVBbnN3ZXIoZmFsc2UpO1xuXHR9XG5cblx0aWYgKCFhbGxTY3JhdGNoZWQoc2V0dGluZ3MuaXRlbXMsIHNldHRpbmdzKSkgcmV0dXJuO1xuXG5cdHNldHRpbmdzLm9uV2luKCk7XG59XG5cbmZ1bmN0aW9uIHJlc2V0U2NyYXRjaChzY3JhdGNoSXRlbXMsIHNldHRpbmdzKSB7XG5cdHZhciBzY3JhdGNoSXRlbXMgPSBzY3JhdGNoSXRlbXMgPyBzY3JhdGNoSXRlbXMgOiBnbG9iYWxWYXIuc2xpZGUuJGRvbS5maW5kKCcuc2NyYXRjaF9fanMnKTtcblx0dmFyIHNldHRpbmdzID0gc2V0dGluZ3MgPyBzZXR0aW5ncyA6IGdsb2JhbFZhci5zbGlkZS5kYXRhLnNjcmF0Y2g7XG5cblx0c2NyYXRjaEl0ZW1zLmVhY2goZnVuY3Rpb24gKGksIHNjcmF0Y2hJdGVtKSB7XG5cdFx0dmFyIGl0ZW1JRCA9IHNjcmF0Y2hJdGVtLmlkIHx8IGkgKyAxO1xuXHRcdHZhciBpdGVtU2V0dGluZ3MgPSBzZXR0aW5ncy5pdGVtc1tpdGVtSURdO1xuXG5cdFx0aXRlbVNldHRpbmdzLmNvbXBsZXRlZCA9IGZhbHNlO1xuXG5cdFx0cmVzaXplQ2FudmFzKHNjcmF0Y2hJdGVtLCBzZXR0aW5ncywgaXRlbVNldHRpbmdzKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGFsbFNjcmF0Y2hlZChpdGVtc09iaiwgc2V0dGluZ3MpIHtcblx0Zm9yICh2YXIgaXRlbSBpbiBpdGVtc09iaikge1xuXHRcdHZhciBpdGVtU2V0dGluZ3MgPSBpdGVtc09ialtpdGVtXTtcblxuXHRcdGlmIChzZXR0aW5ncy5sb3R0b01vZGUpIHtcblx0XHRcdGlmIChpdGVtU2V0dGluZ3MubG90dG9XaW5uZXIgJiYgIWl0ZW1TZXR0aW5ncy5jb21wbGV0ZWQpIHJldHVybiBmYWxzZTtcblx0XHR9IGVsc2UgaWYgKCFpdGVtU2V0dGluZ3MuY29tcGxldGVkKSByZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRyZXR1cm4gdHJ1ZTtcbn1cbmZ1bmN0aW9uIHJlYWR5VG9Db21wbGV0ZShjYW52YXNFbGVtLCBzZXR0aW5ncykge1xuXHRyZXR1cm4gcGVyY2VudENvbXBsZXRlKGNhbnZhc0VsZW0pID4gc2V0dGluZ3MucGVyY2VudGFnZVRvQ29tcGxldGU7XG59XG5mdW5jdGlvbiBzY3JhdGNoT2ZmKGNhbnZhc0VsZW0sIGNhbnZhcywgZSwgc2V0dGluZ3MpIHtcblx0dmFyIGJydXNoUG9zID0gZ2V0QnJ1c2hQb3MoY2FudmFzRWxlbSwgZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuXG5cdGRyYXdEb3QoY2FudmFzRWxlbSwgY2FudmFzLCBicnVzaFBvcywgc2V0dGluZ3MuYnJ1c2hTaXplKTtcbn1cbmZ1bmN0aW9uIHBlcmNlbnRDb21wbGV0ZShjYW52YXMpIHtcblx0dmFyIGRhdGEgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5nZXRJbWFnZURhdGEoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KS5kYXRhO1xuXHR2YXIgZGF0YUFyciA9IG1ha2VUcnVlQXJyYXkoZGF0YSk7XG5cdHZhciBibGFua25lc3MgPSBkYXRhQXJyLnJlZHVjZSgoYWNjdW11bGF0b3IsIGN1cnJlbnRWYWx1ZSkgPT4gYWNjdW11bGF0b3IgKyAoY3VycmVudFZhbHVlID09PSAwID8gMSA6IDApKTtcblxuXHRyZXR1cm4gKGJsYW5rbmVzcyAqIDEwMCkgLyBkYXRhLmxlbmd0aDtcbn1cbmZ1bmN0aW9uIGdldEJydXNoUG9zKGNhbnZhc0VsZW0sIHhSZWYsIHlSZWYpIHtcblx0dmFyIGNhbnZhc1JlY3QgPSBjYW52YXNFbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRyZXR1cm4ge1xuXHRcdHg6IE1hdGguZmxvb3IoKCh4UmVmIC0gY2FudmFzUmVjdC5sZWZ0KSAvIChjYW52YXNSZWN0LnJpZ2h0IC0gY2FudmFzUmVjdC5sZWZ0KSkgKiBjYW52YXNFbGVtLndpZHRoKSxcblx0XHR5OiBNYXRoLmZsb29yKCgoeVJlZiAtIGNhbnZhc1JlY3QudG9wKSAvIChjYW52YXNSZWN0LmJvdHRvbSAtIGNhbnZhc1JlY3QudG9wKSkgKiBjYW52YXNFbGVtLmhlaWdodClcblx0fTtcbn1cbmZ1bmN0aW9uIGNsZWFyQ2FudmFzKGNhbnZhc0VsZW0sIGNhbnZhcykge1xuXHRjYW52YXMuYmVnaW5QYXRoKCk7XG5cdGNhbnZhcy5yZWN0KDAsIDAsIGNhbnZhc0VsZW0ud2lkdGgsIGNhbnZhc0VsZW0uaGVpZ2h0KTtcblx0Y2FudmFzLmZpbGxTdHlsZSA9ICcjMDAwJztcblx0Y2FudmFzLmZpbGwoKTtcbn1cbmZ1bmN0aW9uIGRyYXdEb3QoY2FudmFzRWxlbSwgY2FudmFzLCBicnVzaFBvcywgYnJ1c2hTaXplKSB7XG5cdGNhbnZhcy5iZWdpblBhdGgoKTtcblx0Y2FudmFzLmFyYyhicnVzaFBvcy54LCBicnVzaFBvcy55LCBjYWxjQnJ1c2hTaXplKGNhbnZhc0VsZW0ud2lkdGgsIGJydXNoU2l6ZSksIDAsIDIgKiBNYXRoLlBJLCB0cnVlKTtcblx0Y2FudmFzLmZpbGxTdHlsZSA9ICcjMDAwJztcblx0Y2FudmFzLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdkZXN0aW5hdGlvbi1vdXQnO1xuXHRjYW52YXMuZmlsbCgpO1xuXG5cdC8vIHZhciBpbWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3Ryb2tlJyk7XG5cdC8vIGNhbnZhcy50cmFuc2xhdGUoYnJ1c2hQb3MueCArIDIwLCBicnVzaFBvcy55ICsgMTApO1xuXHQvLyBjYW52YXMucm90YXRlKCgyICogTWF0aC5QSSkgLyAxODApO1xuXHQvLyBjYW52YXMudHJhbnNsYXRlKChicnVzaFBvcy54ICsgMjApICogLTEsIChicnVzaFBvcy55ICsgMTApICogLTEpO1xuXHQvLyBjYW52YXMuZHJhd0ltYWdlKGltZywgYnJ1c2hQb3MueCwgYnJ1c2hQb3MueSwgNDAsIDIwKTtcbn1cbmZ1bmN0aW9uIHJlc2l6ZUNhbnZhcyhzY3JhdGNoSXRlbSwgc2V0dGluZ3MsIGl0ZW1TZXR0aW5ncykge1xuXHR2YXIgY2FudmFzRWxlbSA9IGl0ZW1TZXR0aW5ncy5jYW52YXNFbGVtO1xuXHR2YXIgY2FudmFzID0gaXRlbVNldHRpbmdzLmNhbnZhcztcblxuXHQkKGNhbnZhc0VsZW0pLmNzcygndG9wJywgc2NyYXRjaEl0ZW0ub2Zmc2V0VG9wKTtcblx0JChjYW52YXNFbGVtKS5jc3MoJ2xlZnQnLCBzY3JhdGNoSXRlbS5vZmZzZXRMZWZ0KTtcblx0Y2FudmFzLmNhbnZhcy53aWR0aCA9IHNjcmF0Y2hJdGVtLm9mZnNldFdpZHRoO1xuXHRjYW52YXMuY2FudmFzLmhlaWdodCA9IHNjcmF0Y2hJdGVtLm9mZnNldEhlaWdodDtcblxuXHRpZiAoIWl0ZW1TZXR0aW5ncy5jb21wbGV0ZWQpIHJlc2V0Q2FudmFzKHNldHRpbmdzLCBpdGVtU2V0dGluZ3MpO1xufVxuZnVuY3Rpb24gcmVzZXRDYW52YXMoc2V0dGluZ3MsIGl0ZW1TZXR0aW5ncykge1xuXHR2YXIgY2FudmFzRWxlbSA9IGl0ZW1TZXR0aW5ncy5jYW52YXNFbGVtO1xuXHR2YXIgY2FudmFzID0gaXRlbVNldHRpbmdzLmNhbnZhcztcblx0dmFyIGZpbGxDb2xvciA9IGl0ZW1TZXR0aW5ncy5maWxsQ29sb3IgfHwgc2V0dGluZ3MuZmlsbENvbG9yO1xuXHR2YXIgZmlsbEltZyA9IGl0ZW1TZXR0aW5ncy5maWxsSW1nIHx8IHNldHRpbmdzLmZpbGxJbWc7XG5cblx0Y2FudmFzRmlsbENvbG9yKGNhbnZhc0VsZW0sIGNhbnZhcywgZmlsbENvbG9yKTtcblx0aWYgKGZpbGxJbWcpIGNhbnZhc0ltZyhjYW52YXNFbGVtLCBjYW52YXMsIGZpbGxJbWcsIHNldHRpbmdzLCBpdGVtU2V0dGluZ3MpO1xufVxuZnVuY3Rpb24gZGV0ZWN0TGVmdEJ1dHRvbihldmVudCkge1xuXHRpZiAoJ2J1dHRvbnMnIGluIGV2ZW50KSB7XG5cdFx0cmV0dXJuIGV2ZW50LmJ1dHRvbnMgPT09IDE7XG5cdH0gZWxzZSBpZiAoJ3doaWNoJyBpbiBldmVudCkge1xuXHRcdHJldHVybiBldmVudC53aGljaCA9PT0gMTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gZXZlbnQuYnV0dG9uID09PSAxO1xuXHR9XG59XG5mdW5jdGlvbiBjYWxjQnJ1c2hTaXplKGNhbnZhc1dpZHRoLCBicnVzaFNpemUpIHtcblx0cmV0dXJuIChjYW52YXNXaWR0aCAvIDEwMCkgKiBicnVzaFNpemU7XG59XG5mdW5jdGlvbiB3aW5uaW5nU2NyYXRjaChsb3R0b0Fuc3dlcnMsIGl0ZW1JRCkge1xuXHRyZXR1cm4gbG90dG9BbnN3ZXJzLnNvbWUoZnVuY3Rpb24gKGlkKSB7XG5cdFx0cmV0dXJuIGlkID09PSBpdGVtSUQ7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBjYW52YXNGaWxsQ29sb3IoY2FudmFzRWxlbSwgY2FudmFzLCBjb2xvcikge1xuXHRjYW52YXMuYmVnaW5QYXRoKCk7XG5cdGNhbnZhcy5yZWN0KDAsIDAsIGNhbnZhc0VsZW0ud2lkdGgsIGNhbnZhc0VsZW0uaGVpZ2h0KTtcblx0Y2FudmFzLmZpbGxTdHlsZSA9IGNvbG9yO1xuXHRjYW52YXMuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdmVyJztcblx0Y2FudmFzLmZpbGwoKTtcbn1cblxuZnVuY3Rpb24gY2FudmFzSW1nKGNhbnZhc0VsZW0sIGNhbnZhcywgaW1nUGF0aCwgc2V0dGluZ3MsIGl0ZW1TZXR0aW5ncykge1xuXHR2YXIgaW1nID0gbmV3IEltYWdlKCk7XG5cblx0Y2FudmFzLmRyYXdJbWFnZShpbWcsIDEwLCAxMCk7XG5cblx0aW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgbWVhc3VyZW1lbnRzID0gY2FsY01lYXN1cmVtZW50cyhjYW52YXNFbGVtLCBpbWcsIHNldHRpbmdzLCBpdGVtU2V0dGluZ3MpO1xuXG5cdFx0Y2FudmFzLmRyYXdJbWFnZShpbWcsIG1lYXN1cmVtZW50cy54LCBtZWFzdXJlbWVudHMueSwgbWVhc3VyZW1lbnRzLndpZHRoLCBtZWFzdXJlbWVudHMuaGVpZ2h0KTtcblx0fTtcblxuXHRpbWcuc3JjID0gaW1nUGF0aDtcbn1cblxuZnVuY3Rpb24gY2FsY01lYXN1cmVtZW50cyhjYW52YXNFbGVtLCBpbWcsIHNldHRpbmdzLCBpdGVtU2V0dGluZ3MpIHtcblx0dmFyIHgsIHk7XG5cblx0dmFyIHBvcyA9IHBhcnNlUG9zaXRpb25pbmcoY2FudmFzRWxlbSwgc2V0dGluZ3MsIGl0ZW1TZXR0aW5ncyk7XG5cdHZhciBwYWRkaW5nID0gcGFyc2VQYWRkaW5nKGNhbnZhc0VsZW0sIHNldHRpbmdzLnBhZGRpbmcsIGl0ZW1TZXR0aW5ncy5wYWRkaW5nKTtcblx0dmFyIGRlc2lyZWREaW1lbnNpb25zID0gcGFyc2VEaW1lbnNpb25zKGNhbnZhc0VsZW0sIGltZywgc2V0dGluZ3MsIGl0ZW1TZXR0aW5ncyk7XG5cdHZhciBhdmFpbGFibGVEaW1lbnNpb25zID0ge1xuXHRcdHdpZHRoOiBjYW52YXNFbGVtLndpZHRoIC0gKHBhZGRpbmcucmlnaHQgKyBwYWRkaW5nLmxlZnQpLFxuXHRcdGhlaWdodDogY2FudmFzRWxlbS5oZWlnaHQgLSAocGFkZGluZy50b3AgKyBwYWRkaW5nLmJvdHRvbSlcblx0fTtcblx0dmFyIGNvbWJpbmVkRGltZW5zaW9ucyA9IGNvbWJpbmVEaW1lbnNpb25zKGF2YWlsYWJsZURpbWVuc2lvbnMsIGRlc2lyZWREaW1lbnNpb25zKTtcblx0dmFyIGRpbWVuc2lvbnMgPSBjYWxjV2lkdGhIZWlnaHQoY29tYmluZWREaW1lbnNpb25zLndpZHRoLCBjb21iaW5lZERpbWVuc2lvbnMuaGVpZ2h0LCBpbWcpO1xuXG5cdHggPSBwYXJzZVBvc2l0aW9uKHBvcy5sZWZ0LCBjYWxjTWlkZGxlKGF2YWlsYWJsZURpbWVuc2lvbnMud2lkdGgsIGRpbWVuc2lvbnMud2lkdGgpICsgcGFkZGluZy5sZWZ0KTtcblx0eSA9IHBhcnNlUG9zaXRpb24ocG9zLnRvcCwgY2FsY01pZGRsZShhdmFpbGFibGVEaW1lbnNpb25zLmhlaWdodCwgZGltZW5zaW9ucy5oZWlnaHQpICsgcGFkZGluZy50b3ApO1xuXG5cdHJldHVybiB7XG5cdFx0eDogeCxcblx0XHR5OiB5LFxuXHRcdGhlaWdodDogZGltZW5zaW9ucy5oZWlnaHQsXG5cdFx0d2lkdGg6IGRpbWVuc2lvbnMud2lkdGhcblx0fTtcbn1cblxuZnVuY3Rpb24gcGFyc2VQb3NpdGlvbmluZyhjYW52YXNFbGVtLCBzZXR0aW5ncywgaXRlbVNldHRpbmdzKSB7XG5cdHZhciB0b3BQZXJjZW50YWdlID0gcGFyc2VQb3NpdGlvbihpdGVtU2V0dGluZ3MudG9wLCBzZXR0aW5ncy50b3ApO1xuXHR2YXIgbGVmdFBlcmNlbnRhZ2UgPSBwYXJzZVBvc2l0aW9uKGl0ZW1TZXR0aW5ncy5sZWZ0LCBzZXR0aW5ncy5sZWZ0KTtcblxuXHRyZXR1cm4ge1xuXHRcdHRvcDogdG9wUGVyY2VudGFnZSAhPT0gdW5kZWZpbmVkID8gY2FudmFzRWxlbS5oZWlnaHQgKiAodG9wUGVyY2VudGFnZSAvIDEwMCkgOiB1bmRlZmluZWQsXG5cdFx0bGVmdDogbGVmdFBlcmNlbnRhZ2UgIT09IHVuZGVmaW5lZCA/IGNhbnZhc0VsZW0ud2lkdGggKiAobGVmdFBlcmNlbnRhZ2UgLyAxMDApIDogdW5kZWZpbmVkXG5cdH07XG59XG5mdW5jdGlvbiBwYXJzZVBvc2l0aW9uKHBvczEsIHBvczIpIHtcblx0aWYgKHBvczEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBwb3MxO1xuXHR9IGVsc2UgaWYgKHBvczIgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBwb3MyO1xuXHR9IGVsc2UgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gY29tYmluZURpbWVuc2lvbnMoYXZhaWxhYmxlRGltZW5zaW9ucywgZGVzaXJlZERpbWVuc2lvbnMpIHtcblx0cmV0dXJuIHtcblx0XHR3aWR0aDpcblx0XHRcdGRlc2lyZWREaW1lbnNpb25zLndpZHRoIDw9IGF2YWlsYWJsZURpbWVuc2lvbnMud2lkdGggPyBkZXNpcmVkRGltZW5zaW9ucy53aWR0aCA6IGF2YWlsYWJsZURpbWVuc2lvbnMud2lkdGgsXG5cdFx0aGVpZ2h0OlxuXHRcdFx0ZGVzaXJlZERpbWVuc2lvbnMuaGVpZ2h0IDw9IGF2YWlsYWJsZURpbWVuc2lvbnMuaGVpZ2h0XG5cdFx0XHRcdD8gZGVzaXJlZERpbWVuc2lvbnMuaGVpZ2h0XG5cdFx0XHRcdDogYXZhaWxhYmxlRGltZW5zaW9ucy5oZWlnaHRcblx0fTtcbn1cblxuZnVuY3Rpb24gcGFyc2VEaW1lbnNpb25zKGNhbnZhc0VsZW0sIGltZywgc2V0dGluZ3MsIGl0ZW1TZXR0aW5ncykge1xuXHR2YXIgZGltZW5zaW9ucztcblx0dmFyIHdpZHRoID0gaXRlbVNldHRpbmdzLndpZHRoIHx8IHNldHRpbmdzLndpZHRoO1xuXHR2YXIgaGVpZ2h0ID0gaXRlbVNldHRpbmdzLmhlaWdodCB8fCBzZXR0aW5ncy5oZWlnaHQ7XG5cblx0aWYgKCF3aWR0aCAmJiAhaGVpZ2h0KSB7XG5cdFx0ZGltZW5zaW9ucyA9IHsgd2lkdGg6IGNhbnZhc0VsZW0ud2lkdGgsIGhlaWdodDogY2FudmFzRWxlbS5oZWlnaHQgfTtcblx0fSBlbHNlIGlmICh3aWR0aCAmJiAhaGVpZ2h0KSB7XG5cdFx0dmFyIGRlc2lyZWRXaWR0aCA9IGNhbnZhc0VsZW0ud2lkdGggKiAod2lkdGggLyAxMDApO1xuXHRcdGRpbWVuc2lvbnMgPSByZXNpemVEaW1lbnNpb24oZGVzaXJlZFdpZHRoLCBpbWcpO1xuXHR9IGVsc2UgaWYgKGhlaWdodCAmJiAhd2lkdGgpIHtcblx0XHR2YXIgZGVzaXJlZEhlaWdodCA9IGNhbnZhc0VsZW0uaGVpZ2h0ICogKGhlaWdodCAvIDEwMCk7XG5cdFx0ZGltZW5zaW9ucyA9IHJlc2l6ZURpbWVuc2lvbihkZXNpcmVkSGVpZ2h0LCBpbWcpO1xuXHR9IGVsc2Uge1xuXHRcdGRpbWVuc2lvbnMgPSB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQgfTtcblx0fVxuXHRyZXR1cm4gZGltZW5zaW9ucztcbn1cblxuZnVuY3Rpb24gcmVzaXplRGltZW5zaW9uKGRlc2lyZWREaW1lbnNpb24sIGltZykge1xuXHR2YXIgZGltZW5zaW9ucyA9IHt9O1xuXHR2YXIgcGVyY2VudGFnZUxhcmdlciA9IGNhbGNQZXJjZW50YWdlTGFyZ2VyKGRlc2lyZWREaW1lbnNpb24sIGltZy53aWR0aCk7XG5cblx0aWYgKHBlcmNlbnRhZ2VMYXJnZXIgPiAwKSB7XG5cdFx0ZGltZW5zaW9ucy53aWR0aCA9IGRlY3JlYXNlQnlQZXJjZW50YWdlKGltZy53aWR0aCwgcGVyY2VudGFnZUxhcmdlcik7XG5cdFx0ZGltZW5zaW9ucy5oZWlnaHQgPSBkZWNyZWFzZUJ5UGVyY2VudGFnZShpbWcuaGVpZ2h0LCBwZXJjZW50YWdlTGFyZ2VyKTtcblx0fSBlbHNlIHtcblx0XHRkaW1lbnNpb25zLndpZHRoID0gLWluY3JlYXNlQnlQZXJjZW50YWdlKGltZy53aWR0aCwgcGVyY2VudGFnZUxhcmdlcik7XG5cdFx0ZGltZW5zaW9ucy5oZWlnaHQgPSAtaW5jcmVhc2VCeVBlcmNlbnRhZ2UoaW1nLmhlaWdodCwgcGVyY2VudGFnZUxhcmdlcik7XG5cdH1cblxuXHRyZXR1cm4gZGltZW5zaW9ucztcbn1cblxuZnVuY3Rpb24gY2FsY1dpZHRoSGVpZ2h0KGF2YWlsYWJsZVdpZHRoLCBhdmFpbGFibGVIZWlnaHQsIGltZykge1xuXHR2YXIgZGltZW5zaW9ucyA9IHt9O1xuXHR2YXIgcGVyY2VudGFnZVdpZGVyID0gY2FsY1BlcmNlbnRhZ2VMYXJnZXIoYXZhaWxhYmxlV2lkdGgsIGltZy53aWR0aCk7XG5cdHZhciBwZXJjZW50YWdlVGFsbGVyID0gY2FsY1BlcmNlbnRhZ2VMYXJnZXIoYXZhaWxhYmxlSGVpZ2h0LCBpbWcuaGVpZ2h0KTtcblxuXHRpZiAocGVyY2VudGFnZVdpZGVyID4gMCAmJiBwZXJjZW50YWdlVGFsbGVyID4gMCkge1xuXHRcdHZhciBncmVhdGVyUGVyY2VudGFnZSA9IHBlcmNlbnRhZ2VUYWxsZXIgPiBwZXJjZW50YWdlV2lkZXIgPyBwZXJjZW50YWdlVGFsbGVyIDogcGVyY2VudGFnZVdpZGVyO1xuXHRcdGRpbWVuc2lvbnMud2lkdGggPSBkZWNyZWFzZUJ5UGVyY2VudGFnZShpbWcud2lkdGgsIGdyZWF0ZXJQZXJjZW50YWdlKTtcblx0XHRkaW1lbnNpb25zLmhlaWdodCA9IGRlY3JlYXNlQnlQZXJjZW50YWdlKGltZy5oZWlnaHQsIGdyZWF0ZXJQZXJjZW50YWdlKTtcblx0fSBlbHNlIGlmIChwZXJjZW50YWdlV2lkZXIgPiAwKSB7XG5cdFx0ZGltZW5zaW9ucy53aWR0aCA9IGRlY3JlYXNlQnlQZXJjZW50YWdlKGltZy53aWR0aCwgcGVyY2VudGFnZVdpZGVyKTtcblx0XHRkaW1lbnNpb25zLmhlaWdodCA9IGRlY3JlYXNlQnlQZXJjZW50YWdlKGltZy5oZWlnaHQsIHBlcmNlbnRhZ2VXaWRlcik7XG5cdH0gZWxzZSBpZiAocGVyY2VudGFnZVRhbGxlciA+IDApIHtcblx0XHRkaW1lbnNpb25zLndpZHRoID0gZGVjcmVhc2VCeVBlcmNlbnRhZ2UoaW1nLndpZHRoLCBwZXJjZW50YWdlVGFsbGVyKTtcblx0XHRkaW1lbnNpb25zLmhlaWdodCA9IGRlY3JlYXNlQnlQZXJjZW50YWdlKGltZy5oZWlnaHQsIHBlcmNlbnRhZ2VUYWxsZXIpO1xuXHR9IGVsc2Uge1xuXHRcdHZhciBzbWFsbGVyUGVyY2VudGFnZSA9IHBlcmNlbnRhZ2VUYWxsZXIgPCBwZXJjZW50YWdlV2lkZXIgPyBwZXJjZW50YWdlVGFsbGVyIDogcGVyY2VudGFnZVdpZGVyO1xuXHRcdGRpbWVuc2lvbnMud2lkdGggPSAtaW5jcmVhc2VCeVBlcmNlbnRhZ2UoaW1nLndpZHRoLCBzbWFsbGVyUGVyY2VudGFnZSk7XG5cdFx0ZGltZW5zaW9ucy5oZWlnaHQgPSAtaW5jcmVhc2VCeVBlcmNlbnRhZ2UoaW1nLmhlaWdodCwgc21hbGxlclBlcmNlbnRhZ2UpO1xuXHR9XG5cblx0cmV0dXJuIGRpbWVuc2lvbnM7XG59XG5cbmZ1bmN0aW9uIGNhbGNQZXJjZW50YWdlTGFyZ2VyKG51bTEsIG51bTIpIHtcblx0cmV0dXJuICgobnVtMiAtIG51bTEpIC8gbnVtMikgKiAxMDA7XG59XG5mdW5jdGlvbiBkZWNyZWFzZUJ5UGVyY2VudGFnZShudW0sIHBlcmNlbnRhZ2UpIHtcblx0cmV0dXJuIG51bSAtIChudW0gLyAxMDApICogcGVyY2VudGFnZTtcbn1cbmZ1bmN0aW9uIGluY3JlYXNlQnlQZXJjZW50YWdlKG51bSwgcGVyY2VudGFnZSkge1xuXHRyZXR1cm4gbnVtICsgKG51bSAvIDEwMCkgKiBwZXJjZW50YWdlO1xufVxuZnVuY3Rpb24gY2FsY01pZGRsZShudW0xLCBudW0yKSB7XG5cdHJldHVybiBudW0xIC8gMiAtIG51bTIgLyAyO1xufVxuZnVuY3Rpb24gcGFyc2VQYWRkaW5nKGNhbnZhc0VsZW0sIG1hc3RlclBhZGRpbmcsIGl0ZW1QYWRkaW5nKSB7XG5cdHZhciBwYWRkaW5nVG9QYXJzZSA9IGl0ZW1QYWRkaW5nIHx8IG1hc3RlclBhZGRpbmc7XG5cdHZhciBwYWRkaW5nO1xuXG5cdHZhciBwYWRkaW5nQXJyID0gcGFkZGluZ1RvUGFyc2Uuc3BsaXQoJyAnKS5tYXAoZnVuY3Rpb24gKHBhZCkge1xuXHRcdHJldHVybiBwYXJzZUludChwYWQpIC8gMTAwO1xuXHR9KTtcblx0c3dpdGNoIChwYWRkaW5nQXJyLmxlbmd0aCkge1xuXHRcdGNhc2UgMjpcblx0XHRcdHBhZGRpbmcgPSB7XG5cdFx0XHRcdHRvcDogY2FudmFzRWxlbS5oZWlnaHQgKiBwYWRkaW5nQXJyWzBdLFxuXHRcdFx0XHRyaWdodDogY2FudmFzRWxlbS53aWR0aCAqIHBhZGRpbmdBcnJbMV0sXG5cdFx0XHRcdGJvdHRvbTogY2FudmFzRWxlbS5oZWlnaHQgKiBwYWRkaW5nQXJyWzBdLFxuXHRcdFx0XHRsZWZ0OiBjYW52YXNFbGVtLndpZHRoICogcGFkZGluZ0FyclsxXVxuXHRcdFx0fTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgMzpcblx0XHRcdHBhZGRpbmcgPSB7XG5cdFx0XHRcdHRvcDogY2FudmFzRWxlbS5oZWlnaHQgKiBwYWRkaW5nQXJyWzBdLFxuXHRcdFx0XHRyaWdodDogY2FudmFzRWxlbS53aWR0aCAqIHBhZGRpbmdBcnJbMV0sXG5cdFx0XHRcdGJvdHRvbTogY2FudmFzRWxlbS5oZWlnaHQgKiBwYWRkaW5nQXJyWzJdLFxuXHRcdFx0XHRsZWZ0OiBjYW52YXNFbGVtLndpZHRoICogcGFkZGluZ0FyclsxXVxuXHRcdFx0fTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgNDpcblx0XHRcdHBhZGRpbmcgPSB7XG5cdFx0XHRcdHRvcDogY2FudmFzRWxlbS5oZWlnaHQgKiBwYWRkaW5nQXJyWzBdLFxuXHRcdFx0XHRyaWdodDogY2FudmFzRWxlbS53aWR0aCAqIHBhZGRpbmdBcnJbMV0sXG5cdFx0XHRcdGJvdHRvbTogY2FudmFzRWxlbS5oZWlnaHQgKiBwYWRkaW5nQXJyWzJdLFxuXHRcdFx0XHRsZWZ0OiBjYW52YXNFbGVtLndpZHRoICogcGFkZGluZ0FyclszXVxuXHRcdFx0fTtcblxuXHRcdFx0YnJlYWs7XG5cdFx0ZGVmYXVsdDpcblx0XHRcdHBhZGRpbmcgPSB7XG5cdFx0XHRcdHRvcDogY2FudmFzRWxlbS5oZWlnaHQgKiBwYWRkaW5nQXJyWzBdLFxuXHRcdFx0XHRyaWdodDogY2FudmFzRWxlbS53aWR0aCAqIHBhZGRpbmdBcnJbMF0sXG5cdFx0XHRcdGJvdHRvbTogY2FudmFzRWxlbS5oZWlnaHQgKiBwYWRkaW5nQXJyWzBdLFxuXHRcdFx0XHRsZWZ0OiBjYW52YXNFbGVtLndpZHRoICogcGFkZGluZ0FyclswXVxuXHRcdFx0fTtcblxuXHRcdFx0YnJlYWs7XG5cdH1cblx0cmV0dXJuIHBhZGRpbmc7XG59XG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8qRmVhdHVyZTpTb3J0YWJsZXMvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiBzb3J0RnVuY3Rpb25zKCkge1xuXHR2YXIgc2xpZGUgPSBnbG9iYWxWYXIuc2xpZGU7XG5cdC8vIGZpcnN0IHZpc2l0IHNldHVwXG5cdC8vIGFzc2lnbnMgb3JpZ2luYWwgcG9zaXRpb25zIGluIG9yZGVyIHRvIG1ha2UgcmVzZXQgd29ya1xuXHR2YXIgeyBkYXRhIH0gPSBzbGlkZTtcblx0aWYgKGNoZWNrTG9ja1N1Ym1pdElmVW5hdHRlbXB0ZWQoZGF0YSkpIGxvY2tCdXR0b25Ob3dVbmxvY2tPbkV4aXQoJCgnI3NpLXN1Ym1pdCcpLCBzbGlkZS5kYXRhKTtcblx0aWYgKHNsaWRlLmRhdGEudmlzaXRlZCA9PT0gZmFsc2UpIHtcblx0XHR2YXIgJHNvcnRhYmxlcyA9IGdsb2JhbFZhci4kY3VyU2xpZGUuZmluZCgnLnNvcnRhYmxlJyk7XG5cdFx0JHNvcnRhYmxlcy5lYWNoKGZ1bmN0aW9uIChpZHgsIHNvcnRhYmxlKSB7XG5cdFx0XHR2YXIgaWQgPSBzb3J0YWJsZS5pZDtcblxuXHRcdFx0Ly8gaW5pdGlhbGl6ZSBzb3J0YWJsZXMgd2l0aCBvciB3aXRob3V0IG9wdGlvbnNcblx0XHRcdGlmIChzbGlkZS5kYXRhLnNvcnQuc29ydGFibGVzW2lkXSkge1xuXHRcdFx0XHRpZiAoc2xpZGUuZGF0YS5zb3J0LnNvcnRhYmxlc1tpZF0ub3B0aW9ucykge1xuXHRcdFx0XHRcdCQoc29ydGFibGUpLnNvcnRhYmxlKHNsaWRlLmRhdGEuc29ydC5zb3J0YWJsZXNbaWRdLm9wdGlvbnMpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCQoc29ydGFibGUpLnNvcnRhYmxlKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL21ha2VzIGJlZ2lubmluZyBvcmRlciBkZWZhdWx0IGFuc3dlciBpZiBubyBhbnN3ZXIgaXMgZ2l2ZW5cblx0XHRcdFx0aWYgKCFzbGlkZS5kYXRhLnNvcnQuc29ydGFibGVzW2lkXS5hbnN3ZXIpIHtcblx0XHRcdFx0XHRzbGlkZS5kYXRhLnNvcnQuc29ydGFibGVzW2lkXS5hbnN3ZXIgPSAkKHNvcnRhYmxlKS5zb3J0YWJsZSgndG9BcnJheScpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkKHNvcnRhYmxlKS5zb3J0YWJsZSgpO1xuXHRcdFx0XHQkKHNvcnRhYmxlKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0dW5sb2NrKCQoJyNzaS1zdWJtaXQnKSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgc29ydGFibGVFbGVtZW50cyA9ICQoJyMnICsgaWQgKyAnPiBkaXYnKTtcblx0XHRcdC8vIG5lY2Vzc2FyeSB0byBtYWtlIGEgY29weSBvdGhlcndpc2UgcmVhc3NpZ25pbmcgb25lIG9mIHRoZSBkYXRhIGVsZW1lbnRzIG92ZXJ3cml0ZXMgdGhlIG90aGVyXG5cdFx0XHR2YXIgc2h1ZmZsZUVsZW1lbnRzID0gJCgnIycgKyBpZCArICc+IGRpdicpO1xuXG5cdFx0XHQvLyBUaGlzIGhhbmRsZXMga2V5Ym9hcmQgYWNjZXNzaWJpbGl0eSBmb3Igc29ydGFibGVzXG5cblx0XHRcdHNvcnRhYmxlRWxlbWVudHMuZWFjaChmdW5jdGlvbiAoaWR4LCBzb3J0KSB7XG5cdFx0XHRcdHNvcnRLZXlib2FyZChzb3J0LCBzb3J0YWJsZSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0JChzb3J0YWJsZSkuZGF0YSh7XG5cdFx0XHRcdGVsZW1lbnRzOiBzb3J0YWJsZUVsZW1lbnRzLFxuXHRcdFx0XHRzaHVmZmxlOiBzaHVmZmxlRWxlbWVudHNcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0Ly8gcmFuZG9taXplcyBwbGFjZW1lbnQgb2YgZGl2cyBldmVyeSB0aW1lIHRoZSBzbGlkZSBpcyBlbnRlcmVkXG5cdGlmIChzbGlkZS5kYXRhLnNvcnQucmFuZG9taXplID09PSB0cnVlKSB7XG5cdFx0dmFyICRzb3J0YWJsZXMyID0gZ2xvYmFsVmFyLiRjdXJTbGlkZS5maW5kKCcuc29ydGFibGUnKTtcblx0XHQkc29ydGFibGVzMi5lYWNoKGZ1bmN0aW9uIChpZHgsIHNvcnRhYmxlKSB7XG5cdFx0XHR2YXIgZWxlbWVudHMgPSAkKHNvcnRhYmxlKS5kYXRhKCdlbGVtZW50cycpO1xuXHRcdFx0dmFyIHNodWZmbGVBcnIgPSBbXTtcblxuXHRcdFx0Ly8gY3JlYXRlIGFuIGFycmF5IG9mIHVuaXF1ZSByYW5kb20gbnVtYmVycyB0byBzZXJ2ZSBhcyBpbmRpY2VzXG5cdFx0XHR3aGlsZSAoc2h1ZmZsZUFyci5sZW5ndGggPCBlbGVtZW50cy5sZW5ndGgpIHtcblx0XHRcdFx0dmFyIG51bSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnRzLmxlbmd0aCk7XG5cdFx0XHRcdC8vIHRlc3RzIHRoYXQgdGhlIG51bSB2YXJpYWJsZSBoYXMgbm90IGFscmVhZHkgYmVlbiBhZGRlZCB0byB0aGUgYXJyYXlcblx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdCFzaHVmZmxlQXJyLnNvbWUoZnVuY3Rpb24gKGVsKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZWwgPT09IG51bTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHRzaHVmZmxlQXJyLnB1c2gobnVtKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyB1c2UgdGhlIGFycmF5IG9mIHJhbmRvbSBudW1iZXJzIHRvIHJlYXNzaWduIGVsZW1lbnRzIGluIHRoZSBzaHVmZmxlIGRhdGEgYXR0cmlidXRlXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdCQoc29ydGFibGUpLmRhdGEoJ3NodWZmbGUnKVtpXSA9ICQoc29ydGFibGUpLmRhdGEoJ2VsZW1lbnRzJylbc2h1ZmZsZUFycltpXV07XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvLyByYW5kb21pemVzIGFjcm9zcyBjb25uZWN0ZWQgbGlzdHNcblx0aWYgKHNsaWRlLmRhdGEuc29ydC5yYW5kb21pemVDb25uZWN0ICYmIHR5cGVvZiBzbGlkZS5kYXRhLnNvcnQucmFuZG9taXplQ29ubmVjdCA9PT0gJ3N0cmluZycpIHtcblx0XHR2YXIgbGlzdHMgPSAkKCcuJyArIHNsaWRlLmRhdGEuc29ydC5yYW5kb21pemVDb25uZWN0KTtcblx0XHR2YXIgZWxlbWVudEFyciA9IFtdO1xuXHRcdHZhciBzaHVmZmxlZCA9IFtdO1xuXHRcdGxpc3RzLmVhY2goZnVuY3Rpb24gKGlkeCwgbGlzdCkge1xuXHRcdFx0JChsaXN0KVxuXHRcdFx0XHQuZmluZCgnZGl2Jylcblx0XHRcdFx0LmVhY2goZnVuY3Rpb24gKGlkeDIsIGRpdikge1xuXHRcdFx0XHRcdGVsZW1lbnRBcnIucHVzaChkaXYpO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHdoaWxlIChlbGVtZW50QXJyLmxlbmd0aCkge1xuXHRcdFx0dmFyIG51bSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnRBcnIubGVuZ3RoKTtcblx0XHRcdGVsZW1lbnQgPSBlbGVtZW50QXJyLnNwbGljZShudW0sIDEpO1xuXHRcdFx0c2h1ZmZsZWQucHVzaChlbGVtZW50WzBdKTtcblx0XHR9XG5cblx0XHR2YXIgaSA9IDA7XG5cdFx0d2hpbGUgKHNodWZmbGVkLmxlbmd0aCkge1xuXHRcdFx0bGlzdHMuZWFjaChmdW5jdGlvbiAoaWR4LCBsaXN0KSB7XG5cdFx0XHRcdCQobGlzdCkuZGF0YSgnc2h1ZmZsZScpW2ldID0gc2h1ZmZsZWQuc2hpZnQoKTtcblx0XHRcdH0pO1xuXHRcdFx0aSsrO1xuXHRcdH1cblx0fVxuXG5cdHJlc2V0U29ydCgpO1xufVxuXG4vLyByZXNldCB3b3JrcyBmb3IgYm90aCByYW5kb21pemVkIGFuZCBub24tcmFuZG9taXplZCBzb3J0IHNsaWRlcy4gIHlvdSBkbyBub3QgbmVlZCB0byBwdXQgdGhlIHJhbmRvbWl6ZSBrZXkgaWYgeW91IGRvbid0IG5lZWQgaXQuXG4vLyByZXNldCB3aWxsIGVpdGhlciByZXNldCB0byB0aGUgaHRtbCBvcmRlciBvZiBkaXZzIG9yIHRvIHRoZSBjdXJyZW50IHJhbmRvbWl6ZWQgb3JkZXJcbmZ1bmN0aW9uIHJlc2V0U29ydCgpIHtcblx0dmFyIHNsaWRlID0gZ2xvYmFsVmFyLnNsaWRlO1xuXHR2YXIgJHNvcnRhYmxlcyA9IGdsb2JhbFZhci4kY3VyU2xpZGUuZmluZCgnLnNvcnRhYmxlJyk7XG5cdCRzb3J0YWJsZXMuZWFjaChmdW5jdGlvbiAoaWR4LCBzb3J0YWJsZSkge1xuXHRcdGlmIChzbGlkZS5kYXRhLnNvcnQucmFuZG9taXplQ29ubmVjdCkge1xuXHRcdFx0JChzb3J0YWJsZSkuYXBwZW5kKCQoc29ydGFibGUpLmRhdGEoJ3NodWZmbGUnKSk7XG5cdFx0fSBlbHNlIGlmIChzbGlkZS5kYXRhLnNvcnQucmFuZG9taXplID09PSBmYWxzZSB8fCBzbGlkZS5kYXRhLnNvcnQucmFuZG9taXplID09PSB1bmRlZmluZWQpIHtcblx0XHRcdCQoc29ydGFibGUpLmFwcGVuZCgkKHNvcnRhYmxlKS5kYXRhKCdlbGVtZW50cycpKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JChzb3J0YWJsZSkuYXBwZW5kKCQoc29ydGFibGUpLmRhdGEoJ3NodWZmbGUnKSk7XG5cdFx0fVxuXHR9KTtcblxuXHR2YXIgeyBkYXRhIH0gPSBzbGlkZTtcblx0aWYgKGNoZWNrTG9ja1N1Ym1pdElmVW5hdHRlbXB0ZWQoZGF0YSkpIGxvY2tCdXR0b25Ob3dVbmxvY2tPbkV4aXQoJCgnI3NpLXN1Ym1pdCwgI3NpLWN1c3RvbS1zdWJtaXQnKSwgZGF0YSk7XG59XG5cbi8vIGFjY2Vzc2liaWxpdHkgZnVuY3Rpb25cbmZ1bmN0aW9uIHNvcnRLZXlib2FyZChzb3J0SXRlbSwgc29ydExpc3QpIHtcblx0dmFyIGNvbm5lY3RlZCA9ICQoc29ydExpc3QpLnNvcnRhYmxlKCdvcHRpb24nLCAnY29ubmVjdFdpdGgnKTtcblxuXHQkKHNvcnRJdGVtKVxuXHRcdC5hdHRyKCd0YWJpbmRleCcsIDApXG5cdFx0Lm9uKCdrZXlkb3duJywgZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0XHRpZiAoZXZlbnQud2hpY2ggPT09IDg3IHx8IGV2ZW50LndoaWNoID09PSA2NSkge1xuXHRcdFx0XHQvLyBsZWZ0IG9yIHVwIG9uZSBzcGFjZSAoJ3cnLCAnYScpXG5cdFx0XHRcdCQodGhpcykuaW5zZXJ0QmVmb3JlKCQodGhpcykucHJldigpKTtcblx0XHRcdH1cblx0XHRcdGlmIChldmVudC53aGljaCA9PT0gODMgfHwgZXZlbnQud2hpY2ggPT09IDY4KSB7XG5cdFx0XHRcdC8vIHJpZ2h0IG9yIGRvd24gb25lIHNwYWNlICgncycsJ2QnKVxuXHRcdFx0XHQkKHRoaXMpLmluc2VydEFmdGVyKCQodGhpcykubmV4dCgpKTtcblx0XHRcdH1cblx0XHRcdGlmIChldmVudC53aGljaCA9PT0gODEpIHtcblx0XHRcdFx0Ly8gXCJxXCIgdG9wIG9mIGxpc3Rcblx0XHRcdFx0JCh0aGlzKS5wYXJlbnQoKS5wcmVwZW5kKCQodGhpcykpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGV2ZW50LndoaWNoID09PSA2OSkge1xuXHRcdFx0XHQvLyBcImVcIiBib3R0b20gb2YgbGlzdFxuXHRcdFx0XHQkKHRoaXMpLnBhcmVudCgpLmFwcGVuZCgkKHRoaXMpKTtcblx0XHRcdH1cblx0XHRcdGlmIChjb25uZWN0ZWQgJiYgZXZlbnQud2hpY2ggPT09IDg4KSB7XG5cdFx0XHRcdC8vICd4JyBtb3ZlIGl0ZW0gdG8gY29ubmVjdGVkIGxpc3RzXG5cdFx0XHRcdHZhciBuZXdMaXN0cyA9IFtdO1xuXHRcdFx0XHR2YXIgcGFyZW50SW5kZXg7XG5cdFx0XHRcdCQoY29ubmVjdGVkKS5lYWNoKGZ1bmN0aW9uIChpZHgsIGxpc3QpIHtcblx0XHRcdFx0XHRpZiAoISQobGlzdCkuZmluZChldmVudC50YXJnZXQpWzBdKSB7XG5cdFx0XHRcdFx0XHRuZXdMaXN0cy5wdXNoKGxpc3QpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRwYXJlbnRJbmRleCA9IGlkeDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRpZiAobmV3TGlzdHNbcGFyZW50SW5kZXhdKSB7XG5cdFx0XHRcdFx0JChuZXdMaXN0c1twYXJlbnRJbmRleF0pLmFwcGVuZCgkKHRoaXMpKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQkKG5ld0xpc3RzWzBdKS5hcHBlbmQoJCh0aGlzKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdCQodGhpcykuZm9jdXMoKTtcblx0XHR9KTtcbn1cbiIsIi8vLy8vLy8vLy8vLypGZWF0dXJlOk11bHRpcGxlIENob2ljZS9TaW5nbGUgQ2hvaWNlIFF1ZXN0aW9ucy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiByZXNldFF1aXooKSB7XG5cdHZhciB7IGRhdGEsICRkb20gfSA9IGdsb2JhbFZhci5zbGlkZTtcblx0dmFyIGNob2ljZXMgPSAkZG9tLmZpbmQoJy5zaS1xdWl6X19qcyBsaScpO1xuXHRjaG9pY2VzLnJlbW92ZUNsYXNzKCdzaS1xdWl6LXNlbGVjdGVkJyk7XG5cblx0aWYgKGNoZWNrTG9ja1N1Ym1pdElmVW5hdHRlbXB0ZWQoZGF0YSkpIGxvY2tCdXR0b25Ob3dVbmxvY2tPbkV4aXQoJCgnI3NpLXN1Ym1pdCwgI3NpLWN1c3RvbS1zdWJtaXQnKSwgZGF0YSk7XG59XG5mdW5jdGlvbiBpbml0UXVpeigpIHtcblx0ZWFjaFNsaWRlKCh7IGlkLCBkYXRhLCAkZG9tIH0pID0+IHtcblx0XHRpZiAoZGF0YS50eXBlICE9PSAncXVpeicpIHJldHVybjtcblxuXHRcdGlmIChkYXRhLnF1aXoucmFkaW8gPT09ICd1bmRlZmluZWQnKSBkYXRhLnF1aXoucmFkaW8gPSBmYWxzZTtcblx0XHRlbHNlIGlmIChkYXRhLnF1aXoucmFkaW8pICQoYCMke2lkfSAuc2ktcXVpel9fanNgKS5hZGRDbGFzcygnc2ktcmFkaW9fX2pzJyk7XG5cdH0pO1xuXG5cdHZhciBxdWl6emVzID0gJCgnLnNpLXF1aXpfX2pzJyk7XG5cdHZhciBidXR0b25UeXBlID0gZ2xvYmFsVmFyLmJ1dHRvblR5cGU7XG5cdHF1aXp6ZXMuZWFjaChmdW5jdGlvbiAoaWR4LCBxdWl6KSB7XG5cdFx0dmFyICRjaG9pY2VzID0gJChxdWl6KS5maW5kKCdsaScpO1xuXHRcdHZhciBidXR0b25zID0gJChxdWl6KS5maW5kKCdkaXYnKTtcblx0XHR2YXIgaXNSYWRpbyA9ICQocXVpeikuaGFzQ2xhc3MoJ3NpLXJhZGlvX19qcycpID8gdHJ1ZSA6IGZhbHNlO1xuXHRcdCRjaG9pY2VzLmVhY2goZnVuY3Rpb24gKGlkeCwgY2hvaWNlKSB7XG5cdFx0XHQkKGNob2ljZSkuYWRkQ2xhc3MoJ3NpLXF1aXotYW5zd2VyJykuYXR0cigndGFiaW5kZXgnLCAnMCcpO1xuXHRcdFx0JChjaG9pY2UpLm9uKCdjbGljay5xdWl6JywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRxdWl6SGFuZGxlQW5zd2VyU2VsZWN0ZWQoJCh0aGlzKSwgJChxdWl6KSwgJGNob2ljZXMsIGlzUmFkaW8pO1xuXHRcdFx0fSk7XG5cdFx0XHQkKGNob2ljZSkub24oJ2tleXVwLnF1aXonLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGlmIChldmVudC53aGljaCA9PT0gMTMpIHtcblx0XHRcdFx0XHRxdWl6SGFuZGxlQW5zd2VyU2VsZWN0ZWQoJCh0aGlzKSwgJChxdWl6KSwgJGNob2ljZXMsIGlzUmFkaW8pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0XHRidXR0b25zLmVhY2goZnVuY3Rpb24gKGlkeCwgYnV0dG9uKSB7XG5cdFx0XHR2YXIgaW1hZ2UgPSAkKGJ1dHRvbikuY2hpbGRyZW4oKS5lcSgwKTtcblx0XHRcdGlmIChpc1JhZGlvKSB7XG5cdFx0XHRcdCQoaW1hZ2UpLmF0dHIoJ3NyYycsIGZ1bmN0aW9uIChpbmRleCwgYXR0cikge1xuXHRcdFx0XHRcdHJldHVybiBhdHRyLnJlcGxhY2UoJ21jcScsICdzY3EnKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkKGltYWdlKS5hdHRyKCdzcmMnLCBmdW5jdGlvbiAoaW5kZXgsIGF0dHIpIHtcblx0XHRcdFx0XHRyZXR1cm4gYXR0ci5yZXBsYWNlKCdzY3EnLCAnbWNxJyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHQkKGJ1dHRvbilcblx0XHRcdFx0LmZpbmQoJ2ltZycpXG5cdFx0XHRcdC5hdHRyKCdzcmMnLCBmdW5jdGlvbiAoaW5kZXgsIGF0dHIpIHtcblx0XHRcdFx0XHRyZXR1cm4gYXR0ci5yZXBsYWNlKCdjbGFzc2ljJywgYnV0dG9uVHlwZSk7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9KTtcbn1cbmZ1bmN0aW9uIHF1aXpGdW5jdGlvbigpIHtcblx0dmFyIHNsaWRlID0gZ2xvYmFsVmFyLnNsaWRlO1xuXHR2YXIgYW5zd2VycyA9IHNsaWRlLmRhdGFbJ3F1aXonXVsnYW5zd2VycyddO1xuXHR2YXIgJGNob2ljZXMgPSBzbGlkZS4kZG9tLmZpbmQoJy5zaS1xdWl6X19qcyBsaScpO1xuXG5cdHZhciB7IGRhdGEgfSA9IHNsaWRlO1xuXHRpZiAoY2hlY2tMb2NrU3VibWl0SWZVbmF0dGVtcHRlZChkYXRhKSkgbG9ja0J1dHRvbk5vd1VubG9ja09uRXhpdCgkKCcjc2ktc3VibWl0JyksIHNsaWRlLmRhdGEpO1xuXG5cdGlmICghc2xpZGUuZGF0YVsndmlzaXRlZCddICYmIGdsb2JhbFZhci5kZXZNb2RlKSB7XG5cdFx0JGNob2ljZXMuZWFjaChmdW5jdGlvbiAoaWR4LCBjaG9pY2UpIHtcblx0XHRcdGlmIChhbnN3ZXJzWyQoY2hvaWNlKS5hdHRyKCdpZCcpXSkge1xuXHRcdFx0XHQkKGNob2ljZSkuY3NzKCdjb2xvcicsICdibHVlJyk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0cmVzZXRRdWl6KCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gaGFuZGxlU3VibWl0QWNjZXNzKHNlbGVjdGVkQW5zd2VycywgJHN1Ym1pdCkge1xuXHR2YXIgJHN1Ym1pdCA9ICRzdWJtaXQgPyAkc3VibWl0IDogJCgnI3NpLXN1Ym1pdCcpO1xuXHRpZiAoc2VsZWN0ZWRBbnN3ZXJzLmxlbmd0aCA+IDApIHVubG9jaygkc3VibWl0KTtcblx0ZWxzZSBsb2NrKCRzdWJtaXQpO1xufVxuXG5mdW5jdGlvbiBxdWl6SGFuZGxlQW5zd2VyU2VsZWN0ZWQoJHNlbGVjdGVkQW5zd2VyLCAkcXVpeiwgJGNob2ljZXMsIGlzUmFkaW8pIHtcblx0c2lBdWRpby5zZnguY2xpY2sucGxheSgpO1xuXHRpZiAoaXNSYWRpbykge1xuXHRcdCRjaG9pY2VzLnJlbW92ZUNsYXNzKCdzaS1xdWl6LXNlbGVjdGVkJyk7XG5cdH1cblx0aWYgKCRzZWxlY3RlZEFuc3dlci5oYXNDbGFzcygnc2ktcXVpei1zZWxlY3RlZCcpKSB7XG5cdFx0JHNlbGVjdGVkQW5zd2VyLnJlbW92ZUNsYXNzKCdzaS1xdWl6LXNlbGVjdGVkJyk7XG5cdH0gZWxzZSB7XG5cdFx0JHNlbGVjdGVkQW5zd2VyLmFkZENsYXNzKCdzaS1xdWl6LXNlbGVjdGVkJyk7XG5cdH1cblxuXHRoYW5kbGVTdWJtaXRBY2Nlc3MoJHF1aXouZmluZCgnLnNpLXF1aXotc2VsZWN0ZWQnKSwgJCgnI3NpLXN1Ym1pdCcpKTtcbn1cbiIsImZ1bmN0aW9uIGZvcm1GdW5jdGlvbnMoeyBpZCwgZGF0YSwgJGRvbSB9ID0gZ2xvYmFsVmFyLnNsaWRlLCAkZm9ybSA9ICRkb20uZmluZCgnZm9ybScpKSB7XG5cdGlmICghZGF0YS52aXNpdGVkKSBmb3JtSW5pdCh7IGlkLCBkYXRhLCAkZG9tIH0sICRmb3JtKTtcblx0ZWxzZSBmb3JtUmVzZXQoKTtcbn1cbmZ1bmN0aW9uIGZvcm1SZXNldCh7IGlkLCBkYXRhLCAkZG9tIH0gPSBnbG9iYWxWYXIuc2xpZGUsICRmb3JtID0gJGRvbS5maW5kKCdmb3JtJykpIHtcblx0JGZvcm1bMF0ucmVzZXQoKTtcbn1cblxuZnVuY3Rpb24gZm9ybUluaXQoeyBpZCwgZGF0YSwgJGRvbSB9ID0gZ2xvYmFsVmFyLnNsaWRlLCAkZm9ybSA9ICRkb20uZmluZCgnZm9ybScpKSB7XG5cdGlmICghZGF0YS5mb3JtLmRvbnRHZW5lcmF0ZSkgZ2VuZXJhdGVGb3JtKHsgaWQsIGRhdGEsICRkb20gfSwgJGZvcm0pO1xuXG5cdHZhciBoYXNTdWJtaXQgPSAhISRmb3JtLmZpbmQoJ2lucHV0W3R5cGU9c3VibWl0XScpLmxlbmd0aDtcblxuXHQkZm9ybS5hZGRDbGFzcygnZm9ybS1zdHlsZScpO1xuXHQkZm9ybS50cmlnZ2VyKCdyZXNldCcpO1xuXG5cdGlmICghaGFzU3VibWl0KSAkZm9ybS5hcHBlbmQoJzxpbnB1dCB0eXBlPVwic3VibWl0XCIvPicpO1xuXG5cdCRmb3JtLm9uKCdzdWJtaXQucmVxLWZvcm0nLCBmdW5jdGlvbiAoZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0fSk7XG5cblx0dmFyIGlucHV0cyA9ICRmb3JtLmZpbmQoJ2lucHV0Jyk7XG5cblx0aW5wdXRzLmtleXVwKGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgJHRoaXMgPSAkKHRoaXMpO1xuXHRcdHZhciBjaGFyYWN0ZXJzID0gJHRoaXMudmFsKCkubGVuZ3RoO1xuXHRcdHZhciBtYXhMZW5ndGggPSAkdGhpcy5hdHRyKCdtYXhMZW5ndGgnKTtcblx0XHR2YXIgbGFzdElucHV0ID0gJHRoaXMubmV4dCgpLmhhc0NsYXNzKCdjaGVja2JveCcpO1xuXG5cdFx0aWYgKGNoYXJhY3RlcnMgPT0gbWF4TGVuZ3RoICYmICFsYXN0SW5wdXQpIHtcblx0XHRcdCR0aGlzLm5leHQoKS5mb2N1cygpO1xuXHRcdH1cblx0fSk7XG5cblx0aW5wdXRzLmtleWRvd24oZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoKGUud2hpY2ggPT0gOCB8fCBlLndoaWNoID09IDQ2KSAmJiAkKHRoaXMpLnZhbCgpID09ICcnKSB7XG5cdFx0XHQkKHRoaXMpLnByZXYoJ2lucHV0JykuZm9jdXMoKTtcblx0XHR9XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBjaGVja0Zvcm0oeyAkZG9tLCBkYXRhIH0gPSBnbG9iYWxWYXIuc2xpZGUpIHtcblx0dmFyIHsgZmllbGRzLCBkZWJ1ZyB9ID0gZGF0YS5mb3JtO1xuXG5cdGZvciAodmFyIGtleSBpbiBmaWVsZHMpIHtcblx0XHR2YXIge1xuXHRcdFx0W2tleV06IHsgY2FzZVNlbnNpdGl2ZSwgYW5zd2VyLCB0eXBlLCBjbGFzc05hbWUgfVxuXHRcdH0gPSBmaWVsZHM7XG5cblx0XHR2YXIgaW5wdXRzID0gJGRvbS5maW5kKCcuJyArIGNsYXNzTmFtZSk7XG5cdFx0dmFyIHJlc3VsdCA9ICcnO1xuXHRcdHZhciB1c2VyQW5zd2VyID0gJyc7XG5cblx0XHRpZiAoYW5zd2VyKSB7XG5cdFx0XHRpZiAodHlwZSA9PT0gJ2NoZWNrYm94Jykge1xuXHRcdFx0XHR2YXIgc2VsZWN0ZWRBbnN3ZXIgPSBpbnB1dHMuZmlsdGVyKCc6Y2hlY2tlZCcpWzBdO1xuXG5cdFx0XHRcdGlmIChzZWxlY3RlZEFuc3dlcikgdXNlckFuc3dlciA9IHNlbGVjdGVkQW5zd2VyLnZhbHVlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aW5wdXRzLmVhY2goZnVuY3Rpb24gKGksIGlucHV0KSB7XG5cdFx0XHRcdFx0dXNlckFuc3dlciArPSBpbnB1dC52YWx1ZTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIWNhc2VTZW5zaXRpdmUpIHtcblx0XHRcdFx0YW5zd2VyID0gYW5zd2VyLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdHVzZXJBbnN3ZXIgPSB1c2VyQW5zd2VyLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHR9XG5cblx0XHRcdHJlc3VsdCA9IHVzZXJBbnN3ZXIgPT09IGFuc3dlcjtcblxuXHRcdFx0aWYgKGRlYnVnKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdGAke2tleS50b1VwcGVyQ2FzZSgpfVxcblVzZXIgQW5zd2VyOiAke3VzZXJBbnN3ZXJ9XFxuQWN0dWFsIEFuc3dlcjogJHthbnN3ZXJ9XFxuUmVzdWx0OiAke3Jlc3VsdH1gXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIXJlc3VsdCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiB2YWxpZEZvcm0oeyAkZG9tIH0gPSBnbG9iYWxWYXIuc2xpZGUpIHtcblx0dmFyIHZhbGlkID0gdHJ1ZTtcblx0dmFyIHJlcXVpcmVkRmllbGRzID0gJGRvbS5maW5kKCdpbnB1dCx0ZXh0YXJlYSxzZWxlY3QnKS5maWx0ZXIoJ1tyZXF1aXJlZF0nKTtcblxuXHRyZXF1aXJlZEZpZWxkcy5lYWNoKChpLCB7IHZhbHVlIH0pID0+IHtcblx0XHRpZiAodmFsdWUgPT09ICcnKSB7XG5cdFx0XHR2YWxpZCA9IGZhbHNlO1xuXG5cdFx0XHQkZG9tLmZpbmQoJ2Zvcm0nKS5maW5kKCdpbnB1dFt0eXBlPXN1Ym1pdF0nKS50cmlnZ2VyKCdjbGljaycpO1xuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9KTtcblx0cmV0dXJuIHZhbGlkO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUZvcm0oeyBpZCwgZGF0YSwgJGRvbSB9ID0gZ2xvYmFsVmFyLnNsaWRlLCAkZm9ybSA9ICRkb20uZmluZCgnZm9ybScpKSB7XG5cdHZhciB7IGZpZWxkcyB9ID0gZGF0YS5mb3JtO1xuXG5cdCRmb3JtLmh0bWwoJycpO1xuXG5cdGZvciAodmFyIGtleSBpbiBmaWVsZHMpIHtcblx0XHR2YXIgZmllbGQgPSBmaWVsZHNba2V5XTtcblx0XHR2YXIgeyBjbGFzc05hbWUsIHR5cGUsIGxhYmVsIH0gPSBmaWVsZDtcblxuXHRcdHZhciBmaWVsZElEID0gaWQudG9Mb3dlckNhc2UoKSArICctJyArIGNsYXNzTmFtZTtcblxuXHRcdGlmIChsYWJlbCkge1xuXHRcdFx0dmFyIGxhYmVsRWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XG5cblx0XHRcdGxhYmVsRWxlbS5odG1sRm9yID0gZmllbGRJRDtcblxuXHRcdFx0JChsYWJlbEVsZW0pLnRleHQobGFiZWwpO1xuXG5cdFx0XHQkZm9ybS5hcHBlbmQobGFiZWxFbGVtKTtcblx0XHR9XG5cdFx0Ly8gZXN0YWJsaXNoIHR5cGVcblx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdGNhc2UgJ2NoZWNrYm94Jzpcblx0XHRcdFx0dmFyIHsgb3B0aW9ucywgb3B0aW9uYWwsIHN0eWxlLCBsYWJlbHMgfSA9IGZpZWxkO1xuXG5cdFx0XHRcdG9wdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAob3B0aW9uKSB7XG5cdFx0XHRcdFx0dmFyIG9wdGlvbkxhYmVsID0gb3B0aW9uLnRvTG93ZXJDYXNlKCkuc3BsaXQoJyAnKS5qb2luKCctJyk7XG5cdFx0XHRcdFx0dmFyIHJhZGlvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcblx0XHRcdFx0XHR2YXIgcmFkaW9MYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XG5cblx0XHRcdFx0XHRyYWRpb0xhYmVsLmh0bWxGb3IgPSBjbGFzc05hbWUgKyAnLScgKyBvcHRpb25MYWJlbDtcblxuXHRcdFx0XHRcdCQocmFkaW9MYWJlbCkuYWRkQ2xhc3MoY2xhc3NOYW1lICsgJy1jb250YWluZXIgcmFkaW8tY29udGFpbmVyJyk7XG5cblx0XHRcdFx0XHRyYWRpby5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAncmFkaW8nKTtcblx0XHRcdFx0XHRyYWRpby5pZCA9IGNsYXNzTmFtZSArICctJyArIG9wdGlvbkxhYmVsO1xuXHRcdFx0XHRcdHJhZGlvLnJlcXVpcmVkID0gIW9wdGlvbmFsO1xuXHRcdFx0XHRcdHJhZGlvLm5hbWUgPSBjbGFzc05hbWU7XG5cdFx0XHRcdFx0cmFkaW8udmFsdWUgPSBvcHRpb247XG5cblx0XHRcdFx0XHQkKHJhZGlvKS5hZGRDbGFzcyhjbGFzc05hbWUpO1xuXG5cdFx0XHRcdFx0JGZvcm0uYXBwZW5kKHJhZGlvTGFiZWwpO1xuXHRcdFx0XHRcdCQocmFkaW9MYWJlbCkuYXBwZW5kKHJhZGlvKTtcblxuXHRcdFx0XHRcdGlmIChzdHlsZSkge1xuXHRcdFx0XHRcdFx0dmFyIGN1c3RvbUNoZWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXG5cdFx0XHRcdFx0XHQkKHJhZGlvKS5hZGRDbGFzcygnaGlkZS1yYWRpbycpO1xuXHRcdFx0XHRcdFx0JChjdXN0b21DaGVjaykuYWRkQ2xhc3MoJ2N1c3RvbS1jaGVja21hcmsnKTtcblx0XHRcdFx0XHRcdCQocmFkaW9MYWJlbCkuYXBwZW5kKGN1c3RvbUNoZWNrKTtcblxuXHRcdFx0XHRcdFx0c3dpdGNoIChzdHlsZSkge1xuXHRcdFx0XHRcdFx0XHRjYXNlICd4Jzpcblx0XHRcdFx0XHRcdFx0XHQkKHJhZGlvTGFiZWwpLmFkZENsYXNzKGNsYXNzTmFtZSArICctc3R5bGUgeC1zdHlsZScpO1xuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRjYXNlICdkb3QnOlxuXHRcdFx0XHRcdFx0XHRcdCQocmFkaW9MYWJlbCkuYWRkQ2xhc3MoY2xhc3NOYW1lICsgJy1zdHlsZSBkb3Qtc3R5bGUnKTtcblx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0Y2FzZSAnYnV0dG9uJzpcblx0XHRcdFx0XHRcdFx0XHQkKHJhZGlvTGFiZWwpLmFkZENsYXNzKGNsYXNzTmFtZSArICctc3R5bGUgYnV0dG9uLXN0eWxlJyk7XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGxhYmVscykge1xuXHRcdFx0XHRcdFx0dmFyIHNMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcblxuXHRcdFx0XHRcdFx0JChzTGFiZWwpLmFkZENsYXNzKGNsYXNzTmFtZSArICctb3B0aW9uLWxhYmVsJyk7XG5cblx0XHRcdFx0XHRcdCQoc0xhYmVsKS50ZXh0KG9wdGlvbik7XG5cblx0XHRcdFx0XHRcdCQocmFkaW9MYWJlbCkuYXBwZW5kKHNMYWJlbCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdkcm9wZG93bic6XG5cdFx0XHRcdHZhciB7IG9wdGlvbnMsIG9wdGlvbmFsLCBwbGFjZWhvbGRlciwgaGlkZUljb24gfSA9IGZpZWxkO1xuXG5cdFx0XHRcdHZhciBkcm9wZG93biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdCcpO1xuXG5cdFx0XHRcdGRyb3Bkb3duLmlkID0gZmllbGRJRDtcblx0XHRcdFx0ZHJvcGRvd24ucmVxdWlyZWQgPSAhb3B0aW9uYWw7XG5cblx0XHRcdFx0JChkcm9wZG93bikuYWRkQ2xhc3MoY2xhc3NOYW1lICsgJyAnICsgY2xhc3NOYW1lICsgJy1zdHlsZScpO1xuXHRcdFx0XHQkKGRyb3Bkb3duKS5hcHBlbmQoJzxvcHRpb24gdmFsdWU9XCJcIj4nICsgKHBsYWNlaG9sZGVyID8gcGxhY2Vob2xkZXIgOiAnU2VsZWN0IE9uZScpICsgJzwvb3B0aW9uPicpO1xuXG5cdFx0XHRcdG9wdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAob3B0aW9uKSB7XG5cdFx0XHRcdFx0JChkcm9wZG93bikuYXBwZW5kKCc8b3B0aW9uIHZhbHVlPVwiJyArIG9wdGlvbiArICdcIj4nICsgb3B0aW9uICsgJzwvb3B0aW9uPicpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpZiAoaGlkZUljb24pICQoZHJvcGRvd24pLmFkZENsYXNzKCdoaWRkZW4taWNvbicpO1xuXG5cdFx0XHRcdCRmb3JtLmFwcGVuZChkcm9wZG93bik7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnZGF0ZSc6XG5cdFx0XHRcdHZhciB7IG9wdGlvbmFsLCBoaWRlSWNvbiwgbWluLCBtYXggfSA9IGZpZWxkO1xuXG5cdFx0XHRcdHZhciBkYXRlSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXG5cdFx0XHRcdGRhdGVJbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnZGF0ZScpO1xuXG5cdFx0XHRcdGRhdGVJbnB1dC5yZXF1aXJlZCA9ICFvcHRpb25hbDtcblx0XHRcdFx0ZGF0ZUlucHV0LmlkID0gZmllbGRJRDtcblxuXHRcdFx0XHRpZiAobWluKSBkYXRlSW5wdXQubWluID0gbWluO1xuXHRcdFx0XHRpZiAobWF4KSBkYXRlSW5wdXQubWF4ID0gbWF4O1xuXHRcdFx0XHRpZiAoaGlkZUljb24pICQoZGF0ZUlucHV0KS5hZGRDbGFzcygnaGlkZGVuLWljb24nKTtcblxuXHRcdFx0XHQkKGRhdGVJbnB1dCkuYWRkQ2xhc3MoY2xhc3NOYW1lICsgJyAnICsgY2xhc3NOYW1lICsgJy1zdHlsZScpO1xuXG5cdFx0XHRcdCRmb3JtLmFwcGVuZChkYXRlSW5wdXQpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ251bWJlcic6XG5cdFx0XHRcdHZhciB7IG9wdGlvbmFsLCBwbGFjZWhvbGRlciwgaGlkZUljb24sIG1pbiwgbWF4LCBzdGVwIH0gPSBmaWVsZDtcblxuXHRcdFx0XHR2YXIgbnVtYmVySW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXG5cdFx0XHRcdG51bWJlcklucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdudW1iZXInKTtcblx0XHRcdFx0bnVtYmVySW5wdXQucmVxdWlyZWQgPSAhb3B0aW9uYWw7XG5cdFx0XHRcdG51bWJlcklucHV0LmlkID0gZmllbGRJRDtcblxuXHRcdFx0XHRpZiAobWluKSBudW1iZXJJbnB1dC5taW4gPSBtaW47XG5cdFx0XHRcdGlmIChtYXgpIG51bWJlcklucHV0Lm1heCA9IG1heDtcblx0XHRcdFx0aWYgKHN0ZXApIG51bWJlcklucHV0LnN0ZXAgPSBzdGVwO1xuXHRcdFx0XHRpZiAoaGlkZUljb24pICQobnVtYmVySW5wdXQpLmFkZENsYXNzKCdoaWRkZW4taWNvbicpO1xuXHRcdFx0XHRpZiAocGxhY2Vob2xkZXIpIG51bWJlcklucHV0LnBsYWNlaG9sZGVyID0gcGxhY2Vob2xkZXI7XG5cblx0XHRcdFx0JChudW1iZXJJbnB1dCkuYWRkQ2xhc3MoY2xhc3NOYW1lICsgJyAnICsgY2xhc3NOYW1lICsgJy1zdHlsZScpO1xuXG5cdFx0XHRcdCRmb3JtLmFwcGVuZChudW1iZXJJbnB1dCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dmFyIHsgc2VwYXJhdGUsIG9wdGlvbmFsLCBwbGFjZWhvbGRlciwgYW5zd2VyLCBtYXhMZW5ndGggfSA9IGZpZWxkO1xuXG5cdFx0XHRcdC8vIGNyZWF0ZSBmaWVsZFxuXHRcdFx0XHRpZiAoIXNlcGFyYXRlKSB7XG5cdFx0XHRcdFx0dmFyIHRleHRJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cblx0XHRcdFx0XHR0ZXh0SW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQnKTtcblx0XHRcdFx0XHR0ZXh0SW5wdXQucmVxdWlyZWQgPSAhb3B0aW9uYWw7XG5cdFx0XHRcdFx0dGV4dElucHV0LmlkID0gZmllbGRJRDtcblxuXHRcdFx0XHRcdGlmIChtYXhMZW5ndGgpIHRleHRJbnB1dC5tYXhMZW5ndGggPSBtYXhMZW5ndGg7XG5cdFx0XHRcdFx0aWYgKHBsYWNlaG9sZGVyKSB0ZXh0SW5wdXQucGxhY2Vob2xkZXIgPSBwbGFjZWhvbGRlcjtcblxuXHRcdFx0XHRcdCQodGV4dElucHV0KS5hZGRDbGFzcyhjbGFzc05hbWUgKyAnICcgKyBjbGFzc05hbWUgKyAnLXN0eWxlJyk7XG5cblx0XHRcdFx0XHQkZm9ybS5hcHBlbmQodGV4dElucHV0KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBzZXBhcmF0ZSBmaWVsZHMgcGVyIGxldHRlclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYW5zd2VyLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHR2YXIgdGV4dElucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcblxuXHRcdFx0XHRcdFx0aWYgKGkgPT09IDApIHRleHRJbnB1dC5pZCA9IGZpZWxkSUQ7XG5cblx0XHRcdFx0XHRcdHRleHRJbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dCcpO1xuXHRcdFx0XHRcdFx0dGV4dElucHV0Lm1heExlbmd0aCA9IDE7XG5cdFx0XHRcdFx0XHR0ZXh0SW5wdXQucmVxdWlyZWQgPSAhb3B0aW9uYWw7XG5cblx0XHRcdFx0XHRcdCQodGV4dElucHV0KS5hZGRDbGFzcyhcblx0XHRcdFx0XHRcdFx0Y2xhc3NOYW1lICsgJyAnICsgY2xhc3NOYW1lICsgJy1zdHlsZSAnICsgY2xhc3NOYW1lICsgJy0nICsgKGkgKyAxKSArICctc3R5bGUgc2VwYXJhdGVkJ1xuXHRcdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdFx0JGZvcm0uYXBwZW5kKHRleHRJbnB1dCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fVxufVxuIiwidmFyIGNoYXB0ZXJOYXZpZ2F0aW9uU2xpZGVzID0gWyd2MScsICdpMScsICdpMicsICdpMyddO1xudmFyIGNoYXB0ZXJDb21wbGV0aW9uU2xpZGVzID0gWyd2MScsICdpMScsICdpMicsICdpMyddO1xuXG5mdW5jdGlvbiBpbml0U2lkZU1lbnUoKSB7XG5cdHZhciAkbWVudSA9ICQoJyNzaS1zaWRlLW1lbnUnKTtcblx0dmFyICRjb250YWluZXIgPSAkKCcjc2ktc2lkZS1tZW51LWNvbnRhaW5lcicpO1xuXHR2YXIgYnV0dG9ucyA9ICQoJy5zaS1tZW51LW5hdmlnYXRpb24nKS5maW5kKCdidXR0b24nKTtcblxuXHQkbWVudS5vbignY2xpY2suc3RvcCcsIGZ1bmN0aW9uIChlKSB7XG5cdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0fSk7XG5cdCRjb250YWluZXIub24oJ2NsaWNrLnNpZGUnLCBmdW5jdGlvbiAoZSkge1xuXHRcdGNsb3NlU2lkZU1lbnUoKTtcblx0fSk7XG5cblx0YnV0dG9ucy5lYWNoKGZ1bmN0aW9uIChpZHgsIGJ1dHRvbikge1xuXHRcdCQoYnV0dG9uKS5vbignY2xpY2suc2lkZScsIGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBpZCA9IGNoYXB0ZXJOYXZpZ2F0aW9uU2xpZGVzW2lkeF07XG5cdFx0XHRqdW1wVG9JZChpZCk7XG5cdFx0XHRjbG9zZVNpZGVNZW51KCk7XG5cdFx0fSk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBvcGVuU2lkZU1lbnUoKSB7XG5cdHZhciBzbGlkZSA9IGdsb2JhbFZhci5zbGlkZTtcblxuXHR2YXIgJG1lbnUgPSAkKCcjc2ktc2lkZS1tZW51Jyk7XG5cdHZhciAkY29udGFpbmVyID0gJCgnI3NpLXNpZGUtbWVudS1jb250YWluZXInKTtcblxuXHQkY29udGFpbmVyLmFkZENsYXNzKCdtZW51LW9wZW4nKTtcblx0JG1lbnUuYWRkQ2xhc3MoJ21lbnUtb3BlbicpO1xuXHQvLyB0aGlzIGlzIGZvciBwYXVzaW5nIHRoZSB2aWRlbyB3aGVuIHlvdSBvcGVuIHRoZSBzaWRlIG1lbnVcblx0dmFyIHR5cGUgPSBzbGlkZS5kYXRhLnR5cGU7XG5cdGlmIChzbGlkZS5kYXRhLnZpZGVvTG9hZGVkICYmIHR5cGUgPT0gJ3ZpZGVvJykge1xuXHRcdHZpZGVvanMoZ2xvYmFsVmFyLiRjdXJTbGlkZS5maW5kKCd2aWRlbycpWzBdLmlkKS5wYXVzZSgpO1xuXHR9XG5cblx0aGFuZGxlU2lkZUJ1dHRvbnMoKTtcbn1cblxuZnVuY3Rpb24gY2xvc2VTaWRlTWVudSgpIHtcblx0dmFyIHNsaWRlID0gZ2xvYmFsVmFyLnNsaWRlO1xuXHR2YXIgJG1lbnUgPSAkKCcjc2ktc2lkZS1tZW51Jyk7XG5cdHZhciAkY29udGFpbmVyID0gJCgnI3NpLXNpZGUtbWVudS1jb250YWluZXInKTtcblxuXHQkY29udGFpbmVyLnJlbW92ZUNsYXNzKCdtZW51LW9wZW4nKTtcblx0JG1lbnUucmVtb3ZlQ2xhc3MoJ21lbnUtb3BlbicpO1xuXHQvLyB1bnBhdXNlIHRoZSB2aWRlbyB3aGVuIHlvdSBjbG9zZSB0aGUgc2lkZSBtZW51XG5cdHZhciB0eXBlID0gc2xpZGUuZGF0YS50eXBlO1xuXHRpZiAoc2xpZGUuZGF0YS52aWRlb0xvYWRlZCAmJiB0eXBlID09ICd2aWRlbycpIHtcblx0XHRpZiAodmlkZW9qcyhnbG9iYWxWYXIuJGN1clNsaWRlLmZpbmQoJ3ZpZGVvJylbMF0uaWQpLnBhdXNlZCgpKSB7XG5cdFx0XHR2aWRlb2pzKGdsb2JhbFZhci4kY3VyU2xpZGUuZmluZCgndmlkZW8nKVswXS5pZCkucGxheSgpO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBoYW5kbGVTaWRlQnV0dG9ucygpIHtcblx0dmFyIGJ1dHRvbnMgPSAkKCcuc2ktbWVudS1uYXZpZ2F0aW9uJykuZmluZCgnYnV0dG9uJyk7XG5cdHZhciBjaGVja3MgPSAkKCcuc2ktbWVudS1jaGVja3NfX2pzJyk7XG5cblx0bG9jaygkKGJ1dHRvbnMpKTtcblx0dW5sb2NrKCQoYnV0dG9uc1swXSkpO1xuXHRidXR0b25zLmVhY2goZnVuY3Rpb24gKGlkeCwgYnV0dG9uKSB7XG5cdFx0aWYgKGdldENvbXBsZXRpb25TdGF0dXMoY2hhcHRlckNvbXBsZXRpb25TbGlkZXNbaWR4XSkpIHtcblx0XHRcdCQoY2hlY2tzW2lkeF0pLmFkZENsYXNzKCdjb21wbGV0ZWQnKTtcblx0XHRcdGlmIChidXR0b25zW2lkeCArIDFdKSB7XG5cdFx0XHRcdHVubG9jaygkKGJ1dHRvbnNbaWR4ICsgMV0pKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xufVxuIiwiZnVuY3Rpb24gaW5pdE5hdmlnYXRpb24oKSB7XG5cdHZhciBzd2FwU3R5bGVzID0gJCgnLnNpLW5hdi1zdHlsZV9fanMnKTtcblx0dmFyIHN3YXBJbWFnZXMgPSAkKCcuc2ktaW1nLXN3YXBfX2pzJyk7XG5cdHZhciBidXR0b25UeXBlID0gZ2xvYmFsVmFyLmJ1dHRvblR5cGU7XG5cblx0Ly8gc3dhcCBhbGwgc3R5bGUgcmVsYXRlZCBpbWFnZXNcblx0c3dhcEltYWdlcy5lYWNoKGZ1bmN0aW9uIChpZHgsIGltYWdlKSB7XG5cdFx0JChpbWFnZSkuYXR0cignc3JjJywgZnVuY3Rpb24gKGluZGV4LCBhdHRyKSB7XG5cdFx0XHRyZXR1cm4gYXR0ci5yZXBsYWNlKCdjbGFzc2ljJywgYnV0dG9uVHlwZSk7XG5cdFx0fSk7XG5cdH0pO1xuXHRzd2FwU3R5bGVzLmVhY2goZnVuY3Rpb24gKGlkeCwgbmF2KSB7XG5cdFx0JChuYXYpLmFkZENsYXNzKCdzaS1uYXYtc3R5bGUtJyArIGJ1dHRvblR5cGUpO1xuXHR9KTtcblxuXHRhdHRhY2hOYXZFdmVudExpc3RlbmVycygpO1xufVxuXG5mdW5jdGlvbiBzaG93TmF2RWxlbWVudHMoKSB7XG5cdHZhciBzbGlkZSA9IGdsb2JhbFZhci5zbGlkZTtcblx0dmFyIG5hdkJ1dHRvbnMgPSAkKCcuc2ktbmF2X19qcycpO1xuXHR2YXIgbmF2aWdhdGlvbiA9IHNsaWRlLmRhdGEubmF2RWxlbWVudHMgfHwgW107XG5cblx0JChuYXZCdXR0b25zKS5oaWRlKCk7XG5cblx0bmF2aWdhdGlvbi5mb3JFYWNoKGZ1bmN0aW9uIChuYXYpIHtcblx0XHRzd2l0Y2ggKG5hdikge1xuXHRcdFx0Y2FzZSAnc3RhcnQtc2xpZGUnOlxuXHRcdFx0XHQkKCcjc2ktY2xvY2snKS5zaG93KCk7XG5cdFx0XHRcdCQoJyNzaS1zdGFydCcpLnNob3coKTtcblx0XHRcdFx0JCgnI3NpLW11dGUnKS5zaG93KCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnc3RhbmRhcmQtaG9tZSc6XG5cdFx0XHRcdCQoJyNzaS1sb2dvJykuc2hvdygpO1xuXHRcdFx0XHQkKCcjc2ktcHJvZ3Jlc3MnKS5zaG93KCk7XG5cdFx0XHRcdCQoJyNzaS1ob21lJykuc2hvdygpO1xuXHRcdFx0XHQkKCcjc2ktYmFjaycpLnNob3coKTtcblx0XHRcdFx0aWYgKGdldENvbXBsZXRpb25TdGF0dXMoKSkge1xuXHRcdFx0XHRcdCQoJyNzaS1uZXh0Jykuc2hvdygpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAndmlkZW8taG9tZSc6XG5cdFx0XHRcdC8vICQoJyNzaS1sb2dvJykuc2hvdygpO1xuXHRcdFx0XHQvLyAkKCcjc2ktcHJvZ3Jlc3MnKS5zaG93KCk7XG5cdFx0XHRcdCQoJyNzaS1ob21lJykuc2hvdygpO1xuXHRcdFx0XHQkKCcjc2ktYmFjaycpLnNob3coKTtcblx0XHRcdFx0Ly8gJCgnI3NpLW11dGUnKS5zaG93KCk7XG5cdFx0XHRcdGlmIChnZXRDb21wbGV0aW9uU3RhdHVzKCkpIHtcblx0XHRcdFx0XHQkKCcjc2ktbmV4dCcpLnNob3coKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3N0YW5kYXJkLW1lbnUnOlxuXHRcdFx0XHQkKCcjc2ktbG9nbycpLnNob3coKTtcblx0XHRcdFx0JCgnI3NpLXByb2dyZXNzJykuc2hvdygpO1xuXHRcdFx0XHQkKCcjc2ktbWVudScpLnNob3coKTtcblx0XHRcdFx0JCgnI3NpLWJhY2snKS5zaG93KCk7XG5cdFx0XHRcdCQoJyNzaS1tdXRlJykuc2hvdygpO1xuXHRcdFx0XHRpZiAoZ2V0Q29tcGxldGlvblN0YXR1cygpKSB7XG5cdFx0XHRcdFx0JCgnI3NpLW5leHQnKS5zaG93KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICd2aWRlby1tZW51Jzpcblx0XHRcdFx0Ly8gJCgnI3NpLWxvZ28nKS5zaG93KCk7XG5cdFx0XHRcdC8vICQoJyNzaS1wcm9ncmVzcycpLnNob3coKTtcblx0XHRcdFx0JCgnI3NpLW1lbnUnKS5zaG93KCk7XG5cdFx0XHRcdCQoJyNzaS1iYWNrJykuc2hvdygpO1xuXHRcdFx0XHQvLyAkKCcjc2ktbXV0ZScpLnNob3coKTtcblx0XHRcdFx0aWYgKGdldENvbXBsZXRpb25TdGF0dXMoKSkge1xuXHRcdFx0XHRcdCQoJyNzaS1uZXh0Jykuc2hvdygpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnZXhpdC1zbGlkZSc6XG5cdFx0XHRcdCQoJyNzaS1wcm9ncmVzcycpLnNob3coKTtcblx0XHRcdFx0JCgnI3NpLWV4aXQnKS5zaG93KCk7XG5cdFx0XHRcdCQoJyNzaS1yZXBsYXknKS5zaG93KCk7XG5cdFx0XHRcdCQoJyNzaS1tdXRlJykuc2hvdygpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdGlmIChuYXYuaW5kZXhPZignaWNvbicpICE9PSAtMSkgaWNvbkFjdGlvbnMobmF2KTtcblx0XHRcdFx0ZWxzZSBpZiAobmF2WzBdID09PSAnIScpICQoJyNzaS0nICsgbmF2LnNwbGl0KCchJylbMV0pLmhpZGUoKTtcblx0XHRcdFx0ZWxzZSAkKCcjc2ktJyArIG5hdikuc2hvdygpO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cdH0pO1xuXG5cdGZ1bmN0aW9uIGljb25BY3Rpb25zKG5hdlN0cikge1xuXHRcdHZhciBuYXZEYXRhID0gbmF2U3RyLnNwbGl0KCcqJyk7XG5cblx0XHR2YXIgbmF2ID0gbmF2RGF0YVswXTtcblx0XHR2YXIgbXVsdGlwbGllciA9IHBhcnNlSW50KG5hdkRhdGFbMV0pIHx8IDE7XG5cblx0XHR2YXIgc2xpZGVJRCA9IGdsb2JhbFZhci5zbGlkZS5pZDtcblx0XHR2YXIgaWNvblRlbXBsYXRlID0gJCgkKCcuc2ktaGVscGVyLWljb24nKVswXSk7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG11bHRpcGxpZXI7IGkrKykge1xuXHRcdFx0dmFyICRpY29uID0gaWNvblRlbXBsYXRlLmNsb25lKCk7XG5cblx0XHRcdCRpY29uXG5cdFx0XHRcdC5hcHBlbmRUbygnI3NpLW5hdi1jb250YWluZXInKVxuXHRcdFx0XHQuc2hvdygpXG5cdFx0XHRcdC5hZGRDbGFzcygnc2ktJyArIG5hdilcblx0XHRcdFx0LmFkZENsYXNzKCdzaS0nICsgbmF2ICsgJy0nICsgKGkgKyAxKSk7XG5cblx0XHRcdGhpZGVDbGlja0ljb24oJGljb24sIHNsaWRlSUQsIGkpO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBhdHRhY2hOYXZFdmVudExpc3RlbmVycygpIHtcblx0JCgnI3NpLWhvbWUnKS5vbignY2xpY2sgdG91Y2gnLCBmdW5jdGlvbiAoKSB7XG5cdFx0c2lBdWRpby5zZnguY2xpY2sucGxheSgpO1xuXHRcdGp1bXBUb1NsaWRlKGdsb2JhbFZhci5ob21lU2xpZGUpO1xuXHR9KTtcblxuXHQkKCcjc2ktbXV0ZScpLm9uKCdjbGljayB0b3VjaCcsIGZ1bmN0aW9uICgpIHtcblx0XHRzaUF1ZGlvLnNmeC5jbGljay5wbGF5KCk7XG5cdFx0dG9nZ2xlTXV0ZSgpO1xuXHR9KTtcblxuXHQkKCcjc2ktbWVudScpLm9uKCdjbGljayB0b3VjaCcsIGZ1bmN0aW9uICgpIHtcblx0XHRzaUF1ZGlvLnNmeC5jbGljay5wbGF5KCk7XG5cdFx0b3BlblNpZGVNZW51KCk7XG5cdH0pO1xuXG5cdCQoJyNzaS1mdWxsJykub24oJ2NsaWNrIHRvdWNoJywgZnVuY3Rpb24gKCkge1xuXHRcdHNpQXVkaW8uc2Z4LmNsaWNrLnBsYXkoKTtcblx0XHR0b2dnbGVGdWxsc2NyZWVuKCk7XG5cdH0pO1xuXG5cdCQoJyNzaS1iYWNrJykub24oJ2NsaWNrIHRvdWNoJywgZnVuY3Rpb24gKCkge1xuXHRcdHNpQXVkaW8uc2Z4LmNsaWNrLnBsYXkoKTtcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdHNsaWRlQWN0aW9uKGdsb2JhbFZhci5zbGlkZS5pZCwgJ2JhY2tBY3Rpb24nKTtcblx0XHR9LCAxMDApO1xuXHR9KTtcblxuXHQkKCcjc2ktbmV4dCcpLm9uKCdjbGljayB0b3VjaCcsIGZ1bmN0aW9uICgpIHtcblx0XHRzaUF1ZGlvLnNmeC5jbGljay5wbGF5KCk7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRzbGlkZUFjdGlvbihnbG9iYWxWYXIuc2xpZGUuaWQsICduZXh0QWN0aW9uJyk7XG5cdFx0fSwgMTAwKTtcblx0fSk7XG5cblx0JCgnI3NpLXJlcGxheScpLm9uKCdjbGljayB0b3VjaCcsIGZ1bmN0aW9uICgpIHtcblx0XHRzaUF1ZGlvLnNmeC5jbGljay5wbGF5KCk7XG5cdFx0anVtcFRvU2xpZGUoMCk7XG5cdH0pO1xuXG5cdCQoJyNzaS1leGl0Jykub24oJ2NsaWNrIHRvdWNoJywgZnVuY3Rpb24gKCkge1xuXHRcdHNpQXVkaW8uc2Z4LmNsaWNrLnBsYXkoKTtcblx0XHR3aW5kb3cudG9wLmNsb3NlKCk7XG5cdH0pO1xuXG5cdCQoJyNzaS1zdGFydCcpLm9uKCdjbGljayB0b3VjaCcsIGZ1bmN0aW9uICgpIHtcblx0XHRzaUF1ZGlvLnNmeC5jbGljay5wbGF5KCk7XG5cdFx0c2xpZGVBY3Rpb24oZ2xvYmFsVmFyLnNsaWRlLmlkLCAnbmV4dEFjdGlvbicpO1xuXHR9KTtcblxuXHQkKCcjc2ktc3VibWl0Jykub24oJ2NsaWNrIHRvdWNoJywgZnVuY3Rpb24gKCkge1xuXHRcdHZhciBzbGlkZU9iaiA9IGdsb2JhbFZhci5zbGlkZS5kYXRhO1xuXG5cdFx0aWYgKHNsaWRlT2JqLnR5cGUgPT09ICdmb3JtJyAmJiAhdmFsaWRGb3JtKCkpIHJldHVybjtcblxuXHRcdHNpQXVkaW8uc2Z4LmNsaWNrLnBsYXkoKTtcblx0XHR2YXIgYm9sID0gY2hlY2tRdWVzdGlvbihzbGlkZU9iai50eXBlKTtcblx0XHRoYW5kbGVBbnN3ZXIoYm9sKTtcblx0fSk7XG5cblx0JCgnI3NpLXJlc2V0Jykub24oJ2NsaWNrIHRvdWNoJywgZnVuY3Rpb24gKCkge1xuXHRcdHZhciBzbGlkZSA9IGdsb2JhbFZhci5zbGlkZTtcblx0XHR2YXIgdHlwZSA9IHNsaWRlLmRhdGEudHlwZTtcblxuXHRcdHNpQXVkaW8uc2Z4LmNsaWNrLnBsYXkoKTtcblx0XHRzd2l0Y2ggKHNsaWRlLmRhdGEudHlwZSkge1xuXHRcdFx0Y2FzZSAnZG5kJzpcblx0XHRcdFx0cmVzZXREbmQoKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdzb3J0Jzpcblx0XHRcdFx0cmVzZXRTb3J0KCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAncXVpeic6XG5cdFx0XHRcdHJlc2V0UXVpeigpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2hvdHNwb3QnOlxuXHRcdFx0XHR2YXIgJGhvdHNwb3RzID0gc2xpZGUuJGRvbS5maW5kKCcgLmhvdHNwb3QtYnV0dG9uX19qcycpO1xuXG5cdFx0XHRcdHJlc2V0SG90c3BvdChzbGlkZS5kYXRhLmhvdHNwb3QsICRob3RzcG90cywgZ2V0SG90c3BvdE1vZGFscygkaG90c3BvdHMubGVuZ3RoKSk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnc2NyYXRjaCc6XG5cdFx0XHRcdHJlc2V0U2NyYXRjaCgpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2Zvcm0nOlxuXHRcdFx0XHRmb3JtUmVzZXQoKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRpZiAoc2xpZGUuZGF0YS5jdXN0b21SZXNldCkge1xuXHRcdFx0XHRcdHNsaWRlLmRhdGEuY3VzdG9tUmVzZXQoKTtcblx0XHRcdFx0fVxuXHRcdH1cblx0XHRpZiAoc2xpZGUuZGF0YVt0eXBlXS5jdXN0b21SZXNldCkge1xuXHRcdFx0c2xpZGUuZGF0YVt0eXBlXS5jdXN0b21SZXNldCgpO1xuXHRcdH1cblx0fSk7XG5cdCQoJyNzaS1jdXN0b20tc3VibWl0Jykub24oJ2NsaWNrIHRvdWNoJywgZnVuY3Rpb24gKCkge1xuXHRcdHZhciBzbGlkZU9iaiA9IGdsb2JhbFZhci5zbGlkZS5kYXRhO1xuXG5cdFx0aWYgKHNsaWRlT2JqLnR5cGUgPT09ICdmb3JtJyAmJiAhdmFsaWRGb3JtKCkpIHJldHVybjtcblxuXHRcdHNpQXVkaW8uc2Z4LmNsaWNrLnBsYXkoKTtcblx0XHRpZiAoc2xpZGVPYmouY3VzdG9tU3VibWl0KSB7XG5cdFx0XHRzbGlkZU9iai5jdXN0b21TdWJtaXQoKTtcblx0XHR9XG5cdH0pO1xuXG5cdCQoJy5zaS1tZW51LWNsb3NlcicpLm9uKCdjbGljayB0b3VjaCcsIGZ1bmN0aW9uICgpIHtcblx0XHRjbG9zZVNpZGVNZW51KCk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBoaWRlQ2xpY2tJY29uKCRpY29uLCBzbGlkZUlELCBpKSB7XG5cdHZhciAkc2xpZGUgPSAkKCcjJyArIHNsaWRlSUQpO1xuXG5cdCRzbGlkZS5vZmYoJ21vdXNlZG93bi5pY29uJyArIGkpO1xuXHQkc2xpZGUub24oJ21vdXNlZG93bi5pY29uJyArIGksIGZ1bmN0aW9uICgpIHtcblx0XHQkaWNvbi5yZW1vdmUoKTtcblx0XHQkc2xpZGUub2ZmKCdtb3VzZWRvd24uaWNvbicpO1xuXHR9KTtcblxuXHRhZGRUb0Z1bmN0aW9uS2V5KHNsaWRlc1tzbGlkZUlEXSwgJ29uRXhpdEFjdGlvbicsIGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoJGljb24pICRpY29uLnJlbW92ZSgpO1xuXHR9KTtcbn1cblxuLy8gZnVuY3Rpb24gdXNlZCBieSBmdWxsc2NyZWVuIG5hdiBidXR0b25cbmZ1bmN0aW9uIHRvZ2dsZUZ1bGxzY3JlZW4oKSB7XG5cdHZhciBlbGVtZW50ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXHR2YXIgZnVsbHNjcmVlbiA9XG5cdFx0ZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQgfHxcblx0XHRkb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCB8fFxuXHRcdGRvY3VtZW50Lm1zRnVsbHNjcmVlbkVsZW1lbnQgfHxcblx0XHRkb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRWxlbWVudDtcblx0aWYgKGZ1bGxzY3JlZW4pIHtcblx0XHR2YXIgcmVxdWVzdE1ldGhvZCA9XG5cdFx0XHRkb2N1bWVudC5leGl0RnVsbHNjcmVlbiB8fFxuXHRcdFx0ZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4gfHxcblx0XHRcdGRvY3VtZW50LndlYmtpdEV4aXRGdWxsU2NyZWVuIHx8XG5cdFx0XHRkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuIHx8XG5cdFx0XHRkb2N1bWVudC5tc0V4aXRGdWxsc2NyZWVuO1xuXG5cdFx0aWYgKHJlcXVlc3RNZXRob2QpIHtcblx0XHRcdHJlcXVlc3RNZXRob2QuYXBwbHkoZG9jdW1lbnQpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHR2YXIgcmVxdWVzdE1ldGhvZCA9XG5cdFx0XHRlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuIHx8XG5cdFx0XHRlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuIHx8XG5cdFx0XHRlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuIHx8XG5cdFx0XHRlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuIHx8XG5cdFx0XHRlbGVtZW50Lm1zUmVxdWVzdEZ1bGxzY3JlZW47XG5cblx0XHRpZiAocmVxdWVzdE1ldGhvZCkge1xuXHRcdFx0cmVxdWVzdE1ldGhvZC5hcHBseShlbGVtZW50KTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gdG9nZ2xlTXV0ZSgpIHtcblx0aWYgKGdsb2JhbFZhci5tdXRlZCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0Z2xvYmFsVmFyLm11dGVkID0gZmFsc2U7XG5cdH1cblxuXHR2YXIgbXV0ZWQgPSBnbG9iYWxWYXIubXV0ZWQ7XG5cdHZhciAkbXV0ZUJ1dHRvbiA9ICQoJyNzaS1tdXRlJyk7XG5cblx0Ly8gSWYgdGhlIGNvdXJzZSBpcyBhbHJlYWR5IG11dGVkLCB3ZSB3YW50IHRvIHR1cm4gJ211dGUnIG9mZlxuXHRpZiAobXV0ZWQpIHtcblx0XHQkbXV0ZUJ1dHRvbi5yZW1vdmVDbGFzcygnbXV0ZWQnKTtcblx0XHRnbG9iYWxWYXIubXV0ZWQgPSBmYWxzZTtcblx0XHRtdXRlQXVkaW8oZmFsc2UpO1xuXHRcdG11dGVWaWRlbyhmYWxzZSk7XG5cdH1cblx0Ly8gSWYgdGhlIGNvdXJzZSBpcyBub3QgbXV0ZWQsIHdlIHdhbnQgdG8gdHVybiAnbXV0ZScgb25cblx0ZWxzZSB7XG5cdFx0JG11dGVCdXR0b24uYWRkQ2xhc3MoJ211dGVkJyk7XG5cdFx0Z2xvYmFsVmFyLm11dGVkID0gdHJ1ZTtcblx0XHRtdXRlQXVkaW8odHJ1ZSk7XG5cdFx0bXV0ZVZpZGVvKHRydWUpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIG11dGVBdWRpbyhtdXRlSXQpIHtcblx0aWYgKG11dGVJdCA9PT0gdHJ1ZSkge1xuXHRcdGNvbnNvbGUubG9nKCdNdXRpbmcgYXVkaW8uJyk7XG5cdFx0SG93bGVyLm11dGUodHJ1ZSk7XG5cdH0gZWxzZSB7XG5cdFx0Y29uc29sZS5sb2coJ1VubXV0aW5nIGF1ZGlvLicpO1xuXHRcdEhvd2xlci5tdXRlKGZhbHNlKTtcblx0fVxufVxuXG5mdW5jdGlvbiBtdXRlVmlkZW8obXV0ZUl0KSB7XG5cdHZhciBhbGxWaWRlb1BsYXllcnMgPSB2aWRlb2pzLmdldEFsbFBsYXllcnMoKTtcblxuXHRpZiAobXV0ZUl0ID09PSB0cnVlKSB7XG5cdFx0Y29uc29sZS5sb2coJ011dGluZyB2aWRlby4nKTtcblx0XHQvLyBNYWtlIHN1cmUgdGhhdCBhbGwgcGxheWVycyB0aGF0IGFyZSBub3QgeWV0IGluaXRpYWxpemVkIHdpbGwgZ2V0IHNldCB0byBtdXRlZCBieSBkZWZhdWx0XG5cdFx0dmlkZW9qcy5vcHRpb25zLm11dGVkID0gdHJ1ZTtcblx0XHQvLyBGaW5kIGFsbCBpbml0aWFsaXplZCBwbGF5ZXJzIGFuZCBtdXRlIHRoZW1cblx0XHRhbGxWaWRlb1BsYXllcnMuZm9yRWFjaChmdW5jdGlvbiAocGxheWVyKSB7XG5cdFx0XHRwbGF5ZXIubXV0ZWQodHJ1ZSk7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0Y29uc29sZS5sb2coJ1VubXV0aW5nIHZpZGVvLicpO1xuXHRcdC8vIE1ha2Ugc3VyZSB0aGF0IGFsbCBwbGF5ZXJzIHRoYXQgYXJlIG5vdCB5ZXQgaW5pdGlhbGl6ZWQgd2lsbCBOT1QgZ2V0IHNldCB0byBtdXRlZCBieSBkZWZhdWx0XG5cdFx0dmlkZW9qcy5vcHRpb25zLm11dGVkID0gZmFsc2U7XG5cdFx0Ly8gRmluZCBhbGwgaW5pdGlhbGl6ZWQgcGxheWVycyBhbmQgdW5tdXRlIHRoZW1cblx0XHRhbGxWaWRlb1BsYXllcnMuZm9yRWFjaChmdW5jdGlvbiAocGxheWVyKSB7XG5cdFx0XHRwbGF5ZXIubXV0ZWQoZmFsc2UpO1xuXHRcdH0pO1xuXHR9XG59XG5cbi8vIGZ1bmN0aW9uIGluZm9LZXlib2FyZCgpIHtcbi8vICAgICB2YXIgaW5mb0l0ZW1zID0gJCgnLmluZm9JdGVtJyk7XG4vLyAgICAgdmFyIGlkeCA9IDA7XG4vLyAgICAgJCgnI0luZm9fQ2xvc2VyJykuZm9jdXMoKTtcblxuLy8gICAgICQoJ2JvZHknKS5vbigna2V5ZG93bi5kcmFnJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4vLyAgICAgICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuLy8gICAgICAgICAgICAgY2FzZSA5OiAvL3Jlc3RyaWN0cyB0YWIgbW92ZW1lbnQgdG8gaW5mbyBvdmVybGF5IGVsZW1lbnRzXG4vLyAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbi8vICAgICAgICAgICAgICAgICBpZiAoaWR4IDwgaW5mb0l0ZW1zLmxlbmd0aCAtIDEpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4vLyAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICAgICAgICAgICAgaWR4ID0gMDtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgJChpbmZvSXRlbXNbaWR4XSkuZm9jdXMoKTtcbi8vICAgICAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgICAgIGNhc2UgMjc6IC8vIGFsbG93cyB1c2VyIHRvIHByZXNzIGVzY2FwZSBrZXkgdG8gcmV0dXJuIHRvIG5vcm1hbFxuLy8gICAgICAgICAgICAgICAgICQoJyNJbmZvX0Nsb3NlcicpLnRyaWdnZXIoJ2NsaWNrJyk7XG4vLyAgICAgICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgICAgICBkZWZhdWx0OlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuLy8gICAgICAgICB9XG4vLyAgICAgfSk7XG4vLyB9XG4iLCJ2YXIgY3VyQ2hhcHRlcjtcbnZhciBzYXZlRGF0YSA9IHt9O1xudmFyIGNoYXJ0UHJvZ3Jlc3NSZWNvcmRlZCA9IHt9O1xuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xuXHRpbml0Q291cnNlKCk7XG5cdGRvY3VtZW50U2V0dXAoKTtcblx0Y2hhcnRQcm9ncmVzcygpO1xuXHRpZiAoIWdsb2JhbFZhci5kZXZNb2RlICYmIChsbXNDb25uZWN0ZWQgfHwgZ2xvYmFsVmFyLnNjb3JtU2V0dGluZ3MudXNlTG9jYWwpKSB7XG5cdFx0anVtcFRvU2xpZGUoc2F2ZURhdGEuYm9va21hcmspO1xuXHR9XG5cdC8vIEVsZW1lbnRzIHRvIGluamVjdFxuXHR2YXIgbXlTVkdzVG9JbmplY3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdpbWcuaW5qZWN0LW1lJyk7XG5cdC8vIERvIHRoZSBpbmplY3Rpb24uIGtlZXAgbGFzdCEhIVxuXHRTVkdJbmplY3RvcihteVNWR3NUb0luamVjdCk7XG59KTtcblxuZnVuY3Rpb24gZmlyc3RUaW1lU2V0dXAoKSB7XG5cdC8vZmlyc3QgYW5kIG9ubHkgZXhlY3V0aW9uIG9mIGNvZGUsIHdoZW4gdGhlIGNvdXJzZSBzdGFydHMgZmlyc3QgdGltZSBnaXZlcyBhbGwgc2xpZGVzIGEgbnVtYmVyIGFuZCBzZXRzIGRlZmF1bHRzIGZvciB1c2VyIGF0dGVtcHRzIGFuZCB0cnlzXG5cblx0aGFuZGxlTWFzdGVyQW5kR3JvdXBzKCk7XG5cblx0c2V0TW9kYWxEZWZhdWx0cygpO1xuXHRzZXREYXRhRGVmYXVsdHMoKTtcblx0c2V0Q29pbkRlZmF1bHRzKCk7XG5cdHNldFNsaWRlQ29tcGxldGlvbkRlZmF1bHRzKCk7XG5cdHNldENsaWVudFRlbXBsYXRlKCk7XG5cdHdpbmRvdy5sZWFkZXJsaW5lcyA9IHt9O1xufVxuXG5mdW5jdGlvbiBkb2N1bWVudFNldHVwKCkge1xuXHRpbml0UHJlbG9hZGVyKCk7XG5cdHNldEdsb2JhbFZhcnMoJCgnc2VjdGlvbicgKyAnLnByZXNlbnQnKVswXS5pZCk7XG5cdGZpcnN0VGltZVNldHVwKCk7XG5cdGluaXRBdWRpbygpO1xuXHQkKCdhc2lkZScpLnJlbW92ZSgpO1xuXHRpbml0TmF2aWdhdGlvbigpO1xuXHRpbml0U2lkZU1lbnUoKTtcblxuXHRpZiAoZ2xvYmFsVmFyLmRldk1vZGUpIGRldk1vZGUoKTtcblxuXHRpZiAoJCgnI3NpLXByb2dyZXNzLW1ldGVyJykubGVuZ3RoICE9IDApIHtcblx0XHRjaGFydEluaXRpYXRlKCk7XG5cdH1cblx0aW5pdEZlZWRiYWNrcygpO1xuXHRpbml0UXVpeigpO1xuXHRpbml0TWVudSgpO1xuXHRmdW5jdGlvbkNhbGxzKCk7XG5cdHJhbmRvbWl6ZVF1ZXN0aW9uU2xpZGVzKCk7XG5cblx0UmV2ZWFsLmFkZEV2ZW50TGlzdGVuZXIoJ3NsaWRlY2hhbmdlZCcsIGZ1bmN0aW9uIChlKSB7XG5cdFx0JCgnI3NpLW5hdi1jb250YWluZXInKS5yZW1vdmVDbGFzcygndmpzLWZhZGUtb3V0Jyk7XG5cdFx0dW5sb2NrKCQoJyNzaS1zdWJtaXQnKSk7XG5cdFx0c2V0R2xvYmFsVmFycyhlLmN1cnJlbnRTbGlkZS5pZCk7XG5cblx0XHRjbG9zZVNpZGVNZW51KCk7XG5cblx0XHRzbGlkZUFjdGlvbihlLnByZXZpb3VzU2xpZGUuaWQsICdvbkV4aXRBY3Rpb24nKTtcblx0XHRlLnByZXZpb3VzU2xpZGUuaWQ7XG5cdFx0ZnVuY3Rpb25DYWxscygpO1xuXHR9KTtcblxuXHQvL3NldCBmb250IHNpemVzXG5cdHZhciBmb250U2l6ZSA9ICQoJy5zbGlkZXMnKS53aWR0aCgpIC8gZ2xvYmFsVmFyLmZvbnRTaXplRmFjdG9yO1xuXHQkKCdodG1sJykuY3NzKCdmb250LXNpemUnLCBmb250U2l6ZSk7XG5cblx0JCh3aW5kb3cpLnJlc2l6ZShmdW5jdGlvbiAoKSB7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgZm9udFNpemUgPSAkKCcuc2xpZGVzJykud2lkdGgoKSAvIGdsb2JhbFZhci5mb250U2l6ZUZhY3Rvcjtcblx0XHRcdCQoJ2h0bWwnKS5jc3MoJ2ZvbnQtc2l6ZScsIGZvbnRTaXplKTtcblx0XHR9LCAxKTtcblx0fSk7XG5cblx0JCgnaW1nJykub24oJ2RyYWdzdGFydCcsIGZ1bmN0aW9uIChldmVudCkge1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBzZXRHbG9iYWxWYXJzKHNsaWRlSUQpIHtcblx0Ly8gREVQUkVDSUFURURcblx0Z2xvYmFsVmFyLmN1clNsaWRlID0gc2xpZGVJRDtcblx0Ly8gREVQUkVDSUFURURcblx0Z2xvYmFsVmFyLiRjdXJTbGlkZSA9ICQoJyMnICsgc2xpZGVJRCk7XG5cblx0Z2xvYmFsVmFyLnNsaWRlID0gZ2V0U2xpZGVIZWxwZXJzKHNsaWRlSUQpO1xufVxuZnVuY3Rpb24gc2V0Q2xpZW50VGVtcGxhdGUoKSB7XG5cdGlmIChnbG9iYWxWYXIuY2xpZW50VGVtcGxhdGUpIHtcblx0XHQkKCdib2R5JykuYWRkQ2xhc3MoJ3NpLScgKyBnbG9iYWxWYXIuY2xpZW50VGVtcGxhdGUpO1xuXHRcdGlmIChnbG9iYWxWYXIuY2xpZW50VGVtcGxhdGUgPT09ICdibXMnKSB7XG5cdFx0XHRnbG9iYWxWYXIuYnV0dG9uVHlwZSA9ICdjdXN0b20nO1xuXHRcdFx0Z2xvYmFsVmFyLmxvY2tDbG9zZXJzRHVyaW5nRmVlZGJhY2tWTyA9IHRydWU7XG5cdFx0XHRnbG9iYWxWYXIubG9ja1N1Ym1pdElmVW5hdHRlbXB0ZWQgPSB0cnVlO1xuXHRcdFx0Z2xvYmFsVmFyLnZpZGVvLnByb2dyZXNzQ29udHJvbCA9IGZhbHNlO1xuXHRcdFx0JCgnI3NpLWNvdXJzZS1uYXYnKS5wcmVwZW5kKCQoJyNzaS1sb2dvJykpO1xuXHRcdH1cblx0XHR2YXIgbG9nb1BhdGggPSAnLi9tZWRpYS9pbWdzL19pbWdzL2NsaWVudC10ZW1wbGF0ZS8nICsgZ2xvYmFsVmFyLmNsaWVudFRlbXBsYXRlICsgJy1sb2dvLnN2Zyc7XG5cdFx0JCgnLnNpLWxvZ28tc3dhcF9fanMgaW1nJykuYXR0cignc3JjJywgbG9nb1BhdGgpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9IGVsc2Uge1xuXHRcdC8vIGNvbnNvbGUubG9nKCdObyBjbGllbnQgdGVtcGxhdGUgc2V0Jylcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn1cblxuZnVuY3Rpb24gYWN0aW9uc09uRXZlcnlTbGlkZUVudGVyKCkge1xuXHQvL3doYXRldmVyIHlvdSB3YW50IHRvIGV4ZWN1dGUgb24gZXZlcnkgc2xpZGUgY2hhbmdlXG59XG5cbi8vZXhlY3V0ZSB3aGF0ZXZlciBpcyBpbnNpZGUgb25FbnRlckFjdGlvbiwgc2V0cyB2aXNpdGVkIHRvIHRydWVcbmZ1bmN0aW9uIG9uRW50ZXJBY3Rpb24oeyBpZDogaWQsIGRhdGE6IGRhdGEsICRkb206ICRkb20gfSkge1xuXHRpZiAoZGF0YS52aXNpdGVkID09PSB1bmRlZmluZWQpIHtcblx0XHRkYXRhLnZpc2l0ZWQgPSBmYWxzZTtcblx0fVxuXG5cdCQoJ3NlY3Rpb246bm90KC5wcmVzZW50KScpLmVhY2goZnVuY3Rpb24gKGlkeCwgc2xpZGUpIHtcblx0XHQkKCdib2R5JykucmVtb3ZlQ2xhc3Moc2xpZGUuaWQpO1xuXHRcdGlmIChzbGlkZXNbc2xpZGUuaWRdLnN0eWxlTGFiZWwpICQoJ2JvZHknKS5yZW1vdmVDbGFzcyhzbGlkZXNbc2xpZGUuaWRdLnN0eWxlTGFiZWwpO1xuXHR9KTtcblxuXHQkKCdib2R5JykuYWRkQ2xhc3MoaWQpO1xuXHRpZiAoZGF0YS5zdHlsZUxhYmVsKSAkKCdib2R5JykuYWRkQ2xhc3MoZGF0YS5zdHlsZUxhYmVsKTtcblxuXHQkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKTtcblx0aWYgKHNpQXVkaW9baWRdLmluaXRpYWwgJiYgZGF0YS52aXNpdGVkID09PSBmYWxzZSkge1xuXHRcdGlmIChzaUF1ZGlvLnNmeC5jbGljay5wbGF5aW5nKCkpIHtcblx0XHRcdHNpQXVkaW8uc2Z4LmNsaWNrLm9uY2UoJ2VuZCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0SG93bGVyLnN0b3AoKTtcblx0XHRcdFx0c2lBdWRpb1tpZF0uaW5pdGlhbC5wbGF5KCk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0SG93bGVyLnN0b3AoKTtcblx0XHRcdHNpQXVkaW9baWRdLmluaXRpYWwucGxheSgpO1xuXHRcdH1cblx0fSBlbHNlIGlmIChzaUF1ZGlvW2lkXS5vbkVudGVyKSB7XG5cdFx0aWYgKHNpQXVkaW8uc2Z4LmNsaWNrLnBsYXlpbmcoKSkge1xuXHRcdFx0c2lBdWRpby5zZnguY2xpY2sub25jZSgnZW5kJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRIb3dsZXIuc3RvcCgpO1xuXHRcdFx0XHRzaUF1ZGlvW2lkXS5vbkVudGVyLnBsYXkoKTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRIb3dsZXIuc3RvcCgpO1xuXHRcdFx0c2lBdWRpb1tpZF0ub25FbnRlci5wbGF5KCk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGlmIChzaUF1ZGlvLnNmeC5jbGljay5wbGF5aW5nKCkpIHtcblx0XHRcdHNpQXVkaW8uc2Z4LmNsaWNrLm9uY2UoJ2VuZCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0SG93bGVyLnN0b3AoKTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRIb3dsZXIuc3RvcCgpO1xuXHRcdH1cblx0fVxuXG5cdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdHNsaWRlQWN0aW9uKGlkLCAnb25FbnRlckFjdGlvbicpO1xuXG5cdFx0ZGF0YS52aXNpdGVkID0gdHJ1ZTtcblx0fSwgMTApO1xuXHRpZiAobG1zQ29ubmVjdGVkICYmIGRhdGEuc2xpZGVOdW1iZXIgIT09IDEpIHtcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdHNhdmVMTVMoKTtcblx0XHR9LCAxMDAwKTtcblx0fVxuXHRpZiAoZ2xvYmFsVmFyLnNjb3JtU2V0dGluZ3MudXNlTG9jYWwgJiYgZGF0YS5zbGlkZU51bWJlciAhPT0gMSkge1xuXHRcdHNhdmVQcm9ncmVzc0xvY2FsbHkoKTtcblx0fVxufVxuXG4vL09yZGVyIG9mIGNhbGxpbmcgdGhlIGZ1bmN0aW9ucyB0byBnZW5lcmF0ZSB0aGUgY3VycmVudCBzbGlkZVxuZnVuY3Rpb24gZnVuY3Rpb25DYWxscygpIHtcblx0JCgnYm9keScpLm9mZigpO1xuXG5cdHNldEdsb2JhbFZhcnMoJCgnLnNsaWRlcyA+IC5wcmVzZW50JylbMF0uaWQpO1xuXG5cdHZhciBzbGlkZSA9IGdsb2JhbFZhci5zbGlkZTtcblxuXHRvbkVudGVyQWN0aW9uKHNsaWRlKTtcblx0YWN0aW9uc09uRXZlcnlTbGlkZUVudGVyKCk7XG5cdHNob3dOYXZFbGVtZW50cygpO1xuXHRlbGVtZW50c0ZhZGluZ09uU2xpZGUoc2xpZGUpO1xuXG5cdHN3aXRjaCAoc2xpZGUuZGF0YS50eXBlKSB7XG5cdFx0Y2FzZSAnbWVudSc6XG5cdFx0XHRtZW51RnVuY3Rpb25zKCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdkbmQnOlxuXHRcdFx0ZG5kRnVuY3Rpb24oKTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ3NvcnQnOlxuXHRcdFx0c29ydEZ1bmN0aW9ucygpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnaG90c3BvdCc6XG5cdFx0XHRob3RzcG90RnVuY3Rpb25zKCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdmb3JtJzpcblx0XHRcdGZvcm1GdW5jdGlvbnMoKTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ3F1aXonOlxuXHRcdFx0cXVpekZ1bmN0aW9uKCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdzY3JhdGNoJzpcblx0XHRcdHNjcmF0Y2hGdW5jdGlvbnMoc2xpZGUpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAndmlkZW8nOlxuXHRcdFx0dmlkZW9DaGVjaygpO1xuXHRcdFx0YnJlYWs7XG5cdFx0ZGVmYXVsdDpcblx0XHRcdGJyZWFrO1xuXHR9XG5cblx0aWYgKCQoJyNzaS1wcm9ncmVzcy1tZXRlcicpLmxlbmd0aCAhPSAwKSB7XG5cdFx0Y2hhcnRQcm9ncmVzcygpO1xuXHR9XG5cblx0Ly8gSUU5IEJ1Z2ZpeFxuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHQkKCdzZWN0aW9uLmZ1dHVyZScpLmNzcygnZGlzcGxheScsICdub25lJyk7XG5cdFx0JCgnc2VjdGlvbi5wYXN0JykuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcblx0fSwgNTUpO1xufVxuXG4vLy8vLy8vLy8vLy8qRmVhdHVyZTogUXVlc3Rpb24gQ2hlY2sgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vIFRoaXMgZnVuY3Rpb24gY29udGFpbnMgdGhlIG1haW4gbG9naWMgaW4gZGV0ZXJtaW5pbmcgaWYgYSBxdWVzdGlvbiBpcyByaWdodCBvciB3cm9uZ1xuLy8gSXQgZGV0ZXJtaW5lcyB0aGUgcXVlc3Rpb24gdHlwZSwgcnVucyB0aGUgbG9naWMgZm9yIHRoYXQgdHlwZSBhbmQgcmV0dXJucyBhIGJvb2xlYW5cbi8vIFRoaXMgYm9vbGVhbiwgY2FsbGVkIGJvbCwgIGlzIGZlZCBhcyBhbiBhcmd1bWVudCB0byBoYW5kbGVBbnN3ZXIoYm9sKSB3aGljaCBpcyByZXNwb25zaWJsZSBmb3IgaGFuZGxpbmcgZmVlZGJhY2sgcmVzcG9uc2VzXG5cbi8vIFRvIGFkZCB1bmlxdWUgbG9naWMgZm9yIGEgY3VzdG9tIHR5cGUsIGV4dGVuZCB0aGUgbWFpbiBzd2l0Y2ggc3RhdGVtZW50LCBhc3NpZ24gdHJ1ZSBvciBmYWxzZSB0byBib2wsIHRoZW4gJ2JyZWFrJ1xuZnVuY3Rpb24gY2hlY2tRdWVzdGlvbih0eXBlKSB7XG5cdHZhciBzbGlkZSA9IGdsb2JhbFZhci5zbGlkZTtcblx0dmFyIGJvbCA9IHRydWU7XG5cdHZhciBib2wyO1xuXHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRjYXNlICdxdWl6Jzpcblx0XHRcdHZhciBjb3JyZWN0QW5zd2VycyA9IHNsaWRlLmRhdGEucXVpei5hbnN3ZXJzO1xuXHRcdFx0dmFyIHNlbGVjdGVkQW5zd2VycyA9IHt9O1xuXHRcdFx0dmFyIGNob2ljZXMgPSBzbGlkZS4kZG9tLmZpbmQoJy5zaS1xdWl6LWFuc3dlcicpO1xuXHRcdFx0Y2hvaWNlcy5lYWNoKGZ1bmN0aW9uIChpZHgsIGNob2ljZSkge1xuXHRcdFx0XHR2YXIgaWQgPSAkKGNob2ljZSkuYXR0cignaWQnKSB8fCAnd3JvbmcnICsgaWR4O1xuXHRcdFx0XHRpZiAoJChjaG9pY2UpLmhhc0NsYXNzKCdzaS1xdWl6LXNlbGVjdGVkJykpIHtcblx0XHRcdFx0XHRzZWxlY3RlZEFuc3dlcnNbaWRdID0gMTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZWxlY3RlZEFuc3dlcnNbaWRdID0gMDtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIWNvcnJlY3RBbnN3ZXJzW2lkXSkge1xuXHRcdFx0XHRcdGNvcnJlY3RBbnN3ZXJzW2lkXSA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Zm9yIChhbnN3ZXIgaW4gc2VsZWN0ZWRBbnN3ZXJzKSB7XG5cdFx0XHRcdGlmIChjb3JyZWN0QW5zd2Vyc1thbnN3ZXJdICE9PSBzZWxlY3RlZEFuc3dlcnNbYW5zd2VyXSkge1xuXHRcdFx0XHRcdGJvbCA9IGZhbHNlO1xuXHRcdFx0XHRcdHJldHVybiBib2w7XG5cdFx0XHRcdH0gZWxzZSBpZiAoc2xpZGUuZGF0YS5jb2luU2V0dGluZ3MuZWFybkJ5QW5zd2VyQ2hvaWNlKSB7XG5cdFx0XHRcdFx0aWYgKHNlbGVjdGVkQW5zd2Vyc1thbnN3ZXJdID09PSAxKSB7XG5cdFx0XHRcdFx0XHRhZGRDb2luRm9yQW5zd2VyKGFuc3dlcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoIWJvbCkge1xuXHRcdFx0XHRyZXR1cm4gYm9sO1xuXHRcdFx0fVxuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnaG90c3BvdCc6XG5cdFx0XHRib2wgPSBjaGVja0hvdHNwb3QoKTtcblx0XHRcdGlmICghYm9sKSByZXR1cm47XG5cblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ2Zvcm0nOlxuXHRcdFx0Ym9sID0gY2hlY2tGb3JtKCk7XG5cdFx0XHRpZiAoIWJvbCkgcmV0dXJuO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnZG5kJzpcblx0XHRcdGJvbCA9IGNoZWNrRG5kKCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdzb3J0Jzpcblx0XHRcdGJvbCA9IHRydWU7XG5cdFx0XHR2YXIgbGlzdEFycmF5ID0gT2JqZWN0LmtleXMoc2xpZGUuZGF0YVt0eXBlXS5zb3J0YWJsZXMpO1xuXHRcdFx0dmFyIGFuc3dlckFycmF5ID0gW107XG5cdFx0XHRsaXN0QXJyYXkuZm9yRWFjaChmdW5jdGlvbiAobGlzdCkge1xuXHRcdFx0XHRhbnN3ZXJBcnJheS5wdXNoKHNsaWRlLmRhdGFbdHlwZV0uc29ydGFibGVzW2xpc3RdLmFuc3dlcik7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gY2hlY2sgdGhhdCBhbnN3ZXJzIGhhdmUgYmVlbiBwcm92aWRlZCBmb3IgYWxsIHNvcnRhYmxlIGxpc3RzIGJlZm9yZSBwcm9jZWVkaW5nXG5cdFx0XHRpZiAobGlzdEFycmF5Lmxlbmd0aCAhPT0gYW5zd2VyQXJyYXkubGVuZ3RoKSB7XG5cdFx0XHRcdGJvbCA9IGZhbHNlO1xuXHRcdFx0XHRyZXR1cm4gYm9sO1xuXHRcdFx0fVxuXG5cdFx0XHRsaXN0QXJyYXkuZm9yRWFjaChmdW5jdGlvbiAobGlzdElkLCBpZHgpIHtcblx0XHRcdFx0dmFyIHBvc3NpYmxlQW5zd2VyID0gJCgnIycgKyBsaXN0SWQpLnNvcnRhYmxlKCd0b0FycmF5Jyk7XG5cblx0XHRcdFx0Ly8gSW5jb3JyZWN0IGlmIHRoZSBhbW91bnQgb2YgaXRlbXMgaW4gdGhlIGNoZWNrZWQgc29ydGFibGUgZG9lcyBub3QgbWF0Y2ggdGhlIGFtb3VudCBvZiBhbnN3ZXJzIHByb3ZpZGVkIGluIHRoZSBhbnN3ZXIga2V5XG5cdFx0XHRcdGlmIChwb3NzaWJsZUFuc3dlci5sZW5ndGggIT09IGFuc3dlckFycmF5W2lkeF0ubGVuZ3RoKSB7XG5cdFx0XHRcdFx0Ym9sID0gZmFsc2U7XG5cdFx0XHRcdFx0cmV0dXJuIGJvbDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEV4Y3V0ZXMgaWYgdW5vcmRlcmVkIGtleSBpcyBzZXQgdG8gZmFsc2Ugb3IgaWYga2V5IGlzIGFic2VudFxuXHRcdFx0XHQvLyBUaGlzIGJyYW5jaCBpcyBvbmx5IGNvcnJlY3QgaWYgdGhlIHN1Ym1pdHRlZCBhbnN3ZXIgbWF0Y2hlcyB0aGUgYW5zd2VyIGtleSBpbiBib3RoIGNvbnRlbnQgQU5EIG9yZGVyXG5cdFx0XHRcdGlmIChzbGlkZS5kYXRhW3R5cGVdLnVub3JkZXJlZCA9PT0gZmFsc2UgfHwgc2xpZGUuZGF0YVt0eXBlXS51bm9yZGVyZWQgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdHBvc3NpYmxlQW5zd2VyLmZvckVhY2goZnVuY3Rpb24gKGFuc3dlciwgaWR4Mikge1xuXHRcdFx0XHRcdFx0aWYgKGFuc3dlciAhPT0gYW5zd2VyQXJyYXlbaWR4XVtpZHgyXSkge1xuXHRcdFx0XHRcdFx0XHRib2wgPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGJvbDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHQvLyBFeGVjdXRlcyBpZiB1bm9yZGVyZWQga2V5IGlzIHNldCB0byB0cnVlLlxuXHRcdFx0XHRcdC8vIFRoaXMgYnJhbmNoIGlzIGNvcnJlY3QgaWYgdGhlIHN1Ym1pdHRlZCBhbnN3ZXIgbWF0Y2hlcyB0aGUgYW5zd2VyIGtleSBpbiBjb250ZW50IG9ubHkuIE9yZGVyIGlzIGlycmVsZXZhbnRcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRwb3NzaWJsZUFuc3dlci5mb3JFYWNoKGZ1bmN0aW9uIChhbnN3ZXIpIHtcblx0XHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdFx0IWFuc3dlckFycmF5W2lkeF0uc29tZShmdW5jdGlvbiAoZWwpIHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZWwgPT09IGFuc3dlcjtcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdCkge1xuXHRcdFx0XHRcdFx0XHRib2wgPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGJvbDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRicmVhaztcblx0XHRkZWZhdWx0OlxuXHRcdFx0Ym9sID0gZmFsc2U7XG5cdFx0XHRicmVhaztcblx0fSAvL2VuZCBzd2l0Y2hcblx0cmV0dXJuIGJvbDtcbn0gLy9jaGVja1F1ZXN0aW9uXG4vLy8vLy8vLy8vKkZlYXR1cmU6U2h1ZmZsZWQgU2xpZGVzLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiBqdW1wVG9TaHVmZmxlZFNsaWRlKHBhcnQpIHtcblx0dmFyIG4gPSBnbG9iYWxWYXIuc2h1ZmZsZWRTbGlkZXNbcGFydF0ucG9pbnRlcjtcblx0aWYgKG4gPCBnbG9iYWxWYXIuc2h1ZmZsZWRTbGlkZXNbcGFydF0uc2xpZGVzLmxlbmd0aCkge1xuXHRcdGlmIChuID09IG51bGwpIHtcblx0XHRcdC8vZmlyc3QgdGltZSBjYWxsXG5cdFx0XHRuID0gMDtcblx0XHR9XG5cdFx0anVtcFRvU2xpZGUoZ2xvYmFsVmFyLnNodWZmbGVkU2xpZGVzW3BhcnRdLnNsaWRlc1tuXSk7XG5cdFx0bisrO1xuXHRcdGdsb2JhbFZhci5zaHVmZmxlZFNsaWRlc1twYXJ0XS5wb2ludGVyID0gbjtcblx0fVxufVxuXG5mdW5jdGlvbiByZXNldFNodWZmbGVkU2xpZGUocGFydCkge1xuXHRnbG9iYWxWYXIuc2h1ZmZsZWRTbGlkZXNbcGFydF0ucG9pbnRlciA9IG51bGw7XG59XG5cbi8vLy8vLy8vLypGZWF0dXJlOlJhbmRvbWl6ZSBRdWVzdGlvbnMvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiByYW5kb21pemVRdWVzdGlvblNsaWRlcygpIHtcblx0aWYgKGdsb2JhbFZhci5yYW5kb21pemVTbGlkZXMudXNlUmFuZG9taXplID09IHRydWUpIHtcblx0XHR2YXIgeCA9IGdsb2JhbFZhci5yYW5kb21pemVTbGlkZXMuc2xpZGVzO1xuXHRcdHZhciBuID0gW107XG5cdFx0aWYgKE9iamVjdC5rZXlzKHgpICE9IDApIHtcblx0XHRcdGZvciAoa2V5IGluIHgpIHtcblx0XHRcdFx0biA9IFtdO1xuXHRcdFx0XHRpZiAoeFtrZXldWzBdIDwgeFtrZXldWzFdKSB7XG5cdFx0XHRcdFx0Ly8xc3QgdmFsdWUgbXVzdCBiZSBsZXNzIHRoYW4gMm5kXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IHhba2V5XVswXTsgaSA8PSB4W2tleV1bMV07IGkrKykge1xuXHRcdFx0XHRcdFx0bi5wdXNoKGkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRzaHVmZmxlKG4pO1xuXHRcdFx0XHRcdG4ucHVzaCh4W2tleV1bMl0pO1xuXHRcdFx0XHRcdGdsb2JhbFZhci5zaHVmZmxlZFNsaWRlc1trZXldID0ge1xuXHRcdFx0XHRcdFx0c2xpZGVzOiBuLFxuXHRcdFx0XHRcdFx0cG9pbnRlcjogbnVsbFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuLy8vLy8vLy8vLy8vKkZlYXR1cmU6RmFkaW5nLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gZWxlbWVudHNGYWRpbmdPblNsaWRlKHsgaWQ6IGlkLCBkYXRhOiBkYXRhLCAkZG9tOiAkZG9tIH0pIHtcblx0aWYgKCRkb20uZmluZCgnW2RhdGEtZmFkZUluT3JkZXJdJykubGVuZ3RoICE9IDApIHtcblx0XHR2YXIgYXJ5ID0gW107XG5cdFx0JGRvbS5maW5kKCdbZGF0YS1mYWRlSW5PcmRlcl0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcblx0XHRcdCQodGhpcykuY3NzKCdvcGFjaXR5JywgJzAnKTtcblx0XHRcdCQodGhpcykuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcblx0XHRcdCQodGhpcykuaGlkZSgpO1xuXHRcdFx0dmFyIHRlbXAgPSBbXTtcblx0XHRcdHZhciBzdHIgPSAkKHRoaXMpLmRhdGEoJ2ZhZGVpbm9yZGVyJyk7XG5cdFx0XHR0ZW1wWzBdID0gc3RyO1xuXHRcdFx0dGVtcFsxXSA9ICQodGhpcylbMF07XG5cdFx0XHRhcnkucHVzaCh0ZW1wKTtcblx0XHR9KTtcblx0XHRhcnkuc29ydChzb3J0QXJyYXlNYXRyaXhGdW5jdGlvbik7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnkubGVuZ3RoOyBpKyspIHtcblx0XHRcdGVsZW1lbnRzRmFkZUluKGFyeVtpXVsxXSwgYXJ5W2ldWzBdKTtcblx0XHR9XG5cdH1cblxuXHRpZiAoJGRvbS5maW5kKCdbZGF0YS1mYWRlb3V0b3JkZXJdJykubGVuZ3RoICE9IDApIHtcblx0XHR2YXIgYXJ5ID0gW107XG5cdFx0JGRvbS5maW5kKCdbZGF0YS1mYWRlb3V0b3JkZXJdJykuZWFjaChmdW5jdGlvbiAoKSB7XG5cdFx0XHQkKHRoaXMpLmNzcygnb3BhY2l0eScsICcxJyk7XG5cdFx0XHQkKHRoaXMpLmNzcygnZGlzcGxheScsICdibG9jaycpO1xuXHRcdFx0JCh0aGlzKS5zaG93KCk7XG5cdFx0XHR2YXIgdGVtcCA9IFtdO1xuXHRcdFx0dmFyIHN0ciA9ICQodGhpcykuZGF0YSgnZmFkZW91dG9yZGVyJyk7XG5cdFx0XHR0ZW1wWzBdID0gc3RyO1xuXHRcdFx0dGVtcFsxXSA9ICQodGhpcylbMF07XG5cdFx0XHRhcnkucHVzaCh0ZW1wKTtcblx0XHR9KTtcblx0XHRhcnkuc29ydChzb3J0QXJyYXlNYXRyaXhGdW5jdGlvbik7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnkubGVuZ3RoOyBpKyspIHtcblx0XHRcdGVsZW1lbnRzRmFkZU91dChhcnlbaV1bMV0sIGFyeVtpXVswXSk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGVsZW1lbnRzRmFkZUluKGVsLCB4KSB7XG5cdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdCQoZWwpLmZhZGVUbygnZmFzdCcsIDEpO1xuXHR9LCB4KTtcbn1cblxuZnVuY3Rpb24gZWxlbWVudHNGYWRlT3V0KGVsLCB4KSB7XG5cdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdCQoZWwpLmZhZGVUbygnZmFzdCcsIDApO1xuXHR9LCB4KTtcbn1cblxuLy8gYXJ5LnNvcnQoc29ydEFycmF5TWF0cml4RnVuY3Rpb24pOyBtdXN0IGJlIGFyeT1bWzQseHhdLFsyLHh4XSxbMSx4eF1dXG5mdW5jdGlvbiBzb3J0QXJyYXlNYXRyaXhGdW5jdGlvbihhLCBiKSB7XG5cdGlmIChhWzBdID09PSBiWzBdKSB7XG5cdFx0cmV0dXJuIDA7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIGFbMF0gPCBiWzBdID8gLTEgOiAxO1xuXHR9XG59XG5cbi8vLy8vLy8vLy8vLypGZWF0dXJlOk1pc2NlbGxhbmVvdXMvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy9zaHVmZmxlIGFuIGFycmF5LCByZXR1cm5zIHNodWZmbGVkIGFycmF5XG4vLyB1c2VkIGluIHNsaWRlIHJhbmRvbWl6ZXIgYW5kIG1jcS9zY3EgcmFuZG9taXplclxuZnVuY3Rpb24gc2h1ZmZsZShhcnJheSkge1xuXHR2YXIgY3VycmVudEluZGV4ID0gYXJyYXkubGVuZ3RoLFxuXHRcdHRlbXBvcmFyeVZhbHVlLFxuXHRcdHJhbmRvbUluZGV4O1xuXHQvLyBXaGlsZSB0aGVyZSByZW1haW4gZWxlbWVudHMgdG8gc2h1ZmZsZS4uLlxuXHR3aGlsZSAoMCAhPT0gY3VycmVudEluZGV4KSB7XG5cdFx0Ly8gUGljayBhIHJlbWFpbmluZyBlbGVtZW50Li4uXG5cdFx0cmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjdXJyZW50SW5kZXgpO1xuXHRcdGN1cnJlbnRJbmRleCAtPSAxO1xuXHRcdC8vIEFuZCBzd2FwIGl0IHdpdGggdGhlIGN1cnJlbnQgZWxlbWVudC5cblx0XHR0ZW1wb3JhcnlWYWx1ZSA9IGFycmF5W2N1cnJlbnRJbmRleF07XG5cdFx0YXJyYXlbY3VycmVudEluZGV4XSA9IGFycmF5W3JhbmRvbUluZGV4XTtcblx0XHRhcnJheVtyYW5kb21JbmRleF0gPSB0ZW1wb3JhcnlWYWx1ZTtcblx0fVxuXHRyZXR1cm4gYXJyYXk7XG59XG5cbi8vYWRkcyBlcXVhbHMvY2hlY2tzIHRvIHNlZSBpZiBhcnJheXMgZXF1YWwgZWFjaCBvdGhlclxuQXJyYXkucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIChhcnJheSkge1xuXHQvLyBpZiB0aGUgb3RoZXIgYXJyYXkgaXMgYSBmYWxzeSB2YWx1ZSwgcmV0dXJuXG5cdGlmICghYXJyYXkpIHJldHVybiBmYWxzZTtcblxuXHQvLyBjb21wYXJlIGxlbmd0aHMgLSBjYW4gc2F2ZSBhIGxvdCBvZiB0aW1lXG5cdGlmICh0aGlzLmxlbmd0aCAhPSBhcnJheS5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuXHRmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdFx0Ly8gQ2hlY2sgaWYgd2UgaGF2ZSBuZXN0ZWQgYXJyYXlzXG5cdFx0aWYgKHRoaXNbaV0gaW5zdGFuY2VvZiBBcnJheSAmJiBhcnJheVtpXSBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0XHQvLyByZWN1cnNlIGludG8gdGhlIG5lc3RlZCBhcnJheXNcblx0XHRcdGlmICghdGhpc1tpXS5lcXVhbHMoYXJyYXlbaV0pKSByZXR1cm4gZmFsc2U7XG5cdFx0fSBlbHNlIGlmICh0aGlzW2ldICE9IGFycmF5W2ldKSB7XG5cdFx0XHQvLyBXYXJuaW5nIC0gdHdvIGRpZmZlcmVudCBvYmplY3QgaW5zdGFuY2VzIHdpbGwgbmV2ZXIgYmUgZXF1YWw6IHt4OjIwfSAhPSB7eDoyMH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHRydWU7XG59O1xuLy8gSGlkZSBtZXRob2QgZnJvbSBmb3ItaW4gbG9vcHNcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShBcnJheS5wcm90b3R5cGUsICdlcXVhbHMnLCB7XG5cdGVudW1lcmFibGU6IGZhbHNlXG59KTtcbmNvbnN0IHZhbGlkR3JvdXBzID0gZ3JvdXAgPT4gZ3JvdXAgJiYgZ3JvdXBbMF0gIT09IG51bGwgJiYgZ3JvdXBbMF0gIT09IHVuZGVmaW5lZCAmJiBncm91cFswXTtcblxuZnVuY3Rpb24gaGFuZGxlTWFzdGVyQW5kR3JvdXBzKCkge1xuXHRlYWNoU2xpZGUoZnVuY3Rpb24gKHsgaWQsIGRhdGEgfSkge1xuXHRcdHZhciBoYXNNYXN0ZXIgPSB0eXBlb2YgbWFzdGVyU2xpZGUgIT09ICd1bmRlZmluZWQnO1xuXHRcdHZhciBncm91cHMgPSBnZXRHcm91cHMoZGF0YS5ncm91cHMpO1xuXG5cdFx0Y29uc3QgaGFzR3JvdXAgPSBncm91cHNbMF0gIT09IG51bGwgJiYgZ3JvdXBzWzBdICE9PSB1bmRlZmluZWQ7XG5cblx0XHRpZiAoaGFzR3JvdXApIHtcblx0XHRcdGdyb3Vwcy5yZXZlcnNlKCkuZm9yRWFjaChmdW5jdGlvbiAoZ3JvdXApIHtcblx0XHRcdFx0Zm9yICh2YXIgc2V0dGluZyBpbiBncm91cCkge1xuXHRcdFx0XHRcdGNvcHlTZXR0aW5nRnJvbVRvKHNldHRpbmcsIGdyb3VwLCBkYXRhLCBpZCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Z3JvdXBzLnJldmVyc2UoKTtcblx0XHR9XG5cdFx0aWYgKGhhc01hc3Rlcikge1xuXHRcdFx0Zm9yICh2YXIgc2V0dGluZyBpbiBtYXN0ZXJTbGlkZSkge1xuXHRcdFx0XHRjb3B5U2V0dGluZ0Zyb21UbyhzZXR0aW5nLCBtYXN0ZXJTbGlkZSwgZGF0YSwgaWQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59XG5cbmZ1bmN0aW9uIGdldEdyb3Vwcyhncm91cElucHV0KSB7XG5cdGNvbnN0IG1haW5Hcm91cHMgPSBBcnJheS5pc0FycmF5KGdyb3VwSW5wdXQpID8gZ3JvdXBJbnB1dCA6IFtncm91cElucHV0XTtcblx0bGV0IG5lc3RlZEdyb3VwcztcblxuXHRpZiAoIXZhbGlkR3JvdXBzKG1haW5Hcm91cHMpKSByZXR1cm4gW107XG5cblx0bmVzdGVkR3JvdXBzID0gbWFpbkdyb3Vwc1xuXHRcdC5maWx0ZXIoZ3JvdXAgPT4gZ3JvdXAuZ3JvdXBzKVxuXHRcdC5tYXAoZ3JvdXAgPT4ge1xuXHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KGdyb3VwLmdyb3VwcykpIGdyb3VwLmdyb3VwcyA9IFtncm91cC5ncm91cHNdO1xuXHRcdFx0cmV0dXJuIGdyb3VwO1xuXHRcdH0pXG5cdFx0LnJlZHVjZSgobmV3QXJyLCBncm91cCkgPT4gbmV3QXJyLmNvbmNhdChncm91cC5ncm91cHMpLCBbXSk7XG5cblx0cmV0dXJuIFtdLmNvbmNhdChnZXRHcm91cHMobmVzdGVkR3JvdXBzKSwgbWFpbkdyb3Vwcyk7XG59XG5cbmZ1bmN0aW9uIGNvcHlTZXR0aW5nRnJvbVRvKHNldHRpbmcsIGZyb21PYmosIHRvT2JqLCBzbGlkZUlELCBjYWxsZWRSZWN1cnNpdmVseSkge1xuXHR2YXIgaXNBY3Rpb25GdW5jdGlvbiA9IHNldHRpbmcuaW5kZXhPZignQWN0aW9uJykgPj0gMCB8fCBzZXR0aW5nLmluZGV4T2YoJ2N1c3RvbVN1Ym1pdCcpID49IDA7XG5cblx0aWYgKGlzQWN0aW9uRnVuY3Rpb24pIHJldHVybjtcblxuXHR2YXIgaXNUZW1wbGF0ZUZ1bmN0aW9uID0gdHlwZW9mIGZyb21PYmpbc2V0dGluZ10gPT09ICdmdW5jdGlvbicgJiYgIWNhbGxlZFJlY3Vyc2l2ZWx5O1xuXHR2YXIgZnJvbVNldHRpbmcgPSBpc1RlbXBsYXRlRnVuY3Rpb24gPyBmcm9tT2JqW3NldHRpbmddKGdldFNsaWRlSGVscGVycyhzbGlkZUlEKSkgOiBmcm9tT2JqW3NldHRpbmddO1xuXG5cdHZhciBub3RQcmV2aW91c2x5U2V0ID0gdG9PYmpbc2V0dGluZ10gPT09IHVuZGVmaW5lZDtcblx0dmFyIG5vdE9iamVjdCA9IHR5cGVvZiBmcm9tU2V0dGluZyAhPT0gJ29iamVjdCc7XG5cblx0aWYgKG5vdFByZXZpb3VzbHlTZXQpIHJldHVybiAodG9PYmpbc2V0dGluZ10gPSBmcm9tU2V0dGluZyk7XG5cdGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZnJvbVNldHRpbmcpKSByZXR1cm4gKHRvT2JqW3NldHRpbmddID0gZnJvbVNldHRpbmcuY29uY2F0KHRvT2JqW3NldHRpbmddKSk7XG5cdGVsc2UgaWYgKG5vdE9iamVjdCkgcmV0dXJuO1xuXG5cdGZvciAodmFyIGtleSBpbiBmcm9tU2V0dGluZykge1xuXHRcdGNvcHlTZXR0aW5nRnJvbVRvKGtleSwgZnJvbVNldHRpbmcsIHRvT2JqW3NldHRpbmddLCBzbGlkZUlELCB0cnVlKTtcblx0fVxufVxuXG5mdW5jdGlvbiBjaGFuZ2VHcm91cFNldHRpbmcoZ3JvdXAsIHNldHRpbmcsIG5ld1ZhbHVlKSB7fVxuXG5mdW5jdGlvbiBzZXRNb2RhbERlZmF1bHRzKCkge1xuXHRtb3ZlTW9kYWxzVG9Nb2RhbENvbnRhaW5lcigpO1xuXHRwcmVwZW5kTW9kYWxDbG9zZXJUbygkKCcuc2ktbW9kYWxfX2pzJykpO1xufVxuXG5jb25zdCBtb3ZlTW9kYWxzVG9Nb2RhbENvbnRhaW5lciA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuICQoJ3NlY3Rpb24nKS5maW5kKCcuc2ktbW9kYWxfX2pzJykuYXBwZW5kVG8oJCgnLnNpLW1vZGFsLWNvbnRhaW5lcicpKTtcbn07XG5cbmNvbnN0IHByZXBlbmRNb2RhbENsb3NlclRvID0gZnVuY3Rpb24gKCRtb2RhbHMpIHtcblx0cmV0dXJuICRtb2RhbHNcblx0XHQubm90KCcubm8tY2xvc2VyJylcblx0XHQubm90KGZ1bmN0aW9uIChfLCBtb2RhbCkge1xuXHRcdFx0cmV0dXJuICQobW9kYWwpLmZpbmQoJy5zaS1tb2RhbC1jbG9zZXJfX2pzJykubGVuZ3RoID4gMDtcblx0XHR9KVxuXHRcdC5wcmVwZW5kKFxuXHRcdFx0JzxidXR0b24gY2xhc3M9XCJzaS1tb2RhbC1jbG9zZXIgc2ktbW9kYWwtY2xvc2VyX19qc1wiPjxpbWcgY2xhc3M9XCJzaS1pbWctc3dhcF9fanMgaW5qZWN0LW1lXCIgc3JjPVwiLi9tZWRpYS9pbWdzL25hdmlnYXRpb24vY2xhc3NpYy9jbG9zZS1jcm9zcy5zdmdcIiBhbHQ9XCJcIiAvPjwvYnV0dG9uPidcblx0XHQpO1xufTtcblxuZnVuY3Rpb24gc2V0RGF0YURlZmF1bHRzKCkge1xuXHRlYWNoU2xpZGUoZnVuY3Rpb24gKHsgZGF0YTogZGF0YSwgaWQ6IGlkIH0sIGlkeCkge1xuXHRcdGRhdGEudHlwZSA9IGRhdGEudHlwZSB8fCAndGV4dCc7XG5cdFx0ZGF0YVtkYXRhLnR5cGVdID0gZGF0YVtkYXRhLnR5cGVdIHx8IHt9O1xuXHRcdGRhdGFbZGF0YS50eXBlXS50cnlzID0gZGF0YVtkYXRhLnR5cGVdLnRyeXMgfHwgMDtcblx0XHRkYXRhW2RhdGEudHlwZV0udXNlckF0dGVtcHRzID0gZGF0YVtkYXRhLnR5cGVdLnVzZXJBdHRlbXB0cyB8fCAwO1xuXG5cdFx0ZGF0YS5pbmNsdWRlID0gZGF0YS5pbmNsdWRlID09PSB1bmRlZmluZWQgPyB0cnVlIDogZmFsc2U7XG5cdFx0ZGF0YS5zbGlkZU51bWJlciA9IGRhdGEuc2xpZGVOdW1iZXIgfHwgaWR4ICsgMTtcblxuXHRcdGlmIChkYXRhLnR5cGUgPT09ICd2aWRlbycpIGdsb2JhbFZhci52aWRlb1NlZW5baWRdID0gZmFsc2U7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBzZXRDb2luRGVmYXVsdHMoKSB7XG5cdGlmIChnbG9iYWxWYXIuZWFybkNvaW5zID09PSB0cnVlICYmICFzYXZlRGF0YS5jb2luU2NvcmUpIHNhdmVEYXRhLmNvaW5TY29yZSA9IHt9O1xuXG5cdGVhY2hTbGlkZShmdW5jdGlvbiAoeyBkYXRhOiBkYXRhLCBpZDogaWQgfSkge1xuXHRcdGlmIChnbG9iYWxWYXIuZWFybkNvaW5zID09PSB0cnVlKSB7XG5cdFx0XHRpZiAoIXNhdmVEYXRhLmNvaW5TY29yZVtpZF0pIHNhdmVEYXRhLmNvaW5TY29yZVtpZF0gPSB7fTtcblx0XHRcdGlmIChkYXRhLmNvaW5TZXR0aW5ncyA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGRhdGEuY29pblNldHRpbmdzID0ge307XG5cdFx0XHRcdGRhdGEuY29pblNldHRpbmdzLmluY2x1ZGUgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59XG5cbmZ1bmN0aW9uIHNldFNsaWRlQ29tcGxldGlvbkRlZmF1bHRzKCkge1xuXHRlYWNoU2xpZGUoZnVuY3Rpb24gKHsgZGF0YTogZGF0YSwgaWQ6IGlkIH0pIHtcblx0XHRpZiAoIWRhdGEuaW5jbHVkZSkgcmV0dXJuO1xuXG5cdFx0dmFyIHNsaWRlQ29tcGxldGlvbiA9IChzYXZlRGF0YS5zbGlkZUNvbXBsZXRpb24gPSBzYXZlRGF0YS5zbGlkZUNvbXBsZXRpb24gfHwge30pO1xuXG5cdFx0aWYgKGRhdGEuY29tcGxldGlvblBhdGgpIHtcblx0XHRcdGlmIChBcnJheS5pc0FycmF5KGRhdGEuY29tcGxldGlvblBhdGgpKSB7XG5cdFx0XHRcdGRhdGEuY29tcGxldGlvblBhdGguZm9yRWFjaChmdW5jdGlvbiAocCwgaSkge1xuXHRcdFx0XHRcdHNsaWRlQ29tcGxldGlvbltwXSA9IHNsaWRlQ29tcGxldGlvbltwXSB8fCB7fTtcblx0XHRcdFx0XHRzbGlkZUNvbXBsZXRpb25bcF1baWRdID0gc2xpZGVDb21wbGV0aW9uW3BdW2lkXSB8fCAwO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNsaWRlQ29tcGxldGlvbltkYXRhLmNvbXBsZXRpb25QYXRoXSA9IHNsaWRlQ29tcGxldGlvbltkYXRhLmNvbXBsZXRpb25QYXRoXSB8fCB7fTtcblx0XHRcdFx0c2xpZGVDb21wbGV0aW9uW2RhdGEuY29tcGxldGlvblBhdGhdW2lkXSA9IHNsaWRlQ29tcGxldGlvbltkYXRhLmNvbXBsZXRpb25QYXRoXVtpZF0gfHwgMDtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0c2xpZGVDb21wbGV0aW9uLm1haW5QYXRoID0gc2xpZGVDb21wbGV0aW9uLm1haW5QYXRoIHx8IHt9O1xuXHRcdFx0c2xpZGVDb21wbGV0aW9uLm1haW5QYXRoW2lkXSA9IHNsaWRlQ29tcGxldGlvbi5tYWluUGF0aFtpZF0gfHwgMDtcblx0XHR9XG5cdH0pO1xufVxuIiwidmFyIHNjb3JtID0gcGlwd2Vya3MuU0NPUk07IC8vU2hvcnRjdXRcbnZhciBsbXNDb25uZWN0ZWQgPSBmYWxzZTtcbnZhciB1bmxvYWRlZCA9IGZhbHNlO1xudmFyIGNvdXJzZVVSTCA9IGJ0b2Eod2luZG93LmxvY2F0aW9uLmhyZWYudG9TdHJpbmcoKSk7XG52YXIgcHJvZ3Jlc3NVUkwgPSAncHJvZ3Jlc3MnICsgY291cnNlVVJMO1xudmFyIGJvb2ttYXJrVVJMID0gJ2Jvb2ttYXJrJyArIGNvdXJzZVVSTDtcblxuZnVuY3Rpb24gaW5pdENvdXJzZSgpIHtcblx0Ly8gRG8gd2UgZXZlbiB3YW50IHRvIHRhbGsgdG8gdGhlIExNUz9cblx0aWYgKGdsb2JhbFZhci5zY29ybVNldHRpbmdzLnVzZVNjb3JtKSB7XG5cdFx0aWYgKGdsb2JhbFZhci5zY29ybVNldHRpbmdzLnN0YW5kYXJkLnRvTG93ZXJDYXNlKCkgIT09ICdhaWNjJykge1xuXHRcdFx0Y29ubmVjdFRvU0NPUk1BUEkoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29ubmVjdFRvQUlDQ0FQSSgpO1xuXHRcdH1cblx0fSBlbHNlIGlmIChnbG9iYWxWYXIuc2Nvcm1TZXR0aW5ncy51c2VMb2NhbCkge1xuXHRcdGNvbm5lY3RUb0xvY2FsU3RvcmFnZSgpO1xuXHR9IGVsc2Uge1xuXHRcdHNpTG9nKCdTQ09STScsICdJTkZPJywgJ1NDT1JNIGlzIGRpc2FibGVkLicpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGNvbm5lY3RUb0FJQ0NBUEkoKSB7XG5cdHZhciBTRCA9IHdpbmRvdy5wYXJlbnQ7XG5cblx0aWYgKHR5cGVvZiBTRC5TZXRSZWFjaGVkRW5kID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBTRC5Db21taXREYXRhID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0c2lMb2coJ0FJQ0MnLCAnQVBJJywgJ1NVQ0NFU1M6IEFJQ0MgQVBJIGZvdW5kIScpO1xuXHRcdHNpTG9nKCdBSUNDJywgJ0lOSVQnLCAnU1VDQ0VTUzogQ291cnNlIGlzIG5vdyBjb25uZWN0ZWQgdG8gdGhlIExNUyEnKTtcblx0fSBlbHNlIHtcblx0XHRzaUxvZygnQUlDQycsICdBUEknLCAnRVJST1I6IEFJQ0MgQVBJIG5vdCBmb3VuZCEnKTtcblx0XHRzaUxvZygnQUlDQycsICdJTklUJywgJ0VSUk9SOiBDb3Vyc2UgY291bGQgbm90IGNvbm5lY3QgdG8gdGhlIExNUyEnKTtcblx0fVxufVxuZnVuY3Rpb24gY29ubmVjdFRvTG9jYWxTdG9yYWdlKCkge1xuXHRpZiAoc3RvcmFnZUF2YWlsYWJsZSgnbG9jYWxTdG9yYWdlJykpIHtcblx0XHR2YXIgcmF3TG9jYWxEYXRhID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0ocHJvZ3Jlc3NVUkwpO1xuXHRcdGlmIChyYXdMb2NhbERhdGEgJiYgdHlwZW9mIHJhd0xvY2FsRGF0YSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdHZhciBsb2NhbERhdGEgPSBKU09OLnBhcnNlKHJhd0xvY2FsRGF0YSk7XG5cdFx0XHRzYXZlRGF0YSA9IGxvY2FsRGF0YTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2F2ZURhdGEgPSB7XG5cdFx0XHRcdGNvbXBsZXRpb25TdGF0dXM6ICdpbmNvbXBsZXRlJyxcblx0XHRcdFx0bGVhcm5lck5hbWU6ICdNYXJpYScsXG5cdFx0XHRcdGxlYXJuZXJJZDogJzEyMzQ1Jyxcblx0XHRcdFx0dG90YWxUaW1lOiAnMCcsXG5cdFx0XHRcdGJvb2ttYXJrOiAxLFxuXHRcdFx0XHRzY29yZTogJzAnLFxuXHRcdFx0XHRsYXN0U2xpZGVUeXBlOiAndGV4dCcsXG5cdFx0XHRcdGN1cnJlbnRWaWRlb1RpbWU6IDBcblx0XHRcdH07XG5cdFx0fVxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1bmxvYWQnLCB1bmxvYWRIYW5kbGVyKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgdW5sb2FkSGFuZGxlcik7XG5cdH1cbn1cblxuZnVuY3Rpb24gY29ubmVjdFRvU0NPUk1BUEkoKSB7XG5cdC8vc2Nvcm0uaW5pdCByZXR1cm5zIGEgYm9vbGVhblxuXHRsbXNDb25uZWN0ZWQgPSBzY29ybS5pbml0KCk7XG5cdC8vSWYgdGhlIHNjb3JtLmluaXQgZnVuY3Rpb24gc3VjY2VlZGVkLi4uXG5cdGlmIChsbXNDb25uZWN0ZWQpIHtcblx0XHRzaUxvZygnU0NPUk0nLCAnSU5JVCcsICdTVUNDRVNTOiBDb3Vyc2UgaXMgbm93IGNvbm5lY3RlZCB3aXRoIHRoZSBMTVMhJyk7XG5cdFx0dmFyIGNvbXBsZXRpb25zdGF0dXM7XG5cdFx0dmFyIGxlYXJuZXJuYW1lLCBsZWFybmVySWQsIHRvdGFsVGltZSwgbGVhcm5lclNjb3JlO1xuXHRcdHZhciByYXdEYXRhID0gc2Nvcm0uZ2V0KCdjbWkuc3VzcGVuZF9kYXRhJyk7XG5cdFx0dmFyIGJvb2ttYXJrU2Nvcm07XG5cdFx0dmFyIHNjb3JtRGF0YTtcblx0XHRpZiAoc2Nvcm0udmVyc2lvbiA9PT0gJzIwMDQnKSB7XG5cdFx0XHRjb21wbGV0aW9uc3RhdHVzID0gc2Nvcm0uZ2V0KCdjbWkuY29tcGxldGlvbl9zdGF0dXMnKTtcblx0XHRcdGxlYXJuZXJuYW1lID0gc2Nvcm0uZ2V0KCdjbWkubGVhcm5lcl9uYW1lJyk7XG5cdFx0XHRsZWFybmVySWQgPSBzY29ybS5nZXQoJ2NtaS5sZWFybmVyX2lkJyk7XG5cdFx0XHR0b3RhbFRpbWUgPSBzY29ybS5nZXQoJ2NtaS50b3RhbF90aW1lJyk7XG5cdFx0XHRsZWFybmVyU2NvcmUgPSBzY29ybS5nZXQoJ2NtaS5zY29yZS5yYXcnKTtcblx0XHRcdGJvb2ttYXJrU2Nvcm0gPSBzY29ybS5nZXQoJ2NtaS5sb2NhdGlvbicpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb21wbGV0aW9uc3RhdHVzID0gc2Nvcm0uZ2V0KCdjbWkuY29yZS5sZXNzb25fc3RhdHVzJyk7XG5cdFx0XHRsZWFybmVybmFtZSA9IHNjb3JtLmdldCgnY21pLmNvcmUuc3R1ZGVudF9uYW1lJyk7XG5cdFx0XHRsZWFybmVySWQgPSBzY29ybS5nZXQoJ2NtaS5jb3JlLnN0dWRlbnRfaWQnKTtcblx0XHRcdHRvdGFsVGltZSA9IHNjb3JtLmdldCgnY21pLmNvcmUudG90YWxfdGltZScpO1xuXHRcdFx0bGVhcm5lclNjb3JlID0gc2Nvcm0uZ2V0KCdjbWkuY29yZS5zY29yZS5yYXcnKTtcblx0XHRcdGJvb2ttYXJrU2Nvcm0gPSBzY29ybS5nZXQoJ2NtaS5jb3JlLmxlc3Nvbl9sb2NhdGlvbicpO1xuXHRcdH1cblx0XHRpZiAocmF3RGF0YSAmJiB0eXBlb2YgcmF3RGF0YSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdHNjb3JtRGF0YSA9IEpTT04ucGFyc2UocmF3RGF0YSk7XG5cdFx0XHRzYXZlRGF0YSA9IHNjb3JtRGF0YTtcblx0XHRcdC8vIGNvbXBhcmUgaW5mb3JtYXRpb24gcmVjZWl2ZWQgZnJvbSBMTVMgdG8gd2hhdCB3ZSBzdG9yZWQuICBHaXZlIHByaW9yaXR5IHRvIGhpZ2hlciB2YWx1ZXNcblx0XHRcdGlmIChib29rbWFya1Njb3JtKSB7XG5cdFx0XHRcdHNhdmVEYXRhLmJvb2ttYXJrID0gYm9va21hcmtTY29ybSA+IHNhdmVEYXRhLmJvb2ttYXJrID8gYm9va21hcmtTY29ybSA6IHNhdmVEYXRhLmJvb2ttYXJrO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGxlYXJuZXJTY29yZSkge1xuXHRcdFx0XHRzYXZlRGF0YS5zY29yZSA9IGxlYXJuZXJTY29yZSA+IHNhdmVEYXRhLnNjb3JlID8gbGVhcm5lclNjb3JlIDogc2F2ZURhdGEuc2NvcmU7XG5cdFx0XHR9XG5cdFx0XHRpZiAodG90YWxUaW1lKSB7XG5cdFx0XHRcdHNhdmVEYXRhLnRvdGFsVGltZSA9IHRvdGFsVGltZSA+IHNhdmVEYXRhLnRvdGFsVGltZSA/IHRvdGFsVGltZSA6IHNhdmVEYXRhLnRvdGFsVGltZTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0c2F2ZURhdGEgPSB7XG5cdFx0XHRcdGNvbXBsZXRpb25TdGF0dXM6IGNvbXBsZXRpb25zdGF0dXMgPyBjb21wbGV0aW9uc3RhdHVzIDogJ2luY29tcGxldGUnLFxuXHRcdFx0XHRsZWFybmVyTmFtZTogbGVhcm5lcm5hbWUgPyBsZWFybmVybmFtZSA6ICdNYXJpYScsXG5cdFx0XHRcdGxlYXJuZXJJZDogbGVhcm5lcklkID8gbGVhcm5lcklkIDogJzEyMzQ1Jyxcblx0XHRcdFx0dG90YWxUaW1lOiB0b3RhbFRpbWUgPyB0b3RhbFRpbWUgOiAnMCcsXG5cdFx0XHRcdGJvb2ttYXJrOiBib29rbWFya1Njb3JtID8gYm9va21hcmtTY29ybSA6IDEsXG5cdFx0XHRcdHNjb3JlOiBsZWFybmVyU2NvcmUgPyBsZWFybmVyU2NvcmUgOiAnMCcsXG5cdFx0XHRcdGxhc3RTbGlkZVR5cGU6ICd0ZXh0Jyxcblx0XHRcdFx0Y3VycmVudFZpZGVvVGltZTogMFxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndW5sb2FkJywgdW5sb2FkSGFuZGxlcik7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2JlZm9yZXVubG9hZCcsIHVubG9hZEhhbmRsZXIpO1xuXHRcdC8vSWYgdGhlIGNvdXJzZSBjb3VsZG4ndCBjb25uZWN0IHRvIHRoZSBMTVMgZm9yIHNvbWUgcmVhc29uLi4uXG5cdH0gZWxzZSBpZiAoZ2xvYmFsVmFyLnNjb3JtU2V0dGluZ3MudXNlTG9jYWwpIHtcblx0XHRzaUxvZygnU0NPUk0nLCAnSU5JVCcsICdFUlJPUjogQ291cnNlIGNvdWxkIG5vdCBjb25uZWN0IHdpdGggdGhlIExNUywgYXR0ZW1wdGluZyBsb2NhbCBzdG9yYWdlJyk7XG5cdFx0Y29ubmVjdFRvTG9jYWxTdG9yYWdlKCk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8uLi4gbGV0J3MgYWxlcnQgdGhlIHVzZXIgdGhlbiBjbG9zZSB0aGUgd2luZG93LlxuXHRcdHNpTG9nKCdTQ09STScsICdJTklUJywgJ0VSUk9SOiBDb3Vyc2UgY291bGQgbm90IGNvbm5lY3Qgd2l0aCB0aGUgTE1TJyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc2V0U2Nvcm1Db21wbGV0aW9uKCkge1xuXHR2YXIgc3VjY2VzcyA9IGZhbHNlO1xuXG5cdC8vIERvIHdlIGV2ZW4gd2FudCB0byB0YWxrIHRvIHRoZSBMTVM/XG5cdGlmIChnbG9iYWxWYXIuc2Nvcm1TZXR0aW5ncy51c2VTY29ybSkge1xuXHRcdC8vIEFJQ0M6XG5cdFx0Ly8gT24gdGhlIG9mZiBjaGFuY2UgdGhhdCB3ZSB3YW50IHRvIHVzZSBBSUNDIGluc3RlYWQgb2YgU0NPUk1cblxuXHRcdGlmIChnbG9iYWxWYXIuc2Nvcm1TZXR0aW5ncy5zdGFuZGFyZCA9PT0gJ2FpY2MnKSB7XG5cdFx0XHR2YXIgU0QgPSB3aW5kb3cucGFyZW50O1xuXG5cdFx0XHQvLyBDaGVjayBpZiB0aGUgQUlDQyBBUEkgaXMgYXZhaWxhYmxlIGluIHBhcmVudCBhbmQgdGVsbCBpdCB0byBzZXQgdGhlIGNvdXJzZSB0byBjb21wbGV0ZVxuXG5cdFx0XHRpZiAodHlwZW9mIFNELlNldFJlYWNoZWRFbmQgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIFNELkNvbW1pdERhdGEgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0Ly8gSWYgYm90aCBvZiB0aGUgZm9sbG93aW5nIEFJQ0MgQVBJIGZ1bmN0aW9ucyByZXR1cm4gdHJ1ZSwgd2UgYXJlIGRvbmUgaGVyZSFcblx0XHRcdFx0c3VjY2VzcyA9IFNELlNldFJlYWNoZWRFbmQoKSAmJiBTRC5Db21taXREYXRhKCk7XG5cdFx0XHRcdGlmIChzdWNjZXNzKSB7XG5cdFx0XHRcdFx0c2lMb2coJ0FJQ0MnLCAnQ09NUExFVEUnLCAnU1VDQ0VTUzogQ291cnNlIHdhcyBzdWNjZXNzZnVsbHkgc2V0IHRvIGNvbXBsZXRlIScpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIG90aGVyd2lzZSBzb21ldGhpbmcgd2VudCBob3JyaWJseSB3cm9uZy5cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0c2lMb2coJ0FJQ0MnLCAnQ09NUExFVEUnLCAnRVJST1I6IENvdXJzZSBjb3VsZCBub3QgYmUgc2V0IHRvIGNvbXBsZXRlIScpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHQvLyBvdGhlcndpc2UgdGhlIEFQSSBpc24ndCBhdmFpbGFibGVcblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRzaUxvZygnQUlDQycsICdDT01QTEVURScsICdFUlJPUjogQ291cnNlIGlzIG5vdCBjb25uZWN0ZWQgdG8gdGhlIExNUycpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFNDT1JNOlxuXG5cdFx0Ly9JZiBsbXNDb25uZWN0ZWQgaXMgdHJ1ZSAod2hpY2ggb25seSBoYXBwZW5zIGlmIHdlIGFyZSB1c2luZyB0aGUgU0NPUk0gc3RhbmRhcmQpLi4uXG5cdFx0ZWxzZSBpZiAobG1zQ29ubmVjdGVkKSB7XG5cdFx0XHQvLy4uLiB0cnkgc2V0dGluZyB0aGUgY291cnNlIHN0YXR1cyB0byBcImNvbXBsZXRlZFwiXG5cdFx0XHRpZiAoc2Nvcm0udmVyc2lvbiA9PT0gJzIwMDQnKSB7XG5cdFx0XHRcdHN1Y2Nlc3MgPSBzY29ybS5zZXQoJ2NtaS5jb21wbGV0aW9uX3N0YXR1cycsICdjb21wbGV0ZWQnKTtcblx0XHRcdFx0c2Nvcm0uc2V0KCdjbWkuc3VjY2Vzc19zdGF0dXMnLCAncGFzc2VkJyk7XG5cdFx0XHRcdHNjb3JtLnNldCgnY21pLnNjb3JlLnJhdycsICcxMDAnKTtcblx0XHRcdFx0c2Nvcm0uc2V0KCdjbWkuc2NvcmUuc2NhbGVkJywgJzEnKTtcblx0XHRcdFx0Ly8gc2Nvcm0uc2V0KFwiY21pLnNjb3JlLm1pblwiLCBnbG9iYWxWYXIubWluU2NvcmUpO1xuXHRcdFx0XHQvLyBzY29ybS5zZXQoXCJjbWkuc2NvcmUubWF4XCIsIGdsb2JhbFZhci5tYXhTY29yZSk7XG5cdFx0XHRcdC8vIHNjb3JtLnNldChcImFkbC5uYXYucmVxdWVzdFwiLCBcImV4aXRcIilcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHN1Y2Nlc3MgPSBzY29ybS5zZXQoJ2NtaS5jb3JlLmxlc3Nvbl9zdGF0dXMnLCAnY29tcGxldGVkJyk7XG5cdFx0XHRcdHNjb3JtLnNldCgnY21pLmNvcmUuc2NvcmUucmF3JywgJzEwMCcpO1xuXHRcdFx0XHQvLyBzY29ybS5zZXQoXCJjbWkuY29yZS5zY29yZS5taW5cIiwgZ2xvYmFsVmFyLm1pblNjb3JlKTtcblx0XHRcdFx0Ly8gc2Nvcm0uc2V0KFwiY21pLmNvcmUuc2NvcmUubWF4XCIsIGdsb2JhbFZhci5tYXhTY29yZSk7XG5cdFx0XHR9XG5cdFx0XHQvL0lmIHRoZSBjb3Vyc2Ugd2FzIHN1Y2Nlc3NmdWxseSBzZXQgdG8gXCJjb21wbGV0ZWRcIi4uLlxuXHRcdFx0aWYgKHN1Y2Nlc3MpIHtcblx0XHRcdFx0c2Nvcm0uc2F2ZSgpO1xuXHRcdFx0XHRzaUxvZygnU0NPUk0nLCAnQ09NUExFVEUnLCAnU1VDQ0VTUzogQ291cnNlIHdhcyBzdWNjZXNzZnVsbHkgc2V0IHRvIGNvbXBsZXRlIScpO1xuXHRcdFx0fVxuXHRcdFx0Ly9JZiB0aGUgY291cnNlIGNvdWxkbid0IGJlIHNldCB0byBjb21wbGV0ZWQgZm9yIHNvbWUgcmVhc29uLi4uXG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Ly9hbGVydCB0aGUgdXNlclxuXHRcdFx0XHRzaUxvZygnU0NPUk0nLCAnQ09NUExFVEUnLCAnRVJST1I6IENvdXJzZSBjb3VsZCBub3QgYmUgc2V0IHRvIGNvbXBsZXRlIScpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBvdGhlcndpc2UgdGhlIGNvdXJzZSBpc24ndCBjb25uZWN0ZWQgdG8gdGhlIExNUyBmb3Igc29tZSByZWFzb24uLi5cblx0XHRlbHNlIHtcblx0XHRcdC8vYWxlcnQgdGhlIHVzZXJcblx0XHRcdHNpTG9nKCdTQ09STScsICdDT01QTEVURScsICdFUlJPUjogQ291cnNlIGlzIG5vdCBjb25uZWN0ZWQgdG8gdGhlIExNUycpO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBzZXRTY29ybUluY29tcGxldGUoKSB7XG5cdGlmIChsbXNDb25uZWN0ZWQpIHtcblx0XHR2YXIgc3VjY2Vzcztcblx0XHQvLy4uLiB0cnkgc2V0dGluZyB0aGUgY291cnNlIHN0YXR1cyB0byBcImNvbXBsZXRlZFwiXG5cdFx0aWYgKHNjb3JtLnZlcnNpb24gPT09ICcyMDA0Jykge1xuXHRcdFx0c3VjY2VzcyA9IHNjb3JtLnNldCgnY21pLmNvbXBsZXRpb25fc3RhdHVzJywgJ2NvbXBsZXRlZCcpO1xuXHRcdFx0c2Nvcm0uc2V0KCdjbWkuc3VjY2Vzc19zdGF0dXMnLCAnZmFpbGVkJyk7XG5cdFx0XHRzY29ybS5zZXQoJ2NtaS5zY29yZS5yYXcnLCAnMCcpO1xuXHRcdFx0c2Nvcm0uc2V0KCdjbWkuc2NvcmUuc2NhbGVkJywgJzEnKTtcblx0XHRcdC8vIHNjb3JtLnNldChcImNtaS5zY29yZS5taW5cIiwgZ2xvYmFsVmFyLm1pblNjb3JlKTtcblx0XHRcdC8vIHNjb3JtLnNldChcImNtaS5zY29yZS5tYXhcIiwgZ2xvYmFsVmFyLm1heFNjb3JlKTtcblx0XHRcdC8vIHNjb3JtLnNldChcImFkbC5uYXYucmVxdWVzdFwiLCBcImV4aXRcIilcblx0XHR9IGVsc2Uge1xuXHRcdFx0c3VjY2VzcyA9IHNjb3JtLnNldCgnY21pLmNvcmUubGVzc29uX3N0YXR1cycsICdpbmNvbXBsZXRlJyk7XG5cdFx0XHRzY29ybS5zZXQoJ2NtaS5jb3JlLnNjb3JlLnJhdycsICcwJyk7XG5cdFx0XHQvLyBzY29ybS5zZXQoXCJjbWkuY29yZS5zY29yZS5taW5cIiwgZ2xvYmFsVmFyLm1pblNjb3JlKTtcblx0XHRcdC8vIHNjb3JtLnNldChcImNtaS5jb3JlLnNjb3JlLm1heFwiLCBnbG9iYWxWYXIubWF4U2NvcmUpO1xuXHRcdH1cblx0XHQvL0lmIHRoZSBjb3Vyc2Ugd2FzIHN1Y2Nlc3NmdWxseSBzZXQgdG8gXCJpbmNvbXBsZXRlXCIuLi5cblx0XHRpZiAoc3VjY2Vzcykge1xuXHRcdFx0c2Nvcm0uc2F2ZSgpO1xuXHRcdFx0c2lMb2coJ1NDT1JNJywgJ0lOQ09NUExFVEUnLCAnU1VDQ0VTUzogQ291cnNlIHdhcyBzdWNjZXNzZnVsbHkgc2V0IHRvIGluY29tcGxldGUhJyk7XG5cdFx0fVxuXHRcdC8vSWYgdGhlIGNvdXJzZSBjb3VsZG4ndCBiZSBzZXQgdG8gaW5jb21wbGV0ZSBmb3Igc29tZSByZWFzb24uLi5cblx0XHRlbHNlIHtcblx0XHRcdC8vYWxlcnQgdGhlIHVzZXJcblx0XHRcdHNpTG9nKCdTQ09STScsICdJTkNPTVBMRVRFJywgJ0VSUk9SOiBDb3Vyc2UgY291bGQgbm90IGJlIHNldCB0byBpbmNvbXBsZXRlIScpO1xuXHRcdH1cblx0fVxuXHQvL0lmIHRoZSBjb3Vyc2UgaXNuJ3QgY29ubmVjdGVkIHRvIHRoZSBMTVMgZm9yIHNvbWUgcmVhc29uLi4uXG5cdGVsc2Uge1xuXHRcdC8vYWxlcnQgdGhlIHVzZXJcblx0XHRzaUxvZygnU0NPUk0nLCAnSU5DT01QTEVURScsICdFUlJPUjogQ291cnNlIGlzIG5vdCBjb25uZWN0ZWQgdG8gdGhlIExNUycpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHVubG9hZEhhbmRsZXIoKSB7XG5cdHZhciBzbGlkZSA9IGdsb2JhbFZhci5zbGlkZTtcblxuXHRzYXZlRGF0YS5sYXN0U2xpZGVUeXBlID0gc2xpZGUuZGF0YS50eXBlO1xuXHRpZiAoc2xpZGUuZGF0YS50eXBlID09PSAndmlkZW8nICYmIGdsb2JhbFZhci5zY29ybVNldHRpbmdzLmJvb2ttYXJraW5nLnZpZGVvQm9va21hcmtpbmcpIHtcblx0XHRzYXZlRGF0YS5jdXJyZW50VmlkZW9UaW1lID0gdmlkZW9qcyhzbGlkZS4kZG9tLmZpbmQoJ3ZpZGVvJylbMF0uaWQpLmN1cnJlbnRUaW1lKCk7XG5cdH1cblx0aWYgKGxtc0Nvbm5lY3RlZCAmJiAhdW5sb2FkZWQpIHtcblx0XHRzYXZlTE1TKCk7XG5cdFx0c2Nvcm0uc2F2ZSgpOyAvL3NhdmUgYWxsIGRhdGEgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIHNlbnRcblx0XHRzY29ybS5xdWl0KCk7IC8vY2xvc2UgdGhlIFNDT1JNIEFQSSBjb25uZWN0aW9uIHByb3Blcmx5XG5cdFx0dW5sb2FkZWQgPSB0cnVlO1xuXHR9IGVsc2UgaWYgKGdsb2JhbFZhci5zY29ybVNldHRpbmdzLnVzZUxvY2FsICYmICF1bmxvYWRlZCkge1xuXHRcdHNhdmVQcm9ncmVzc0xvY2FsbHkoKTtcblx0XHR1bmxvYWRlZCA9IHRydWU7XG5cdH1cbn1cbmZ1bmN0aW9uIHNhdmVMTVMoKSB7XG5cdGlmIChzYXZlQ291cnNlUHJvZ3Jlc3MoKSAmJiBzYXZlQm9va21hcmsoKSkge1xuXHRcdHNjb3JtLnNhdmUoKTtcblx0fSBlbHNlIHtcblx0XHRzaUxvZygnU0NPUk0nLCAnRmFpbGVkIHRvIFNhdmUnKTtcblx0fVxufVxuXG5mdW5jdGlvbiBzYXZlQ291cnNlUHJvZ3Jlc3MoKSB7XG5cdHZhciBzdWNjZXNzO1xuXHR2YXIgZGF0YVN0cmluZztcblx0aWYgKGxtc0Nvbm5lY3RlZCkge1xuXHRcdGlmIChzY29ybS52ZXJzaW9uID09PSAnMjAwNCcpIHtcblx0XHRcdHNjb3JtLnNldCgnY21pLnNjb3JlLnJhdycsIHNhdmVEYXRhLnNjb3JlKTtcblx0XHRcdHNhdmVEYXRhLnRvdGFsVGltZSA9IHNjb3JtLmdldCgnY21pLnRvdGFsX3RpbWUnKSB8fCBzYXZlRGF0YS50b3RhbFRpbWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHNjb3JtLnNldCgnY21pLmNvcmUuc2NvcmUucmF3Jywgc2F2ZURhdGEuc2NvcmUpO1xuXHRcdFx0c2F2ZURhdGEudG90YWxUaW1lID0gc2Nvcm0uZ2V0KCdjbWkuY29yZS50b3RhbF90aW1lJykgfHwgc2F2ZURhdGEudG90YWxUaW1lO1xuXHRcdH1cblx0XHRkYXRhU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoc2F2ZURhdGEpO1xuXHRcdHN1Y2Nlc3MgPSBzY29ybS5zZXQoJ2NtaS5zdXNwZW5kX2RhdGEnLCBkYXRhU3RyaW5nKTtcblx0fVxuXHRyZXR1cm4gc3VjY2Vzcztcbn1cbmZ1bmN0aW9uIHNhdmVCb29rbWFyaygpIHtcblx0dmFyIHNsaWRlID0gZ2xvYmFsVmFyLnNsaWRlO1xuXHR2YXIgc3VjY2VzcztcblxuXHRzYXZlRGF0YS5ib29rbWFyayA9IHNsaWRlLmRhdGEuc2xpZGVOdW1iZXIgfHwgJzEnO1xuXHRpZiAobG1zQ29ubmVjdGVkKSB7XG5cdFx0aWYgKHNjb3JtLnZlcnNpb24gPT09ICcyMDA0Jykge1xuXHRcdFx0c3VjY2VzcyA9IHNjb3JtLnNldCgnY21pLmxvY2F0aW9uJywgc2F2ZURhdGEuYm9va21hcmspO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzdWNjZXNzID0gc2Nvcm0uc2V0KCdjbWkuY29yZS5sZXNzb25fbG9jYXRpb24nLCBzYXZlRGF0YS5ib29rbWFyayk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHN1Y2Nlc3M7XG59XG5cbmZ1bmN0aW9uIHNhdmVQcm9ncmVzc0xvY2FsbHkoKSB7XG5cdHZhciBzbGlkZSA9IGdsb2JhbFZhci5zbGlkZTtcblxuXHRzYXZlRGF0YS5ib29rbWFyayA9IHNsaWRlLmRhdGEuc2xpZGVOdW1iZXIgfHwgJzEnO1xuXHR2YXIgZGF0YVN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHNhdmVEYXRhKTtcblx0aWYgKHN0b3JhZ2VBdmFpbGFibGUoJ2xvY2FsU3RvcmFnZScpKSB7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0ocHJvZ3Jlc3NVUkwsIGRhdGFTdHJpbmcpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHN0b3JhZ2VBdmFpbGFibGUodHlwZSkge1xuXHR2YXIgc3RvcmFnZTtcblx0dHJ5IHtcblx0XHRzdG9yYWdlID0gd2luZG93W3R5cGVdO1xuXHRcdHZhciB4ID0gJ19fc3RvcmFnZV90ZXN0X18nO1xuXHRcdHN0b3JhZ2Uuc2V0SXRlbSh4LCB4KTtcblx0XHRzdG9yYWdlLnJlbW92ZUl0ZW0oeCk7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0ZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJlxuXHRcdFx0Ly8gZXZlcnl0aGluZyBleGNlcHQgRmlyZWZveFxuXHRcdFx0KGUuY29kZSA9PT0gMjIgfHxcblx0XHRcdFx0Ly8gRmlyZWZveFxuXHRcdFx0XHRlLmNvZGUgPT09IDEwMTQgfHxcblx0XHRcdFx0Ly8gdGVzdCBuYW1lIGZpZWxkIHRvbywgYmVjYXVzZSBjb2RlIG1pZ2h0IG5vdCBiZSBwcmVzZW50XG5cdFx0XHRcdC8vIGV2ZXJ5dGhpbmcgZXhjZXB0IEZpcmVmb3hcblx0XHRcdFx0ZS5uYW1lID09PSAnUXVvdGFFeGNlZWRlZEVycm9yJyB8fFxuXHRcdFx0XHQvLyBGaXJlZm94XG5cdFx0XHRcdGUubmFtZSA9PT0gJ05TX0VSUk9SX0RPTV9RVU9UQV9SRUFDSEVEJykgJiZcblx0XHRcdC8vIGFja25vd2xlZGdlIFF1b3RhRXhjZWVkZWRFcnJvciBvbmx5IGlmIHRoZXJlJ3Mgc29tZXRoaW5nIGFscmVhZHkgc3RvcmVkXG5cdFx0XHRzdG9yYWdlICYmXG5cdFx0XHRzdG9yYWdlLmxlbmd0aCAhPT0gMFxuXHRcdCk7XG5cdH1cbn1cbiJdfQ==
