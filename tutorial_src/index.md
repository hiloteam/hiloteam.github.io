# 快速开始
---

## 下载安装

Hilo是一个开放式的框架，提供多种模块化范式的版本供您使用，您可以下载：

* [Standalone 独立版本](https://github.com/hiloteam/Hilo/raw/v1.0.2/build/standalone/hilo-standalone.zip)
* [For RequireJS(AMD) 版本](https://github.com/hiloteam/Hilo/raw/v1.0.2/build/amd/hilo-amd.zip)
* [For CommonJS 版本](https://github.com/hiloteam/Hilo/raw/v1.0.2/build/commonjs/hilo-commonjs.zip)
* [For SeaJS(CMD) 版本](https://github.com/hiloteam/Hilo/raw/v1.0.2/build/cmd/hilo-cmd.zip)
* [For Kissy 版本](https://github.com/hiloteam/Hilo/raw/v1.0.2/build/kissy/hilo-kissy.zip)

此外，您也可以到Github上获取Hilo的最新源码：[https://github.com/hiloteam/Hilo](https://github.com/hiloteam/Hilo)

然后把Hilo类库引入到页面中：

    <script src="hilo-standalone.js"></script>

## 创建舞台

舞台Stage是一个各种图形、精灵动画等的总载体。所以可见的对象都要添加到舞台或其子容器后，才会被渲染出来。

```
var stage = new Hilo.Stage({
    renderType:'canvas',
    container: containerElem,
    width: 320,
    height: 480
});
```

Stage构造函数接收一个参数`properties`，此参数包含创建stage的各种属性。

## 创建定时器

舞台Stage上的物体的运动等变化，都是通过一个定时器Ticker不断地调用Stage.tick()方法来实现刷新的。

```
var ticker = new Hilo.Ticker(60);
ticker.addTick(stage);
ticker.start();
```

## 创建可视对象

舞台上的一切对象都是可视对象，可以是图片、精灵、文字、图形，甚至DOM元素等等。Hilo提供了一些基本的可视类供您使用，比如添加一个图片到舞台上：

```
var bird = new Hilo.Bitmap({
    image: 'images/bird.png'
}).addTo(stage);
```

## 事件交互

要想舞台上的图形、精灵动画等对象能响应用户的点击、触碰等交互事件，就必需先为舞台开启DOM事件响应，然后就可以使用View.on()来响应事件。

```
stage.enableDOMEvent(Hilo.event.POINTER_START, true);
sprite.on(Hilo.event.POINTER_START, function(e){
    console.log(e.eventTarget, e.stageX, e.stageY);
});
```

接下来，您就可以开始利用hilo提供的各种可视类来创建各种图形、精灵动画，尽情发挥您的创造力，开始您的HTML5游戏之旅吧！