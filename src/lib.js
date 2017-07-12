const MODE_SELECT = 'MODE_SELECT';
const MODE_PAN = 'MODE_PAN';
const ZOOM_IN = 'ZOOM_IN';
const ZOOM_OUT = 'ZOOM_OUT';
const MODE_CREATE_RECT = 'MODE_CREATE_RECT';

class ImageSelector {
    constructor(container, buttonContainer, width = 640, height = 480) {
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
        this.controls = { };
        this.panOrigin = {
            x: 0,
            y: 0
        };
        
        /**
         * append canvas
         */

        let canvas = document.createElement('canvas');
        canvas.id = 'image-selector-canvas';
        canvas.width = width;
        canvas.height = height;
        
        container.appendChild(canvas);

        this.canvas = new fabric.Canvas(canvas);

        /**
         * get controls
         */
        this.controls.btnSelect = buttonContainer.querySelector(`[data-mode="${MODE_SELECT}"]`);
        this.controls.btnMove = buttonContainer.querySelector(`[data-mode="${MODE_PAN}"]`);
        this.controls.btnZoomIn = buttonContainer.querySelector(`[data-action="${ZOOM_IN}"]`);
        this.controls.btnZoomOut = buttonContainer.querySelector(`[data-action="${ZOOM_OUT}"]`);
        this.controls.btnAddRect = buttonContainer.querySelector(`[data-mode="${MODE_CREATE_RECT}"]`);

        for(let btn in this.controls) {
            this.controls[btn].addEventListener('click', (ctrl) => {
                let mode = ctrl.target.getAttribute('data-mode');
                let action = ctrl.target.getAttribute('data-action');
                if (mode) {
                    this.switchMode(mode);
                }
                if (action) {
                    this.doAction(action);
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
    bindCanvasEvent() {
        this.canvas.on('mouse:down', (mdEvent) => {
            let { offsetX, offsetY } = mdEvent.e;
            this.canvas.on('mouse:move', (mmEvent) => {
                if (this.currentMode === MODE_PAN) {
                    let deltaX = mmEvent.e.offsetX - offsetX - this.panOrigin.x;
                    let deltaY = mmEvent.e.offsetY - offsetY - this.panOrigin.y;
                    let delta = new fabric.Point(-deltaX, -deltaY);
                    this.canvas.absolutePan(delta);
                }
            });

            this.canvas.off('mouse:up');
            this.canvas.on('mouse:up', (muEvent) => {
                this.canvas.off('mouse:move');
                if (this.currentMode === MODE_PAN) {
                    this.panOrigin.x -= muEvent.e.offsetX - offsetX;
                    this.panOrigin.y -= muEvent.e.offsetY - offsetY;

                    console.log(this.panOrigin);
                }
                else if (this.currentMode === MODE_CREATE_RECT) {
                    let x = offsetX < muEvent.e.offsetX ? offsetX : muEvent.e.offsetX;
                    let y = offsetY < muEvent.e.offsetY ? offsetY : muEvent.e.offsetY;
                    let width = Math.abs(offsetX - muEvent.e.offsetX);
                    let height = Math.abs(offsetY - muEvent.e.offsetY);

                    this.createRect(x, y, width, height);
                }
            });
        });

    }

    /**
     * reset Editor
     */
    resetEditor() {
        this.canvas.clear();
        this.currentEditingImage = false;
        this.squareSelections = [];
        this.roundSelections = [];
        this.polygonSelections = [];
    }

    /**
     * switch mode
     * @param {*} mode 
     */
    switchMode(mode) {
        this.currentMode = mode;
        switch(mode) {
            default:
            case MODE_SELECT:
                this.switchToModeSelect();
                break;
            case MODE_PAN:
                this.switchToModePan();
                break;
            case MODE_CREATE_RECT:
                this.switchToModeDrawSelection();
                break;
        }
    }

    /**
     * do action on editor
     * @param {*} action 
     */
    doAction(action) {
        switch(action) {
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
     * Add new image to editor
     * @param {*} imageUrl 
     */
    addImagefromUrl(imageUrl) {
        if (this.currentEditingImage) {
            this.canvas.remove(this.currentEditingImage);
            this.currentEditingImage = false;
        }

        let img = fabric.Image.fromURL(imageUrl, (img) => {
            this.currentEditingImage = img;
            let wRatio = this.canvas.width / img.width;
            let hRatio = this.canvas.height / img.height;
            let scale = wRatio > hRatio ? hRatio : wRatio;
            img.set({
                scaleX: scale,
                scaleY: scale
            });
            this.canvas.add(img);
        });
    }

    /**
     * turn on select picture mode
     */
    switchToModeSelect() {
        this.toggleSelection(true);
    }

    toggleSelection(enable) {
        this.canvas.selection = enable;
        this.currentEditingImage.selectable = enable;
        this.squareSelections.forEach((item) => {
            item.selectable = enable;
        });
        this.roundSelections.forEach((item) => {
            item.selectable = enable;
        });
        this.polygonSelections.forEach((item) => {
            item.selectable = enable;
        });
        this.canvas.discardActiveGroup();
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
    }

    /**
     * switch to selection mode
     */
    switchToModePan() {
        this.toggleSelection(false);
    }

    switchToModeDrawSelection() {
        this.toggleSelection(false);
        this.canvas.selection = true;
    }

    /**
     * Zoom In Editor
     */
    zoomIn() {
        let zoom = this.canvas.getZoom();
        if (zoom < this.maxZoom) {
            zoom++;
            this.canvas.setZoom(zoom);
        }
    }

    /**
     * Zoom Out Editor
     */
    zoomOut() {
        let zoom = this.canvas.getZoom();
        if (zoom > this.minZoom) {
            zoom--;
            this.canvas.setZoom(zoom);
        }
    }

    createRect(x, y, width, height) {
        this.switchMode(MODE_SELECT);

        let rect = new fabric.Rect({
            left: x / this.canvas.getZoom(),
            top: y / this.canvas.getZoom(),
            width: width / this.canvas.getZoom(),
            height: height / this.canvas.getZoom(),
            fill: 'rgba(0,0,0,0)',
            strokeWidth: 1,
            strokeDashArray: [3,3],
            stroke: '#000000'
        });

        this.squareSelections.push(rect);
        this.canvas.add(rect);
        this.canvas.setActiveObject(rect);
    }
}