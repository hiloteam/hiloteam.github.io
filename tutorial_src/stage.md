# 从舞台开始
---

舞台Stage在Hilo中扮演着非常重要的角色，一切从舞台开始。
舞台是一个各种图形、精灵动画等的总载体。所有用Hilo创建的可见的对象都必须添加到舞台或其子容器后，才会被渲染和显示出来。
舞台实质上也是一个容器Container，不过它是一个顶级容器。它除开拥有普通容器的功能，它还拥有一些特殊属性和方法。

## 创建舞台

舞台Stage的创建非常简单。它接受一个`properties`参数对象，包含3个基本属性：

* `canvas` - 指定舞台所对应的DOM元素。它可以是一个canvas元素，也可以是一个普通的div元素。它决定了是使用canvas渲染所有对象还是使用DOM和CSS来渲染。
* `width` - 指定舞台的宽度。
* `height` - 指定舞台的高度。

```
var stage = new Hilo.Stage({
    canvas: canvas, 
    width: 480, 
    height: 320
});
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