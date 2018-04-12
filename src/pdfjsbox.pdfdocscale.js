/* global _ */
(function (ng, __) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
		pdfbox = ng.module('pdfjs-box', ['boxes.scroll']);
	}
	pdfbox.directive('pdfDocscale', pdfDocscale);
	/* @ngInject */
	function pdfDocscale(pdfjsboxWatcherServices, pdfjsboxScaleServices, pdfjsboxDomServices) {
		return {
			restrict: 'E',
			scope: {
				// nom interne : nom externe
				'ngItem': '=',
				'ngScale': '=',
				'docScale': '=',
				'forceTrigger': '<', // quand cette valeur est changer, force le calcul du scale, par exemple une height est pertinent
				'pdfviewSelector': '@'
			},
			link: function (scope, elm, attrs, ctrl) {
				var watcherClears = [];
				watcherClears.push(scope.$watchGroup(['ngItem.document', 'docScale', 'forceTrigger'], function (vs1, vs2, s) {
//					if (vs1[0] && s.ctrl.document !== vs1[0]) {
					computeScale(s, elm, s.ngItem, s.docScale, s.pdfviewSelector);
//					}
				}, true));
				scope.$on('$destroy', function () {
					watcherClears.forEach(function (watcherClear) {
						watcherClear();
					});
				});
			}
		};
		/**
		 * Calcul le scale en fonction du docScale
		 * @param {Angular Scope} scope
		 * @param {JQueryElement} pdfDocscaleElm
		 * @param {Item} item
		 * @param {string|number} docScale
		 * @param {string} pdfviewSelector
		 */
		function computeScale(scope, pdfDocscaleElm, item, docScale, pdfviewSelector) {
			if (!docScale || !item) {
				return;
			}
			item.getPage().then(function (pdfPage) {
				if (!isNaN(docScale)) {
					scope.ngScale = docScale;
				} else {
					var view = pdfPage.view;
					if (!view) { // normalement pas possible
						scope.ngScale = 1;
						return;
					}
					var container = getPdfViewHTMLElement(pdfDocscaleElm, pdfviewSelector);
					if (!container) {
						scope.ngScale = 1;
						console.info('"docScale" feature : Transclude \'pdf-docscale\' in \'pdf-view\' or set \'pdfview-selector\' attribute on \'pdf-docscale\' with selector of \'pdf-view\' value');
						return;
					}
					var rectangle = pdfjsboxScaleServices.getRectangle(pdfPage, 0);
					var pdfView = pdfjsboxDomServices.getElementFromJQueryElement(container);
					var scaleFitV = (pdfView.clientHeight || rectangle.height) / rectangle.height;
					var scaleFitH = (pdfView.clientWidth || rectangle.width) / rectangle.width;
					if (docScale === 'fit') {
						scope.ngScale = Math.min(scaleFitV, scaleFitH);
					} else if (docScale === 'fitV') {
						scope.ngScale = scaleFitV;
					} else if (docScale === 'fitH') {
						scope.ngScale = scaleFitH;
					} else {
						console.info('docScale feature : \'%s\' is not good value for doc-scale, set with \'fit\', \'fitH\' or \'fitV\' or number', docScale);
					}
				}
			});
		}
		/**
		 * Retourne le noaud HTML du pdfView permettant de récuperer les dimensions de celui ci.
		 * ou l'attribut 'pdfview-selector' est définit et permet de le récuperer via jquery, ou l'element pdf-docscale est un enfant du pdf-view
		 * @param {HTMLElement} pdfDocscaleElm
		 * @param {string} pdfviewSelector
		 * @returns {HTMLElement}
		 */
		function getPdfViewHTMLElement(pdfDocscaleElm, pdfviewSelector) {
			var container = null;
			;
			if (pdfviewSelector) {
				container = ng.element(pdfviewSelector);
				if (!container) {
					console.info('"docScale" feature : Cannot find \'%s\' selector of \'pdf-view\'. set an other value of attribute \'pdfview-selector\' or Transclude \'pdf-docscale\' in \'pdf-view\'', pdfviewSelector);
				}
			} else {
				container = pdfDocscaleElm.parents('pdf-view');
			}
			return container;
		}
	}
})(angular, _);
