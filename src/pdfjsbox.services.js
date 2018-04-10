/* global _ */
(function (ng, __) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
		pdfbox = ng.module('pdfjs-box', ['boxes.scroll']);
	}
	pdfbox.factory('pdfjsboxSemServices', semServices);
	function semServices($q) {
		var sems = {};
		return {
			acquire : acquire,
			release : release
		};
		function acquire(name) {
			if(!sems[name]) {
				sems[name] = {defer: $q.defer()};
				sems[name].defer.resolve();
			}
			return sems[name].defer.promise.then(function () {
				sems[name].defer = $q.defer();
			});
		}
		function release(name) {
			if(!sems[name]) {
				sems[name] = {defer: $q.defer()};
			}
			sems[name].defer.resolve();
		}
	}
	pdfbox.factory('pdfjsboxDomServices', domServices);
	function domServices() {
		return {
			stopEvent: stopEvent,
			getElementFromJQueryElement: getElementFromJQueryElement
		};
		function getElementFromJQueryElement(jqelt) {
			return jqelt.get?jqelt.get(0):jqelt[0];
		}
		function stopEvent(event) {
			event.stopImmediatePropagation();
			event.stopPropagation();
			event.preventDefault();
		}
	}
	pdfbox.factory('pdfjsboxScaleServices', scaleServices);
	function scaleServices() {
		return {
			getRectangle: getRectangle
		};
		/*
		 * Retourne le rectangle que va occupé la page en tenant compte de la rotation (multiple de 90)
		 * @param {type} scope
		 * @param {type} watcherClears
		 */
		function getRectangle(pdfPage, rotate) {
			if (pdfPage && pdfPage.view) {
				var view = pdfPage.view;
				var vHeight;
				var vWidth;
				var rotation = pdfPage.pageInfo.rotate + (rotate || 0);
				if ((rotation / 90) % 2) {
					vWidth = (view[3] - view[1]);
					vHeight = (view[2] - view[0]);
				} else {
					vHeight = (view[3] - view[1]);
					vWidth = (view[2] - view[0]);
				}
				return {width: vWidth, height: vHeight};
			}
			return {width: 0, height: 0};
		}
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
			drawPdfPageToCanvas: drawPdfPageToCanvas,
			isHVisibleIn: isHVisibleIn,
			isVVisibleIn: isVVisibleIn,
			isVerticalScrollbarPresent: isVerticalScrollbarPresent,
			isHorizontalScrollbarPresent: isHorizontalScrollbarPresent
		};
		function isVerticalScrollbarPresent(jqElt) {
			var elt = jqElt.get(0);
			return elt.offsetWidth !== elt.clientWidth;
		}
		function isHorizontalScrollbarPresent(jqElt) {
			var elt = jqElt.get(0);
			return elt.offsetHeight !== elt.clientHeight;
		}
		/**
		 * Dessine la page du pdf dans le canvas, utilisé pour les pdf-thumbnal ou les pages à print
		 * @param {type} canvas
		 * @param {type} pdfPage
		 * @param {type} rotate
		 * @param {type} scale
		 * @return {renderTask} 
		 */
		function drawPdfPageToCanvas(canvas, pdfPage, rotate, scale) {
			if (canvas) {
				var ctx = canvas.getContext('2d');
				var rot = pdfPage.pageInfo.rotate + (rotate || 0);
				var viewport = pdfPage.getViewport(scale, rot);
				canvas.width = viewport.width;
				canvas.height = viewport.height;
				// console.debug("drawPdfPageToCanvas", canvas.width, canvas.height);
				return pdfPage.render({canvasContext: ctx, viewport: viewport});
			} else {
				return {promise:Promise.resolve(), cancel:function(){}};
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
	function itemServices() {
		return {
			getPrevious: getPrevious,
			getNext: getNext,
			getIndexOfItemInList: getIndexOfItemInList,
			isContainInList: isContainInList,
			getItemInList: getItemInList,
			areItemsEqual: areItemsEqual,
			cloneItem: cloneItem,
			id: id
		};
		function getPrevious(item) {
			if (item) {
				var idx = getIndexOfItemInList(item, item.items);
				if (idx > 0) {
					return item.items[idx - 1];
				}
			}
			return item;
		}
		function getNext(item) {
			if (item) {
				var idx = getIndexOfItemInList(item, item.items);
				if (idx < item.items.length - 1) {
					return item.items[idx + 1];
				}
			}
			return item;
		}
		/**
		 * Clone l'tem pour la liste en parametre
		 * @param {Item} item
		 * @param {Array} itemsTarget
		 * @returns {Item}
		 */
		function cloneItem(item, itemsTarget) {
			return {$$pdfid: item.$$pdfid, document: item.document, pageIdx: item.pageIdx, rotate: item.rotate, items: itemsTarget, getPage: item.getPage};
		}
		function getIndexOfItemInList(item, items) {
			return item && __.findIndex(items, {$$pdfid: item.$$pdfid, pageIdx: item.pageIdx});
		}
		function isContainInList(item, items) {
			return __.some(items, {$$pdfid: item.$$pdfid, pageIdx: item.pageIdx});
		}
		function getItemInList(item, items) {
			return item && __.find(items, {$$pdfid: item.$$pdfid, pageIdx: item.pageIdx});
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
			return __.isMatch(item1, {$$pdfid: item2.$$pdfid, pageIdx: item2.pageIdx});
		}
		/**
		 * Genere l'id du pdf pour l'item 
		 * @param {Object} pdf
		 * @returns {String}
		 */
		function id(pdf) {
			var pdfid;
			if (pdf) {
				pdfid = pdf.id || pdf.url;
				if (!pdfid) {
					pdfid = !pdf.data ? hash(pdf) : uuid();
				}
			}
			return pdfid;
		}
		/**
		 * Genere un hash de l'objet pdf pour l'item 
		 * @param {Object} pdf
		 * @returns {String}
		 */
		function hash(pdf) {
			return JSON.stringify(pdf);
		}
		/**
		 * Genere un uuid
		 * @returns {String}
		 */
		function uuid() {
			var buf = new Uint32Array(4);
			getCryptoObj().getRandomValues(buf);
			var idx = -1;
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
				idx++;
				var r = (buf[idx >> 3] >> ((idx % 8) * 4)) & 15;
				var v = c === 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
		}
		function getCryptoObj() {
			return window.crypto || window.msCrypto || {
				getRandomValues: function (buf) {
					for (var i = 0, l = buf.length; i < l; i++) {
						buf[i] = Math.floor(Math.random() * 256);
					}
					return buf;
				}
			};
		}
	}
})(angular, _);