webpackJsonp([1],{

/***/ 24:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* WEBPACK VAR INJECTION */(function(_) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_bootstrap_dist_css_bootstrap_css__ = __webpack_require__(25);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_bootstrap_dist_css_bootstrap_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_bootstrap_dist_css_bootstrap_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_bootstrap_dist_js_bootstrap_js__ = __webpack_require__(26);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_bootstrap_dist_js_bootstrap_js___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_bootstrap_dist_js_bootstrap_js__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_angular__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_angular___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_angular__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_boxes_scroll_dist_boxesscroll_css__ = __webpack_require__(29);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_boxes_scroll_dist_boxesscroll_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_boxes_scroll_dist_boxesscroll_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_boxes_scroll_dist_boxesscroll_js__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_boxes_scroll_dist_boxesscroll_js___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_boxes_scroll_dist_boxesscroll_js__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_pdfjs_box_dist_pdfjsbox_css__ = __webpack_require__(31);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_pdfjs_box_dist_pdfjsbox_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_pdfjs_box_dist_pdfjsbox_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_pdfjs_box_dist_pdfjsbox_js__ = __webpack_require__(32);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_pdfjs_box_dist_pdfjsbox_js___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_6_pdfjs_box_dist_pdfjsbox_js__);








//var angular = require('angular');

__webpack_require__(71);
__webpack_require__(72);
__webpack_require__(73);
__webpack_require__(74);
__webpack_require__(75);

(function (ng, __) {
	'use strict';
	ng.module('app', ['pdfjs-box'])
			  .constant('pdfjsConfig', { workerSrc: './pdf.worker.bundle.js', cMapUrl:'cmaps/', cMapPacked:true, preloadRecursivePages:7 } )
			  .controller('AppCtrl', AppCtrl);
	function AppCtrl() {
		var ctrl = this;
		ctrl.module = 'pdfjs-box';
		ctrl.documents = [
			{label:'Conditions générales', url:'conditions.pdf'}, 
			{label:'guide renovation 2016', url:'guide.pdf'}, 
			{label:'UnicodeStandard', url:'UnicodeStandard.pdf'},
			{label:'ErrorFile', url:'foo.pdf'}
		];
		ctrl.items = [];
		ctrl.items2 = [];
		ctrl.selectedDocument;
		ctrl.docscale = 'fit';
		ctrl.globalRotate = 0;
		ctrl.quality = 3;
		ctrl.scale;
		ctrl.selectedItem;
		ctrl.onSave = onSave;
		ctrl.rotate = rotate;
		ctrl.onError = onError;
		
		function onError(reason) {
			console.log("Error of loading", reason);
		}
		
		function rotate() {
			ctrl.globalRotate = ctrl.globalRotate + 90;
			if(ctrl.globalRotate>270) {
				ctrl.globalRotate = 0;
			}
		}
		function onSave(items) {
			alert('document PDF de '+items.length+' pages sauvegardées');
			items.splice(0, items.length);
		}
	}
})(__WEBPACK_IMPORTED_MODULE_2_angular___default.a, _);
window.countWatchers = countWatchers;
function countWatchers() { 
    var root = __WEBPACK_IMPORTED_MODULE_2_angular___default.a.element(document.getElementsByTagName('body'));

    var watchers = [];

    var f = function (element) {
        __WEBPACK_IMPORTED_MODULE_2_angular___default.a.forEach(['$scope', '$isolateScope'], function (scopeProperty) { 
            if (element.data() && element.data().hasOwnProperty(scopeProperty)) {
                __WEBPACK_IMPORTED_MODULE_2_angular___default.a.forEach(element.data()[scopeProperty].$$watchers, function (watcher) {
                    watchers.push(watcher);
                });
            }
        });

        __WEBPACK_IMPORTED_MODULE_2_angular___default.a.forEach(element.children(), function (childElement) {
            f(__WEBPACK_IMPORTED_MODULE_2_angular___default.a.element(childElement));
        });
    };

    f(root);

    // Remove duplicate watchers
    var watchersWithoutDuplicates = [];
    __WEBPACK_IMPORTED_MODULE_2_angular___default.a.forEach(watchers, function(item) {
        if(watchersWithoutDuplicates.indexOf(item) < 0) {
             watchersWithoutDuplicates.push(item);
        }
    });

    console.log(watchersWithoutDuplicates.length);
}

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(12)))

/***/ }),

/***/ 40:
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),

/***/ 42:
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),

/***/ 62:
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),

/***/ 63:
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),

/***/ 64:
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),

/***/ 71:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "conditions.pdf";

/***/ }),

/***/ 72:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "guide.pdf";

/***/ }),

/***/ 73:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "UnicodeStandard.pdf";

/***/ }),

/***/ 74:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "favicon.ico";

/***/ }),

/***/ 75:
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ })

},[24]);