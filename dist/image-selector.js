'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MODE_SELECT = 'MODE_SELECT';
var MODE_PAN = 'MODE_PAN';
var ZOOM_IN = 'ZOOM_IN';
var ZOOM_OUT = 'ZOOM_OUT';

var ImageSelector = function () {
    function ImageSelector(container, buttonContainer) {
        var _this = this;

        var width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 640;
        var height = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 480;

        _classCallCheck(this, ImageSelector);

        if (!container || !buttonContainer) {
            alert('Please identity a container for containing editor!');
        }
        this.minZoom = 1;
        this.maxZoom = 10;
        this.currentMode = MODE_SELECT;
        this.currentEditingImage = false;
        this.squareSelections = [];
        this.roundSelections = [];
        this.polygonSelections = [];
        this.controls = {};
        this.panOrigin = {
            x: 0,
            y: 0
        };

        /**
         * append canvas
         */

        var canvas = document.createElement('canvas');
        canvas.id = 'image-selector-canvas';
        canvas.width = width;
        canvas.height = height;

        container.appendChild(canvas);

        this.canvas = new fabric.Canvas(canvas);

        /**
         * get controls
         */
        this.controls.btnSelect = buttonContainer.querySelector('[data-mode="' + MODE_SELECT + '"]');
        this.controls.btnMove = buttonContainer.querySelector('[data-mode="' + MODE_PAN + '"]');
        this.controls.btnZoomIn = buttonContainer.querySelector('[data-action="' + ZOOM_IN + '"]');
        this.controls.btnZoomOut = buttonContainer.querySelector('[data-action="' + ZOOM_OUT + '"]');

        for (var btn in this.controls) {
            this.controls[btn].addEventListener('click', function (ctrl) {
                var mode = ctrl.target.getAttribute('data-mode');
                var action = ctrl.target.getAttribute('data-action');
                if (mode) {
                    _this.switchMode(mode);
                }
                if (action) {
                    _this.doAction(action);
                }
            });
        };

        /**
         * canvas event
         */
        this.bindCanvasEvent();
    }

    /**
     * bind canvas event
     */


    _createClass(ImageSelector, [{
        key: 'bindCanvasEvent',
        value: function bindCanvasEvent() {
            var _this2 = this;

            this.canvas.on('mouse:down', function (mdEvent) {
                var _mdEvent$e = mdEvent.e,
                    offsetX = _mdEvent$e.offsetX,
                    offsetY = _mdEvent$e.offsetY;

                _this2.canvas.on('mouse:move', function (mmEvent) {
                    if (_this2.currentMode === MODE_PAN) {
                        var deltaX = mmEvent.e.offsetX - offsetX - _this2.panOrigin.x;
                        var deltaY = mmEvent.e.offsetY - offsetY - _this2.panOrigin.y;
                        var delta = new fabric.Point(-deltaX, -deltaY);
                        _this2.canvas.absolutePan(delta);
                    }
                });

                _this2.canvas.off('mouse:up');
                _this2.canvas.on('mouse:up', function (muEvent) {
                    _this2.canvas.off('mouse:move');
                    if (_this2.currentMode === MODE_PAN) {
                        _this2.panOrigin.x -= muEvent.e.offsetX - offsetX;
                        _this2.panOrigin.y -= muEvent.e.offsetY - offsetY;

                        console.log(_this2.panOrigin);
                    }
                });
            });
        }

        /**
         * reset Editor
         */

    }, {
        key: 'resetEditor',
        value: function resetEditor() {
            this.canvas.clear();
            this.currentEditingImage = false;
            this.squareSelections = [];
            this.roundSelections = [];
            this.polygonSelections = [];
        }

        /**
         * Add new image to editor
         * @param {*} imageUrl 
         */

    }, {
        key: 'addImagefromUrl',
        value: function addImagefromUrl(imageUrl) {
            var _this3 = this;

            if (this.currentEditingImage) {
                this.canvas.remove(this.currentEditingImage);
                this.currentEditingImage = false;
            }

            var img = fabric.Image.fromURL(imageUrl, function (img) {
                _this3.currentEditingImage = img;
                var wRatio = _this3.canvas.width / img.width;
                var hRatio = _this3.canvas.height / img.height;
                var scale = wRatio > hRatio ? hRatio : wRatio;
                img.set({
                    scaleX: scale,
                    scaleY: scale
                });
                _this3.canvas.add(img);
            });
        }

        /**
         * switch mode
         * @param {*} mode 
         */

    }, {
        key: 'switchMode',
        value: function switchMode(mode) {
            this.currentMode = mode;
            switch (mode) {
                default:
                case MODE_SELECT:
                    this.switchToModeSelect();
                    break;
                case MODE_PAN:
                    this.switchToModePan();
                    break;
            }
        }

        /**
         * turn on select picture mode
         */

    }, {
        key: 'switchToModeSelect',
        value: function switchToModeSelect() {
            this.canvas.selection = true;
            this.currentEditingImage.selectable = true;
            this.squareSelections.forEach(function (item) {
                item.selectable = true;
            });
            this.roundSelections.forEach(function (item) {
                item.selectable = true;
            });
            this.polygonSelections.forEach(function (item) {
                item.selectable = true;
            });
            this.canvas.renderAll();
        }

        /**
         * switch to selection mode
         */

    }, {
        key: 'switchToModePan',
        value: function switchToModePan() {
            this.canvas.selection = false;
            this.currentEditingImage.selectable = false;
            this.squareSelections.forEach(function (item) {
                item.selectable = false;
            });
            this.roundSelections.forEach(function (item) {
                item.selectable = false;
            });
            this.polygonSelections.forEach(function (item) {
                item.selectable = false;
            });
            this.canvas.renderAll();
        }

        /**
         * do action on editor
         * @param {*} action 
         */

    }, {
        key: 'doAction',
        value: function doAction(action) {
            switch (action) {
                case ZOOM_IN:
                    this.zoomIn();
                    break;
                case ZOOM_OUT:
                    this.zoomOut();
                    break;
                default:
                    break;
            }
        }

        /**
         * Zoom In Editor
         */

    }, {
        key: 'zoomIn',
        value: function zoomIn() {
            var zoom = this.canvas.getZoom();
            if (zoom < this.maxZoom) {
                zoom++;
                this.canvas.setZoom(zoom);
            }
        }

        /**
         * Zoom Out Editor
         */

    }, {
        key: 'zoomOut',
        value: function zoomOut() {
            var zoom = this.canvas.getZoom();
            if (zoom > this.minZoom) {
                zoom--;
                this.canvas.setZoom(zoom);
            }
        }
    }]);

    return ImageSelector;
}();
