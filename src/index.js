import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';

import angular from 'angular';
//var angular = require('angular');

require('./pdfjsbox.css');
require('./pdfjsbox.js');

(function (ng, __) {
	'use strict';
	ng.module('app', ['pdfjs-box'])
			  .constant('pdfjsConfig', { workerSrc: './pdf.worker.bundle.js', preloadRecursivePages:7 } )
			  .controller('AppCtrl', AppCtrl);
	function AppCtrl() {
		var ctrl = this;
		ctrl.documents = [{label:'Conditions générales', url:'document.pdf'}, {label:'Contract', url:'document2.pdf'}, {label:'UnicodeStandard', url:'UnicodeStandard.pdf'}];
		ctrl.selectedDocument;
		ctrl.pdfInfo;;
		ctrl.scale = 0;;
		ctrl.items = [];
		ctrl.items2 = [];
		ctrl.selectedItem;
		ctrl.globalData = {test:5};
		ctrl.urlSupplier = urlSupplier;
		ctrl.labelSupplier = labelSupplier;
		ctrl.selectDocument = selectDocument;
		ctrl.onSave = onSave;
		function selectDocument(doc) {
			ctrl.selectedDocument = doc;
			ctrl.selectedItem = null;
		}
		function urlSupplier(document, data) {
			return document.url;
		}
		function labelSupplier(document, data, index) {
			return document.label + ' ('+index+')';
		}
		function onSave(pages) {
			
		}
		function onSelectItem(item) {
			ctrl.scale = 1;
			var pdfPage = item.pdfPage;
			if (pdfPage) {
				var view = pdfPage.view;
				ctrl.scale = (600 || 100) / Math.max(view[2], view[3]);
			}
			ctrl.selectedItem = item;
		}
	}
})(angular, _);
