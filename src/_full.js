var rbush = require("rbush");
var factory = require("./plugin/leaflet.canvas-markers-with-title");

window.L.CanvasIconLayer = factory(L);
window.rbush = rbush;
