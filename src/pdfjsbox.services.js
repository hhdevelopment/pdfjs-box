(function (ng, __, PDFJS, pdfjsLib) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
		pdfbox = ng.module('pdfjs-box', []);
	}
	pdfbox.factory('pdfjsboxWatcherServices', watcherServices);
	function watcherServices() {
		return {
			cleanWatchersOnDestroy: cleanWatchersOnDestroy
		};
		/*
		 * clean les watchers sur le scope
		 * @param {type} scope
		 * @param {type} watcherClears
		 */
		function cleanWatchersOnDestroy(scope, watcherClears) {
			scope.$on('$destroy', function () {
				// stop watching when scope is destroyed
				watcherClears.forEach(function (watcherClear) {
					watcherClear();
				});
			});
		}
	}
	pdfbox.factory('pdfjsboxDrawServices', drawServices);
	function drawServices() {
		return {
			drawPageWhenAvailableIfVisible: drawPageWhenAvailableIfVisible,
			isHVisibleIn: isHVisibleIn,
			isVVisibleIn: isVVisibleIn
		};
		function drawPageWhenAvailableIfVisible(height, elm, thumbnail, item, forceRender) {
			item.getPage().then(function (pdfPage) {
				var render = forceRender;
				if (!forceRender && thumbnail.parentElement) {
					render = isHVisibleIn(thumbnail.getClientRects()[0], thumbnail.parentElement.getClientRects()[0]);
				}
				var view = pdfPage.view;
				var scale = (height || 100) / (view[3] - view[1]);
				drawPdfPageToThumbnail(elm, pdfPage, item.rotate, scale, render);
				item.selected = true;
			});
		}
		/**
		 * Dessine la page du pdf dans elm, elm etant un pdf-thumbnail 
		 * @param {type} elm
		 * @param {type} pdfPage
		 * @param {type} rotate
		 * @param {type} scale
		 * @param {type} render
		 */
		function drawPdfPageToThumbnail(elm, pdfPage, rotate, scale, render) {
			var canvas = elm.find('canvas').get(0);
			if (canvas) {
				if (render) {
					var ctx = canvas.getContext('2d');
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					var viewport = pdfPage.getViewport(scale, rotate || 0);
					canvas.width = viewport.width;
					canvas.height = viewport.height;
					pdfPage.render({canvasContext: ctx, viewport: viewport}).then(function () {
						elm.removeClass('notrendered');
					});
				} else {
					elm.addClass('notrendered');
				}
			}
		}
		/**
		 * Détermine si le rectangle1 est visible entierement ou en partie horizontalement dans le rectangle2
		 * @param {ClientRects} clientRects1
		 * @param {ClientRects} clientRects2
		 * @returns {Boolean}
		 */
		function isHVisibleIn(clientRects1, clientRects2) {
			return clientRects1.left <= clientRects2.right && clientRects1.right >= clientRects2.left;
		}
		/**
		 * Détermine si le rectangle1 est visible entierement ou en partie verticalement dans le rectangle2
		 * @param {ClientRects} clientRects1
		 * @param {ClientRects} clientRects2
		 * @returns {Boolean}
		 */
		function isVVisibleIn(clientRects1, clientRects2) {
			return clientRects1.top <= clientRects2.bottom && clientRects1.bottom >= clientRects2.top;
		}
	}
	pdfbox.factory('pdfjsboxItemServices', itemServices);
	function itemServices($q) {
		return {
			getIndexOfItemInList: getIndexOfItemInList,
			getItemInList: getItemInList,
			areItemsEqual: areItemsEqual,
			cloneItem: cloneItem
		};
		function cloneItem(item, itemsTarget) {
			var deferred = $q.defer();
			var it = {document: item.document, pageIdx: item.pageIdx, rotate: item.rotate, items: itemsTarget, tmp: true, getPage: function () {
					return deferred.promise;
				}};
			item.getPage().then(function (pdfPage) {
				deferred.resolve(pdfPage);
			});
			return it;
		}
		function getIndexOfItemInList(item, items) {
			return __.findIndex(items, function (it) {
				return areItemsEqual(it, item);
			});
		}
		function getItemInList(item, items) {
			return __.find(items, function (it) {
				return areItemsEqual(it, item);
			});
		}
		/**
		 * Compare deux items pour determiner s'ils sont egaux
		 * @param {type} item1
		 * @param {type} item2
		 * @returns {Boolean}
		 */
		function areItemsEqual(item1, item2) {
			if (!item1 && !item2) {
				return true;
			}
			if (!item1 || !item2) {
				return false;
			}
			return (item1.document === item2.document) && (item1.pageIdx === item2.pageIdx);
		}
	}
})(angular, _, PDFJS, pdfjsLib);