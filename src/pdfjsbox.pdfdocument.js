/* global _ */
/* global PDFJS */
(function (ng, __, PDFJS) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
		pdfbox = ng.module('pdfjs-box', ['boxes.scroll']);
	}
	pdfbox.directive('pdfDocument', pdfDocument);
	/* @ngInject */
	function pdfDocument(pdfjsboxWatcherServices, pdfjsboxItemServices) {
		return {
			restrict: 'E',
			scope: {
				// nom interne : nom externe
				'pdf': '<', // le document sous forme d'objet
				'rotate': '<', // le document sera t'il tourné
				'ngItems': '=' // la liste de items representant les pages du document
			},
			link: function (scope, elm, attrs, ctrl) {
				var watcherClears = [];
				watcherClears.push(scope.$watch('rotate', function (v1, v2, s) {
					updateRotate(s, v1);
				}, true));
				watcherClears.push(scope.$watch('pdf', function (v1, v2, s) {
					updatePdf(s, v1);
				}, true));
				pdfjsboxWatcherServices.cleanWatchersOnDestroy(scope, watcherClears);
				manageRefreshHandler(scope);
			}
		};
		/**
		 * Gestion des events refresh
		 * @param {Angular scope} scope
		 */
		function manageRefreshHandler(scope) {
			scope.$on('pdfdoc-refresh', function (event, data) {
				if (data === scope.pdfid) {
					scope.pdfid = null;
					updatePdf(scope, scope.pdf);
				}
			});
		}
		/**
		 * Changement de rotation pour tout le document
		 * @param {Angular scope} scope
		 * @param {Number} rotate
		 */
		function updateRotate(scope, rotate) {
			scope.ngItems.forEach(function(item) {
				item.rotate += rotate;
			});
		}
		/**
		 * Changement de document
		 * @param {Angular scope} scope
		 * @param {Document|url} pdf
		 */
		function updatePdf(scope, pdf) {
			var items = scope.ngItems || [];
			var pdfid = pdfjsboxItemServices.id(pdf);
			if (pdfid !== scope.pdfid) {
				scope.pdfid = pdfid;
				if (pdfid) {
					var t0 = new Date().getTime();
					var task = PDFJS.getDocument(pdf);
					task.promise.then(function (pdfDocument) {
						var args = [0, items.length];
						for (var i = 0; i < pdfDocument.numPages; i++) {
							args.push(createItem(pdf, pdfid, pdfDocument, items, i, scope.rotate | 0));
						}
						scope.$apply(function() {
							[].splice.apply(items, args); // de cette maniere la liste n'est modifiée qu'une fois
						});
						console.debug('Load sequence ' + (pdfDocument.numPages) + ' pages in %sms', new Date().getTime() - t0);
					}).catch(function (reason) {
						console.error('Error: ' + reason);
					});
				}
			}
			return null;
		}
		function createItem(pdf, pdfid, pdfDocument, items, idx, rotate) {
			var item = {$$pdfid: pdfid, document: pdf, pageIdx: idx + 1, rotate: rotate, items: items, getPage: function () {
					return pdfDocument.getPage(this.pageIdx);
				}};
			return item;
		}
	}
})(angular, _, PDFJS);