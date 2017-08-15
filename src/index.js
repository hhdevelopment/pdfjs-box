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
		ctrl.items = [];
		ctrl.items2 = [];
		ctrl.selectedDocument;
		ctrl.scale;
		ctrl.selectedItem;
		ctrl.globalData = {test:5};
		ctrl.urlSupplier = urlSupplier;
		ctrl.labelSupplier = labelSupplier;
		function urlSupplier(document, data) {
			return document.url;
		}
		function labelSupplier(document, data, index) {
			return document.label + ' ('+index+')';
		}

		
		ctrl.onSave = onSave;
		function onSave(pages) {
			
		}
	}
})(angular, _);
