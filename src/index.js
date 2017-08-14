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
		ctrl.scale;
		ctrl.items = [];
		ctrl.items2 = [];
		ctrl.selectedItem;
		ctrl.globalData = {test:5};
		ctrl.urlSupplier = urlSupplier;
		ctrl.labelSupplier = labelSupplier;
		ctrl.selectDocument = selectDocument;
		ctrl.onSave = onSave;
		function selectDocument(doc) {
			ctrl.scale = null;
			ctrl.selectedItem = null;
			ctrl.selectedDocument = doc;
			
		}
		function urlSupplier(document, data) {
			return document.url;
		}
		function labelSupplier(document, data, index) {
			return document.label + ' ('+index+')';
		}
		function onSave(pages) {
			
		}
	}
})(angular, _);
