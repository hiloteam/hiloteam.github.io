/**
 * Hilo 0.1.0
 * Copyright 2014 Hilo.com
 * Licensed under the MIT License
 */

(function(window){

/**
 * @namespace Hilo的基础核心方法集合。
 * @static
 * @module hilo/core/Hilo
 */
var Hilo = (function(){

var win = window, doc = document, docElem = doc.documentElement,
    uid = 0;

return {
    /**
     * 获取一个全局唯一的id。如Stage1，Bitmap2等。
     * @param {String} prefix 生成id的前缀。
     */
    getUid: function(prefix){
        var id = ++uid;
        if(prefix){
            var charCode = prefix.charCodeAt(prefix.length - 1);
            if (charCode >= 48 && charCode <= 57) prefix += "_"; // 0至9之间添加下划线
            return prefix + id;
        }
        return id;
    },

    /**
     * 为指定的可视对象生成一个包含路径的字符串表示形式。如Stage1.Container2.Bitmap3。
     * @param {View} view 指定的可视对象。
     */
    viewToString: function(view){
        var result, obj = view;
        while(obj){
            result = result ? (obj.id + '.' + result) : obj.id;
            obj = obj.parent;
        }
        return result;
    },

    /**
     * 简单的浅复制对象。
     * @param {Object} target 要复制的目标对象。
     * @param {Object} source 要复制的源对象。
     * @param {Boolean} strict 指定是否覆盖已有属性，默认为false，即不覆盖。
     */
    copy: function(target, source, strict){
        for(var key in source){
            if(!strict || target.hasOwnProperty(key) || target[key] !== undefined){
                target[key] = source[key];
            }
        }
        return target;
    },

    /**
     * 浏览器特性。
     */
    browser: (function(){
        var ua = navigator.userAgent;
        var data = {
            iphone: /iphone/i.test(ua),
            ipad: /ipad/i.test(ua),
            ipod: /ipod/i.test(ua),
            android: /android/i.test(ua),
            webkit: /webkit/i.test(ua),
            chrome: /chrome/i.test(ua),
            safari: /safari/i.test(ua),
            firefox: /firefox/i.test(ua),
            ie: /msie/i.test(ua),
            opera: /opera/i.test(ua),
            supportTouch: 'ontouchstart' in win,
            supportCanvas: doc.createElement('canvas').getContext != null,
            supportStorage: false,
            supportOrientation: 'orientation' in win,
            supportDeviceMotion: 'ondevicemotion' in win
        };

        //`localStorage` is null or `localStorage.setItem` throws error in some cases (e.g. localStorage is disabled)
        try{
            var value = 'hilo';
            localStorage.setItem(value, value);
            localStorage.removeItem(value);
            data.supportStorage = true;
        }catch(e){ };

        //vendro prefix
        var jsVendor = data.jsVendor = data.webkit ? 'webkit' : data.firefox ? 'Moz' : data.opera ? 'O' : data.ie ? 'ms' : '';
        var cssVendor = data.cssVendor = '-' + jsVendor + '-';

        //css transform/3d feature dectection
        var testElem = doc.createElement('div'), style = testElem.style;
        var supportTransform = style[jsVendor + 'Transform'] != undefined;
        var supportTransform3D = style[jsVendor + 'Perspective'] != undefined;
        if(supportTransform3D){
            testElem.id = 'test3d';
            style = doc.createElement('style');
            style.textContent = '@media ('+ cssVendor +'transform-3d){#test3d{height:3px}}';
            doc.head.appendChild(style);

            docElem.appendChild(testElem);
            supportTransform3D = testElem.offsetHeight == 3;
            doc.head.removeChild(style);
            docElem.removeChild(testElem);
        };
        data.supportTransform = supportTransform;
        data.supportTransform3D = supportTransform3D;

        return data;
    })(),

    /**
     * 获取DOM元素在页面中的内容显示区域。
     * @param {HTMLElement} elem DOM元素。
     * @returns {Object} DOM元素的现实区域。格式为：{left:0, top:0, width:100, height:100}。
     */
    getElementRect: function(elem){
        try{
            //this fails if it's a disconnected DOM node
            var bounds = elem.getBoundingClientRect();
        }catch(e){
            bounds = {top: elem.offsetTop, left: elem.offsetLeft, width:elem.offsetWidth, height:elem.offsetHeight};
        }

        var offsetX = (win.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0);
        var offsetY = (win.pageYOffset || docElem.scrollTop) - (docElem.clientTop || 0);
        var styles = win.getComputedStyle ? getComputedStyle(elem) : elem.currentStyle;
        var parseIntFn = parseInt;
        var padLeft = parseIntFn(styles.paddingLeft) + parseIntFn(styles.borderLeftWidth);
        var padTop = parseIntFn(styles.paddingTop) + parseIntFn(styles.borderTopWidth);
        var padRight = parseIntFn(styles.paddingRight) + parseIntFn(styles.borderRightWidth);
        var padBottom = parseIntFn(styles.paddingBottom) + parseIntFn(styles.borderBottomWidth);

        return {
            left: bounds.left + offsetX + padLeft,
            top: bounds.top + offsetY + padTop,
            width: bounds.right - padRight - bounds.left - padLeft,
            height: bounds.bottom - padBottom - bounds.top - padTop
        };
    },

    /**
     * 创建一个DOM元素。可指定属性和样式。
     * @param {String} type 要创建的DOM元素的类型。比如：'div'。
     * @param {Object} properties 指定DOM元素的属性和样式。
     * @returns {HTMLElement} 一个DOM元素。
     */
    createElement: function(type, properties){
        var elem = doc.createElement(type), p, val, s;
        for(p in properties){
            val = properties[p];
            if(p === 'style'){
                for(s in val) elem.style[s] = val[s];
            }else{
                elem[p] = val;
            }
        }
        return elem;
    },

    /**
     * 设置可视对象DOM元素的CSS样式。
     * @param {View} obj 指定要设置CSS样式的可视对象。
     */
    setElementStyleByView: function(obj){
        var drawable = obj.drawable,
            image = drawable.image,
            rect = drawable.rect,
            style = drawable.domElement.style,
            prefix = Hilo.browser.jsVendor, px = 'px';

        style.pointerEvents = 'none';
        style.display = (!obj.visible || obj.alpha <= 0) ? 'none' : '';
        style.width = obj.width + px;
        style.height = obj.height + px;
        style.opacity = obj.alpha;
        style.zIndex = obj.depth;
        style[prefix + 'TransformOrigin'] = obj.pivotX + px + ' ' + obj.pivotY + px;
        style[prefix + 'Transform'] = this.getTransformCSS(obj);

        if(image){
            if(style.backgroundImage.indexOf(image.src) != 4){
                style.backgroundImage = 'url(' + image.src + ')';
            }
            if(rect){
                style.backgroundPosition = -rect[0] + px + ' ' + -rect[1] + px;
            }
        }

        if(obj.mask){
            style[prefix + 'MaskImage'] = obj.mask.drawable.domElement.style.backgroundImage;
            style[prefix + 'MaskRepeat'] = 'no-repeat';
            style[prefix + 'MaskPosition'] = obj.mask.x + px + ' ' + obj.mask.y + px;
        }
    },

    /**
     * 生成可视对象的CSS变换样式。
     * @param {View} obj 指定生成CSS变换样式的可视对象。
     * @returns {String} 生成的CSS样式字符串。
     */
    getTransformCSS: function(obj){
        var use3d = this.browser.supportTransform3D,
            str3d = use3d ? '3d' : '';

        return 'translate' + str3d + '(' + (obj.x - obj.pivotX) + 'px, ' + (obj.y - obj.pivotY) + (use3d ? 'px, 0px)' : 'px)')
             + 'rotate' + str3d + (use3d ? '(0, 0, 1, ' : '(') + obj.rotation + 'deg)'
             + 'scale' + str3d + '(' + obj.scaleX + ', ' + obj.scaleY + (use3d ? ', 1)' : ')');
    }
};

})();

/**
 * @namespace Class是提供类的创建的辅助工具。
 * @static
 * @module hilo/core/Class
 */
var Class = (function(){

/**
 * 此方法是在Hilo中创建类的主要方法。
 * @param {Object} properties 要创建的类的相关属性和方法。主要有：
 * <ul>
 * <li><b>Extends</b> - 指定要继承的父类。</li>
 * <li><b>Mixes</b> - 指定要混入的成员集合对象。</li>
 * <li><b>Statics</b> - 指定类的静态属性或方法。</li>
 * </ul>
 * @returns {Object} 创建好的类。
 */
var create = function(properties){
    properties = properties || {};
    var clazz = properties.hasOwnProperty('constructor') ? properties.constructor : function(){};
    implement.call(clazz, properties);
    return clazz;
}

/**
 * @private
 */
var implement = function(properties){
    var proto = {}, key, value;
    for(key in properties){
        value = properties[key];
        if(classMutators.hasOwnProperty(key)){
            classMutators[key].call(this, value);
        }else{
            proto[key] = value;
        }
    }

    mix(this.prototype, proto);
};

var classMutators = /** @ignore */{
    Extends: function(parent){
        var existed = this.prototype, proto = createProto(parent.prototype);
        //inherit static properites
        mix(this, parent);
        //keep existed properties
        mix(proto, existed);
        //correct constructor
        proto.constructor = this;
        //prototype chaining
        this.prototype = proto;
        //shortcut to parent's prototype
        this.superclass = parent.prototype;
    },

    Mixes: function(items){
        items instanceof Array || (items = [items]);
        var proto = this.prototype, item;

        while(item = items.shift()){
            mix(proto, item.prototype || item);
        }
    },

    Statics: function(properties){
        mix(this, properties);
    }
};

/**
 * @private
 */
var createProto = (function(){
    if(Object.__proto__){
        return function(proto){
            return {__proto__: proto};
        }
    }else{
        var Ctor = function(){};
        return function(proto){
            Ctor.prototype = proto;
            return new Ctor();
        }
    }
})();

/**
 * 混入属性或方法。
 * @param {Object} target 混入目标对象。
 * @returns {Object} 混入目标对象。
 */
var mix = function(target){
    for(var i = 1, len = arguments.length; i < len; i++){
        var source  = arguments[i], defineProps;
        for(var key in source){
            var prop = source[key];
            if(prop && typeof prop === 'object'){
                if(prop.value !== undefined || typeof prop.get === 'function' || typeof prop.set === 'function'){
                    defineProps = defineProps || {};
                    defineProps[key] = prop;
                    continue;
                }
            }
            target[key] = prop;
        }
        if(defineProps) defineProperties(target, defineProps);
    }

    return target;
};

try{
    var defineProperty = Object.defineProperty,
        defineProperties = Object.defineProperties;
    defineProperty({}, '$', {value:0});
}catch(e){
    if('__defineGetter__' in Object){
        defineProperty = function(obj, prop, desc){
            if('value' in desc) obj[prop] = desc.value;
            if('get' in desc) obj.__defineGetter__(prop, desc.get);
            if('set' in desc) obj.__defineSetter__(prop, desc.set);
            return obj;
        };
        defineProperties = function(obj, props){
            for(var prop in props){
                if(props.hasOwnProperty(prop)){
                    defineProperty(obj, prop, props[prop]);
                }
            }
            return obj;
        };
    }
}

return {create:create, mix:mix};

})();

/**
 * @class EventMixin是一个包含事件相关功能的mixin。可以通过 Class.mix(target, EventMixin) 来为target增加事件功能。
 * @mixin
 * @static
 * @module hilo/event/EventMixin
 * @requires hilo/core/Class
 */
var EventMixin = {
    _listeners: null,

    /**
     * 增加一个事件监听。
     * @param {String} type 要监听的事件类型。
     * @param {Function} listener 事件监听回调函数。
     * @param {Boolean} once 是否是一次性监听，即回调函数响应一次后即删除，不再响应。
     */
    on: function(type, listener, once){
        var listeners = (this._listeners = this._listeners || {});
        var eventListeners = (listeners[type] = listeners[type] || []);
        for(var i = 0, len = eventListeners.length; i < len; i++){
            var el = eventListeners[i];
            if(el.listener === listener) return;
        }
        eventListeners.push({listener:listener, once:once});
        return this;
    },

    /**
     * 删除一个事件监听。如果不传入任何参数，则删除所有的事件监听；如果不传入第二个参数，则删除指定类型的所有事件监听。
     * @param {String} type 要删除监听的事件类型。
     * @param {Function} listener 要删除监听的回调函数。
     */
    off: function(type, listener){
        //remove all event listeners
        if(arguments.length == 0){
            this._listeners = null;
            return this;
        }

        var eventListeners = this._listeners && this._listeners[type];
        if(eventListeners){
            //remove event listeners by specified type
            if(arguments.length == 1){
                delete this._listeners[type];
                return this;
            }

            for(var i = 0, len = eventListeners.length; i < len; i++){
                var el = eventListeners[i];
                if(el.listener === listener){
                    eventListeners.splice(i, 1);
                    if(eventListeners.length === 0) delete this._listeners[type];
                    break;
                }
            }
        }
        return this;
    },

    /**
     * 发送事件。当第一个参数类型为Object时，则把它作为一个整体事件对象。
     * @param {String} type 要发送的事件类型。
     * @param {Object} detail 要发送的事件的具体信息，即事件随带参数。
     */
    fire: function(type, detail){
        var event, eventType;
        if(typeof type === 'string'){
            eventType = type;
        }else{
            event = type;
            eventType = type.type;
        }

        var listeners = this._listeners;
        if(!listeners) return false;

        var eventListeners = listeners[eventType];
        if(eventListeners){
            eventListeners = eventListeners.slice(0);
            event = event || new EventObject(eventType, this, detail);

            for(var i = 0; i < eventListeners.length && !event._stopped; i++){
                var el = eventListeners[i];
                el.listener.call(this, event);
                if(el.once) eventListeners.splice(i--, 1);
            }

            if(eventListeners.length == 0) delete listeners[eventType];
            return true;
        }
        return false;
    }
};

/**
 * 事件对象类。当前仅为内部类，以后有需求的话可能会考虑独立为公开类。
 */
var EventObject = Class.create({
    constructor: function EventObject(type, target, detail){
        this.type = type;
        this.target = target;
        this.detail = detail;
        this.timeStamp = +new Date();
    },

    type: null,
    target: null,
    detail: null,
    timeStamp: 0,

    stopImmediatePropagation: function(){
        this._stopped = true;
    }
});

/**
 * @class 渲染器抽象基类。
 * @param {Object} properties 创建对象的属性参数。可包含此类所有可写属性。
 * @module hilo/renderer/Renderer
 * @requires hilo/core/Hilo
 * @requires hilo/core/Class
 * @property {Object} canvas 渲染器对应的舞台。它可能是一个普通的DOM元素，比如div，也可以是一个canvas画布元素。
 */
var Renderer = Class.create(/** @lends Renderer.prototype */{
    constructor: function Renderer(properties){
        properties = properties || {};
        Hilo.copy(this, properties, true);
    },

    canvas: null,

    /**
     * 为开始绘制可视对象做准备。需要子类来实现。
     * @param {View} target 要绘制的可视对象。
     */
    startDraw: function(target){ },

    /**
     * 绘制可视对象。需要子类来实现。
     * @param {View} target 要绘制的可视对象。
     */
    draw: function(target){ },

    /**
     * 结束绘制可视对象后的后续处理方法。需要子类来实现。
     * @param {View} target 要绘制的可视对象。
     */
    endDraw: function(target){ },

    /**
     * 对可视对象进行变换。需要子类来实现。
     */
    transform: function(){ },

    /**
     * 隐藏可视对象。需要子类来实现。
     */
    hide: function(){ },

    /**
     * 从画布中删除可视对象。注意：不是从stage中删除对象。需要子类来实现。
     * @param {View} target 要删除的可视对象。
     */
    remove: function(target){ },

    /**
     * 清除画布指定区域。需要子类来实现。
     * @param {Number} x 指定区域的x轴坐标。
     * @param {Number} y 指定区域的y轴坐标。
     * @param {Number} width 指定区域的宽度。
     * @param {Number} height 指定区域的高度。
     */
    clear: function(x, y, width, height){ }

});

/**
 * @class canvas画布渲染器。所有可视对象将渲染在canvas画布上。
 * @augments Renderer
 * @param {Object} properties 创建对象的属性参数。可包含此类所有可写属性。
 * @module hilo/renderer/CanvasRenderer
 * @requires hilo/core/Class
 * @requires hilo/renderer/Renderer
 * @property {CanvasRenderingContext2D} context canvas画布的上下文。
 */
var CanvasRenderer = Class.create(/** @lends CanvasRenderer.prototype */{
    Extends: Renderer,
    constructor: function CanvasRenderer(properties){
        CanvasRenderer.superclass.constructor.call(this, properties);

        var canvas = this.canvas,
            width = properties.width,
            height = properties.height;

        this.context = canvas.getContext("2d");
        if(width && height){
            canvas.width = width;
            canvas.height = height;
        }
    },

    context: null,

    /**
     * @private
     * @see Renderer#startDraw
     */
    startDraw: function(target){
        if(target instanceof Stage){
            this.context.clearRect(0, 0, target.width, target.height);
        }
        this.context.save();
    },

    /**
     * @private
     * @see Renderer#draw
     */
    draw: function(target){
        var drawable = target.drawable;
        if(!drawable || !drawable.image) return;
        var ctx = this.context, rect = drawable.rect;
        ctx.drawImage(drawable.image, rect[0], rect[1], rect[2], rect[3], 0, 0, target.width, target.height);
    },

    /**
     * @private
     * @see Renderer#endDraw
     */
    endDraw: function(target){
        this.context.restore();
    },

    /**
     * @private
     * @see Renderer#transform
     */
    transform: function(target){
        var ctx = this.context,
            scaleX = target.scaleX,
            scaleY = target.scaleY;

        if(target instanceof Stage){
            var style = this.canvas.style,
                oldScaleX = target._scaleX,
                oldScaleY = target._scaleY;

            if((!oldScaleX && scaleX != 1) || (oldScaleX && oldScaleX != scaleX)){
                target._scaleX = scaleX;
                style.width = scaleX * target.width + "px";
            }
            if((!oldScaleY && scaleY != 1) || (oldScaleY && oldScaleY != scaleY)){
                target._scaleY = scaleY;
                style.height = scaleY * target.height + "px";
            }
        }else{
            var x = target.x,
                y = target.y,
                pivotX = target.pivotX,
                pivotY = target.pivotY,
                rotation = target.rotation % 360;

            if(x != 0 || y != 0) ctx.translate(x, y);
            if(rotation != 0) ctx.rotate(rotation * Math.PI / 180);
            if(scaleX != 1 || scaleY != 1) ctx.scale(scaleX, scaleY);
            if(pivotX != 0 || pivotY != 0) ctx.translate(-pivotX, -pivotY);
        }

        if(target.alpha > 0) ctx.globalAlpha *= target.alpha;
    },

    /**
     * @private
     * @see Renderer#remove
     */
    remove: function(target){
        if(target instanceof DOMElement){
            var elem = target.drawable.domElement,
                parentElem = elem && elem.parentNode;
            if(parentElem){
                parentElem.removeChild(elem);
            }
        }
    },

    /**
     * @private
     * @see Renderer#clear
     */
    clear: function(x, y, width, height){
        this.context.clearRect(x, y, width, height);
    }
});

/**
 * @class DOM+CSS3渲染器。将可视对象以DOM元素方式渲染出来。
 * @augments Renderer
 * @param {Object} properties 创建对象的属性参数。可包含此类所有可写属性。
 * @module hilo/renderer/DOMRenderer
 * @requires hilo/core/Class
 * @requires hilo/core/Hilo
 * @requires hilo/renderer/Renderer
 */
var DOMRenderer = (function(){

return Class.create({
    Extends: Renderer,
    constructor: function DOMRenderer(properties){
        DOMRenderer.superclass.constructor.call(this, properties);
    },

    /**
     * @private
     * @see Renderer#startDraw
     */
    startDraw: function(target){
        //prepare drawable
        var drawable = (target.drawable = target.drawable || new Drawable());
        drawable.domElement = drawable.domElement || createDOMDrawable(target, drawable);
    },

    /**
     * @private
     * @see Renderer#draw
     */
    draw: function(target){
        var parent = target.parent,
            targetElem = target.drawable.domElement,
            currentParent = targetElem.parentNode;

        if(parent){
            var parentElem = parent.drawable.domElement;
            if(parentElem != currentParent){
                parentElem.appendChild(targetElem);
            }
        }else if(target instanceof Stage && !currentParent){
            this.canvas.appendChild(targetElem);
        }
    },

    /**
     * @private
     * @see Renderer#transform
     */
    transform: function(target){
        Hilo.setElementStyleByView(target);
    },

    /**
     * @private
     * @see Renderer#remove
     */
    remove: function(target){
        var targetElem = target.drawable.domElement,
            parentElem = targetElem.parentNode;

        if(parentElem) parentElem.removeChild(targetElem);
    },

    /**
     * @private
     * @see Renderer#hide
     */
    hide: function(target){
        var elem = target.drawable && target.drawable.domElement;
        if(elem) elem.style.display = "none";
    }
});

/**
 * 创建一个可渲染的DOM，可指定tagName，如canvas或div。
 * @param {Object} view 一个可视对象或类似的对象。
 * @param {Object} imageObj 指定渲染的image及相关设置，如绘制区域rect。
 * @return {HTMLElement} 新创建的DOM对象。
 * @private
 */
function createDOMDrawable(view, imageObj){
    var tag = view.tagName || "div",
        img = imageObj.image,
        w = view.width || (img && img.width),
        h =  view.height || (img && img.height),
        elem = Hilo.createElement(tag), style = elem.style;

    if(view.id) elem.id = view.id;
    style.position = "absolute";
    style.left = (view.left || 0) + "px";
    style.top = (view.top || 0) + "px";
    style.width = w + "px";
    style.height = h + "px";

    if(tag == "canvas"){
        elem.width = w;
        elem.height = h;
        if(img){
            var ctx = elem.getContext("2d");
            var rect = imageObj.rect || [0, 0, w, h];
            ctx.drawImage(img, rect[0], rect[1], rect[2], rect[3],
                         (view.x || 0), (view.y || 0),
                         (view.width || rect[2]),
                         (view.height || rect[3]));
        }
    }else{
        style.opacity = view.alpha != undefined ? view.alpha : 1;
        if(view instanceof Stage || view.clipChildren) style.overflow = "hidden";
        if(img && img.src){
            style.backgroundImage = "url(" + img.src + ")";
            var bgX = view.rectX || 0, bgY = view.rectY || 0;
            style.backgroundPosition = (-bgX) + "px " + (-bgY) + "px";
        }
    }
    return elem;
}

})();

/**
 * @class Matrix类表示一个转换矩阵，它确定如何将点从一个坐标空间映射到另一个坐标空间。
 * @param {Number} a 缩放或旋转图像时影响像素沿 x 轴定位的值。
 * @param {Number} b 旋转或倾斜图像时影响像素沿 y 轴定位的值。
 * @param {Number} c 旋转或倾斜图像时影响像素沿 x 轴定位的值。
 * @param {Number} d 缩放或旋转图像时影响像素沿 y 轴定位的值。
 * @param {Number} tx 沿 x 轴平移每个点的距离。
 * @param {Number} ty 沿 y 轴平移每个点的距离。
 * @module hilo/geom/Matrix
 * @requires hilo/core/Class
 */
var Matrix = Class.create(/** @lends Matrix.prototype */{
    constructor: function Matrix(a, b, c, d, tx, ty){
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
    },

    /**
     * 将某个矩阵与当前矩阵连接，从而将这两个矩阵的几何效果有效地结合在一起。
     * @param {Matrix} mtx 要连接到源矩阵的矩阵。
     * @returns {Matrix} 一个Matrix对象。
     */
    concat: function(mtx){
        var args = arguments,
            a = this.a, b = this.b, c = this.c, d = this.d,
            tx = this.tx, ty = this.ty;

        if(args.length >= 6){
            var ma = args[0], mb = args[1], mc = args[2],
                md = args[3], mx = args[4], my = args[5];
        }else{
            ma = mtx.a;
            mb = mtx.b;
            mc = mtx.c;
            md = mtx.d;
            mx = mtx.tx;
            my = mtx.ty;
        }

        this.a = a * ma + b * mc;
        this.b = a * mb + b * md;
        this.c = c * ma + d * mc;
        this.d = c * mb + d * md;
        this.tx = tx * ma + ty * mc + mx;
        this.ty = tx * mb + ty * md + my;
        return this;
    },

    /**
     * 对 Matrix 对象应用旋转转换。
     * @param {Number} angle 旋转的角度。
     * @returns {Matrix} 一个Matrix对象。
     */
    rotate: function(angle){
        var sin = Math.sin(angle), cos = Math.cos(angle),
            a = this.a, b = this.b, c = this.c, d = this.d,
            tx = this.tx, ty = this.ty;

        this.a = a * cos - b * sin;
        this.b = a * sin + b * cos;
        this.c = c * cos - d * sin;
        this.d = c * sin + d * cos;
        this.tx = tx * cos - ty * sin;
        this.ty = tx * sin + ty * cos;
        return this;
    },

    /**
     * 对矩阵应用缩放转换。
     * @param {Number} sx 用于沿 x 轴缩放对象的乘数。
     * @param {Number} sy 用于沿 y 轴缩放对象的乘数。
     * @returns {Matrix} 一个Matrix对象。
     */
    scale: function(sx, sy){
        this.a *= sx;
        this.d *= sy;
        this.tx *= sx;
        this.ty *= sy;
        return this;
    },

    /**
     * 沿 x 和 y 轴平移矩阵，由 dx 和 dy 参数指定。
     * @param {Number} dx 沿 x 轴向右移动的量（以像素为单位）。
     * @param {Number} dy 沿 y 轴向右移动的量（以像素为单位）。
     * @returns {Matrix} 一个Matrix对象。
     */
    translate: function(dx, dy){
        this.tx += dx;
        this.ty += dy;
        return this;
    },

    /**
     * 为每个矩阵属性设置一个值，该值将导致 null 转换。通过应用恒等矩阵转换的对象将与原始对象完全相同。
     * @returns {Matrix} 一个Matrix对象。
     */
    identity: function(){
        this.a = this.d = 1;
        this.b = this.c = this.tx = this.ty = 0;
        return this;
    },

    /**
     * 执行原始矩阵的逆转换。您可以将一个逆矩阵应用于对象来撤消在应用原始矩阵时执行的转换。
     * @returns {Matrix} 一个Matrix对象。
     */
    invert: function(){
        var a = this.a;
        var b = this.b;
        var c = this.c;
        var d = this.d;
        var tx = this.tx;
        var i = a * d - b * c;

        this.a = d / i;
        this.b = -b / i;
        this.c = -c / i;
        this.d = a / i;
        this.tx = (c * this.ty - d * tx) / i;
        this.ty = -(a * this.ty - b * tx) / i;
        return this;
    },

    /**
     * 返回将 Matrix 对象表示的几何转换应用于指定点所产生的结果。
     * @param {Object} point 想要获得其矩阵转换结果的点。
     * @param {Boolean} round 是否对点的坐标进行向上取整。
     * @param {Boolean} returnNew 是否返回一个新的点。
     * @returns {Object} 由应用矩阵转换所产生的点。
     */
    transformPoint: function(point, round, returnNew){
        var x = point.x * this.a + point.y * this.c + this.tx,
            y = point.x * this.b + point.y * this.d + this.ty;

        if(round){
            x = x + 0.5 >> 0;
            y = y + 0.5 >> 0;
        }
        if(returnNew) return {x:x, y:y};
        point.x = x;
        point.y = y;
        return point;
    }

});

/**
 * @class Drawable是可绘制图像的包装。
 * @param {Object} properties 创建对象的属性参数。可包含此类所有可写属性。
 * @module hilo/view/Drawable
 * @requires hilo/core/Hilo
 * @requires hilo/core/Class
 * @property {Object} image 要绘制的图像。即可被CanvasRenderingContext2D.drawImage使用的对象类型，可以是HTMLImageElement、HTMLCanvasElement、HTMLVideoElement等对象。
 * @property {array} rect 要绘制的图像的矩形区域。
 */
var Drawable = Class.create(/** @lends Drawable.prototype */{
    constructor: function Drawable(properties){
        this.init(properties);
    },

    image: null,
    rect: null,

    /**
     * 初始化可绘制对象。
     * @param {Object} properties 要初始化的属性。
     */
    init: function(properties){
        var me = this;
        if(Drawable.isDrawable(properties)){
            me.image = properties;
        }else{
            Hilo.copy(me, properties, true);
        }

        var image = me.image;
        if(typeof image == 'string'){
            //load image dynamically
            var img = new Image();
            img.onload = function(){
                img.onload = null;
                me.init(img);
            };
            img.src = image;
            me.image = null;
            return;
        }

        if(image && !this.rect) this.rect = [0, 0, image.width, image.height];
    },

    Statics: /** @lends Drawable */{
        /**
         * 判断参数elem指定的元素是否可包装成Drawable对象。
         * @param {Object} elem 要测试的对象。
         * @return {Boolean} 如果是可包装成Drawable对象则返回true，否则为false。
         */
        isDrawable: function(elem){
            return (elem instanceof HTMLImageElement) ||
                   (elem instanceof HTMLCanvasElement) ||
                   (elem instanceof HTMLVideoElement);
        }
    }
});

/**
 * @class View类是所有可视对象或组件的基类。
 * @param {Object} properties 创建对象的属性参数。可包含此类所有可写属性。
 * @module hilo/view/View
 * @requires hilo/core/Hilo
 * @requires hilo/core/Class
 * @requires hilo/event/EventMixin
 * @property {String} id 可视对象的唯一标识符。
 * @property {Number} x 可视对象的x轴坐标。默认值为0。
 * @property {Number} y 可视对象的y轴坐标。默认值为0。
 * @property {Number} width 可视对象的宽度。默认值为0。
 * @property {Number} height 可视对象的高度。默认值为0。
 * @property {Number} alpha 可视对象的透明度。默认值为1。
 * @property {Number} rotation 可视对象的旋转角度。默认值为0。
 * @property {Boolean} visible 可视对象是否可见。默认为可见，即true。
 * @property {Number} pivotX 可视对象的中心点的x轴坐标。默认值为0。
 * @property {Number} pivotY 可视对象的中心点的y轴坐标。默认值为0。
 * @property {Number} scaleX 可视对象在x轴上的缩放比例。默认为不缩放，即1。
 * @property {Number} scaleY 可视对象在y轴上的缩放比例。默认为不缩放，即1。
 * @property {Boolean} pointerEnabled 可视对象是否接受交互事件。默认为接受交互事件，即true。
 * @property {Container} parent 可视对象的父容器。只读属性。
 * @property {Stage} stage 可视对象的舞台实例。只读属性。
 * @property {Number} depth 可视对象的深度，也即z轴的序号。只读属性。
 * @property {Number} measuredWidth 可视对象的测量宽度。只读属性。
 * @property {Number} measuredHeight 可视对象的测量高度。只读属性。
 * @property {Drawable} drawable 可视对象的可绘制对象。
 * @property {Array} boundsArea 可视对象的区域顶点数组。格式为：[{x:10, y:10}, {x:20, y:20}]。
 */
var View = (function(){

return Class.create(/** @lends View.prototype */{
    Mixes: EventMixin,
    constructor: function View(properties){
        properties = properties || {};
        this.id = this.id || properties.id || Hilo.getUid("View");
        Hilo.copy(this, properties, true);
    },

    id: null,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    alpha: 1,
    rotation: 0,
    visible: true,
    pivotX: 0,
    pivotY: 0,
    scaleX: 1,
    scaleY: 1,
    pointerEnabled: true,
    drawable: null,
    boundsArea: null,
    parent: {
        get: function(){
            return this._parent || null;
        }
    },
    stage: {
        get: function(){
            var obj = this, parent;
            while(parent = obj.parent) obj = parent;
            if(obj instanceof Stage) return obj;
            return null;
        }
    },
    depth: {
        get: function(){
            return this._parent && this._depth || -1;
        }
    },
    measuredWidth: {
        get: function(){
            return this.width * this.scaleX;
        }
    },
    measuredHeight: {
        get: function(){
            return this.height * this.scaleY;
        }
    },

    /**
     * 从父容器里删除此对象。
     */
    removeFromParent: function(){
        var parent = this.parent;
        if(parent) parent.removeChild(this);
    },

    /**
     * 获取可视对象在舞台全局坐标系内的外接矩形以及所有顶点坐标。
     * @returns {Array} 可视对象的顶点坐标数组vertexs。另vertexs还包含属性：
     * <ul>
     * <li><b>x</b> - 可视对象的外接矩形x轴坐标。</li>
     * <li><b>y</b> - 可视对象的外接矩形y轴坐标。</li>
     * <li><b>width</b> - 可视对象的外接矩形的宽度。</li>
     * <li><b>height</b> - 可视对象的外接矩形的高度。</li>
     * </ul>
     */
    getBounds: function(){
        var w = this.width, h = this.height,
            mtx = this.getConcatenatedMatrix(),
            poly = this.boundsArea || [{x:0, y:0}, {x:w, y:0}, {x:w, y:h}, {x:0, y:h}],
            vertexs = [], point, x, y, minX, maxX, minY, maxY;

        for(var i = 0, len = poly.length; i < len; i++){
            point = mtx.transformPoint(poly[i], true, true);
            x = point.x;
            y = point.y;

            if(i == 0){
                minX = maxX = x;
                minY = maxY = y;
            }else{
                if(minX > x) minX = x;
                else if(maxX < x) maxX = x;
                if(minY > y) minY = y;
                else if(maxY < y) maxY = y;
            }
            vertexs[i] = point;
        }

        vertexs.x = minX;
        vertexs.y = minY;
        vertexs.width = maxX - minX;
        vertexs.height = maxY - minY;
        return vertexs;
    },

    /**
     * 获取可视对象相对于其某个祖先（默认为舞台Stage）的连接矩阵。
     * @param {View} ancestor 可视对象的相对的祖先容器。
     * @private
     */
    getConcatenatedMatrix: function(ancestor){
        var mtx = new Matrix(1, 0, 0, 1, 0, 0);

        if(ancestor !== this){
            for(var o = this; o.parent && o.parent != ancestor; o = o.parent){
                var cos = 1, sin = 0,
                    rotation = o.rotation % 360,
                    pivotX = o.pivotX, pivotY = o.pivotY,
                    scaleX = o.scaleX, scaleY = o.scaleY;

                if(rotation){
                    var r = rotation * Math.PI / 180;
                    cos = Math.cos(r);
                    sin = Math.sin(r);
                }

                if(pivotX != 0) mtx.tx -= pivotX;
                if(pivotY != 0) mtx.ty -= pivotY;
                mtx.concat(cos*scaleX, sin*scaleX, -sin*scaleY, cos*scaleY, o.x, o.y);
            }
        }
        return mtx;
    },

    /**
     * 检测由x和y参数指定的点是否在其外接矩形之内。
     * @param {Number} x 要检测的点的x轴坐标。
     * @param {Number} y 要检测的点的y轴坐标。
     * @param {Boolean} usePolyCollision 是否使用多边形碰撞检测。默认为false。
     * @returns {Boolean} 点是否在可视对象之内。
     */
    hitTestPoint: function(x, y, usePolyCollision){
        var bound = this.getBounds(),
            hit = x >= bound.x && x <= bound.x + bound.width &&
                  y >= bound.y && y <= bound.y + bound.height;

        if(hit && usePolyCollision){
            hit = pointInPolygon(x, y, bound);
        }
        return hit;
    },

    /**
     * 检测object参数指定的对象是否与其相交。
     * @param {View} object 要检测的可视对象。
     * @param {Boolean} usePolyCollision 是否使用多边形碰撞检测。默认为false。
     */
    hitTestObject: function(object, usePolyCollision){
        var b1 = this.getBounds(),
            b2 = object.getBounds(),
            hit = b1.x <= b2.x + b2.width && b2.x <= b1.x + b1.width &&
                  b1.y <= b2.y + b2.height && b2.y <= b1.y + b1.height;

        if(hit && usePolyCollision){
            hit = polygonCollision(b1, b2);
        }
        return !!hit;
    },

    /**
     * 可视对象的基本渲染实现，用于框架内部或高级开发使用。通常应该重写render方法。
     * @param {Renderer} renderer 渲染器。
     * @param {Number} delta 渲染时时间偏移量。
     * @protected
     */
    _render: function(renderer, delta){
        renderer = this.renderer || renderer;
        if(!this.visible || this.alpha <= 0){
            renderer.hide(this);
            return;
        }

        this.fire('beforerender', delta);
        renderer.startDraw(this);
        renderer.transform(this);
        this.render(renderer, delta);
        renderer.endDraw(this);
        this.fire('afterrender', delta);
    },

    /**
     * 可视对象的具体渲染逻辑。子类可通过覆盖此方法实现自己的渲染。
     * @param {Renderer} renderer 渲染器。
     * @param {Number} delta 渲染时时间偏移量。
     */
    render: function(renderer, delta){
        renderer.draw(this);
    },

    /**
     * 返回可视对象的字符串表示。
     * @returns {String} 可视对象的字符串表示。
     */
    toString: function(){
        return Hilo.viewToString(this);
    }
});

/**
 * @private
 */
function pointInPolygon(x, y, poly){
    var cross = 0, onBorder = false, minX, maxX, minY, maxY;

    for(var i = 0, len = poly.length; i < len; i++){
        var p1 = poly[i], p2 = poly[(i+1)%len];

        if(p1.y == p2.y && y == p1.y){
            p1.x > p2.x ? (minX = p2.x, maxX = p1.x) : (minX = p1.x, maxX = p2.x);
            if(x >= minX && x <= maxX){
                onBorder = true;
                continue;
            }
        }

        p1.y > p2.y ? (minY = p2.y, maxY = p1.y) : (minY = p1.y, maxY = p2.y);
        if(y < minY || y > maxY) continue;

        var nx = (y - p1.y)*(p2.x - p1.x) / (p2.y - p1.y) + p1.x;
        if(nx > x) cross++;
        else if(nx == x) onBorder = true;
    }

    return onBorder || (cross % 2 == 1);
}

/**
 * @private
 */
function polygonCollision(poly1, poly2){
    var result = doSATCheck(poly1, poly2, {overlap:-Infinity, normal:{x:0, y:0}});
    if(result) return doSATCheck(poly2, poly1, result);
    return false;
}

/**
 * @private
 */
function doSATCheck(poly1, poly2, result){
    var len1 = poly1.length, len2 = poly2.length,
        currentPoint, nextPoint, distance,
        min1, max1, min2, max2, dot, overlap, normal = {x:0, y:0};

    for(var i = 0; i < len1; i++){
        currentPoint = poly1[i];
        nextPoint = poly1[(i < len1-1 ? i+1 : 0)];

        normal.x = currentPoint.y - nextPoint.y;
        normal.y = nextPoint.x - currentPoint.x;

        distance = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        normal.x /= distance;
        normal.y /= distance;

        min1 = max1 = poly1[0].x * normal.x + poly1[0].y * normal.y;
        for(var j = 1; j < len1; j++){
            dot = poly1[j].x * normal.x + poly1[j].y * normal.y;
            if(dot > max1) max1 = dot;
            else if(dot < min1) min1 = dot;
        }

        min2 = max2 = poly2[0].x * normal.x + poly2[0].y * normal.y;
        for(j = 1; j < len2; j++){
            dot = poly2[j].x * normal.x + poly2[j].y * normal.y;
            if(dot > max2) max2 = dot;
            else if(dot < min2) min2 = dot;
        }

        if(min1 < min2){
            overlap = min2 - max1;
            normal.x = -normal.x;
            normal.y = -normal.y;
        }else{
            overlap = min1 - max2;
        }

        if(overlap >= 0){
            return false;
        }else if(overlap > result.overlap){
            result.overlap = overlap;
            result.normal.x = normal.x;
            result.normal.y = normal.y;
        }
    }

    return result;
}

})();

/**
 * @class Container是所有容器类的基类。每个Container都可以添加其他可视对象为子级。
 * @augments View
 * @param {Object} properties 创建对象的属性参数。可包含此类所有可写属性。
 * @module hilo/view/Container
 * @requires hilo/core/Hilo
 * @requires hilo/core/Class
 * @requires hilo/view/View
 * @property {Array} children 容器的子元素列表。只读。
 * @property {Number} numChildren 容器的子元素数量。只读。
 * @property {Boolean} pointerChildren 指示容器的子元素是否能响应用户交互事件。默认为true。
 * @property {Boolean} clipChildren 指示是否裁剪超出容器范围的子元素。默认为false。
 */
var Container = Class.create(/** @lends Container.prototype */{
    Extends: View,
    constructor: function Container(properties){
        properties = properties || {};
        this.id = this.id || properties.id || Hilo.getUid("Container");
        Container.superclass.constructor.call(this, properties);

        if(this.children) this._updateChildren();
        else this.children = [];
    },

    children: null,
    pointerChildren: true,
    clipChildren: false,
    numChildren: {
        get: function(){
            return this.children.length;
        }
    },

    /**
     * 在指定索引位置添加子元素。
     * @param {View} child 要添加的子元素。
     * @param {Number} index 指定的索引位置，从0开始。
     */
    addChildAt: function(child, index){
        var children = this.children,
            len = children.length,
            parent = child.parent;

        index = index < 0 ? 0 : index > len ? len : index;
        var childIndex = this.getChildIndex(child);
        if(childIndex == index){
            return this;
        }else if(childIndex >= 0){
            children.splice(childIndex, 1);
        }else if(parent){
            parent.removeChild(child);
        }

        children.splice(index, 0, child);
        this._updateChildren(index);

        return this;
    },

    /**
     * 在最上面添加子元素。
     * @param {View} child 要添加的子元素。
     */
    addChild: function(child){
        var total = this.children.length,
            args = arguments;

        for(var i = 0, len = args.length; i < len; i++){
            this.addChildAt(args[i], total + i);
        }
        return this;
    },

    /**
     * 在指定索引位置删除子元素。
     * @param {Int} index 指定删除元素的索引位置，从0开始。
     * @returns 被删除的对象。
     */
    removeChildAt: function(index){
        var children = this.children;
        if(index < 0 || index >= children.length) return null;

        var child = children[index];
        if(child){
            var stage = this.stage;
            if(stage) stage.renderer.remove(child);
            child._parent = null;
            child._depth = -1;
        }

        children.splice(index, 1);
        this._updateChildren(index);

        return child;
    },

    /**
     * 删除指定的子元素。
     * @param {View} child 指定要删除的子元素。
     * @returns 被删除的对象。
     */
    removeChild: function(child){
        return this.removeChildAt(this.getChildIndex(child));
    },

    /**
     * 删除指定id的子元素。
     * @param {String} id 指定要删除的子元素的id。
     * @returns 被删除的对象。
     */
    removeChildById: function(id){
        var children = this.children, child;
        for(var i = 0, len = children.length; i < len; i++){
            child = children[i];
            if(child.id === id){
                this.removeChildAt(i);
                return child;
            }
        }
        return null;
    },

    /**
     * 删除所有的子元素。
     */
    removeAllChildren: function(){
        while(this.children.length) this.removeChildAt(0);
        return this;
    },

    /**
     * 返回指定索引位置的子元素。
     * @param {Number} index 指定要返回的子元素的索引值，从0开始。
     */
    getChildAt: function(index){
        var children = this.children;
        if(index < 0 || index >= children.length) return null;
        return children[index];
    },

    /**
     * 返回指定id的子元素。
     * @param {String} id 指定要返回的子元素的id。
     */
    getChildById: function(id){
        var children = this.children, child;
        for(var i = 0, len = children.length; i < len; i++){
            child = children[i];
            if(child.id === id) return child;
        }
        return null;
    },

    /**
     * 返回指定子元素的索引值。
     * @param {View} child 指定要返回索引值的子元素。
     */
    getChildIndex: function(child){
        return this.children.indexOf(child);
    },

    /**
     * 设置子元素的索引位置。
     * @param {View} child 指定要设置的子元素。
     * @param {Number} index 指定要设置的索引值。
     */
    setChildIndex: function(child, index){
        var children = this.children,
            oldIndex = children.indexOf(child);

        if(oldIndex >= 0 && oldIndex != index){
            var len = children.length;
            index = index < 0 ? 0 : index >= len ? len - 1 : index;
            children.splice(oldIndex, 1);
            children.splice(index, 0, child);
            this._updateChildren();
        }
        return this;
    },

    /**
     * 交换两个子元素的索引位置。
     * @param {View} child1 指定要交换的子元素A。
     * @param {View} child2 指定要交换的子元素B。
     */
    swapChildren: function(child1, child2){
        var children = this.children,
            index1 = this.getChildIndex(child1),
            index2 = this.getChildIndex(child2);

        child1._depth = index2;
        children[index2] = child1;
        child2._depth = index1;
        children[index1] = child2;
    },

    /**
     * 交换两个指定索引位置的子元素。
     * @param {Number} index1 指定要交换的索引位置A。
     * @param {Number} index2 指定要交换的索引位置B。
     */
    swapChildrenAt: function(index1, index2){
        var children = this.children,
            child1 = this.getChildAt(index1),
            child2 = this.getChildAt(index2);

        child1._depth = index2;
        children[index2] = child1;
        child2._depth = index1;
        children[index1] = child2;
    },

    /**
     * 根据指定键值或函数对子元素进行排序。
     * @param {Object} keyOrFunction 如果此参数为String时，则根据子元素的某个属性值进行排序；如果此参数为Function时，则根据此函数进行排序。
     */
    sortChildren: function(keyOrFunction){
        var fn = keyOrFunction,
            children = this.children;
        if(typeof fn == "string"){
            var key = fn;
            fn = function(a, b){
                return b[key] - a[key];
            };
        }
        children.sort(fn);
        this._updateChildren();
    },

    /**
     * 更新子元素。
     * @private
     */
    _updateChildren: function(start, end){
        var children = this.children, child,
            start = start || 0,
            end = end || children.length;
        for(var i = start; i < end; i++){
            child = children[i];
            child._depth = i + 1;
            child._parent = this;
        }
    },

    /**
     * 返回是否包含参数指定的子元素。
     * @param {View} child 指定要测试的子元素。
     */
    contains: function(child){
        return this.getChildIndex(child) >= 0;
    },

    /**
     * 返回由x和y指定的点下的对象。
     * @param {Number} x 指定点的x轴坐标。
     * @param {Number} y 指定点的y轴坐标。
     * @param {Boolean} usePolyCollision 指定是否使用多边形碰撞检测。默认为false。
     * @param {Boolean} global 使用此标志表明将查找所有符合的对象，而不仅仅是第一个，即全局匹配。默认为false。
     * @param {Boolean} eventMode 使用此标志表明将在事件模式下查找对象。默认为false。
     */
    getViewAtPoint: function(x, y, usePolyCollision, global, eventMode){
        var result = global ? [] : null,
            children = this.children, child, obj;

        for(var i = children.length - 1; i >= 0; i--){
            child = children[i];
            //skip child which is not shown or pointer enabled
            if(!child || !child.visible || child.alpha <= 0 || (eventMode && !child.pointerEnabled)) continue;
            //find child recursively
            if(child.children && child.numChildren && !(eventMode && !child.pointerChildren)){
                obj = child.getViewAtPoint(x, y, usePolyCollision, global, eventMode);
            }

            if(obj){
                if(!global) return obj;
                else if(obj.length) result = result.concat(obj);
            }else if(child.hitTestPoint(x, y, usePolyCollision)){
                if(!global) return child;
                else result.push(child);
            }
        }

        return global && result.length ? result : null;
    },

    /**
     * 覆盖渲染方法。
     * @private
     */
    render: function(renderer, delta){
        Container.superclass.render.call(this, renderer, delta);

        var children = this.children;
        for(var i = 0, len = children.length; i < len; i++){
            var child = children[i];
            child._render(renderer, delta);
        }
    }

});

/**
 * @class 舞台是可视对象树的根，可视对象只有添加到舞台或其子对象后才会被渲染出来。
 * @augments Container
 * @param {Object} properties 创建对象的属性参数。可包含此类所有可写属性。
 * @module hilo/view/Stage
 * @requires hilo/core/Hilo
 * @requires hilo/core/Class
 * @requires hilo/view/Container
 * @property {HTMLElement} canvas 舞台所对应的画布。它可以是一个canvas或一个普通的div。只读属性。可通过构造函数传入。
 * @property {Renderer} renderer 舞台渲染器。只读属性。
 * @property {Boolean} paused 指示舞台是否暂停刷新渲染。
 * @property {Object} viewport 舞台内容在页面中的渲染区域。包含的属性有：left、top、width、height。只读属性。
 */
var Stage = Class.create(/** @lends Stage.prototype */{
    Extends: Container,
    constructor: function Stage(properties){
        properties = properties || {};
        this.id = this.id || properties.id || Hilo.getUid("Stage");
        Stage.superclass.constructor.call(this, properties);

        var canvas = this.canvas;
        if(canvas){
            if(canvas.getContext){
                this.renderer = new CanvasRenderer(properties);
            }else{
                this.renderer = new DOMRenderer(properties);
            }
        }else{
            throw new Error("Stage: canvas is required.");
        }
        this.updateViewport();
    },

    canvas: null,
    renderer: null,
    paused: false,
    viewport: null,

    /**
     * 调用tick会触发舞台的更新和渲染。
     */
    tick: function(delta){
        if(!this.paused){
            this._render(this.renderer, delta);
        }
    },

    /**
     * 开启/关闭DOM事件功能。
     */
    enableDOMEvent: function(type, enable){
        var me = this,
            canvas = me.canvas,
            types = typeof type === 'string' ? [type] : type,
            handler = me._domListener || (me._domListener = function(e){me._onDOMEvent(e)});

        for(var i = 0; i < types.length; i++){
            var type = types[i];
            if(enable === false){
                canvas.removeEventListener(type, handler);
            }else{
                canvas.addEventListener(type, handler, false);
            }
        }
    },

    /**
     * DOM事件处理函数。此方法会把事件调度到事件的坐标点所对应的可视对象。
     * @private
     */
    _onDOMEvent: function(e){
        var type = e.type, event = e, isTouch = type.indexOf('touch') == 0;

        //special for touch event
        if(isTouch){
            var touches = e.touches, changedTouches = e.changedTouches;
            event = (touches && touches.length) ? touches[0] :
                    (changedTouches && changedTouches.length) ? changedTouches[0] : null;
            event.type = type;
        }

        //calculate stageX/stageY
        var x = event.pageX || event.clientX, y = event.pageY || event.clientY,
            viewport = this.viewport;

        event.stageX = x = (x - viewport.left) / this.scaleX;
        event.stageY = y = (y - viewport.top) / this.scaleY;

        var obj = this.getViewAtPoint(x, y, true, false, true),
            canvas = this.canvas, target = this._eventTarget;

        //fire mouseout/touchout event for last event target
        var leave = type === 'mouseout' && !canvas.contains(e.relatedTarget);
        if(target && (target != obj || leave)){
            var out = (type === 'touchmove') ? 'touchout' :
                      (type === 'mousemove' || leave || !obj) ? 'mouseout' : null;
            if(out) target.fire(out);
            event.lastEventTarget = target;
            this._eventTarget = null;
        }

        //fire event for current view
        if(obj && obj.pointerEnabled && type !== 'mouseout'){
            event.eventTarget = this._eventTarget = obj;
            obj.fire(event);
        }

        //set cursor for current view
        if(!isTouch){
            var cursor = (obj && obj.pointerEnabled && obj.useHandCursor) ? 'pointer' : '';
            canvas.style.cursor = cursor;
        }

        //fire event for stage
        if(leave || type !== "mouseout") this.fire(event);
    },

    /**
     * 更新舞台在页面中的渲染区域。当舞台canvas的样式border、margin、padding等属性更改后，需要调用此方法更新舞台渲染区域。
     */
    updateViewport: function(){
        return this.viewport = Hilo.getElementRect(this.canvas);
    }

});

/**
 * 示例:
 * <pre>
 * var bmp = new Hilo.Bitmap({image:imgElem, rect:[0, 0, 100, 100]});
 * stage.addChild(bmp);
 * </pre>
 * @class Bitmap类表示位图图像类。
 * @augments View
 * @param {Object} properties 创建对象的属性参数。可包含此类所有可写属性。此外还包括：
 * <ul>
 * <li><b>image</b> - 位图所在的图像image。必需。</li>
 * <li><b>rect</b> - 位图在图像image中矩形区域。</li>
 * </ul>
 * @module hilo/view/Bitmap
 * @requires hilo/core/Hilo
 * @requires hilo/core/Class
 * @requires hilo/view/View
 */
 var Bitmap = Class.create(/** @lends Bitmap.prototype */{
    Extends: View,
    constructor: function Bitmap(properties){
        properties = properties || {};
        this.id = this.id || properties.id || Hilo.getUid("Bitmap");
        Bitmap.superclass.constructor.call(this, properties);

        this.drawable = new Drawable(properties);

        //init width and height
        if(!this.width || !this.height){
            var rect = this.drawable.rect;
            if(rect){
                this.width = rect[2];
                this.height = rect[3];
            }
        }
    }
 });

/**
 * @class 动画精灵类。
 * @augments View
 * @module hilo/view/Sprite
 * @requires hilo/core/Hilo
 * @requires hilo/core/Class
 * @requires hilo/view/View
 * @param properties 创建对象的属性参数。可包含此类所有可写属性。此外还包括：
 * <ul>
 * <li><b>frames</b> - 精灵动画的帧数据对象。</li>
 * </ul>
 * @property {number} currentFrame 当前播放帧的索引。从0开始。
 * @property {number} numFrames 精灵动画的总帧数。
 * @property {boolean} paused 判断精灵是否暂停。默认为false。
 * @property {boolean} loop 判断精灵是否可以循环播放。默认为true。
 * @property {boolean} timeBased 指定精灵动画是否是以时间为基准。默认为false，即以帧为基准。
 * @property {number} interval 精灵动画的帧间隔。如果timeBased为true，则单位为毫秒，否则为帧数。
 */
var Sprite = Class.create(/** @lends Sprite.prototype */{
    Extends: View,
    constructor: function Sprite(properties){
        properties = properties || {};
        this.id = this.id || properties.id || Hilo.getUid("Sprite");
        Sprite.superclass.constructor.call(this, properties);

        this._frames = [];
        this._frameNames = {};
        this.drawable = new Drawable();
        if(properties.frames) this.addFrame(properties.frames);
    },

    _frames: null, //所有帧的集合
    _frameNames: null, //带名字name的帧的集合
    _frameElapsed: 0, //当前帧持续的时间或帧数
    _currentFrame: 0, //当前帧的索引

    paused: false,
    loop: true,
    timeBased: false,
    interval: 1,
    currentFrame: {
        get: function(){
            return this._currentFrame;
        }
    },
    numFrames: {
        get: function(){
            return this._frames ? this._frames.length : 0;
        }
    },

    /**
     * 往精灵动画序列中增加帧。
     * @param {Object} frame 要增加的精灵动画帧数据。
     * @returns {Sprite} Sprite对象本身。
     */
    addFrame: function(frame){
        var total = this._frames.length;
        if(frame instanceof Array){
            for(var i = 0, len = frame.length; i < len; i++){
                this.setFrame(frame[i], total + i);
            }
        }else{
            this.setFrame(frame, total);
        }
        return this;
    },

    /**
     * 设置精灵动画序列指定索引位置的帧。
     * @param {Object} frame 要设置的精灵动画帧数据。
     * @param {Int} index 要设置的索引位置。
     * @returns {Sprite} Sprite对象本身。
     */
    setFrame: function(frame, index){
        var frames = this._frames,
            total = frames.length;
        index = index < 0 ? 0 : index > total ? total : index;
        frames[index] = frame;
        if(frame.name) this._frameNames[frame.name] = frame;
        if(index == 0 && !this.width || !this.height){
            this.width = frame.rect[2];
            this.height = frame.rect[3];
        }
        return this;
    },

    /**
     * 获取精灵动画序列中指定的帧。
     * @param {Object} indexOrName 要获取的帧的索引位置或别名。
     * @returns {Object} 精灵帧对象。
     */
    getFrame: function(indexOrName){
        if(typeof indexOrName === 'number'){
            var frames = this._frames;
            if(indexOrName < 0 || indexOrName >= frames.length) return null;
            return frames[indexOrName];
        }
        return this._frameNames[indexOrName];
    },

    /**
     * 获取精灵动画序列中指定帧的索引位置。
     * @param {Object} frameValue 要获取的帧的索引位置或别名。
     * @returns {Object} 精灵帧对象。
     */
    getFrameIndex: function(frameValue){
        var frames = this._frames,
            total = frames.length,
            index = -1;
        if(typeof frameValue === 'number'){
            index = frameValue;
        }else{
            var frame = typeof frameValue === 'string' ? this._frameNames[frameValue] : frameValue;
            if(frame){
                for(var i = 0; i < total; i++){
                    if(frame === frames[i]){
                        index = i;
                        break;
                    }
                }
            }
        }
        return index;
    },

    /**
     * 播放精灵动画。
     * @returns {Sprite} Sprite对象本身。
     */
    play: function(){
        this.paused = false;
        return this;
    },

    /**
     * 暂停播放精灵动画。
     * @returns {Sprite} Sprite对象本身。
     */
    stop: function(){
        this.paused = true;
        return this;
    },

    /**
     * 跳转精灵动画到指定的帧。
     * @param {Object} indexOrName 要跳转的帧的索引位置或别名。
     * @param {Boolean} pause 指示跳转后是否暂停播放。
     * @returns {Sprite} Sprite对象本身。
     */
    goto: function(indexOrName, pause){
        var total = this._frames.length,
            index = this.getFrameIndex(indexOrName);

        this._currentFrame = index < 0 ? 0 : index >= total ? total - 1 : index;
        this.paused = pause;
        return this;
    },

    /**
     * 渲染方法。
     * @private
     */
    _render: function(renderer, delta){
        var frameIndex = this._nextFrame(delta),
            frame = this._frames[frameIndex];

        this.drawable.init(frame);
        Sprite.superclass._render.call(this, renderer, delta);
    },

    /**
     * @private
     */
    _nextFrame: function(delta){
        var frames = this._frames,
            total = frames.length,
            frameIndex = this._currentFrame,
            frame = frames[frameIndex],
            duration = frame.duration || this.interval,
            elapsed = this._frameElapsed;

        //calculate the current frame elapsed frames/time
        var value = (frameIndex == 0 && !this.drawable) ? 0 : elapsed + (this.timeBased ? delta : 1);
        elapsed = this._frameElapsed = value < duration ? value : 0;

        if(frame.stop || !this.loop && frameIndex >= total - 1){
            this.stop();
        }

        if(!this.paused && elapsed == 0){
            if(frame.next != null){
                //jump to the specified frame
                frameIndex = this.getFrameIndex(frame.next);
            }else if(frameIndex >= total - 1){
                //at the end of the frames, go back to first frame
                frameIndex = 0;
            }else if(this.drawable){
                //normal go forward to next frame
                frameIndex++;
            }

            this._currentFrame = frameIndex;
        }

        this.fire('enterframe', {frame:frameIndex});

        return frameIndex;
    }
});

/**
 * @name DOMElement
 * @class DOMElement是dom元素的包装。
 * @augments View
 * @param {Object} properties 创建对象的属性参数。可包含此类所有可写属性。特殊属性有：
 * <ul>
 * <li><b>element</b> - 要包装的dom元素。必需。</li>
 * </ul>
 * @module hilo/view/DOMElement
 * @requires hilo/core/Hilo
 * @requires hilo/core/Class
 * @requires hilo/view/View
 * @requires hilo/view/Drawable
 */
var DOMElement = Class.create(/** @lends DOMElement.prototype */{
    Extends: View,
    constructor: function DOMElement(properties){
        properties = properties || {};
        this.id = this.id || properties.id || Hilo.getUid("DOMElement");
        DOMElement.superclass.constructor.call(this, properties);

        this.drawable = new Drawable();
        var elem = this.drawable.domElement = properties.element || Hilo.createElement('div');
        elem.id = this.id;
    },

    /**
     * 覆盖渲染方法。
     * @private
     */
    _render: function(renderer, delta){
        var elem = this.drawable.domElement, style = elem.style, parentElem = elem.parentNode;
        if(!this.visible || this.alpha <= 0){
            style.display = 'none';
            return;
        }

        style.display = '';
        this.fire('beforerender', delta);
        Hilo.setElementStyleByView(this);
        this.render(renderer, delta);
        this.fire('afterrender', delta);
    },

    /**
     * 覆盖渲染方法。
     * @private
     */
    render: function(renderer, delta){
        var canvas = renderer.canvas;
        if(canvas.getContext){
            var elem = this.drawable.domElement, depth = this.depth,
                nextElement = canvas.nextSibling, nextDepth;
            if(elem.parentNode) return;

            //draw dom element just after stage canvas
            while(nextElement && nextElement.nodeType != 3){
                nextDepth = parseInt(nextElement.style.zIndex) || 0;
                if(nextDepth <= 0 || nextDepth > depth){
                    break;
                }
                nextElement = nextElement.nextSibling;
            }
            canvas.parentNode.insertBefore(this.drawable.domElement, nextElement);
        }else{
            renderer.draw(this);
        }
    }
});

/**
 * @class Graphics类包含一组创建矢量图形的方法。
 * @augments View
 * @param {Object} properties 创建对象的属性参数。可包含此类所有可写属性。
 * @module hilo/view/Graphics
 * @requires hilo/core/Hilo
 * @requires hilo/core/Class
 * @property {Number} lineWidth 笔画的线条宽度。默认为1。
 * @property {Number} lineAlpha 笔画的线条透明度。默认为1。
 * @property {String} lineCap 笔画的线条端部样式。可选值有：butt、round、square等，默认为null。
 * @property {String} lineJoin 笔画的线条连接样式。可选值有：miter、round、bevel等，默认为null。
 * @property {Number} miterLimit 斜连线长度和线条宽度的最大比率。此属性仅当lineJoin为miter时有效。默认值为10。
 * @property {String} strokeStyle 笔画边框的样式。默认值为'0'，即黑色。
 * @property {String} fillStyle 内容填充的样式。默认值为'0'，即黑色。
 * @property {Number} fillAlpha 内容填充的透明度。默认值为0。
 */
var Graphics = (function(){

var helpContext = document.createElement('canvas').getContext('2d');

return Class.create(/** @lends Graphics.prototype */{
    Extends: View,
    constructor: function Graphics(properties){
        properties = properties || {};
        this.id = this.id || properties.id || Hilo.getUid('Graphics');
        Graphics.superclass.constructor.call(this, properties);

        this._actions = [];
        this._cache = null;
    },

    lineWidth: 1,
    lineAlpha: 1,
    lineCap: null, //'butt', 'round', 'square'
    lineJoin: null, //'miter', 'round', 'bevel'
    miterLimit: 10,
    hasStroke: false,
    strokeStyle: '0',
    hasFill: false,
    fillStyle: '0',
    fillAlpha: 0,

    /**
     * 指定绘制图形的线条样式。
     */
    lineStyle: function(thickness, lineColor, alpha, lineCap, lineJoin, miterLimit){
        var me = this, addAction = me._addAction;

        addAction.call(me, ['lineWidth', (me.lineWidth = thickness || 1)]);
        addAction.call(me, ['strokeStyle', (me.strokeStyle = lineColor || '0')]);
        addAction.call(me, ['lineAlpha', (me.lineAlpha = alpha || 1)]);
        if(lineCap != undefined) addAction.call(me, ['lineCap', (me.lineCap = lineCap)]);
        if(lineJoin != undefined) addAction.call(me, ['lineJoin', (me.lineJoin = lineJoin)]);
        if(miterLimit != undefined) addAction.call(me, ['miterLimit', (me.miterLimit = miterLimit)]);
        me.hasStroke = true;
        return me;
    },

    /**
     * 指定绘制图形的填充样式和透明度。
     */
    beginFill: function(fill, alpha){
        var me = this, addAction = me._addAction;

        addAction.call(me, ['fillStyle', (me.fillStyle = fill)]);
        addAction.call(me, ['fillAlpha', (me.fillAlpha = alpha || 1)]);
        me.hasFill = true;
        return me;
    },

    /**
     * 应用并结束笔画的绘制和图形样式的填充。
     */
    endFill: function(){
        var me = this, addAction = me._addAction;

        if(me.hasStroke) addAction.call(me, ['stroke']);
        if(me.hasFill) addAction.call(me, ['fill']);
        return me;
    },

    /**
     * 指定绘制图形的线性渐变填充样式。
     */
    beginLinearGradientFill: function(x0, y0, x1, y1, colors, ratios){
        var me = this, gradient = helpContext.createLinearGradient(x0, y0, x1, y1);

        for (var i = 0, len = colors.length; i < len; i++){
            gradient.addColorStop(ratios[i], colors[i]);
        }
        me.hasFill = true;
        return me._addAction(['fillStyle', (me.fillStyle = gradient)]);
    },

    /**
     * 指定绘制图形的放射性渐变填充样式。
     */
    beginRadialGradientFill: function(x0, y0, r0, x1, y1, r1, colors, ratios){
        var me = this, gradient = helpContext.createRadialGradient(x0, y0, r0, x1, y1, r1);
        for (var i = 0, len = colors.length; i < len; i++)
        {
            gradient.addColorStop(ratios[i], colors[i]);
        }
        me.hasFill = true;
        return me._addAction(['fillStyle', (me.fillStyle = gradient)]);
    },

    /**
     * 开始一个位图填充样式。
     * @param {HTMLImageElement} image 指定填充的Image对象。
     * @param {String} repetition 指定填充的重复设置参数。它可以是以下任意一个值：repeat, repeat-x, repeat-y, no-repeat。默认为''。
     */
    beginBitmapFill: function(image, repetition){
        var me = this, pattern = helpContext.createPattern(image, repetition || '');
        me.hasFill = true;
        return me._addAction(['fillStyle', (me.fillStyle = pattern)]);
    },

    /**
     * 开始一个新的路径。
     */
    beginPath: function(){
        return this._addAction(['beginPath']);
    },

    /**
     * 关闭当前的路径。
     */
    closePath: function(){
        return this._addAction(['closePath']);
    },

    /**
     * 绘制一个矩形。
     */
    drawRect: function(x, y, width, height){
        return this._addAction(['rect', x, y, width, height]);
    },

    /**
     * 绘制一个复杂的圆角矩形。
     */
    drawRoundRectComplex: function(x, y, width, height, cornerTL, cornerTR, cornerBR, cornerBL){
        var me = this, addAction = me._addAction;
        addAction.call(me, ['moveTo', x + cornerTL, y]);
        addAction.call(me, ['lineTo', x + width - cornerTR, y]);
        addAction.call(me, ['arc', x + width - cornerTR, y + cornerTR, cornerTR, -Math.PI/2, 0, false]);
        addAction.call(me, ['lineTo', x + width, y + height - cornerBR]);
        addAction.call(me, ['arc', x + width - cornerBR, y + height - cornerBR, cornerBR, 0, Math.PI/2, false]);
        addAction.call(me, ['lineTo', x + cornerBL, y + height]);
        addAction.call(me, ['arc', x + cornerBL, y + height - cornerBL, cornerBL, Math.PI/2, Math.PI, false]);
        addAction.call(me, ['lineTo', x, y + cornerTL]);
        addAction.call(me, ['arc', x + cornerTL, y + cornerTL, cornerTL, Math.PI, Math.PI*3/2, false]);
        return me;
    },

    /**
     * 绘制一个圆角矩形。
     */
    drawRoundRect: function(x, y, width, height, cornerSize){
        return this.drawRoundRectComplex(x, y, width, height, cornerSize, cornerSize, cornerSize, cornerSize);
    },

    /**
     * 绘制一个圆。
     */
    drawCircle: function(x, y, radius){
        return this._addAction(['arc', x + radius, y + radius, radius, 0, Math.PI * 2, 0]);
    },

    /**
     * 绘制一个椭圆。
     */
    drawEllipse: function(x, y, width, height){
        var me = this;
        if(width == height) return me.drawCircle(x, y, width);

        var addAction = me._addAction;
        var w = width / 2, h = height / 2, C = 0.5522847498307933, cx = C * w, cy = C * h;
        x = x + w;
        y = y + h;

        addAction.call(me, ['moveTo', x + w, y]);
        addAction.call(me, ['bezierCurveTo', x + w, y - cy, x + cx, y - h, x, y - h]);
        addAction.call(me, ['bezierCurveTo', x - cx, y - h, x - w, y - cy, x - w, y]);
        addAction.call(me, ['bezierCurveTo', x - w, y + cy, x - cx, y + h, x, y + h]);
        addAction.call(me, ['bezierCurveTo', x + cx, y + h, x + w, y + cy, x + w, y]);
        return me;
    },

    /**
     * 根据参数指定的SVG数据绘制一条路径。
     * 代码示例:
     * <p>var path = 'M250 150 L150 350 L350 350 Z';</p>
     * <p>var shape = new Quark.Graphics({width:500, height:500});</p>
     * <p>shape.drawSVGPath(path).beginFill('#0ff').endFill();</p>
     */
    drawSVGPath: function(pathData){
        var me = this, addAction = me._addAction,
            path = pathData.split(/,| (?=[a-zA-Z])/);

        addAction.call(me, ['beginPath']);
        for(var i = 0, len = path.length; i < len; i++){
            var str = path[i], cmd = str[0].toUpperCase(), p = str.substring(1).split(/,| /);
            if(p[0].length == 0) p.shift();

            switch(cmd){
                case 'M':
                    addAction.call(me, ['moveTo', p[0], p[1]]);
                    break;
                case 'L':
                    addAction.call(me, ['lineTo', p[0], p[1]]);
                    break;
                case 'C':
                    addAction.call(me, ['bezierCurveTo', p[0], p[1], p[2], p[3], p[4], p[5]]);
                    break;
                case 'Z':
                    addAction.call(me, ['closePath']);
                    break;
            }
        }
        return me;
    },

    /**
     * 执行全部绘制动作。内部私有方法。
     * @private
     */
    _draw: function(context){
        var me = this, actions = me._actions, len = actions.length, i;

        context.beginPath();
        for(i = 0; i < len; i++){
            var action = actions[i],
                f = action[0],
                args = action.length > 1 ? action.slice(1) : null;

            if(typeof(context[f]) == 'function') context[f].apply(context, args);
            else context[f] = action[1];
        }
    },

    /**
     * 重写渲染实现。
     */
    render: function(renderer, delta){
        var me = this, canvas = renderer.canvas;
        if(canvas.getContext){
            me._draw(renderer.context);
        }else{
            var drawable = me.drawable;
            if(!drawable.image){
                drawable.image = me.toImage();
            }
            renderer.draw(me);
        }
    },

    /**
     * 缓存graphics到一个canvas或image。可用来提高渲染效率。
     */
    cache: function(toImage){
        var me = this, cached = me._cache;
        if(!cached){
            cached = me._cache = Hilo.createElement('canvas', {width:me.width, height:me.height});
            me._draw(cached.getContext('2d'));
        }
        if(toImage) cached = me._cache = me.toImage();

        return cached;
    },

    /**
     * 清除缓存。
     */
    uncache: function(){
        this._cache = null;
    },

    /**
     * 把Graphics对象转换成dataURL格式的位图。
     * @param {String} type 指定转换为DataURL格式的图片mime类型。默认为'image/png'。
     */
    toImage: function(type){
        var me = this, obj = me._cache, w = me.width, h = me.height;

        if(!obj){
            obj = Hilo.createElement('canvas', {width:w, height:h});
            me._draw(obj.getContext('2d'));
        }

        if(!(obj instanceof HTMLImageElement)){
            var src = obj.toDataURL(type || 'image/png');
            obj = new Image();
            obj.src = src;
            obj.width = w;
            obj.height = h;
        }

        return obj;
    },

    /**
     * 清除所有绘制动作并复原所有初始状态。
     */
    clear: function(){
        var me = this;

        me._actions.length = 0;
        me._cache = null;

        me.lineWidth = 1;
        me.lineAlpha = 1;
        me.lineCap = null;
        me.lineJoin = null;
        me.miterLimit = 10;
        me.hasStroke = false;
        me.strokeStyle = '0';
        me.hasFill = false;
        me.fillStyle = '0';
        me.fillAlpha = 1;
    },

    /**
     * 添加一个绘制动作。内部私有方法。
     * @private
     */
    _addAction: function(action){
        var me = this;
        me._actions.push(action);
        return me;
    }

});

})();

/**
 * @class Text类提供简单的文字显示功能。复杂的文本功能可以使用DOMElement。
 * @augments View
 * @param {Object} properties 创建对象的属性参数。可包含此类所有可写属性。
 * @module hilo/view/Text
 * @requires hilo/core/Class
 * @requires hilo/core/Hilo
 * @requires hilo/view/View
 * @property {String} text 指定要显示的文本内容。
 * @property {String} color 指定使用的字体颜色。
 * @property {String} textAlign 指定文本的对齐方式。可以是以下任意一个值：'start', 'end', 'left', 'right', and 'center'。
 * @property {Boolean} outline 指定文本是绘制边框还是填充。
 * @property {Number} lineSpacing 指定文本的行距。单位为像素。默认值为0。
 * @property {Number} textWidth 指示文本内容的宽度，只读属性。仅在canvas模式下有效。
 * @property {Number} textHeight 指示文本内容的高度，只读属性。仅在canvas模式下有效。
 * @property {String} font 指定使用的字体样式。
 */
var Text = Class.create(/** @lends Text.prototype */{
    Extends: View,
    constructor: function Text(properties){
        properties = properties || {};
        this.id = this.id || properties.id || Hilo.getUid('Text');
        Text.superclass.constructor.call(this, properties);

        if(!this.width) this.width = 200; //default width
        if(!this.font) this.font = '12px arial'; //default font style
    },

    text: null,
    color: null,
    textAlign: null,
    outline: false,
    lineSpacing: 0,
    textWidth: 0, //read-only
    textHeight: 0, //read-only
    font: {
        get: function(){
            return this._font || null;
        },
        set: function(value){
            if(this._font === value) return;
            this._font = value;
            this._fontHeight = Text.measureFontHeight(value);
        }
    },

    /**
     * 覆盖渲染方法。
     */
    render: function(renderer, delta){
        var me = this, canvas = renderer.canvas;

        if(canvas.getContext){
            me._draw(renderer.context);
        }else{
            var drawable = me.drawable;
            var domElement = drawable.domElement;
            var style = domElement.style;

            style.font = me.font;
            style.textAlign = me.textAlign;
            style.color = me.color;
            style.width = me.width + 'px';
            style.height = me.height + 'px';
            style.lineHeight = (me._fontHeight + me.lineSpacing) + 'px';

            domElement.innerHTML = me.text;
            renderer.draw(this);
        }
    },

    /**
     * 在指定的渲染上下文上绘制文本。
     * @private
     */
    _draw: function(context){
        var me = this, text = me.text.toString();
        if(!text) return;

        //set drawing style
        context.font = me.font;
        context.textAlign = me.textAlign;
        context.textBaseline = 'top';
        if(me.outline) context.strokeStyle = me.color;
        else context.fillStyle = me.color;

        //find and draw all explicit lines
        var lines = text.split(/\r\n|\r|\n|<br(?:[ \/])*>/);
        var width = 0, height = 0;
        var lineHeight = me._fontHeight + me.lineSpacing;
        var i, line, w;

        for(i = 0, len = lines.length; i < len; i++){
            line = lines[i];
            w = context.measureText(line).width;

            //check if the line need to split
            if(w <= me.width){
                me._drawTextLine(context, line, height);
                if(width < w) width = w;
                height += lineHeight;
                continue;
            }

            var str = '', oldWidth = 0, newWidth, j, word;

            for(j = 0, wlen = line.length; j < wlen; j++){
                word = line[j];
                newWidth = context.measureText(str + word).width;

                if(newWidth > me.width){
                    me._drawTextLine(context, str, height);
                    if(width < oldWidth) width = oldWidth;
                    height += lineHeight;
                    str = word;
                }else{
                    oldWidth = newWidth;
                    str += word;
                }

                if(j == wlen - 1){
                    me._drawTextLine(context, str, height);
                    if(str !== word && width < newWidth) width = newWidth;
                    height += lineHeight;
                }
            }
        }

        me.textWidth = width;
        me.textHeight = height;
        if(!me.height) me.height = height;
    },

    /**
     * 在指定的渲染上下文上绘制一行文本。
     * @private
     */
    _drawTextLine: function(context, text, y){
        var me = this, x = 0, width = me.width;

        switch(me.textAlign){
            case 'center':
                x = width * 0.5 >> 0;
                break;
            case 'right':
            case 'end':
                x = width;
                break;
        };

        if(me.outline) context.strokeText(text, x, y);
        else context.fillText(text, x, y);
    },

    Statics: /** @lends Text */{
        /**
         * 测算指定字体样式的行高。
         * @param {String} font 指定要测算的字体样式。
         * @return {Number} 返回指定字体的行高。
         */
        measureFontHeight: function(font){
            var docElement = document.documentElement, fontHeight;
            var elem = Hilo.createElement('div', {style:{font:font, position:'absolute'}, innerHTML:'M'});

            docElement.appendChild(elem);
            fontHeight = elem.offsetHeight;
            docElement.removeChild(elem);
            return fontHeight;
        }
    }

});

/**
 * @class BitmapText类提供使用位图文本的功能。当前仅支持单行文本。
 * @augments Container
 * @param {Object} properties 创建对象的属性参数。可包含此类所有可写属性。
 * @module hilo/view/BitmapText
 * @requires hilo/core/Class
 * @requires hilo/core/Hilo
 * @requires hilo/view/Container
 * @property {Object} glyphs 位图字体的字形集合。格式为：{letter:{image:img, rect:[0,0,100,100]}}。
 * @property {Number} letterSpacing 字距，即字符间的间隔。默认值为0。
 */
var BitmapText = Class.create(/** @lends BitmapText.prototype */{
    Extends: Container,
    constructor: function BitmapText(properties){
        properties = properties || {};
        this.id = this.id || properties.id || Hilo.getUid('BitmapText');
        BitmapText.superclass.constructor.call(this, properties);

        this.pointerChildren = false; //disable user events for single letters
    },

    glyphs: null,
    letterSpacing: 0,
    text: {
        get: function(){
            return this._text || '';
        },
        set: function(str){
            var me = this, str = str.toString(), len = str.length;
            if(me._text == str) return;
            me._text = str;
            me.removeAllChildren();

            var i, charStr, charGlyph, charObj, width = 0, height = 0;

            for(i = 0; i < len; i++){
                charStr = str.charAt(i);
                charGlyph = me.glyphs[charStr];
                if(charGlyph){
                    charObj = new Bitmap({
                        image: charGlyph.image,
                        rect: charGlyph.rect,
                        x: width
                    });
                    width += (width > 0 ? me.letterSpacing : 0) + charGlyph.rect[2];
                    heigth = Math.max(height, charGlyph.rect[3]);
                    me.addChild(charObj);
                }
            }

            me.width = width;
            me.height = height;
        }
    },

    /**
     * 返回能否使用当前指定的字体显示提供的字符串。
     * @param {String} str 要检测的字符串。
     * @returns {Boolean} 是否能使用指定字体。
     */
    hasGlyphs: function(str){
        var glyphs = this.glyphs;
        if(!glyphs) return false;

        var str = str.toString(), len = str.length, i;
        for(i = 0; i < len; i++){
            if(!glyphs[str.charAt(i)]) return false;
        }
        return true;
    }

});

/**
 * @class TextureAtlas纹理集是将许多小的纹理图片整合到一起的一张大图。这个类可根据一个纹理集数据读取纹理小图、精灵动画等。
 * @param {Image} image 纹理集图片。
 * @param {Array} frameData 纹理集帧数据。每帧的数据格式为：[x, y, width, height]。
 * @param {Object} spriteData 纹理集精灵数据。
 * @module hilo/util/TextureAtlas
 * @require hilo/core/Class
 */
var TextureAtlas = (function(){

return Class.create(/** @lends TextureAtlas.prototype */{
    constructor: function TextureAtlas(image, frameData, spriteData){
        var result = parseAtlasData(image, frameData, spriteData);
        this._frames = result.frames;
        this._sprites = result.sprites;
    },

    _frames: null,
    _sprites: null,

    /**
     * 获取指定索引位置index的帧数据。
     * @param {Int} index 要获取帧的索引位置。
     * @returns {Object} 帧数据。
     */
    getFrame: function(index){
        var frames = this._frames;
        return frames && frames[index];
    },

    /**
     * 获取指定id的精灵数据。
     * @param {String} id 要获取精灵的id。
     * @returns {Object} 精灵数据。
     */
    getSprite: function(id){
        var sprites = this._sprites;
        return sprites && sprites[id];
    }
});

/**
 * 解析纹理集帧和精灵数据。
 * @private
 */
function parseAtlasData(image, frameData, spriteData){
    if(frameData === undefined){
        var data = image;
        image = data.image;
        frameData = data.frames;
        spriteData = data.sprites;
    }

    //frames
    if(frameData){
        var frames = [], frame, obj;

        for(var i = 0, len = frameData.length; i < len; i++){
            obj = frameData[i];
            frame = {
                image: image,
                rect: [obj[0], obj[1], obj[2], obj[3]],
                pivotX: obj[4] || 0,
                pivotY: obj[5] || 0
            };
            frames[i] = frame;
        }
    }

    //sprite frames
    if(spriteData){
        var sprites = {}, sprite, spriteFrames, spriteFrame;

        for(var s in spriteData){
            sprite = spriteData[s];
            if(isNumber(sprite)){
                spriteFrames = translateSpriteFrame(frames[sprite]);
            }else if(sprite instanceof Array){
                spriteFrames = [];
                for(var i = 0, len = sprite.length; i < len; i++){
                    var spriteObj = sprite[i], frameObj;
                    if(isNumber(spriteObj)){
                        spriteFrame = translateSpriteFrame(frames[spriteObj]);
                    }else{
                        frameObj = spriteObj.rect;
                        if(isNumber(frameObj)) frameObj = frames[spriteObj.rect];
                        spriteFrame = translateSpriteFrame(frameObj, spriteObj);
                    }
                    spriteFrames[i] = spriteFrame;
                }
            }
            sprites[s] = spriteFrames;
        }
    }

    return {frames:frames, sprites:sprites};
}

function isNumber(value){
    return typeof value === 'number';
}

function translateSpriteFrame(frameObj, spriteObj){
    var spriteFrame = {
        image: frameObj.image,
        rect: frameObj.rect,
        pivotX: frameObj.pivotX || 0,
        pivotY: frameObj.pivotY || 0
    };

    if(spriteObj){
        spriteFrame.name = spriteObj.name || null;
        spriteFrame.duration = spriteObj.duration || 0;
        spriteFrame.stop = !!spriteObj.stop;
        spriteFrame.next = spriteObj.next || null;
    }

    return spriteFrame;
}

})();

/**
 * @class Ticker是一个定时器类。它可以按指定帧率重复运行，从而按计划执行代码。
 * @param {Number} fps 指定定时器的运行帧率。
 * @module hilo/util/Ticker
 * @requires hilo/core/Class
 * @requires hilo/core/Hilo
 */
var Ticker = Class.create(/** @lends Ticker.prototype */{
    constructor: function Ticker(fps){
        this._targetFPS = fps || 30;
        this._interval = 1000 / this._targetFPS;
        this._tickers = [];
    },

    _paused: false,
    _targetFPS: 0,
    _interval: 0,
    _intervalId: null,
    _tickers: null,
    _lastTime: 0,
    _tickCount: 0,
    _tickTime: 0,
    _measuredFPS: 0,

    /**
     * 启动定时器。
     * @param {Boolean} userRAF 是否使用requestAnimationFrame，默认为false。
     */
    start: function(useRAF){
        if(this._intervalId) return;
        this._lastTime = +new Date();

        var self = this, interval = this._interval,
            raf = window.requestAnimationFrame ||
                  window[Hilo.browser.jsVendor + 'RequestAnimationFrame'];

        if(useRAF && raf){
            var tick = function(){
                self._tick();
            }
            var runLoop = function(){
                self._intervalId = setTimeout(runLoop, interval);
                raf(tick);
            };
        }else{
            runLoop = function(){
                self._intervalId = setTimeout(runLoop, interval);
                self._tick();
            };
        }

        runLoop();
    },

    /**
     * 停止定时器。
     */
    stop: function(){
        clearTimeout(this._intervalId);
        this._intervalId = null;
        this._lastTime = 0;
    },

    /**
     * 暂停定时器。
     */
    pause: function(){
        this._paused = true;
    },

    /**
     * 恢复定时器。
     */
    resume: function(){
        this._paused = false;
    },

    /**
     * @private
     */
    _tick: function(){
        if(this._paused) return;
        var startTime = +new Date(),
            deltaTime = startTime - this._lastTime,
            tickers = this._tickers;

        for(var i = 0, len = tickers.length; i < len; i++){
            tickers[i].tick(deltaTime);
        }

        //calculates the real fps
        var endTime = +new Date();
        if(++this._tickCount >= this._targetFPS){
            this._measuredFPS = 1000 / (this._tickTime / this._tickCount) + 0.5 >> 0;
            this._tickCount = 0;
            this._tickTime = 0;
        }else{
            this._tickTime += endTime - this._lastTime;
        }
        this._lastTime = endTime;
    },

    /**
     * 获得测定的运行时帧率。
     */
    getMeasuredFPS: function(){
        return this._measuredFPS;
    },

    /**
     * 添加定时器对象。定时器对象必须实现 tick 方法。
     * @param {Object} tickObject 要添加的定时器对象。此对象必须包含 tick 方法。
     */
    addTick: function(tickObject){
        if(!tickObject || typeof(tickObject.tick) != 'function'){
            throw new Error('Ticker: The tick object must implement the tick method.');
        }
        this._tickers.push(tickObject);
    },

    /**
     * 删除定时器对象。
     * @param {Object} tickObject 要删除的定时器对象。
     */
    removeTick: function(tickObject){
        var tickers = this._tickers,
            index = tickers.indexOf(tickObject);
        if(index >= 0){
            tickers.splice(index, 1);
        }
    }

});

var arrayProto = Array.prototype,
    slice = arrayProto.slice;

//polyfiil for Array.prototype.indexOf
arrayProto.indexOf = arrayProto.indexOf || function(elem, fromIndex){
    fromIndex = fromIndex || 0;
    var len = this.length, i;
    if(len == 0 || fromIndex >= len) return -1;
    if(fromIndex < 0) fromIndex = len + fromIndex;
    for(i = fromIndex; i < len; i++){
        if(this[i] === elem) return i;
    }
    return -1;
};

var fnProto = Function.prototype;

//polyfill for Function.prototype.bind
fnProto.bind = fnProto.bind || function(thisArg){
    var target = this,
        boundArgs = slice.call(arguments, 1),
        F = function(){};

    function bound(){
        var args = boundArgs.concat(slice.call(arguments));
        return target.apply(this instanceof bound ? this : thisArg, args);
    }

    F.prototype = target.prototype;
    bound.prototype = new F();

    return bound;
};

/**
 * @class Tween类提供缓动功能。
 * @param {Object} target 缓动对象。
 * @param {Object} newProps 对象缓动的目标属性集合。
 * @param {Object} params 缓动参数。可包含Tween类所有可写属性。
 * @module hilo/util/Tween
 * @requires hilo/core/Class
 * @property {Object} target 缓动目标。只读属性。
 * @property {Number} time 缓动总时长。单位毫秒。
 * @property {Number} delay 缓动延迟时间。单位毫秒。
 * @property {Boolean} paused 缓动是否暂停。默认为false。
 * @property {Boolean} loop 缓动是否循环。默认为false。
 * @property {Boolean} reverse 缓动是否反转播放。默认为false。
 * @property {Number} interval 缓动间隔。默认为0。
 * @property {Function} ease 缓动变化函数。默认为null。
 * @property {Tween} next 下一个缓动变化对象。默认为null。
 * @property {Function} onUpdate 缓动更新回调函数。默认为null。
 * @property {Function} onComplete 缓动结束回调函数。默认为null。
 */
var Tween = (function(){

return Class.create(/** @lends Tween.prototype */{
    constructor: function Tween(target, newProps, params){
        var me = this;
        me.target = target;

        me._oldProps = {};
        me._newProps = {};
        me._deltaProps = {};
        me._startTime = 0;
        me._lastTime = 0;
        me._pausedTime = 0;
        me._pausedStartTime = 0;
        me._reverseFlag = 1;
        me._frameTotal = 0;
        me._frameCount = 0;

        for(var p in newProps){
            var oldVal = target[p], newVal = newProps[p];
            if(oldVal !== undefined){
                if(typeof oldVal == 'number' && typeof newVal == 'number'){
                    me._oldProps[p] = oldVal;
                    me._newProps[p] = newVal;
                    me._deltaProps[p] = newVal - oldVal;
                }
            }
        }

        for(var p in params){
            me[p] = params[p];
        }
    },

    target: null,
    time: 0,
    delay: 0,
    paused: false,
    loop: false,
    reverse: false,
    interval: 0,
    ease: null,
    next: null,

    onUpdate: null,
    onComplete: null,

    /**
     * 设置缓动对象的初始和目标属性。
     * @param oldProps 缓动对象的初始属性。
     * @param newProps 缓动对象的目标属性。
     */
    setProps: function(oldProps, newProps){
        for(var p in oldProps){
            this.target[p] = this._oldProps[p] = oldProps[p];
        }
        for(var p in newProps){
            this._newProps[p] = newProps[p];
            this._deltaProps[p] = newProps[p] - this.target[p];
        }
    },

    /**
     * 初始化Tween类。
     * @private
     */
    _init: function(){
        this._startTime = Date.now() + this.delay;
        this._pausedTime = 0;
        if(this.interval > 0) this._frameTotal = Math.round(this.time / this.interval);
        Tween.add(this);
    },

    /**
     * 启动缓动动画的播放。
     */
    start: function(){
        this._init();
        this.paused = false;
    },

    /**
     * 停止缓动动画的播放。
     */
    stop: function(){
        Tween.remove(this);
    },

    /**
     * 暂停缓动动画的播放。
     */
    pause: function(){
        this.paused = true;
        this._pausedStartTime = Date.now();
    },

    /**
     * 恢复缓动动画的播放。
     */
    resume: function(){
        this.paused = false;
        this._pausedTime += Date.now() - this._pausedStartTime;
    },

    /**
     * Tween类的内部更新方法。
     * @private
     */
    _update: function(){
        if(this.paused) return;
        var now = Date.now();
        var elapsed = now - this._startTime - this._pausedTime;
        if(elapsed < 0) return;

        this._lastTime = now;

        var ratio = this._frameTotal > 0 ? (++this._frameCount / this._frameTotal) : (elapsed / this.time);
        if(ratio > 1) ratio = 1;
        var value = this.ease ? this.ease(ratio) : ratio;

        for(var p in this._oldProps){
            this.target[p] = this._oldProps[p] + this._deltaProps[p] * this._reverseFlag * value;
        }

        if(this.onUpdate) this.onUpdate(value);

        if(ratio >= 1){
            if(this.reverse){
                var tmp = this._oldProps;
                this._oldProps = this._newProps;
                this._newProps = tmp;
                this._startTime = Date.now();
                this._frameCount = 0;
                this._reverseFlag *= -1;
            }else if(this.loop){
                for(var p in this._oldProps) this.target[p] = this._oldProps[p];
                this._startTime = Date.now();
                this._frameCount = 0;
            }else{
                Tween.remove(this);
                var next = this.next, nextTween;
                if(next){
                    if(next instanceof Tween){
                        nextTween = next;
                        next = null;
                    }else{
                        nextTween = next.shift();
                    }
                    if(nextTween){
                        nextTween.next = next;
                        nextTween.start();
                    }
                }
            }

            if(this.onComplete) this.onComplete(this);
            if(this.reverse && !this.loop) this.reverse = false;
        }
    },

    Statics: /** @lends Tween */ {
        /**
         * @private
         */
        _tweens: [],

        /**
         * 更新所有Tween实例。
         * @returns {Object} Tween。
         */
        tick: function(){
            var tweens = this._tweens, i = tweens.length;
            while(--i >= 0) tweens[i]._update();
            return this;
        },

        /**
         * 添加Tween实例。
         * @param {Tween} tween 要添加的Tween对象。
         * @returns {Object} Tween。
         */
        add: function(tween){
            if(this._tweens.indexOf(tween) == -1) this._tweens.push(tween);
            return this;
        },

        /**
         * 删除Tween实例。
         * @param {Tween} tween 要删除的Tween对象。
         * @returns {Object} Tween。
         */
        remove: function(tween){
            if(tween){
                var tweens = this._tweens;
                var index = tweens.indexOf(tween);
                if(index > -1) tweens.splice(index, 1);
            }
            return this;
        },

        /**
         * 删除所有Tween实例。
         * @returns {Object} Tween。
         */
        removeAll: function(){
            this._tweens.length = 0;
            return this;
        },

        /**
         * 创建一个缓动动画，让目标对象从当前属性变换到目标属性。
         * @param target 缓动目标对象。
         * @param toProps 缓动目标对象的目标属性。
         * @param params 缓动动画的参数。
         * @returns {Tween} 一个Tween实例对象。
         */
        to: function(target, toProps, params){
            var tween = new Tween(target, toProps, params);
            tween._init();
            return tween;
        },

        /**
         * 创建一个缓动动画，让目标对象从指定的起始属性变换到当前属性。
         * @param target 缓动目标对象。
         * @param toProps 缓动目标对象的起始属性。
         * @param params 缓动动画的参数。
         * @returns {Tween} 一个Tween实例对象。
         */
        from: function(target, fromProps, params){
            var tween = new Tween(target, fromProps, params);
            var tmp = tween._oldProps;
            tween._oldProps = tween._newProps;
            tween._newProps = tmp;
            tween._reverseFlag = -1;

            for(var p in tween._oldProps) target[p] = tween._oldProps[p];

            tween._init();
            return tween;
        }
    }

});

})();

Hilo.Class = Class;
Hilo.EventMixin = EventMixin;
Hilo.Renderer = Renderer;
Hilo.CanvasRenderer = CanvasRenderer;
Hilo.DOMRenderer = DOMRenderer;
Hilo.Matrix = Matrix;
Hilo.Drawable = Drawable;
Hilo.View = View;
Hilo.Container = Container;
Hilo.Stage = Stage;
Hilo.Bitmap = Bitmap;
Hilo.Sprite = Sprite;
Hilo.DOMElement = DOMElement;
Hilo.Graphics = Graphics;
Hilo.Text = Text;
Hilo.BitmapText = BitmapText;
Hilo.TextureAtlas = TextureAtlas;
Hilo.Ticker = Ticker;
Hilo.Tween = Tween;
window.Hilo = Hilo;

})(window);