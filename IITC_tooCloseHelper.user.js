// ==UserScript==
// @name       TOO CLOSE HELPER
// @namespace   asdfsadvcwcwvqw
// @match          https://intel.ingress.com/*
// @author lokpro
// @updateURL  https://github.com/Ingrass/IITC-PortalTooCloseHelp/raw/master/IITC_tooCloseHelper.user.js
// @downloadURL  https://github.com/Ingrass/IITC-PortalTooCloseHelp/raw/master/IITC_tooCloseHelper.user.js
// @version     1.4
// @grant       none
// ==/UserScript==

setTimeout( function(){

var W_PANE = 500;
var W_SIDE = 30;

// Storage for persistent markers
var savedPoints = [];
var STORAGE_KEY = 'tooCloseHelper_savedPoints';

function appendHtml(el, str) {
  var div = document.createElement('div');
  div.innerHTML = str;
  while (div.children.length > 0) {
      if ( div.children[0].tagName == 'LINK' ) {
          // Create an actual link element to append later
          style = document.createElement('link');
          style.href = div.children[0].href;
          // append your other things like rel, type, etc
          el.appendChild(style);
      }
      el.appendChild(div.children[0]);
  }
}

appendHtml( document.body, ' \
<div id="Panel_tooClose"> \
	TOO CLOSE HELPER <br> \
	<button onclick="addTestPoint20m()">add test point 20m</button> \
	<button onclick="clearAllTestPoints()">clear all points</button> \
	<div id="div_notification_icons" style="position:absolute; left:0; top:0; height:100%; width:'+(W_SIDE+3)+'px; overflow-wrap:break-word; text-align: center; background-color:#1a5757"><span style="font-size:20px">⦾</span></div> \
	<style> \
		#Panel_tooClose { border:1px solid #71ffff; color:#71ffff; background-color:#013030; position:fixed; z-index:99999; overflow-y:auto; bottom:100px; left: calc(100% - '+W_SIDE+'px); max-width:95%; width:'+W_PANE+'px; height:30px; padding:0px; padding-left:'+(W_SIDE+3)+'px; } \
		#Panel_tooClose:hover { right:0px; left: unset; padding-left:0px; height:100px; } \
		#Panel_tooClose:hover > #div_notification_icons { display: none;} \
		#Panel_tooClose button { height: 30px; } \
		#div_notification_icons>p { padding-bottom:4px; margin-bottom:6px; line-height:0.92em; background-color:#012020; } \
	</style>'
);


// Load saved points from localStorage
function loadSavedPoints() {
	try {
		var saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			var savedData = JSON.parse(saved);
			// Clear current savedPoints array
			savedPoints = [];
			// Restore each saved point
			savedData.forEach(function(pointData) {
				restorePoint(pointData);
			});
		}
	} catch (e) {
		console.error('Failed to load saved points:', e);
	}
}

// Save points to localStorage
function savePoints() {
	try {
		var dataToSave = savedPoints.map(function(point) {
			return {
				lat: point.marker.getLatLng().lat,
				lng: point.marker.getLatLng().lng,
				meter: point.meter,
				options: point.options
			};
		});
		localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
	} catch (e) {
		console.error('Failed to save points:', e);
	}
}

// Restore a point from saved data
function restorePoint(pointData) {
	var coord = L.latLng(pointData.lat, pointData.lng);
	addCustomPoint(coord, pointData.meter, pointData.options, false);
}

// Clear all test points
window.clearAllTestPoints = function() {
	savedPoints.forEach(function(point) {
		map.removeLayer(point.circle);
		map.removeLayer(point.marker);
	});
	savedPoints = [];
	localStorage.removeItem(STORAGE_KEY);
}


window.addTestPoint20m = function(){
	var c = map.getCenter();
	addCustomPoint( c, 20, { color: "#24B", weight: 1 }, true );
}

window.addCustomPoint = function( coord, meter, options, shouldSave ){
	if (shouldSave === undefined) shouldSave = true;

	var c = L.circle( coord, meter,
		options
	).addTo(map);

	var m = L.marker( coord ,
		{ draggable: true, icon: new L.Icon.Default() }
	).addTo(map)
	.on('dragend', function(e){
		var coords = e.target.getLatLng();
		c.setLatLng( coords );
		// Always save updated position after dragging
		savePoints();
	});

	// Store the point data
	var pointData = {
		circle: c,
		marker: m,
		meter: meter,
		options: options
	};
	savedPoints.push(pointData);

	// Save to localStorage only if shouldSave is true
	if (shouldSave) {
		savePoints();
	}
}

// Load saved points when script initializes
loadSavedPoints();

}, 5000);
