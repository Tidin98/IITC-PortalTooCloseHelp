// ==UserScript==
// @name       TOO CLOSE HELPER
// @namespace   asdfsadvcwcwvqw
// @match          https://intel.ingress.com/*
// @author lokpro
// @updateURL  https://github.com/Tidin98/IITC-PortalTooCloseHelp/raw/refs/heads/master/IITC_tooCloseHelper.user.js
// @downloadURL  https://github.com/Tidin98/IITC-PortalTooCloseHelp/raw/refs/heads/master/IITC_tooCloseHelper.user.js
// @version     1.9.1
// @grant       none
// ==/UserScript==

// ensure plugin framework is there, even if iitc is not yet loaded
if (typeof window.plugin !== 'function') window.plugin = function() {};

window.plugin.tooCloseHelper = function() {};

var tch = window.plugin.tooCloseHelper;

tch.STORAGE_KEY = 'tooCloseHelper_savedPoints';
tch.savedPoints = [];

tch.savePoints = function() {
	try {
		var dataToSave = tch.savedPoints.map(function(point) {
			return {
				lat: point.marker.getLatLng().lat,
				lng: point.marker.getLatLng().lng,
				meter: point.meter,
				options: point.options
			};
		});
		localStorage.setItem(tch.STORAGE_KEY, JSON.stringify(dataToSave));
	} catch (e) {
		console.error('TooCloseHelper: Failed to save points:', e);
	}
};

tch.loadSavedPoints = function() {
	try {
		var saved = localStorage.getItem(tch.STORAGE_KEY);
		if (saved) {
			var savedData = JSON.parse(saved);
			tch.savedPoints = [];
			savedData.forEach(function(pointData) {
				tch.restorePoint(pointData);
			});
		}
	} catch (e) {
		console.error('TooCloseHelper: Failed to load saved points:', e);
	}
};

tch.restorePoint = function(pointData) {
	var coord = L.latLng(pointData.lat, pointData.lng);
	tch.addCustomPoint(coord, pointData.meter, pointData.options, false);
};

tch.clearAllTestPoints = function() {
	tch.savedPoints.forEach(function(point) {
		map.removeLayer(point.circle);
		map.removeLayer(point.marker);
	});
	tch.savedPoints = [];
	localStorage.removeItem(tch.STORAGE_KEY);
	tch.refreshDialog();
};

tch.addTestPoint20m = function() {
	var c = map.getCenter();
	tch.addCustomPoint(c, 20, { color: '#2255bb', weight: 1 }, true);
	tch.refreshDialog();
};

tch.addCustomPoint = function(coord, meter, options, shouldSave) {
	if (shouldSave === undefined) shouldSave = true;

	var c = L.circle(coord, meter, options).addTo(map);

	// Custom icon: anchor at the tip of the stick (touch point),
	// dot appears above the finger on mobile.
	var mobileIcon = L.divIcon({
		className: '',
		html: '<div style="position:relative;width:0;height:0">' +
			'<div style="position:absolute;left:-1.5px;top:-68px;width:3px;height:68px;background:#2255bb;box-shadow:0 0 3px rgba(0,0,0,0.4)"></div>' +
			'<div style="position:absolute;left:-12px;top:-80px;width:20px;height:20px;border-radius:50%;background:#2255bb;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.6)"></div>' +
			'</div>',
		iconAnchor: [0, 0],
		iconSize: [0, 0]
	});

	var m = L.marker(coord, { draggable: true, icon: mobileIcon })
		.addTo(map)
		.on('drag', function(e) {
			// Real-time circle update during drag
			c.setLatLng(e.target.getLatLng());
		})
		.on('dragend', function(e) {
			c.setLatLng(e.target.getLatLng());
			tch.savePoints();
		});

	tch.savedPoints.push({ circle: c, marker: m, meter: meter, options: options });

	if (shouldSave) {
		tch.savePoints();
	}
};

tch.addMapControl = function() {
	var TchControl = L.Control.extend({
		options: { position: 'topleft' },
		onAdd: function() {
			var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');

			var btn = L.DomUtil.create('a', '', container);
			btn.href = '#';
			btn.title = '';
			btn.innerHTML = '&#x2295;'; // ⊕
			btn.style.fontSize = '18px';

			L.DomEvent
				.on(btn, 'click', L.DomEvent.stopPropagation)
				.on(btn, 'click', L.DomEvent.preventDefault)
				.on(btn, 'click', tch.addTestPoint20m);

			L.DomEvent.disableClickPropagation(container);
			return container;
		}
	});
	map.addControl(new TchControl());
};

tch.buildDialogHtml = function() {
	var count = tch.savedPoints.length;
	return '<div style="padding:4px">' +
		'<button style="width:100%;margin-bottom:6px" ' +
			'onclick="window.plugin.tooCloseHelper.addTestPoint20m()">Add 20m test point</button>' +
		'<button style="width:100%;margin-bottom:8px" ' +
			'onclick="window.plugin.tooCloseHelper.clearAllTestPoints()">Clear all points</button>' +
		'<div style="text-align:center;font-size:0.85em;color:#aaa">' +
			count + ' point' + (count === 1 ? '' : 's') + ' on map' +
		'</div>' +
		'</div>';
};

tch.showDialog = function() {
	window.dialog({
		html: tch.buildDialogHtml(),
		title: 'Too Close Helper',
		id: 'plugin-tooclose-dialog',
		width: 220,
	});
};

tch.refreshDialog = function() {
	// Re-render the dialog content if it is currently open
	var dlg = window.DIALOGS && window.DIALOGS['dialog-plugin-tooclose-dialog'];
	if (dlg) {
		dlg.html(tch.buildDialogHtml());
	}
};

tch.boot = function() {
	// Add button to IITC toolbox
	if (window.IITC && IITC.toolbox) {
		IITC.toolbox.addButton({
			label: 'Too Close',
			title: 'Portal proximity helper (20m rule)',
			action: tch.showDialog,
		});
	} else {
		$('#toolbox').append(
			' <a onclick="window.plugin.tooCloseHelper.showDialog()" ' +
			'title="Portal proximity helper (20m rule)">Too Close</a>'
		);
	}

	tch.addMapControl();
	tch.loadSavedPoints();
};

function setup() {
	tch.boot();
}

if (!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the setup function
if (window.iitcLoaded && typeof setup === 'function') setup();
