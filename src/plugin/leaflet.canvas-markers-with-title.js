'use strict';

function layerFactory(L) {

    var CanvasIconLayer = (L.Layer ? L.Layer : L.Class).extend({

        //Add event listeners to initialized section.
        initialize: function (options) {

            L.setOptions(this, options);
            this._onClickListeners = [];
            this._onHoverListeners = [];
        },

        setOptions: function (options) {

            L.setOptions(this, options);
            return this.redraw();
        },

        redraw: function () {

            this._redraw(true);
        },

        //Multiple layers at a time for rBush performance
        addMarkers: function (markers, title, titleOpt, additional) {

            var self = this;
            var tmpMark = [];
            var tmpLatLng = [];

            markers.forEach(function (marker) {

                if (!((marker.options.pane == 'markerPane') && marker.options.icon)) {
                    console.error('Layer isn\'t a marker');
                    return;
                }

                var latlng = marker.getLatLng();
                var isDisplaying = self._map.getBounds().contains(latlng);
                var s = self._addMarker(marker, latlng, isDisplaying, title, titleOpt, additional);

                //Only add to Point Lookup if we are on map
                if (isDisplaying === true) tmpMark.push(s[0]);

                tmpLatLng.push(s[1]);
            });

            self._markers.load(tmpMark);
            self._latlngMarkers.load(tmpLatLng);
        },

        //Adds single layer at a time. Less efficient for rBush
        addMarker: function (marker, title, titleOpt, additional) {

            var self = this;
            var latlng = marker.getLatLng();
            var isDisplaying = self._map.getBounds().contains(latlng);
            var dat = self._addMarker(marker, latlng, isDisplaying, title, titleOpt, additional);

            //Only add to Point Lookup if we are on map
            if (isDisplaying === true) self._markers.insert(dat[0]);

            self._latlngMarkers.insert(dat[1]);
        },

        addLayer: function (layer) {

            if ((layer.options.pane == 'markerPane') && layer.options.icon) this.addMarker(layer);
            else console.error('Layer isn\'t a marker');
        },

        addLayers: function (layers) {

            this.addMarkers(layers);
        },

        removeLayer: function (layer) {

            this.removeMarker(layer, true);
        },

        removeMarker: function (marker, redraw) {

            var self = this;

            //If we are removed point
            if (marker["minX"]) marker = marker.data;

            var latlng = marker.getLatLng();
            var isDisplaying = self._map.getBounds().contains(latlng);

            var markerData = {

                minX: latlng.lng,
                minY: latlng.lat,
                maxX: latlng.lng,
                maxY: latlng.lat,
                data: marker
            };

            self._latlngMarkers.remove(markerData, function (a, b) {

                return a.data._leaflet_id === b.data._leaflet_id;
            });

            self._latlngMarkers.total--;
            self._latlngMarkers.dirty++;

            if (isDisplaying === true && redraw === true) {

                self._redraw(true);
            }
        },

        onAdd: function (map) {

            this._map = map;

            if (!this._canvas) this._initCanvas();

            if (this.options.pane) this.getPane().appendChild(this._canvas);
            else map._panes.overlayPane.appendChild(this._canvas);

            map.on('moveend', this._reset, this);
            map.on('resize', this._reset, this);
            map.on('zoom', this._reset, this);

            map.on('click', this._executeListeners, this);
            map.on('mousemove', this._executeListeners, this);
        },

        onRemove: function (map) {

            if (this.options.pane) this.getPane().removeChild(this._canvas);
            else map.getPanes().overlayPane.removeChild(this._canvas);
        },

        addTo: function (map) {

            map.addLayer(this);
            return this;
        },

        clearLayers: function() {

            this._latlngMarkers = null;
            this._markers = null;
            this._redraw(true);
        },

        _addMarker: function (marker, latlng, isDisplaying, title, titleOpt, additional) {

            var self = this;
            //Needed for pop-up & tooltip to work.
            marker._map = self._map;

            //_markers contains Points of markers currently displaying on map
            if (!self._markers) self._markers = new rbush();

            //_latlngMarkers contains Lat\Long coordinates of all markers in layer.
            if (!self._latlngMarkers) {
                self._latlngMarkers = new rbush();
                self._latlngMarkers.dirty = 0;
                self._latlngMarkers.total = 0;
            }

            L.Util.stamp(marker);

            var pointPos = self._map.latLngToContainerPoint(latlng);
            var iconSize = marker.options.icon.options.iconSize;

            var adj_x = iconSize[0];
            var adj_y = iconSize[1];
            var ret = [({
                minX: (pointPos.x - marker.options.icon.options.iconAnchor[0]),
                minY: (pointPos.y - marker.options.icon.options.iconAnchor[1]),
                maxX: (pointPos.x + adj_x - marker.options.icon.options.iconAnchor[0]),
                maxY: (pointPos.y + adj_y - marker.options.icon.options.iconAnchor[1]),
                data: marker,
                title,
                titleOpt, additional
            }), ({
                minX: latlng.lng,
                minY: latlng.lat,
                maxX: latlng.lng,
                maxY: latlng.lat,
                data: marker,
                title,
                titleOpt, additional
            })];

            self._latlngMarkers.dirty++;
            self._latlngMarkers.total++;

            //Only draw if we are on map
            if (isDisplaying === true) self._drawMarker(marker, pointPos, title, titleOpt, additional);

            return ret;
        },

        _drawMarker: function (marker, pointPos, title, titleOpt, additional) {

            console.log('draw', title);
            var self = this;

            if (!this._imageLookup) this._imageLookup = {};
            if (!pointPos) {

                pointPos = self._map.latLngToContainerPoint(marker.getLatLng());
            }

            var iconUrl = marker.options.icon.options.iconUrl;

            if (marker.canvas_img) {

                self._drawImage(marker, pointPos, title, titleOpt, additional);
            }
            else {

                if (self._imageLookup[iconUrl]) {

                    marker.canvas_img = self._imageLookup[iconUrl][0];

                    if (self._imageLookup[iconUrl][1] === false) {

                        self._imageLookup[iconUrl][2].push([marker, pointPos]);
                    }
                    else {

                        self._drawImage(marker, pointPos, title, titleOpt, additional);
                    }
                }
                else {

                    var i = new Image();
                    i.src = iconUrl;
                    marker.canvas_img = i;

                    //Image,isLoaded,marker\pointPos ref
                    self._imageLookup[iconUrl] = [i, false, [[marker, pointPos]]];

                    i.onload = function () {

                        self._imageLookup[iconUrl][1] = true;
                        self._imageLookup[iconUrl][2].forEach(function (e) {

                            self._drawImage(e[0], e[1], title, titleOpt, additional);
                        });
                    }
                }
            }
        },

        /*
        titleOpt {
            normal{
                font: string;
                color: string;
                borderColor: string;
                borderWidth: number;
            }
            hover{

            }
            active{

            }
        }
         */

        _drawImage: function (marker, pointPos, title, titleOpt, additional) {

            var options = marker.options.icon.options;

            this._context.drawImage(
                marker.canvas_img,
                pointPos.x - options.iconAnchor[0],
                pointPos.y - options.iconAnchor[1],
                options.iconSize[0],
                options.iconSize[1]
            );
            this._context.lineWidth = titleOpt.normal.borderWidth;

            
            this._context.font = titleOpt.normal.font;

            // underline

            if (this._hoveredMarker && this._hoveredMarker === additional) {
                this._context.strokeStyle = titleOpt.normal.color;
                this._context.moveTo(
                    pointPos.x - options.iconAnchor[0] + options.iconSize[0],
                    pointPos.y - options.iconAnchor[1] + options.iconSize[1]
                );
                this._context.lineTo(pointPos.x - options.iconAnchor[0] + options.iconSize[0] + this._context.measureText(title).width, pointPos.y - options.iconAnchor[1] + options.iconSize[1]);
                this._context.lineWidth = 1.5;
                this._context.stroke();
                this._context.textBaseline = "Alphabetic";
            }


            // title
            this._context.strokeStyle = titleOpt.normal.borderColor;
            this._context.strokeText(title, pointPos.x - options.iconAnchor[0] + options.iconSize[0], pointPos.y - options.iconAnchor[1] + options.iconSize[1]);
            this._context.fillStyle = titleOpt.normal.color;
            this._context.fillText(title, pointPos.x - options.iconAnchor[0] + options.iconSize[0], pointPos.y - options.iconAnchor[1] + options.iconSize[1]);

        },

        _reset: function () {

            var topLeft = this._map.containerPointToLayerPoint([0, 0]);
            L.DomUtil.setPosition(this._canvas, topLeft);

            var size = this._map.getSize();

            this._canvas.width = size.x;
            this._canvas.height = size.y;

            this._redraw();
        },

        _redraw: function (clear) {

            var self = this;

            if (clear) this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
            
            if (!this._map || !this._latlngMarkers) return;

            var tmp = [];

            //If we are 10% individual inserts\removals, reconstruct lookup for efficiency
            if (self._latlngMarkers.dirty / self._latlngMarkers.total >= .1) {

                self._latlngMarkers.all().forEach(function (e) {

                    tmp.push(e);
                });

                self._latlngMarkers.clear();
                self._latlngMarkers.load(tmp);
                self._latlngMarkers.dirty = 0;
                tmp = [];
            }

            var mapBounds = self._map.getBounds();

            //Only re-draw what we are showing on the map.

            var mapBoxCoords = {

                minX: mapBounds.getWest(),
                minY: mapBounds.getSouth(),
                maxX: mapBounds.getEast(),
                maxY: mapBounds.getNorth(),
            };

            self._latlngMarkers.search(mapBoxCoords).forEach(function (e) {

                //Readjust Point Map
                var pointPos = self._map.latLngToContainerPoint(e.data.getLatLng());

                var iconSize = e.data.options.icon.options.iconSize;
                var adj_x = iconSize[0];
                var adj_y = iconSize[1];

                var newCoords = {

                    minX: (pointPos.x - e.data.options.icon.options.iconAnchor[0]),
                    minY: (pointPos.y - e.data.options.icon.options.iconAnchor[1]),
                    maxX: (pointPos.x + adj_x - e.data.options.icon.options.iconAnchor[0]),
                    maxY: (pointPos.y + adj_y - e.data.options.icon.options.iconAnchor[1]),
                    data: e.data,
                    title: e.title,
                    titleOpt: e.titleOpt,
                    additional: e.additional
                }

                tmp.push(newCoords);

                //Redraw points
                self._drawMarker(e.data, pointPos, e.title, e.titleOpt, e.additional);
            });

            //Clear rBush & Bulk Load for performance
            this._markers.clear();
            this._markers.load(tmp);
        },

        _initCanvas: function () {

            this._canvas = L.DomUtil.create('canvas', 'leaflet-canvas-icon-layer leaflet-layer');
            var originProp = L.DomUtil.testProp(['transformOrigin', 'WebkitTransformOrigin', 'msTransformOrigin']);
            this._canvas.style[originProp] = '50% 50%';

            var size = this._map.getSize();
            this._canvas.width = size.x;
            this._canvas.height = size.y;

            this._context = this._canvas.getContext('2d');

            var animated = this._map.options.zoomAnimation && L.Browser.any3d;
            L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));
        },

        addOnClickListener: function (listener) {
            this._onClickListeners.push(listener);
        },

        addOnHoverListener: function (listener) {
            this._onHoverListeners.push(listener);
        },

        _executeListeners: function (event) {

            var me = this;
            var x = event.containerPoint.x;
            var y = event.containerPoint.y;

            if (me._openToolTip) {

                me._openToolTip.closeTooltip();
                delete me._openToolTip;
            }

            var ret = this._markers.search({ minX: x, minY: y, maxX: x, maxY: y });

            if (ret && ret.length > 0) {

                me._map._container.style.cursor = "pointer";

                if (event.type === "click") {

                    var hasPopup = ret[0].data.getPopup();
                    if (hasPopup) ret[0].data.openPopup();

                    me._onClickListeners.forEach(function (listener) { listener(event, ret); });
                }

                if (event.type === "mousemove") {
                    var hasTooltip = ret[0].data.getTooltip();
                    if (hasTooltip) {
                        me._openToolTip = ret[0].data;
                        ret[0].data.openTooltip();
                    }

                    // mouse enter
                    this._lasthoveredMarker = this._hoveredMarker;
                    this._hoveredMarker = ret[0].additional;
                    if (this._lasthoveredMarker !== this._hoveredMarker) {
                        this._reset();
                    }

                    me._onHoverListeners.forEach(function (listener) { listener(event, ret); });
                }
            }
            else {

                me._map._container.style.cursor = "";

                // mouse leave
                this._lasthoveredMarker = this._hoveredMarker;
                this._hoveredMarker = null;
                if (this._lasthoveredMarker !== this._hoveredMarker) {
                    this._reset();
                }
            }
        }
    });

    L.canvasIconLayer = function (options) {
        return new CanvasIconLayer(options);
    };
};

module.exports = layerFactory;
