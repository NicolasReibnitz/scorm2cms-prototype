console.log('INTERACTIVE BUILD ON: Aug 9 2024 3:33:47 PM');
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
	var checkSpecificPath = input && input[0] === '@';

	if (checkSpecificPath) return checkWholePath(input.split('@')[1]);

	var slideID = input ? input : globalVar.curSlide;
	var slideObj = slides[slideID];

	// if (!slideObj) return console.warn('invalid slide');
	// if (!slideObj.include) return console.warn('include: false');

	var onCurSlide = slideID === globalVar.curSlide;
	var slideCompletion = saveData.slideCompletion;
	var pathSelected = saveData.pathSelected;
	var specifiedPath = slideObj.completionPath;
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
	// console.log(input);

	return pathObj[slideID];
}

function checkWholePath(path) {
	var pathObj = saveData.slideCompletion[path];
	for (var key in pathObj) {
		if (!pathObj[key]) return 0;
	}
	return 1;
}

function completeSlide() {
	if (!slides[globalVar.curSlide].include) return;

	var slideID = globalVar.curSlide;
	var specifiedPath = slides[slideID].completionPath;
	var slideCompletion = saveData.slideCompletion;

	if (specifiedPath) {
		if (Array.isArray(specifiedPath)) {
			specifiedPath.forEach(function (path, idx) {
				slideCompletion[path][slideID] = 1;
			});
		} else slideCompletion[specifiedPath][slideID] = 1;
	} else slideCompletion.mainPath[slideID] = 1;
}

/**
 * @param navElem
 * @param styleClass
 * @param html
 */
function customNavStyle(navElem, styleClass, html) {
	var elem = $('#si-' + navElem);
	var initialHTML = elem.html();
	var curSlide = slides[globalVar.curSlide];

	if (html) elem.html(html);

	elem.addClass(styleClass);

	curSlide.onExitAction = (function () {
		var originalOnExit = curSlide.onExitAction;
		return function () {
			if (originalOnExit) originalOnExit.apply(this);
			elem.html(initialHTML);
			elem.removeClass(styleClass);
		};
	})();
}

////////////*Feature:idebehold///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function instaCheatAddon() {
	// console.log("Hello, I'm your instaCheat™ addon for today!");
}

//the holy cheatfunction!!!
/**
 *
 */
function devMode() {
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
			if (slides[globalVar.curSlide].modal.negative) {
				simpleModalOpen('negative');
			} else if (slides[globalVar.curSlide].modal.negative1) {
				simpleModalOpen('negative1');
			}
		}
		// 'l' key reveals negative feedback 2
		if (e.which === 76) {
			simpleModalClose();
			simpleModalOpen('negativeFinal');
		}
		// 1 - 9 for hotspots
		if (e.which === 49 && slides[globalVar.curSlide].modal.hs1) {
			simpleModalClose();
			simpleModalOpen('hs1');
		}
		if (e.which === 50 && slides[globalVar.curSlide].modal.hs2) {
			simpleModalClose();
			simpleModalOpen('hs2');
		}
		if (e.which === 51 && slides[globalVar.curSlide].modal.hs3) {
			simpleModalClose();
			simpleModalOpen('hs3');
		}
		if (e.which === 52 && slides[globalVar.curSlide].modal.hs4) {
			simpleModalClose();
			simpleModalOpen('hs4');
		}
		if (e.which === 53 && slides[globalVar.curSlide].modal.hs5) {
			simpleModalClose();
			simpleModalOpen('hs5');
		}
		if (e.which === 54 && slides[globalVar.curSlide].modal.hs6) {
			simpleModalClose();
			simpleModalOpen('hs6');
		}
		if (e.which === 55 && slides[globalVar.curSlide].modal.hs7) {
			simpleModalClose();
			simpleModalOpen('hs7');
		}
		if (e.which === 56 && slides[globalVar.curSlide].modal.hs8) {
			simpleModalClose();
			simpleModalOpen('hs8');
		}
		if (e.which === 57 && slides[globalVar.curSlide].modal.hs9) {
			simpleModalClose();
			simpleModalOpen('hs9');
		}

		//  ';' key hides all feedbacks
		if (e.which == 186) {
			simpleModalClose();
		}
	});
}

// do not use the id 'test' for a slide

$('#btn-start').on('click', function () {
	jumpToSlide(2);
	siAudio.sfx.click.play();
});

$(function () {
	slides = {
		start: {
			type: 'text',
			navElements: ['clock'],
			backAction: function () {}, //leave Start backAction as function to prevent IE9 errors
			onEnterAction: function () {},
			audio: {
				// onEnter: "media/audio/Start/0.mp3"
			},
			include: false // this key determines if the slide will be used as part of the completion of the progress meter. default is true.  do not call completeSlide() on any slide where this is set to false
		},
		intro: {
			type: 'text',
			navElements: ['standard-menu', '!menu', 'home', 'next'],
			backAction: prevSlide,
			onEnterAction: function () {},
			audio: {
				// onEnter: "media/audio/Start/0.mp3"
			},
			include: false // this key determines if the slide will be used as part of the completion of the progress meter. default is true.  do not call completeSlide() on any slide where this is set to false
		},
		v1: {
			type: 'video',
			navElements: ['standard-menu', '!progress', '!logo', '!menu', 'home'],
			backAction: prevSlide,
			nextAction: function () {
				completeSlide();
				nextSlide();
			},
			onEnterAction: function () {},
			// videoSeeking: true, //change globally in globalVar
			videoLoaded: false //don't edit
		},
		i1: {
			type: 'quiz',
			navElements: ['standard-menu', 'submit', '!menu', 'home'],
			nextAction: function () {
				completeSlide();
				nextSlide();
			},
			backAction: prevSlide,
			onEnterAction: function () {},
			audio: {
				onEnter: 'media/audio/vo/nothing.mp3',
				positive: 'media/audio/vo/nothing.mp3',
				negative1: 'media/audio/vo/nothing.mp3',
				negative2: 'media/audio/vo/nothing.mp3',
				negativeFinal: 'media/audio/vo/nothing.mp3'
			},
			quiz: {
				radio: false, //default false
				answers: {
					'i1-correct1': 1,
					'i1-correct2': 1,
					'i1-correct3': 1
				},
				audio: {},
				userAttempts: 2
			},
			modal: {
				positive: 'i1-positive',
				negative: 'i1-negative',
				// negative2: 'i1-negative-2',
				negativeFinal: 'i1-negative-final'
			},
			hotspot: { clickAnywhere: true }
		},
		i2: {
			type: 'quiz',
			navElements: ['standard-menu', 'submit', '!menu', 'home'],
			nextAction: function () {
				completeSlide();
				nextSlide();
			},
			backAction: prevSlide,
			onEnterAction: function () {},
			audio: {
				onEnter: 'media/audio/vo/nothing.mp3',
				positive: 'media/audio/vo/nothing.mp3',
				negative1: 'media/audio/vo/nothing.mp3',
				negative2: 'media/audio/vo/nothing.mp3',
				negativeFinal: 'media/audio/vo/nothing.mp3'
			},
			quiz: {
				radio: true, //default false
				answers: {
					'i2-correct': 1
				},
				audio: {},
				userAttempts: 2
			},
			modal: {
				positive: 'i2-positive',
				negative: 'i2-negative',
				negativeFinal: 'i2-negative-final'
			},
			hotspot: { clickAnywhere: true }
		},
		i3: {
			type: 'dnd',
			navElements: ['standard-menu', 'submit', 'reset', '!menu', 'home'],
			nextAction: function () {
				completeSlide();
				nextSlide();
			},
			backAction: prevSlide,
			onEnterAction: function () {},
			onExitAction: function () {},
			dnd: {
				type: 'dnd_1',
				quiz: {
					i3_drop: ['i3_drag2']
				},
				dropCounter: {
					i3_drop: 1
				},
				userAttempts: 2,
				actions: {
					//optional
					i3_drag1: {
						// onDragStart: function () {
						// 	console.log('onDragStart');
						// },
						// onDrag: function () {
						// 	console.log('onDrag');
						// },
						// onDragOver: {
						// 	i3_drop: function () {
						// 		console.log('onDragOver');
						// 	}
						// },
						// onDragEnd: function () {
						// 	console.log('onDragEnd');
						// },
						onDrop: {
							i3_drop: function () {
								$('#i3_drag2').draggable('option', 'disabled', false);
								$('#i3_drag1').draggable('option', 'disabled', true);
								$('#i3_drag2').removeClass('dropped');
								$('#i3_drag1').addClass('dropped');
								// console.log('onDrop', this);
							}
						}
					},
					i3_drag2: {
						// onDragStart: function () {
						// 	console.log('onDragStart');
						// },
						// onDrag: function () {
						// 	console.log('onDrag');
						// },
						// onDragOver: {
						// 	i3_drop: function () {
						// 		console.log('onDragOver');
						// 	}
						// },
						// onDragEnd: function () {
						// 	console.log('onDragEnd');
						// },
						onDrop: {
							i3_drop: function () {
								$('#i3_drag1').draggable('option', 'disabled', false);
								$('#i3_drag2').draggable('option', 'disabled', true);
								$('#i3_drag1').removeClass('dropped');
								$('#i3_drag2').addClass('dropped');
								// console.log('onDrop', this);
							}
						}
					}
				}
				// snapping: false
			},
			audio: {
				onEnter: 'media/audio/vo/nothing.mp3',
				positive: 'media/audio/vo/nothing.mp3',
				negative: 'media/audio/vo/nothing.mp3',
				negativeFinal: 'media/audio/vo/nothing.mp3'
			},
			modal: {
				// noFeedback: true, //defaults to false, set to true if you do not want feedbacks
				positive: 'i3-positive',
				negative: 'i3-negative',
				negativeFinal: 'i3-negative-final'
			},
			hotspot: { clickAnywhere: true }
		},
		end: {
			type: 'text',
			navElements: ['exit-slide', 'home', '!exit'],
			backAction: prevSlide,
			nextAction: function () {},
			onEnterAction: function () {
				// Do not check for "lmsConnected", because that's done in setScormCompletion() anyways and AICC wouldn't work anymore.
				setScormCompletion();
			},
			audio: {
				// onEnter: "media/audio/Result/0.mp3",
			},
			include: false
		}
	};
});

// Add "si-modal-closer" button to all modals

var $siModalCloser = $.parseHTML(
	'<button class="si-modal-closer si-modal-closer__js"><img class="si-img-swap__js inject-me" src="./media/imgs/navigation/classic/close-cross.svg" alt="" /></button>'
);
$('.si-modal__js').append($siModalCloser);

//3d carousel
function disableButtons(selector) {
    $(selector).addClass('noEvents')
    $(selector).attr("disabled", "disabled");
}


function enableButtons(selector) {
    $(selector).removeClass('noEvents')
    $(selector).removeAttr('disabled');
}

function threeDNavigationSetup() {
    $('.rightButton').on('click.threedcarousel', function () {
        threeDMove('right')
    })
    $('.leftButton').on('click.threedcarousel', function () {
        threeDMove('left')
    })

    //threeDButtons = rotating items/buttons
    threeDButtons = slides[globalVar.curSlide].items = $('.threedb')
    slides[globalVar.curSlide].clicks = 0;
    //Makes only the front button clickable
    disableButtons(threeDButtons)
    enableButtons(threeDButtons[0])

    //3d css setup
    cssSetup()
}

function cssSetup() {
    //html items to position
    var threeDItems = $('.threedb')

    //number of items
    var numberOfItems = threeDItems.length;

    //assign first positions
    threeDItems.each(function (idx, item) {
        $(item).addClass('item' + (idx + 1) + 'of' + numberOfItems + ' ' + numberOfItems + 'items')
    })
}


function threeDMove(rightOrLeft) {
    //threeDButtons = rotating items/buttons
    var threeDButtons = slides[globalVar.curSlide].items

    //clicks keeps track of the items's position
    var clicks = slides[globalVar.curSlide].clicks

    //number of items
    var numberOfItems = $('.threedb').length;

    //number for a left turn
    var turn;
    switch (rightOrLeft) {
        case "right":
            turn = numberOfItems - 1;
            break;
        case "left":
            turn = 1;
    }
    //change positions to the left
    threeDButtons.each(function (idx, button) {
        var currentPosition = ((idx + clicks) % numberOfItems) + 1;
        var nextPosition = ((idx + turn + clicks) % numberOfItems) + 1

        $(button).removeClass('item' + currentPosition + "of" + numberOfItems)
        $(button).addClass('item' + nextPosition + "of" + numberOfItems)

        //Makes only the new front button clickable
        if (nextPosition === 1) {
            disableButtons(threeDButtons)
            disableButtons(this)
            enableButtons(button)
        }
    })

    //prevent fast clicking
    // setTimeout(function () {
    //     enableButtons('.leftButton .rightButton')
    // }, 300)

    //update current position
    clicks += turn
    slides[globalVar.curSlide].clicks = clicks
}
var siAudio = {}

function initAudio(){
	siAudio["sfx"] = {}
	siAudio["sfx"]["click"] = new Howl({
		src: ["media/audio/sounds/mouse_click.mp3"],
		volume: 0.8,
	});
	siAudio["sfx"].wrong = new Howl({
		src: ["media/audio/sounds/negative.mp3"],
		volume: 0.5,
	});
	siAudio["sfx"].right = new Howl({
		src: ["media/audio/sounds/positive.mp3"],
		volume: 0.5,
	});
	siAudio["sfx"].nothing = new Howl({
		src: ["media/audio/sounds/nothing.mp3"],
	});

	for(key in slides){
		siAudio[key] = {}
		if(slides[key]["audio"]){
			var audio = slides[key]["audio"];
			for(track in audio){
				siAudio[key][track] = new Howl({
					src: audio[track]
				})
			}
		}else{
			slides[key]["audio"] = {}
		}
	}
}

function videoCheck() {
	var type = slides[globalVar.curSlide].type;
	if (type == 'video') {
		var video = globalVar.$curSlide.find('video')[0];
		var videoID = globalVar.$curSlide.find('video')[0].id;

		if (slides[globalVar.curSlide].videoLoaded == false) {
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
			}).ready(function() {
				// disable progress control (seeking) if globalVar or data.js is configured that way.
				// videoSeeking (data.js) is overruling progressControl (globalVar).
				// if devMode is on, seeking is always enabled.

				if (!globalVar.devMode) {
					if (!slides[globalVar.curSlide].videoSeeking) {
						if (
							slides[globalVar.curSlide].videoSeeking === false ||
							globalVar.video.progressControl === false
						) {
							videojs(
								videoID
							).controlBar.progressControl.disable();
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
					videojs(videoID).textTrackSettings.setValues(
						subtitleSettings
					);
					videojs(videoID).textTrackSettings.updateDisplay();

					// this would show the first subtitle track
					// videojs(videoID).textTracks_[0].mode = "showing"

					// prints out a nice table of the current subtitle style settings
					// console.table(videojs(videoID).textTrackSettings.getValues());
				}

				slides[globalVar.curSlide].videoLoaded = true;

				videojs(videoID).play();

				// Old way of disabling seeking.
				// Obsolete because it's not reliable in IE. New native method is.
				/* if (slides[globalVar.curSlide].videoSeeking == false) {
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
			videojs(videoID).on('ended', function() {
				globalVar.videoSeen[globalVar.curSlide] = true;
				slides[globalVar.curSlide].nextAction();
			});
			if(globalVar.fadeNavigation){
				videojs(videoID).on("useractive", function() {
					$("#si-nav-container").removeClass("vjs-fade-out");
				});
	
				videojs(videoID).on("userinactive", function() {
					if (!videojs(videoID).paused()) {
					$("#si-nav-container").addClass("vjs-fade-out");
					}
				});
			}
		} else {
			videojs(videoID).currentTime(0);
			videojs(videoID).play();
		}
	} else {
		if ($('section').find('video').length > 0) {
			$('section')
				.find('video')[0]
				.pause();
		}
	}
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
	// SETUP THE PRELOADER
	window.onload = function () {
		$('#preloader_text_1').fadeOut('slow', function () {
			$('#preloader_text_2').fadeIn('slow');
		});
		$('#Preloader').on('click touch', function (e) {
			e.preventDefault();
			siAudio.sfx.click.play();
			hidePreloader();
		});
	};
	// $('section.present').hide();
}

function hidePreloader() {
	$('#Preloader').fadeOut('slow', function () {
		$('section.present').fadeIn('slow', function () {
			if (slides[globalVar.curSlide] !== undefined && slides[globalVar.curSlide].type == 'video') {
				var video = globalVar.$curSlide.find('video')[0];
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
		var hotspot = slides[globalVar.curSlide].hotspot;
		var clickAnywhereHotspot = hotspot && hotspot.clickAnywhere;

		e.preventDefault();

		if (!clickAnywhereHotspot) e.stopPropagation();
	});
	modalContainer.on('click.close', function () {
		modalClosingActions();
	});
	modalClosers.each(function (idx, closer) {
		$(closer).on('click.close', function () {
			modalClosingActions();
		});
	});
}

/**
 *
 */
function answerCorrect() {
	var currentModal = slides[globalVar.curSlide].modal.positive;
	var modalContainer = $('.si-modal-container__js');
	modalContainer.addClass('si-modal-container-open');
	$('#' + currentModal).addClass('si-current-modal');
	globalVar.currentModal = currentModal;
	globalVar.currentModalType = 'positive';
	var type = slides[globalVar.curSlide].type;
	slides[globalVar.curSlide][type].trys = 0;
	if (siAudio[globalVar.curSlide].positive) {
		siAudio.sfx.right.once('end', function () {
			siAudio[globalVar.curSlide].positive.play();
		});
		siAudio.sfx.right.play();
	} else {
		siAudio.sfx.right.play();
	}

	if (typeof slides[globalVar.curSlide].onSuccessAction === 'function') {
		slides[globalVar.curSlide].onSuccessAction();
	}
}

////////////*Feature:Negative Feedback Functions///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 *
 */
function answerIncorrect() {
	var type = slides[globalVar.curSlide].type;
	var trys = slides[globalVar.curSlide][type].trys;
	var attempts = slides[globalVar.curSlide][type].userAttempts;
	var modalContainer = $('.si-modal-container__js');
	if (attempts === 0) {
		trys = 0;
	} else {
		trys++;
	}
	slides[globalVar.curSlide][type].trys = trys;

	if (trys < attempts || attempts === 0) {
		var currentModal;
		if (slides[globalVar.curSlide].modal['negative' + trys]) {
			currentModal = slides[globalVar.curSlide].modal['negative' + trys];
			globalVar.currentModal = currentModal;
			globalVar.currentModalType = 'negative' + trys;
		} else if (slides[globalVar.curSlide].modal.negative) {
			currentModal = slides[globalVar.curSlide].modal.negative;
			globalVar.currentModal = currentModal;
			globalVar.currentModalType = 'negative';
		}

		modalContainer.addClass('si-modal-container-open');
		$('#' + currentModal).addClass('si-current-modal');
		if (siAudio[globalVar.curSlide]['negative' + trys]) {
			siAudio.sfx.wrong.once('end', function () {
				siAudio[globalVar.curSlide]['negative' + trys].play();
			});
			siAudio.sfx.wrong.play();
		} else if (siAudio[globalVar.curSlide].negative) {
			siAudio.sfx.wrong.once('end', function () {
				siAudio[globalVar.curSlide].negative.play();
			});
			siAudio.sfx.wrong.play();
		} else {
			siAudio.sfx.wrong.play();
		}

		if (typeof slides[globalVar.curSlide].onFailureAction1 === 'function') {
			slides[globalVar.curSlide].onFailureAction1();
		}
	} else if (attempts !== 0 && trys === attempts) {
		currentModal = slides[globalVar.curSlide].modal.negativeFinal;
		globalVar.currentModal = currentModal;
		globalVar.currentModalType = 'negativeFinal';

		modalContainer.addClass('si-modal-container-open');
		$('#' + currentModal).addClass('si-current-modal');
		slides[globalVar.curSlide][type].trys = 0;

		if (siAudio[globalVar.curSlide].negativeFinal) {
			siAudio.sfx.wrong.once('end', function () {
				siAudio[globalVar.curSlide].negativeFinal.play();
			});
			siAudio.sfx.wrong.play();
		} else {
			siAudio.sfx.wrong.play();
		}

		if (typeof slides[globalVar.curSlide].onFailureAction2 === 'function') {
			slides[globalVar.curSlide].onFailureAction2();
		}
	}
}
////////////*Feature:Positive and Negative Feedback Handler & closeFeedbackAction///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * @param bol
 */
function handleAnswer(bol) {
	Howler.stop();
	if (slides[globalVar.curSlide].modal.noFeedback) {
		var isNextAction = typeof slides[globalVar.curSlide].nextAction === 'function';
		if (bol) {
			if (typeof slides[globalVar.curSlide].onSuccessAction === 'function') {
				slides[globalVar.curSlide].onSuccessAction();
			}
		} else {
			if (typeof slides[globalVar.curSlide].onFailureAction1 === 'function') {
				slides[globalVar.curSlide].onFailureAction1();
			}
		}
		if (isNextAction) {
			slides[globalVar.curSlide].nextAction();
		} else {
			nextSlide();
		}
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
	var bol = typeof slides[globalVar.curSlide].nextAction === 'function';
	switch (item) {
		case 'positive':
			if (bol) {
				slides[globalVar.curSlide].nextAction();
			} else {
				nextSlide();
			}
			break;
		case 'negative':
			break;
		case 'hotspot':
			handleHotspotClose();
			break;
		case 'negativeFinal':
			if (bol) {
				slides[globalVar.curSlide].nextAction();
			} else {
				nextSlide();
			}
			break;
		default:
			break;
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
function handleHotspotClose() {
	var settings = slides[globalVar.curSlide].hotspot;
	var $hotspots = $('#' + globalVar.curSlide).find(' .hotspot-button__js');
	var i = globalVar.hotspotIdx;
	var hotspot = $hotspots[i];
	var modal = '#' + globalVar.currentModal;
	var mainOnModalClose = settings.onModalClose;
	var indvOnModalClose = settings.indv[i + 1] && settings.indv[i + 1].onModalClose;
	var modalWarn = "you haven't created a modal for this hotspot";
	slides[globalVar.curSlide].hotspot.clickChecker[i + 1].seen = true;
	mainOnModalClose && mainOnModalClose(hotspot, modal || modalWarn);
	indvOnModalClose && indvOnModalClose(hotspot, modal || modalWarn);

	var result = true;

	for (var item in slides[globalVar.curSlide].hotspot.clickChecker) {
		if (
			slides[globalVar.curSlide].hotspot.clickChecker[item].seen === false &&
			!slides[globalVar.curSlide].hotspot.clickChecker[item].hasCorrectClass
		) {
			result = false;
			break;
		}
	}

	if (result) {
		if (settings.customCompleteAction) {
			settings.customCompleteAction();
		} else {
			slides[globalVar.curSlide].nextAction();
		}
	}
	/**
	 * @param nextHotspot
	 * @param nextHotspotSettings
	 */
	function unlockNextHotspot(nextHotspot, nextHotspotSettings) {
		var mainOnUnlock = settings.onUnlock;
		var indvOnUnlock = nextHotspotSettings && nextHotspotSettings.onUnlock;

		$hotspots.removeClass(settings.activeClass);

		unlock($(nextHotspot));
		$(nextHotspot).addClass(settings.activeClass);

		mainOnUnlock && mainOnUnlock(nextHotspot);
		indvOnUnlock && indvOnUnlock(nextHotspot);
	}

	if (settings.linear === true) unlockNextHotspot($hotspots[i + 1], settings.indv[i + 2]);
}

/**
 * @param container
 */
function modalClosingActions() {
	Howler.stop();
	if (slides[globalVar.curSlide].type === 'hotspot' && slides[globalVar.curSlide].hotspot.hover) {
		console.log('hover-hotspot, no click audio');
	} else {
		siAudio.sfx.click.play();
	}

	switch (slides[globalVar.curSlide].type) {
		case 'dnd':
			resetDnD(slides[globalVar.curSlide].revertTime, globalVar.dndAnswers);
			break;
		case 'sort':
			resetSort();
			break;
		case 'quiz':
			resetQuiz();
			break;
		// case 'hotspot':
		// 	resetHotspot();
		// 	break;
	}

	closeFeedbackAction(globalVar.currentModalType);
	$('body').off('keydown.drag');

	$('.si-modal-container__js').removeClass('si-modal-container-open si-hover-hotspot');
	// console.log($('#' + globalVar.currentModal));
	$('#' + globalVar.currentModal).removeClass('si-current-modal');
}

/**
 * @param id
 */
function simpleModalOpen(id) {
	if (slides[globalVar.curSlide].modal[id]) {
		var currentModal = slides[globalVar.curSlide].modal[id];
		if (siAudio[globalVar.curSlide][id]) {
			siAudio[globalVar.curSlide][id].play();
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
var dndResetObject = {}
function resetDnD(revertTime, dndAnswers) {
    globalVar.$curSlide.find('.draggable').each(function () {
		$(this).draggable('option', 'disabled', false);
		$(this).removeClass('dropped');
        var OGPos = $(this).data('OGPos');
        $(this).animate({
                top: OGPos.top,
                left: OGPos.left
            },
            revertTime
        );
        $(this).data('dropId', '');
        $(this).data('curPos', {
            top: OGPos.top,
            left: OGPos.left
        });
        $(this).data('prevPos', {
            top: OGPos.top,
            left: OGPos.left
        });
    });
    globalVar.$curSlide.find('.droppable').each(function () {
        $(this).data('dragElements', []);
        $(this).data('dropCounter', slides[globalVar.curSlide]['dnd']['dropCounter'][this.id]);
    });
    //reset dndAnswersect
    for (key in dndAnswers) {
        dndAnswers[key] = [];
    }

    if (slides[globalVar.curSlide].dnd.type == 'dnd_2') {
        globalVar.$curSlide.find('.draggable').fadeIn();
        globalVar.$curSlide.find('.draggable').removeClass('shrink');
    }

    globalVar.dndAnswers = dndAnswers;
    return dndAnswers;
}

function dndFunctions() {
    var curDrag;
    var curDrop;
    var $dragElements = globalVar.$curSlide.find('.draggable');
    var $dropElements = globalVar.$curSlide.find('.droppable');
    var revertTime;
    var snapping;
    var dndAnswers = generateAnswerTemplate();

    // assign custom or default values to revert and snapping
    if (slides[globalVar.curSlide]['dnd']['revertTime']) {
        revertTime = slides[globalVar.curSlide]['dnd']['revertTime'];
    } else {
        revertTime = 500;
    }
    if (slides[globalVar.curSlide]['dnd']['snapping']) {
        snapping = slides[globalVar.curSlide]['dnd']['snapping'];
    } else {
        snapping = true;
    }

    ///////////////// First entrance setup/////////////////////////////////
    if (slides[globalVar.curSlide].visited == false) {
        // draggable setup: set position data, attaches dnd event functions, add keyboard access
        $dragElements.each(function () {
            var events = dndActions(this.id);
            var leftInit =
                (
                    (parseInt($(this).css('left')) /
                        $(this)
                        .parent()
                        .width()) *
                    100
                ).toString() + '%';
            var topInit =
                (
                    (parseInt($(this).css('top')) /
                        $(this)
                        .parent()
                        .height()) *
                    100
                ).toString() + '%';
            $(this).data({
                OGPos: {
                    top: topInit,
                    left: leftInit
                },
                curPos: {
                    top: topInit,
                    left: leftInit
                },
                prevPos: {
                    top: topInit,
                    left: leftInit
                },
                dropID: '',
                events: events,
                revertTime: revertTime,
                snapping: snapping
            });

            // makes dnd keyboard accessible
            $(this).attr('tabindex', '0');
            keyBoardAccess(this);
        });

        // droppable setup: drag array, drop counter, keyboard access
        $dropElements.each(function () {
            $(this).data({
                dragElements: [],
                dropCounter: slides[globalVar.curSlide]['dnd']['dropCounter'][this.id]
            });

            // necessary to make dnd keyboard accessible
            $(this).attr('tabindex', '-1');
        });

        dndResetObject[globalVar.curSlide] = {
            time: revertTime,
            answers: dndAnswers
        }
        // Subsequent Visits/////////////////////////////////////////
    } else {
        $dragElements.each(function () {
            $(this).draggable('disable');
        });
        $dropElements.each(function () {
            $(this).droppable('disable');
        });
        resetDnD(revertTime, dndAnswers);
    }
    // end setup

    // draggable options: add any additional needed keys from jQuery draggable API here
    $dragElements.draggable({
        start: function (event, ui) {
            curDrag = ui.helper[0];
            $(curDrag)
                .data('events')['onDragStart']();
        },
        drag: function (event, ui) {
            dragging(curDrag);
        },
        revert: 'invalid',
        stack: '.draggable',
        revertDuration: revertTime,
        stop: function (event, ui) {
            dragStop(curDrag);
        }
    });

    // droppable options: add any additional needed keys from jQuery droppable API here
    $dropElements.droppable({
        accept: '.draggable',
        over: function (event, ui) {
            curDrop = event.target;
            if ($(curDrag).data('events')['onDragOver'][curDrop.id]) {
                $(curDrag)
                    .data('events')['onDragOver'][curDrop.id]();
            }
        },
        drop: function (event, ui) {
            dropped(curDrop, curDrag);
        }
    });

    // activate both
    $dragElements.each(function () {
        $(this).draggable('enable');
    });

    $dropElements.each(function () {
        $(this).droppable('enable');
    });
} //end dndFunctions

// Dnd Event Functions///////////////////////////////

// runs while dragging element;
function dragging(dragTarget) {
    $(dragTarget)
        .data('events')['onDrag']();
}

// runs when drag element is released outside of valid drop area;
function dragStop(dragTarget) {
    $(dragTarget)
        .data('events')['onDragEnd']();
}

//Important Function! Runs on drop into valid drop area///
function dropped(dropTarget, dragTarget) {
    var pos = {
        top: 0,
        left: 0
    };
    var snapping = $(dragTarget).data('snapping');
    var spaceAvailable = $(dropTarget).data('dragElements').length < $(dropTarget).data('dropCounter');

    //get positioning
    if (snapping) {
        pos.top =
            (
                (parseInt($(dropTarget).css('top')) /
                    $(dropTarget)
                    .parent()
                    .height()) *
                100
            ).toString() + '%';
        pos.left =
            (
                (parseInt($(dropTarget).css('left')) /
                    $(dropTarget)
                    .parent()
                    .width()) *
                100
            ).toString() + '%';
    } else {
        pos.top = ((parseInt($(dragTarget).css('top')) / $('.reveal').height()) * 100).toString() + '%';
        pos.left = ((parseInt($(dragTarget).css('left')) / $('.reveal').width()) * 100).toString() + '%';
    }

    // run custom drop function
    if ($(dragTarget).data('events')['onDrop'][dropTarget.id]) {
        $(dragTarget)
            .data('events')['onDrop'][dropTarget.id]();
    }

    // handle drop for each type
    if (slides[globalVar.curSlide]['dnd'].type == 'dnd_2') {
        if (spaceAvailable) {
            dnd2Drop(dragTarget, dropTarget);
        } else {
            revert(dragTarget);
        }
    } else if (slides[globalVar.curSlide]['dnd'].type == 'dnd_1') {
        if (spaceAvailable) {
            dnd1Drop(dragTarget, dropTarget, pos);
        } else {
            swap(dragTarget, dropTarget, pos);
        }
    }

    for (key in slides[globalVar.curSlide]['dnd']['quiz']) {
        globalVar.dndAnswers[key] = $('#' + key).data('dragElements');
    }
} //end dropped

//////// Drops and Swap /////////////

function dnd2Drop(drag, drop) {
    $(drop)
        .data('dragElements')
        .push(drag.id);
    $(drag).addClass('shrink');
    $(drag).data('dropped', true);
}

function dnd1Drop(drag, drop, pos) {
    var dropId = $(drag).data('dropId');
    if (dropId) {
        var newArr = $('#' + dropId)
            .data('dragElements')
            .filter(function (dragId) {
                dragId !== drag.id;
            });
        $('#' + dropId).data('dragElements', newArr);
    }
    updatePos(drag, pos);
    $(drag).data('dropId', drop.id);
    $(drop)
        .data('dragElements')
        .push(drag.id);
    move(drag);
}

function swap(drag, drop, pos) {
    var dropId = $(drag).data('dropId');
    var swapDragId = $(drop)
        .data('dragElements')
        .pop();
    var swapDrag = $('#' + swapDragId);
    var swapDragPos;
    var swapArr = [];

    if (dropId) {
        var newArr = $('#' + dropId)
            .data('dragElements')
            .filter(function (dragId) {
                dragId !== drag.id;
            });
        newArr.push(swapDragId);
        $('#' + dropId).data('dragElements', newArr);
        swapDragPos = $(drag).data('curPos');
    } else {
        swapDragPos = $(swapDrag).data('OGPos');
        swapDrag.removeData('dropId')
    }
    swapArr = $('#' + drop.id)
        .data('dragElements')
        .filter(function (dragId) {
            dragId !== swapDragId;
        });
    swapArr.push(drag.id);
    $('#' + drop.id).data('dragElements', swapArr);

    $(drag).data('dropId', drop.id);
    $(swapDrag).data('dropId', dropId);

    updatePos(swapDrag, swapDragPos);
    updatePos(drag, pos);

    move(drag);
    move(swapDrag);
}

/////////////////// DnD Helper Functions///////////////////////////////////////////////////
function revert(dragItem) {
    var revertTime = $(dragItem).data('revertTime');
    $(dragItem).animate({
            top: $(dragItem).data('prevPos')['top'],
            left: $(dragItem).data('prevPos')['left']
        },
        revertTime
    );
}

function move(dragItem) {
    var revertTime = 300;
    $(dragItem).animate({
            top: $(dragItem).data('curPos')['top'],
            left: $(dragItem).data('curPos')['left']
        },
        revertTime
    );
}

function updatePos(dragItem, newPos) {
    $(dragItem).data('prevPos', $(dragItem).data('curPos'));
    $(dragItem).data('curPos', newPos);
}

// Grabs custom event actions or assigns default values to all action keys. Makes action key entirely optional
function dndActions(dragItemID) {
    var actions = {
        onDragStart: function () {},
        onDrag: function () {},
        onDragOver: {},
        onDragEnd: function () {},
        onDrop: {}
    };
    if (slides[globalVar.curSlide]['dnd']['actions']) {
        if (!slides[globalVar.curSlide]['dnd']['actions'][dragItemID]) {
            slides[globalVar.curSlide]['dnd']['actions'][dragItemID] = {};
        }
        for (var key in actions) {
            if (slides[globalVar.curSlide]['dnd']['actions'][dragItemID][key]) {
                actions[key] = slides[globalVar.curSlide]['dnd']['actions'][dragItemID][key];
            }
        }
    } else {
        slides[globalVar.curSlide]['dnd']['actions'] = {};
    }
    slides[globalVar.curSlide]['dnd']['actions'][dragItemID] = actions;
    return actions;
}

function generateAnswerTemplate() {
    var i = 0;
    var str = '';
    var dndAnswers;
    //write a blank object/answers into the globalVar
    globalVar.dndAnswers = {};
    for (key in slides[globalVar.curSlide]['dnd']['quiz']) {
        i++;

        var stra = '"' + key + '":' + '[]';
        if (Object.keys(slides[globalVar.curSlide]['dnd']['quiz']).length >= 2) {
            if (i != Object.keys(slides[globalVar.curSlide]['dnd']['quiz']).length) {
                stra = stra + ',';
            }
        }
        str = str + stra;
    }
    str = '{' + str + '}';
    dndAnswers = JSON.parse(str);
    globalVar.dndAnswers = dndAnswers;
    return dndAnswers;
}

function keyBoardAccess(dragElement) {
    var accessibility = function (event) {
        var drops = globalVar.$curSlide.find('.droppable');
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
                        $drag.animate({
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
                        if (slides[globalVar.curSlide]['dnd']['type'] === 'dnd_2') {
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

/**
 *
 */
function hotspotFunctions() {
	// variables
	var $slideDOM = $('#' + globalVar.curSlide);
	var $hotspots = $slideDOM.find(' .hotspot-button__js');
	var $modalBlocker = $('.si-modal-container__js');
	var modals = [];
	$hotspots.each(function (idx, hotspot) {
		console.log('broke');
		if (slides[globalVar.curSlide].modal['hs' + (idx + 1)]) {
			modals.push(slides[globalVar.curSlide].modal['hs' + (idx + 1)]);
		} else {
			console.log(
				'There is not a corresponding modal for hotspot ' +
					(idx + 1) +
					'. Please disregard if you are not using modals for this slide.'
			);
		}
	});
	console.log(modals);
	var clickChecker = {};

	var slideObj = slides[globalVar.curSlide];
	var settings = slideObj.hotspot || {};

	var selectedClass;
	var correctClass = settings.correctClass || 'correct';
	var unlockedClass = settings.unlockedClass || 'unlocked';
	var completedClass = settings.completedClass || 'completed';
	var modalStyleClass = settings.modalStyleClass || 'modal-style';
	var hotspotStyleClass = settings.hotspotStyleClass || 'hotspot-style';
	var completeAction = settings.customCompleteAction || slideObj.nextAction;

	settings.correctClass = correctClass;
	settings.unlockedClass = unlockedClass;
	settings.selectedClass = selectedClass;
	settings.completedClass = completedClass;
	settings.modalStyleClass = modalStyleClass;
	settings.hotspotStyleClass = hotspotStyleClass;

	settings.clickChecker = clickChecker;
	settings.indv = settings.indv || {};

	$hotspots.addClass(hotspotStyleClass);
	$hotspots.removeClass(completedClass);
	$hotspots.removeClass(unlockedClass);
	$hotspots.each(function (i, spot) {
		$(spot).addClass(hotspotStyleClass + '-' + (i + 1));
	});

	modals.forEach(function (modal, idx) {
		$('#' + modal)
			.addClass(modalStyleClass)
			.addClass(modalStyleClass + '-' + (idx + 1));

		console.log($('#' + modal));

		if (settings.clickAnywhere) $('#' + modal).addClass('modal-click-anywhere');
	});

	if (settings.correctHotspots)
		settings.correctHotspots.forEach(function (item) {
			$($hotspots[item - 1]).addClass(correctClass);
		});

	// build clickChecker object
	for (var i = 0; i < $hotspots.length; i++) {
		clickChecker[i + 1] = clickChecker[i + 1] || {};
		clickChecker[i + 1].seen = false;

		//if correctClass specified add correctClass key
		if (settings.correctClass) {
			var correctClass = settings.correctClass;
			clickChecker[i + 1].hasCorrectClass = $($hotspots[i]).hasClass(correctClass);
		} else {
			clickChecker[i + 1].hasCorrectClass = true;
		}
	}

	if (!settings.audioSetup)
		for (var key in settings.audio) {
			settings.audio[key] = new Howl({
				src: [settings.audio[key]]
			});
			settings.audioSetup = true;
		}

	if (settings.linear) {
		if (settings.quiz) throw '\nHotspot Error:\nyou cannot use "linear" and "quiz" together';
		if (settings.correctHotspots) throw '\nHotspot Error:\nyou cannot use "linear" and "correctHotspots" together';
		$hotspots.removeClass(unlockedClass);
		lock($hotspots);
		unlock($($hotspots[0]));
		$($hotspots[0]).addClass(unlockedClass);
	} else if (settings.quiz) {
		selectedClass = settings.quiz.selectedClass || 'selected-hotspot';
		$hotspots.removeClass(selectedClass);
		settings.quiz.selectedAnswers = [];
		settings.useModals = false;
	}

	$hotspots.each(function (i, hoSp) {
		var $thisHotspot = $(hoSp);
		//event listener for hotspots
		if (settings.hover === true) {
			$thisHotspot.off('mouseover.hotspot');
			$thisHotspot.on('mouseover.hotspot', function () {
				handleHotspot(i, hoSp);
			});
			$modalBlocker.addClass('hover-hotspot');
		} else {
			$thisHotspot.off('click.hotspot');
			$thisHotspot.on('click.hotspot', function () {
				handleHotspot(i, hoSp);
			});
		}
	});

	/**
	 * @param i
	 * @param hoSp
	 */
	function handleHotspot(i, hoSp) {
		var mainOnClick = settings.onClick;
		var indvOnClick = settings.indv[i + 1] && settings.indv[i + 1].onClick;
		var $thisModal = $('#' + modals[i]);
		var modalID = modals[i];
		var $thisHotspot = $(hoSp);
		var modalWarn = "you haven't created a modal for this hotspot";
		mainOnClick && mainOnClick(hoSp, modals[i] || modalWarn);
		indvOnClick && indvOnClick(hoSp, modals[i] || modalWarn);

		if (settings.audio) {
			Howler.stop();
			for (var key in settings.audio) settings.audio[key].stop();

			settings.audio[i + 1] && settings.audio[i + 1].play();
		}

		if (settings.quiz) {
			if (settings.quiz.type === 'scq') $hotspots.removeClass(selectedClass);
			$thisHotspot.toggleClass(selectedClass);
			settings.quiz.selectedAnswers = [];
			$hotspots.each(function (idx, quizHotspot) {
				if ($(quizHotspot).hasClass(selectedClass)) settings.quiz.selectedAnswers.push(idx + 1);
			});
		} else if (settings.useModals === false) {
			clickChecker[i + 1].seen = true;

			$(hoSp).addClass(completedClass);

			allSeenBehavior();

			if (settings.linear === true) unlockNextHotspot($hotspots[i + 1], settings.indv[i + 2]);
		} else {
			if (settings.hover) {
				$('.si-modal-container__js').addClass('si-hover-hotspot');
				$hotspots.each(function (i, hoSp) {
					$thisHotspot.off('mouseout.hotspot');
					$thisHotspot.on('mouseout.hotspot', function () {
						$('.si-modal-container__js').removeClass('si-hover-hotspot');
						console.log('mouseout');
						$modalBlocker.trigger('click');
					});
				});
			}
			console.log($thisModal);
			$('.si-modal-container__js').addClass('si-modal-container-open');
			$thisModal.addClass('si-current-modal');
			globalVar.currentModal = modalID;
			globalVar.currentModalType = 'hotspot';
			globalVar.hotspotIdx = i;

			/**
			 * @param e
			 */
		}
	}

	/**
	 *
	 */
	// function handleHotspotClose() {
	// 	var settings = slides[globalVar.curSlide].hotspot;
	// 	var $hotspots = $('#' + globalVar.curSlide).find(' .hotspot-button__js');
	// 	var i = globalVar.hotspotIdx;
	// 	var hotspot = $hotspots[i];
	// 	var modal = '#' + globalVar.currentModal;
	// 	var mainOnModalClose = settings.onModalClose;
	// 	var indvOnModalClose = settings.indv[i + 1] && settings.indv[i + 1].onModalClose;
	// 	var modalWarn = "you haven't created a modal for this hotspot";
	// 	slides[globalVar.curSlide].hotspot.clickChecker[i + 1].seen = true;
	// 	mainOnModalClose && mainOnModalClose(hotspot, modal || modalWarn);
	// 	indvOnModalClose && indvOnModalClose(hotspot, modal || modalWarn);

	// 	var result = true;

	// 	for (var item in slides[globalVar.curSlide].hotspot) {
	// 		if (slides[globalVar.curSlide].hotspot[item].seen === false && !slides[globalVar.curSlide].hotspot[item].hasCorrectClass) {
	// 			result = false;
	// 			break;
	// 		}
	// 	}

	// 	if(result){
	// 		if(settings.customCompleteAction){
	// 			settings.customCompleteAction();
	// 		}else{
	// 			slides[globalVar.CurSlide].nextAction()
	// 		}
	// 	}

	// 	if (settings.linear === true) unlockNextHotspot($hotspots[i + 1], settings.indv[i + 2]);
	// }

	//check for completion and define what happens
	/**
	 *
	 */
	function allSeenBehavior() {
		if (allSeen(clickChecker)) completeAction();
	}

	/**
	 * @param clickChecker
	 */
	function allSeen(clickChecker) {
		var result = true;

		for (var item in clickChecker) {
			if (clickChecker[item].seen === false && !clickChecker[item].hasCorrectClass) {
				result = false;
				break;
			}
		}
		return result;
	}

	/**
	 * @param nextHotspot
	 * @param nextHotspotSettings
	 */
	function unlockNextHotspot(nextHotspot, nextHotspotSettings) {
		var mainOnUnlock = settings.onUnlock;
		var indvOnUnlock = nextHotspotSettings && nextHotspotSettings.onUnlock;

		$hotspots.removeClass(unlockedClass);

		unlock($(nextHotspot));
		$(nextHotspot).addClass(unlockedClass);

		mainOnUnlock && mainOnUnlock(nextHotspot);
		indvOnUnlock && indvOnUnlock(nextHotspot);
	}
}

/**
 *
 */
function resetHotspot() {
	hotspotFunctions();
}

function initMenu() {
	for (key in slides) {
		if (slides[key].type === 'menu') {
			if (slides[key]['menu']) {
				// set default menu class if one is not present
				if (!slides[key]['menu']['menuClass']) {
					slides[key]['menu']['menuClass'] = 'si-menu__js';
				}
				// set menu default to nonlinear if linear slide key is not present/true
				if (!slides[key]['menu']['linear']) {
					slides[key]['menu']['linear'] = false;
				}
				// set menu default menu navigation if not present.  Will match buttons to subsequent slides after the menu
				if (!slides[key]['menu']['navigation']) {
					var number = slides[key]['slideNumber'];
					var buttons = $('#' + key).find('.' + slides[key]['menu']['menuClass']);
					var length = buttons.length;
					var defaultNav = [];
					for (var i = 1; i <= length; i++) {
						defaultNav.push(number + i);
					}
					slides[key]['menu']['navigation'] = defaultNav;
				}
				// set default completion requirements for each button if not given.  Will match buttons to subsequent slides after the menu
				if (!slides[key]['menu']['completionIDs']) {
					var number = slides[key]['slideNumber'];
					var buttons = $('#' + key).find('.' + slides[key]['menu']['menuClass']);
					var length = buttons.length;
					var completionIDs = [];
					for (var i = 1; i <= length; i++) {
						for (id in slides) {
							if (slides[id]['slideNumber'] == (number + i).toString()) {
								completionIDs.push(id);
							}
						}
					}
					slides[key]['menu']['completionIDs'] = completionIDs;
				}
			} else {
				// set all menu defaults if the 'menu' key is entirely absent
				slides[key]['menu'] = {};
				slides[key]['menu']['menuClass'] = 'si-menu__js';
				slides[key]['menu']['linear'] = false;
				slides[key]['menu']['completionIDs'] = completionIDs;
				var buttons = $('#' + key).find('.' + slides[key]['menu']['menuClass']);
				var number = slides[key]['slideNumber'];
				var length = buttons.length;
				var defaultNav = [];
				var completionIDs = [];
				for (var i = 1; i <= length; i++) {
					defaultNav.push(number + i);
					for (id in slides) {
						if (slides[id]['slideNumber'] == (number + i).toString()) {
							completionIDs.push(id);
						}
					}
				}
				slides[key]['menu']['navigation'] = defaultNav;
				slides[key]['menu']['completionIDs'] = completionIDs;
			}
			// attach click event to the buttons using navigation array
			if (slides[key]['menu']['navigation'].length) {
				var buttons = $('#' + key).find('.' + slides[key]['menu']['menuClass']);

				buttons.each(function (idx, button) {
					var slide = slides[key];

					$(button).on('click.nav', function () {
						jumpToId(slide['menu']['navigation'][idx]);
					});
				});
			}
			// lock buttons if linear and unlock the first one
			if (slides[key]['menu']['linear']) {
				var buttons = $('#' + key).find('.' + slides[key]['menu']['menuClass']);
				lock(buttons);
				unlock($(buttons[0]));
				$(buttons[0]).addClass('unlocked');
			}
		}
	}
}

function menuFunctions() {
	var menuButtons = $('#' + globalVar.curSlide).find('.' + slides[globalVar.curSlide]['menu']['menuClass']);
	var linear = slides[globalVar.curSlide]['menu']['linear'];
	var completionIDs = slides[globalVar.curSlide]['menu']['completionIDs'];
	var allComplete = true;

	if (completionIDs.length) {
		completionIDs.forEach(function (id, idx) {
			if (getCompletionStatus(id)) {
				$(menuButtons[idx]).addClass('completed');
				if (linear && menuButtons[idx + 1]) {
					$(menuButtons).removeClass('unlocked');
					unlock($(menuButtons[idx + 1]));
					$(menuButtons[idx + 1]).addClass('unlocked');
				}
			} else {
				allComplete = false;
			}
		});
	}

	if (allComplete) {
		slides[globalVar.curSlide]['menu']['allComplete'] = true;
	} else {
		slides[globalVar.curSlide]['menu']['allComplete'] = false;
	}
}

//////////////////*Feature:Sortables/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function sortFunctions() {
    // first visit setup
    // assigns original positions in order to make reset work
    if (slides[globalVar.curSlide].visited === false) {
        var $sortables = globalVar.$curSlide.find('.sortable');
        $sortables.each(function (idx, sortable) {
            var id = sortable.id;

            // initialize sortables with or without options
            if (slides[globalVar.curSlide]['sort']['sortables'][id]) {
                if (slides[globalVar.curSlide]['sort']['sortables'][id]['options']) {
                    $(sortable).sortable(slides[globalVar.curSlide]['sort']['sortables'][id]['options']);
                } else {
                    $(sortable).sortable();
                }

                //makes beginning order default answer if no answer is given
                if (!slides[globalVar.curSlide]['sort']['sortables'][id]['answer']) {
                    slides[globalVar.curSlide]['sort']['sortables'][id]['answer'] = $(sortable).sortable('toArray');
                }
            } else {
                $(sortable).sortable();
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
    if (slides[globalVar.curSlide]['sort']['randomize'] === true) {
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
    if (
        slides[globalVar.curSlide]['sort']['randomizeConnect'] &&
        typeof slides[globalVar.curSlide]['sort']['randomizeConnect'] === 'string'
    ) {
        var lists = $('.' + slides[globalVar.curSlide]['sort']['randomizeConnect']);
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
    var $sortables = globalVar.$curSlide.find('.sortable');
    $sortables.each(function (idx, sortable) {
        if (slides[globalVar.curSlide]['sort']['randomizeConnect']) {
            $(sortable).append($(sortable).data('shuffle'));
        } else if (
            slides[globalVar.curSlide]['sort']['randomize'] === false ||
            slides[globalVar.curSlide]['sort']['randomize'] === undefined
        ) {
            $(sortable).append($(sortable).data('elements'));
        } else {
            $(sortable).append($(sortable).data('shuffle'));
        }
    });
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
                $(this)
                    .parent()
                    .prepend($(this));
            }
            if (event.which === 69) {
                // "e" bottom of list
                $(this)
                    .parent()
                    .append($(this));
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
	var choices = $('#' + globalVar.curSlide + ' .si-quiz__js li');
	choices.removeClass('si-quiz-selected');
}
function initQuiz() {
	for (key in slides) {
		if (slides[key].type === 'quiz') {
			if (slides[key].quiz.radio === 'undefined') {
				slides[key].quiz.radio = false;
			} else if (slides[key].quiz.radio) {
				$('#' + key + ' .si-quiz__js').addClass('si-radio__js');
			}
		}
	}
	var quizzes = $('.si-quiz__js');
	var buttonType = globalVar.buttonType;
	quizzes.each(function (idx, quiz) {
		var choices = $(quiz).find('li');
		var buttons = $(quiz).find('div');
		var isRadio = $(quiz).hasClass('si-radio__js') ? true : false;
		choices.each(function (idx, choice) {
			$(choice).addClass('si-quiz-answer').attr('tabindex', '0');
			$(choice).on('click.quiz', function () {
				siAudio.sfx.click.play();
				if (isRadio) {
					choices.removeClass('si-quiz-selected');
				}
				if ($(this).hasClass('si-quiz-selected')) {
					$(this).removeClass('si-quiz-selected');
				} else {
					$(this).addClass('si-quiz-selected');
				}
			});
			$(choice).on('keyup.quiz', function () {
				if (event.which === 13) {
					siAudio.sfx.click.play();
					if (isRadio) {
						choices.removeClass('si-quiz-selected');
					}
					if ($(this).hasClass('si-quiz-selected')) {
						$(this).removeClass('si-quiz-selected');
					} else {
						$(this).addClass('si-quiz-selected');
					}
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
	var answers = slides[globalVar.curSlide]['quiz']['answers'];
	var choices = $('#' + globalVar.curSlide + ' .si-quiz__js li');
	if (!slides[globalVar.curSlide]['visited'] && globalVar.devMode) {
		choices.each(function (idx, choice) {
			if (answers[$(choice).attr('id')]) {
				$(choice).css('color', 'blue');
			}
		});
	} else {
		resetQuiz();
	}
}

function formFunctions() {
	var $form = $('#' + globalVar.curSlide + ' form');

	if (!slides[globalVar.curSlide].form.dontGenerate) {
		generateForm($form);
	}

	var hasSubmit = !!$form.find('input[type=submit]').length;

	$form.addClass('form-style');
	$form.trigger('reset');

	if (!hasSubmit) {
		$form.append('<input type="submit"/>');
	}

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

function checkForm() {
	var fields = slides[globalVar.curSlide].form.fields;

	for (var key in fields) {
		var field = fields[key];
		var result = '';
		var inputs = $('#' + globalVar.curSlide + ' .' + field.class);
		var answer = field.answer;
		var caseSensitive = fields[key].caseSensitive;
		var userAnswer = '';

		if (field.answer) {
			if (field.type === 'checkbox') {
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

			console.log(userAnswer, answer);
			console.log(result);
			if (!result) {
				return false;
			}
		}
	}
	return true;
}

function validForm() {
	var valid = true;
	var requiredFields = $('#' + globalVar.curSlide)
		.find('input,textarea,select')
		.filter('[required]');
	requiredFields.each(function (i, field) {
		if (field.value === '') {
			valid = false;
			$('#' + globalVar.curSlide + ' form')
				.find('input[type=submit]')
				.trigger('click');
			return false;
		}
	});
	return valid;
}

function generateForm($form) {
	var fields = slides[globalVar.curSlide].form.fields;

	$form.html('');
	for (var key in fields) {
		var field = fields[key];

		var inputID = globalVar.curSlide.toLowerCase() + '-' + field.class;

		if (field.label) {
			var label = document.createElement('label');

			label.htmlFor = inputID;
			$(label).text(field.label);

			$form.append(label);
		}
		// establish type
		switch (field.type) {
			case 'checkbox':
				field.options.forEach(function (option) {
					var optionLabel = option.toLowerCase().split(' ').join('-');
					var radio = document.createElement('input');
					var radioLabel = document.createElement('label');

					radioLabel.htmlFor = field.class + '-' + optionLabel;
					$(radioLabel).addClass(field.class + '-container radio-container');

					radio.setAttribute('type', 'radio');
					radio.id = field.class + '-' + optionLabel;
					radio.required = !field.optional;
					radio.name = field.class;
					radio.value = option;
					$(radio).addClass(field.class);

					$form.append(radioLabel);
					$(radioLabel).append(radio);

					switch (field.style) {
						case 'x':
							var customCheck = document.createElement('span');

							$(radio).addClass('hide-radio');
							$(customCheck).addClass(field.class + '-style x-style');

							$(radioLabel).append(customCheck);
							break;
						case 'dot':
							var customCheck = document.createElement('span');

							$(radio).addClass('hide-radio');
							$(customCheck).addClass(field.class + '-style dot-style');

							$(radioLabel).append(customCheck);
							break;
					}
					if (field.labels) {
						var sLabel = document.createElement('span');

						$(sLabel).addClass(field.class + '-option-label');
						$(sLabel).text(option);

						$(radioLabel).append(sLabel);
					}
				});
				break;
			case 'dropdown':
				var dropdown = document.createElement('select');
				dropdown.id = inputID;
				dropdown.required = !field.optional;
				$(dropdown).addClass(field.class + ' ' + field.class + '-style');
				$(dropdown).append('<option value="">Select One</option>');
				field.options.forEach(function (option) {
					$(dropdown).append('<option value="' + option + '">' + option + '</option>');
				});
				$form.append(dropdown);
				break;
			default:
				// create field
				if (!field.separate) {
					var textInput = document.createElement('input');

					textInput.setAttribute('type', 'text');
					textInput.required = !field.optional;
					textInput.id = inputID;
					if (field.maxLength) textInput.maxLength = field.maxLength;
					if (field.placeholder) textInput.placeholder = field.placeholder;
					$(textInput).addClass(field.class + ' ' + field.class + '-style');

					$form.append(textInput);
				} else {
					// separate fields per letter
					for (var i = 0; i < field.answer.length; i++) {
						var textInput = document.createElement('input');

						if (!i) textInput.id = inputID;
						textInput.setAttribute('type', 'text');
						textInput.maxLength = 1;
						textInput.required = !field.optional;
						$(textInput).addClass(
							field.class +
								' ' +
								field.class +
								'-style ' +
								field.class +
								'-' +
								(i + 1) +
								'-style separated'
						);

						$form.append(textInput);
					}
				}
				break;
		}
	}
}

var chapterNavigationSlides = ['V1', 'I1', 'I2', 'I3'];
var chapterCompletionSlides = ['V1', 'I1', 'I2', 'I3'];

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
	var $menu = $('#si-side-menu');
	var $container = $('#si-side-menu-container');

	$container.addClass('menu-open');
	$menu.addClass('menu-open');
	// this is for pausing the video when you open the side menu
	var type = slides[globalVar.curSlide].type;
	if (slides[globalVar.curSlide].videoLoaded && type == 'video') {
		videojs(globalVar.$curSlide.find('video')[0].id).pause();
	}

	handleSideButtons();
}

function closeSideMenu() {
	var $menu = $('#si-side-menu');
	var $container = $('#si-side-menu-container');

	$container.removeClass('menu-open');
	$menu.removeClass('menu-open');
	// unpause the video when you close the side menu
	var type = slides[globalVar.curSlide].type;
	if (slides[globalVar.curSlide].videoLoaded && type == 'video') {
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
	var navButtons = $('.si-nav__js');
	var iconClasses = 'si-click-icon si-drag-up-icon si-drag-down-icon si-drag-left-icon si-drag-right-icon';
	var $click = $('#si-click-icon');
	$(navButtons).hide();
	$click.removeClass(iconClasses);

	if (slides[globalVar.curSlide].navElements === undefined) {
		slides[globalVar.curSlide].navElements = [];
	}

	var navigation = slides[globalVar.curSlide].navElements;
	navigation.forEach(function (nav) {
		switch (nav) {
			case 'start-slide':
				$('#si-clock').show();
				$('#si-start').show();
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
			case 'standard-menu':
				$('#si-logo').show();
				$('#si-progress').show();
				$('#si-menu').show();
				$('#si-back').show();
				if (getCompletionStatus()) {
					$('#si-next').show();
				}
				break;
			case 'exit-slide':
				$('#si-progress').show();
				$('#si-exit').show();
				$('#si-replay').show();
				break;
			case 'click-icon':
				$click
					.show()
					.removeClass(iconClasses)
					.addClass('si-' + nav);
				hideClickIcon();
				break;
			case 'drag-up-icon':
				$click
					.show()
					.removeClass(iconClasses)
					.addClass('si-' + nav);
				hideClickIcon();
				break;
			case 'drag-down-icon':
				$click
					.show()
					.removeClass(iconClasses)
					.addClass('si-' + nav);
				hideClickIcon();
				break;
			case 'drag-left-icon':
				$click
					.show()
					.removeClass(iconClasses)
					.addClass('si-' + nav);
				hideClickIcon();
				break;
			case 'drag-right-icon':
				$click
					.show()
					.removeClass(iconClasses)
					.addClass('si-' + nav);
				hideClickIcon();
				break;
			default:
				if (nav[0] === '!') $('#si-' + nav.split('!')[1]).hide();
				else $('#si-' + nav).show();
				break;
		}
	});
}

function attachNavEventListeners() {
	$('#si-home').on('click touch', function () {
		siAudio.sfx.click.play();
		jumpToSlide(globalVar.homeSlide);
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
			if (slides[globalVar.curSlide]['backAction']) {
				slides[globalVar.curSlide].backAction();
			} else {
				prevSlide();
			}
		}, 100);
	});

	$('#si-next').on('click touch', function () {
		siAudio.sfx.click.play();
		setTimeout(function () {
			if (slides[globalVar.curSlide]['nextAction']) {
				slides[globalVar.curSlide].nextAction();
			} else {
				nextSlide();
			}
		}, 100);
	});

	$('#si-replay').on('click touch', function () {
		siAudio.sfx.click.play();
		jumpToSlide(0);
	});

	$('#si-exit').on('click touch', function () {
		siAudio.sfx.click.play();
		window.close();
	});

	$('#si-start').on('click touch', function () {
		siAudio.sfx.click.play();
		if (slides[globalVar.curSlide]['nextAction']) {
			slides[globalVar.curSlide].nextAction();
		} else {
			nextSlide();
		}
	});

	$('#si-submit').on('click touch', function () {
		var thisSlide = slides[globalVar.curSlide];
		if (thisSlide.type === 'form' && !validForm()) return;

		siAudio.sfx.click.play();
		var bol = checkQuestion(thisSlide.type);
		handleAnswer(bol);
	});

	$('#si-reset').on('click touch', function () {
		siAudio.sfx.click.play();
		switch (slides[globalVar.curSlide].type) {
			case 'dnd':
				var dndArgs = dndResetObject[globalVar.curSlide];
				resetDnD(dndArgs['time'], dndArgs['answers']);
				break;
			case 'sort':
				resetSort();
				break;
			case 'quiz':
				resetQuiz();
				break;
			case 'hotspot':
				resetHotspot();
			default:
				if (slides[globalVar.curSlide]['customReset']) {
					slides[globalVar.curSlide].customReset();
				}
				break;
		}
	});
	$('#si-custom-submit').on('click touch', function () {
		var thisSlide = slides[globalVar.curSlide];
		if (thisSlide.type === 'form' && !validForm()) return;

		siAudio.sfx.click.play();
		if (slides[globalVar.curSlide]['customSubmit']) {
			slides[globalVar.curSlide].customSubmit();
		}
	});

	$('.si-menu-closer').on('click touch', function () {
		closeSideMenu();
	});
}

function hideClickIcon() {
	$('#' + globalVar.curSlide).off('mousedown.icon');
	$('#' + globalVar.curSlide).on('mousedown.icon', function () {
		$('#si-click-icon').hide();
		$('#' + globalVar.curSlide).off('mousedown.icon');
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
var bookmarkedSlide;
var chartProgressRecorded = {};
$(document).ready(function () {
	initCourse();
	documentSetup();
	chartProgress();
	if (!globalVar.devMode && (lmsConnected || useLocal)) {
		jumpToSlide(bookmarkedSlide);
	}
	// Elements to inject
	var mySVGsToInject = document.querySelectorAll('img.inject-me');
	// Do the injection. keep last!!!
	SVGInjector(mySVGsToInject);
});

function firstTimeSetup() {
	//first and only execution of code, when the course starts first time gives all slides a number and sets defaults for user attempts and trys
	var keys = Object.keys(slides);
	keys.forEach(function (key, idx) {
		var type = slides[key].type;

		// give slidenumber used for bookmarking
		if (slides[key].slideNumber === undefined) {
			slides[key].slideNumber = idx + 1;
		}
		// set user attempts and trys if not defined
		if (slides[key][type] !== undefined) {
			if (slides[key][type].userAttempts === undefined) {
				slides[key][type].userAttempts = 0;
			}
			if (slides[key][type].trys === undefined) {
				slides[key][type].trys = 0;
			}
		} else {
			slides[key][type] = {
				userAttempts: 0,
				trys: 0
			};
		}

		// Create the object sent to the LMS to persist slide completion
		// set include to false on a slide in order to exclude it from the course progression
		if (slides[key].include === undefined) {
			slides[key].include = true;
		}

		if (slides[key].include) {
			var path = slides[key].completionPath;

			if (!saveData.slideCompletion) saveData.slideCompletion = {};

			var slideCompletion = saveData.slideCompletion;

			if (path) {
				if (Array.isArray(path)) {
					path.forEach(function (p, i) {
						if (!slideCompletion[p]) slideCompletion[p] = {};
						if (!slideCompletion[p][key]) slideCompletion[p][key] = 0;
					});
				} else {
					if (!slideCompletion[path]) slideCompletion[path] = {};
					if (!slideCompletion[path][key]) slideCompletion[path][key] = 0;
				}
			} else {
				if (!slideCompletion.mainPath) slideCompletion.mainPath = {};
				if (!slideCompletion.mainPath[key]) slideCompletion.mainPath[key] = 0;
			}
		}
	});
}

function documentSetup() {
	initPreloader();
	globalVar.curSlide = $('section' + '.present')[0].id;
	firstTimeSetup();
	initAudio();
	$('aside').remove();
	initNavigation();
	initSideMenu();

	for (key in slides) {
		if (slides[key].type == 'video') {
			globalVar.videoSeen[key] = false;
		}
	}
	if (globalVar.devMode) {
		devMode();
	}

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
		globalVar.curSlide = e.currentSlide.id;
		globalVar.$curSlide = $(e.currentSlide);

		closeSideMenu();
		if (slides[e.previousSlide.id] && typeof slides[e.previousSlide.id].onExitAction === 'function') {
			slides[e.previousSlide.id].onExitAction();
		}
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

function actionsOnEverySlideEnter() {
	//whatever you want to execute on every slide change
}

//execute whatever is inside onEnterAction, sets visited to true
function onEnterAction(id) {
	if (slides[id].visited === undefined) {
		slides[id].visited = false;
	}

	$(document.activeElement).blur();
	if (siAudio[globalVar.curSlide].onEnter) {
		if (siAudio.sfx.click.playing()) {
			siAudio.sfx.click.once('end', function () {
				Howler.stop();
				siAudio[globalVar.curSlide].onEnter.play();
			});
		} else {
			Howler.stop();
			siAudio[globalVar.curSlide].onEnter.play();
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
		if (slides[id].onEnterAction !== undefined) {
			slides[id].onEnterAction();
		}

		slides[id].visited = true;
	}, 10);
	if (lmsConnected && id !== 'start') {
		setTimeout(function () {
			saveLMS();
		}, 1000);
	}
	if (useLocal && id !== 'start') {
		saveProgressLocally();
	}
}

//Order of calling the functions to generate the current slide
function functionCalls() {
	$('body').off();
	globalVar.$curSlide = $('.slides > section.present');
	globalVar.curSlide = $('.slides > .present')[0].id;

	onEnterAction(globalVar.curSlide);
	actionsOnEverySlideEnter();
	showNavElements();
	elementsFadingOnSlide();

	switch (slides[globalVar.curSlide].type) {
		case 'menu':
			menuFunctions();
			break;
		case 'dnd':
			dndFunctions();
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
// This boolean, called bol,  is fed as an argument to FBCheck(bol) which is responsible for handling feedback responses

// To add unique logic for a custom type, extend the main switch statement, assign true or false to bol, then 'break'
function checkQuestion(type) {
	var bol = true;
	var bol2;
	switch (type) {
		case 'quiz':
			var correctAnswers = slides[globalVar.curSlide].quiz.answers;
			var selectedAnswers = {};
			var choices = $('#' + globalVar.curSlide + ' .si-quiz-answer');
			choices.each(function (idx, choice) {
				var id = $(choice).attr('id');
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
				}
			}
			if (!bol) {
				return bol;
			}
			break;
		case 'hotspot':
			var quiz = slides[globalVar.curSlide].hotspot.quiz;
			if (!quiz) throw '\nHotspot Error:\nyou have to turn on the "quiz" settings to use hotspots this way';
			if (!quiz.answers.length) throw '\nHotspot Error:\nquiz answers must be in an array';
			if (quiz.type === 'scq' && quiz.answers.length > 1)
				throw '\nHotspot Error:\nfor type "scq" you must have only one answer';
			var correctAnswers = quiz.answers;
			var selectedAnswers = quiz.selectedAnswers;
			bol = JSON.stringify(selectedAnswers) === JSON.stringify(correctAnswers);
			break;
		case 'form':
			bol = checkForm();
			if (!bol) return;
			break;
		case 'dnd':
			var userAnswers = globalVar.dndAnswers;
			for (key in slides[globalVar.curSlide].dnd.quiz) {
				var correctAnswer = slides[globalVar.curSlide].dnd.quiz[key].sort();
				var userAnswer = userAnswers[key].sort();
				if (slides[globalVar.curSlide].dnd.multipleAnswers) {
					var included = true;
					if (userAnswer.length === 0) {
						included = false;
					} else {
						if (correctAnswer.indexOf(userAnswer[0]) < 0) {
							included = false;
						}
					}
					if (!included) {
						bol = false;
						return bol;
					}
				} else {
					if (correctAnswer.length !== userAnswer.length) {
						bol = false;
						return bol;
					}

					correctAnswer.forEach(function (answer, idx) {
						if (userAnswer[idx] !== answer) {
							bol = false;
							return bol;
						}
					});
				}

				if (bol === false) {
					return bol;
				}
			}
			break;
		case 'sort':
			bol = true;
			var listArray = Object.keys(slides[globalVar.curSlide][type].sortables);
			var answerArray = [];
			listArray.forEach(function (list) {
				answerArray.push(slides[globalVar.curSlide][type].sortables[list].answer);
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
				if (
					slides[globalVar.curSlide][type].unordered === false ||
					slides[globalVar.curSlide][type].unordered === undefined
				) {
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

function elementsFadingOnSlide() {
	if ($('#' + globalVar.curSlide + ' [data-fadeInOrder]').length != 0) {
		var ary = [];
		$('#' + globalVar.curSlide + ' [data-fadeInOrder]').each(function () {
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

	if ($('#' + globalVar.curSlide + ' [data-fadeoutorder]').length != 0) {
		var ary = [];
		$('#' + globalVar.curSlide + ' [data-fadeoutorder]').each(function () {
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

var scorm = pipwerks.SCORM; //Shortcut
var lmsConnected = false;
var unloaded = false;
var useLocal = false;
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

function connectToSCORMAPI() {
	var bookmarkLocal;
	var localData;
	if (useLocal && storageAvailable('localStorage')) {
		bookmarkLocal = localStorage.getItem(bookmarkURL);
		localData = JSON.parse(localStorage.getItem(progressURL));
	}
	//scorm.init returns a boolean
	lmsConnected = scorm.init();
	//If the scorm.init function succeeded...
	if (lmsConnected) {
		siLog('SCORM', 'INIT', 'SUCCESS: Course is now connected with the LMS!');
		var completionstatus;
		var learnername;
		var rawData = scorm.get('cmi.suspend_data');
		var bookmarkScorm;
		var scormData;
		if (scorm.version === '2004') {
			completionstatus = scorm.get('cmi.completion_status');
			learnername = scorm.get('cmi.learner_name');
			bookmarkScorm = scorm.get('cmi.location');
		} else {
			completionstatus = scorm.get('cmi.core.lesson_status');
			learnername = scorm.get('cmi.core.student_name');
			bookmarkScorm = scorm.get('cmi.core.lesson_location');
		}
		if (rawData && typeof rawData === 'string') {
			scormData = JSON.parse(rawData);
			saveData = scormData;
		} else if (localData) {
			saveData = localData;
		}

		if (bookmarkScorm) {
			bookmarkedSlide = bookmarkScorm;
		} else if (bookmarkLocal) {
			bookmarkedSlide = bookmarkLocal;
		} else {
			bookmarkedSlide = 1;
		}
		window.addEventListener('unload', unloadHandler);
		window.addEventListener('beforeunload', unloadHandler);
		//If the course couldn't connect to the LMS for some reason...
	} else {
		//... let's alert the user then close the window.
		siLog('SCORM', 'INIT', 'ERROR: Course could not connect with the LMS');
		if (localData) {
			saveData = localData;
		}
		if (bookmarkLocal) {
			bookmarkedSlide = bookmarkLocal;
		} else {
			bookmarkedSlide = 1;
		}
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
	if (lmsConnected && !unloaded) {
		saveLMS();
		scorm.save(); //save all data that has already been sent
		scorm.quit(); //close the SCORM API connection properly
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
	var dataString = JSON.stringify(saveData);
	if (lmsConnected) {
		success = scorm.set('cmi.suspend_data', dataString);
	}
	return success;
}
function saveBookmark() {
	var success;
	bookmarkedSlide = slides[globalVar.curSlide].slideNumber || '0';
	if (lmsConnected) {
		if (scorm.version === '2004') {
			success = scorm.set('cmi.location', bookmarkedSlide);
		} else {
			success = scorm.set('cmi.core.lesson_location', bookmarkedSlide);
		}
	}

	return success;
}

function saveProgressLocally() {
	bookmarkedSlide = slides[globalVar.curSlide].slideNumber || '0';
	var dataString = JSON.stringify(saveData);
	if (storageAvailable('localStorage')) {
		localStorage.setItem(progressURL, dataString);
		localStorage.setItem(bookmarkURL, bookmarkedSlide);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2pzL19qcy9sb2dnZXIuanMiLCIuLi9qcy9fanMvaGVscGVyLmpzIiwiLi4vanMvZGF0YS5qcyIsIi4uL2pzL19qcy9jb21wb25lbnRzL2RvbS1tYW5pcHVsYXRpb24uanMiLCIuLi9qcy9fanMvY29tcG9uZW50cy9jYXJvdXNlbC5qcyIsIi4uL2pzL19qcy9jb21wb25lbnRzL2F1ZGlvLmpzIiwiLi4vanMvX2pzL2NvbXBvbmVudHMvdmlkZW8uanMiLCIuLi9qcy9fanMvY29tcG9uZW50cy9wcmVsb2FkZXIuanMiLCIuLi9qcy9fanMvY29tcG9uZW50cy9mZWVkYmFjay5qcyIsIi4uL2pzL19qcy9jb21wb25lbnRzL2RuZC5qcyIsIi4uL2pzL19qcy9jb21wb25lbnRzL2hvdHNwb3QuanMiLCIuLi9qcy9fanMvY29tcG9uZW50cy9tZW51LmpzIiwiLi4vanMvX2pzL2NvbXBvbmVudHMvc29ydGFibGUuanMiLCIuLi9qcy9fanMvY29tcG9uZW50cy9xdWl6LmpzIiwiLi4vanMvX2pzL2NvbXBvbmVudHMvZm9ybS5qcyIsIi4uL2pzL19qcy9jb21wb25lbnRzL3NpZGVfbWVudS5qcyIsIi4uL2pzL19qcy9jb21wb25lbnRzL25hdmlnYXRpb24uanMiLCIuLi9qcy9fanMvaW50ZXJhY3RpdmUuanMiLCIuLi9qcy9fanMvaW50ZXJhY3RpdmUuc2Nvcm0uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2Z0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImpzL2ludGVyYWN0aXZlLm1pbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImlmICh0eXBlb2Ygc2kgPT09ICd1bmRlZmluZWQnIHx8IHNpID09PSBudWxsKSB7XG5cdHZhciBzaSA9IHt9O1xufVxuXG5zaS5sb2cgPSBbXTtcblxuc2kuZm9ybWF0TG9nID0gZnVuY3Rpb24gKCkge1xuXHRpZiAod2luZG93LmNvbnNvbGUudGFibGUpIHtcblx0XHRjb25zb2xlLnRhYmxlKHNpLmxvZyk7XG5cdH0gZWxzZSB7XG5cdFx0Y29uc29sZS5sb2coc2kubG9nKTtcblx0fVxufTtcblxuZnVuY3Rpb24gc2lMb2coKSB7XG5cdHZhciBhcmdzID0gW107XG5cdHZhciBsYWJlbCA9ICdbXSc7XG5cdHZhciB0YWcgPSBhcmd1bWVudHNbMF07XG5cdHZhciBlbW9qaSA9ICfinYwnO1xuXHR2YXIgYWN0aW9uID0gJyc7XG5cdHZhciBrZXkgPSAnJztcblx0dmFyIHZhbHVlID0gJyc7XG5cdHZhciBtYWluTWVzc2FnZSA9IGFyZ3VtZW50c1sxXTtcblxuXHRhcmdzWzBdID0gYXJndW1lbnRzWzBdIHx8ICcnO1xuXHRhcmdzWzFdID0gYXJndW1lbnRzWzFdIHx8ICcnO1xuXHRhcmdzWzJdID0gYXJndW1lbnRzWzJdIHx8ICcnO1xuXHRhcmdzWzNdID0gYXJndW1lbnRzWzNdIHx8ICcnO1xuXHRhcmdzWzRdID0gYXJndW1lbnRzWzRdIHx8ICcnO1xuXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMikge1xuXHRcdC8vIEpVU1QgQSBTVVBFUiBTSU1QTEUgQ09OU09MRS5MT0cgV0lUSCBTVEFDSyBUUkFDRVxuXHRcdGxhYmVsID0gJ1vwn6SaU1NJXSc7XG5cdFx0dmFyIGFjdGlvbiA9ICfwn5KhU0lNUExFJztcblx0XHR2YXIga2V5ID0gYXJnc1swXTtcblx0XHR2YXIgdmFsdWUgPSAnJztcblx0fSBlbHNlIHtcblx0XHQvLyBTT01FVEhJTkcgTU9SRSBJTlZPTFZFRCwgSE9QRUZVTExZIFdJVEggVEFHIEFORCBBTExcblx0XHQvLyBDT01JTkcgRUlUSEVSIEZST00gRlJBTUVXT1JLIE9SIFBJUFdFUktTIFNDT1JNIEFQSSBXUkFQUEVSXG5cdFx0Ly8gY29uc29sZS5lcnJvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG5cdFx0aWYgKHRhZyA9PT0gJ3BpcHdlcmtzJykge1xuXHRcdFx0Ly8gREVBTElORyBXSVRIIFBJUFdFUktTIERFQlVHIE1FU1NBR0VTIFRIQVQgV0UgSElKQUNLRURcblx0XHRcdHBpcHdlcmtzUGFyc2VyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIERFQUxJTkcgV0lUSCBPVVIgT1dOIE1FU1NBR0VTLCBDT01JTkcgRlJPTSBJTlNJREUgVEhFIEZSQU1FV09SS1xuXHRcdFx0aW50ZXJhY3RpdmVQYXJzZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHR9XG5cdH1cblxuXHQvLyBOYXN0eSBoYWNrIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBTQ09STSBBUEkgb2JqZWN0IGlzIGFjdHVhbGx5IGF2YWlsYWJsZVxuXHQvLyAod2hpY2ggc2VlbXMgdG8gdGFrZSBhIGZldyB0aWNrcyBhZnRlciBpbml0aWFsaXphdGlvbikgdG8gbG9nIHRvIGNvbnNvbGUuXG5cdC8vIFRoYXQncyB3aHkgd2UgaGF2ZSB0aGF0IHRpbWVvdXQgaGVyZS5cblx0aWYgKGFjdGlvbi5pbmRleE9mKCdBUEk6JykgPiAtMSkge1xuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0Y29uc29sZS5ncm91cENvbGxhcHNlZChsYWJlbCArIGFjdGlvbiArIGtleSwgdmFsdWUpO1xuXHRcdFx0Y29uc29sZS50cmFjZSgnU3RhY2sgdHJhY2U6Jyk7XG5cdFx0XHRjb25zb2xlLmdyb3VwRW5kKCk7XG5cdFx0fSwgMSk7XG5cdH0gZWxzZSB7XG5cdFx0Y29uc29sZS5ncm91cENvbGxhcHNlZChsYWJlbCArIGFjdGlvbiArIGtleSArICcgJyArIHZhbHVlKTtcblx0XHRjb25zb2xlLnRyYWNlKCdTdGFjayB0cmFjZTonKTtcblx0XHRjb25zb2xlLmdyb3VwRW5kKCk7XG5cdH1cblxuXHQvLyBGb3Igc2l0dWF0aW9ucyB3aGVyZSB0aGUgY29uc29sZSBpc24ndCBlbm91Z2gsIGJlY2F1c2UgaXQgbWlnaHQgbm90IGhhdmUgYmVlbiBsb2dnZ2luZ1xuXHQvLyByaWdodCBmcm9tIHRoZSBzdGFydCAobG9va2luZyBhdCB5b3UgaW50ZXJuZXQgZXhwbG9yZXIhKSwgd2UgYWxzbyB3YW50IHRvIGhhdmUgYWxsIHRoZVxuXHQvLyBsb2cgd29ydGh5IGV2ZW50cyBpbiBhIG5lYXQgYXJyYXkuIFRoYXQgd2F5IHdlIGNhbiBsb29rIGF0IGl0IChvciBleHBvcnQgaXQgZXZlbiEpXG5cdC8vIHdoZW5ldmVyIHdlIHdhbnQhXG5cdHZhciBsb2dFbnRyeSA9IHtcblx0XHRsYWJlbDogbGFiZWwsXG5cdFx0YWN0aW9uOiBhY3Rpb24sXG5cdFx0a2V5OiBrZXksXG5cdFx0dmFsdWU6IHZhbHVlXG5cdH07XG5cblx0c2kubG9nLnB1c2gobG9nRW50cnkpO1xuXG5cdGZ1bmN0aW9uIHBpcHdlcmtzUGFyc2VyKCkge1xuXHRcdHRhZyA9ICdQSVA6U0NPUk0nO1xuXG5cdFx0aWYgKHR5cGVvZiBhcmd1bWVudHNbMV0gPT09ICdzdHJpbmcnKSB7XG5cdFx0XHQvLyB0cmFjZU1zZ1ByZWZpeCA9IFwiU0NPUk0uZGF0YS5nZXQoJ1wiICsgcGFyYW1ldGVyICsgXCInKSBcIjtcblx0XHRcdC8vIHRyYWNlTXNnUHJlZml4ID0gXCJTQ09STS5kYXRhLnNldCgnXCIgKyBwYXJhbWV0ZXIgKyBcIicpIFwiO1xuXHRcdFx0aWYgKG1haW5NZXNzYWdlLmluZGV4T2YoJ1NDT1JNLmRhdGEnKSA+IC0xKSB7XG5cdFx0XHRcdGVtb2ppID0gJ/Cfkr4nO1xuXHRcdFx0XHRpZiAobWFpbk1lc3NhZ2UuaW5kZXhPZignLmdldCcpID4gLTEpIHtcblx0XHRcdFx0XHRtYWluTWVzc2FnZSA9IG1haW5NZXNzYWdlLnJlcGxhY2UoL1NDT1JNLmRhdGEuZ2V0XFwoL2dpLCAnJyk7XG5cdFx0XHRcdFx0YWN0aW9uID0gJ+KPqiBHRVQnO1xuXHRcdFx0XHR9IGVsc2UgaWYgKG1haW5NZXNzYWdlLmluZGV4T2YoJy5zZXQnKSA+IC0xKSB7XG5cdFx0XHRcdFx0bWFpbk1lc3NhZ2UgPSBtYWluTWVzc2FnZS5yZXBsYWNlKC9TQ09STS5kYXRhLnNldFxcKC9naSwgJycpO1xuXHRcdFx0XHRcdGFjdGlvbiA9ICdTRVQg4o+pJztcblx0XHRcdFx0fVxuXHRcdFx0XHRtYWluTWVzc2FnZSA9IG1haW5NZXNzYWdlLnJlcGxhY2UoL1xcKS9naSwgJzonKTtcblx0XHRcdFx0a2V5ID0gbWFpbk1lc3NhZ2Uuc3BsaXQoJyAgdmFsdWU6ICcpWzBdIHx8ICcnO1xuXHRcdFx0XHR2YWx1ZSA9IG1haW5NZXNzYWdlLnNwbGl0KCcgIHZhbHVlOiAnKVsxXSB8fCAnJztcblx0XHRcdH1cblxuXHRcdFx0Ly8gdHJhY2VNc2dQcmVmaXggPSAnU0NPUk0uY29ubmVjdGlvbi5pbml0aWFsaXplICc7XG5cdFx0XHQvLyB0cmFjZU1zZ1ByZWZpeCA9ICdTQ09STS5jb25uZWN0aW9uLnRlcm1pbmF0ZSAnO1xuXHRcdFx0aWYgKG1haW5NZXNzYWdlLmluZGV4T2YoJ1NDT1JNLmNvbm5lY3Rpb24nKSA+IC0xIHx8IG1haW5NZXNzYWdlLmluZGV4T2YoJ2Nvbm5lY3Rpb24uaW5pdGlhbGl6ZScpID4gLTEpIHtcblx0XHRcdFx0ZW1vamkgPSAn8J+UjCc7XG5cdFx0XHRcdGlmIChtYWluTWVzc2FnZS5pbmRleE9mKCcuaW5pdGlhbGl6ZScpID4gLTEpIHtcblx0XHRcdFx0XHRtYWluTWVzc2FnZSA9IG1haW5NZXNzYWdlLnJlcGxhY2UoL1NDT1JNLmNvbm5lY3Rpb24uaW5pdGlhbGl6ZSAvZ2ksICcnKTtcblx0XHRcdFx0XHRhY3Rpb24gPSAn8J+knSBJTklUJztcblx0XHRcdFx0XHRpZiAobWFpbk1lc3NhZ2UuaW5kZXhPZignY29ubmVjdGlvbi5pbml0aWFsaXplIGNhbGxlZC4nKSA+IC0xKSB7XG5cdFx0XHRcdFx0XHRtYWluTWVzc2FnZSA9IG1haW5NZXNzYWdlLnJlcGxhY2UoL2Nvbm5lY3Rpb24uaW5pdGlhbGl6ZSBjYWxsZWQuL2dpLCAnJyk7XG5cdFx0XHRcdFx0XHRrZXkgPSAnSW5pdGlhbGl6aW5nIExNUyBjb25uZWN0aW9uLi4uJztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSBpZiAobWFpbk1lc3NhZ2UuaW5kZXhPZignLnRlcm1pbmF0ZScpID4gLTEpIHtcblx0XHRcdFx0XHRtYWluTWVzc2FnZSA9IG1haW5NZXNzYWdlLnJlcGxhY2UoL1NDT1JNLmNvbm5lY3Rpb24udGVybWluYXRlIC9naSwgJycpO1xuXHRcdFx0XHRcdGFjdGlvbiA9ICfwn5KAIFRFUk0nO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChtYWluTWVzc2FnZS5pbmRleE9mKCdmYWlsZWQnKSA+IC0xIHx8IG1haW5NZXNzYWdlLmluZGV4T2YoJ2Fib3J0ZWQnKSA+IC0xKSB7XG5cdFx0XHRcdFx0bWFpbk1lc3NhZ2UgPSBtYWluTWVzc2FnZS5yZXBsYWNlKC9mYWlsZWQvZ2ksICfinYwgRkFJTEVEJyk7XG5cdFx0XHRcdFx0bWFpbk1lc3NhZ2UgPSBtYWluTWVzc2FnZS5yZXBsYWNlKC9hYm9ydGVkL2dpLCAn4p2MIEFCT1JURUQnKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyB0cmFjZU1zZ1ByZWZpeCA9ICdTQ09STS5BUEkuZmluZCcsXG5cdFx0XHRpZiAobWFpbk1lc3NhZ2UuaW5kZXhPZignQVBJJykgPiAtMSkge1xuXHRcdFx0XHRlbW9qaSA9ICfwn5OWJztcblx0XHRcdFx0aWYgKG1haW5NZXNzYWdlLmluZGV4T2YoJy5maW5kJykgPiAtMSkge1xuXHRcdFx0XHRcdG1haW5NZXNzYWdlID0gbWFpbk1lc3NhZ2UucmVwbGFjZSgvU0NPUk0uQVBJLmZpbmQ6IC9naSwgJycpO1xuXHRcdFx0XHRcdG1haW5NZXNzYWdlID0gbWFpbk1lc3NhZ2UucmVwbGFjZSgvLiBWZXJzaW9uOiAvZ2ksICc6IHYnKTtcblx0XHRcdFx0XHRhY3Rpb24gPSAn8J+UjSBGSU5EJztcblx0XHRcdFx0XHR2YWx1ZSA9ICcoSXQgd2lsbCBiZSBhdmFpbGFibGUgZm9yIGluc3BlY3Rpb24gaW4gYSBmZXcgdGlja3MuKSc7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKG1haW5NZXNzYWdlLmluZGV4T2YoJ0FQSTonKSA+IC0xKSB7XG5cdFx0XHRcdFx0YWN0aW9uID0gJ/CflJcgQVBJJztcblx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdGtleSA9IHBpcHdlcmtzLlNDT1JNLkFQSS5oYW5kbGU7XG5cdFx0XHRcdFx0fSwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoYWN0aW9uICE9PSAnJykge1xuXHRcdFx0YWN0aW9uID0gJygnICsgYWN0aW9uICsgJykgJztcblx0XHR9XG5cdFx0a2V5ID0ga2V5IHx8IG1haW5NZXNzYWdlO1xuXHRcdHZhbHVlID0gaXNOYU4ocGFyc2VJbnQodmFsdWUsIDEwKSkgPyB2YWx1ZSA6IHBhcnNlSW50KHZhbHVlLCAxMCk7XG5cdFx0bGFiZWwgPSAnWycgKyBlbW9qaSArIHRhZyArICddICc7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnRlcmFjdGl2ZVBhcnNlcigpIHtcblx0XHR0YWcgPSAnU1NJOicgKyB0YWc7XG5cdFx0ZW1vamkgPSAn8J+kmic7XG5cdFx0YWN0aW9uID0gYXJnc1sxXSB8fCAnJztcblx0XHRrZXkgPSBhcmdzWzJdIHx8ICcnO1xuXHRcdHZhbHVlID0gYXJnc1szXSB8fCAnJztcblxuXHRcdGlmICh0eXBlb2YgYXJndW1lbnRzWzFdID09PSAnc3RyaW5nJykge1xuXHRcdFx0aWYgKGFyZ3NbMV0gPT09ICdTRVQnKSB7XG5cdFx0XHRcdGFjdGlvbiA9ICcoU0VUIOKPqSkgJztcblx0XHRcdH0gZWxzZSBpZiAoYXJnc1sxXSA9PT0gJ0dFVCcpIHtcblx0XHRcdFx0YWN0aW9uID0gJyjij6ogR0VUKSAnO1xuXHRcdFx0fSBlbHNlIGlmIChhcmdzWzFdID09PSAnSU5JVCcpIHtcblx0XHRcdFx0YWN0aW9uID0gJyjwn6SdIElOSVQpICc7XG5cdFx0XHR9IGVsc2UgaWYgKGFyZ3NbMV0gPT09ICdDT01QTEVURScpIHtcblx0XHRcdFx0YWN0aW9uID0gJyjwn4+GIENPTVBMRVRFKSAnO1xuXHRcdFx0fSBlbHNlIGlmIChhcmdzWzFdID09PSAnSU5GTycpIHtcblx0XHRcdFx0YWN0aW9uID0gJyjwn5KhIElORk8pICc7XG5cdFx0XHR9IGVsc2UgaWYgKGFyZ3NbMV0gPT09ICdBUEknKSB7XG5cdFx0XHRcdGFjdGlvbiA9ICco8J+UlyBBUEkpICc7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChhcmdzWzJdLmluZGV4T2YoJ1NVQ0NFU1MnKSA+IC0xKSB7XG5cdFx0XHRcdGtleSA9ICfinIUgJyArIGFyZ3NbMl07XG5cdFx0XHR9XG5cdFx0XHRpZiAoYXJnc1syXS5pbmRleE9mKCdFUlJPUicpID4gLTEpIHtcblx0XHRcdFx0a2V5ID0gJ+KdjCAnICsgYXJnc1syXTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gICBrZXkgPSBtYWluTWVzc2FnZS5zcGxpdChcIiAgdmFsdWU6IFwiKVswXTtcblx0XHRcdC8vICAgdmFsdWUgPSBtYWluTWVzc2FnZS5zcGxpdChcIiAgdmFsdWU6IFwiKVsxXSB8fCBcIlwiO1xuXHRcdH1cblxuXHRcdHZhbHVlID0gaXNOYU4ocGFyc2VJbnQodmFsdWUsIDEwKSkgPyB2YWx1ZSA6IHBhcnNlSW50KHZhbHVlLCAxMCk7XG5cdFx0bGFiZWwgPSAnWycgKyBlbW9qaSArIHRhZyArICddICc7XG5cdH1cbn1cbnBpcHdlcmtzLlVUSUxTLnRyYWNlID0gZnVuY3Rpb24gKG1zZykge1xuXHRpZiAocGlwd2Vya3MuZGVidWcuaXNBY3RpdmUpIHtcblx0XHRpZiAod2luZG93LmNvbnNvbGUgJiYgd2luZG93LmNvbnNvbGUubG9nKSB7XG5cdFx0XHRzaUxvZygncGlwd2Vya3MnLCBtc2cpO1xuXHRcdH1cblx0fVxufTtcblxuLy8gW/Cfkr5TQ09STV0g4qyF77iPR0VUICgnY21pLmNvcmUuc3R1ZGVudF9uYW1lJykgIHZhbHVlOiBpbnRlcmFjdGl2ZSxcblxuLy8gdHJhY2VNc2dQcmVmaXggPSAnU0NPUk0uZGF0YS5zYXZlIGZhaWxlZCc7XG4vLyB0cmFjZU1zZ1ByZWZpeCA9ICdTQ09STS5nZXRTdGF0dXMgZmFpbGVkJyxcblxuLy8gYXJnc1swXSA9ICdb8J+SoVNDT1JNXSc7XG4vLyBhcmdzWzBdID0gJ1vimJ3vuI9TQ09STV0nO1xuLy8gYXJnc1swXSA9ICdb8J+RhlNDT1JNXSc7XG4vLyBhcmdzWzBdID0gJ1vwn6SeU0NPUk1dJztcbiIsIi8vU29tZSBzaG9ydGN1dHMgZm9yIGZ1bmN0aW9uc1xuLyoqXG4gKlxuICovXG5mdW5jdGlvbiBuZXh0U2xpZGUoKSB7XG5cdFJldmVhbC5yaWdodCgpO1xufVxuXG4vKipcbiAqXG4gKi9cbmZ1bmN0aW9uIHByZXZTbGlkZSgpIHtcblx0UmV2ZWFsLmxlZnQoKTtcbn1cblxuLyoqXG4gKlxuICovXG5mdW5jdGlvbiBkb3duU2xpZGUoKSB7XG5cdFJldmVhbC5kb3duKCk7XG59XG5cbi8qKlxuICpcbiAqL1xuZnVuY3Rpb24gdXBTbGlkZSgpIHtcblx0UmV2ZWFsLnVwKCk7XG59XG5cbi8qKlxuICpcbiAqL1xuZnVuY3Rpb24gbmV4dEhpZGUoKSB7XG5cdCQoJyNzaS1uZXh0JykuaGlkZSgpO1xufVxuXG4vKipcbiAqXG4gKi9cbmZ1bmN0aW9uIG5leHRTaG93KCkge1xuXHQkKCcjc2ktbmV4dCcpLnNob3coKTtcbn1cblxuLyoqXG4gKlxuICovXG5mdW5jdGlvbiBiYWNrSGlkZSgpIHtcblx0JCgnI3NpLWJhY2snKS5oaWRlKCk7XG59XG5cbi8qKlxuICpcbiAqL1xuZnVuY3Rpb24gYmFja1Nob3coKSB7XG5cdCQoJyNzaS1iYWNrJykuc2hvdygpO1xufVxuXG4vKipcbiAqIEBwYXJhbSBuXG4gKi9cbmZ1bmN0aW9uIGp1bXBUb1NsaWRlKG4pIHtcblx0UmV2ZWFsLnNsaWRlKG4gLSAxKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gaWRcbiAqL1xuZnVuY3Rpb24ganVtcFRvSWQoaWQpIHtcblx0dmFyIG51bSA9IHNsaWRlc1tpZF0uc2xpZGVOdW1iZXI7XG5cdFJldmVhbC5zbGlkZShudW0gLSAxKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gJGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gbG9jaygkZWxlbWVudCkge1xuXHQkZWxlbWVudC5hZGRDbGFzcygnbm9FdmVudHMnKTtcblx0JGVsZW1lbnQuYXR0cignZGlzYWJsZWQnLCAnZGlzYWJsZWQnKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gJGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gdW5sb2NrKCRlbGVtZW50KSB7XG5cdCRlbGVtZW50LnJlbW92ZUNsYXNzKCdub0V2ZW50cycpO1xuXHQkZWxlbWVudC5yZW1vdmVBdHRyKCdkaXNhYmxlZCcpO1xufVxuXG4vKipcbiAqIEBwYXJhbSBwYXRoTmFtZVxuICovXG5mdW5jdGlvbiBzZXRQYXRoKHBhdGhOYW1lKSB7XG5cdGlmICghY2hlY2tXaG9sZVBhdGgocGF0aE5hbWUpICYmIGxtc0Nvbm5lY3RlZCkge1xuXHRcdHNldFNjb3JtSW5jb21wbGV0ZSgpO1xuXHR9XG5cdHJldHVybiAoc2F2ZURhdGEucGF0aFNlbGVjdGVkID0gcGF0aE5hbWUpO1xufVxuXG4vKipcbiAqIEBwYXJhbSBpbnB1dFxuICovXG5mdW5jdGlvbiBnZXRDb21wbGV0aW9uU3RhdHVzKGlucHV0KSB7XG5cdHZhciBjaGVja1NwZWNpZmljUGF0aCA9IGlucHV0ICYmIGlucHV0WzBdID09PSAnQCc7XG5cblx0aWYgKGNoZWNrU3BlY2lmaWNQYXRoKSByZXR1cm4gY2hlY2tXaG9sZVBhdGgoaW5wdXQuc3BsaXQoJ0AnKVsxXSk7XG5cblx0dmFyIHNsaWRlSUQgPSBpbnB1dCA/IGlucHV0IDogZ2xvYmFsVmFyLmN1clNsaWRlO1xuXHR2YXIgc2xpZGVPYmogPSBzbGlkZXNbc2xpZGVJRF07XG5cblx0Ly8gaWYgKCFzbGlkZU9iaikgcmV0dXJuIGNvbnNvbGUud2FybignaW52YWxpZCBzbGlkZScpO1xuXHQvLyBpZiAoIXNsaWRlT2JqLmluY2x1ZGUpIHJldHVybiBjb25zb2xlLndhcm4oJ2luY2x1ZGU6IGZhbHNlJyk7XG5cblx0dmFyIG9uQ3VyU2xpZGUgPSBzbGlkZUlEID09PSBnbG9iYWxWYXIuY3VyU2xpZGU7XG5cdHZhciBzbGlkZUNvbXBsZXRpb24gPSBzYXZlRGF0YS5zbGlkZUNvbXBsZXRpb247XG5cdHZhciBwYXRoU2VsZWN0ZWQgPSBzYXZlRGF0YS5wYXRoU2VsZWN0ZWQ7XG5cdHZhciBzcGVjaWZpZWRQYXRoID0gc2xpZGVPYmouY29tcGxldGlvblBhdGg7XG5cdHZhciBwYXRoT2JqID0gc2xpZGVDb21wbGV0aW9uLm1haW5QYXRoO1xuXG5cdGlmIChzcGVjaWZpZWRQYXRoKSB7XG5cdFx0aWYgKEFycmF5LmlzQXJyYXkoc3BlY2lmaWVkUGF0aCkpIHtcblx0XHRcdGlmIChwYXRoU2VsZWN0ZWQgJiYgc3BlY2lmaWVkUGF0aC5pbmRleE9mKHBhdGhTZWxlY3RlZCkgPj0gMCkge1xuXHRcdFx0XHRwYXRoT2JqID0gc2xpZGVDb21wbGV0aW9uW3BhdGhTZWxlY3RlZF07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXRoT2JqID0gc2xpZGVDb21wbGV0aW9uW3NwZWNpZmllZFBhdGhbMF1dO1xuXHRcdFx0XHRpZiAob25DdXJTbGlkZSkgc2V0UGF0aChzcGVjaWZpZWRQYXRoWzBdKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cGF0aE9iaiA9IHNsaWRlQ29tcGxldGlvbltzcGVjaWZpZWRQYXRoXTtcblx0XHRcdGlmIChvbkN1clNsaWRlKSBzZXRQYXRoKHNwZWNpZmllZFBhdGgpO1xuXHRcdH1cblx0fVxuXHQvLyBjb25zb2xlLmxvZyhpbnB1dCk7XG5cblx0cmV0dXJuIHBhdGhPYmpbc2xpZGVJRF07XG59XG5cbmZ1bmN0aW9uIGNoZWNrV2hvbGVQYXRoKHBhdGgpIHtcblx0dmFyIHBhdGhPYmogPSBzYXZlRGF0YS5zbGlkZUNvbXBsZXRpb25bcGF0aF07XG5cdGZvciAodmFyIGtleSBpbiBwYXRoT2JqKSB7XG5cdFx0aWYgKCFwYXRoT2JqW2tleV0pIHJldHVybiAwO1xuXHR9XG5cdHJldHVybiAxO1xufVxuXG5mdW5jdGlvbiBjb21wbGV0ZVNsaWRlKCkge1xuXHRpZiAoIXNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLmluY2x1ZGUpIHJldHVybjtcblxuXHR2YXIgc2xpZGVJRCA9IGdsb2JhbFZhci5jdXJTbGlkZTtcblx0dmFyIHNwZWNpZmllZFBhdGggPSBzbGlkZXNbc2xpZGVJRF0uY29tcGxldGlvblBhdGg7XG5cdHZhciBzbGlkZUNvbXBsZXRpb24gPSBzYXZlRGF0YS5zbGlkZUNvbXBsZXRpb247XG5cblx0aWYgKHNwZWNpZmllZFBhdGgpIHtcblx0XHRpZiAoQXJyYXkuaXNBcnJheShzcGVjaWZpZWRQYXRoKSkge1xuXHRcdFx0c3BlY2lmaWVkUGF0aC5mb3JFYWNoKGZ1bmN0aW9uIChwYXRoLCBpZHgpIHtcblx0XHRcdFx0c2xpZGVDb21wbGV0aW9uW3BhdGhdW3NsaWRlSURdID0gMTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSBzbGlkZUNvbXBsZXRpb25bc3BlY2lmaWVkUGF0aF1bc2xpZGVJRF0gPSAxO1xuXHR9IGVsc2Ugc2xpZGVDb21wbGV0aW9uLm1haW5QYXRoW3NsaWRlSURdID0gMTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gbmF2RWxlbVxuICogQHBhcmFtIHN0eWxlQ2xhc3NcbiAqIEBwYXJhbSBodG1sXG4gKi9cbmZ1bmN0aW9uIGN1c3RvbU5hdlN0eWxlKG5hdkVsZW0sIHN0eWxlQ2xhc3MsIGh0bWwpIHtcblx0dmFyIGVsZW0gPSAkKCcjc2ktJyArIG5hdkVsZW0pO1xuXHR2YXIgaW5pdGlhbEhUTUwgPSBlbGVtLmh0bWwoKTtcblx0dmFyIGN1clNsaWRlID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV07XG5cblx0aWYgKGh0bWwpIGVsZW0uaHRtbChodG1sKTtcblxuXHRlbGVtLmFkZENsYXNzKHN0eWxlQ2xhc3MpO1xuXG5cdGN1clNsaWRlLm9uRXhpdEFjdGlvbiA9IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIG9yaWdpbmFsT25FeGl0ID0gY3VyU2xpZGUub25FeGl0QWN0aW9uO1xuXHRcdHJldHVybiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAob3JpZ2luYWxPbkV4aXQpIG9yaWdpbmFsT25FeGl0LmFwcGx5KHRoaXMpO1xuXHRcdFx0ZWxlbS5odG1sKGluaXRpYWxIVE1MKTtcblx0XHRcdGVsZW0ucmVtb3ZlQ2xhc3Moc3R5bGVDbGFzcyk7XG5cdFx0fTtcblx0fSkoKTtcbn1cblxuLy8vLy8vLy8vLy8vKkZlYXR1cmU6aWRlYmVob2xkLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5mdW5jdGlvbiBpbnN0YUNoZWF0QWRkb24oKSB7XG5cdC8vIGNvbnNvbGUubG9nKFwiSGVsbG8sIEknbSB5b3VyIGluc3RhQ2hlYXTihKIgYWRkb24gZm9yIHRvZGF5IVwiKTtcbn1cblxuLy90aGUgaG9seSBjaGVhdGZ1bmN0aW9uISEhXG4vKipcbiAqXG4gKi9cbmZ1bmN0aW9uIGRldk1vZGUoKSB7XG5cdC8vIENoZWF0IGNvZGUuIFNlZSBEb29tLlxuXG5cdCQoJ2JvZHknKS5hZGRDbGFzcygnZGV2LW1vZGUnKTtcblx0Y29uc29sZS5sb2coJ0dPRCBNT0RFIScpO1xuXHQkKCcjZ3VpZGVsaW5lcycpLnNob3coKTtcblxuXHQkKGRvY3VtZW50KS5rZXl1cChmdW5jdGlvbiAoZSkge1xuXHRcdC8vICdnJyBrZXkgdG9nZ2xlcyBncmlkIGxpbmVzXG5cdFx0aWYgKGUud2hpY2ggPT0gNzEpIHtcblx0XHRcdGlmICgkKCcjZ3VpZGVsaW5lcycpLmNzcygnZGlzcGxheScpICE9ICdub25lJykge1xuXHRcdFx0XHQkKCcjZ3VpZGVsaW5lcycpLmhpZGUoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCQoJyNndWlkZWxpbmVzJykuc2hvdygpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIHNoaWZ0ICsgYXJyb3cga2V5cyBhbGxvdyBuYXZpZ2F0aW9uIHRocm91Z2ggaG9yaXpvbnRhbCBhbmQgdmVydGljYWwgc2xpZGVzXG5cdFx0aWYgKGUuc2hpZnRLZXkgJiYgZS53aGljaCA9PSAzNykge1xuXHRcdFx0UmV2ZWFsLmxlZnQoKTtcblx0XHR9XG5cdFx0aWYgKGUuc2hpZnRLZXkgJiYgZS53aGljaCA9PSAzOSkge1xuXHRcdFx0UmV2ZWFsLnJpZ2h0KCk7XG5cdFx0fVxuXHRcdGlmIChlLnNoaWZ0S2V5ICYmIGUud2hpY2ggPT0gMzgpIHtcblx0XHRcdFJldmVhbC51cCgpO1xuXHRcdH1cblx0XHRpZiAoZS5zaGlmdEtleSAmJiBlLndoaWNoID09IDQwKSB7XG5cdFx0XHRSZXZlYWwuZG93bigpO1xuXHRcdH1cblxuXHRcdC8vICdqJyBrZXkgcmV2ZWFscyBwb3NpdGl2ZSBmZWVkYmFja1xuXHRcdGlmIChlLndoaWNoID09PSA3NCkge1xuXHRcdFx0c2ltcGxlTW9kYWxDbG9zZSgpO1xuXHRcdFx0c2ltcGxlTW9kYWxPcGVuKCdwb3NpdGl2ZScpO1xuXHRcdH1cblx0XHQvLyAgJ2snIGtleSByZXZlYWxzIG5lZ2F0aXZlIGZlZWRiYWNrIDFcblx0XHRpZiAoZS53aGljaCA9PT0gNzUpIHtcblx0XHRcdHNpbXBsZU1vZGFsQ2xvc2UoKTtcblx0XHRcdGlmIChzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5tb2RhbC5uZWdhdGl2ZSkge1xuXHRcdFx0XHRzaW1wbGVNb2RhbE9wZW4oJ25lZ2F0aXZlJyk7XG5cdFx0XHR9IGVsc2UgaWYgKHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLm1vZGFsLm5lZ2F0aXZlMSkge1xuXHRcdFx0XHRzaW1wbGVNb2RhbE9wZW4oJ25lZ2F0aXZlMScpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyAnbCcga2V5IHJldmVhbHMgbmVnYXRpdmUgZmVlZGJhY2sgMlxuXHRcdGlmIChlLndoaWNoID09PSA3Nikge1xuXHRcdFx0c2ltcGxlTW9kYWxDbG9zZSgpO1xuXHRcdFx0c2ltcGxlTW9kYWxPcGVuKCduZWdhdGl2ZUZpbmFsJyk7XG5cdFx0fVxuXHRcdC8vIDEgLSA5IGZvciBob3RzcG90c1xuXHRcdGlmIChlLndoaWNoID09PSA0OSAmJiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5tb2RhbC5oczEpIHtcblx0XHRcdHNpbXBsZU1vZGFsQ2xvc2UoKTtcblx0XHRcdHNpbXBsZU1vZGFsT3BlbignaHMxJyk7XG5cdFx0fVxuXHRcdGlmIChlLndoaWNoID09PSA1MCAmJiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5tb2RhbC5oczIpIHtcblx0XHRcdHNpbXBsZU1vZGFsQ2xvc2UoKTtcblx0XHRcdHNpbXBsZU1vZGFsT3BlbignaHMyJyk7XG5cdFx0fVxuXHRcdGlmIChlLndoaWNoID09PSA1MSAmJiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5tb2RhbC5oczMpIHtcblx0XHRcdHNpbXBsZU1vZGFsQ2xvc2UoKTtcblx0XHRcdHNpbXBsZU1vZGFsT3BlbignaHMzJyk7XG5cdFx0fVxuXHRcdGlmIChlLndoaWNoID09PSA1MiAmJiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5tb2RhbC5oczQpIHtcblx0XHRcdHNpbXBsZU1vZGFsQ2xvc2UoKTtcblx0XHRcdHNpbXBsZU1vZGFsT3BlbignaHM0Jyk7XG5cdFx0fVxuXHRcdGlmIChlLndoaWNoID09PSA1MyAmJiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5tb2RhbC5oczUpIHtcblx0XHRcdHNpbXBsZU1vZGFsQ2xvc2UoKTtcblx0XHRcdHNpbXBsZU1vZGFsT3BlbignaHM1Jyk7XG5cdFx0fVxuXHRcdGlmIChlLndoaWNoID09PSA1NCAmJiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5tb2RhbC5oczYpIHtcblx0XHRcdHNpbXBsZU1vZGFsQ2xvc2UoKTtcblx0XHRcdHNpbXBsZU1vZGFsT3BlbignaHM2Jyk7XG5cdFx0fVxuXHRcdGlmIChlLndoaWNoID09PSA1NSAmJiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5tb2RhbC5oczcpIHtcblx0XHRcdHNpbXBsZU1vZGFsQ2xvc2UoKTtcblx0XHRcdHNpbXBsZU1vZGFsT3BlbignaHM3Jyk7XG5cdFx0fVxuXHRcdGlmIChlLndoaWNoID09PSA1NiAmJiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5tb2RhbC5oczgpIHtcblx0XHRcdHNpbXBsZU1vZGFsQ2xvc2UoKTtcblx0XHRcdHNpbXBsZU1vZGFsT3BlbignaHM4Jyk7XG5cdFx0fVxuXHRcdGlmIChlLndoaWNoID09PSA1NyAmJiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5tb2RhbC5oczkpIHtcblx0XHRcdHNpbXBsZU1vZGFsQ2xvc2UoKTtcblx0XHRcdHNpbXBsZU1vZGFsT3BlbignaHM5Jyk7XG5cdFx0fVxuXG5cdFx0Ly8gICc7JyBrZXkgaGlkZXMgYWxsIGZlZWRiYWNrc1xuXHRcdGlmIChlLndoaWNoID09IDE4Nikge1xuXHRcdFx0c2ltcGxlTW9kYWxDbG9zZSgpO1xuXHRcdH1cblx0fSk7XG59XG4iLCIvLyBkbyBub3QgdXNlIHRoZSBpZCAndGVzdCcgZm9yIGEgc2xpZGVcblxuJCgnI2J0bi1zdGFydCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcblx0anVtcFRvU2xpZGUoMik7XG5cdHNpQXVkaW8uc2Z4LmNsaWNrLnBsYXkoKTtcbn0pO1xuXG4kKGZ1bmN0aW9uICgpIHtcblx0c2xpZGVzID0ge1xuXHRcdHN0YXJ0OiB7XG5cdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRuYXZFbGVtZW50czogWydjbG9jayddLFxuXHRcdFx0YmFja0FjdGlvbjogZnVuY3Rpb24gKCkge30sIC8vbGVhdmUgU3RhcnQgYmFja0FjdGlvbiBhcyBmdW5jdGlvbiB0byBwcmV2ZW50IElFOSBlcnJvcnNcblx0XHRcdG9uRW50ZXJBY3Rpb246IGZ1bmN0aW9uICgpIHt9LFxuXHRcdFx0YXVkaW86IHtcblx0XHRcdFx0Ly8gb25FbnRlcjogXCJtZWRpYS9hdWRpby9TdGFydC8wLm1wM1wiXG5cdFx0XHR9LFxuXHRcdFx0aW5jbHVkZTogZmFsc2UgLy8gdGhpcyBrZXkgZGV0ZXJtaW5lcyBpZiB0aGUgc2xpZGUgd2lsbCBiZSB1c2VkIGFzIHBhcnQgb2YgdGhlIGNvbXBsZXRpb24gb2YgdGhlIHByb2dyZXNzIG1ldGVyLiBkZWZhdWx0IGlzIHRydWUuICBkbyBub3QgY2FsbCBjb21wbGV0ZVNsaWRlKCkgb24gYW55IHNsaWRlIHdoZXJlIHRoaXMgaXMgc2V0IHRvIGZhbHNlXG5cdFx0fSxcblx0XHRpbnRybzoge1xuXHRcdFx0dHlwZTogJ3RleHQnLFxuXHRcdFx0bmF2RWxlbWVudHM6IFsnc3RhbmRhcmQtbWVudScsICchbWVudScsICdob21lJywgJ25leHQnXSxcblx0XHRcdGJhY2tBY3Rpb246IHByZXZTbGlkZSxcblx0XHRcdG9uRW50ZXJBY3Rpb246IGZ1bmN0aW9uICgpIHt9LFxuXHRcdFx0YXVkaW86IHtcblx0XHRcdFx0Ly8gb25FbnRlcjogXCJtZWRpYS9hdWRpby9TdGFydC8wLm1wM1wiXG5cdFx0XHR9LFxuXHRcdFx0aW5jbHVkZTogZmFsc2UgLy8gdGhpcyBrZXkgZGV0ZXJtaW5lcyBpZiB0aGUgc2xpZGUgd2lsbCBiZSB1c2VkIGFzIHBhcnQgb2YgdGhlIGNvbXBsZXRpb24gb2YgdGhlIHByb2dyZXNzIG1ldGVyLiBkZWZhdWx0IGlzIHRydWUuICBkbyBub3QgY2FsbCBjb21wbGV0ZVNsaWRlKCkgb24gYW55IHNsaWRlIHdoZXJlIHRoaXMgaXMgc2V0IHRvIGZhbHNlXG5cdFx0fSxcblx0XHR2MToge1xuXHRcdFx0dHlwZTogJ3ZpZGVvJyxcblx0XHRcdG5hdkVsZW1lbnRzOiBbJ3N0YW5kYXJkLW1lbnUnLCAnIXByb2dyZXNzJywgJyFsb2dvJywgJyFtZW51JywgJ2hvbWUnXSxcblx0XHRcdGJhY2tBY3Rpb246IHByZXZTbGlkZSxcblx0XHRcdG5leHRBY3Rpb246IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0Y29tcGxldGVTbGlkZSgpO1xuXHRcdFx0XHRuZXh0U2xpZGUoKTtcblx0XHRcdH0sXG5cdFx0XHRvbkVudGVyQWN0aW9uOiBmdW5jdGlvbiAoKSB7fSxcblx0XHRcdC8vIHZpZGVvU2Vla2luZzogdHJ1ZSwgLy9jaGFuZ2UgZ2xvYmFsbHkgaW4gZ2xvYmFsVmFyXG5cdFx0XHR2aWRlb0xvYWRlZDogZmFsc2UgLy9kb24ndCBlZGl0XG5cdFx0fSxcblx0XHRpMToge1xuXHRcdFx0dHlwZTogJ3F1aXonLFxuXHRcdFx0bmF2RWxlbWVudHM6IFsnc3RhbmRhcmQtbWVudScsICdzdWJtaXQnLCAnIW1lbnUnLCAnaG9tZSddLFxuXHRcdFx0bmV4dEFjdGlvbjogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRjb21wbGV0ZVNsaWRlKCk7XG5cdFx0XHRcdG5leHRTbGlkZSgpO1xuXHRcdFx0fSxcblx0XHRcdGJhY2tBY3Rpb246IHByZXZTbGlkZSxcblx0XHRcdG9uRW50ZXJBY3Rpb246IGZ1bmN0aW9uICgpIHt9LFxuXHRcdFx0YXVkaW86IHtcblx0XHRcdFx0b25FbnRlcjogJ21lZGlhL2F1ZGlvL3ZvL25vdGhpbmcubXAzJyxcblx0XHRcdFx0cG9zaXRpdmU6ICdtZWRpYS9hdWRpby92by9ub3RoaW5nLm1wMycsXG5cdFx0XHRcdG5lZ2F0aXZlMTogJ21lZGlhL2F1ZGlvL3ZvL25vdGhpbmcubXAzJyxcblx0XHRcdFx0bmVnYXRpdmUyOiAnbWVkaWEvYXVkaW8vdm8vbm90aGluZy5tcDMnLFxuXHRcdFx0XHRuZWdhdGl2ZUZpbmFsOiAnbWVkaWEvYXVkaW8vdm8vbm90aGluZy5tcDMnXG5cdFx0XHR9LFxuXHRcdFx0cXVpejoge1xuXHRcdFx0XHRyYWRpbzogZmFsc2UsIC8vZGVmYXVsdCBmYWxzZVxuXHRcdFx0XHRhbnN3ZXJzOiB7XG5cdFx0XHRcdFx0J2kxLWNvcnJlY3QxJzogMSxcblx0XHRcdFx0XHQnaTEtY29ycmVjdDInOiAxLFxuXHRcdFx0XHRcdCdpMS1jb3JyZWN0Myc6IDFcblx0XHRcdFx0fSxcblx0XHRcdFx0YXVkaW86IHt9LFxuXHRcdFx0XHR1c2VyQXR0ZW1wdHM6IDJcblx0XHRcdH0sXG5cdFx0XHRtb2RhbDoge1xuXHRcdFx0XHRwb3NpdGl2ZTogJ2kxLXBvc2l0aXZlJyxcblx0XHRcdFx0bmVnYXRpdmU6ICdpMS1uZWdhdGl2ZScsXG5cdFx0XHRcdC8vIG5lZ2F0aXZlMjogJ2kxLW5lZ2F0aXZlLTInLFxuXHRcdFx0XHRuZWdhdGl2ZUZpbmFsOiAnaTEtbmVnYXRpdmUtZmluYWwnXG5cdFx0XHR9LFxuXHRcdFx0aG90c3BvdDogeyBjbGlja0FueXdoZXJlOiB0cnVlIH1cblx0XHR9LFxuXHRcdGkyOiB7XG5cdFx0XHR0eXBlOiAncXVpeicsXG5cdFx0XHRuYXZFbGVtZW50czogWydzdGFuZGFyZC1tZW51JywgJ3N1Ym1pdCcsICchbWVudScsICdob21lJ10sXG5cdFx0XHRuZXh0QWN0aW9uOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGNvbXBsZXRlU2xpZGUoKTtcblx0XHRcdFx0bmV4dFNsaWRlKCk7XG5cdFx0XHR9LFxuXHRcdFx0YmFja0FjdGlvbjogcHJldlNsaWRlLFxuXHRcdFx0b25FbnRlckFjdGlvbjogZnVuY3Rpb24gKCkge30sXG5cdFx0XHRhdWRpbzoge1xuXHRcdFx0XHRvbkVudGVyOiAnbWVkaWEvYXVkaW8vdm8vbm90aGluZy5tcDMnLFxuXHRcdFx0XHRwb3NpdGl2ZTogJ21lZGlhL2F1ZGlvL3ZvL25vdGhpbmcubXAzJyxcblx0XHRcdFx0bmVnYXRpdmUxOiAnbWVkaWEvYXVkaW8vdm8vbm90aGluZy5tcDMnLFxuXHRcdFx0XHRuZWdhdGl2ZTI6ICdtZWRpYS9hdWRpby92by9ub3RoaW5nLm1wMycsXG5cdFx0XHRcdG5lZ2F0aXZlRmluYWw6ICdtZWRpYS9hdWRpby92by9ub3RoaW5nLm1wMydcblx0XHRcdH0sXG5cdFx0XHRxdWl6OiB7XG5cdFx0XHRcdHJhZGlvOiB0cnVlLCAvL2RlZmF1bHQgZmFsc2Vcblx0XHRcdFx0YW5zd2Vyczoge1xuXHRcdFx0XHRcdCdpMi1jb3JyZWN0JzogMVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRhdWRpbzoge30sXG5cdFx0XHRcdHVzZXJBdHRlbXB0czogMlxuXHRcdFx0fSxcblx0XHRcdG1vZGFsOiB7XG5cdFx0XHRcdHBvc2l0aXZlOiAnaTItcG9zaXRpdmUnLFxuXHRcdFx0XHRuZWdhdGl2ZTogJ2kyLW5lZ2F0aXZlJyxcblx0XHRcdFx0bmVnYXRpdmVGaW5hbDogJ2kyLW5lZ2F0aXZlLWZpbmFsJ1xuXHRcdFx0fSxcblx0XHRcdGhvdHNwb3Q6IHsgY2xpY2tBbnl3aGVyZTogdHJ1ZSB9XG5cdFx0fSxcblx0XHRpMzoge1xuXHRcdFx0dHlwZTogJ2RuZCcsXG5cdFx0XHRuYXZFbGVtZW50czogWydzdGFuZGFyZC1tZW51JywgJ3N1Ym1pdCcsICdyZXNldCcsICchbWVudScsICdob21lJ10sXG5cdFx0XHRuZXh0QWN0aW9uOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGNvbXBsZXRlU2xpZGUoKTtcblx0XHRcdFx0bmV4dFNsaWRlKCk7XG5cdFx0XHR9LFxuXHRcdFx0YmFja0FjdGlvbjogcHJldlNsaWRlLFxuXHRcdFx0b25FbnRlckFjdGlvbjogZnVuY3Rpb24gKCkge30sXG5cdFx0XHRvbkV4aXRBY3Rpb246IGZ1bmN0aW9uICgpIHt9LFxuXHRcdFx0ZG5kOiB7XG5cdFx0XHRcdHR5cGU6ICdkbmRfMScsXG5cdFx0XHRcdHF1aXo6IHtcblx0XHRcdFx0XHRpM19kcm9wOiBbJ2kzX2RyYWcyJ11cblx0XHRcdFx0fSxcblx0XHRcdFx0ZHJvcENvdW50ZXI6IHtcblx0XHRcdFx0XHRpM19kcm9wOiAxXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHVzZXJBdHRlbXB0czogMixcblx0XHRcdFx0YWN0aW9uczoge1xuXHRcdFx0XHRcdC8vb3B0aW9uYWxcblx0XHRcdFx0XHRpM19kcmFnMToge1xuXHRcdFx0XHRcdFx0Ly8gb25EcmFnU3RhcnQ6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdC8vIFx0Y29uc29sZS5sb2coJ29uRHJhZ1N0YXJ0Jyk7XG5cdFx0XHRcdFx0XHQvLyB9LFxuXHRcdFx0XHRcdFx0Ly8gb25EcmFnOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHQvLyBcdGNvbnNvbGUubG9nKCdvbkRyYWcnKTtcblx0XHRcdFx0XHRcdC8vIH0sXG5cdFx0XHRcdFx0XHQvLyBvbkRyYWdPdmVyOiB7XG5cdFx0XHRcdFx0XHQvLyBcdGkzX2Ryb3A6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdC8vIFx0XHRjb25zb2xlLmxvZygnb25EcmFnT3ZlcicpO1xuXHRcdFx0XHRcdFx0Ly8gXHR9XG5cdFx0XHRcdFx0XHQvLyB9LFxuXHRcdFx0XHRcdFx0Ly8gb25EcmFnRW5kOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHQvLyBcdGNvbnNvbGUubG9nKCdvbkRyYWdFbmQnKTtcblx0XHRcdFx0XHRcdC8vIH0sXG5cdFx0XHRcdFx0XHRvbkRyb3A6IHtcblx0XHRcdFx0XHRcdFx0aTNfZHJvcDogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0XHRcdCQoJyNpM19kcmFnMicpLmRyYWdnYWJsZSgnb3B0aW9uJywgJ2Rpc2FibGVkJywgZmFsc2UpO1xuXHRcdFx0XHRcdFx0XHRcdCQoJyNpM19kcmFnMScpLmRyYWdnYWJsZSgnb3B0aW9uJywgJ2Rpc2FibGVkJywgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRcdFx0JCgnI2kzX2RyYWcyJykucmVtb3ZlQ2xhc3MoJ2Ryb3BwZWQnKTtcblx0XHRcdFx0XHRcdFx0XHQkKCcjaTNfZHJhZzEnKS5hZGRDbGFzcygnZHJvcHBlZCcpO1xuXHRcdFx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKCdvbkRyb3AnLCB0aGlzKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0aTNfZHJhZzI6IHtcblx0XHRcdFx0XHRcdC8vIG9uRHJhZ1N0YXJ0OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHQvLyBcdGNvbnNvbGUubG9nKCdvbkRyYWdTdGFydCcpO1xuXHRcdFx0XHRcdFx0Ly8gfSxcblx0XHRcdFx0XHRcdC8vIG9uRHJhZzogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0Ly8gXHRjb25zb2xlLmxvZygnb25EcmFnJyk7XG5cdFx0XHRcdFx0XHQvLyB9LFxuXHRcdFx0XHRcdFx0Ly8gb25EcmFnT3Zlcjoge1xuXHRcdFx0XHRcdFx0Ly8gXHRpM19kcm9wOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHQvLyBcdFx0Y29uc29sZS5sb2coJ29uRHJhZ092ZXInKTtcblx0XHRcdFx0XHRcdC8vIFx0fVxuXHRcdFx0XHRcdFx0Ly8gfSxcblx0XHRcdFx0XHRcdC8vIG9uRHJhZ0VuZDogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0Ly8gXHRjb25zb2xlLmxvZygnb25EcmFnRW5kJyk7XG5cdFx0XHRcdFx0XHQvLyB9LFxuXHRcdFx0XHRcdFx0b25Ecm9wOiB7XG5cdFx0XHRcdFx0XHRcdGkzX2Ryb3A6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdFx0XHQkKCcjaTNfZHJhZzEnKS5kcmFnZ2FibGUoJ29wdGlvbicsICdkaXNhYmxlZCcsIGZhbHNlKTtcblx0XHRcdFx0XHRcdFx0XHQkKCcjaTNfZHJhZzInKS5kcmFnZ2FibGUoJ29wdGlvbicsICdkaXNhYmxlZCcsIHRydWUpO1xuXHRcdFx0XHRcdFx0XHRcdCQoJyNpM19kcmFnMScpLnJlbW92ZUNsYXNzKCdkcm9wcGVkJyk7XG5cdFx0XHRcdFx0XHRcdFx0JCgnI2kzX2RyYWcyJykuYWRkQ2xhc3MoJ2Ryb3BwZWQnKTtcblx0XHRcdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZygnb25Ecm9wJywgdGhpcyk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gc25hcHBpbmc6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0YXVkaW86IHtcblx0XHRcdFx0b25FbnRlcjogJ21lZGlhL2F1ZGlvL3ZvL25vdGhpbmcubXAzJyxcblx0XHRcdFx0cG9zaXRpdmU6ICdtZWRpYS9hdWRpby92by9ub3RoaW5nLm1wMycsXG5cdFx0XHRcdG5lZ2F0aXZlOiAnbWVkaWEvYXVkaW8vdm8vbm90aGluZy5tcDMnLFxuXHRcdFx0XHRuZWdhdGl2ZUZpbmFsOiAnbWVkaWEvYXVkaW8vdm8vbm90aGluZy5tcDMnXG5cdFx0XHR9LFxuXHRcdFx0bW9kYWw6IHtcblx0XHRcdFx0Ly8gbm9GZWVkYmFjazogdHJ1ZSwgLy9kZWZhdWx0cyB0byBmYWxzZSwgc2V0IHRvIHRydWUgaWYgeW91IGRvIG5vdCB3YW50IGZlZWRiYWNrc1xuXHRcdFx0XHRwb3NpdGl2ZTogJ2kzLXBvc2l0aXZlJyxcblx0XHRcdFx0bmVnYXRpdmU6ICdpMy1uZWdhdGl2ZScsXG5cdFx0XHRcdG5lZ2F0aXZlRmluYWw6ICdpMy1uZWdhdGl2ZS1maW5hbCdcblx0XHRcdH0sXG5cdFx0XHRob3RzcG90OiB7IGNsaWNrQW55d2hlcmU6IHRydWUgfVxuXHRcdH0sXG5cdFx0ZW5kOiB7XG5cdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRuYXZFbGVtZW50czogWydleGl0LXNsaWRlJywgJ2hvbWUnLCAnIWV4aXQnXSxcblx0XHRcdGJhY2tBY3Rpb246IHByZXZTbGlkZSxcblx0XHRcdG5leHRBY3Rpb246IGZ1bmN0aW9uICgpIHt9LFxuXHRcdFx0b25FbnRlckFjdGlvbjogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQvLyBEbyBub3QgY2hlY2sgZm9yIFwibG1zQ29ubmVjdGVkXCIsIGJlY2F1c2UgdGhhdCdzIGRvbmUgaW4gc2V0U2Nvcm1Db21wbGV0aW9uKCkgYW55d2F5cyBhbmQgQUlDQyB3b3VsZG4ndCB3b3JrIGFueW1vcmUuXG5cdFx0XHRcdHNldFNjb3JtQ29tcGxldGlvbigpO1xuXHRcdFx0fSxcblx0XHRcdGF1ZGlvOiB7XG5cdFx0XHRcdC8vIG9uRW50ZXI6IFwibWVkaWEvYXVkaW8vUmVzdWx0LzAubXAzXCIsXG5cdFx0XHR9LFxuXHRcdFx0aW5jbHVkZTogZmFsc2Vcblx0XHR9XG5cdH07XG59KTtcbiIsIi8vIEFkZCBcInNpLW1vZGFsLWNsb3NlclwiIGJ1dHRvbiB0byBhbGwgbW9kYWxzXG5cbnZhciAkc2lNb2RhbENsb3NlciA9ICQucGFyc2VIVE1MKFxuXHQnPGJ1dHRvbiBjbGFzcz1cInNpLW1vZGFsLWNsb3NlciBzaS1tb2RhbC1jbG9zZXJfX2pzXCI+PGltZyBjbGFzcz1cInNpLWltZy1zd2FwX19qcyBpbmplY3QtbWVcIiBzcmM9XCIuL21lZGlhL2ltZ3MvbmF2aWdhdGlvbi9jbGFzc2ljL2Nsb3NlLWNyb3NzLnN2Z1wiIGFsdD1cIlwiIC8+PC9idXR0b24+J1xuKTtcbiQoJy5zaS1tb2RhbF9fanMnKS5hcHBlbmQoJHNpTW9kYWxDbG9zZXIpO1xuIiwiLy8zZCBjYXJvdXNlbFxuZnVuY3Rpb24gZGlzYWJsZUJ1dHRvbnMoc2VsZWN0b3IpIHtcbiAgICAkKHNlbGVjdG9yKS5hZGRDbGFzcygnbm9FdmVudHMnKVxuICAgICQoc2VsZWN0b3IpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xufVxuXG5cbmZ1bmN0aW9uIGVuYWJsZUJ1dHRvbnMoc2VsZWN0b3IpIHtcbiAgICAkKHNlbGVjdG9yKS5yZW1vdmVDbGFzcygnbm9FdmVudHMnKVxuICAgICQoc2VsZWN0b3IpLnJlbW92ZUF0dHIoJ2Rpc2FibGVkJyk7XG59XG5cbmZ1bmN0aW9uIHRocmVlRE5hdmlnYXRpb25TZXR1cCgpIHtcbiAgICAkKCcucmlnaHRCdXR0b24nKS5vbignY2xpY2sudGhyZWVkY2Fyb3VzZWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRocmVlRE1vdmUoJ3JpZ2h0JylcbiAgICB9KVxuICAgICQoJy5sZWZ0QnV0dG9uJykub24oJ2NsaWNrLnRocmVlZGNhcm91c2VsJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB0aHJlZURNb3ZlKCdsZWZ0JylcbiAgICB9KVxuXG4gICAgLy90aHJlZURCdXR0b25zID0gcm90YXRpbmcgaXRlbXMvYnV0dG9uc1xuICAgIHRocmVlREJ1dHRvbnMgPSBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5pdGVtcyA9ICQoJy50aHJlZWRiJylcbiAgICBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5jbGlja3MgPSAwO1xuICAgIC8vTWFrZXMgb25seSB0aGUgZnJvbnQgYnV0dG9uIGNsaWNrYWJsZVxuICAgIGRpc2FibGVCdXR0b25zKHRocmVlREJ1dHRvbnMpXG4gICAgZW5hYmxlQnV0dG9ucyh0aHJlZURCdXR0b25zWzBdKVxuXG4gICAgLy8zZCBjc3Mgc2V0dXBcbiAgICBjc3NTZXR1cCgpXG59XG5cbmZ1bmN0aW9uIGNzc1NldHVwKCkge1xuICAgIC8vaHRtbCBpdGVtcyB0byBwb3NpdGlvblxuICAgIHZhciB0aHJlZURJdGVtcyA9ICQoJy50aHJlZWRiJylcblxuICAgIC8vbnVtYmVyIG9mIGl0ZW1zXG4gICAgdmFyIG51bWJlck9mSXRlbXMgPSB0aHJlZURJdGVtcy5sZW5ndGg7XG5cbiAgICAvL2Fzc2lnbiBmaXJzdCBwb3NpdGlvbnNcbiAgICB0aHJlZURJdGVtcy5lYWNoKGZ1bmN0aW9uIChpZHgsIGl0ZW0pIHtcbiAgICAgICAgJChpdGVtKS5hZGRDbGFzcygnaXRlbScgKyAoaWR4ICsgMSkgKyAnb2YnICsgbnVtYmVyT2ZJdGVtcyArICcgJyArIG51bWJlck9mSXRlbXMgKyAnaXRlbXMnKVxuICAgIH0pXG59XG5cblxuZnVuY3Rpb24gdGhyZWVETW92ZShyaWdodE9yTGVmdCkge1xuICAgIC8vdGhyZWVEQnV0dG9ucyA9IHJvdGF0aW5nIGl0ZW1zL2J1dHRvbnNcbiAgICB2YXIgdGhyZWVEQnV0dG9ucyA9IHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLml0ZW1zXG5cbiAgICAvL2NsaWNrcyBrZWVwcyB0cmFjayBvZiB0aGUgaXRlbXMncyBwb3NpdGlvblxuICAgIHZhciBjbGlja3MgPSBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5jbGlja3NcblxuICAgIC8vbnVtYmVyIG9mIGl0ZW1zXG4gICAgdmFyIG51bWJlck9mSXRlbXMgPSAkKCcudGhyZWVkYicpLmxlbmd0aDtcblxuICAgIC8vbnVtYmVyIGZvciBhIGxlZnQgdHVyblxuICAgIHZhciB0dXJuO1xuICAgIHN3aXRjaCAocmlnaHRPckxlZnQpIHtcbiAgICAgICAgY2FzZSBcInJpZ2h0XCI6XG4gICAgICAgICAgICB0dXJuID0gbnVtYmVyT2ZJdGVtcyAtIDE7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImxlZnRcIjpcbiAgICAgICAgICAgIHR1cm4gPSAxO1xuICAgIH1cbiAgICAvL2NoYW5nZSBwb3NpdGlvbnMgdG8gdGhlIGxlZnRcbiAgICB0aHJlZURCdXR0b25zLmVhY2goZnVuY3Rpb24gKGlkeCwgYnV0dG9uKSB7XG4gICAgICAgIHZhciBjdXJyZW50UG9zaXRpb24gPSAoKGlkeCArIGNsaWNrcykgJSBudW1iZXJPZkl0ZW1zKSArIDE7XG4gICAgICAgIHZhciBuZXh0UG9zaXRpb24gPSAoKGlkeCArIHR1cm4gKyBjbGlja3MpICUgbnVtYmVyT2ZJdGVtcykgKyAxXG5cbiAgICAgICAgJChidXR0b24pLnJlbW92ZUNsYXNzKCdpdGVtJyArIGN1cnJlbnRQb3NpdGlvbiArIFwib2ZcIiArIG51bWJlck9mSXRlbXMpXG4gICAgICAgICQoYnV0dG9uKS5hZGRDbGFzcygnaXRlbScgKyBuZXh0UG9zaXRpb24gKyBcIm9mXCIgKyBudW1iZXJPZkl0ZW1zKVxuXG4gICAgICAgIC8vTWFrZXMgb25seSB0aGUgbmV3IGZyb250IGJ1dHRvbiBjbGlja2FibGVcbiAgICAgICAgaWYgKG5leHRQb3NpdGlvbiA9PT0gMSkge1xuICAgICAgICAgICAgZGlzYWJsZUJ1dHRvbnModGhyZWVEQnV0dG9ucylcbiAgICAgICAgICAgIGRpc2FibGVCdXR0b25zKHRoaXMpXG4gICAgICAgICAgICBlbmFibGVCdXR0b25zKGJ1dHRvbilcbiAgICAgICAgfVxuICAgIH0pXG5cbiAgICAvL3ByZXZlbnQgZmFzdCBjbGlja2luZ1xuICAgIC8vIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIC8vICAgICBlbmFibGVCdXR0b25zKCcubGVmdEJ1dHRvbiAucmlnaHRCdXR0b24nKVxuICAgIC8vIH0sIDMwMClcblxuICAgIC8vdXBkYXRlIGN1cnJlbnQgcG9zaXRpb25cbiAgICBjbGlja3MgKz0gdHVyblxuICAgIHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLmNsaWNrcyA9IGNsaWNrc1xufSIsInZhciBzaUF1ZGlvID0ge31cblxuZnVuY3Rpb24gaW5pdEF1ZGlvKCl7XG5cdHNpQXVkaW9bXCJzZnhcIl0gPSB7fVxuXHRzaUF1ZGlvW1wic2Z4XCJdW1wiY2xpY2tcIl0gPSBuZXcgSG93bCh7XG5cdFx0c3JjOiBbXCJtZWRpYS9hdWRpby9zb3VuZHMvbW91c2VfY2xpY2subXAzXCJdLFxuXHRcdHZvbHVtZTogMC44LFxuXHR9KTtcblx0c2lBdWRpb1tcInNmeFwiXS53cm9uZyA9IG5ldyBIb3dsKHtcblx0XHRzcmM6IFtcIm1lZGlhL2F1ZGlvL3NvdW5kcy9uZWdhdGl2ZS5tcDNcIl0sXG5cdFx0dm9sdW1lOiAwLjUsXG5cdH0pO1xuXHRzaUF1ZGlvW1wic2Z4XCJdLnJpZ2h0ID0gbmV3IEhvd2woe1xuXHRcdHNyYzogW1wibWVkaWEvYXVkaW8vc291bmRzL3Bvc2l0aXZlLm1wM1wiXSxcblx0XHR2b2x1bWU6IDAuNSxcblx0fSk7XG5cdHNpQXVkaW9bXCJzZnhcIl0ubm90aGluZyA9IG5ldyBIb3dsKHtcblx0XHRzcmM6IFtcIm1lZGlhL2F1ZGlvL3NvdW5kcy9ub3RoaW5nLm1wM1wiXSxcblx0fSk7XG5cblx0Zm9yKGtleSBpbiBzbGlkZXMpe1xuXHRcdHNpQXVkaW9ba2V5XSA9IHt9XG5cdFx0aWYoc2xpZGVzW2tleV1bXCJhdWRpb1wiXSl7XG5cdFx0XHR2YXIgYXVkaW8gPSBzbGlkZXNba2V5XVtcImF1ZGlvXCJdO1xuXHRcdFx0Zm9yKHRyYWNrIGluIGF1ZGlvKXtcblx0XHRcdFx0c2lBdWRpb1trZXldW3RyYWNrXSA9IG5ldyBIb3dsKHtcblx0XHRcdFx0XHRzcmM6IGF1ZGlvW3RyYWNrXVxuXHRcdFx0XHR9KVxuXHRcdFx0fVxuXHRcdH1lbHNle1xuXHRcdFx0c2xpZGVzW2tleV1bXCJhdWRpb1wiXSA9IHt9XG5cdFx0fVxuXHR9XG59XG4iLCJmdW5jdGlvbiB2aWRlb0NoZWNrKCkge1xuXHR2YXIgdHlwZSA9IHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLnR5cGU7XG5cdGlmICh0eXBlID09ICd2aWRlbycpIHtcblx0XHR2YXIgdmlkZW8gPSBnbG9iYWxWYXIuJGN1clNsaWRlLmZpbmQoJ3ZpZGVvJylbMF07XG5cdFx0dmFyIHZpZGVvSUQgPSBnbG9iYWxWYXIuJGN1clNsaWRlLmZpbmQoJ3ZpZGVvJylbMF0uaWQ7XG5cblx0XHRpZiAoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0udmlkZW9Mb2FkZWQgPT0gZmFsc2UpIHtcblx0XHRcdHZpZGVvanModmlkZW9JRCwge1xuXHRcdFx0XHRsYW5ndWFnZTogJ2VuJyxcblx0XHRcdFx0YXV0b3BsYXk6IHRydWUsXG5cdFx0XHRcdGNvbnRyb2xCYXI6IHtcblx0XHRcdFx0XHR2b2x1bWVQYW5lbDoge1xuXHRcdFx0XHRcdFx0aW5saW5lOiB0cnVlXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRodG1sNToge1xuXHRcdFx0XHRcdC8vIGh0dHBzOi8vZG9jcy52aWRlb2pzLmNvbS9kb2NzL2d1aWRlcy90ZXh0LXRyYWNrcy5odG1sI2VtdWxhdGVkLXRleHQtdHJhY2tzXG5cdFx0XHRcdFx0Ly8gcHJldmVudHMgaVBob25lIGFuZCBzYWZhcmkgZnJvbSB1c2luZyB0aGVpciBvd24gc3VidGl0bGUgc3lzdGVtXG5cdFx0XHRcdFx0bmF0aXZlVGV4dFRyYWNrczogZmFsc2Vcblx0XHRcdFx0fSxcblx0XHRcdFx0cGx1Z2luczoge1xuXHRcdFx0XHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9rbW9za3dpYWsvdmlkZW9qcy1yZXNvbHV0aW9uLXN3aXRjaGVyI3BsdWdpbi1vcHRpb25zXG5cdFx0XHRcdFx0dmlkZW9Kc1Jlc29sdXRpb25Td2l0Y2hlcjoge1xuXHRcdFx0XHRcdFx0ZGVmYXVsdDogJ2hpZ2gnLFxuXHRcdFx0XHRcdFx0ZHluYW1pY0xhYmVsOiB0cnVlXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vY3RkMTUwMC92aWRlb2pzLWhvdGtleXMjb3B0aW9uc1xuXHRcdFx0XHRcdGhvdGtleXM6IHtcblx0XHRcdFx0XHRcdGVuYWJsZU51bWJlcnM6IGZhbHNlLFxuXHRcdFx0XHRcdFx0ZW5hYmxlTW9kaWZpZXJzRm9yTnVtYmVyczogZmFsc2UsXG5cdFx0XHRcdFx0XHRhbHdheXNDYXB0dXJlSG90a2V5czogdHJ1ZVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0c2Vla0J1dHRvbnM6IHtcblx0XHRcdFx0XHRcdGJhY2s6IDEwXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KS5yZWFkeShmdW5jdGlvbigpIHtcblx0XHRcdFx0Ly8gZGlzYWJsZSBwcm9ncmVzcyBjb250cm9sIChzZWVraW5nKSBpZiBnbG9iYWxWYXIgb3IgZGF0YS5qcyBpcyBjb25maWd1cmVkIHRoYXQgd2F5LlxuXHRcdFx0XHQvLyB2aWRlb1NlZWtpbmcgKGRhdGEuanMpIGlzIG92ZXJydWxpbmcgcHJvZ3Jlc3NDb250cm9sIChnbG9iYWxWYXIpLlxuXHRcdFx0XHQvLyBpZiBkZXZNb2RlIGlzIG9uLCBzZWVraW5nIGlzIGFsd2F5cyBlbmFibGVkLlxuXG5cdFx0XHRcdGlmICghZ2xvYmFsVmFyLmRldk1vZGUpIHtcblx0XHRcdFx0XHRpZiAoIXNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLnZpZGVvU2Vla2luZykge1xuXHRcdFx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdFx0XHRzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS52aWRlb1NlZWtpbmcgPT09IGZhbHNlIHx8XG5cdFx0XHRcdFx0XHRcdGdsb2JhbFZhci52aWRlby5wcm9ncmVzc0NvbnRyb2wgPT09IGZhbHNlXG5cdFx0XHRcdFx0XHQpIHtcblx0XHRcdFx0XHRcdFx0dmlkZW9qcyhcblx0XHRcdFx0XHRcdFx0XHR2aWRlb0lEXG5cdFx0XHRcdFx0XHRcdCkuY29udHJvbEJhci5wcm9ncmVzc0NvbnRyb2wuZGlzYWJsZSgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh2aWRlb2pzKHZpZGVvSUQpLnRleHRUcmFja3MoKS50cmFja3NfLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHQvLyBzdWJ0aXRsZS9jYXB0aW9ucyBzdHlsZSBpcyBzZXQgdXAgaGVyZSAoZGVmYXVsdHMgaW4gY29tbWVudHMpXG5cdFx0XHRcdFx0Ly8gTk9URTogdXNlICNYWFggaGV4IHN0eWxlIGZvciBjb2xvcnMhICN4eHggb3IgI3h4eHh4eCB3aWxsIG5vdCB3b3JrIVxuXHRcdFx0XHRcdHZhciBzdWJ0aXRsZVNldHRpbmdzID0ge1xuXHRcdFx0XHRcdFx0YmFja2dyb3VuZE9wYWNpdHk6ICcwLjUnLCAvL1x0XHRcdFx0XCIxXCJcblx0XHRcdFx0XHRcdGVkZ2VTdHlsZTogJ2Ryb3BzaGFkb3cnLCAvL1x0XHRcdFx0XHRub3Qgc2V0IChub25lLCBudWxsLCAwLCAnJyBkb2Vzbid0IHdvcmssIG9ubHkgbm90IHNldHRpbmcgaXQgYXQgYWxsIHdpbGwgc2V0IGl0IHRvICdub25lJylcblx0XHRcdFx0XHRcdGNvbG9yOiAnI0ZGRicsIC8vXHRcdFx0XHRcdFx0XHRcIiNGRkZcIlxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZENvbG9yOiAnIzAwMCcsIC8vXHRcdFx0XHRcdFwiIzAwMFwiXG5cdFx0XHRcdFx0XHR0ZXh0T3BhY2l0eTogJzEnLCAvL1x0XHRcdFx0XHRcdFwiMVwiXG5cdFx0XHRcdFx0XHR3aW5kb3dPcGFjaXR5OiAnMCcsIC8vXHRcdFx0XHRcdFx0XCIwXCJcblx0XHRcdFx0XHRcdGZvbnRGYW1pbHk6ICdwcm9wb3J0aW9uYWxTYW5zU2VyaWYnLCAvL1x0XHRcInByb3BvcnRpb25hbFNhbnNTZXJpZlwiXG5cdFx0XHRcdFx0XHR3aW5kb3dDb2xvcjogJyNGRkYnIC8vXHRcdFx0XHRcdFx0XCIjMDAwXCJcblx0XHRcdFx0XHRcdC8vZm9udFBlcmNlbnQ6IDEgLy9cdFx0XHRcdFx0XHRcdG5vdCBzZXQgKDEsIDEuMCwgMS4wMCwgZXRjIGRvZXNuJ3Qgd29yaywgb25seSBub3Qgc2V0dGluZyBpdCBhdCBhbGwgd2lsbCBzZXQgaXQgdG8gMTAwJSlcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdHZpZGVvanModmlkZW9JRCkudGV4dFRyYWNrU2V0dGluZ3Muc2V0VmFsdWVzKFxuXHRcdFx0XHRcdFx0c3VidGl0bGVTZXR0aW5nc1xuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0dmlkZW9qcyh2aWRlb0lEKS50ZXh0VHJhY2tTZXR0aW5ncy51cGRhdGVEaXNwbGF5KCk7XG5cblx0XHRcdFx0XHQvLyB0aGlzIHdvdWxkIHNob3cgdGhlIGZpcnN0IHN1YnRpdGxlIHRyYWNrXG5cdFx0XHRcdFx0Ly8gdmlkZW9qcyh2aWRlb0lEKS50ZXh0VHJhY2tzX1swXS5tb2RlID0gXCJzaG93aW5nXCJcblxuXHRcdFx0XHRcdC8vIHByaW50cyBvdXQgYSBuaWNlIHRhYmxlIG9mIHRoZSBjdXJyZW50IHN1YnRpdGxlIHN0eWxlIHNldHRpbmdzXG5cdFx0XHRcdFx0Ly8gY29uc29sZS50YWJsZSh2aWRlb2pzKHZpZGVvSUQpLnRleHRUcmFja1NldHRpbmdzLmdldFZhbHVlcygpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLnZpZGVvTG9hZGVkID0gdHJ1ZTtcblxuXHRcdFx0XHR2aWRlb2pzKHZpZGVvSUQpLnBsYXkoKTtcblxuXHRcdFx0XHQvLyBPbGQgd2F5IG9mIGRpc2FibGluZyBzZWVraW5nLlxuXHRcdFx0XHQvLyBPYnNvbGV0ZSBiZWNhdXNlIGl0J3Mgbm90IHJlbGlhYmxlIGluIElFLiBOZXcgbmF0aXZlIG1ldGhvZCBpcy5cblx0XHRcdFx0LyogaWYgKHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLnZpZGVvU2Vla2luZyA9PSBmYWxzZSkge1xuXHRcdFx0XHRcdHZhciBzdXBwb3NlZEN1cnJlbnRUaW1lID0gMDtcblx0XHRcdFx0XHR2aWRlby5hZGRFdmVudExpc3RlbmVyKCd0aW1ldXBkYXRlJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRpZiAoIXZpZGVvLnNlZWtpbmcpIHtcblx0XHRcdFx0XHRcdFx0c3VwcG9zZWRDdXJyZW50VGltZSA9IHZpZGVvLmN1cnJlbnRUaW1lO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdC8vYWxsb3dzIGJhY2t3YXJkcyBtb3ZlbWVudCBvZiB0cmFja2JhciBidXQgY2FuJ3QgbW92ZSB0cmFja2JhciBmb3J3YXJkXG5cdFx0XHRcdFx0dmlkZW8uYWRkRXZlbnRMaXN0ZW5lcignc2Vla2luZycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0aWYgKHZpZGVvLmN1cnJlbnRUaW1lID4gc3VwcG9zZWRDdXJyZW50VGltZSkge1xuXHRcdFx0XHRcdFx0XHR2aWRlby5jdXJyZW50VGltZSA9IHN1cHBvc2VkQ3VycmVudFRpbWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gKi9cblx0XHRcdH0pO1xuXHRcdFx0dmlkZW9qcyh2aWRlb0lEKS5vbignZW5kZWQnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0Z2xvYmFsVmFyLnZpZGVvU2VlbltnbG9iYWxWYXIuY3VyU2xpZGVdID0gdHJ1ZTtcblx0XHRcdFx0c2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0ubmV4dEFjdGlvbigpO1xuXHRcdFx0fSk7XG5cdFx0XHRpZihnbG9iYWxWYXIuZmFkZU5hdmlnYXRpb24pe1xuXHRcdFx0XHR2aWRlb2pzKHZpZGVvSUQpLm9uKFwidXNlcmFjdGl2ZVwiLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQkKFwiI3NpLW5hdi1jb250YWluZXJcIikucmVtb3ZlQ2xhc3MoXCJ2anMtZmFkZS1vdXRcIik7XG5cdFx0XHRcdH0pO1xuXHRcblx0XHRcdFx0dmlkZW9qcyh2aWRlb0lEKS5vbihcInVzZXJpbmFjdGl2ZVwiLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRpZiAoIXZpZGVvanModmlkZW9JRCkucGF1c2VkKCkpIHtcblx0XHRcdFx0XHQkKFwiI3NpLW5hdi1jb250YWluZXJcIikuYWRkQ2xhc3MoXCJ2anMtZmFkZS1vdXRcIik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dmlkZW9qcyh2aWRlb0lEKS5jdXJyZW50VGltZSgwKTtcblx0XHRcdHZpZGVvanModmlkZW9JRCkucGxheSgpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRpZiAoJCgnc2VjdGlvbicpLmZpbmQoJ3ZpZGVvJykubGVuZ3RoID4gMCkge1xuXHRcdFx0JCgnc2VjdGlvbicpXG5cdFx0XHRcdC5maW5kKCd2aWRlbycpWzBdXG5cdFx0XHRcdC5wYXVzZSgpO1xuXHRcdH1cblx0fVxufVxuIiwidmFyIHVubG9ja2VyU291bmQgPSBuZXcgSG93bCh7XG5cdHNyYzogWydtZWRpYS9hdWRpby9zb3VuZHMvbm90aGluZy5tcDMnXVxufSk7XG51bmxvY2tlclNvdW5kLm9uKCd1bmxvY2snLCBmdW5jdGlvbiAoKSB7XG5cdC8vIGNvbnNvbGUubG9nKCdIT1dMRVI6IEF1ZGlvIHVubG9ja2VkLicpO1xuXHRoaWRlUHJlbG9hZGVyKCk7XG5cdHVubG9ja2VyU291bmQucGxheSgpO1xufSk7XG51bmxvY2tlclNvdW5kLm9uKCdwbGF5JywgZnVuY3Rpb24gKCkge1xuXHQvLyBjb25zb2xlLmxvZygnSE9XTEVSOiBBdWRpbyBwbGF5aW5nLicpO1xuXHRoaWRlUHJlbG9hZGVyKCk7XG59KTtcbnVubG9ja2VyU291bmQucGxheSgpO1xuXG5mdW5jdGlvbiBpbml0UHJlbG9hZGVyKCkge1xuXHQvLyBTRVRVUCBUSEUgUFJFTE9BREVSXG5cdHdpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0JCgnI3ByZWxvYWRlcl90ZXh0XzEnKS5mYWRlT3V0KCdzbG93JywgZnVuY3Rpb24gKCkge1xuXHRcdFx0JCgnI3ByZWxvYWRlcl90ZXh0XzInKS5mYWRlSW4oJ3Nsb3cnKTtcblx0XHR9KTtcblx0XHQkKCcjUHJlbG9hZGVyJykub24oJ2NsaWNrIHRvdWNoJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHNpQXVkaW8uc2Z4LmNsaWNrLnBsYXkoKTtcblx0XHRcdGhpZGVQcmVsb2FkZXIoKTtcblx0XHR9KTtcblx0fTtcblx0Ly8gJCgnc2VjdGlvbi5wcmVzZW50JykuaGlkZSgpO1xufVxuXG5mdW5jdGlvbiBoaWRlUHJlbG9hZGVyKCkge1xuXHQkKCcjUHJlbG9hZGVyJykuZmFkZU91dCgnc2xvdycsIGZ1bmN0aW9uICgpIHtcblx0XHQkKCdzZWN0aW9uLnByZXNlbnQnKS5mYWRlSW4oJ3Nsb3cnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0gIT09IHVuZGVmaW5lZCAmJiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS50eXBlID09ICd2aWRlbycpIHtcblx0XHRcdFx0dmFyIHZpZGVvID0gZ2xvYmFsVmFyLiRjdXJTbGlkZS5maW5kKCd2aWRlbycpWzBdO1xuXHRcdFx0XHR2aWRlb2pzKHZpZGVvLnBsYXllcklkKS5wbGF5KCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xufVxuXG4vLyBpbml0UHJlbG9hZGVyKClcbiIsIi8vLy8vLy8vLy8vLypGZWF0dXJlOlBvc2l0aXZlIEZlZWRiYWNrIEZ1bmN0aW9uLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKipcbiAqXG4gKi9cbmZ1bmN0aW9uIGluaXRGZWVkYmFja3MoKSB7XG5cdHZhciBtb2RhbENvbnRhaW5lciA9ICQoJy5zaS1tb2RhbC1jb250YWluZXJfX2pzJyk7XG5cdHZhciBtb2RhbHMgPSAkKCcuc2ktbW9kYWxfX2pzJyk7XG5cdHZhciBtb2RhbENsb3NlcnMgPSAkKCcuc2ktbW9kYWwtY2xvc2VyX19qcycpO1xuXG5cdG1vZGFscy5vbignY2xpY2sucHJldmVudCcsIGZ1bmN0aW9uIChlKSB7XG5cdFx0dmFyIGhvdHNwb3QgPSBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5ob3RzcG90O1xuXHRcdHZhciBjbGlja0FueXdoZXJlSG90c3BvdCA9IGhvdHNwb3QgJiYgaG90c3BvdC5jbGlja0FueXdoZXJlO1xuXG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0aWYgKCFjbGlja0FueXdoZXJlSG90c3BvdCkgZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0fSk7XG5cdG1vZGFsQ29udGFpbmVyLm9uKCdjbGljay5jbG9zZScsIGZ1bmN0aW9uICgpIHtcblx0XHRtb2RhbENsb3NpbmdBY3Rpb25zKCk7XG5cdH0pO1xuXHRtb2RhbENsb3NlcnMuZWFjaChmdW5jdGlvbiAoaWR4LCBjbG9zZXIpIHtcblx0XHQkKGNsb3Nlcikub24oJ2NsaWNrLmNsb3NlJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0bW9kYWxDbG9zaW5nQWN0aW9ucygpO1xuXHRcdH0pO1xuXHR9KTtcbn1cblxuLyoqXG4gKlxuICovXG5mdW5jdGlvbiBhbnN3ZXJDb3JyZWN0KCkge1xuXHR2YXIgY3VycmVudE1vZGFsID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0ubW9kYWwucG9zaXRpdmU7XG5cdHZhciBtb2RhbENvbnRhaW5lciA9ICQoJy5zaS1tb2RhbC1jb250YWluZXJfX2pzJyk7XG5cdG1vZGFsQ29udGFpbmVyLmFkZENsYXNzKCdzaS1tb2RhbC1jb250YWluZXItb3BlbicpO1xuXHQkKCcjJyArIGN1cnJlbnRNb2RhbCkuYWRkQ2xhc3MoJ3NpLWN1cnJlbnQtbW9kYWwnKTtcblx0Z2xvYmFsVmFyLmN1cnJlbnRNb2RhbCA9IGN1cnJlbnRNb2RhbDtcblx0Z2xvYmFsVmFyLmN1cnJlbnRNb2RhbFR5cGUgPSAncG9zaXRpdmUnO1xuXHR2YXIgdHlwZSA9IHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLnR5cGU7XG5cdHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdW3R5cGVdLnRyeXMgPSAwO1xuXHRpZiAoc2lBdWRpb1tnbG9iYWxWYXIuY3VyU2xpZGVdLnBvc2l0aXZlKSB7XG5cdFx0c2lBdWRpby5zZngucmlnaHQub25jZSgnZW5kJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0c2lBdWRpb1tnbG9iYWxWYXIuY3VyU2xpZGVdLnBvc2l0aXZlLnBsYXkoKTtcblx0XHR9KTtcblx0XHRzaUF1ZGlvLnNmeC5yaWdodC5wbGF5KCk7XG5cdH0gZWxzZSB7XG5cdFx0c2lBdWRpby5zZngucmlnaHQucGxheSgpO1xuXHR9XG5cblx0aWYgKHR5cGVvZiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5vblN1Y2Nlc3NBY3Rpb24gPT09ICdmdW5jdGlvbicpIHtcblx0XHRzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5vblN1Y2Nlc3NBY3Rpb24oKTtcblx0fVxufVxuXG4vLy8vLy8vLy8vLy8qRmVhdHVyZTpOZWdhdGl2ZSBGZWVkYmFjayBGdW5jdGlvbnMvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qKlxuICpcbiAqL1xuZnVuY3Rpb24gYW5zd2VySW5jb3JyZWN0KCkge1xuXHR2YXIgdHlwZSA9IHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLnR5cGU7XG5cdHZhciB0cnlzID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bdHlwZV0udHJ5cztcblx0dmFyIGF0dGVtcHRzID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bdHlwZV0udXNlckF0dGVtcHRzO1xuXHR2YXIgbW9kYWxDb250YWluZXIgPSAkKCcuc2ktbW9kYWwtY29udGFpbmVyX19qcycpO1xuXHRpZiAoYXR0ZW1wdHMgPT09IDApIHtcblx0XHR0cnlzID0gMDtcblx0fSBlbHNlIHtcblx0XHR0cnlzKys7XG5cdH1cblx0c2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bdHlwZV0udHJ5cyA9IHRyeXM7XG5cblx0aWYgKHRyeXMgPCBhdHRlbXB0cyB8fCBhdHRlbXB0cyA9PT0gMCkge1xuXHRcdHZhciBjdXJyZW50TW9kYWw7XG5cdFx0aWYgKHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLm1vZGFsWyduZWdhdGl2ZScgKyB0cnlzXSkge1xuXHRcdFx0Y3VycmVudE1vZGFsID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0ubW9kYWxbJ25lZ2F0aXZlJyArIHRyeXNdO1xuXHRcdFx0Z2xvYmFsVmFyLmN1cnJlbnRNb2RhbCA9IGN1cnJlbnRNb2RhbDtcblx0XHRcdGdsb2JhbFZhci5jdXJyZW50TW9kYWxUeXBlID0gJ25lZ2F0aXZlJyArIHRyeXM7XG5cdFx0fSBlbHNlIGlmIChzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5tb2RhbC5uZWdhdGl2ZSkge1xuXHRcdFx0Y3VycmVudE1vZGFsID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0ubW9kYWwubmVnYXRpdmU7XG5cdFx0XHRnbG9iYWxWYXIuY3VycmVudE1vZGFsID0gY3VycmVudE1vZGFsO1xuXHRcdFx0Z2xvYmFsVmFyLmN1cnJlbnRNb2RhbFR5cGUgPSAnbmVnYXRpdmUnO1xuXHRcdH1cblxuXHRcdG1vZGFsQ29udGFpbmVyLmFkZENsYXNzKCdzaS1tb2RhbC1jb250YWluZXItb3BlbicpO1xuXHRcdCQoJyMnICsgY3VycmVudE1vZGFsKS5hZGRDbGFzcygnc2ktY3VycmVudC1tb2RhbCcpO1xuXHRcdGlmIChzaUF1ZGlvW2dsb2JhbFZhci5jdXJTbGlkZV1bJ25lZ2F0aXZlJyArIHRyeXNdKSB7XG5cdFx0XHRzaUF1ZGlvLnNmeC53cm9uZy5vbmNlKCdlbmQnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHNpQXVkaW9bZ2xvYmFsVmFyLmN1clNsaWRlXVsnbmVnYXRpdmUnICsgdHJ5c10ucGxheSgpO1xuXHRcdFx0fSk7XG5cdFx0XHRzaUF1ZGlvLnNmeC53cm9uZy5wbGF5KCk7XG5cdFx0fSBlbHNlIGlmIChzaUF1ZGlvW2dsb2JhbFZhci5jdXJTbGlkZV0ubmVnYXRpdmUpIHtcblx0XHRcdHNpQXVkaW8uc2Z4Lndyb25nLm9uY2UoJ2VuZCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0c2lBdWRpb1tnbG9iYWxWYXIuY3VyU2xpZGVdLm5lZ2F0aXZlLnBsYXkoKTtcblx0XHRcdH0pO1xuXHRcdFx0c2lBdWRpby5zZngud3JvbmcucGxheSgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzaUF1ZGlvLnNmeC53cm9uZy5wbGF5KCk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5vbkZhaWx1cmVBY3Rpb24xID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5vbkZhaWx1cmVBY3Rpb24xKCk7XG5cdFx0fVxuXHR9IGVsc2UgaWYgKGF0dGVtcHRzICE9PSAwICYmIHRyeXMgPT09IGF0dGVtcHRzKSB7XG5cdFx0Y3VycmVudE1vZGFsID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0ubW9kYWwubmVnYXRpdmVGaW5hbDtcblx0XHRnbG9iYWxWYXIuY3VycmVudE1vZGFsID0gY3VycmVudE1vZGFsO1xuXHRcdGdsb2JhbFZhci5jdXJyZW50TW9kYWxUeXBlID0gJ25lZ2F0aXZlRmluYWwnO1xuXG5cdFx0bW9kYWxDb250YWluZXIuYWRkQ2xhc3MoJ3NpLW1vZGFsLWNvbnRhaW5lci1vcGVuJyk7XG5cdFx0JCgnIycgKyBjdXJyZW50TW9kYWwpLmFkZENsYXNzKCdzaS1jdXJyZW50LW1vZGFsJyk7XG5cdFx0c2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bdHlwZV0udHJ5cyA9IDA7XG5cblx0XHRpZiAoc2lBdWRpb1tnbG9iYWxWYXIuY3VyU2xpZGVdLm5lZ2F0aXZlRmluYWwpIHtcblx0XHRcdHNpQXVkaW8uc2Z4Lndyb25nLm9uY2UoJ2VuZCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0c2lBdWRpb1tnbG9iYWxWYXIuY3VyU2xpZGVdLm5lZ2F0aXZlRmluYWwucGxheSgpO1xuXHRcdFx0fSk7XG5cdFx0XHRzaUF1ZGlvLnNmeC53cm9uZy5wbGF5KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHNpQXVkaW8uc2Z4Lndyb25nLnBsYXkoKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLm9uRmFpbHVyZUFjdGlvbjIgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLm9uRmFpbHVyZUFjdGlvbjIoKTtcblx0XHR9XG5cdH1cbn1cbi8vLy8vLy8vLy8vLypGZWF0dXJlOlBvc2l0aXZlIGFuZCBOZWdhdGl2ZSBGZWVkYmFjayBIYW5kbGVyICYgY2xvc2VGZWVkYmFja0FjdGlvbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyoqXG4gKiBAcGFyYW0gYm9sXG4gKi9cbmZ1bmN0aW9uIGhhbmRsZUFuc3dlcihib2wpIHtcblx0SG93bGVyLnN0b3AoKTtcblx0aWYgKHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLm1vZGFsLm5vRmVlZGJhY2spIHtcblx0XHR2YXIgaXNOZXh0QWN0aW9uID0gdHlwZW9mIHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLm5leHRBY3Rpb24gPT09ICdmdW5jdGlvbic7XG5cdFx0aWYgKGJvbCkge1xuXHRcdFx0aWYgKHR5cGVvZiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5vblN1Y2Nlc3NBY3Rpb24gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0c2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0ub25TdWNjZXNzQWN0aW9uKCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICh0eXBlb2Ygc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0ub25GYWlsdXJlQWN0aW9uMSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5vbkZhaWx1cmVBY3Rpb24xKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmIChpc05leHRBY3Rpb24pIHtcblx0XHRcdHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLm5leHRBY3Rpb24oKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bmV4dFNsaWRlKCk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdC8vICQoJyNzaS1uYXYtY29udGFpbmVyJykuYWRkQ2xhc3MoJ2ZlZWRiYWNrLW9wZW4nKTtcblx0XHRpZiAoYm9sID09IHRydWUpIHtcblx0XHRcdGFuc3dlckNvcnJlY3QoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YW5zd2VySW5jb3JyZWN0KCk7XG5cdFx0fVxuXHR9XG59XG5cbi8qKlxuICogQHBhcmFtIGl0ZW1cbiAqL1xuZnVuY3Rpb24gY2xvc2VGZWVkYmFja0FjdGlvbihpdGVtKSB7XG5cdHZhciBib2wgPSB0eXBlb2Ygc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0ubmV4dEFjdGlvbiA9PT0gJ2Z1bmN0aW9uJztcblx0c3dpdGNoIChpdGVtKSB7XG5cdFx0Y2FzZSAncG9zaXRpdmUnOlxuXHRcdFx0aWYgKGJvbCkge1xuXHRcdFx0XHRzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5uZXh0QWN0aW9uKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRuZXh0U2xpZGUoKTtcblx0XHRcdH1cblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ25lZ2F0aXZlJzpcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ2hvdHNwb3QnOlxuXHRcdFx0aGFuZGxlSG90c3BvdENsb3NlKCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlICduZWdhdGl2ZUZpbmFsJzpcblx0XHRcdGlmIChib2wpIHtcblx0XHRcdFx0c2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0ubmV4dEFjdGlvbigpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bmV4dFNsaWRlKCk7XG5cdFx0XHR9XG5cdFx0XHRicmVhaztcblx0XHRkZWZhdWx0OlxuXHRcdFx0YnJlYWs7XG5cdH1cbn1cblxuLyoqXG4gKlxuICovXG5mdW5jdGlvbiBGQktleWJvYXJkKCkge1xuXHQvLyB2YXIga2V5ID0gJChcIiNGQktleVwiKVxuXHR2YXIgRkJpdGVtcyA9ICQoJy5zaS1jdXJyZW50LW1vZGFsJykuY2hpbGRyZW4oKS5jaGlsZHJlbigpO1xuXHR2YXIgaWR4O1xuXHRpZiAoJChGQml0ZW1zWzBdKS5oYXNDbGFzcygnaWU5aGFjaycpKSB7XG5cdFx0aWR4ID0gMTtcblx0fSBlbHNlIHtcblx0XHRpZHggPSAwO1xuXHR9XG5cdCQoRkJpdGVtc1tpZHhdKS5mb2N1cygpO1xuXG5cdCQoJ2JvZHknKS5vbigna2V5ZG93bi5kcmFnJywgZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0c3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG5cdFx0XHRjYXNlIDk6IC8vY3ljbGVzIHRocm91Z2ggb25seSBGQiBlbGVtZW50cyB3aGlsZSBpdCBpcyBvcGVuXG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdGlmIChpZHggPCBGQml0ZW1zLmxlbmd0aCAtIDEpIHtcblx0XHRcdFx0XHRpZHggKz0gMTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRpZHggPSAwO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCQoRkJpdGVtc1tpZHhdKS5mb2N1cygpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgMjc6IC8vIGFsbG93cyB1c2VyIHRvIHByZXNzIGVzY2FwZSBrZXkgdG8gcmV0dXJuIHRvIG5vcm1hbCBhbmQgcGxhY2VzIGZvY3VzIG9uIHByZXZpb3VzIGVsZW1lbnRcblx0XHRcdFx0JCgnLnNpLWN1cnJlbnQtbW9kYWwnKS50cmlnZ2VyKCdjbGljaycpO1xuXHRcdFx0XHQkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIDEzOiAvLyBhbGxvd3MgdXNlciB0byBwcmVzcyBlbnRlciBrZXkgdG8gcmV0dXJuIHRvIG5vcm1hbCBhbmQgcmVtb3ZlcyBhbGwgZm9jdXMgKHNvIHRoYXQgc3VibWl0IGtleSBpcyBub3QgY2xpY2tlZCB3aGVuIEZCIGNsb3Nlcylcblx0XHRcdFx0JCgnLnNpLWN1cnJlbnQtbW9kYWwnKS50cmlnZ2VyKCdjbGljaycpO1xuXHRcdFx0XHQkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH0pO1xufVxuXG4vKipcbiAqXG4gKi9cbmZ1bmN0aW9uIGhhbmRsZUhvdHNwb3RDbG9zZSgpIHtcblx0dmFyIHNldHRpbmdzID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0uaG90c3BvdDtcblx0dmFyICRob3RzcG90cyA9ICQoJyMnICsgZ2xvYmFsVmFyLmN1clNsaWRlKS5maW5kKCcgLmhvdHNwb3QtYnV0dG9uX19qcycpO1xuXHR2YXIgaSA9IGdsb2JhbFZhci5ob3RzcG90SWR4O1xuXHR2YXIgaG90c3BvdCA9ICRob3RzcG90c1tpXTtcblx0dmFyIG1vZGFsID0gJyMnICsgZ2xvYmFsVmFyLmN1cnJlbnRNb2RhbDtcblx0dmFyIG1haW5Pbk1vZGFsQ2xvc2UgPSBzZXR0aW5ncy5vbk1vZGFsQ2xvc2U7XG5cdHZhciBpbmR2T25Nb2RhbENsb3NlID0gc2V0dGluZ3MuaW5kdltpICsgMV0gJiYgc2V0dGluZ3MuaW5kdltpICsgMV0ub25Nb2RhbENsb3NlO1xuXHR2YXIgbW9kYWxXYXJuID0gXCJ5b3UgaGF2ZW4ndCBjcmVhdGVkIGEgbW9kYWwgZm9yIHRoaXMgaG90c3BvdFwiO1xuXHRzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5ob3RzcG90LmNsaWNrQ2hlY2tlcltpICsgMV0uc2VlbiA9IHRydWU7XG5cdG1haW5Pbk1vZGFsQ2xvc2UgJiYgbWFpbk9uTW9kYWxDbG9zZShob3RzcG90LCBtb2RhbCB8fCBtb2RhbFdhcm4pO1xuXHRpbmR2T25Nb2RhbENsb3NlICYmIGluZHZPbk1vZGFsQ2xvc2UoaG90c3BvdCwgbW9kYWwgfHwgbW9kYWxXYXJuKTtcblxuXHR2YXIgcmVzdWx0ID0gdHJ1ZTtcblxuXHRmb3IgKHZhciBpdGVtIGluIHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLmhvdHNwb3QuY2xpY2tDaGVja2VyKSB7XG5cdFx0aWYgKFxuXHRcdFx0c2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0uaG90c3BvdC5jbGlja0NoZWNrZXJbaXRlbV0uc2VlbiA9PT0gZmFsc2UgJiZcblx0XHRcdCFzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5ob3RzcG90LmNsaWNrQ2hlY2tlcltpdGVtXS5oYXNDb3JyZWN0Q2xhc3Ncblx0XHQpIHtcblx0XHRcdHJlc3VsdCA9IGZhbHNlO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cblx0aWYgKHJlc3VsdCkge1xuXHRcdGlmIChzZXR0aW5ncy5jdXN0b21Db21wbGV0ZUFjdGlvbikge1xuXHRcdFx0c2V0dGluZ3MuY3VzdG9tQ29tcGxldGVBY3Rpb24oKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0ubmV4dEFjdGlvbigpO1xuXHRcdH1cblx0fVxuXHQvKipcblx0ICogQHBhcmFtIG5leHRIb3RzcG90XG5cdCAqIEBwYXJhbSBuZXh0SG90c3BvdFNldHRpbmdzXG5cdCAqL1xuXHRmdW5jdGlvbiB1bmxvY2tOZXh0SG90c3BvdChuZXh0SG90c3BvdCwgbmV4dEhvdHNwb3RTZXR0aW5ncykge1xuXHRcdHZhciBtYWluT25VbmxvY2sgPSBzZXR0aW5ncy5vblVubG9jaztcblx0XHR2YXIgaW5kdk9uVW5sb2NrID0gbmV4dEhvdHNwb3RTZXR0aW5ncyAmJiBuZXh0SG90c3BvdFNldHRpbmdzLm9uVW5sb2NrO1xuXG5cdFx0JGhvdHNwb3RzLnJlbW92ZUNsYXNzKHNldHRpbmdzLmFjdGl2ZUNsYXNzKTtcblxuXHRcdHVubG9jaygkKG5leHRIb3RzcG90KSk7XG5cdFx0JChuZXh0SG90c3BvdCkuYWRkQ2xhc3Moc2V0dGluZ3MuYWN0aXZlQ2xhc3MpO1xuXG5cdFx0bWFpbk9uVW5sb2NrICYmIG1haW5PblVubG9jayhuZXh0SG90c3BvdCk7XG5cdFx0aW5kdk9uVW5sb2NrICYmIGluZHZPblVubG9jayhuZXh0SG90c3BvdCk7XG5cdH1cblxuXHRpZiAoc2V0dGluZ3MubGluZWFyID09PSB0cnVlKSB1bmxvY2tOZXh0SG90c3BvdCgkaG90c3BvdHNbaSArIDFdLCBzZXR0aW5ncy5pbmR2W2kgKyAyXSk7XG59XG5cbi8qKlxuICogQHBhcmFtIGNvbnRhaW5lclxuICovXG5mdW5jdGlvbiBtb2RhbENsb3NpbmdBY3Rpb25zKCkge1xuXHRIb3dsZXIuc3RvcCgpO1xuXHRpZiAoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0udHlwZSA9PT0gJ2hvdHNwb3QnICYmIHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLmhvdHNwb3QuaG92ZXIpIHtcblx0XHRjb25zb2xlLmxvZygnaG92ZXItaG90c3BvdCwgbm8gY2xpY2sgYXVkaW8nKTtcblx0fSBlbHNlIHtcblx0XHRzaUF1ZGlvLnNmeC5jbGljay5wbGF5KCk7XG5cdH1cblxuXHRzd2l0Y2ggKHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLnR5cGUpIHtcblx0XHRjYXNlICdkbmQnOlxuXHRcdFx0cmVzZXREbkQoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0ucmV2ZXJ0VGltZSwgZ2xvYmFsVmFyLmRuZEFuc3dlcnMpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnc29ydCc6XG5cdFx0XHRyZXNldFNvcnQoKTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ3F1aXonOlxuXHRcdFx0cmVzZXRRdWl6KCk7XG5cdFx0XHRicmVhaztcblx0XHQvLyBjYXNlICdob3RzcG90Jzpcblx0XHQvLyBcdHJlc2V0SG90c3BvdCgpO1xuXHRcdC8vIFx0YnJlYWs7XG5cdH1cblxuXHRjbG9zZUZlZWRiYWNrQWN0aW9uKGdsb2JhbFZhci5jdXJyZW50TW9kYWxUeXBlKTtcblx0JCgnYm9keScpLm9mZigna2V5ZG93bi5kcmFnJyk7XG5cblx0JCgnLnNpLW1vZGFsLWNvbnRhaW5lcl9fanMnKS5yZW1vdmVDbGFzcygnc2ktbW9kYWwtY29udGFpbmVyLW9wZW4gc2ktaG92ZXItaG90c3BvdCcpO1xuXHQvLyBjb25zb2xlLmxvZygkKCcjJyArIGdsb2JhbFZhci5jdXJyZW50TW9kYWwpKTtcblx0JCgnIycgKyBnbG9iYWxWYXIuY3VycmVudE1vZGFsKS5yZW1vdmVDbGFzcygnc2ktY3VycmVudC1tb2RhbCcpO1xufVxuXG4vKipcbiAqIEBwYXJhbSBpZFxuICovXG5mdW5jdGlvbiBzaW1wbGVNb2RhbE9wZW4oaWQpIHtcblx0aWYgKHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLm1vZGFsW2lkXSkge1xuXHRcdHZhciBjdXJyZW50TW9kYWwgPSBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5tb2RhbFtpZF07XG5cdFx0aWYgKHNpQXVkaW9bZ2xvYmFsVmFyLmN1clNsaWRlXVtpZF0pIHtcblx0XHRcdHNpQXVkaW9bZ2xvYmFsVmFyLmN1clNsaWRlXVtpZF0ucGxheSgpO1xuXHRcdH1cblx0XHQkKCcuc2ktbW9kYWwtY29udGFpbmVyX19qcycpLmFkZENsYXNzKCdzaS1tb2RhbC1jb250YWluZXItb3BlbicpO1xuXHRcdCQoJyMnICsgY3VycmVudE1vZGFsKS5hZGRDbGFzcygnc2ktY3VycmVudC1tb2RhbCcpO1xuXHRcdGdsb2JhbFZhci5jdXJyZW50TW9kYWwgPSBjdXJyZW50TW9kYWw7XG5cdH1cbn1cblxuLyoqXG4gKlxuICovXG5mdW5jdGlvbiBzaW1wbGVNb2RhbENsb3NlKCkge1xuXHRIb3dsZXIuc3RvcCgpO1xuXHQkKCcuc2ktbW9kYWwtY29udGFpbmVyX19qcycpLnJlbW92ZUNsYXNzKCdzaS1tb2RhbC1jb250YWluZXItb3BlbicpO1xuXHQkKCcjJyArIGdsb2JhbFZhci5jdXJyZW50TW9kYWwpLnJlbW92ZUNsYXNzKCdzaS1jdXJyZW50LW1vZGFsJyk7XG59XG4iLCIvLy8vLy8vLy8vLy8qRmVhdHVyZTpEcmFnIGFuZCBEcm9wLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG52YXIgZG5kUmVzZXRPYmplY3QgPSB7fVxuZnVuY3Rpb24gcmVzZXREbkQocmV2ZXJ0VGltZSwgZG5kQW5zd2Vycykge1xuICAgIGdsb2JhbFZhci4kY3VyU2xpZGUuZmluZCgnLmRyYWdnYWJsZScpLmVhY2goZnVuY3Rpb24gKCkge1xuXHRcdCQodGhpcykuZHJhZ2dhYmxlKCdvcHRpb24nLCAnZGlzYWJsZWQnLCBmYWxzZSk7XG5cdFx0JCh0aGlzKS5yZW1vdmVDbGFzcygnZHJvcHBlZCcpO1xuICAgICAgICB2YXIgT0dQb3MgPSAkKHRoaXMpLmRhdGEoJ09HUG9zJyk7XG4gICAgICAgICQodGhpcykuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgdG9wOiBPR1Bvcy50b3AsXG4gICAgICAgICAgICAgICAgbGVmdDogT0dQb3MubGVmdFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJldmVydFRpbWVcbiAgICAgICAgKTtcbiAgICAgICAgJCh0aGlzKS5kYXRhKCdkcm9wSWQnLCAnJyk7XG4gICAgICAgICQodGhpcykuZGF0YSgnY3VyUG9zJywge1xuICAgICAgICAgICAgdG9wOiBPR1Bvcy50b3AsXG4gICAgICAgICAgICBsZWZ0OiBPR1Bvcy5sZWZ0XG4gICAgICAgIH0pO1xuICAgICAgICAkKHRoaXMpLmRhdGEoJ3ByZXZQb3MnLCB7XG4gICAgICAgICAgICB0b3A6IE9HUG9zLnRvcCxcbiAgICAgICAgICAgIGxlZnQ6IE9HUG9zLmxlZnRcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgZ2xvYmFsVmFyLiRjdXJTbGlkZS5maW5kKCcuZHJvcHBhYmxlJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICQodGhpcykuZGF0YSgnZHJhZ0VsZW1lbnRzJywgW10pO1xuICAgICAgICAkKHRoaXMpLmRhdGEoJ2Ryb3BDb3VudGVyJywgc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ2RuZCddWydkcm9wQ291bnRlciddW3RoaXMuaWRdKTtcbiAgICB9KTtcbiAgICAvL3Jlc2V0IGRuZEFuc3dlcnNlY3RcbiAgICBmb3IgKGtleSBpbiBkbmRBbnN3ZXJzKSB7XG4gICAgICAgIGRuZEFuc3dlcnNba2V5XSA9IFtdO1xuICAgIH1cblxuICAgIGlmIChzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5kbmQudHlwZSA9PSAnZG5kXzInKSB7XG4gICAgICAgIGdsb2JhbFZhci4kY3VyU2xpZGUuZmluZCgnLmRyYWdnYWJsZScpLmZhZGVJbigpO1xuICAgICAgICBnbG9iYWxWYXIuJGN1clNsaWRlLmZpbmQoJy5kcmFnZ2FibGUnKS5yZW1vdmVDbGFzcygnc2hyaW5rJyk7XG4gICAgfVxuXG4gICAgZ2xvYmFsVmFyLmRuZEFuc3dlcnMgPSBkbmRBbnN3ZXJzO1xuICAgIHJldHVybiBkbmRBbnN3ZXJzO1xufVxuXG5mdW5jdGlvbiBkbmRGdW5jdGlvbnMoKSB7XG4gICAgdmFyIGN1ckRyYWc7XG4gICAgdmFyIGN1ckRyb3A7XG4gICAgdmFyICRkcmFnRWxlbWVudHMgPSBnbG9iYWxWYXIuJGN1clNsaWRlLmZpbmQoJy5kcmFnZ2FibGUnKTtcbiAgICB2YXIgJGRyb3BFbGVtZW50cyA9IGdsb2JhbFZhci4kY3VyU2xpZGUuZmluZCgnLmRyb3BwYWJsZScpO1xuICAgIHZhciByZXZlcnRUaW1lO1xuICAgIHZhciBzbmFwcGluZztcbiAgICB2YXIgZG5kQW5zd2VycyA9IGdlbmVyYXRlQW5zd2VyVGVtcGxhdGUoKTtcblxuICAgIC8vIGFzc2lnbiBjdXN0b20gb3IgZGVmYXVsdCB2YWx1ZXMgdG8gcmV2ZXJ0IGFuZCBzbmFwcGluZ1xuICAgIGlmIChzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXVsnZG5kJ11bJ3JldmVydFRpbWUnXSkge1xuICAgICAgICByZXZlcnRUaW1lID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ2RuZCddWydyZXZlcnRUaW1lJ107XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV2ZXJ0VGltZSA9IDUwMDtcbiAgICB9XG4gICAgaWYgKHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdWydkbmQnXVsnc25hcHBpbmcnXSkge1xuICAgICAgICBzbmFwcGluZyA9IHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdWydkbmQnXVsnc25hcHBpbmcnXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzbmFwcGluZyA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8gRmlyc3QgZW50cmFuY2Ugc2V0dXAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICBpZiAoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0udmlzaXRlZCA9PSBmYWxzZSkge1xuICAgICAgICAvLyBkcmFnZ2FibGUgc2V0dXA6IHNldCBwb3NpdGlvbiBkYXRhLCBhdHRhY2hlcyBkbmQgZXZlbnQgZnVuY3Rpb25zLCBhZGQga2V5Ym9hcmQgYWNjZXNzXG4gICAgICAgICRkcmFnRWxlbWVudHMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZXZlbnRzID0gZG5kQWN0aW9ucyh0aGlzLmlkKTtcbiAgICAgICAgICAgIHZhciBsZWZ0SW5pdCA9XG4gICAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICAgICAocGFyc2VJbnQoJCh0aGlzKS5jc3MoJ2xlZnQnKSkgL1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnBhcmVudCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAud2lkdGgoKSkgKlxuICAgICAgICAgICAgICAgICAgICAxMDBcbiAgICAgICAgICAgICAgICApLnRvU3RyaW5nKCkgKyAnJSc7XG4gICAgICAgICAgICB2YXIgdG9wSW5pdCA9XG4gICAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICAgICAocGFyc2VJbnQoJCh0aGlzKS5jc3MoJ3RvcCcpKSAvXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpXG4gICAgICAgICAgICAgICAgICAgICAgICAucGFyZW50KClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5oZWlnaHQoKSkgKlxuICAgICAgICAgICAgICAgICAgICAxMDBcbiAgICAgICAgICAgICAgICApLnRvU3RyaW5nKCkgKyAnJSc7XG4gICAgICAgICAgICAkKHRoaXMpLmRhdGEoe1xuICAgICAgICAgICAgICAgIE9HUG9zOiB7XG4gICAgICAgICAgICAgICAgICAgIHRvcDogdG9wSW5pdCxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogbGVmdEluaXRcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGN1clBvczoge1xuICAgICAgICAgICAgICAgICAgICB0b3A6IHRvcEluaXQsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IGxlZnRJbml0XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwcmV2UG9zOiB7XG4gICAgICAgICAgICAgICAgICAgIHRvcDogdG9wSW5pdCxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogbGVmdEluaXRcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRyb3BJRDogJycsXG4gICAgICAgICAgICAgICAgZXZlbnRzOiBldmVudHMsXG4gICAgICAgICAgICAgICAgcmV2ZXJ0VGltZTogcmV2ZXJ0VGltZSxcbiAgICAgICAgICAgICAgICBzbmFwcGluZzogc25hcHBpbmdcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBtYWtlcyBkbmQga2V5Ym9hcmQgYWNjZXNzaWJsZVxuICAgICAgICAgICAgJCh0aGlzKS5hdHRyKCd0YWJpbmRleCcsICcwJyk7XG4gICAgICAgICAgICBrZXlCb2FyZEFjY2Vzcyh0aGlzKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gZHJvcHBhYmxlIHNldHVwOiBkcmFnIGFycmF5LCBkcm9wIGNvdW50ZXIsIGtleWJvYXJkIGFjY2Vzc1xuICAgICAgICAkZHJvcEVsZW1lbnRzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCh0aGlzKS5kYXRhKHtcbiAgICAgICAgICAgICAgICBkcmFnRWxlbWVudHM6IFtdLFxuICAgICAgICAgICAgICAgIGRyb3BDb3VudGVyOiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXVsnZG5kJ11bJ2Ryb3BDb3VudGVyJ11bdGhpcy5pZF1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBuZWNlc3NhcnkgdG8gbWFrZSBkbmQga2V5Ym9hcmQgYWNjZXNzaWJsZVxuICAgICAgICAgICAgJCh0aGlzKS5hdHRyKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgICB9KTtcblxuICAgICAgICBkbmRSZXNldE9iamVjdFtnbG9iYWxWYXIuY3VyU2xpZGVdID0ge1xuICAgICAgICAgICAgdGltZTogcmV2ZXJ0VGltZSxcbiAgICAgICAgICAgIGFuc3dlcnM6IGRuZEFuc3dlcnNcbiAgICAgICAgfVxuICAgICAgICAvLyBTdWJzZXF1ZW50IFZpc2l0cy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgfSBlbHNlIHtcbiAgICAgICAgJGRyYWdFbGVtZW50cy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQodGhpcykuZHJhZ2dhYmxlKCdkaXNhYmxlJyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkZHJvcEVsZW1lbnRzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCh0aGlzKS5kcm9wcGFibGUoJ2Rpc2FibGUnKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJlc2V0RG5EKHJldmVydFRpbWUsIGRuZEFuc3dlcnMpO1xuICAgIH1cbiAgICAvLyBlbmQgc2V0dXBcblxuICAgIC8vIGRyYWdnYWJsZSBvcHRpb25zOiBhZGQgYW55IGFkZGl0aW9uYWwgbmVlZGVkIGtleXMgZnJvbSBqUXVlcnkgZHJhZ2dhYmxlIEFQSSBoZXJlXG4gICAgJGRyYWdFbGVtZW50cy5kcmFnZ2FibGUoe1xuICAgICAgICBzdGFydDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xuICAgICAgICAgICAgY3VyRHJhZyA9IHVpLmhlbHBlclswXTtcbiAgICAgICAgICAgICQoY3VyRHJhZylcbiAgICAgICAgICAgICAgICAuZGF0YSgnZXZlbnRzJylbJ29uRHJhZ1N0YXJ0J10oKTtcbiAgICAgICAgfSxcbiAgICAgICAgZHJhZzogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xuICAgICAgICAgICAgZHJhZ2dpbmcoY3VyRHJhZyk7XG4gICAgICAgIH0sXG4gICAgICAgIHJldmVydDogJ2ludmFsaWQnLFxuICAgICAgICBzdGFjazogJy5kcmFnZ2FibGUnLFxuICAgICAgICByZXZlcnREdXJhdGlvbjogcmV2ZXJ0VGltZSxcbiAgICAgICAgc3RvcDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xuICAgICAgICAgICAgZHJhZ1N0b3AoY3VyRHJhZyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIGRyb3BwYWJsZSBvcHRpb25zOiBhZGQgYW55IGFkZGl0aW9uYWwgbmVlZGVkIGtleXMgZnJvbSBqUXVlcnkgZHJvcHBhYmxlIEFQSSBoZXJlXG4gICAgJGRyb3BFbGVtZW50cy5kcm9wcGFibGUoe1xuICAgICAgICBhY2NlcHQ6ICcuZHJhZ2dhYmxlJyxcbiAgICAgICAgb3ZlcjogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xuICAgICAgICAgICAgY3VyRHJvcCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgICAgIGlmICgkKGN1ckRyYWcpLmRhdGEoJ2V2ZW50cycpWydvbkRyYWdPdmVyJ11bY3VyRHJvcC5pZF0pIHtcbiAgICAgICAgICAgICAgICAkKGN1ckRyYWcpXG4gICAgICAgICAgICAgICAgICAgIC5kYXRhKCdldmVudHMnKVsnb25EcmFnT3ZlciddW2N1ckRyb3AuaWRdKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGRyb3A6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcbiAgICAgICAgICAgIGRyb3BwZWQoY3VyRHJvcCwgY3VyRHJhZyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIGFjdGl2YXRlIGJvdGhcbiAgICAkZHJhZ0VsZW1lbnRzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAkKHRoaXMpLmRyYWdnYWJsZSgnZW5hYmxlJyk7XG4gICAgfSk7XG5cbiAgICAkZHJvcEVsZW1lbnRzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAkKHRoaXMpLmRyb3BwYWJsZSgnZW5hYmxlJyk7XG4gICAgfSk7XG59IC8vZW5kIGRuZEZ1bmN0aW9uc1xuXG4vLyBEbmQgRXZlbnQgRnVuY3Rpb25zLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLyBydW5zIHdoaWxlIGRyYWdnaW5nIGVsZW1lbnQ7XG5mdW5jdGlvbiBkcmFnZ2luZyhkcmFnVGFyZ2V0KSB7XG4gICAgJChkcmFnVGFyZ2V0KVxuICAgICAgICAuZGF0YSgnZXZlbnRzJylbJ29uRHJhZyddKCk7XG59XG5cbi8vIHJ1bnMgd2hlbiBkcmFnIGVsZW1lbnQgaXMgcmVsZWFzZWQgb3V0c2lkZSBvZiB2YWxpZCBkcm9wIGFyZWE7XG5mdW5jdGlvbiBkcmFnU3RvcChkcmFnVGFyZ2V0KSB7XG4gICAgJChkcmFnVGFyZ2V0KVxuICAgICAgICAuZGF0YSgnZXZlbnRzJylbJ29uRHJhZ0VuZCddKCk7XG59XG5cbi8vSW1wb3J0YW50IEZ1bmN0aW9uISBSdW5zIG9uIGRyb3AgaW50byB2YWxpZCBkcm9wIGFyZWEvLy9cbmZ1bmN0aW9uIGRyb3BwZWQoZHJvcFRhcmdldCwgZHJhZ1RhcmdldCkge1xuICAgIHZhciBwb3MgPSB7XG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgbGVmdDogMFxuICAgIH07XG4gICAgdmFyIHNuYXBwaW5nID0gJChkcmFnVGFyZ2V0KS5kYXRhKCdzbmFwcGluZycpO1xuICAgIHZhciBzcGFjZUF2YWlsYWJsZSA9ICQoZHJvcFRhcmdldCkuZGF0YSgnZHJhZ0VsZW1lbnRzJykubGVuZ3RoIDwgJChkcm9wVGFyZ2V0KS5kYXRhKCdkcm9wQ291bnRlcicpO1xuXG4gICAgLy9nZXQgcG9zaXRpb25pbmdcbiAgICBpZiAoc25hcHBpbmcpIHtcbiAgICAgICAgcG9zLnRvcCA9XG4gICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgKHBhcnNlSW50KCQoZHJvcFRhcmdldCkuY3NzKCd0b3AnKSkgL1xuICAgICAgICAgICAgICAgICAgICAkKGRyb3BUYXJnZXQpXG4gICAgICAgICAgICAgICAgICAgIC5wYXJlbnQoKVxuICAgICAgICAgICAgICAgICAgICAuaGVpZ2h0KCkpICpcbiAgICAgICAgICAgICAgICAxMDBcbiAgICAgICAgICAgICkudG9TdHJpbmcoKSArICclJztcbiAgICAgICAgcG9zLmxlZnQgPVxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIChwYXJzZUludCgkKGRyb3BUYXJnZXQpLmNzcygnbGVmdCcpKSAvXG4gICAgICAgICAgICAgICAgICAgICQoZHJvcFRhcmdldClcbiAgICAgICAgICAgICAgICAgICAgLnBhcmVudCgpXG4gICAgICAgICAgICAgICAgICAgIC53aWR0aCgpKSAqXG4gICAgICAgICAgICAgICAgMTAwXG4gICAgICAgICAgICApLnRvU3RyaW5nKCkgKyAnJSc7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcG9zLnRvcCA9ICgocGFyc2VJbnQoJChkcmFnVGFyZ2V0KS5jc3MoJ3RvcCcpKSAvICQoJy5yZXZlYWwnKS5oZWlnaHQoKSkgKiAxMDApLnRvU3RyaW5nKCkgKyAnJSc7XG4gICAgICAgIHBvcy5sZWZ0ID0gKChwYXJzZUludCgkKGRyYWdUYXJnZXQpLmNzcygnbGVmdCcpKSAvICQoJy5yZXZlYWwnKS53aWR0aCgpKSAqIDEwMCkudG9TdHJpbmcoKSArICclJztcbiAgICB9XG5cbiAgICAvLyBydW4gY3VzdG9tIGRyb3AgZnVuY3Rpb25cbiAgICBpZiAoJChkcmFnVGFyZ2V0KS5kYXRhKCdldmVudHMnKVsnb25Ecm9wJ11bZHJvcFRhcmdldC5pZF0pIHtcbiAgICAgICAgJChkcmFnVGFyZ2V0KVxuICAgICAgICAgICAgLmRhdGEoJ2V2ZW50cycpWydvbkRyb3AnXVtkcm9wVGFyZ2V0LmlkXSgpO1xuICAgIH1cblxuICAgIC8vIGhhbmRsZSBkcm9wIGZvciBlYWNoIHR5cGVcbiAgICBpZiAoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ2RuZCddLnR5cGUgPT0gJ2RuZF8yJykge1xuICAgICAgICBpZiAoc3BhY2VBdmFpbGFibGUpIHtcbiAgICAgICAgICAgIGRuZDJEcm9wKGRyYWdUYXJnZXQsIGRyb3BUYXJnZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV2ZXJ0KGRyYWdUYXJnZXQpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXVsnZG5kJ10udHlwZSA9PSAnZG5kXzEnKSB7XG4gICAgICAgIGlmIChzcGFjZUF2YWlsYWJsZSkge1xuICAgICAgICAgICAgZG5kMURyb3AoZHJhZ1RhcmdldCwgZHJvcFRhcmdldCwgcG9zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN3YXAoZHJhZ1RhcmdldCwgZHJvcFRhcmdldCwgcG9zKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoa2V5IGluIHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdWydkbmQnXVsncXVpeiddKSB7XG4gICAgICAgIGdsb2JhbFZhci5kbmRBbnN3ZXJzW2tleV0gPSAkKCcjJyArIGtleSkuZGF0YSgnZHJhZ0VsZW1lbnRzJyk7XG4gICAgfVxufSAvL2VuZCBkcm9wcGVkXG5cbi8vLy8vLy8vIERyb3BzIGFuZCBTd2FwIC8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gZG5kMkRyb3AoZHJhZywgZHJvcCkge1xuICAgICQoZHJvcClcbiAgICAgICAgLmRhdGEoJ2RyYWdFbGVtZW50cycpXG4gICAgICAgIC5wdXNoKGRyYWcuaWQpO1xuICAgICQoZHJhZykuYWRkQ2xhc3MoJ3NocmluaycpO1xuICAgICQoZHJhZykuZGF0YSgnZHJvcHBlZCcsIHRydWUpO1xufVxuXG5mdW5jdGlvbiBkbmQxRHJvcChkcmFnLCBkcm9wLCBwb3MpIHtcbiAgICB2YXIgZHJvcElkID0gJChkcmFnKS5kYXRhKCdkcm9wSWQnKTtcbiAgICBpZiAoZHJvcElkKSB7XG4gICAgICAgIHZhciBuZXdBcnIgPSAkKCcjJyArIGRyb3BJZClcbiAgICAgICAgICAgIC5kYXRhKCdkcmFnRWxlbWVudHMnKVxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZHJhZ0lkKSB7XG4gICAgICAgICAgICAgICAgZHJhZ0lkICE9PSBkcmFnLmlkO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICQoJyMnICsgZHJvcElkKS5kYXRhKCdkcmFnRWxlbWVudHMnLCBuZXdBcnIpO1xuICAgIH1cbiAgICB1cGRhdGVQb3MoZHJhZywgcG9zKTtcbiAgICAkKGRyYWcpLmRhdGEoJ2Ryb3BJZCcsIGRyb3AuaWQpO1xuICAgICQoZHJvcClcbiAgICAgICAgLmRhdGEoJ2RyYWdFbGVtZW50cycpXG4gICAgICAgIC5wdXNoKGRyYWcuaWQpO1xuICAgIG1vdmUoZHJhZyk7XG59XG5cbmZ1bmN0aW9uIHN3YXAoZHJhZywgZHJvcCwgcG9zKSB7XG4gICAgdmFyIGRyb3BJZCA9ICQoZHJhZykuZGF0YSgnZHJvcElkJyk7XG4gICAgdmFyIHN3YXBEcmFnSWQgPSAkKGRyb3ApXG4gICAgICAgIC5kYXRhKCdkcmFnRWxlbWVudHMnKVxuICAgICAgICAucG9wKCk7XG4gICAgdmFyIHN3YXBEcmFnID0gJCgnIycgKyBzd2FwRHJhZ0lkKTtcbiAgICB2YXIgc3dhcERyYWdQb3M7XG4gICAgdmFyIHN3YXBBcnIgPSBbXTtcblxuICAgIGlmIChkcm9wSWQpIHtcbiAgICAgICAgdmFyIG5ld0FyciA9ICQoJyMnICsgZHJvcElkKVxuICAgICAgICAgICAgLmRhdGEoJ2RyYWdFbGVtZW50cycpXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChkcmFnSWQpIHtcbiAgICAgICAgICAgICAgICBkcmFnSWQgIT09IGRyYWcuaWQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgbmV3QXJyLnB1c2goc3dhcERyYWdJZCk7XG4gICAgICAgICQoJyMnICsgZHJvcElkKS5kYXRhKCdkcmFnRWxlbWVudHMnLCBuZXdBcnIpO1xuICAgICAgICBzd2FwRHJhZ1BvcyA9ICQoZHJhZykuZGF0YSgnY3VyUG9zJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3dhcERyYWdQb3MgPSAkKHN3YXBEcmFnKS5kYXRhKCdPR1BvcycpO1xuICAgICAgICBzd2FwRHJhZy5yZW1vdmVEYXRhKCdkcm9wSWQnKVxuICAgIH1cbiAgICBzd2FwQXJyID0gJCgnIycgKyBkcm9wLmlkKVxuICAgICAgICAuZGF0YSgnZHJhZ0VsZW1lbnRzJylcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZHJhZ0lkKSB7XG4gICAgICAgICAgICBkcmFnSWQgIT09IHN3YXBEcmFnSWQ7XG4gICAgICAgIH0pO1xuICAgIHN3YXBBcnIucHVzaChkcmFnLmlkKTtcbiAgICAkKCcjJyArIGRyb3AuaWQpLmRhdGEoJ2RyYWdFbGVtZW50cycsIHN3YXBBcnIpO1xuXG4gICAgJChkcmFnKS5kYXRhKCdkcm9wSWQnLCBkcm9wLmlkKTtcbiAgICAkKHN3YXBEcmFnKS5kYXRhKCdkcm9wSWQnLCBkcm9wSWQpO1xuXG4gICAgdXBkYXRlUG9zKHN3YXBEcmFnLCBzd2FwRHJhZ1Bvcyk7XG4gICAgdXBkYXRlUG9zKGRyYWcsIHBvcyk7XG5cbiAgICBtb3ZlKGRyYWcpO1xuICAgIG1vdmUoc3dhcERyYWcpO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vIERuRCBIZWxwZXIgRnVuY3Rpb25zLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5mdW5jdGlvbiByZXZlcnQoZHJhZ0l0ZW0pIHtcbiAgICB2YXIgcmV2ZXJ0VGltZSA9ICQoZHJhZ0l0ZW0pLmRhdGEoJ3JldmVydFRpbWUnKTtcbiAgICAkKGRyYWdJdGVtKS5hbmltYXRlKHtcbiAgICAgICAgICAgIHRvcDogJChkcmFnSXRlbSkuZGF0YSgncHJldlBvcycpWyd0b3AnXSxcbiAgICAgICAgICAgIGxlZnQ6ICQoZHJhZ0l0ZW0pLmRhdGEoJ3ByZXZQb3MnKVsnbGVmdCddXG4gICAgICAgIH0sXG4gICAgICAgIHJldmVydFRpbWVcbiAgICApO1xufVxuXG5mdW5jdGlvbiBtb3ZlKGRyYWdJdGVtKSB7XG4gICAgdmFyIHJldmVydFRpbWUgPSAzMDA7XG4gICAgJChkcmFnSXRlbSkuYW5pbWF0ZSh7XG4gICAgICAgICAgICB0b3A6ICQoZHJhZ0l0ZW0pLmRhdGEoJ2N1clBvcycpWyd0b3AnXSxcbiAgICAgICAgICAgIGxlZnQ6ICQoZHJhZ0l0ZW0pLmRhdGEoJ2N1clBvcycpWydsZWZ0J11cbiAgICAgICAgfSxcbiAgICAgICAgcmV2ZXJ0VGltZVxuICAgICk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVBvcyhkcmFnSXRlbSwgbmV3UG9zKSB7XG4gICAgJChkcmFnSXRlbSkuZGF0YSgncHJldlBvcycsICQoZHJhZ0l0ZW0pLmRhdGEoJ2N1clBvcycpKTtcbiAgICAkKGRyYWdJdGVtKS5kYXRhKCdjdXJQb3MnLCBuZXdQb3MpO1xufVxuXG4vLyBHcmFicyBjdXN0b20gZXZlbnQgYWN0aW9ucyBvciBhc3NpZ25zIGRlZmF1bHQgdmFsdWVzIHRvIGFsbCBhY3Rpb24ga2V5cy4gTWFrZXMgYWN0aW9uIGtleSBlbnRpcmVseSBvcHRpb25hbFxuZnVuY3Rpb24gZG5kQWN0aW9ucyhkcmFnSXRlbUlEKSB7XG4gICAgdmFyIGFjdGlvbnMgPSB7XG4gICAgICAgIG9uRHJhZ1N0YXJ0OiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgb25EcmFnOiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgb25EcmFnT3Zlcjoge30sXG4gICAgICAgIG9uRHJhZ0VuZDogZnVuY3Rpb24gKCkge30sXG4gICAgICAgIG9uRHJvcDoge31cbiAgICB9O1xuICAgIGlmIChzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXVsnZG5kJ11bJ2FjdGlvbnMnXSkge1xuICAgICAgICBpZiAoIXNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdWydkbmQnXVsnYWN0aW9ucyddW2RyYWdJdGVtSURdKSB7XG4gICAgICAgICAgICBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXVsnZG5kJ11bJ2FjdGlvbnMnXVtkcmFnSXRlbUlEXSA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBhY3Rpb25zKSB7XG4gICAgICAgICAgICBpZiAoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ2RuZCddWydhY3Rpb25zJ11bZHJhZ0l0ZW1JRF1ba2V5XSkge1xuICAgICAgICAgICAgICAgIGFjdGlvbnNba2V5XSA9IHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdWydkbmQnXVsnYWN0aW9ucyddW2RyYWdJdGVtSURdW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXVsnZG5kJ11bJ2FjdGlvbnMnXSA9IHt9O1xuICAgIH1cbiAgICBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXVsnZG5kJ11bJ2FjdGlvbnMnXVtkcmFnSXRlbUlEXSA9IGFjdGlvbnM7XG4gICAgcmV0dXJuIGFjdGlvbnM7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQW5zd2VyVGVtcGxhdGUoKSB7XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBzdHIgPSAnJztcbiAgICB2YXIgZG5kQW5zd2VycztcbiAgICAvL3dyaXRlIGEgYmxhbmsgb2JqZWN0L2Fuc3dlcnMgaW50byB0aGUgZ2xvYmFsVmFyXG4gICAgZ2xvYmFsVmFyLmRuZEFuc3dlcnMgPSB7fTtcbiAgICBmb3IgKGtleSBpbiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXVsnZG5kJ11bJ3F1aXonXSkge1xuICAgICAgICBpKys7XG5cbiAgICAgICAgdmFyIHN0cmEgPSAnXCInICsga2V5ICsgJ1wiOicgKyAnW10nO1xuICAgICAgICBpZiAoT2JqZWN0LmtleXMoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ2RuZCddWydxdWl6J10pLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgICBpZiAoaSAhPSBPYmplY3Qua2V5cyhzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXVsnZG5kJ11bJ3F1aXonXSkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgc3RyYSA9IHN0cmEgKyAnLCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RyID0gc3RyICsgc3RyYTtcbiAgICB9XG4gICAgc3RyID0gJ3snICsgc3RyICsgJ30nO1xuICAgIGRuZEFuc3dlcnMgPSBKU09OLnBhcnNlKHN0cik7XG4gICAgZ2xvYmFsVmFyLmRuZEFuc3dlcnMgPSBkbmRBbnN3ZXJzO1xuICAgIHJldHVybiBkbmRBbnN3ZXJzO1xufVxuXG5mdW5jdGlvbiBrZXlCb2FyZEFjY2VzcyhkcmFnRWxlbWVudCkge1xuICAgIHZhciBhY2Nlc3NpYmlsaXR5ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBkcm9wcyA9IGdsb2JhbFZhci4kY3VyU2xpZGUuZmluZCgnLmRyb3BwYWJsZScpO1xuICAgICAgICB2YXIgZHJvcElkeCA9IDA7XG4gICAgICAgIHZhciAkZHJhZyA9ICQodGhpcyk7XG4gICAgICAgIGlmIChldmVudC53aGljaCA9PT0gMzIpIHtcbiAgICAgICAgICAgIC8vc3BhY2ViYXIgc2VsZWN0cyBkcmFnIGVsZW1lbnRcblxuICAgICAgICAgICAgJChkcm9wc1tkcm9wSWR4XSkuZm9jdXMoKTsgLy9mb2N1c2VzIG9uIGZpcnN0IGRyb3AgYXJlYVxuICAgICAgICAgICAgJGRyYWcub2ZmKCdrZXlkb3duLmFjY2VzcycpOyAvL3JlbW92ZXMgc3BhY2ViYXIgc2VsZWN0b3JcbiAgICAgICAgICAgIGRyYWdnaW5nKCRkcmFnWzBdKTsgLy90YWtlcyBjYXJlIG9mIGRyYWcgZXZlbnRzXG5cbiAgICAgICAgICAgICQoJ2JvZHknKS5vbigna2V5ZG93bi5kcmFnJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgOTogLy9yZW1vdmVzIGFiaWxpdHkgdG8gdGFiIHdoaWxlIGRyYWcgZWxlbWVudCBpcyBzZWxlY3RlZFxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDI3OiAvLyBhbGxvd3MgdXNlciB0byBwcmVzcyBlc2NhcGUga2V5IHRvIHJldHVybiB0byBub3JtYWwgYW5kIHBsYWNlcyBmb2N1cyBvbiBkcmFnIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICRkcmFnLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3A6ICRkcmFnLmRhdGEoJ29yaWdpbmFsVG9wJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6ICRkcmFnLmRhdGEoJ29yaWdpbmFsTGVmdCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXZlcnRUaW1lXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGRyYWcuZm9jdXMoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgJGRyYWcub24oJ2tleWRvd24uYWNjZXNzJywgYWNjZXNzaWJpbGl0eSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCdib2R5Jykub2ZmKCdrZXlkb3duLmRyYWcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDM4OiAvL3VwIGFycm93IGN5Y2xlcyB0aHJvdWdoIGRyb3AgdGFyZ2V0c1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRyb3BJZHggPCBkcm9wcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHJvcElkeCArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcm9wSWR4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICQoZHJvcHNbZHJvcElkeF0pLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA0MDogLy9kb3duIGFycm93IGN5Y2xlcyB0aHJvdWdoIGRyb3AgdGFyZ2V0c1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRyb3BJZHggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHJvcElkeCAtPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcm9wSWR4ID0gZHJvcHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICQoZHJvcHNbZHJvcElkeF0pLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAxMzogLy9lbnRlciBrZXkgZHJvcHMgc2VsZWN0ZWQgZHJhZyBlbGVtZW50IGludG8gY3VycmVudGx5IGZvY3VzZWQgZHJvcCBhcmVhXG4gICAgICAgICAgICAgICAgICAgICAgICBkcm9wcGVkKGRyb3BzW2Ryb3BJZHhdLCAkZHJhZ1swXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ2RuZCddWyd0eXBlJ10gPT09ICdkbmRfMicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZHJhZy5ibHVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRkcmFnLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkZHJhZy5vbigna2V5ZG93bi5hY2Nlc3MnLCBhY2Nlc3NpYmlsaXR5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJ2JvZHknKS5vZmYoJ2tleWRvd24uZHJhZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgJChkcmFnRWxlbWVudCkub24oJ2tleWRvd24uYWNjZXNzJywgYWNjZXNzaWJpbGl0eSk7XG59XG4iLCIvKipcbiAqXG4gKi9cbmZ1bmN0aW9uIGhvdHNwb3RGdW5jdGlvbnMoKSB7XG5cdC8vIHZhcmlhYmxlc1xuXHR2YXIgJHNsaWRlRE9NID0gJCgnIycgKyBnbG9iYWxWYXIuY3VyU2xpZGUpO1xuXHR2YXIgJGhvdHNwb3RzID0gJHNsaWRlRE9NLmZpbmQoJyAuaG90c3BvdC1idXR0b25fX2pzJyk7XG5cdHZhciAkbW9kYWxCbG9ja2VyID0gJCgnLnNpLW1vZGFsLWNvbnRhaW5lcl9fanMnKTtcblx0dmFyIG1vZGFscyA9IFtdO1xuXHQkaG90c3BvdHMuZWFjaChmdW5jdGlvbiAoaWR4LCBob3RzcG90KSB7XG5cdFx0Y29uc29sZS5sb2coJ2Jyb2tlJyk7XG5cdFx0aWYgKHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLm1vZGFsWydocycgKyAoaWR4ICsgMSldKSB7XG5cdFx0XHRtb2RhbHMucHVzaChzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5tb2RhbFsnaHMnICsgKGlkeCArIDEpXSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHQnVGhlcmUgaXMgbm90IGEgY29ycmVzcG9uZGluZyBtb2RhbCBmb3IgaG90c3BvdCAnICtcblx0XHRcdFx0XHQoaWR4ICsgMSkgK1xuXHRcdFx0XHRcdCcuIFBsZWFzZSBkaXNyZWdhcmQgaWYgeW91IGFyZSBub3QgdXNpbmcgbW9kYWxzIGZvciB0aGlzIHNsaWRlLidcblx0XHRcdCk7XG5cdFx0fVxuXHR9KTtcblx0Y29uc29sZS5sb2cobW9kYWxzKTtcblx0dmFyIGNsaWNrQ2hlY2tlciA9IHt9O1xuXG5cdHZhciBzbGlkZU9iaiA9IHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdO1xuXHR2YXIgc2V0dGluZ3MgPSBzbGlkZU9iai5ob3RzcG90IHx8IHt9O1xuXG5cdHZhciBzZWxlY3RlZENsYXNzO1xuXHR2YXIgY29ycmVjdENsYXNzID0gc2V0dGluZ3MuY29ycmVjdENsYXNzIHx8ICdjb3JyZWN0Jztcblx0dmFyIHVubG9ja2VkQ2xhc3MgPSBzZXR0aW5ncy51bmxvY2tlZENsYXNzIHx8ICd1bmxvY2tlZCc7XG5cdHZhciBjb21wbGV0ZWRDbGFzcyA9IHNldHRpbmdzLmNvbXBsZXRlZENsYXNzIHx8ICdjb21wbGV0ZWQnO1xuXHR2YXIgbW9kYWxTdHlsZUNsYXNzID0gc2V0dGluZ3MubW9kYWxTdHlsZUNsYXNzIHx8ICdtb2RhbC1zdHlsZSc7XG5cdHZhciBob3RzcG90U3R5bGVDbGFzcyA9IHNldHRpbmdzLmhvdHNwb3RTdHlsZUNsYXNzIHx8ICdob3RzcG90LXN0eWxlJztcblx0dmFyIGNvbXBsZXRlQWN0aW9uID0gc2V0dGluZ3MuY3VzdG9tQ29tcGxldGVBY3Rpb24gfHwgc2xpZGVPYmoubmV4dEFjdGlvbjtcblxuXHRzZXR0aW5ncy5jb3JyZWN0Q2xhc3MgPSBjb3JyZWN0Q2xhc3M7XG5cdHNldHRpbmdzLnVubG9ja2VkQ2xhc3MgPSB1bmxvY2tlZENsYXNzO1xuXHRzZXR0aW5ncy5zZWxlY3RlZENsYXNzID0gc2VsZWN0ZWRDbGFzcztcblx0c2V0dGluZ3MuY29tcGxldGVkQ2xhc3MgPSBjb21wbGV0ZWRDbGFzcztcblx0c2V0dGluZ3MubW9kYWxTdHlsZUNsYXNzID0gbW9kYWxTdHlsZUNsYXNzO1xuXHRzZXR0aW5ncy5ob3RzcG90U3R5bGVDbGFzcyA9IGhvdHNwb3RTdHlsZUNsYXNzO1xuXG5cdHNldHRpbmdzLmNsaWNrQ2hlY2tlciA9IGNsaWNrQ2hlY2tlcjtcblx0c2V0dGluZ3MuaW5kdiA9IHNldHRpbmdzLmluZHYgfHwge307XG5cblx0JGhvdHNwb3RzLmFkZENsYXNzKGhvdHNwb3RTdHlsZUNsYXNzKTtcblx0JGhvdHNwb3RzLnJlbW92ZUNsYXNzKGNvbXBsZXRlZENsYXNzKTtcblx0JGhvdHNwb3RzLnJlbW92ZUNsYXNzKHVubG9ja2VkQ2xhc3MpO1xuXHQkaG90c3BvdHMuZWFjaChmdW5jdGlvbiAoaSwgc3BvdCkge1xuXHRcdCQoc3BvdCkuYWRkQ2xhc3MoaG90c3BvdFN0eWxlQ2xhc3MgKyAnLScgKyAoaSArIDEpKTtcblx0fSk7XG5cblx0bW9kYWxzLmZvckVhY2goZnVuY3Rpb24gKG1vZGFsLCBpZHgpIHtcblx0XHQkKCcjJyArIG1vZGFsKVxuXHRcdFx0LmFkZENsYXNzKG1vZGFsU3R5bGVDbGFzcylcblx0XHRcdC5hZGRDbGFzcyhtb2RhbFN0eWxlQ2xhc3MgKyAnLScgKyAoaWR4ICsgMSkpO1xuXG5cdFx0Y29uc29sZS5sb2coJCgnIycgKyBtb2RhbCkpO1xuXG5cdFx0aWYgKHNldHRpbmdzLmNsaWNrQW55d2hlcmUpICQoJyMnICsgbW9kYWwpLmFkZENsYXNzKCdtb2RhbC1jbGljay1hbnl3aGVyZScpO1xuXHR9KTtcblxuXHRpZiAoc2V0dGluZ3MuY29ycmVjdEhvdHNwb3RzKVxuXHRcdHNldHRpbmdzLmNvcnJlY3RIb3RzcG90cy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG5cdFx0XHQkKCRob3RzcG90c1tpdGVtIC0gMV0pLmFkZENsYXNzKGNvcnJlY3RDbGFzcyk7XG5cdFx0fSk7XG5cblx0Ly8gYnVpbGQgY2xpY2tDaGVja2VyIG9iamVjdFxuXHRmb3IgKHZhciBpID0gMDsgaSA8ICRob3RzcG90cy5sZW5ndGg7IGkrKykge1xuXHRcdGNsaWNrQ2hlY2tlcltpICsgMV0gPSBjbGlja0NoZWNrZXJbaSArIDFdIHx8IHt9O1xuXHRcdGNsaWNrQ2hlY2tlcltpICsgMV0uc2VlbiA9IGZhbHNlO1xuXG5cdFx0Ly9pZiBjb3JyZWN0Q2xhc3Mgc3BlY2lmaWVkIGFkZCBjb3JyZWN0Q2xhc3Mga2V5XG5cdFx0aWYgKHNldHRpbmdzLmNvcnJlY3RDbGFzcykge1xuXHRcdFx0dmFyIGNvcnJlY3RDbGFzcyA9IHNldHRpbmdzLmNvcnJlY3RDbGFzcztcblx0XHRcdGNsaWNrQ2hlY2tlcltpICsgMV0uaGFzQ29ycmVjdENsYXNzID0gJCgkaG90c3BvdHNbaV0pLmhhc0NsYXNzKGNvcnJlY3RDbGFzcyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNsaWNrQ2hlY2tlcltpICsgMV0uaGFzQ29ycmVjdENsYXNzID0gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXHRpZiAoIXNldHRpbmdzLmF1ZGlvU2V0dXApXG5cdFx0Zm9yICh2YXIga2V5IGluIHNldHRpbmdzLmF1ZGlvKSB7XG5cdFx0XHRzZXR0aW5ncy5hdWRpb1trZXldID0gbmV3IEhvd2woe1xuXHRcdFx0XHRzcmM6IFtzZXR0aW5ncy5hdWRpb1trZXldXVxuXHRcdFx0fSk7XG5cdFx0XHRzZXR0aW5ncy5hdWRpb1NldHVwID0gdHJ1ZTtcblx0XHR9XG5cblx0aWYgKHNldHRpbmdzLmxpbmVhcikge1xuXHRcdGlmIChzZXR0aW5ncy5xdWl6KSB0aHJvdyAnXFxuSG90c3BvdCBFcnJvcjpcXG55b3UgY2Fubm90IHVzZSBcImxpbmVhclwiIGFuZCBcInF1aXpcIiB0b2dldGhlcic7XG5cdFx0aWYgKHNldHRpbmdzLmNvcnJlY3RIb3RzcG90cykgdGhyb3cgJ1xcbkhvdHNwb3QgRXJyb3I6XFxueW91IGNhbm5vdCB1c2UgXCJsaW5lYXJcIiBhbmQgXCJjb3JyZWN0SG90c3BvdHNcIiB0b2dldGhlcic7XG5cdFx0JGhvdHNwb3RzLnJlbW92ZUNsYXNzKHVubG9ja2VkQ2xhc3MpO1xuXHRcdGxvY2soJGhvdHNwb3RzKTtcblx0XHR1bmxvY2soJCgkaG90c3BvdHNbMF0pKTtcblx0XHQkKCRob3RzcG90c1swXSkuYWRkQ2xhc3ModW5sb2NrZWRDbGFzcyk7XG5cdH0gZWxzZSBpZiAoc2V0dGluZ3MucXVpeikge1xuXHRcdHNlbGVjdGVkQ2xhc3MgPSBzZXR0aW5ncy5xdWl6LnNlbGVjdGVkQ2xhc3MgfHwgJ3NlbGVjdGVkLWhvdHNwb3QnO1xuXHRcdCRob3RzcG90cy5yZW1vdmVDbGFzcyhzZWxlY3RlZENsYXNzKTtcblx0XHRzZXR0aW5ncy5xdWl6LnNlbGVjdGVkQW5zd2VycyA9IFtdO1xuXHRcdHNldHRpbmdzLnVzZU1vZGFscyA9IGZhbHNlO1xuXHR9XG5cblx0JGhvdHNwb3RzLmVhY2goZnVuY3Rpb24gKGksIGhvU3ApIHtcblx0XHR2YXIgJHRoaXNIb3RzcG90ID0gJChob1NwKTtcblx0XHQvL2V2ZW50IGxpc3RlbmVyIGZvciBob3RzcG90c1xuXHRcdGlmIChzZXR0aW5ncy5ob3ZlciA9PT0gdHJ1ZSkge1xuXHRcdFx0JHRoaXNIb3RzcG90Lm9mZignbW91c2VvdmVyLmhvdHNwb3QnKTtcblx0XHRcdCR0aGlzSG90c3BvdC5vbignbW91c2VvdmVyLmhvdHNwb3QnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGhhbmRsZUhvdHNwb3QoaSwgaG9TcCk7XG5cdFx0XHR9KTtcblx0XHRcdCRtb2RhbEJsb2NrZXIuYWRkQ2xhc3MoJ2hvdmVyLWhvdHNwb3QnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JHRoaXNIb3RzcG90Lm9mZignY2xpY2suaG90c3BvdCcpO1xuXHRcdFx0JHRoaXNIb3RzcG90Lm9uKCdjbGljay5ob3RzcG90JywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRoYW5kbGVIb3RzcG90KGksIGhvU3ApO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9KTtcblxuXHQvKipcblx0ICogQHBhcmFtIGlcblx0ICogQHBhcmFtIGhvU3Bcblx0ICovXG5cdGZ1bmN0aW9uIGhhbmRsZUhvdHNwb3QoaSwgaG9TcCkge1xuXHRcdHZhciBtYWluT25DbGljayA9IHNldHRpbmdzLm9uQ2xpY2s7XG5cdFx0dmFyIGluZHZPbkNsaWNrID0gc2V0dGluZ3MuaW5kdltpICsgMV0gJiYgc2V0dGluZ3MuaW5kdltpICsgMV0ub25DbGljaztcblx0XHR2YXIgJHRoaXNNb2RhbCA9ICQoJyMnICsgbW9kYWxzW2ldKTtcblx0XHR2YXIgbW9kYWxJRCA9IG1vZGFsc1tpXTtcblx0XHR2YXIgJHRoaXNIb3RzcG90ID0gJChob1NwKTtcblx0XHR2YXIgbW9kYWxXYXJuID0gXCJ5b3UgaGF2ZW4ndCBjcmVhdGVkIGEgbW9kYWwgZm9yIHRoaXMgaG90c3BvdFwiO1xuXHRcdG1haW5PbkNsaWNrICYmIG1haW5PbkNsaWNrKGhvU3AsIG1vZGFsc1tpXSB8fCBtb2RhbFdhcm4pO1xuXHRcdGluZHZPbkNsaWNrICYmIGluZHZPbkNsaWNrKGhvU3AsIG1vZGFsc1tpXSB8fCBtb2RhbFdhcm4pO1xuXG5cdFx0aWYgKHNldHRpbmdzLmF1ZGlvKSB7XG5cdFx0XHRIb3dsZXIuc3RvcCgpO1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIHNldHRpbmdzLmF1ZGlvKSBzZXR0aW5ncy5hdWRpb1trZXldLnN0b3AoKTtcblxuXHRcdFx0c2V0dGluZ3MuYXVkaW9baSArIDFdICYmIHNldHRpbmdzLmF1ZGlvW2kgKyAxXS5wbGF5KCk7XG5cdFx0fVxuXG5cdFx0aWYgKHNldHRpbmdzLnF1aXopIHtcblx0XHRcdGlmIChzZXR0aW5ncy5xdWl6LnR5cGUgPT09ICdzY3EnKSAkaG90c3BvdHMucmVtb3ZlQ2xhc3Moc2VsZWN0ZWRDbGFzcyk7XG5cdFx0XHQkdGhpc0hvdHNwb3QudG9nZ2xlQ2xhc3Moc2VsZWN0ZWRDbGFzcyk7XG5cdFx0XHRzZXR0aW5ncy5xdWl6LnNlbGVjdGVkQW5zd2VycyA9IFtdO1xuXHRcdFx0JGhvdHNwb3RzLmVhY2goZnVuY3Rpb24gKGlkeCwgcXVpekhvdHNwb3QpIHtcblx0XHRcdFx0aWYgKCQocXVpekhvdHNwb3QpLmhhc0NsYXNzKHNlbGVjdGVkQ2xhc3MpKSBzZXR0aW5ncy5xdWl6LnNlbGVjdGVkQW5zd2Vycy5wdXNoKGlkeCArIDEpO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIGlmIChzZXR0aW5ncy51c2VNb2RhbHMgPT09IGZhbHNlKSB7XG5cdFx0XHRjbGlja0NoZWNrZXJbaSArIDFdLnNlZW4gPSB0cnVlO1xuXG5cdFx0XHQkKGhvU3ApLmFkZENsYXNzKGNvbXBsZXRlZENsYXNzKTtcblxuXHRcdFx0YWxsU2VlbkJlaGF2aW9yKCk7XG5cblx0XHRcdGlmIChzZXR0aW5ncy5saW5lYXIgPT09IHRydWUpIHVubG9ja05leHRIb3RzcG90KCRob3RzcG90c1tpICsgMV0sIHNldHRpbmdzLmluZHZbaSArIDJdKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKHNldHRpbmdzLmhvdmVyKSB7XG5cdFx0XHRcdCQoJy5zaS1tb2RhbC1jb250YWluZXJfX2pzJykuYWRkQ2xhc3MoJ3NpLWhvdmVyLWhvdHNwb3QnKTtcblx0XHRcdFx0JGhvdHNwb3RzLmVhY2goZnVuY3Rpb24gKGksIGhvU3ApIHtcblx0XHRcdFx0XHQkdGhpc0hvdHNwb3Qub2ZmKCdtb3VzZW91dC5ob3RzcG90Jyk7XG5cdFx0XHRcdFx0JHRoaXNIb3RzcG90Lm9uKCdtb3VzZW91dC5ob3RzcG90JywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0JCgnLnNpLW1vZGFsLWNvbnRhaW5lcl9fanMnKS5yZW1vdmVDbGFzcygnc2ktaG92ZXItaG90c3BvdCcpO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ21vdXNlb3V0Jyk7XG5cdFx0XHRcdFx0XHQkbW9kYWxCbG9ja2VyLnRyaWdnZXIoJ2NsaWNrJyk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0Y29uc29sZS5sb2coJHRoaXNNb2RhbCk7XG5cdFx0XHQkKCcuc2ktbW9kYWwtY29udGFpbmVyX19qcycpLmFkZENsYXNzKCdzaS1tb2RhbC1jb250YWluZXItb3BlbicpO1xuXHRcdFx0JHRoaXNNb2RhbC5hZGRDbGFzcygnc2ktY3VycmVudC1tb2RhbCcpO1xuXHRcdFx0Z2xvYmFsVmFyLmN1cnJlbnRNb2RhbCA9IG1vZGFsSUQ7XG5cdFx0XHRnbG9iYWxWYXIuY3VycmVudE1vZGFsVHlwZSA9ICdob3RzcG90Jztcblx0XHRcdGdsb2JhbFZhci5ob3RzcG90SWR4ID0gaTtcblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBAcGFyYW0gZVxuXHRcdFx0ICovXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqXG5cdCAqL1xuXHQvLyBmdW5jdGlvbiBoYW5kbGVIb3RzcG90Q2xvc2UoKSB7XG5cdC8vIFx0dmFyIHNldHRpbmdzID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0uaG90c3BvdDtcblx0Ly8gXHR2YXIgJGhvdHNwb3RzID0gJCgnIycgKyBnbG9iYWxWYXIuY3VyU2xpZGUpLmZpbmQoJyAuaG90c3BvdC1idXR0b25fX2pzJyk7XG5cdC8vIFx0dmFyIGkgPSBnbG9iYWxWYXIuaG90c3BvdElkeDtcblx0Ly8gXHR2YXIgaG90c3BvdCA9ICRob3RzcG90c1tpXTtcblx0Ly8gXHR2YXIgbW9kYWwgPSAnIycgKyBnbG9iYWxWYXIuY3VycmVudE1vZGFsO1xuXHQvLyBcdHZhciBtYWluT25Nb2RhbENsb3NlID0gc2V0dGluZ3Mub25Nb2RhbENsb3NlO1xuXHQvLyBcdHZhciBpbmR2T25Nb2RhbENsb3NlID0gc2V0dGluZ3MuaW5kdltpICsgMV0gJiYgc2V0dGluZ3MuaW5kdltpICsgMV0ub25Nb2RhbENsb3NlO1xuXHQvLyBcdHZhciBtb2RhbFdhcm4gPSBcInlvdSBoYXZlbid0IGNyZWF0ZWQgYSBtb2RhbCBmb3IgdGhpcyBob3RzcG90XCI7XG5cdC8vIFx0c2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0uaG90c3BvdC5jbGlja0NoZWNrZXJbaSArIDFdLnNlZW4gPSB0cnVlO1xuXHQvLyBcdG1haW5Pbk1vZGFsQ2xvc2UgJiYgbWFpbk9uTW9kYWxDbG9zZShob3RzcG90LCBtb2RhbCB8fCBtb2RhbFdhcm4pO1xuXHQvLyBcdGluZHZPbk1vZGFsQ2xvc2UgJiYgaW5kdk9uTW9kYWxDbG9zZShob3RzcG90LCBtb2RhbCB8fCBtb2RhbFdhcm4pO1xuXG5cdC8vIFx0dmFyIHJlc3VsdCA9IHRydWU7XG5cblx0Ly8gXHRmb3IgKHZhciBpdGVtIGluIHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLmhvdHNwb3QpIHtcblx0Ly8gXHRcdGlmIChzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5ob3RzcG90W2l0ZW1dLnNlZW4gPT09IGZhbHNlICYmICFzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5ob3RzcG90W2l0ZW1dLmhhc0NvcnJlY3RDbGFzcykge1xuXHQvLyBcdFx0XHRyZXN1bHQgPSBmYWxzZTtcblx0Ly8gXHRcdFx0YnJlYWs7XG5cdC8vIFx0XHR9XG5cdC8vIFx0fVxuXG5cdC8vIFx0aWYocmVzdWx0KXtcblx0Ly8gXHRcdGlmKHNldHRpbmdzLmN1c3RvbUNvbXBsZXRlQWN0aW9uKXtcblx0Ly8gXHRcdFx0c2V0dGluZ3MuY3VzdG9tQ29tcGxldGVBY3Rpb24oKTtcblx0Ly8gXHRcdH1lbHNle1xuXHQvLyBcdFx0XHRzbGlkZXNbZ2xvYmFsVmFyLkN1clNsaWRlXS5uZXh0QWN0aW9uKClcblx0Ly8gXHRcdH1cblx0Ly8gXHR9XG5cblx0Ly8gXHRpZiAoc2V0dGluZ3MubGluZWFyID09PSB0cnVlKSB1bmxvY2tOZXh0SG90c3BvdCgkaG90c3BvdHNbaSArIDFdLCBzZXR0aW5ncy5pbmR2W2kgKyAyXSk7XG5cdC8vIH1cblxuXHQvL2NoZWNrIGZvciBjb21wbGV0aW9uIGFuZCBkZWZpbmUgd2hhdCBoYXBwZW5zXG5cdC8qKlxuXHQgKlxuXHQgKi9cblx0ZnVuY3Rpb24gYWxsU2VlbkJlaGF2aW9yKCkge1xuXHRcdGlmIChhbGxTZWVuKGNsaWNrQ2hlY2tlcikpIGNvbXBsZXRlQWN0aW9uKCk7XG5cdH1cblxuXHQvKipcblx0ICogQHBhcmFtIGNsaWNrQ2hlY2tlclxuXHQgKi9cblx0ZnVuY3Rpb24gYWxsU2VlbihjbGlja0NoZWNrZXIpIHtcblx0XHR2YXIgcmVzdWx0ID0gdHJ1ZTtcblxuXHRcdGZvciAodmFyIGl0ZW0gaW4gY2xpY2tDaGVja2VyKSB7XG5cdFx0XHRpZiAoY2xpY2tDaGVja2VyW2l0ZW1dLnNlZW4gPT09IGZhbHNlICYmICFjbGlja0NoZWNrZXJbaXRlbV0uaGFzQ29ycmVjdENsYXNzKSB7XG5cdFx0XHRcdHJlc3VsdCA9IGZhbHNlO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdC8qKlxuXHQgKiBAcGFyYW0gbmV4dEhvdHNwb3Rcblx0ICogQHBhcmFtIG5leHRIb3RzcG90U2V0dGluZ3Ncblx0ICovXG5cdGZ1bmN0aW9uIHVubG9ja05leHRIb3RzcG90KG5leHRIb3RzcG90LCBuZXh0SG90c3BvdFNldHRpbmdzKSB7XG5cdFx0dmFyIG1haW5PblVubG9jayA9IHNldHRpbmdzLm9uVW5sb2NrO1xuXHRcdHZhciBpbmR2T25VbmxvY2sgPSBuZXh0SG90c3BvdFNldHRpbmdzICYmIG5leHRIb3RzcG90U2V0dGluZ3Mub25VbmxvY2s7XG5cblx0XHQkaG90c3BvdHMucmVtb3ZlQ2xhc3ModW5sb2NrZWRDbGFzcyk7XG5cblx0XHR1bmxvY2soJChuZXh0SG90c3BvdCkpO1xuXHRcdCQobmV4dEhvdHNwb3QpLmFkZENsYXNzKHVubG9ja2VkQ2xhc3MpO1xuXG5cdFx0bWFpbk9uVW5sb2NrICYmIG1haW5PblVubG9jayhuZXh0SG90c3BvdCk7XG5cdFx0aW5kdk9uVW5sb2NrICYmIGluZHZPblVubG9jayhuZXh0SG90c3BvdCk7XG5cdH1cbn1cblxuLyoqXG4gKlxuICovXG5mdW5jdGlvbiByZXNldEhvdHNwb3QoKSB7XG5cdGhvdHNwb3RGdW5jdGlvbnMoKTtcbn1cbiIsImZ1bmN0aW9uIGluaXRNZW51KCkge1xuXHRmb3IgKGtleSBpbiBzbGlkZXMpIHtcblx0XHRpZiAoc2xpZGVzW2tleV0udHlwZSA9PT0gJ21lbnUnKSB7XG5cdFx0XHRpZiAoc2xpZGVzW2tleV1bJ21lbnUnXSkge1xuXHRcdFx0XHQvLyBzZXQgZGVmYXVsdCBtZW51IGNsYXNzIGlmIG9uZSBpcyBub3QgcHJlc2VudFxuXHRcdFx0XHRpZiAoIXNsaWRlc1trZXldWydtZW51J11bJ21lbnVDbGFzcyddKSB7XG5cdFx0XHRcdFx0c2xpZGVzW2tleV1bJ21lbnUnXVsnbWVudUNsYXNzJ10gPSAnc2ktbWVudV9fanMnO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIHNldCBtZW51IGRlZmF1bHQgdG8gbm9ubGluZWFyIGlmIGxpbmVhciBzbGlkZSBrZXkgaXMgbm90IHByZXNlbnQvdHJ1ZVxuXHRcdFx0XHRpZiAoIXNsaWRlc1trZXldWydtZW51J11bJ2xpbmVhciddKSB7XG5cdFx0XHRcdFx0c2xpZGVzW2tleV1bJ21lbnUnXVsnbGluZWFyJ10gPSBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBzZXQgbWVudSBkZWZhdWx0IG1lbnUgbmF2aWdhdGlvbiBpZiBub3QgcHJlc2VudC4gIFdpbGwgbWF0Y2ggYnV0dG9ucyB0byBzdWJzZXF1ZW50IHNsaWRlcyBhZnRlciB0aGUgbWVudVxuXHRcdFx0XHRpZiAoIXNsaWRlc1trZXldWydtZW51J11bJ25hdmlnYXRpb24nXSkge1xuXHRcdFx0XHRcdHZhciBudW1iZXIgPSBzbGlkZXNba2V5XVsnc2xpZGVOdW1iZXInXTtcblx0XHRcdFx0XHR2YXIgYnV0dG9ucyA9ICQoJyMnICsga2V5KS5maW5kKCcuJyArIHNsaWRlc1trZXldWydtZW51J11bJ21lbnVDbGFzcyddKTtcblx0XHRcdFx0XHR2YXIgbGVuZ3RoID0gYnV0dG9ucy5sZW5ndGg7XG5cdFx0XHRcdFx0dmFyIGRlZmF1bHROYXYgPSBbXTtcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMTsgaSA8PSBsZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0ZGVmYXVsdE5hdi5wdXNoKG51bWJlciArIGkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRzbGlkZXNba2V5XVsnbWVudSddWyduYXZpZ2F0aW9uJ10gPSBkZWZhdWx0TmF2O1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIHNldCBkZWZhdWx0IGNvbXBsZXRpb24gcmVxdWlyZW1lbnRzIGZvciBlYWNoIGJ1dHRvbiBpZiBub3QgZ2l2ZW4uICBXaWxsIG1hdGNoIGJ1dHRvbnMgdG8gc3Vic2VxdWVudCBzbGlkZXMgYWZ0ZXIgdGhlIG1lbnVcblx0XHRcdFx0aWYgKCFzbGlkZXNba2V5XVsnbWVudSddWydjb21wbGV0aW9uSURzJ10pIHtcblx0XHRcdFx0XHR2YXIgbnVtYmVyID0gc2xpZGVzW2tleV1bJ3NsaWRlTnVtYmVyJ107XG5cdFx0XHRcdFx0dmFyIGJ1dHRvbnMgPSAkKCcjJyArIGtleSkuZmluZCgnLicgKyBzbGlkZXNba2V5XVsnbWVudSddWydtZW51Q2xhc3MnXSk7XG5cdFx0XHRcdFx0dmFyIGxlbmd0aCA9IGJ1dHRvbnMubGVuZ3RoO1xuXHRcdFx0XHRcdHZhciBjb21wbGV0aW9uSURzID0gW107XG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDE7IGkgPD0gbGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdGZvciAoaWQgaW4gc2xpZGVzKSB7XG5cdFx0XHRcdFx0XHRcdGlmIChzbGlkZXNbaWRdWydzbGlkZU51bWJlciddID09IChudW1iZXIgKyBpKS50b1N0cmluZygpKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y29tcGxldGlvbklEcy5wdXNoKGlkKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRzbGlkZXNba2V5XVsnbWVudSddWydjb21wbGV0aW9uSURzJ10gPSBjb21wbGV0aW9uSURzO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBzZXQgYWxsIG1lbnUgZGVmYXVsdHMgaWYgdGhlICdtZW51JyBrZXkgaXMgZW50aXJlbHkgYWJzZW50XG5cdFx0XHRcdHNsaWRlc1trZXldWydtZW51J10gPSB7fTtcblx0XHRcdFx0c2xpZGVzW2tleV1bJ21lbnUnXVsnbWVudUNsYXNzJ10gPSAnc2ktbWVudV9fanMnO1xuXHRcdFx0XHRzbGlkZXNba2V5XVsnbWVudSddWydsaW5lYXInXSA9IGZhbHNlO1xuXHRcdFx0XHRzbGlkZXNba2V5XVsnbWVudSddWydjb21wbGV0aW9uSURzJ10gPSBjb21wbGV0aW9uSURzO1xuXHRcdFx0XHR2YXIgYnV0dG9ucyA9ICQoJyMnICsga2V5KS5maW5kKCcuJyArIHNsaWRlc1trZXldWydtZW51J11bJ21lbnVDbGFzcyddKTtcblx0XHRcdFx0dmFyIG51bWJlciA9IHNsaWRlc1trZXldWydzbGlkZU51bWJlciddO1xuXHRcdFx0XHR2YXIgbGVuZ3RoID0gYnV0dG9ucy5sZW5ndGg7XG5cdFx0XHRcdHZhciBkZWZhdWx0TmF2ID0gW107XG5cdFx0XHRcdHZhciBjb21wbGV0aW9uSURzID0gW107XG5cdFx0XHRcdGZvciAodmFyIGkgPSAxOyBpIDw9IGxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0ZGVmYXVsdE5hdi5wdXNoKG51bWJlciArIGkpO1xuXHRcdFx0XHRcdGZvciAoaWQgaW4gc2xpZGVzKSB7XG5cdFx0XHRcdFx0XHRpZiAoc2xpZGVzW2lkXVsnc2xpZGVOdW1iZXInXSA9PSAobnVtYmVyICsgaSkudG9TdHJpbmcoKSkge1xuXHRcdFx0XHRcdFx0XHRjb21wbGV0aW9uSURzLnB1c2goaWQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRzbGlkZXNba2V5XVsnbWVudSddWyduYXZpZ2F0aW9uJ10gPSBkZWZhdWx0TmF2O1xuXHRcdFx0XHRzbGlkZXNba2V5XVsnbWVudSddWydjb21wbGV0aW9uSURzJ10gPSBjb21wbGV0aW9uSURzO1xuXHRcdFx0fVxuXHRcdFx0Ly8gYXR0YWNoIGNsaWNrIGV2ZW50IHRvIHRoZSBidXR0b25zIHVzaW5nIG5hdmlnYXRpb24gYXJyYXlcblx0XHRcdGlmIChzbGlkZXNba2V5XVsnbWVudSddWyduYXZpZ2F0aW9uJ10ubGVuZ3RoKSB7XG5cdFx0XHRcdHZhciBidXR0b25zID0gJCgnIycgKyBrZXkpLmZpbmQoJy4nICsgc2xpZGVzW2tleV1bJ21lbnUnXVsnbWVudUNsYXNzJ10pO1xuXG5cdFx0XHRcdGJ1dHRvbnMuZWFjaChmdW5jdGlvbiAoaWR4LCBidXR0b24pIHtcblx0XHRcdFx0XHR2YXIgc2xpZGUgPSBzbGlkZXNba2V5XTtcblxuXHRcdFx0XHRcdCQoYnV0dG9uKS5vbignY2xpY2submF2JywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0anVtcFRvSWQoc2xpZGVbJ21lbnUnXVsnbmF2aWdhdGlvbiddW2lkeF0pO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdC8vIGxvY2sgYnV0dG9ucyBpZiBsaW5lYXIgYW5kIHVubG9jayB0aGUgZmlyc3Qgb25lXG5cdFx0XHRpZiAoc2xpZGVzW2tleV1bJ21lbnUnXVsnbGluZWFyJ10pIHtcblx0XHRcdFx0dmFyIGJ1dHRvbnMgPSAkKCcjJyArIGtleSkuZmluZCgnLicgKyBzbGlkZXNba2V5XVsnbWVudSddWydtZW51Q2xhc3MnXSk7XG5cdFx0XHRcdGxvY2soYnV0dG9ucyk7XG5cdFx0XHRcdHVubG9jaygkKGJ1dHRvbnNbMF0pKTtcblx0XHRcdFx0JChidXR0b25zWzBdKS5hZGRDbGFzcygndW5sb2NrZWQnKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gbWVudUZ1bmN0aW9ucygpIHtcblx0dmFyIG1lbnVCdXR0b25zID0gJCgnIycgKyBnbG9iYWxWYXIuY3VyU2xpZGUpLmZpbmQoJy4nICsgc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ21lbnUnXVsnbWVudUNsYXNzJ10pO1xuXHR2YXIgbGluZWFyID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ21lbnUnXVsnbGluZWFyJ107XG5cdHZhciBjb21wbGV0aW9uSURzID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ21lbnUnXVsnY29tcGxldGlvbklEcyddO1xuXHR2YXIgYWxsQ29tcGxldGUgPSB0cnVlO1xuXG5cdGlmIChjb21wbGV0aW9uSURzLmxlbmd0aCkge1xuXHRcdGNvbXBsZXRpb25JRHMuZm9yRWFjaChmdW5jdGlvbiAoaWQsIGlkeCkge1xuXHRcdFx0aWYgKGdldENvbXBsZXRpb25TdGF0dXMoaWQpKSB7XG5cdFx0XHRcdCQobWVudUJ1dHRvbnNbaWR4XSkuYWRkQ2xhc3MoJ2NvbXBsZXRlZCcpO1xuXHRcdFx0XHRpZiAobGluZWFyICYmIG1lbnVCdXR0b25zW2lkeCArIDFdKSB7XG5cdFx0XHRcdFx0JChtZW51QnV0dG9ucykucmVtb3ZlQ2xhc3MoJ3VubG9ja2VkJyk7XG5cdFx0XHRcdFx0dW5sb2NrKCQobWVudUJ1dHRvbnNbaWR4ICsgMV0pKTtcblx0XHRcdFx0XHQkKG1lbnVCdXR0b25zW2lkeCArIDFdKS5hZGRDbGFzcygndW5sb2NrZWQnKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YWxsQ29tcGxldGUgPSBmYWxzZTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdGlmIChhbGxDb21wbGV0ZSkge1xuXHRcdHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdWydtZW51J11bJ2FsbENvbXBsZXRlJ10gPSB0cnVlO1xuXHR9IGVsc2Uge1xuXHRcdHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdWydtZW51J11bJ2FsbENvbXBsZXRlJ10gPSBmYWxzZTtcblx0fVxufVxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vKkZlYXR1cmU6U29ydGFibGVzLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gc29ydEZ1bmN0aW9ucygpIHtcbiAgICAvLyBmaXJzdCB2aXNpdCBzZXR1cFxuICAgIC8vIGFzc2lnbnMgb3JpZ2luYWwgcG9zaXRpb25zIGluIG9yZGVyIHRvIG1ha2UgcmVzZXQgd29ya1xuICAgIGlmIChzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS52aXNpdGVkID09PSBmYWxzZSkge1xuICAgICAgICB2YXIgJHNvcnRhYmxlcyA9IGdsb2JhbFZhci4kY3VyU2xpZGUuZmluZCgnLnNvcnRhYmxlJyk7XG4gICAgICAgICRzb3J0YWJsZXMuZWFjaChmdW5jdGlvbiAoaWR4LCBzb3J0YWJsZSkge1xuICAgICAgICAgICAgdmFyIGlkID0gc29ydGFibGUuaWQ7XG5cbiAgICAgICAgICAgIC8vIGluaXRpYWxpemUgc29ydGFibGVzIHdpdGggb3Igd2l0aG91dCBvcHRpb25zXG4gICAgICAgICAgICBpZiAoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ3NvcnQnXVsnc29ydGFibGVzJ11baWRdKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdWydzb3J0J11bJ3NvcnRhYmxlcyddW2lkXVsnb3B0aW9ucyddKSB7XG4gICAgICAgICAgICAgICAgICAgICQoc29ydGFibGUpLnNvcnRhYmxlKHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdWydzb3J0J11bJ3NvcnRhYmxlcyddW2lkXVsnb3B0aW9ucyddKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkKHNvcnRhYmxlKS5zb3J0YWJsZSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vbWFrZXMgYmVnaW5uaW5nIG9yZGVyIGRlZmF1bHQgYW5zd2VyIGlmIG5vIGFuc3dlciBpcyBnaXZlblxuICAgICAgICAgICAgICAgIGlmICghc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ3NvcnQnXVsnc29ydGFibGVzJ11baWRdWydhbnN3ZXInXSkge1xuICAgICAgICAgICAgICAgICAgICBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXVsnc29ydCddWydzb3J0YWJsZXMnXVtpZF1bJ2Fuc3dlciddID0gJChzb3J0YWJsZSkuc29ydGFibGUoJ3RvQXJyYXknKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQoc29ydGFibGUpLnNvcnRhYmxlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBzb3J0YWJsZUVsZW1lbnRzID0gJCgnIycgKyBpZCArICc+IGRpdicpO1xuICAgICAgICAgICAgLy8gbmVjZXNzYXJ5IHRvIG1ha2UgYSBjb3B5IG90aGVyd2lzZSByZWFzc2lnbmluZyBvbmUgb2YgdGhlIGRhdGEgZWxlbWVudHMgb3ZlcndyaXRlcyB0aGUgb3RoZXJcbiAgICAgICAgICAgIHZhciBzaHVmZmxlRWxlbWVudHMgPSAkKCcjJyArIGlkICsgJz4gZGl2Jyk7XG5cbiAgICAgICAgICAgIC8vIFRoaXMgaGFuZGxlcyBrZXlib2FyZCBhY2Nlc3NpYmlsaXR5IGZvciBzb3J0YWJsZXNcblxuICAgICAgICAgICAgc29ydGFibGVFbGVtZW50cy5lYWNoKGZ1bmN0aW9uIChpZHgsIHNvcnQpIHtcbiAgICAgICAgICAgICAgICBzb3J0S2V5Ym9hcmQoc29ydCwgc29ydGFibGUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICQoc29ydGFibGUpLmRhdGEoe1xuICAgICAgICAgICAgICAgIGVsZW1lbnRzOiBzb3J0YWJsZUVsZW1lbnRzLFxuICAgICAgICAgICAgICAgIHNodWZmbGU6IHNodWZmbGVFbGVtZW50c1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIHJhbmRvbWl6ZXMgcGxhY2VtZW50IG9mIGRpdnMgZXZlcnkgdGltZSB0aGUgc2xpZGUgaXMgZW50ZXJlZFxuICAgIGlmIChzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXVsnc29ydCddWydyYW5kb21pemUnXSA9PT0gdHJ1ZSkge1xuICAgICAgICB2YXIgJHNvcnRhYmxlczIgPSBnbG9iYWxWYXIuJGN1clNsaWRlLmZpbmQoJy5zb3J0YWJsZScpO1xuICAgICAgICAkc29ydGFibGVzMi5lYWNoKGZ1bmN0aW9uIChpZHgsIHNvcnRhYmxlKSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudHMgPSAkKHNvcnRhYmxlKS5kYXRhKCdlbGVtZW50cycpO1xuICAgICAgICAgICAgdmFyIHNodWZmbGVBcnIgPSBbXTtcblxuICAgICAgICAgICAgLy8gY3JlYXRlIGFuIGFycmF5IG9mIHVuaXF1ZSByYW5kb20gbnVtYmVycyB0byBzZXJ2ZSBhcyBpbmRpY2VzXG4gICAgICAgICAgICB3aGlsZSAoc2h1ZmZsZUFyci5sZW5ndGggPCBlbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbnVtID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZWxlbWVudHMubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAvLyB0ZXN0cyB0aGF0IHRoZSBudW0gdmFyaWFibGUgaGFzIG5vdCBhbHJlYWR5IGJlZW4gYWRkZWQgdG8gdGhlIGFycmF5XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAhc2h1ZmZsZUFyci5zb21lKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsID09PSBudW07XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNodWZmbGVBcnIucHVzaChudW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdXNlIHRoZSBhcnJheSBvZiByYW5kb20gbnVtYmVycyB0byByZWFzc2lnbiBlbGVtZW50cyBpbiB0aGUgc2h1ZmZsZSBkYXRhIGF0dHJpYnV0ZVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICQoc29ydGFibGUpLmRhdGEoJ3NodWZmbGUnKVtpXSA9ICQoc29ydGFibGUpLmRhdGEoJ2VsZW1lbnRzJylbc2h1ZmZsZUFycltpXV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIHJhbmRvbWl6ZXMgYWNyb3NzIGNvbm5lY3RlZCBsaXN0c1xuICAgIGlmIChcbiAgICAgICAgc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ3NvcnQnXVsncmFuZG9taXplQ29ubmVjdCddICYmXG4gICAgICAgIHR5cGVvZiBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXVsnc29ydCddWydyYW5kb21pemVDb25uZWN0J10gPT09ICdzdHJpbmcnXG4gICAgKSB7XG4gICAgICAgIHZhciBsaXN0cyA9ICQoJy4nICsgc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ3NvcnQnXVsncmFuZG9taXplQ29ubmVjdCddKTtcbiAgICAgICAgdmFyIGVsZW1lbnRBcnIgPSBbXTtcbiAgICAgICAgdmFyIHNodWZmbGVkID0gW107XG4gICAgICAgIGxpc3RzLmVhY2goZnVuY3Rpb24gKGlkeCwgbGlzdCkge1xuICAgICAgICAgICAgJChsaXN0KVxuICAgICAgICAgICAgICAgIC5maW5kKCdkaXYnKVxuICAgICAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uIChpZHgyLCBkaXYpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudEFyci5wdXNoKGRpdik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdoaWxlIChlbGVtZW50QXJyLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIG51bSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVsZW1lbnRBcnIubGVuZ3RoKTtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBlbGVtZW50QXJyLnNwbGljZShudW0sIDEpO1xuICAgICAgICAgICAgc2h1ZmZsZWQucHVzaChlbGVtZW50WzBdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKHNodWZmbGVkLmxlbmd0aCkge1xuICAgICAgICAgICAgbGlzdHMuZWFjaChmdW5jdGlvbiAoaWR4LCBsaXN0KSB7XG4gICAgICAgICAgICAgICAgJChsaXN0KS5kYXRhKCdzaHVmZmxlJylbaV0gPSBzaHVmZmxlZC5zaGlmdCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXNldFNvcnQoKTtcbn1cblxuLy8gcmVzZXQgd29ya3MgZm9yIGJvdGggcmFuZG9taXplZCBhbmQgbm9uLXJhbmRvbWl6ZWQgc29ydCBzbGlkZXMuICB5b3UgZG8gbm90IG5lZWQgdG8gcHV0IHRoZSByYW5kb21pemUga2V5IGlmIHlvdSBkb24ndCBuZWVkIGl0LlxuLy8gcmVzZXQgd2lsbCBlaXRoZXIgcmVzZXQgdG8gdGhlIGh0bWwgb3JkZXIgb2YgZGl2cyBvciB0byB0aGUgY3VycmVudCByYW5kb21pemVkIG9yZGVyXG5mdW5jdGlvbiByZXNldFNvcnQoKSB7XG4gICAgdmFyICRzb3J0YWJsZXMgPSBnbG9iYWxWYXIuJGN1clNsaWRlLmZpbmQoJy5zb3J0YWJsZScpO1xuICAgICRzb3J0YWJsZXMuZWFjaChmdW5jdGlvbiAoaWR4LCBzb3J0YWJsZSkge1xuICAgICAgICBpZiAoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ3NvcnQnXVsncmFuZG9taXplQ29ubmVjdCddKSB7XG4gICAgICAgICAgICAkKHNvcnRhYmxlKS5hcHBlbmQoJChzb3J0YWJsZSkuZGF0YSgnc2h1ZmZsZScpKTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdWydzb3J0J11bJ3JhbmRvbWl6ZSddID09PSBmYWxzZSB8fFxuICAgICAgICAgICAgc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ3NvcnQnXVsncmFuZG9taXplJ10gPT09IHVuZGVmaW5lZFxuICAgICAgICApIHtcbiAgICAgICAgICAgICQoc29ydGFibGUpLmFwcGVuZCgkKHNvcnRhYmxlKS5kYXRhKCdlbGVtZW50cycpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoc29ydGFibGUpLmFwcGVuZCgkKHNvcnRhYmxlKS5kYXRhKCdzaHVmZmxlJykpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8vIGFjY2Vzc2liaWxpdHkgZnVuY3Rpb25cbmZ1bmN0aW9uIHNvcnRLZXlib2FyZChzb3J0SXRlbSwgc29ydExpc3QpIHtcbiAgICB2YXIgY29ubmVjdGVkID0gJChzb3J0TGlzdCkuc29ydGFibGUoJ29wdGlvbicsICdjb25uZWN0V2l0aCcpO1xuXG4gICAgJChzb3J0SXRlbSlcbiAgICAgICAgLmF0dHIoJ3RhYmluZGV4JywgMClcbiAgICAgICAgLm9uKCdrZXlkb3duJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQud2hpY2ggPT09IDg3IHx8IGV2ZW50LndoaWNoID09PSA2NSkge1xuICAgICAgICAgICAgICAgIC8vIGxlZnQgb3IgdXAgb25lIHNwYWNlICgndycsICdhJylcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmluc2VydEJlZm9yZSgkKHRoaXMpLnByZXYoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXZlbnQud2hpY2ggPT09IDgzIHx8IGV2ZW50LndoaWNoID09PSA2OCkge1xuICAgICAgICAgICAgICAgIC8vIHJpZ2h0IG9yIGRvd24gb25lIHNwYWNlICgncycsJ2QnKVxuICAgICAgICAgICAgICAgICQodGhpcykuaW5zZXJ0QWZ0ZXIoJCh0aGlzKS5uZXh0KCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGV2ZW50LndoaWNoID09PSA4MSkge1xuICAgICAgICAgICAgICAgIC8vIFwicVwiIHRvcCBvZiBsaXN0XG4gICAgICAgICAgICAgICAgJCh0aGlzKVxuICAgICAgICAgICAgICAgICAgICAucGFyZW50KClcbiAgICAgICAgICAgICAgICAgICAgLnByZXBlbmQoJCh0aGlzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXZlbnQud2hpY2ggPT09IDY5KSB7XG4gICAgICAgICAgICAgICAgLy8gXCJlXCIgYm90dG9tIG9mIGxpc3RcbiAgICAgICAgICAgICAgICAkKHRoaXMpXG4gICAgICAgICAgICAgICAgICAgIC5wYXJlbnQoKVxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCQodGhpcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNvbm5lY3RlZCAmJiBldmVudC53aGljaCA9PT0gODgpIHtcbiAgICAgICAgICAgICAgICAvLyAneCcgbW92ZSBpdGVtIHRvIGNvbm5lY3RlZCBsaXN0c1xuICAgICAgICAgICAgICAgIHZhciBuZXdMaXN0cyA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnRJbmRleDtcbiAgICAgICAgICAgICAgICAkKGNvbm5lY3RlZCkuZWFjaChmdW5jdGlvbiAoaWR4LCBsaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghJChsaXN0KS5maW5kKGV2ZW50LnRhcmdldClbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0xpc3RzLnB1c2gobGlzdCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRJbmRleCA9IGlkeDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChuZXdMaXN0c1twYXJlbnRJbmRleF0pIHtcbiAgICAgICAgICAgICAgICAgICAgJChuZXdMaXN0c1twYXJlbnRJbmRleF0pLmFwcGVuZCgkKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkKG5ld0xpc3RzWzBdKS5hcHBlbmQoJCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJCh0aGlzKS5mb2N1cygpO1xuICAgICAgICB9KTtcbn0iLCIvLy8vLy8vLy8vLy8qRmVhdHVyZTpNdWx0aXBsZSBDaG9pY2UvU2luZ2xlIENob2ljZSBRdWVzdGlvbnMvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gcmVzZXRRdWl6KCkge1xuXHR2YXIgY2hvaWNlcyA9ICQoJyMnICsgZ2xvYmFsVmFyLmN1clNsaWRlICsgJyAuc2ktcXVpel9fanMgbGknKTtcblx0Y2hvaWNlcy5yZW1vdmVDbGFzcygnc2ktcXVpei1zZWxlY3RlZCcpO1xufVxuZnVuY3Rpb24gaW5pdFF1aXooKSB7XG5cdGZvciAoa2V5IGluIHNsaWRlcykge1xuXHRcdGlmIChzbGlkZXNba2V5XS50eXBlID09PSAncXVpeicpIHtcblx0XHRcdGlmIChzbGlkZXNba2V5XS5xdWl6LnJhZGlvID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRzbGlkZXNba2V5XS5xdWl6LnJhZGlvID0gZmFsc2U7XG5cdFx0XHR9IGVsc2UgaWYgKHNsaWRlc1trZXldLnF1aXoucmFkaW8pIHtcblx0XHRcdFx0JCgnIycgKyBrZXkgKyAnIC5zaS1xdWl6X19qcycpLmFkZENsYXNzKCdzaS1yYWRpb19fanMnKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0dmFyIHF1aXp6ZXMgPSAkKCcuc2ktcXVpel9fanMnKTtcblx0dmFyIGJ1dHRvblR5cGUgPSBnbG9iYWxWYXIuYnV0dG9uVHlwZTtcblx0cXVpenplcy5lYWNoKGZ1bmN0aW9uIChpZHgsIHF1aXopIHtcblx0XHR2YXIgY2hvaWNlcyA9ICQocXVpeikuZmluZCgnbGknKTtcblx0XHR2YXIgYnV0dG9ucyA9ICQocXVpeikuZmluZCgnZGl2Jyk7XG5cdFx0dmFyIGlzUmFkaW8gPSAkKHF1aXopLmhhc0NsYXNzKCdzaS1yYWRpb19fanMnKSA/IHRydWUgOiBmYWxzZTtcblx0XHRjaG9pY2VzLmVhY2goZnVuY3Rpb24gKGlkeCwgY2hvaWNlKSB7XG5cdFx0XHQkKGNob2ljZSkuYWRkQ2xhc3MoJ3NpLXF1aXotYW5zd2VyJykuYXR0cigndGFiaW5kZXgnLCAnMCcpO1xuXHRcdFx0JChjaG9pY2UpLm9uKCdjbGljay5xdWl6JywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRzaUF1ZGlvLnNmeC5jbGljay5wbGF5KCk7XG5cdFx0XHRcdGlmIChpc1JhZGlvKSB7XG5cdFx0XHRcdFx0Y2hvaWNlcy5yZW1vdmVDbGFzcygnc2ktcXVpei1zZWxlY3RlZCcpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICgkKHRoaXMpLmhhc0NsYXNzKCdzaS1xdWl6LXNlbGVjdGVkJykpIHtcblx0XHRcdFx0XHQkKHRoaXMpLnJlbW92ZUNsYXNzKCdzaS1xdWl6LXNlbGVjdGVkJyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JCh0aGlzKS5hZGRDbGFzcygnc2ktcXVpei1zZWxlY3RlZCcpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdCQoY2hvaWNlKS5vbigna2V5dXAucXVpeicsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0aWYgKGV2ZW50LndoaWNoID09PSAxMykge1xuXHRcdFx0XHRcdHNpQXVkaW8uc2Z4LmNsaWNrLnBsYXkoKTtcblx0XHRcdFx0XHRpZiAoaXNSYWRpbykge1xuXHRcdFx0XHRcdFx0Y2hvaWNlcy5yZW1vdmVDbGFzcygnc2ktcXVpei1zZWxlY3RlZCcpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoJCh0aGlzKS5oYXNDbGFzcygnc2ktcXVpei1zZWxlY3RlZCcpKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLnJlbW92ZUNsYXNzKCdzaS1xdWl6LXNlbGVjdGVkJyk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdCQodGhpcykuYWRkQ2xhc3MoJ3NpLXF1aXotc2VsZWN0ZWQnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdGJ1dHRvbnMuZWFjaChmdW5jdGlvbiAoaWR4LCBidXR0b24pIHtcblx0XHRcdHZhciBpbWFnZSA9ICQoYnV0dG9uKS5jaGlsZHJlbigpLmVxKDApO1xuXHRcdFx0aWYgKGlzUmFkaW8pIHtcblx0XHRcdFx0JChpbWFnZSkuYXR0cignc3JjJywgZnVuY3Rpb24gKGluZGV4LCBhdHRyKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGF0dHIucmVwbGFjZSgnbWNxJywgJ3NjcScpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCQoaW1hZ2UpLmF0dHIoJ3NyYycsIGZ1bmN0aW9uIChpbmRleCwgYXR0cikge1xuXHRcdFx0XHRcdHJldHVybiBhdHRyLnJlcGxhY2UoJ3NjcScsICdtY3EnKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdCQoYnV0dG9uKVxuXHRcdFx0XHQuZmluZCgnaW1nJylcblx0XHRcdFx0LmF0dHIoJ3NyYycsIGZ1bmN0aW9uIChpbmRleCwgYXR0cikge1xuXHRcdFx0XHRcdHJldHVybiBhdHRyLnJlcGxhY2UoJ2NsYXNzaWMnLCBidXR0b25UeXBlKTtcblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0pO1xufVxuZnVuY3Rpb24gcXVpekZ1bmN0aW9uKCkge1xuXHR2YXIgYW5zd2VycyA9IHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdWydxdWl6J11bJ2Fuc3dlcnMnXTtcblx0dmFyIGNob2ljZXMgPSAkKCcjJyArIGdsb2JhbFZhci5jdXJTbGlkZSArICcgLnNpLXF1aXpfX2pzIGxpJyk7XG5cdGlmICghc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ3Zpc2l0ZWQnXSAmJiBnbG9iYWxWYXIuZGV2TW9kZSkge1xuXHRcdGNob2ljZXMuZWFjaChmdW5jdGlvbiAoaWR4LCBjaG9pY2UpIHtcblx0XHRcdGlmIChhbnN3ZXJzWyQoY2hvaWNlKS5hdHRyKCdpZCcpXSkge1xuXHRcdFx0XHQkKGNob2ljZSkuY3NzKCdjb2xvcicsICdibHVlJyk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0cmVzZXRRdWl6KCk7XG5cdH1cbn1cbiIsImZ1bmN0aW9uIGZvcm1GdW5jdGlvbnMoKSB7XG5cdHZhciAkZm9ybSA9ICQoJyMnICsgZ2xvYmFsVmFyLmN1clNsaWRlICsgJyBmb3JtJyk7XG5cblx0aWYgKCFzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5mb3JtLmRvbnRHZW5lcmF0ZSkge1xuXHRcdGdlbmVyYXRlRm9ybSgkZm9ybSk7XG5cdH1cblxuXHR2YXIgaGFzU3VibWl0ID0gISEkZm9ybS5maW5kKCdpbnB1dFt0eXBlPXN1Ym1pdF0nKS5sZW5ndGg7XG5cblx0JGZvcm0uYWRkQ2xhc3MoJ2Zvcm0tc3R5bGUnKTtcblx0JGZvcm0udHJpZ2dlcigncmVzZXQnKTtcblxuXHRpZiAoIWhhc1N1Ym1pdCkge1xuXHRcdCRmb3JtLmFwcGVuZCgnPGlucHV0IHR5cGU9XCJzdWJtaXRcIi8+Jyk7XG5cdH1cblxuXHQkZm9ybS5vbignc3VibWl0LnJlcS1mb3JtJywgZnVuY3Rpb24gKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdH0pO1xuXG5cdHZhciBpbnB1dHMgPSAkZm9ybS5maW5kKCdpbnB1dCcpO1xuXHRpbnB1dHMua2V5dXAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciAkdGhpcyA9ICQodGhpcyk7XG5cdFx0dmFyIGNoYXJhY3RlcnMgPSAkdGhpcy52YWwoKS5sZW5ndGg7XG5cdFx0dmFyIG1heExlbmd0aCA9ICR0aGlzLmF0dHIoJ21heExlbmd0aCcpO1xuXHRcdHZhciBsYXN0SW5wdXQgPSAkdGhpcy5uZXh0KCkuaGFzQ2xhc3MoJ2NoZWNrYm94Jyk7XG5cblx0XHRpZiAoY2hhcmFjdGVycyA9PSBtYXhMZW5ndGggJiYgIWxhc3RJbnB1dCkge1xuXHRcdFx0JHRoaXMubmV4dCgpLmZvY3VzKCk7XG5cdFx0fVxuXHR9KTtcblx0aW5wdXRzLmtleWRvd24oZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoKGUud2hpY2ggPT0gOCB8fCBlLndoaWNoID09IDQ2KSAmJiAkKHRoaXMpLnZhbCgpID09ICcnKSB7XG5cdFx0XHQkKHRoaXMpLnByZXYoJ2lucHV0JykuZm9jdXMoKTtcblx0XHR9XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBjaGVja0Zvcm0oKSB7XG5cdHZhciBmaWVsZHMgPSBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5mb3JtLmZpZWxkcztcblxuXHRmb3IgKHZhciBrZXkgaW4gZmllbGRzKSB7XG5cdFx0dmFyIGZpZWxkID0gZmllbGRzW2tleV07XG5cdFx0dmFyIHJlc3VsdCA9ICcnO1xuXHRcdHZhciBpbnB1dHMgPSAkKCcjJyArIGdsb2JhbFZhci5jdXJTbGlkZSArICcgLicgKyBmaWVsZC5jbGFzcyk7XG5cdFx0dmFyIGFuc3dlciA9IGZpZWxkLmFuc3dlcjtcblx0XHR2YXIgY2FzZVNlbnNpdGl2ZSA9IGZpZWxkc1trZXldLmNhc2VTZW5zaXRpdmU7XG5cdFx0dmFyIHVzZXJBbnN3ZXIgPSAnJztcblxuXHRcdGlmIChmaWVsZC5hbnN3ZXIpIHtcblx0XHRcdGlmIChmaWVsZC50eXBlID09PSAnY2hlY2tib3gnKSB7XG5cdFx0XHRcdHZhciBzZWxlY3RlZEFuc3dlciA9IGlucHV0cy5maWx0ZXIoJzpjaGVja2VkJylbMF07XG5cdFx0XHRcdGlmIChzZWxlY3RlZEFuc3dlcikgdXNlckFuc3dlciA9IHNlbGVjdGVkQW5zd2VyLnZhbHVlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aW5wdXRzLmVhY2goZnVuY3Rpb24gKGksIGlucHV0KSB7XG5cdFx0XHRcdFx0dXNlckFuc3dlciArPSBpbnB1dC52YWx1ZTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIWNhc2VTZW5zaXRpdmUpIHtcblx0XHRcdFx0YW5zd2VyID0gYW5zd2VyLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdHVzZXJBbnN3ZXIgPSB1c2VyQW5zd2VyLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHR9XG5cblx0XHRcdHJlc3VsdCA9IHVzZXJBbnN3ZXIgPT09IGFuc3dlcjtcblxuXHRcdFx0Y29uc29sZS5sb2codXNlckFuc3dlciwgYW5zd2VyKTtcblx0XHRcdGNvbnNvbGUubG9nKHJlc3VsdCk7XG5cdFx0XHRpZiAoIXJlc3VsdCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiB2YWxpZEZvcm0oKSB7XG5cdHZhciB2YWxpZCA9IHRydWU7XG5cdHZhciByZXF1aXJlZEZpZWxkcyA9ICQoJyMnICsgZ2xvYmFsVmFyLmN1clNsaWRlKVxuXHRcdC5maW5kKCdpbnB1dCx0ZXh0YXJlYSxzZWxlY3QnKVxuXHRcdC5maWx0ZXIoJ1tyZXF1aXJlZF0nKTtcblx0cmVxdWlyZWRGaWVsZHMuZWFjaChmdW5jdGlvbiAoaSwgZmllbGQpIHtcblx0XHRpZiAoZmllbGQudmFsdWUgPT09ICcnKSB7XG5cdFx0XHR2YWxpZCA9IGZhbHNlO1xuXHRcdFx0JCgnIycgKyBnbG9iYWxWYXIuY3VyU2xpZGUgKyAnIGZvcm0nKVxuXHRcdFx0XHQuZmluZCgnaW5wdXRbdHlwZT1zdWJtaXRdJylcblx0XHRcdFx0LnRyaWdnZXIoJ2NsaWNrJyk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9KTtcblx0cmV0dXJuIHZhbGlkO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUZvcm0oJGZvcm0pIHtcblx0dmFyIGZpZWxkcyA9IHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLmZvcm0uZmllbGRzO1xuXG5cdCRmb3JtLmh0bWwoJycpO1xuXHRmb3IgKHZhciBrZXkgaW4gZmllbGRzKSB7XG5cdFx0dmFyIGZpZWxkID0gZmllbGRzW2tleV07XG5cblx0XHR2YXIgaW5wdXRJRCA9IGdsb2JhbFZhci5jdXJTbGlkZS50b0xvd2VyQ2FzZSgpICsgJy0nICsgZmllbGQuY2xhc3M7XG5cblx0XHRpZiAoZmllbGQubGFiZWwpIHtcblx0XHRcdHZhciBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XG5cblx0XHRcdGxhYmVsLmh0bWxGb3IgPSBpbnB1dElEO1xuXHRcdFx0JChsYWJlbCkudGV4dChmaWVsZC5sYWJlbCk7XG5cblx0XHRcdCRmb3JtLmFwcGVuZChsYWJlbCk7XG5cdFx0fVxuXHRcdC8vIGVzdGFibGlzaCB0eXBlXG5cdFx0c3dpdGNoIChmaWVsZC50eXBlKSB7XG5cdFx0XHRjYXNlICdjaGVja2JveCc6XG5cdFx0XHRcdGZpZWxkLm9wdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAob3B0aW9uKSB7XG5cdFx0XHRcdFx0dmFyIG9wdGlvbkxhYmVsID0gb3B0aW9uLnRvTG93ZXJDYXNlKCkuc3BsaXQoJyAnKS5qb2luKCctJyk7XG5cdFx0XHRcdFx0dmFyIHJhZGlvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcblx0XHRcdFx0XHR2YXIgcmFkaW9MYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XG5cblx0XHRcdFx0XHRyYWRpb0xhYmVsLmh0bWxGb3IgPSBmaWVsZC5jbGFzcyArICctJyArIG9wdGlvbkxhYmVsO1xuXHRcdFx0XHRcdCQocmFkaW9MYWJlbCkuYWRkQ2xhc3MoZmllbGQuY2xhc3MgKyAnLWNvbnRhaW5lciByYWRpby1jb250YWluZXInKTtcblxuXHRcdFx0XHRcdHJhZGlvLnNldEF0dHJpYnV0ZSgndHlwZScsICdyYWRpbycpO1xuXHRcdFx0XHRcdHJhZGlvLmlkID0gZmllbGQuY2xhc3MgKyAnLScgKyBvcHRpb25MYWJlbDtcblx0XHRcdFx0XHRyYWRpby5yZXF1aXJlZCA9ICFmaWVsZC5vcHRpb25hbDtcblx0XHRcdFx0XHRyYWRpby5uYW1lID0gZmllbGQuY2xhc3M7XG5cdFx0XHRcdFx0cmFkaW8udmFsdWUgPSBvcHRpb247XG5cdFx0XHRcdFx0JChyYWRpbykuYWRkQ2xhc3MoZmllbGQuY2xhc3MpO1xuXG5cdFx0XHRcdFx0JGZvcm0uYXBwZW5kKHJhZGlvTGFiZWwpO1xuXHRcdFx0XHRcdCQocmFkaW9MYWJlbCkuYXBwZW5kKHJhZGlvKTtcblxuXHRcdFx0XHRcdHN3aXRjaCAoZmllbGQuc3R5bGUpIHtcblx0XHRcdFx0XHRcdGNhc2UgJ3gnOlxuXHRcdFx0XHRcdFx0XHR2YXIgY3VzdG9tQ2hlY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cblx0XHRcdFx0XHRcdFx0JChyYWRpbykuYWRkQ2xhc3MoJ2hpZGUtcmFkaW8nKTtcblx0XHRcdFx0XHRcdFx0JChjdXN0b21DaGVjaykuYWRkQ2xhc3MoZmllbGQuY2xhc3MgKyAnLXN0eWxlIHgtc3R5bGUnKTtcblxuXHRcdFx0XHRcdFx0XHQkKHJhZGlvTGFiZWwpLmFwcGVuZChjdXN0b21DaGVjayk7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0Y2FzZSAnZG90Jzpcblx0XHRcdFx0XHRcdFx0dmFyIGN1c3RvbUNoZWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXG5cdFx0XHRcdFx0XHRcdCQocmFkaW8pLmFkZENsYXNzKCdoaWRlLXJhZGlvJyk7XG5cdFx0XHRcdFx0XHRcdCQoY3VzdG9tQ2hlY2spLmFkZENsYXNzKGZpZWxkLmNsYXNzICsgJy1zdHlsZSBkb3Qtc3R5bGUnKTtcblxuXHRcdFx0XHRcdFx0XHQkKHJhZGlvTGFiZWwpLmFwcGVuZChjdXN0b21DaGVjayk7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoZmllbGQubGFiZWxzKSB7XG5cdFx0XHRcdFx0XHR2YXIgc0xhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXG5cdFx0XHRcdFx0XHQkKHNMYWJlbCkuYWRkQ2xhc3MoZmllbGQuY2xhc3MgKyAnLW9wdGlvbi1sYWJlbCcpO1xuXHRcdFx0XHRcdFx0JChzTGFiZWwpLnRleHQob3B0aW9uKTtcblxuXHRcdFx0XHRcdFx0JChyYWRpb0xhYmVsKS5hcHBlbmQoc0xhYmVsKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2Ryb3Bkb3duJzpcblx0XHRcdFx0dmFyIGRyb3Bkb3duID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG5cdFx0XHRcdGRyb3Bkb3duLmlkID0gaW5wdXRJRDtcblx0XHRcdFx0ZHJvcGRvd24ucmVxdWlyZWQgPSAhZmllbGQub3B0aW9uYWw7XG5cdFx0XHRcdCQoZHJvcGRvd24pLmFkZENsYXNzKGZpZWxkLmNsYXNzICsgJyAnICsgZmllbGQuY2xhc3MgKyAnLXN0eWxlJyk7XG5cdFx0XHRcdCQoZHJvcGRvd24pLmFwcGVuZCgnPG9wdGlvbiB2YWx1ZT1cIlwiPlNlbGVjdCBPbmU8L29wdGlvbj4nKTtcblx0XHRcdFx0ZmllbGQub3B0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChvcHRpb24pIHtcblx0XHRcdFx0XHQkKGRyb3Bkb3duKS5hcHBlbmQoJzxvcHRpb24gdmFsdWU9XCInICsgb3B0aW9uICsgJ1wiPicgKyBvcHRpb24gKyAnPC9vcHRpb24+Jyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHQkZm9ybS5hcHBlbmQoZHJvcGRvd24pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdC8vIGNyZWF0ZSBmaWVsZFxuXHRcdFx0XHRpZiAoIWZpZWxkLnNlcGFyYXRlKSB7XG5cdFx0XHRcdFx0dmFyIHRleHRJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cblx0XHRcdFx0XHR0ZXh0SW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQnKTtcblx0XHRcdFx0XHR0ZXh0SW5wdXQucmVxdWlyZWQgPSAhZmllbGQub3B0aW9uYWw7XG5cdFx0XHRcdFx0dGV4dElucHV0LmlkID0gaW5wdXRJRDtcblx0XHRcdFx0XHRpZiAoZmllbGQubWF4TGVuZ3RoKSB0ZXh0SW5wdXQubWF4TGVuZ3RoID0gZmllbGQubWF4TGVuZ3RoO1xuXHRcdFx0XHRcdGlmIChmaWVsZC5wbGFjZWhvbGRlcikgdGV4dElucHV0LnBsYWNlaG9sZGVyID0gZmllbGQucGxhY2Vob2xkZXI7XG5cdFx0XHRcdFx0JCh0ZXh0SW5wdXQpLmFkZENsYXNzKGZpZWxkLmNsYXNzICsgJyAnICsgZmllbGQuY2xhc3MgKyAnLXN0eWxlJyk7XG5cblx0XHRcdFx0XHQkZm9ybS5hcHBlbmQodGV4dElucHV0KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBzZXBhcmF0ZSBmaWVsZHMgcGVyIGxldHRlclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZmllbGQuYW5zd2VyLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHR2YXIgdGV4dElucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFpKSB0ZXh0SW5wdXQuaWQgPSBpbnB1dElEO1xuXHRcdFx0XHRcdFx0dGV4dElucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0Jyk7XG5cdFx0XHRcdFx0XHR0ZXh0SW5wdXQubWF4TGVuZ3RoID0gMTtcblx0XHRcdFx0XHRcdHRleHRJbnB1dC5yZXF1aXJlZCA9ICFmaWVsZC5vcHRpb25hbDtcblx0XHRcdFx0XHRcdCQodGV4dElucHV0KS5hZGRDbGFzcyhcblx0XHRcdFx0XHRcdFx0ZmllbGQuY2xhc3MgK1xuXHRcdFx0XHRcdFx0XHRcdCcgJyArXG5cdFx0XHRcdFx0XHRcdFx0ZmllbGQuY2xhc3MgK1xuXHRcdFx0XHRcdFx0XHRcdCctc3R5bGUgJyArXG5cdFx0XHRcdFx0XHRcdFx0ZmllbGQuY2xhc3MgK1xuXHRcdFx0XHRcdFx0XHRcdCctJyArXG5cdFx0XHRcdFx0XHRcdFx0KGkgKyAxKSArXG5cdFx0XHRcdFx0XHRcdFx0Jy1zdHlsZSBzZXBhcmF0ZWQnXG5cdFx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0XHQkZm9ybS5hcHBlbmQodGV4dElucHV0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG59XG4iLCJ2YXIgY2hhcHRlck5hdmlnYXRpb25TbGlkZXMgPSBbJ1YxJywgJ0kxJywgJ0kyJywgJ0kzJ107XG52YXIgY2hhcHRlckNvbXBsZXRpb25TbGlkZXMgPSBbJ1YxJywgJ0kxJywgJ0kyJywgJ0kzJ107XG5cbmZ1bmN0aW9uIGluaXRTaWRlTWVudSgpIHtcblx0dmFyICRtZW51ID0gJCgnI3NpLXNpZGUtbWVudScpO1xuXHR2YXIgJGNvbnRhaW5lciA9ICQoJyNzaS1zaWRlLW1lbnUtY29udGFpbmVyJyk7XG5cdHZhciBidXR0b25zID0gJCgnLnNpLW1lbnUtbmF2aWdhdGlvbicpLmZpbmQoJ2J1dHRvbicpO1xuXG5cdCRtZW51Lm9uKCdjbGljay5zdG9wJywgZnVuY3Rpb24gKGUpIHtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHR9KTtcblx0JGNvbnRhaW5lci5vbignY2xpY2suc2lkZScsIGZ1bmN0aW9uIChlKSB7XG5cdFx0Y2xvc2VTaWRlTWVudSgpO1xuXHR9KTtcblxuXHRidXR0b25zLmVhY2goZnVuY3Rpb24gKGlkeCwgYnV0dG9uKSB7XG5cdFx0JChidXR0b24pLm9uKCdjbGljay5zaWRlJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIGlkID0gY2hhcHRlck5hdmlnYXRpb25TbGlkZXNbaWR4XTtcblx0XHRcdGp1bXBUb0lkKGlkKTtcblx0XHRcdGNsb3NlU2lkZU1lbnUoKTtcblx0XHR9KTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIG9wZW5TaWRlTWVudSgpIHtcblx0dmFyICRtZW51ID0gJCgnI3NpLXNpZGUtbWVudScpO1xuXHR2YXIgJGNvbnRhaW5lciA9ICQoJyNzaS1zaWRlLW1lbnUtY29udGFpbmVyJyk7XG5cblx0JGNvbnRhaW5lci5hZGRDbGFzcygnbWVudS1vcGVuJyk7XG5cdCRtZW51LmFkZENsYXNzKCdtZW51LW9wZW4nKTtcblx0Ly8gdGhpcyBpcyBmb3IgcGF1c2luZyB0aGUgdmlkZW8gd2hlbiB5b3Ugb3BlbiB0aGUgc2lkZSBtZW51XG5cdHZhciB0eXBlID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0udHlwZTtcblx0aWYgKHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLnZpZGVvTG9hZGVkICYmIHR5cGUgPT0gJ3ZpZGVvJykge1xuXHRcdHZpZGVvanMoZ2xvYmFsVmFyLiRjdXJTbGlkZS5maW5kKCd2aWRlbycpWzBdLmlkKS5wYXVzZSgpO1xuXHR9XG5cblx0aGFuZGxlU2lkZUJ1dHRvbnMoKTtcbn1cblxuZnVuY3Rpb24gY2xvc2VTaWRlTWVudSgpIHtcblx0dmFyICRtZW51ID0gJCgnI3NpLXNpZGUtbWVudScpO1xuXHR2YXIgJGNvbnRhaW5lciA9ICQoJyNzaS1zaWRlLW1lbnUtY29udGFpbmVyJyk7XG5cblx0JGNvbnRhaW5lci5yZW1vdmVDbGFzcygnbWVudS1vcGVuJyk7XG5cdCRtZW51LnJlbW92ZUNsYXNzKCdtZW51LW9wZW4nKTtcblx0Ly8gdW5wYXVzZSB0aGUgdmlkZW8gd2hlbiB5b3UgY2xvc2UgdGhlIHNpZGUgbWVudVxuXHR2YXIgdHlwZSA9IHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLnR5cGU7XG5cdGlmIChzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS52aWRlb0xvYWRlZCAmJiB0eXBlID09ICd2aWRlbycpIHtcblx0XHRpZiAodmlkZW9qcyhnbG9iYWxWYXIuJGN1clNsaWRlLmZpbmQoJ3ZpZGVvJylbMF0uaWQpLnBhdXNlZCgpKSB7XG5cdFx0XHR2aWRlb2pzKGdsb2JhbFZhci4kY3VyU2xpZGUuZmluZCgndmlkZW8nKVswXS5pZCkucGxheSgpO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBoYW5kbGVTaWRlQnV0dG9ucygpIHtcblx0dmFyIGJ1dHRvbnMgPSAkKCcuc2ktbWVudS1uYXZpZ2F0aW9uJykuZmluZCgnYnV0dG9uJyk7XG5cdHZhciBjaGVja3MgPSAkKCcuc2ktbWVudS1jaGVja3NfX2pzJyk7XG5cblx0bG9jaygkKGJ1dHRvbnMpKTtcblx0dW5sb2NrKCQoYnV0dG9uc1swXSkpO1xuXHRidXR0b25zLmVhY2goZnVuY3Rpb24gKGlkeCwgYnV0dG9uKSB7XG5cdFx0aWYgKGdldENvbXBsZXRpb25TdGF0dXMoY2hhcHRlckNvbXBsZXRpb25TbGlkZXNbaWR4XSkpIHtcblx0XHRcdCQoY2hlY2tzW2lkeF0pLmFkZENsYXNzKCdjb21wbGV0ZWQnKTtcblx0XHRcdGlmIChidXR0b25zW2lkeCArIDFdKSB7XG5cdFx0XHRcdHVubG9jaygkKGJ1dHRvbnNbaWR4ICsgMV0pKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xufVxuIiwiZnVuY3Rpb24gaW5pdE5hdmlnYXRpb24oKSB7XG5cdHZhciBzd2FwU3R5bGVzID0gJCgnLnNpLW5hdi1zdHlsZV9fanMnKTtcblx0dmFyIHN3YXBJbWFnZXMgPSAkKCcuc2ktaW1nLXN3YXBfX2pzJyk7XG5cdHZhciBidXR0b25UeXBlID0gZ2xvYmFsVmFyLmJ1dHRvblR5cGU7XG5cblx0Ly8gc3dhcCBhbGwgc3R5bGUgcmVsYXRlZCBpbWFnZXNcblx0c3dhcEltYWdlcy5lYWNoKGZ1bmN0aW9uIChpZHgsIGltYWdlKSB7XG5cdFx0JChpbWFnZSkuYXR0cignc3JjJywgZnVuY3Rpb24gKGluZGV4LCBhdHRyKSB7XG5cdFx0XHRyZXR1cm4gYXR0ci5yZXBsYWNlKCdjbGFzc2ljJywgYnV0dG9uVHlwZSk7XG5cdFx0fSk7XG5cdH0pO1xuXHRzd2FwU3R5bGVzLmVhY2goZnVuY3Rpb24gKGlkeCwgbmF2KSB7XG5cdFx0JChuYXYpLmFkZENsYXNzKCdzaS1uYXYtc3R5bGUtJyArIGJ1dHRvblR5cGUpO1xuXHR9KTtcblxuXHRhdHRhY2hOYXZFdmVudExpc3RlbmVycygpO1xufVxuXG5mdW5jdGlvbiBzaG93TmF2RWxlbWVudHMoKSB7XG5cdHZhciBuYXZCdXR0b25zID0gJCgnLnNpLW5hdl9fanMnKTtcblx0dmFyIGljb25DbGFzc2VzID0gJ3NpLWNsaWNrLWljb24gc2ktZHJhZy11cC1pY29uIHNpLWRyYWctZG93bi1pY29uIHNpLWRyYWctbGVmdC1pY29uIHNpLWRyYWctcmlnaHQtaWNvbic7XG5cdHZhciAkY2xpY2sgPSAkKCcjc2ktY2xpY2staWNvbicpO1xuXHQkKG5hdkJ1dHRvbnMpLmhpZGUoKTtcblx0JGNsaWNrLnJlbW92ZUNsYXNzKGljb25DbGFzc2VzKTtcblxuXHRpZiAoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0ubmF2RWxlbWVudHMgPT09IHVuZGVmaW5lZCkge1xuXHRcdHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLm5hdkVsZW1lbnRzID0gW107XG5cdH1cblxuXHR2YXIgbmF2aWdhdGlvbiA9IHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLm5hdkVsZW1lbnRzO1xuXHRuYXZpZ2F0aW9uLmZvckVhY2goZnVuY3Rpb24gKG5hdikge1xuXHRcdHN3aXRjaCAobmF2KSB7XG5cdFx0XHRjYXNlICdzdGFydC1zbGlkZSc6XG5cdFx0XHRcdCQoJyNzaS1jbG9jaycpLnNob3coKTtcblx0XHRcdFx0JCgnI3NpLXN0YXJ0Jykuc2hvdygpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3N0YW5kYXJkLWhvbWUnOlxuXHRcdFx0XHQkKCcjc2ktbG9nbycpLnNob3coKTtcblx0XHRcdFx0JCgnI3NpLXByb2dyZXNzJykuc2hvdygpO1xuXHRcdFx0XHQkKCcjc2ktaG9tZScpLnNob3coKTtcblx0XHRcdFx0JCgnI3NpLWJhY2snKS5zaG93KCk7XG5cdFx0XHRcdGlmIChnZXRDb21wbGV0aW9uU3RhdHVzKCkpIHtcblx0XHRcdFx0XHQkKCcjc2ktbmV4dCcpLnNob3coKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3N0YW5kYXJkLW1lbnUnOlxuXHRcdFx0XHQkKCcjc2ktbG9nbycpLnNob3coKTtcblx0XHRcdFx0JCgnI3NpLXByb2dyZXNzJykuc2hvdygpO1xuXHRcdFx0XHQkKCcjc2ktbWVudScpLnNob3coKTtcblx0XHRcdFx0JCgnI3NpLWJhY2snKS5zaG93KCk7XG5cdFx0XHRcdGlmIChnZXRDb21wbGV0aW9uU3RhdHVzKCkpIHtcblx0XHRcdFx0XHQkKCcjc2ktbmV4dCcpLnNob3coKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2V4aXQtc2xpZGUnOlxuXHRcdFx0XHQkKCcjc2ktcHJvZ3Jlc3MnKS5zaG93KCk7XG5cdFx0XHRcdCQoJyNzaS1leGl0Jykuc2hvdygpO1xuXHRcdFx0XHQkKCcjc2ktcmVwbGF5Jykuc2hvdygpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2NsaWNrLWljb24nOlxuXHRcdFx0XHQkY2xpY2tcblx0XHRcdFx0XHQuc2hvdygpXG5cdFx0XHRcdFx0LnJlbW92ZUNsYXNzKGljb25DbGFzc2VzKVxuXHRcdFx0XHRcdC5hZGRDbGFzcygnc2ktJyArIG5hdik7XG5cdFx0XHRcdGhpZGVDbGlja0ljb24oKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdkcmFnLXVwLWljb24nOlxuXHRcdFx0XHQkY2xpY2tcblx0XHRcdFx0XHQuc2hvdygpXG5cdFx0XHRcdFx0LnJlbW92ZUNsYXNzKGljb25DbGFzc2VzKVxuXHRcdFx0XHRcdC5hZGRDbGFzcygnc2ktJyArIG5hdik7XG5cdFx0XHRcdGhpZGVDbGlja0ljb24oKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdkcmFnLWRvd24taWNvbic6XG5cdFx0XHRcdCRjbGlja1xuXHRcdFx0XHRcdC5zaG93KClcblx0XHRcdFx0XHQucmVtb3ZlQ2xhc3MoaWNvbkNsYXNzZXMpXG5cdFx0XHRcdFx0LmFkZENsYXNzKCdzaS0nICsgbmF2KTtcblx0XHRcdFx0aGlkZUNsaWNrSWNvbigpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2RyYWctbGVmdC1pY29uJzpcblx0XHRcdFx0JGNsaWNrXG5cdFx0XHRcdFx0LnNob3coKVxuXHRcdFx0XHRcdC5yZW1vdmVDbGFzcyhpY29uQ2xhc3Nlcylcblx0XHRcdFx0XHQuYWRkQ2xhc3MoJ3NpLScgKyBuYXYpO1xuXHRcdFx0XHRoaWRlQ2xpY2tJY29uKCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnZHJhZy1yaWdodC1pY29uJzpcblx0XHRcdFx0JGNsaWNrXG5cdFx0XHRcdFx0LnNob3coKVxuXHRcdFx0XHRcdC5yZW1vdmVDbGFzcyhpY29uQ2xhc3Nlcylcblx0XHRcdFx0XHQuYWRkQ2xhc3MoJ3NpLScgKyBuYXYpO1xuXHRcdFx0XHRoaWRlQ2xpY2tJY29uKCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0aWYgKG5hdlswXSA9PT0gJyEnKSAkKCcjc2ktJyArIG5hdi5zcGxpdCgnIScpWzFdKS5oaWRlKCk7XG5cdFx0XHRcdGVsc2UgJCgnI3NpLScgKyBuYXYpLnNob3coKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gYXR0YWNoTmF2RXZlbnRMaXN0ZW5lcnMoKSB7XG5cdCQoJyNzaS1ob21lJykub24oJ2NsaWNrIHRvdWNoJywgZnVuY3Rpb24gKCkge1xuXHRcdHNpQXVkaW8uc2Z4LmNsaWNrLnBsYXkoKTtcblx0XHRqdW1wVG9TbGlkZShnbG9iYWxWYXIuaG9tZVNsaWRlKTtcblx0fSk7XG5cblx0JCgnI3NpLW1lbnUnKS5vbignY2xpY2sgdG91Y2gnLCBmdW5jdGlvbiAoKSB7XG5cdFx0c2lBdWRpby5zZnguY2xpY2sucGxheSgpO1xuXHRcdG9wZW5TaWRlTWVudSgpO1xuXHR9KTtcblxuXHQkKCcjc2ktZnVsbCcpLm9uKCdjbGljayB0b3VjaCcsIGZ1bmN0aW9uICgpIHtcblx0XHRzaUF1ZGlvLnNmeC5jbGljay5wbGF5KCk7XG5cdFx0dG9nZ2xlRnVsbHNjcmVlbigpO1xuXHR9KTtcblxuXHQkKCcjc2ktYmFjaycpLm9uKCdjbGljayB0b3VjaCcsIGZ1bmN0aW9uICgpIHtcblx0XHRzaUF1ZGlvLnNmeC5jbGljay5wbGF5KCk7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ2JhY2tBY3Rpb24nXSkge1xuXHRcdFx0XHRzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5iYWNrQWN0aW9uKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwcmV2U2xpZGUoKTtcblx0XHRcdH1cblx0XHR9LCAxMDApO1xuXHR9KTtcblxuXHQkKCcjc2ktbmV4dCcpLm9uKCdjbGljayB0b3VjaCcsIGZ1bmN0aW9uICgpIHtcblx0XHRzaUF1ZGlvLnNmeC5jbGljay5wbGF5KCk7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ25leHRBY3Rpb24nXSkge1xuXHRcdFx0XHRzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5uZXh0QWN0aW9uKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRuZXh0U2xpZGUoKTtcblx0XHRcdH1cblx0XHR9LCAxMDApO1xuXHR9KTtcblxuXHQkKCcjc2ktcmVwbGF5Jykub24oJ2NsaWNrIHRvdWNoJywgZnVuY3Rpb24gKCkge1xuXHRcdHNpQXVkaW8uc2Z4LmNsaWNrLnBsYXkoKTtcblx0XHRqdW1wVG9TbGlkZSgwKTtcblx0fSk7XG5cblx0JCgnI3NpLWV4aXQnKS5vbignY2xpY2sgdG91Y2gnLCBmdW5jdGlvbiAoKSB7XG5cdFx0c2lBdWRpby5zZnguY2xpY2sucGxheSgpO1xuXHRcdHdpbmRvdy5jbG9zZSgpO1xuXHR9KTtcblxuXHQkKCcjc2ktc3RhcnQnKS5vbignY2xpY2sgdG91Y2gnLCBmdW5jdGlvbiAoKSB7XG5cdFx0c2lBdWRpby5zZnguY2xpY2sucGxheSgpO1xuXHRcdGlmIChzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXVsnbmV4dEFjdGlvbiddKSB7XG5cdFx0XHRzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5uZXh0QWN0aW9uKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG5leHRTbGlkZSgpO1xuXHRcdH1cblx0fSk7XG5cblx0JCgnI3NpLXN1Ym1pdCcpLm9uKCdjbGljayB0b3VjaCcsIGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgdGhpc1NsaWRlID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV07XG5cdFx0aWYgKHRoaXNTbGlkZS50eXBlID09PSAnZm9ybScgJiYgIXZhbGlkRm9ybSgpKSByZXR1cm47XG5cblx0XHRzaUF1ZGlvLnNmeC5jbGljay5wbGF5KCk7XG5cdFx0dmFyIGJvbCA9IGNoZWNrUXVlc3Rpb24odGhpc1NsaWRlLnR5cGUpO1xuXHRcdGhhbmRsZUFuc3dlcihib2wpO1xuXHR9KTtcblxuXHQkKCcjc2ktcmVzZXQnKS5vbignY2xpY2sgdG91Y2gnLCBmdW5jdGlvbiAoKSB7XG5cdFx0c2lBdWRpby5zZnguY2xpY2sucGxheSgpO1xuXHRcdHN3aXRjaCAoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0udHlwZSkge1xuXHRcdFx0Y2FzZSAnZG5kJzpcblx0XHRcdFx0dmFyIGRuZEFyZ3MgPSBkbmRSZXNldE9iamVjdFtnbG9iYWxWYXIuY3VyU2xpZGVdO1xuXHRcdFx0XHRyZXNldERuRChkbmRBcmdzWyd0aW1lJ10sIGRuZEFyZ3NbJ2Fuc3dlcnMnXSk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnc29ydCc6XG5cdFx0XHRcdHJlc2V0U29ydCgpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3F1aXonOlxuXHRcdFx0XHRyZXNldFF1aXooKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdob3RzcG90Jzpcblx0XHRcdFx0cmVzZXRIb3RzcG90KCk7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRpZiAoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ2N1c3RvbVJlc2V0J10pIHtcblx0XHRcdFx0XHRzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5jdXN0b21SZXNldCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fSk7XG5cdCQoJyNzaS1jdXN0b20tc3VibWl0Jykub24oJ2NsaWNrIHRvdWNoJywgZnVuY3Rpb24gKCkge1xuXHRcdHZhciB0aGlzU2xpZGUgPSBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXTtcblx0XHRpZiAodGhpc1NsaWRlLnR5cGUgPT09ICdmb3JtJyAmJiAhdmFsaWRGb3JtKCkpIHJldHVybjtcblxuXHRcdHNpQXVkaW8uc2Z4LmNsaWNrLnBsYXkoKTtcblx0XHRpZiAoc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bJ2N1c3RvbVN1Ym1pdCddKSB7XG5cdFx0XHRzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5jdXN0b21TdWJtaXQoKTtcblx0XHR9XG5cdH0pO1xuXG5cdCQoJy5zaS1tZW51LWNsb3NlcicpLm9uKCdjbGljayB0b3VjaCcsIGZ1bmN0aW9uICgpIHtcblx0XHRjbG9zZVNpZGVNZW51KCk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBoaWRlQ2xpY2tJY29uKCkge1xuXHQkKCcjJyArIGdsb2JhbFZhci5jdXJTbGlkZSkub2ZmKCdtb3VzZWRvd24uaWNvbicpO1xuXHQkKCcjJyArIGdsb2JhbFZhci5jdXJTbGlkZSkub24oJ21vdXNlZG93bi5pY29uJywgZnVuY3Rpb24gKCkge1xuXHRcdCQoJyNzaS1jbGljay1pY29uJykuaGlkZSgpO1xuXHRcdCQoJyMnICsgZ2xvYmFsVmFyLmN1clNsaWRlKS5vZmYoJ21vdXNlZG93bi5pY29uJyk7XG5cdH0pO1xufVxuXG4vLyBmdW5jdGlvbiB1c2VkIGJ5IGZ1bGxzY3JlZW4gbmF2IGJ1dHRvblxuZnVuY3Rpb24gdG9nZ2xlRnVsbHNjcmVlbigpIHtcblx0dmFyIGVsZW1lbnQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cdHZhciBmdWxsc2NyZWVuID1cblx0XHRkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCB8fFxuXHRcdGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbGVtZW50IHx8XG5cdFx0ZG9jdW1lbnQubXNGdWxsc2NyZWVuRWxlbWVudCB8fFxuXHRcdGRvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbGVtZW50O1xuXHRpZiAoZnVsbHNjcmVlbikge1xuXHRcdHZhciByZXF1ZXN0TWV0aG9kID1cblx0XHRcdGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuIHx8XG5cdFx0XHRkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbiB8fFxuXHRcdFx0ZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxTY3JlZW4gfHxcblx0XHRcdGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4gfHxcblx0XHRcdGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW47XG5cblx0XHRpZiAocmVxdWVzdE1ldGhvZCkge1xuXHRcdFx0cmVxdWVzdE1ldGhvZC5hcHBseShkb2N1bWVudCk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHZhciByZXF1ZXN0TWV0aG9kID1cblx0XHRcdGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4gfHxcblx0XHRcdGVsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4gfHxcblx0XHRcdGVsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4gfHxcblx0XHRcdGVsZW1lbnQubW96UmVxdWVzdEZ1bGxTY3JlZW4gfHxcblx0XHRcdGVsZW1lbnQubXNSZXF1ZXN0RnVsbHNjcmVlbjtcblxuXHRcdGlmIChyZXF1ZXN0TWV0aG9kKSB7XG5cdFx0XHRyZXF1ZXN0TWV0aG9kLmFwcGx5KGVsZW1lbnQpO1xuXHRcdH1cblx0fVxufVxuXG4vLyBmdW5jdGlvbiBpbmZvS2V5Ym9hcmQoKSB7XG4vLyAgICAgdmFyIGluZm9JdGVtcyA9ICQoJy5pbmZvSXRlbScpO1xuLy8gICAgIHZhciBpZHggPSAwO1xuLy8gICAgICQoJyNJbmZvX0Nsb3NlcicpLmZvY3VzKCk7XG5cbi8vICAgICAkKCdib2R5Jykub24oJ2tleWRvd24uZHJhZycsIGZ1bmN0aW9uIChldmVudCkge1xuLy8gICAgICAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbi8vICAgICAgICAgICAgIGNhc2UgOTogLy9yZXN0cmljdHMgdGFiIG1vdmVtZW50IHRvIGluZm8gb3ZlcmxheSBlbGVtZW50c1xuLy8gICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4vLyAgICAgICAgICAgICAgICAgaWYgKGlkeCA8IGluZm9JdGVtcy5sZW5ndGggLSAxKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIGlkeCArPSAxO1xuLy8gICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIGlkeCA9IDA7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgICQoaW5mb0l0ZW1zW2lkeF0pLmZvY3VzKCk7XG4vLyAgICAgICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgICAgICBjYXNlIDI3OiAvLyBhbGxvd3MgdXNlciB0byBwcmVzcyBlc2NhcGUga2V5IHRvIHJldHVybiB0byBub3JtYWxcbi8vICAgICAgICAgICAgICAgICAkKCcjSW5mb19DbG9zZXInKS50cmlnZ2VyKCdjbGljaycpO1xuLy8gICAgICAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgICAgICAgICAgZGVmYXVsdDpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbi8vICAgICAgICAgfVxuLy8gICAgIH0pO1xuLy8gfVxuIiwidmFyIGN1ckNoYXB0ZXI7XG52YXIgc2F2ZURhdGEgPSB7fTtcbnZhciBib29rbWFya2VkU2xpZGU7XG52YXIgY2hhcnRQcm9ncmVzc1JlY29yZGVkID0ge307XG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XG5cdGluaXRDb3Vyc2UoKTtcblx0ZG9jdW1lbnRTZXR1cCgpO1xuXHRjaGFydFByb2dyZXNzKCk7XG5cdGlmICghZ2xvYmFsVmFyLmRldk1vZGUgJiYgKGxtc0Nvbm5lY3RlZCB8fCB1c2VMb2NhbCkpIHtcblx0XHRqdW1wVG9TbGlkZShib29rbWFya2VkU2xpZGUpO1xuXHR9XG5cdC8vIEVsZW1lbnRzIHRvIGluamVjdFxuXHR2YXIgbXlTVkdzVG9JbmplY3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdpbWcuaW5qZWN0LW1lJyk7XG5cdC8vIERvIHRoZSBpbmplY3Rpb24uIGtlZXAgbGFzdCEhIVxuXHRTVkdJbmplY3RvcihteVNWR3NUb0luamVjdCk7XG59KTtcblxuZnVuY3Rpb24gZmlyc3RUaW1lU2V0dXAoKSB7XG5cdC8vZmlyc3QgYW5kIG9ubHkgZXhlY3V0aW9uIG9mIGNvZGUsIHdoZW4gdGhlIGNvdXJzZSBzdGFydHMgZmlyc3QgdGltZSBnaXZlcyBhbGwgc2xpZGVzIGEgbnVtYmVyIGFuZCBzZXRzIGRlZmF1bHRzIGZvciB1c2VyIGF0dGVtcHRzIGFuZCB0cnlzXG5cdHZhciBrZXlzID0gT2JqZWN0LmtleXMoc2xpZGVzKTtcblx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXksIGlkeCkge1xuXHRcdHZhciB0eXBlID0gc2xpZGVzW2tleV0udHlwZTtcblxuXHRcdC8vIGdpdmUgc2xpZGVudW1iZXIgdXNlZCBmb3IgYm9va21hcmtpbmdcblx0XHRpZiAoc2xpZGVzW2tleV0uc2xpZGVOdW1iZXIgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0c2xpZGVzW2tleV0uc2xpZGVOdW1iZXIgPSBpZHggKyAxO1xuXHRcdH1cblx0XHQvLyBzZXQgdXNlciBhdHRlbXB0cyBhbmQgdHJ5cyBpZiBub3QgZGVmaW5lZFxuXHRcdGlmIChzbGlkZXNba2V5XVt0eXBlXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRpZiAoc2xpZGVzW2tleV1bdHlwZV0udXNlckF0dGVtcHRzID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0c2xpZGVzW2tleV1bdHlwZV0udXNlckF0dGVtcHRzID0gMDtcblx0XHRcdH1cblx0XHRcdGlmIChzbGlkZXNba2V5XVt0eXBlXS50cnlzID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0c2xpZGVzW2tleV1bdHlwZV0udHJ5cyA9IDA7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHNsaWRlc1trZXldW3R5cGVdID0ge1xuXHRcdFx0XHR1c2VyQXR0ZW1wdHM6IDAsXG5cdFx0XHRcdHRyeXM6IDBcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Ly8gQ3JlYXRlIHRoZSBvYmplY3Qgc2VudCB0byB0aGUgTE1TIHRvIHBlcnNpc3Qgc2xpZGUgY29tcGxldGlvblxuXHRcdC8vIHNldCBpbmNsdWRlIHRvIGZhbHNlIG9uIGEgc2xpZGUgaW4gb3JkZXIgdG8gZXhjbHVkZSBpdCBmcm9tIHRoZSBjb3Vyc2UgcHJvZ3Jlc3Npb25cblx0XHRpZiAoc2xpZGVzW2tleV0uaW5jbHVkZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRzbGlkZXNba2V5XS5pbmNsdWRlID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoc2xpZGVzW2tleV0uaW5jbHVkZSkge1xuXHRcdFx0dmFyIHBhdGggPSBzbGlkZXNba2V5XS5jb21wbGV0aW9uUGF0aDtcblxuXHRcdFx0aWYgKCFzYXZlRGF0YS5zbGlkZUNvbXBsZXRpb24pIHNhdmVEYXRhLnNsaWRlQ29tcGxldGlvbiA9IHt9O1xuXG5cdFx0XHR2YXIgc2xpZGVDb21wbGV0aW9uID0gc2F2ZURhdGEuc2xpZGVDb21wbGV0aW9uO1xuXG5cdFx0XHRpZiAocGF0aCkge1xuXHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShwYXRoKSkge1xuXHRcdFx0XHRcdHBhdGguZm9yRWFjaChmdW5jdGlvbiAocCwgaSkge1xuXHRcdFx0XHRcdFx0aWYgKCFzbGlkZUNvbXBsZXRpb25bcF0pIHNsaWRlQ29tcGxldGlvbltwXSA9IHt9O1xuXHRcdFx0XHRcdFx0aWYgKCFzbGlkZUNvbXBsZXRpb25bcF1ba2V5XSkgc2xpZGVDb21wbGV0aW9uW3BdW2tleV0gPSAwO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmICghc2xpZGVDb21wbGV0aW9uW3BhdGhdKSBzbGlkZUNvbXBsZXRpb25bcGF0aF0gPSB7fTtcblx0XHRcdFx0XHRpZiAoIXNsaWRlQ29tcGxldGlvbltwYXRoXVtrZXldKSBzbGlkZUNvbXBsZXRpb25bcGF0aF1ba2V5XSA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICghc2xpZGVDb21wbGV0aW9uLm1haW5QYXRoKSBzbGlkZUNvbXBsZXRpb24ubWFpblBhdGggPSB7fTtcblx0XHRcdFx0aWYgKCFzbGlkZUNvbXBsZXRpb24ubWFpblBhdGhba2V5XSkgc2xpZGVDb21wbGV0aW9uLm1haW5QYXRoW2tleV0gPSAwO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59XG5cbmZ1bmN0aW9uIGRvY3VtZW50U2V0dXAoKSB7XG5cdGluaXRQcmVsb2FkZXIoKTtcblx0Z2xvYmFsVmFyLmN1clNsaWRlID0gJCgnc2VjdGlvbicgKyAnLnByZXNlbnQnKVswXS5pZDtcblx0Zmlyc3RUaW1lU2V0dXAoKTtcblx0aW5pdEF1ZGlvKCk7XG5cdCQoJ2FzaWRlJykucmVtb3ZlKCk7XG5cdGluaXROYXZpZ2F0aW9uKCk7XG5cdGluaXRTaWRlTWVudSgpO1xuXG5cdGZvciAoa2V5IGluIHNsaWRlcykge1xuXHRcdGlmIChzbGlkZXNba2V5XS50eXBlID09ICd2aWRlbycpIHtcblx0XHRcdGdsb2JhbFZhci52aWRlb1NlZW5ba2V5XSA9IGZhbHNlO1xuXHRcdH1cblx0fVxuXHRpZiAoZ2xvYmFsVmFyLmRldk1vZGUpIHtcblx0XHRkZXZNb2RlKCk7XG5cdH1cblxuXHRpZiAoJCgnI3NpLXByb2dyZXNzLW1ldGVyJykubGVuZ3RoICE9IDApIHtcblx0XHRjaGFydEluaXRpYXRlKCk7XG5cdH1cblx0aW5pdEZlZWRiYWNrcygpO1xuXHRpbml0UXVpeigpO1xuXHRpbml0TWVudSgpO1xuXHRmdW5jdGlvbkNhbGxzKCk7XG5cdHJhbmRvbWl6ZVF1ZXN0aW9uU2xpZGVzKCk7XG5cblx0UmV2ZWFsLmFkZEV2ZW50TGlzdGVuZXIoJ3NsaWRlY2hhbmdlZCcsIGZ1bmN0aW9uIChlKSB7XG5cdFx0JCgnI3NpLW5hdi1jb250YWluZXInKS5yZW1vdmVDbGFzcygndmpzLWZhZGUtb3V0Jyk7XG5cdFx0Z2xvYmFsVmFyLmN1clNsaWRlID0gZS5jdXJyZW50U2xpZGUuaWQ7XG5cdFx0Z2xvYmFsVmFyLiRjdXJTbGlkZSA9ICQoZS5jdXJyZW50U2xpZGUpO1xuXG5cdFx0Y2xvc2VTaWRlTWVudSgpO1xuXHRcdGlmIChzbGlkZXNbZS5wcmV2aW91c1NsaWRlLmlkXSAmJiB0eXBlb2Ygc2xpZGVzW2UucHJldmlvdXNTbGlkZS5pZF0ub25FeGl0QWN0aW9uID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRzbGlkZXNbZS5wcmV2aW91c1NsaWRlLmlkXS5vbkV4aXRBY3Rpb24oKTtcblx0XHR9XG5cdFx0ZnVuY3Rpb25DYWxscygpO1xuXHR9KTtcblxuXHQvL3NldCBmb250IHNpemVzXG5cdHZhciBmb250U2l6ZSA9ICQoJy5zbGlkZXMnKS53aWR0aCgpIC8gZ2xvYmFsVmFyLmZvbnRTaXplRmFjdG9yO1xuXHQkKCdodG1sJykuY3NzKCdmb250LXNpemUnLCBmb250U2l6ZSk7XG5cblx0JCh3aW5kb3cpLnJlc2l6ZShmdW5jdGlvbiAoKSB7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgZm9udFNpemUgPSAkKCcuc2xpZGVzJykud2lkdGgoKSAvIGdsb2JhbFZhci5mb250U2l6ZUZhY3Rvcjtcblx0XHRcdCQoJ2h0bWwnKS5jc3MoJ2ZvbnQtc2l6ZScsIGZvbnRTaXplKTtcblx0XHR9LCAxKTtcblx0fSk7XG5cblx0JCgnaW1nJykub24oJ2RyYWdzdGFydCcsIGZ1bmN0aW9uIChldmVudCkge1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBhY3Rpb25zT25FdmVyeVNsaWRlRW50ZXIoKSB7XG5cdC8vd2hhdGV2ZXIgeW91IHdhbnQgdG8gZXhlY3V0ZSBvbiBldmVyeSBzbGlkZSBjaGFuZ2Vcbn1cblxuLy9leGVjdXRlIHdoYXRldmVyIGlzIGluc2lkZSBvbkVudGVyQWN0aW9uLCBzZXRzIHZpc2l0ZWQgdG8gdHJ1ZVxuZnVuY3Rpb24gb25FbnRlckFjdGlvbihpZCkge1xuXHRpZiAoc2xpZGVzW2lkXS52aXNpdGVkID09PSB1bmRlZmluZWQpIHtcblx0XHRzbGlkZXNbaWRdLnZpc2l0ZWQgPSBmYWxzZTtcblx0fVxuXG5cdCQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpO1xuXHRpZiAoc2lBdWRpb1tnbG9iYWxWYXIuY3VyU2xpZGVdLm9uRW50ZXIpIHtcblx0XHRpZiAoc2lBdWRpby5zZnguY2xpY2sucGxheWluZygpKSB7XG5cdFx0XHRzaUF1ZGlvLnNmeC5jbGljay5vbmNlKCdlbmQnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdEhvd2xlci5zdG9wKCk7XG5cdFx0XHRcdHNpQXVkaW9bZ2xvYmFsVmFyLmN1clNsaWRlXS5vbkVudGVyLnBsYXkoKTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRIb3dsZXIuc3RvcCgpO1xuXHRcdFx0c2lBdWRpb1tnbG9iYWxWYXIuY3VyU2xpZGVdLm9uRW50ZXIucGxheSgpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRpZiAoc2lBdWRpby5zZnguY2xpY2sucGxheWluZygpKSB7XG5cdFx0XHRzaUF1ZGlvLnNmeC5jbGljay5vbmNlKCdlbmQnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdEhvd2xlci5zdG9wKCk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0SG93bGVyLnN0b3AoKTtcblx0XHR9XG5cdH1cblxuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoc2xpZGVzW2lkXS5vbkVudGVyQWN0aW9uICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHNsaWRlc1tpZF0ub25FbnRlckFjdGlvbigpO1xuXHRcdH1cblxuXHRcdHNsaWRlc1tpZF0udmlzaXRlZCA9IHRydWU7XG5cdH0sIDEwKTtcblx0aWYgKGxtc0Nvbm5lY3RlZCAmJiBpZCAhPT0gJ3N0YXJ0Jykge1xuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0c2F2ZUxNUygpO1xuXHRcdH0sIDEwMDApO1xuXHR9XG5cdGlmICh1c2VMb2NhbCAmJiBpZCAhPT0gJ3N0YXJ0Jykge1xuXHRcdHNhdmVQcm9ncmVzc0xvY2FsbHkoKTtcblx0fVxufVxuXG4vL09yZGVyIG9mIGNhbGxpbmcgdGhlIGZ1bmN0aW9ucyB0byBnZW5lcmF0ZSB0aGUgY3VycmVudCBzbGlkZVxuZnVuY3Rpb24gZnVuY3Rpb25DYWxscygpIHtcblx0JCgnYm9keScpLm9mZigpO1xuXHRnbG9iYWxWYXIuJGN1clNsaWRlID0gJCgnLnNsaWRlcyA+IHNlY3Rpb24ucHJlc2VudCcpO1xuXHRnbG9iYWxWYXIuY3VyU2xpZGUgPSAkKCcuc2xpZGVzID4gLnByZXNlbnQnKVswXS5pZDtcblxuXHRvbkVudGVyQWN0aW9uKGdsb2JhbFZhci5jdXJTbGlkZSk7XG5cdGFjdGlvbnNPbkV2ZXJ5U2xpZGVFbnRlcigpO1xuXHRzaG93TmF2RWxlbWVudHMoKTtcblx0ZWxlbWVudHNGYWRpbmdPblNsaWRlKCk7XG5cblx0c3dpdGNoIChzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS50eXBlKSB7XG5cdFx0Y2FzZSAnbWVudSc6XG5cdFx0XHRtZW51RnVuY3Rpb25zKCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdkbmQnOlxuXHRcdFx0ZG5kRnVuY3Rpb25zKCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdzb3J0Jzpcblx0XHRcdHNvcnRGdW5jdGlvbnMoKTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ2hvdHNwb3QnOlxuXHRcdFx0aG90c3BvdEZ1bmN0aW9ucygpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnZm9ybSc6XG5cdFx0XHRmb3JtRnVuY3Rpb25zKCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdxdWl6Jzpcblx0XHRcdHF1aXpGdW5jdGlvbigpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAndmlkZW8nOlxuXHRcdFx0dmlkZW9DaGVjaygpO1xuXHRcdFx0YnJlYWs7XG5cdFx0ZGVmYXVsdDpcblx0XHRcdGJyZWFrO1xuXHR9XG5cblx0aWYgKCQoJyNzaS1wcm9ncmVzcy1tZXRlcicpLmxlbmd0aCAhPSAwKSB7XG5cdFx0Y2hhcnRQcm9ncmVzcygpO1xuXHR9XG5cblx0Ly8gSUU5IEJ1Z2ZpeFxuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHQkKCdzZWN0aW9uLmZ1dHVyZScpLmNzcygnZGlzcGxheScsICdub25lJyk7XG5cdFx0JCgnc2VjdGlvbi5wYXN0JykuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcblx0fSwgNTUpO1xufVxuXG4vLy8vLy8vLy8vLy8qRmVhdHVyZTogUXVlc3Rpb24gQ2hlY2sgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vIFRoaXMgZnVuY3Rpb24gY29udGFpbnMgdGhlIG1haW4gbG9naWMgaW4gZGV0ZXJtaW5pbmcgaWYgYSBxdWVzdGlvbiBpcyByaWdodCBvciB3cm9uZ1xuLy8gSXQgZGV0ZXJtaW5lcyB0aGUgcXVlc3Rpb24gdHlwZSwgcnVucyB0aGUgbG9naWMgZm9yIHRoYXQgdHlwZSBhbmQgcmV0dXJucyBhIGJvb2xlYW5cbi8vIFRoaXMgYm9vbGVhbiwgY2FsbGVkIGJvbCwgIGlzIGZlZCBhcyBhbiBhcmd1bWVudCB0byBGQkNoZWNrKGJvbCkgd2hpY2ggaXMgcmVzcG9uc2libGUgZm9yIGhhbmRsaW5nIGZlZWRiYWNrIHJlc3BvbnNlc1xuXG4vLyBUbyBhZGQgdW5pcXVlIGxvZ2ljIGZvciBhIGN1c3RvbSB0eXBlLCBleHRlbmQgdGhlIG1haW4gc3dpdGNoIHN0YXRlbWVudCwgYXNzaWduIHRydWUgb3IgZmFsc2UgdG8gYm9sLCB0aGVuICdicmVhaydcbmZ1bmN0aW9uIGNoZWNrUXVlc3Rpb24odHlwZSkge1xuXHR2YXIgYm9sID0gdHJ1ZTtcblx0dmFyIGJvbDI7XG5cdHN3aXRjaCAodHlwZSkge1xuXHRcdGNhc2UgJ3F1aXonOlxuXHRcdFx0dmFyIGNvcnJlY3RBbnN3ZXJzID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0ucXVpei5hbnN3ZXJzO1xuXHRcdFx0dmFyIHNlbGVjdGVkQW5zd2VycyA9IHt9O1xuXHRcdFx0dmFyIGNob2ljZXMgPSAkKCcjJyArIGdsb2JhbFZhci5jdXJTbGlkZSArICcgLnNpLXF1aXotYW5zd2VyJyk7XG5cdFx0XHRjaG9pY2VzLmVhY2goZnVuY3Rpb24gKGlkeCwgY2hvaWNlKSB7XG5cdFx0XHRcdHZhciBpZCA9ICQoY2hvaWNlKS5hdHRyKCdpZCcpO1xuXHRcdFx0XHRpZiAoJChjaG9pY2UpLmhhc0NsYXNzKCdzaS1xdWl6LXNlbGVjdGVkJykpIHtcblx0XHRcdFx0XHRzZWxlY3RlZEFuc3dlcnNbaWRdID0gMTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZWxlY3RlZEFuc3dlcnNbaWRdID0gMDtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIWNvcnJlY3RBbnN3ZXJzW2lkXSkge1xuXHRcdFx0XHRcdGNvcnJlY3RBbnN3ZXJzW2lkXSA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Zm9yIChhbnN3ZXIgaW4gc2VsZWN0ZWRBbnN3ZXJzKSB7XG5cdFx0XHRcdGlmIChjb3JyZWN0QW5zd2Vyc1thbnN3ZXJdICE9PSBzZWxlY3RlZEFuc3dlcnNbYW5zd2VyXSkge1xuXHRcdFx0XHRcdGJvbCA9IGZhbHNlO1xuXHRcdFx0XHRcdHJldHVybiBib2w7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICghYm9sKSB7XG5cdFx0XHRcdHJldHVybiBib2w7XG5cdFx0XHR9XG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdob3RzcG90Jzpcblx0XHRcdHZhciBxdWl6ID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0uaG90c3BvdC5xdWl6O1xuXHRcdFx0aWYgKCFxdWl6KSB0aHJvdyAnXFxuSG90c3BvdCBFcnJvcjpcXG55b3UgaGF2ZSB0byB0dXJuIG9uIHRoZSBcInF1aXpcIiBzZXR0aW5ncyB0byB1c2UgaG90c3BvdHMgdGhpcyB3YXknO1xuXHRcdFx0aWYgKCFxdWl6LmFuc3dlcnMubGVuZ3RoKSB0aHJvdyAnXFxuSG90c3BvdCBFcnJvcjpcXG5xdWl6IGFuc3dlcnMgbXVzdCBiZSBpbiBhbiBhcnJheSc7XG5cdFx0XHRpZiAocXVpei50eXBlID09PSAnc2NxJyAmJiBxdWl6LmFuc3dlcnMubGVuZ3RoID4gMSlcblx0XHRcdFx0dGhyb3cgJ1xcbkhvdHNwb3QgRXJyb3I6XFxuZm9yIHR5cGUgXCJzY3FcIiB5b3UgbXVzdCBoYXZlIG9ubHkgb25lIGFuc3dlcic7XG5cdFx0XHR2YXIgY29ycmVjdEFuc3dlcnMgPSBxdWl6LmFuc3dlcnM7XG5cdFx0XHR2YXIgc2VsZWN0ZWRBbnN3ZXJzID0gcXVpei5zZWxlY3RlZEFuc3dlcnM7XG5cdFx0XHRib2wgPSBKU09OLnN0cmluZ2lmeShzZWxlY3RlZEFuc3dlcnMpID09PSBKU09OLnN0cmluZ2lmeShjb3JyZWN0QW5zd2Vycyk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdmb3JtJzpcblx0XHRcdGJvbCA9IGNoZWNrRm9ybSgpO1xuXHRcdFx0aWYgKCFib2wpIHJldHVybjtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ2RuZCc6XG5cdFx0XHR2YXIgdXNlckFuc3dlcnMgPSBnbG9iYWxWYXIuZG5kQW5zd2Vycztcblx0XHRcdGZvciAoa2V5IGluIHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdLmRuZC5xdWl6KSB7XG5cdFx0XHRcdHZhciBjb3JyZWN0QW5zd2VyID0gc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV0uZG5kLnF1aXpba2V5XS5zb3J0KCk7XG5cdFx0XHRcdHZhciB1c2VyQW5zd2VyID0gdXNlckFuc3dlcnNba2V5XS5zb3J0KCk7XG5cdFx0XHRcdGlmIChzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5kbmQubXVsdGlwbGVBbnN3ZXJzKSB7XG5cdFx0XHRcdFx0dmFyIGluY2x1ZGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRpZiAodXNlckFuc3dlci5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRcdGluY2x1ZGVkID0gZmFsc2U7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmIChjb3JyZWN0QW5zd2VyLmluZGV4T2YodXNlckFuc3dlclswXSkgPCAwKSB7XG5cdFx0XHRcdFx0XHRcdGluY2x1ZGVkID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICghaW5jbHVkZWQpIHtcblx0XHRcdFx0XHRcdGJvbCA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGJvbDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aWYgKGNvcnJlY3RBbnN3ZXIubGVuZ3RoICE9PSB1c2VyQW5zd2VyLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0Ym9sID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRyZXR1cm4gYm9sO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvcnJlY3RBbnN3ZXIuZm9yRWFjaChmdW5jdGlvbiAoYW5zd2VyLCBpZHgpIHtcblx0XHRcdFx0XHRcdGlmICh1c2VyQW5zd2VyW2lkeF0gIT09IGFuc3dlcikge1xuXHRcdFx0XHRcdFx0XHRib2wgPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGJvbDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChib2wgPT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGJvbDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnc29ydCc6XG5cdFx0XHRib2wgPSB0cnVlO1xuXHRcdFx0dmFyIGxpc3RBcnJheSA9IE9iamVjdC5rZXlzKHNsaWRlc1tnbG9iYWxWYXIuY3VyU2xpZGVdW3R5cGVdLnNvcnRhYmxlcyk7XG5cdFx0XHR2YXIgYW5zd2VyQXJyYXkgPSBbXTtcblx0XHRcdGxpc3RBcnJheS5mb3JFYWNoKGZ1bmN0aW9uIChsaXN0KSB7XG5cdFx0XHRcdGFuc3dlckFycmF5LnB1c2goc2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bdHlwZV0uc29ydGFibGVzW2xpc3RdLmFuc3dlcik7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gY2hlY2sgdGhhdCBhbnN3ZXJzIGhhdmUgYmVlbiBwcm92aWRlZCBmb3IgYWxsIHNvcnRhYmxlIGxpc3RzIGJlZm9yZSBwcm9jZWVkaW5nXG5cdFx0XHRpZiAobGlzdEFycmF5Lmxlbmd0aCAhPT0gYW5zd2VyQXJyYXkubGVuZ3RoKSB7XG5cdFx0XHRcdGJvbCA9IGZhbHNlO1xuXHRcdFx0XHRyZXR1cm4gYm9sO1xuXHRcdFx0fVxuXG5cdFx0XHRsaXN0QXJyYXkuZm9yRWFjaChmdW5jdGlvbiAobGlzdElkLCBpZHgpIHtcblx0XHRcdFx0dmFyIHBvc3NpYmxlQW5zd2VyID0gJCgnIycgKyBsaXN0SWQpLnNvcnRhYmxlKCd0b0FycmF5Jyk7XG5cblx0XHRcdFx0Ly8gSW5jb3JyZWN0IGlmIHRoZSBhbW91bnQgb2YgaXRlbXMgaW4gdGhlIGNoZWNrZWQgc29ydGFibGUgZG9lcyBub3QgbWF0Y2ggdGhlIGFtb3VudCBvZiBhbnN3ZXJzIHByb3ZpZGVkIGluIHRoZSBhbnN3ZXIga2V5XG5cdFx0XHRcdGlmIChwb3NzaWJsZUFuc3dlci5sZW5ndGggIT09IGFuc3dlckFycmF5W2lkeF0ubGVuZ3RoKSB7XG5cdFx0XHRcdFx0Ym9sID0gZmFsc2U7XG5cdFx0XHRcdFx0cmV0dXJuIGJvbDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEV4Y3V0ZXMgaWYgdW5vcmRlcmVkIGtleSBpcyBzZXQgdG8gZmFsc2Ugb3IgaWYga2V5IGlzIGFic2VudFxuXHRcdFx0XHQvLyBUaGlzIGJyYW5jaCBpcyBvbmx5IGNvcnJlY3QgaWYgdGhlIHN1Ym1pdHRlZCBhbnN3ZXIgbWF0Y2hlcyB0aGUgYW5zd2VyIGtleSBpbiBib3RoIGNvbnRlbnQgQU5EIG9yZGVyXG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHRzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXVt0eXBlXS51bm9yZGVyZWQgPT09IGZhbHNlIHx8XG5cdFx0XHRcdFx0c2xpZGVzW2dsb2JhbFZhci5jdXJTbGlkZV1bdHlwZV0udW5vcmRlcmVkID09PSB1bmRlZmluZWRcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0cG9zc2libGVBbnN3ZXIuZm9yRWFjaChmdW5jdGlvbiAoYW5zd2VyLCBpZHgyKSB7XG5cdFx0XHRcdFx0XHRpZiAoYW5zd2VyICE9PSBhbnN3ZXJBcnJheVtpZHhdW2lkeDJdKSB7XG5cdFx0XHRcdFx0XHRcdGJvbCA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gYm9sO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdC8vIEV4ZWN1dGVzIGlmIHVub3JkZXJlZCBrZXkgaXMgc2V0IHRvIHRydWUuXG5cdFx0XHRcdFx0Ly8gVGhpcyBicmFuY2ggaXMgY29ycmVjdCBpZiB0aGUgc3VibWl0dGVkIGFuc3dlciBtYXRjaGVzIHRoZSBhbnN3ZXIga2V5IGluIGNvbnRlbnQgb25seS4gT3JkZXIgaXMgaXJyZWxldmFudFxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHBvc3NpYmxlQW5zd2VyLmZvckVhY2goZnVuY3Rpb24gKGFuc3dlcikge1xuXHRcdFx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdFx0XHQhYW5zd2VyQXJyYXlbaWR4XS5zb21lKGZ1bmN0aW9uIChlbCkge1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybiBlbCA9PT0gYW5zd2VyO1xuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHRcdGJvbCA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gYm9sO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdGJyZWFrO1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHRib2wgPSBmYWxzZTtcblx0XHRcdGJyZWFrO1xuXHR9IC8vZW5kIHN3aXRjaFxuXHRyZXR1cm4gYm9sO1xufSAvL2NoZWNrUXVlc3Rpb25cbi8vLy8vLy8vLy8qRmVhdHVyZTpTaHVmZmxlZCBTbGlkZXMvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmZ1bmN0aW9uIGp1bXBUb1NodWZmbGVkU2xpZGUocGFydCkge1xuXHR2YXIgbiA9IGdsb2JhbFZhci5zaHVmZmxlZFNsaWRlc1twYXJ0XS5wb2ludGVyO1xuXHRpZiAobiA8IGdsb2JhbFZhci5zaHVmZmxlZFNsaWRlc1twYXJ0XS5zbGlkZXMubGVuZ3RoKSB7XG5cdFx0aWYgKG4gPT0gbnVsbCkge1xuXHRcdFx0Ly9maXJzdCB0aW1lIGNhbGxcblx0XHRcdG4gPSAwO1xuXHRcdH1cblx0XHRqdW1wVG9TbGlkZShnbG9iYWxWYXIuc2h1ZmZsZWRTbGlkZXNbcGFydF0uc2xpZGVzW25dKTtcblx0XHRuKys7XG5cdFx0Z2xvYmFsVmFyLnNodWZmbGVkU2xpZGVzW3BhcnRdLnBvaW50ZXIgPSBuO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHJlc2V0U2h1ZmZsZWRTbGlkZShwYXJ0KSB7XG5cdGdsb2JhbFZhci5zaHVmZmxlZFNsaWRlc1twYXJ0XS5wb2ludGVyID0gbnVsbDtcbn1cblxuLy8vLy8vLy8vKkZlYXR1cmU6UmFuZG9taXplIFF1ZXN0aW9ucy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmZ1bmN0aW9uIHJhbmRvbWl6ZVF1ZXN0aW9uU2xpZGVzKCkge1xuXHRpZiAoZ2xvYmFsVmFyLnJhbmRvbWl6ZVNsaWRlcy51c2VSYW5kb21pemUgPT0gdHJ1ZSkge1xuXHRcdHZhciB4ID0gZ2xvYmFsVmFyLnJhbmRvbWl6ZVNsaWRlcy5zbGlkZXM7XG5cdFx0dmFyIG4gPSBbXTtcblx0XHRpZiAoT2JqZWN0LmtleXMoeCkgIT0gMCkge1xuXHRcdFx0Zm9yIChrZXkgaW4geCkge1xuXHRcdFx0XHRuID0gW107XG5cdFx0XHRcdGlmICh4W2tleV1bMF0gPCB4W2tleV1bMV0pIHtcblx0XHRcdFx0XHQvLzFzdCB2YWx1ZSBtdXN0IGJlIGxlc3MgdGhhbiAybmRcblx0XHRcdFx0XHRmb3IgKHZhciBpID0geFtrZXldWzBdOyBpIDw9IHhba2V5XVsxXTsgaSsrKSB7XG5cdFx0XHRcdFx0XHRuLnB1c2goaSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHNodWZmbGUobik7XG5cdFx0XHRcdFx0bi5wdXNoKHhba2V5XVsyXSk7XG5cdFx0XHRcdFx0Z2xvYmFsVmFyLnNodWZmbGVkU2xpZGVzW2tleV0gPSB7XG5cdFx0XHRcdFx0XHRzbGlkZXM6IG4sXG5cdFx0XHRcdFx0XHRwb2ludGVyOiBudWxsXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuXG4vLy8vLy8vLy8vLy8qRmVhdHVyZTpGYWRpbmcvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5mdW5jdGlvbiBlbGVtZW50c0ZhZGluZ09uU2xpZGUoKSB7XG5cdGlmICgkKCcjJyArIGdsb2JhbFZhci5jdXJTbGlkZSArICcgW2RhdGEtZmFkZUluT3JkZXJdJykubGVuZ3RoICE9IDApIHtcblx0XHR2YXIgYXJ5ID0gW107XG5cdFx0JCgnIycgKyBnbG9iYWxWYXIuY3VyU2xpZGUgKyAnIFtkYXRhLWZhZGVJbk9yZGVyXScpLmVhY2goZnVuY3Rpb24gKCkge1xuXHRcdFx0JCh0aGlzKS5jc3MoJ29wYWNpdHknLCAnMCcpO1xuXHRcdFx0JCh0aGlzKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuXHRcdFx0JCh0aGlzKS5oaWRlKCk7XG5cdFx0XHR2YXIgdGVtcCA9IFtdO1xuXHRcdFx0dmFyIHN0ciA9ICQodGhpcykuZGF0YSgnZmFkZWlub3JkZXInKTtcblx0XHRcdHRlbXBbMF0gPSBzdHI7XG5cdFx0XHR0ZW1wWzFdID0gJCh0aGlzKVswXTtcblx0XHRcdGFyeS5wdXNoKHRlbXApO1xuXHRcdH0pO1xuXHRcdGFyeS5zb3J0KHNvcnRBcnJheU1hdHJpeEZ1bmN0aW9uKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyeS5sZW5ndGg7IGkrKykge1xuXHRcdFx0ZWxlbWVudHNGYWRlSW4oYXJ5W2ldWzFdLCBhcnlbaV1bMF0pO1xuXHRcdH1cblx0fVxuXG5cdGlmICgkKCcjJyArIGdsb2JhbFZhci5jdXJTbGlkZSArICcgW2RhdGEtZmFkZW91dG9yZGVyXScpLmxlbmd0aCAhPSAwKSB7XG5cdFx0dmFyIGFyeSA9IFtdO1xuXHRcdCQoJyMnICsgZ2xvYmFsVmFyLmN1clNsaWRlICsgJyBbZGF0YS1mYWRlb3V0b3JkZXJdJykuZWFjaChmdW5jdGlvbiAoKSB7XG5cdFx0XHQkKHRoaXMpLmNzcygnb3BhY2l0eScsICcxJyk7XG5cdFx0XHQkKHRoaXMpLmNzcygnZGlzcGxheScsICdibG9jaycpO1xuXHRcdFx0JCh0aGlzKS5zaG93KCk7XG5cdFx0XHR2YXIgdGVtcCA9IFtdO1xuXHRcdFx0dmFyIHN0ciA9ICQodGhpcykuZGF0YSgnZmFkZW91dG9yZGVyJyk7XG5cdFx0XHR0ZW1wWzBdID0gc3RyO1xuXHRcdFx0dGVtcFsxXSA9ICQodGhpcylbMF07XG5cdFx0XHRhcnkucHVzaCh0ZW1wKTtcblx0XHR9KTtcblx0XHRhcnkuc29ydChzb3J0QXJyYXlNYXRyaXhGdW5jdGlvbik7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnkubGVuZ3RoOyBpKyspIHtcblx0XHRcdGVsZW1lbnRzRmFkZU91dChhcnlbaV1bMV0sIGFyeVtpXVswXSk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGVsZW1lbnRzRmFkZUluKGVsLCB4KSB7XG5cdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdCQoZWwpLmZhZGVUbygnZmFzdCcsIDEpO1xuXHR9LCB4KTtcbn1cblxuZnVuY3Rpb24gZWxlbWVudHNGYWRlT3V0KGVsLCB4KSB7XG5cdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdCQoZWwpLmZhZGVUbygnZmFzdCcsIDApO1xuXHR9LCB4KTtcbn1cblxuLy8gYXJ5LnNvcnQoc29ydEFycmF5TWF0cml4RnVuY3Rpb24pOyBtdXN0IGJlIGFyeT1bWzQseHhdLFsyLHh4XSxbMSx4eF1dXG5mdW5jdGlvbiBzb3J0QXJyYXlNYXRyaXhGdW5jdGlvbihhLCBiKSB7XG5cdGlmIChhWzBdID09PSBiWzBdKSB7XG5cdFx0cmV0dXJuIDA7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIGFbMF0gPCBiWzBdID8gLTEgOiAxO1xuXHR9XG59XG5cbi8vLy8vLy8vLy8vLypGZWF0dXJlOk1pc2NlbGxhbmVvdXMvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy9zaHVmZmxlIGFuIGFycmF5LCByZXR1cm5zIHNodWZmbGVkIGFycmF5XG4vLyB1c2VkIGluIHNsaWRlIHJhbmRvbWl6ZXIgYW5kIG1jcS9zY3EgcmFuZG9taXplclxuZnVuY3Rpb24gc2h1ZmZsZShhcnJheSkge1xuXHR2YXIgY3VycmVudEluZGV4ID0gYXJyYXkubGVuZ3RoLFxuXHRcdHRlbXBvcmFyeVZhbHVlLFxuXHRcdHJhbmRvbUluZGV4O1xuXHQvLyBXaGlsZSB0aGVyZSByZW1haW4gZWxlbWVudHMgdG8gc2h1ZmZsZS4uLlxuXHR3aGlsZSAoMCAhPT0gY3VycmVudEluZGV4KSB7XG5cdFx0Ly8gUGljayBhIHJlbWFpbmluZyBlbGVtZW50Li4uXG5cdFx0cmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjdXJyZW50SW5kZXgpO1xuXHRcdGN1cnJlbnRJbmRleCAtPSAxO1xuXHRcdC8vIEFuZCBzd2FwIGl0IHdpdGggdGhlIGN1cnJlbnQgZWxlbWVudC5cblx0XHR0ZW1wb3JhcnlWYWx1ZSA9IGFycmF5W2N1cnJlbnRJbmRleF07XG5cdFx0YXJyYXlbY3VycmVudEluZGV4XSA9IGFycmF5W3JhbmRvbUluZGV4XTtcblx0XHRhcnJheVtyYW5kb21JbmRleF0gPSB0ZW1wb3JhcnlWYWx1ZTtcblx0fVxuXHRyZXR1cm4gYXJyYXk7XG59XG5cbi8vYWRkcyBlcXVhbHMvY2hlY2tzIHRvIHNlZSBpZiBhcnJheXMgZXF1YWwgZWFjaCBvdGhlclxuQXJyYXkucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIChhcnJheSkge1xuXHQvLyBpZiB0aGUgb3RoZXIgYXJyYXkgaXMgYSBmYWxzeSB2YWx1ZSwgcmV0dXJuXG5cdGlmICghYXJyYXkpIHJldHVybiBmYWxzZTtcblxuXHQvLyBjb21wYXJlIGxlbmd0aHMgLSBjYW4gc2F2ZSBhIGxvdCBvZiB0aW1lXG5cdGlmICh0aGlzLmxlbmd0aCAhPSBhcnJheS5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuXHRmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdFx0Ly8gQ2hlY2sgaWYgd2UgaGF2ZSBuZXN0ZWQgYXJyYXlzXG5cdFx0aWYgKHRoaXNbaV0gaW5zdGFuY2VvZiBBcnJheSAmJiBhcnJheVtpXSBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0XHQvLyByZWN1cnNlIGludG8gdGhlIG5lc3RlZCBhcnJheXNcblx0XHRcdGlmICghdGhpc1tpXS5lcXVhbHMoYXJyYXlbaV0pKSByZXR1cm4gZmFsc2U7XG5cdFx0fSBlbHNlIGlmICh0aGlzW2ldICE9IGFycmF5W2ldKSB7XG5cdFx0XHQvLyBXYXJuaW5nIC0gdHdvIGRpZmZlcmVudCBvYmplY3QgaW5zdGFuY2VzIHdpbGwgbmV2ZXIgYmUgZXF1YWw6IHt4OjIwfSAhPSB7eDoyMH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHRydWU7XG59O1xuLy8gSGlkZSBtZXRob2QgZnJvbSBmb3ItaW4gbG9vcHNcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShBcnJheS5wcm90b3R5cGUsICdlcXVhbHMnLCB7XG5cdGVudW1lcmFibGU6IGZhbHNlXG59KTtcbiIsInZhciBzY29ybSA9IHBpcHdlcmtzLlNDT1JNOyAvL1Nob3J0Y3V0XG52YXIgbG1zQ29ubmVjdGVkID0gZmFsc2U7XG52YXIgdW5sb2FkZWQgPSBmYWxzZTtcbnZhciB1c2VMb2NhbCA9IGZhbHNlO1xudmFyIGNvdXJzZVVSTCA9IGJ0b2Eod2luZG93LmxvY2F0aW9uLmhyZWYudG9TdHJpbmcoKSk7XG52YXIgcHJvZ3Jlc3NVUkwgPSAncHJvZ3Jlc3MnICsgY291cnNlVVJMO1xudmFyIGJvb2ttYXJrVVJMID0gJ2Jvb2ttYXJrJyArIGNvdXJzZVVSTDtcblxuZnVuY3Rpb24gaW5pdENvdXJzZSgpIHtcblx0Ly8gRG8gd2UgZXZlbiB3YW50IHRvIHRhbGsgdG8gdGhlIExNUz9cblx0aWYgKGdsb2JhbFZhci5zY29ybVNldHRpbmdzLnVzZVNjb3JtKSB7XG5cdFx0aWYgKGdsb2JhbFZhci5zY29ybVNldHRpbmdzLnN0YW5kYXJkLnRvTG93ZXJDYXNlKCkgIT09ICdhaWNjJykge1xuXHRcdFx0Y29ubmVjdFRvU0NPUk1BUEkoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29ubmVjdFRvQUlDQ0FQSSgpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRzaUxvZygnU0NPUk0nLCAnSU5GTycsICdTQ09STSBpcyBkaXNhYmxlZC4nKTtcblx0fVxufVxuXG5mdW5jdGlvbiBjb25uZWN0VG9BSUNDQVBJKCkge1xuXHR2YXIgU0QgPSB3aW5kb3cucGFyZW50O1xuXG5cdGlmICh0eXBlb2YgU0QuU2V0UmVhY2hlZEVuZCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgU0QuQ29tbWl0RGF0YSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHNpTG9nKCdBSUNDJywgJ0FQSScsICdTVUNDRVNTOiBBSUNDIEFQSSBmb3VuZCEnKTtcblx0XHRzaUxvZygnQUlDQycsICdJTklUJywgJ1NVQ0NFU1M6IENvdXJzZSBpcyBub3cgY29ubmVjdGVkIHRvIHRoZSBMTVMhJyk7XG5cdH0gZWxzZSB7XG5cdFx0c2lMb2coJ0FJQ0MnLCAnQVBJJywgJ0VSUk9SOiBBSUNDIEFQSSBub3QgZm91bmQhJyk7XG5cdFx0c2lMb2coJ0FJQ0MnLCAnSU5JVCcsICdFUlJPUjogQ291cnNlIGNvdWxkIG5vdCBjb25uZWN0IHRvIHRoZSBMTVMhJyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gY29ubmVjdFRvU0NPUk1BUEkoKSB7XG5cdHZhciBib29rbWFya0xvY2FsO1xuXHR2YXIgbG9jYWxEYXRhO1xuXHRpZiAodXNlTG9jYWwgJiYgc3RvcmFnZUF2YWlsYWJsZSgnbG9jYWxTdG9yYWdlJykpIHtcblx0XHRib29rbWFya0xvY2FsID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oYm9va21hcmtVUkwpO1xuXHRcdGxvY2FsRGF0YSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0ocHJvZ3Jlc3NVUkwpKTtcblx0fVxuXHQvL3Njb3JtLmluaXQgcmV0dXJucyBhIGJvb2xlYW5cblx0bG1zQ29ubmVjdGVkID0gc2Nvcm0uaW5pdCgpO1xuXHQvL0lmIHRoZSBzY29ybS5pbml0IGZ1bmN0aW9uIHN1Y2NlZWRlZC4uLlxuXHRpZiAobG1zQ29ubmVjdGVkKSB7XG5cdFx0c2lMb2coJ1NDT1JNJywgJ0lOSVQnLCAnU1VDQ0VTUzogQ291cnNlIGlzIG5vdyBjb25uZWN0ZWQgd2l0aCB0aGUgTE1TIScpO1xuXHRcdHZhciBjb21wbGV0aW9uc3RhdHVzO1xuXHRcdHZhciBsZWFybmVybmFtZTtcblx0XHR2YXIgcmF3RGF0YSA9IHNjb3JtLmdldCgnY21pLnN1c3BlbmRfZGF0YScpO1xuXHRcdHZhciBib29rbWFya1Njb3JtO1xuXHRcdHZhciBzY29ybURhdGE7XG5cdFx0aWYgKHNjb3JtLnZlcnNpb24gPT09ICcyMDA0Jykge1xuXHRcdFx0Y29tcGxldGlvbnN0YXR1cyA9IHNjb3JtLmdldCgnY21pLmNvbXBsZXRpb25fc3RhdHVzJyk7XG5cdFx0XHRsZWFybmVybmFtZSA9IHNjb3JtLmdldCgnY21pLmxlYXJuZXJfbmFtZScpO1xuXHRcdFx0Ym9va21hcmtTY29ybSA9IHNjb3JtLmdldCgnY21pLmxvY2F0aW9uJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbXBsZXRpb25zdGF0dXMgPSBzY29ybS5nZXQoJ2NtaS5jb3JlLmxlc3Nvbl9zdGF0dXMnKTtcblx0XHRcdGxlYXJuZXJuYW1lID0gc2Nvcm0uZ2V0KCdjbWkuY29yZS5zdHVkZW50X25hbWUnKTtcblx0XHRcdGJvb2ttYXJrU2Nvcm0gPSBzY29ybS5nZXQoJ2NtaS5jb3JlLmxlc3Nvbl9sb2NhdGlvbicpO1xuXHRcdH1cblx0XHRpZiAocmF3RGF0YSAmJiB0eXBlb2YgcmF3RGF0YSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdHNjb3JtRGF0YSA9IEpTT04ucGFyc2UocmF3RGF0YSk7XG5cdFx0XHRzYXZlRGF0YSA9IHNjb3JtRGF0YTtcblx0XHR9IGVsc2UgaWYgKGxvY2FsRGF0YSkge1xuXHRcdFx0c2F2ZURhdGEgPSBsb2NhbERhdGE7XG5cdFx0fVxuXG5cdFx0aWYgKGJvb2ttYXJrU2Nvcm0pIHtcblx0XHRcdGJvb2ttYXJrZWRTbGlkZSA9IGJvb2ttYXJrU2Nvcm07XG5cdFx0fSBlbHNlIGlmIChib29rbWFya0xvY2FsKSB7XG5cdFx0XHRib29rbWFya2VkU2xpZGUgPSBib29rbWFya0xvY2FsO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRib29rbWFya2VkU2xpZGUgPSAxO1xuXHRcdH1cblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndW5sb2FkJywgdW5sb2FkSGFuZGxlcik7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2JlZm9yZXVubG9hZCcsIHVubG9hZEhhbmRsZXIpO1xuXHRcdC8vSWYgdGhlIGNvdXJzZSBjb3VsZG4ndCBjb25uZWN0IHRvIHRoZSBMTVMgZm9yIHNvbWUgcmVhc29uLi4uXG5cdH0gZWxzZSB7XG5cdFx0Ly8uLi4gbGV0J3MgYWxlcnQgdGhlIHVzZXIgdGhlbiBjbG9zZSB0aGUgd2luZG93LlxuXHRcdHNpTG9nKCdTQ09STScsICdJTklUJywgJ0VSUk9SOiBDb3Vyc2UgY291bGQgbm90IGNvbm5lY3Qgd2l0aCB0aGUgTE1TJyk7XG5cdFx0aWYgKGxvY2FsRGF0YSkge1xuXHRcdFx0c2F2ZURhdGEgPSBsb2NhbERhdGE7XG5cdFx0fVxuXHRcdGlmIChib29rbWFya0xvY2FsKSB7XG5cdFx0XHRib29rbWFya2VkU2xpZGUgPSBib29rbWFya0xvY2FsO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRib29rbWFya2VkU2xpZGUgPSAxO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBzZXRTY29ybUNvbXBsZXRpb24oKSB7XG5cdHZhciBzdWNjZXNzID0gZmFsc2U7XG5cblx0Ly8gRG8gd2UgZXZlbiB3YW50IHRvIHRhbGsgdG8gdGhlIExNUz9cblx0aWYgKGdsb2JhbFZhci5zY29ybVNldHRpbmdzLnVzZVNjb3JtKSB7XG5cdFx0Ly8gQUlDQzpcblx0XHQvLyBPbiB0aGUgb2ZmIGNoYW5jZSB0aGF0IHdlIHdhbnQgdG8gdXNlIEFJQ0MgaW5zdGVhZCBvZiBTQ09STVxuXG5cdFx0aWYgKGdsb2JhbFZhci5zY29ybVNldHRpbmdzLnN0YW5kYXJkID09PSAnYWljYycpIHtcblx0XHRcdHZhciBTRCA9IHdpbmRvdy5wYXJlbnQ7XG5cblx0XHRcdC8vIENoZWNrIGlmIHRoZSBBSUNDIEFQSSBpcyBhdmFpbGFibGUgaW4gcGFyZW50IGFuZCB0ZWxsIGl0IHRvIHNldCB0aGUgY291cnNlIHRvIGNvbXBsZXRlXG5cblx0XHRcdGlmICh0eXBlb2YgU0QuU2V0UmVhY2hlZEVuZCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgU0QuQ29tbWl0RGF0YSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHQvLyBJZiBib3RoIG9mIHRoZSBmb2xsb3dpbmcgQUlDQyBBUEkgZnVuY3Rpb25zIHJldHVybiB0cnVlLCB3ZSBhcmUgZG9uZSBoZXJlIVxuXHRcdFx0XHRzdWNjZXNzID0gU0QuU2V0UmVhY2hlZEVuZCgpICYmIFNELkNvbW1pdERhdGEoKTtcblx0XHRcdFx0aWYgKHN1Y2Nlc3MpIHtcblx0XHRcdFx0XHRzaUxvZygnQUlDQycsICdDT01QTEVURScsICdTVUNDRVNTOiBDb3Vyc2Ugd2FzIHN1Y2Nlc3NmdWxseSBzZXQgdG8gY29tcGxldGUhJyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gb3RoZXJ3aXNlIHNvbWV0aGluZyB3ZW50IGhvcnJpYmx5IHdyb25nLlxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRzaUxvZygnQUlDQycsICdDT01QTEVURScsICdFUlJPUjogQ291cnNlIGNvdWxkIG5vdCBiZSBzZXQgdG8gY29tcGxldGUhJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdC8vIG90aGVyd2lzZSB0aGUgQVBJIGlzbid0IGF2YWlsYWJsZVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHNpTG9nKCdBSUNDJywgJ0NPTVBMRVRFJywgJ0VSUk9SOiBDb3Vyc2UgaXMgbm90IGNvbm5lY3RlZCB0byB0aGUgTE1TJyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gU0NPUk06XG5cblx0XHQvL0lmIGxtc0Nvbm5lY3RlZCBpcyB0cnVlICh3aGljaCBvbmx5IGhhcHBlbnMgaWYgd2UgYXJlIHVzaW5nIHRoZSBTQ09STSBzdGFuZGFyZCkuLi5cblx0XHRlbHNlIGlmIChsbXNDb25uZWN0ZWQpIHtcblx0XHRcdC8vLi4uIHRyeSBzZXR0aW5nIHRoZSBjb3Vyc2Ugc3RhdHVzIHRvIFwiY29tcGxldGVkXCJcblx0XHRcdGlmIChzY29ybS52ZXJzaW9uID09PSAnMjAwNCcpIHtcblx0XHRcdFx0c3VjY2VzcyA9IHNjb3JtLnNldCgnY21pLmNvbXBsZXRpb25fc3RhdHVzJywgJ2NvbXBsZXRlZCcpO1xuXHRcdFx0XHRzY29ybS5zZXQoJ2NtaS5zdWNjZXNzX3N0YXR1cycsICdwYXNzZWQnKTtcblx0XHRcdFx0c2Nvcm0uc2V0KCdjbWkuc2NvcmUucmF3JywgJzEwMCcpO1xuXHRcdFx0XHRzY29ybS5zZXQoJ2NtaS5zY29yZS5zY2FsZWQnLCAnMScpO1xuXHRcdFx0XHQvLyBzY29ybS5zZXQoXCJjbWkuc2NvcmUubWluXCIsIGdsb2JhbFZhci5taW5TY29yZSk7XG5cdFx0XHRcdC8vIHNjb3JtLnNldChcImNtaS5zY29yZS5tYXhcIiwgZ2xvYmFsVmFyLm1heFNjb3JlKTtcblx0XHRcdFx0Ly8gc2Nvcm0uc2V0KFwiYWRsLm5hdi5yZXF1ZXN0XCIsIFwiZXhpdFwiKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c3VjY2VzcyA9IHNjb3JtLnNldCgnY21pLmNvcmUubGVzc29uX3N0YXR1cycsICdjb21wbGV0ZWQnKTtcblx0XHRcdFx0c2Nvcm0uc2V0KCdjbWkuY29yZS5zY29yZS5yYXcnLCAnMTAwJyk7XG5cdFx0XHRcdC8vIHNjb3JtLnNldChcImNtaS5jb3JlLnNjb3JlLm1pblwiLCBnbG9iYWxWYXIubWluU2NvcmUpO1xuXHRcdFx0XHQvLyBzY29ybS5zZXQoXCJjbWkuY29yZS5zY29yZS5tYXhcIiwgZ2xvYmFsVmFyLm1heFNjb3JlKTtcblx0XHRcdH1cblx0XHRcdC8vSWYgdGhlIGNvdXJzZSB3YXMgc3VjY2Vzc2Z1bGx5IHNldCB0byBcImNvbXBsZXRlZFwiLi4uXG5cdFx0XHRpZiAoc3VjY2Vzcykge1xuXHRcdFx0XHRzY29ybS5zYXZlKCk7XG5cdFx0XHRcdHNpTG9nKCdTQ09STScsICdDT01QTEVURScsICdTVUNDRVNTOiBDb3Vyc2Ugd2FzIHN1Y2Nlc3NmdWxseSBzZXQgdG8gY29tcGxldGUhJyk7XG5cdFx0XHR9XG5cdFx0XHQvL0lmIHRoZSBjb3Vyc2UgY291bGRuJ3QgYmUgc2V0IHRvIGNvbXBsZXRlZCBmb3Igc29tZSByZWFzb24uLi5cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHQvL2FsZXJ0IHRoZSB1c2VyXG5cdFx0XHRcdHNpTG9nKCdTQ09STScsICdDT01QTEVURScsICdFUlJPUjogQ291cnNlIGNvdWxkIG5vdCBiZSBzZXQgdG8gY29tcGxldGUhJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIG90aGVyd2lzZSB0aGUgY291cnNlIGlzbid0IGNvbm5lY3RlZCB0byB0aGUgTE1TIGZvciBzb21lIHJlYXNvbi4uLlxuXHRcdGVsc2Uge1xuXHRcdFx0Ly9hbGVydCB0aGUgdXNlclxuXHRcdFx0c2lMb2coJ1NDT1JNJywgJ0NPTVBMRVRFJywgJ0VSUk9SOiBDb3Vyc2UgaXMgbm90IGNvbm5lY3RlZCB0byB0aGUgTE1TJyk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIHNldFNjb3JtSW5jb21wbGV0ZSgpIHtcblx0aWYgKGxtc0Nvbm5lY3RlZCkge1xuXHRcdHZhciBzdWNjZXNzO1xuXHRcdC8vLi4uIHRyeSBzZXR0aW5nIHRoZSBjb3Vyc2Ugc3RhdHVzIHRvIFwiY29tcGxldGVkXCJcblx0XHRpZiAoc2Nvcm0udmVyc2lvbiA9PT0gJzIwMDQnKSB7XG5cdFx0XHRzdWNjZXNzID0gc2Nvcm0uc2V0KCdjbWkuY29tcGxldGlvbl9zdGF0dXMnLCAnY29tcGxldGVkJyk7XG5cdFx0XHRzY29ybS5zZXQoJ2NtaS5zdWNjZXNzX3N0YXR1cycsICdmYWlsZWQnKTtcblx0XHRcdHNjb3JtLnNldCgnY21pLnNjb3JlLnJhdycsICcwJyk7XG5cdFx0XHRzY29ybS5zZXQoJ2NtaS5zY29yZS5zY2FsZWQnLCAnMScpO1xuXHRcdFx0Ly8gc2Nvcm0uc2V0KFwiY21pLnNjb3JlLm1pblwiLCBnbG9iYWxWYXIubWluU2NvcmUpO1xuXHRcdFx0Ly8gc2Nvcm0uc2V0KFwiY21pLnNjb3JlLm1heFwiLCBnbG9iYWxWYXIubWF4U2NvcmUpO1xuXHRcdFx0Ly8gc2Nvcm0uc2V0KFwiYWRsLm5hdi5yZXF1ZXN0XCIsIFwiZXhpdFwiKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRzdWNjZXNzID0gc2Nvcm0uc2V0KCdjbWkuY29yZS5sZXNzb25fc3RhdHVzJywgJ2luY29tcGxldGUnKTtcblx0XHRcdHNjb3JtLnNldCgnY21pLmNvcmUuc2NvcmUucmF3JywgJzAnKTtcblx0XHRcdC8vIHNjb3JtLnNldChcImNtaS5jb3JlLnNjb3JlLm1pblwiLCBnbG9iYWxWYXIubWluU2NvcmUpO1xuXHRcdFx0Ly8gc2Nvcm0uc2V0KFwiY21pLmNvcmUuc2NvcmUubWF4XCIsIGdsb2JhbFZhci5tYXhTY29yZSk7XG5cdFx0fVxuXHRcdC8vSWYgdGhlIGNvdXJzZSB3YXMgc3VjY2Vzc2Z1bGx5IHNldCB0byBcImluY29tcGxldGVcIi4uLlxuXHRcdGlmIChzdWNjZXNzKSB7XG5cdFx0XHRzY29ybS5zYXZlKCk7XG5cdFx0XHRzaUxvZygnU0NPUk0nLCAnSU5DT01QTEVURScsICdTVUNDRVNTOiBDb3Vyc2Ugd2FzIHN1Y2Nlc3NmdWxseSBzZXQgdG8gaW5jb21wbGV0ZSEnKTtcblx0XHR9XG5cdFx0Ly9JZiB0aGUgY291cnNlIGNvdWxkbid0IGJlIHNldCB0byBpbmNvbXBsZXRlIGZvciBzb21lIHJlYXNvbi4uLlxuXHRcdGVsc2Uge1xuXHRcdFx0Ly9hbGVydCB0aGUgdXNlclxuXHRcdFx0c2lMb2coJ1NDT1JNJywgJ0lOQ09NUExFVEUnLCAnRVJST1I6IENvdXJzZSBjb3VsZCBub3QgYmUgc2V0IHRvIGluY29tcGxldGUhJyk7XG5cdFx0fVxuXHR9XG5cdC8vSWYgdGhlIGNvdXJzZSBpc24ndCBjb25uZWN0ZWQgdG8gdGhlIExNUyBmb3Igc29tZSByZWFzb24uLi5cblx0ZWxzZSB7XG5cdFx0Ly9hbGVydCB0aGUgdXNlclxuXHRcdHNpTG9nKCdTQ09STScsICdJTkNPTVBMRVRFJywgJ0VSUk9SOiBDb3Vyc2UgaXMgbm90IGNvbm5lY3RlZCB0byB0aGUgTE1TJyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gdW5sb2FkSGFuZGxlcigpIHtcblx0aWYgKGxtc0Nvbm5lY3RlZCAmJiAhdW5sb2FkZWQpIHtcblx0XHRzYXZlTE1TKCk7XG5cdFx0c2Nvcm0uc2F2ZSgpOyAvL3NhdmUgYWxsIGRhdGEgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIHNlbnRcblx0XHRzY29ybS5xdWl0KCk7IC8vY2xvc2UgdGhlIFNDT1JNIEFQSSBjb25uZWN0aW9uIHByb3Blcmx5XG5cdFx0dW5sb2FkZWQgPSB0cnVlO1xuXHR9XG59XG5mdW5jdGlvbiBzYXZlTE1TKCkge1xuXHRpZiAoc2F2ZUNvdXJzZVByb2dyZXNzKCkgJiYgc2F2ZUJvb2ttYXJrKCkpIHtcblx0XHRzY29ybS5zYXZlKCk7XG5cdH0gZWxzZSB7XG5cdFx0c2lMb2coJ1NDT1JNJywgJ0ZhaWxlZCB0byBTYXZlJyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc2F2ZUNvdXJzZVByb2dyZXNzKCkge1xuXHR2YXIgc3VjY2Vzcztcblx0dmFyIGRhdGFTdHJpbmcgPSBKU09OLnN0cmluZ2lmeShzYXZlRGF0YSk7XG5cdGlmIChsbXNDb25uZWN0ZWQpIHtcblx0XHRzdWNjZXNzID0gc2Nvcm0uc2V0KCdjbWkuc3VzcGVuZF9kYXRhJywgZGF0YVN0cmluZyk7XG5cdH1cblx0cmV0dXJuIHN1Y2Nlc3M7XG59XG5mdW5jdGlvbiBzYXZlQm9va21hcmsoKSB7XG5cdHZhciBzdWNjZXNzO1xuXHRib29rbWFya2VkU2xpZGUgPSBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5zbGlkZU51bWJlciB8fCAnMCc7XG5cdGlmIChsbXNDb25uZWN0ZWQpIHtcblx0XHRpZiAoc2Nvcm0udmVyc2lvbiA9PT0gJzIwMDQnKSB7XG5cdFx0XHRzdWNjZXNzID0gc2Nvcm0uc2V0KCdjbWkubG9jYXRpb24nLCBib29rbWFya2VkU2xpZGUpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzdWNjZXNzID0gc2Nvcm0uc2V0KCdjbWkuY29yZS5sZXNzb25fbG9jYXRpb24nLCBib29rbWFya2VkU2xpZGUpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBzdWNjZXNzO1xufVxuXG5mdW5jdGlvbiBzYXZlUHJvZ3Jlc3NMb2NhbGx5KCkge1xuXHRib29rbWFya2VkU2xpZGUgPSBzbGlkZXNbZ2xvYmFsVmFyLmN1clNsaWRlXS5zbGlkZU51bWJlciB8fCAnMCc7XG5cdHZhciBkYXRhU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoc2F2ZURhdGEpO1xuXHRpZiAoc3RvcmFnZUF2YWlsYWJsZSgnbG9jYWxTdG9yYWdlJykpIHtcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShwcm9ncmVzc1VSTCwgZGF0YVN0cmluZyk7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oYm9va21hcmtVUkwsIGJvb2ttYXJrZWRTbGlkZSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc3RvcmFnZUF2YWlsYWJsZSh0eXBlKSB7XG5cdHZhciBzdG9yYWdlO1xuXHR0cnkge1xuXHRcdHN0b3JhZ2UgPSB3aW5kb3dbdHlwZV07XG5cdFx0dmFyIHggPSAnX19zdG9yYWdlX3Rlc3RfXyc7XG5cdFx0c3RvcmFnZS5zZXRJdGVtKHgsIHgpO1xuXHRcdHN0b3JhZ2UucmVtb3ZlSXRlbSh4KTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdHJldHVybiAoXG5cdFx0XHRlIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uICYmXG5cdFx0XHQvLyBldmVyeXRoaW5nIGV4Y2VwdCBGaXJlZm94XG5cdFx0XHQoZS5jb2RlID09PSAyMiB8fFxuXHRcdFx0XHQvLyBGaXJlZm94XG5cdFx0XHRcdGUuY29kZSA9PT0gMTAxNCB8fFxuXHRcdFx0XHQvLyB0ZXN0IG5hbWUgZmllbGQgdG9vLCBiZWNhdXNlIGNvZGUgbWlnaHQgbm90IGJlIHByZXNlbnRcblx0XHRcdFx0Ly8gZXZlcnl0aGluZyBleGNlcHQgRmlyZWZveFxuXHRcdFx0XHRlLm5hbWUgPT09ICdRdW90YUV4Y2VlZGVkRXJyb3InIHx8XG5cdFx0XHRcdC8vIEZpcmVmb3hcblx0XHRcdFx0ZS5uYW1lID09PSAnTlNfRVJST1JfRE9NX1FVT1RBX1JFQUNIRUQnKSAmJlxuXHRcdFx0Ly8gYWNrbm93bGVkZ2UgUXVvdGFFeGNlZWRlZEVycm9yIG9ubHkgaWYgdGhlcmUncyBzb21ldGhpbmcgYWxyZWFkeSBzdG9yZWRcblx0XHRcdHN0b3JhZ2UgJiZcblx0XHRcdHN0b3JhZ2UubGVuZ3RoICE9PSAwXG5cdFx0KTtcblx0fVxufVxuIl19
