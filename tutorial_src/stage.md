# 从舞台开始
---

舞台Stage在Hilo中扮演着非常重要的角色，一切从舞台开始。
舞台是一个各种图形、精灵动画等的总载体。所有用Hilo创建的可见的对象都必须添加到舞台或其子容器后，才会被渲染和显示出来。
舞台实质上也是一个容器Container，不过它是一个顶级容器。它除开拥有普通容器的功能，它还拥有一些特殊属性和方法。

## 创建舞台

舞台Stage的创建非常简单。它接受一个`properties`参数对象，包含3个基本属性：

* `container` - 指定舞台所对应容器，舞台会根据渲染模式不同创建不同的dom对象插入到容器中。
* `renderType` - 指定舞台渲染模式。目前支持canvas，dom，webgl三种渲染模式，默认canvas。
* `width` - 指定舞台的宽度。
* `height` - 指定舞台的高度。

```
var stage = new Hilo.Stage({
    renderType:'canvas',
    container: container,
    width: 480,
    height: 320
});
```

## 高清支持

高清可以通过缩放stage来实现，width和height设置为二倍图大小，scale设置为0.5

```
var stage = new Hilo.Stage({
    container:document.body,
    width:750,
    height:1334,
    scaleX:0.5,
    scaleY:0.5
});
```

## 屏幕自适应

屏幕自适应也可以通过缩放来实现，更新舞台宽高可以调用 ```stage.resize(width, height, true)```来更新
```
var gameWidth = 550;
var gameHeight = 400;
var stageScaleX = innerWidth/gameWidth;
var stageScaleY = innerHeight/gameHeight;

var stage = new Hilo.Stage({
    container:document.body,
    width:gameWidth,
    height:gameHeight,
    scaleX:stageScaleX,
    scaleY:stageScaleY
});

window.onresize = function(){
    stage.scaleX = innerWidth/gameWidth;
    stage.scaleY = innerHeight/gameHeight;
    stage.resize(gameWidth, gameHeight, true);
};
```

## 管理可视对象

游戏画面一般由大量的图形、精灵动画等组成。舞台作为一个容器，它同样提供了方便的方法来管理这些可视对象。如添加、删除、排序等。

* `addChild` - 添加子对象。
* `removeChild` - 删除子对象。
* `setChildIndex` - 设置子对象的Z轴顺序，即深度depth。
* `sortChildren` - 对象所有子对象进行排序。

更多的方法请参考API文档。


## 舞台刷新和渲染

舞台Stage上的物体的运动等一切变化，都是通过一个定时器Ticker不断地调用Stage.tick()方法来实现刷新和渲染的。

```
var ticker = new Hilo.Ticker(60);
ticker.addTick(stage);
ticker.start();
```