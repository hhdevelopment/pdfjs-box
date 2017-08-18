(function (ng, __, PDFJS, pdfjsLib) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
		pdfbox = ng.module('pdfjs-box', []);
	}
	pdfbox.directive('pdfDocument', pdfDocument);
	/* @ngInject */
	function pdfDocument($q, pdfjsConfig, pdfjsboxWatcherServices, pdfjsboxItemServices) {
		return {
			restrict: 'E',
			scope: {
				// nom interne : nom externe
				'ngDocument': '<', // le document sous forme d'objet
				'ngData': '<', // Un objet exposant des données global 
				'urlSupplier': '=', // une fonction retournant l'url a partir du document et de l'objet globalData. 
				'ngItems': '=' // la liste de items representant les pages du document
			},
			link: function (scope, elm, attrs, ctrl) {
				var watcherClears = [];
				watcherClears.push(scope.$watch('ngDocument', function (v1, v2, s) {
					updateNgDocument(s, v1);
				}, true));
				pdfjsboxWatcherServices.cleanWatchersOnDestroy(scope, watcherClears);
				updateNgDocument(scope, scope.ngDocument);
			}
		};
		/**
		 * Changement de document
		 * @param {type} scope
		 * @param {type} ngDocument
		 */
		function updateNgDocument(scope, ngDocument) {
			var items = scope.ngItems || [];
			items.splice(0, items.length);
			if (ngDocument) {
				var url = scope.urlSupplier ? scope.urlSupplier({'document': ngDocument, 'data': scope.ngData}) : (ngDocument.url || ngDocument);
				var task = PDFJS.getDocument(url);
				return task.promise.then(function (pdfDocument) {
					var t0 = new Date().getTime();
					return loadRecursivePage(scope, ngDocument, pdfDocument, items, 0, pdfjsConfig.preloadRecursivePages).then(function () {
						console.log('Preload recursive ' + Math.min(pdfjsConfig.preloadRecursivePages, pdfDocument.numPages) + ' pages in %sms', new Date().getTime() - t0);
					}, function (reason) {
						console.log('Recursive preloading cancel cause document changed.');
					});
				}).catch(function (reason) {
					console.error('Error: ' + reason);
				});
			}
			return null;
		}
		/**
		 * Charge une page, utilisé dans le mode séquenciel
		 * @param {type} scope
		 * @param {type} document
		 * @param {type} pdfDocument
		 * @param {type} items
		 * @param {type} offset
		 * @param {type} idx
		 * @param {type} t0
		 */
		function loadSinglePage(scope, document, pdfDocument, items, offset, idx, t0) {
			var deferred = $q.defer();
			var item = {document: document, pageIdx: idx + 1, rotate: 0, items: items, getPage: function () {
					return deferred.promise;
				}};
			items.push(item);
			pdfDocument.getPage(idx + 1).then(function (pdfPage) {
				deferred.resolve(pdfPage);
				if ((idx + 1) === pdfDocument.numPages) {
					console.log('Preload sequence ' + (pdfDocument.numPages - offset) + ' pages in %sms', new Date().getTime() - t0);
				}
			});
		}
		/**
		 * Charge les pages de facon récursive ou mix si max est inferieur à numPages 
		 * @param {type} scope
		 * @param {type} document
		 * @param {type} pdfDocument
		 * @param {type} items
		 * @param {type} idx
		 * @param {type} max
		 */
		function loadRecursivePage(scope, document, pdfDocument, items, idx, max) {
			if (idx < max && idx < pdfDocument.numPages) {
				var deferred = $q.defer();
				var item = {document: document, pageIdx: idx + 1, rotate: 0, items: items, getPage: function () {
						return deferred.promise;
					}};
				items.push(item);
				scope.$apply();
				return pdfDocument.getPage(idx + 1).then(function (pdfPage) {
					deferred.resolve(pdfPage);
					if (scope.ngDocument === document) { // on s'assure que l'on a pas changé de document
						return loadRecursivePage(scope, document, pdfDocument, items, idx + 1, max);
					} else {
						throw new Error();
					}
				});
			} else {
				for (var i = idx; i < pdfDocument.numPages; i++) {
					loadSinglePage(scope, document, pdfDocument, items, idx, i, new Date().getTime());
				}
				scope.$apply();
			}
			return null;
		}
	}
})(angular, _, PDFJS, pdfjsLib);