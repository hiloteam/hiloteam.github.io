# 使用Hilo快速开发Flappy Bird
---

Flappy Bird是一款前不久风靡世界的休闲小游戏。虽然它难度超高，但是游戏本身却非常简单。下面我们就使用Hilo来快速开发HTML5版的Flappy Bird。

## 源文件结构

大家可以先下载[Flappy Bird的项目源文件](res/flappybird.zip)作为参考，以下是整个项目的文件结构：

    flappybird/
    ├── index.html //游戏主页面
    ├── js/
    │   ├── game.js //游戏主模块
    │   ├── Asset.js //素材加载类
    │   ├── ReadyScene.js //准备场景
    │   ├── OverScene.js //结束场景
    │   ├── Bird.js //小鸟类
    │   ├── Holdbacks.js //障碍类
    │   ├── hilo-standalone.js //hilo独立版
    └── images/

## 预加载图片

为了让玩家有更流畅的游戏体验，图片素材一般需要预先加载。Hilo提供了一个队列下载工具LoadQueue，使用它可以预加载图片素材。如下所示，在Asset类中，我们定义了load方法：

```
load: function(){
    var resources = [
        {id:'bg', src:'images/bg.png'},
        {id:'ground', src:'images/ground.png'},
        {id:'ready', src:'images/ready.png'},
        {id:'over', src:'images/over.png'},
        {id:'number', src:'images/number.png'},
        {id:'bird', src:'images/bird.png'},
        {id:'holdback', src:'images/holdback.png'}
    ];

    this.queue = new Hilo.LoadQueue();
    this.queue.add(resources);
    this.queue.on('complete', this.onComplete.bind(this));
    this.queue.start();
}
```

从上面代码中可以看到，resources是我们要下载的图片素材列表，使用queue.add()方法把素材列表加入到下载队列中，再使用queue.start()方法来启动下载队列。

> **提示**：下载队列LoadQueue当前仅支持图片等资源的下载，其他资源文件可通过自定义扩展方式实现。具体可参考API文档。

为了获得下载情况，LoadQueue提供了三个事件：

* `load` - 当单个资源下载完成时发生
* `complete` - 当所有资源下载完成时发生
* `error` - 当某一资源下载出错时发生

在这里我们仅监听了complete事件。

```
onComplete: function(e){
    this.bg = this.queue.get('bg').content;
    this.ground = this.queue.get('ground').content;
    this.birdAtlas = new Hilo.TextureAtlas({
        image: this.queue.get('bird').content,
        frames: [
            [0, 120, 86, 60],
            [0, 60, 86, 60],
            [0, 0, 86, 60]
        ],
        sprites: {
            bird: [0, 1, 2]
        }
    });

    //删除下载队列的complete事件监听
    this.queue.off('complete');
    //发送complete事件
    this.fire('complete');
}
```

下载完成后会触发onComplete回调方法。我们可以通过queue.get(id).content来获取指定id的图片素材下载完成后的Image对象。 在这里我们创建了游戏中需要用到的素材以及精灵纹理集等。

其中纹理集TextureAtlas实例由三部分组成：

* `image` - 纹理集图片。
* `frames` - 纹理集图片帧序列。每个图片帧由图片在纹理集中的坐标x/y和宽高width/height组成，即[x, y, width, height]。
* `sprites` - 精灵定义。sprites可包含多个精灵定义。每个精灵由多个frames中的图片帧组成，其中数值代表图片帧在frames中的索引位置。比如bird，则由索引为0、1、2的图片帧组成。

在game.js中使用Asset类来下载完图片素材后，再调用initStage方法初始化舞台：

```
this.asset = new game.Asset();
this.asset.on('complete', function(e){
    this.asset.off('complete');
    this.initStage();
}.bind(this));
this.asset.load();
```

## 初始化舞台

由于我们的图片素材是高清图片，且背景大小为720x1280。因此，我们设定游戏舞台的大小为720x1280，并设置其x和y轴的缩放比例均为0.5，这样舞台实际的可见大小变为360x640。最后，我们把canvas画布添加到body中。

```
initStage: function(){
    this.width = 720;
    this.height = 1280;
    this.scale = 0.5;

    var stage = this.stage = new Hilo.Stage({
        width: this.width,
        height: this.height,
        scaleX: scale,
        scaleY: scale
    });

    document.body.appendChild(stage.canvas);
}
```

> **注意**：舞台是一个各种图形、精灵动画等的总载体。所有用Hilo创建的可见的对象都必须添加到舞台或其子容器后，才会被渲染和显示出来。

舞台创建好后，我们需要一个定时器来不断更新和渲染舞台。这里可以使用Ticker类：

```
//设定舞台刷新频率为60fps
this.ticker = new Hilo.Ticker(60);
//把舞台加入到tick队列
this.ticker.addTick(this.stage);
//启动ticker
this.ticker.start();
```

## 场景分析

如果你玩过原版的Flappy Bird，就知道此游戏的场景非常简单，大致可以划分以下几个部分：

背景 - 背景图和移动的地面是贯穿整个游戏，没有变化的。
准备场景 - 一个简单的游戏提示画面。游戏开始前和失败后重新开始都会进入此场景。
游戏场景 - 障碍物不断的从右往左移动，玩家控制小鸟的飞行。
结束场景 - 游戏失败后，显示得分以及相关按钮等。
接下来，我们就开始用Hilo来创建这4个场景。


## 游戏背景

由于背景是不变的，为了减少canvas的重复绘制，我们采用DOM+CSS来设置背景。先创建一个div，设置其CSS背景为游戏背景图片，再把它加入到舞台的canvas后面。

```
initBackground: function(){
    var bgWidth = this.width * this.scale;
    var bgHeight = this.height * this.scale;
    document.body.insertBefore(Hilo.createElement('div', {
      id: 'bg',
      style: {
          position: 'absolute',
          background: 'url(images/bg.png) no-repeat',
          backgroundSize: bgWidth + 'px, ' + bgHeight + 'px',
          width: bgWidth + 'px',
          height: bgHeight + 'px'
      }
    }), this.stage.canvas);
}
```
地面也是背景的一部分，处于画面最下端。地面我们使用可视对象Bitmap类。一般的，不需要使用精灵动画的普通图片对象都可使用此类。Bitmap类只要传入相应的图片image参数即可。此外，为了方便查找对象，一般我们都为可视对象取一个合适的id。

```
initBackground: function(){
    /* all previous code here */

    this.ground = new Hilo.Bitmap({
      id: 'ground',
      image: this.asset.ground
    });

    //放置地面在舞台的最底部
    this.ground.y = this.height - this.ground.height;

    //循环移动地面
    Hilo.Tween.to(this.ground, {x:-60}, {duration:300, loop:true});
}
```

地面不是静止的。它是从右到左的不断循环的移动着的。我们注意到地面的图片素材比背景要宽一些，而地面图片本身也是一些循环的斜四边形组成的。这样的特性，意味着如果我们把图片从当前位置移动到下一个斜四边形的某一位置时，舞台上的地面会看起来是没有移动过一样。我们找到当地面的x轴坐标为-60时，跟x轴为0时的地面的图形是没有差异的。这样，若地面在0到-60之间不断循环变化时，地面就循环移动起来了。

Hilo提供了缓动动画Tween类。它的使用也非常简单：

    Hilo.Tween.to(obj, newProperties, params);

* `obj` - 要缓动的对象。
* `newProperties` - 指定缓动后对象的属性改变后的新值。这里指定x为-60，也就是地面运动到x为-60的位置。
* `params` - 指定缓动参数。这里指定了缓动时间time为300毫秒，loop表示缓动是不断循环的。

Tween类不会自动运行，也需要加入到tick队列才能运行：

    this.ticker.addTick(Hilo.Tween);

## 准备场景

准备场景很简单，由一个Get Ready！的文字图片和TAP提示的图片组成。这里，我们创建一个ReadyScene的类，继承自容器类Container。它的实现只需要把getready和tap这2个Bitmap对象创建好并放置在适当的位置即可。而它们的图片素材image会传给ReadyScene的构造函数。

```
var ReadyScene = Hilo.Class.create({
    Extends: Hilo.Container,
    constructor: function(properties){
        ReadyScene.superclass.constructor.call(this, properties);
        this.init(properties);
    },

    init: function(properties){
        //准备Get Ready!
        var getready = new Hilo.Bitmap({
            image: properties.image,
            rect: [0, 0, 508, 158]
        });

        //开始提示tap
        var tap = new Hilo.Bitmap({
            image: properties.image,
            rect: [0, 158, 286, 246]
        });

        //确定getready和tap的位置
        tap.x = this.width - tap.width >> 1;
        tap.y = this.height - tap.height + 40 >> 1;
        getready.x = this.width - getready.width >> 1;
        getready.y = tap.y - getready.height >> 0;

        this.addChild(tap, getready);
    }
});
```

在游戏主文件game.js中，实例化ReadyScene并添加到舞台stage上。

```
this.readyScene = new game.ReadyScene({
    width: this.width,
    height: this.height,
    image: this.asset.ready
}).addTo(this.stage);
```

## 结束场景

结束场景跟准备场景相似。

```
var OverScene = ns.OverScene = Hilo.Class.create({
    Extends: Hilo.Container,
    constructor: function(properties){
        OverScene.superclass.constructor.call(this, properties);
        this.init(properties);
    },

    init: function(properties){
        //Game Over图片文字
        var gameover = this.gameover = new Hilo.Bitmap({
            id: 'gameover',
            image: properties.image,
            rect: [0, 298, 508, 158]
        });

        //结束面板
        var board = this.board = new Hilo.Bitmap({
            id: 'board',
            image: properties.image,
            rect: [0, 0, 590, 298]
        });

        //开始按钮
        var startBtn = this.startBtn = new Hilo.Bitmap({
            id: 'start',
            image: properties.image,
            rect: [590, 0, 290, 176]
        });

        //等级按钮
        var gradeBtn = this.gradeBtn = new Hilo.Bitmap({
            id: 'grade',
            image: properties.image,
            rect: [590, 176, 290, 176]
        });

        //玩家当前分数
        var scoreLabel = this.scoreLabel = new Hilo.BitmapText({
            id: 'score',
            glyphs: properties.numberGlyphs,
            scaleX: 0.5,
            scaleY: 0.5,
            letterSpacing: 4,
            text: 0
        });

        //玩家最好成绩
        var bestLabel = this.bestLabel = new Hilo.BitmapText({
            id: 'best',
            glyphs: properties.numberGlyphs,
            scaleX: 0.5,
            scaleY: 0.5,
            letterSpacing: 4,
            text: 0
        });

        //白色的遮罩效果
        var whiteMask = this.whiteMask = new Hilo.View({
            id: 'mask',
            width: this.width,
            height: this.height,
            alpha: 0
        }).setBgFill('#fff');

        //设置各个元素的坐标位置
        board.x = this.width - board.width >> 1;
        board.y = this.height - board.height >> 1;
        gameover.x = this.width - gameover.width >> 1;
        gameover.y = board.y - gameover.height - 20;
        startBtn.x = board.x - 5;
        startBtn.y = board.y + board.height + 20 >> 0;
        gradeBtn.x = startBtn.x + startBtn.width + 20 >> 0;
        gradeBtn.y = startBtn.y;
        scoreLabel.x = board.x + board.width - 140 >> 0;
        scoreLabel.y = board.y + 90;
        bestLabel.x = scoreLabel.x;
        bestLabel.y = scoreLabel.y + 105;

        this.addChild(gameover, board, startBtn, gradeBtn, scoreLabel, bestLabel, whiteMask);
    }
});
```

结束场景显示的时候，不仅需要显示玩家的得分，出现的时候还是带动画效果显示出来的。这里，我们可以使用之前介绍过的Tween缓动变化类来实现这个过场动画。

```
show: function(score, bestScore){
    this.scoreLabel.setText(score);
    this.bestLabel.setText(bestScore);
    this.whiteMask.alpha = 1.0;

    Hilo.Tween.from(this.gameover, {alpha:0}, {duration:100});
    Hilo.Tween.from(this.board, {alpha:0, y:this.board.y+150}, {duration:200, delay:200});
    Hilo.Tween.from(this.scoreLabel, {alpha:0, y:this.scoreLabel.y+150}, {duration:200, delay:200});
    Hilo.Tween.from(this.bestLabel, {alpha:0, y:this.bestLabel.y+150}, {duration:200, delay:200});
    Hilo.Tween.from(this.startBtn, {alpha:0}, {duration:100, delay:600});
    Hilo.Tween.from(this.gradeBtn, {alpha:0}, {duration:100, delay:600});
    Hilo.Tween.to(this.whiteMask, {alpha:0}, {duration:400});
}
```

在游戏主文件game.js中，实例化OverScene并添加到舞台stage上，但结束场景只有游戏结束才显示，因此我们设置其visible默认为false。

```
this.gameOverScene = new game.OverScene({
    width: this.width,
    height: this.height,
    image: this.asset.over,
    numberGlyphs: this.asset.numberGlyphs,
    visible: false
}).addTo(this.stage);
```

当点击开始游戏按钮后，游戏会重新回到准备场景。因此，我们需要为它绑定事件监听。而我们不准备显示玩家的等级排行，所以等级按钮无需绑定事件。

```
this.gameOverScene.getChildById('start').on(Hilo.event.POINTER_START, function(e){
    //阻止舞台stage响应后续事件
    e.stopImmediatePropagation();
    this.gameOverScene.visible = false;
}.bind(this));
```

## 创建小鸟

小鸟是游戏的主角，跟其他的对象不同的是，小鸟会扇动翅膀飞行。因此我们用精灵动画类Sprite来创建小鸟。这里我们实现一个Bird类，继承自Sprite。

```
var Bird = ns.Bird = Hilo.Class.create({
    Extends: Hilo.Sprite,
    constructor: function(properties){
        Bird.superclass.constructor.call(this, properties);

        //添加小鸟精灵动画帧
        this.addFrame(properties.atlas.getSprite('bird'));
        //设置小鸟扇动翅膀的频率
        this.interval = 6;
        //设置小鸟的中心点位置
        this.pivotX = 43;
        this.pivotY = 30;
    }
});
```

小鸟的精灵动画帧可由参数传入的精灵纹理集atlas获得。由于小鸟飞行时，身体会向上仰起，也就是会以身体中心点旋转。因此，我们需要设置小鸟的中心点位置pivotX和pivotY，而小鸟的宽度和高度分别为86和60，故pivotX和pivotY即为43和30。

我们发现，在游戏中小鸟一共有以下三个状态：

* 准备状态 - 此时小鸟没有飞行，只是轻微的上下漂浮着。
* 开始飞行 - 每次玩家点击画面时，小鸟就会往上飞一段距离然后下坠。
* 飞行过程 - 在整个飞行过程中，我们需要控制小鸟的姿态和y轴坐标（x轴是不变的）。

我们先定义准备状态的getReady方法：

```
getReady: function(){
    //恢复小鸟飞行角度为平行向前
    this.rotation = 0;
    //减慢小鸟精灵动画速率
    this.interval = 6;
    //恢复小鸟精灵动画
    this.play();

    //小鸟上下漂浮的动画
    this.tween = Hilo.Tween.to(this, {y:this.y + 10, rotation:-8}, {duration:400, reverse:true, loop:true});
}
```

当玩家点击屏幕后，小鸟开始往上飞行，我们定义startFly方法：

```
startFly: function(){
    //恢复小鸟状态
    this.isDead = false;
    //减小小鸟精灵动画间隔，加速小鸟扇动翅膀的频率
    this.interval = 3;
    //记录往上飞的起始y轴坐标
    this.flyStartY = this.y;
    //记录飞行开始的时间
    this.flyStartTime = +new Date();
    //停止之前的缓动动画
    if(this.tween) this.tween.stop();
}
```

在这里，我们只需要设置小鸟飞行的初始状态，而具体的飞行状态控制则由doFly方法来实现。

小鸟开始飞行后，我们需要一个方法来精确控制小鸟每时每刻的飞行的路径坐标，直至其落地死亡。这也是此游戏中最关键的地方之一。

我们要在每次游戏画面更新渲染小鸟的时候调用此方法来确定当前时刻小鸟的坐标位置。Hilo的可视对象View提供了一个onUpdate方法属性，此方法会在可视对象每次渲染之前调用，于是，我们需要实现小鸟的onUpdate方法。

每次点击屏幕小鸟会往上飞，这是高中物理中典型的竖直上抛运动。我们发现，小鸟每次都是往上飞行一个固定的高度flyHeight后再下坠的。 根据我们以前所学的物理公式：初速度2 = 2 * 距离 * 加速度，我们可以计算出小鸟往上飞的初速度：

    this.flyHeight = 80;
    this.initVelocity = Math.sqrt(2 * this.flyHeight * this.gravity);

在这个公式里，flyHeight已确定，现在要确定加速度gravity。为简化计算，我们取重力加速g为10m/s2。而在我们游戏里的时间单位是毫秒，我们需要把加速度转换为毫秒，即10/1000，但实际游戏中并不需要那么大的加速度，比如取一半。因此我们的加速度设定为：

    this.gravity = 10 / 1000 * 0.3;

有了初速度，我们就可以根据物理公式：位移 = 初速度 * 时间 - 0.5 * 加速度 * 时间2，计算出任一时刻time小鸟移动的距离：

    var distance = this.initVelocity * time - 0.5 * this.gravity * time * time;

进而，我们就可以计算出小鸟在任一时刻所在的y轴位置：

    var y = this.flyStartY - distance;

这样，飞行过程的方法onUpdate就容易实现了：

```
onUpdate: function(){
    if(this.isDead) return;

    //飞行时间
    var time = (+new Date()) - this.flyStartTime;
    //飞行距离
    var distance = this.initVelocity * time - 0.5 * this.gravity * time * time;
    //y轴坐标
    var y = this.flyStart - distance;

    if(y <= this.groundY){
        //小鸟未落地
        this.y = y;
        if(distance > 0 && !this.isUp){
            //往上飞时，角度上仰20度
            this.tween = Hilo.Tween.to(this, {rotation:-20}, {duration:200});
            this.isUp = true;
        }else if(distance < 0 && this.isUp){
            //往下跌落时，角度往下90度
            this.tween = Hilo.Tween.to(this, {rotation:90}, {duration:this.groundY - this.y});
            this.isUp = false;
        }
    }else{
        //小鸟已经落地，即死亡
        this.y = this.groundY;
        this.isDead = true;
    }
}
```

其中，当小鸟往上飞的时候，有一个抬头往上仰的动作；而往下跌落的时候，则是会头部往下栽。我们使用2个缓动变换tween来分别实现。


## 创建障碍

障碍是游戏中另一个非常重要的角色。整个障碍是由许多成对的上下管子组成。因此我们用容器类来创建障碍类，它可以装下许多管子。这里我们实现一个Holdbacks类，继承自Container。

```
var Holdbacks = ns.Holdbacks = Hilo.Class.create({
    Extends: Hilo.Container,
    constructor: function(properties){
        Holdbacks.superclass.constructor.call(this, properties);
        this.init(properties);
    }
});
```

然后，我们准备构造这些障碍管子。一个事实是，这些管子是不间断的从右到左移动的，这些管子之间的水平距离是固定的，样式也是不变的。如果我们能重复利用这些管子，那么我们可以节省很多内存。这样，我们先初始化一些常量：

```
//管子之间的水平间隔
this.hoseSpacingX = 300;
//管子上下两部分之间的垂直间隔，即小鸟要穿越的空间大小
this.hoseSpacingY = 240;
//管子的总数（一根管子分上下两部分）
this.numHoses = 4;
//预设移出屏幕左侧的管子数量，一般设置为管子总数的一半
this.numOffscreenHoses = this.numHoses * 0.5;
//管子的宽度（包括管子之间的间隔）
this.hoseWidth = 148 + this.hoseSpacingX;

//初始化障碍的宽和高
this.width = this.hoseWidth * this.numHoses;
this.height = properties.height;
```

下面，我们创建所有的管子，包括用来缓存的。其中每根管子包括上下两部分，而每根管子都是静态图片，因此我们使用Bitmap类来创建管子。

```
createHoses: function(image){
    for(var i = 0; i < this.numHoses; i++){
        //下部分管子
        var downHose = new Hilo.Bitmap({
            image: image,
            rect: [0, 0, 148, 820]
        }).addTo(this);

        //上部分管子
        var upHose = new Hilo.Bitmap({
            image: image,
            rect: [148, 0, 148, 820]
        }).addTo(this);

        this.placeHose(downHose, upHose, i);
    }
}
```

创建好管子后，我们需要放置在适当的位置上，从而产生随机可穿越的管子障碍。我们先来看管子的下半部分，如果我们能确定它在y轴上的最大值和最小值，那么就可以在此之间选择一个随机值。当下半部分管子的位置确定后，由于管子上下两部分的间隔hoseSpacingY是固定的。这样就很容易确定上部分管子的位置了。

由于下半部分管子的顶端不能没入地面之下，且不能离地面太近，因此很容易计算出其y轴的最大值为：

    var downMaxY = this.groundY - 180;

同样下半部分管子的底端也不能脱离地面，且要预留间隔hoseSpacingY的高度，因此其y轴的最小值为：

    var downMinY = this.groundY - down.height + this.hoseSpacingY;

在最大值和最小值之间随机选择一个位置：

    downHose.y = downMinY + (downMaxY - downMinY) * Math.random() >> 0;

下半部分管子位置确定后，上半部分就好办了。完整的placeHose方法：

```
placeHose: function(down, up, index){
    //y轴最大值
    var downMaxY = this.groundY - 180;
    //y轴最小值
    var downMinY = this.groundY - down.height + this.hoseSpacingY;
    //随机位置
    down.y = downMinY + (downMaxY - downMinY) * Math.random() >> 0;
    down.x = this.hoseWidth * index;

    //上部分管子位置
    up.y = down.y - this.hoseSpacingY - up.height;
    up.x = down.x;
}
```

障碍创建完成后，它最核心的状态就是从右至左不断的移动，管子也不断的产生。我们先初始化一个移动的缓动moveTween，当缓动结束后，就会调用resetHoses方法来重新排序所有的管子，从而达到重复利用管子的目的。

```
this.moveTween = new Hilo.Tween(this, null, {
    onComplete: this.resetHoses.bind(this)
});
```

resetHoses方法要实现的就是，每当有numOffscreenHoses数量的管子移出屏幕左侧的时候，我们就把这些管子移动到管子队列的最右边，这样我们就可以利用移出的管子，不用重复创建新的管子。

```
resetHoses: function(){
    var total = this.numChildren;

    //把已移出屏幕外的管子放到队列最后面，并重置它们的可穿越位置
    for(var i = 0; i < this.numOffscreenHoses; i++){
        var downHose = this.getChildAt(0);
        var upHose = this.getChildAt(1);
        this.setChildIndex(downHose, total - 1);
        this.setChildIndex(upHose, total - 1);
        this.placeHose(downHose, upHose, this.numOffscreenHoses + i);
    }

    //重新确定队列中所有管子的x轴坐标
    for(var i = 0; i < total - this.numOffscreenHoses * 2; i++){
        var hose = this.getChildAt(i);
        hose.x = this.hoseWidth * (i * 0.5 >> 0);
    }

    //重新确定障碍的x轴坐标
    this.x = 0;

    //更新穿过的管子数量
    this.passThrough += this.numOffscreenHoses;

    //继续移动
    this.startMove();
}
```

这样，移动障碍也就是重复不断的向左移出numOffscreenHoses数量的管子。

```
startMove: function(){
    //设置缓动的x轴坐标
    var targetX = -this.hoseWidth * this.numOffscreenHoses;
    //设置缓动时间
    this.moveTween.time = (this.x - targetX) * 4;
    //设置缓动的变换属性，即x从当前坐标变换到targetX
    this.moveTween.setProps({x:this.x}, {x:targetX});
    //启动缓动变换
    this.moveTween.start();
}
```

停止移动障碍就只需停止缓动即可。

```
stopMove: function(){
    if(this.moveTween) this.moveTween.pause();
}
```

## 碰撞检测和得分

当小鸟飞行穿越障碍的时候，我们需要检测小鸟与障碍是否发生了碰撞。这个可以利用Hilo内置的View.hitTestObject方法来检测。我们在障碍Holdbacks类中定义checkCollision方法，它可以循环检测小鸟是否与某一管子发生碰撞。

```
checkCollision: function(bird){
    for(var i = 0, len = this.children.length; i < len; i++){
        if(bird.hitTestObject(this.children[i], true)){
            return true;
        }
    }
    return false;
}
```

得分，也就是计算出小鸟飞越的管子的数量。我们定义calcPassThrough方法，它传入一个参数x（小鸟的坐标），根据障碍的宽度和已穿越的管子的数量，我们就可以统计出总的数量。

```
calcPassThrough: function(x){
    var count = 0;

    x = -this.x + x;
    if(x > 0){
        var num = x / this.hoseWidth + 0.5 >> 0;
        count += num;
    }
    count += this.passThrough;

    return count;
}
```

然后，在game.js中计算得分：

```
calcScore: function(){
    var count = this.holdbacks.calcPassThrough(this.bird.x);
    return this.score = count;
}
```

## 监控游戏过程

在游戏过程中，我们要时刻检测小鸟是否与障碍发生碰撞或飞越成功，是否已经落地，并判断游戏是否结束等。跟小鸟飞行过程类似，我们可以定义舞台的onUpdate方法来实现：

```
onUpdate: function(){
    if(this.state === 'ready') return;

    if(this.bird.isDead){
        //如果小鸟死亡，则游戏结束
        this.gameOver();
    }else{
        //更新玩家得分
        this.currentScore.setText(this.calcScore());
        //碰撞检测
        if(this.holdbacks.checkCollision(this.bird)){
            this.gameOver();
        }
    }
}
```

## 场景切换

准备、游戏和结束三个场景的切换方法：

```
gameReady: function(){
    this.state = 'ready';
    //重置分数为0
    this.score = 0;
    this.currentScore.visible = true;
    this.currentScore.setText(this.score);
    //显示准备场景
    this.gameReadyScene.visible = true;
    //重置障碍的位置
    this.holdbacks.reset();
    //准备小鸟
    this.bird.getReady();
},

gameStart: function(){
    this.state = 'playing';
    //隐藏准备场景
    this.gameReadyScene.visible = false;
    //开始从右至左移动障碍
    this.holdbacks.startMove();
},

gameOver: function(){
    if(this.state !== 'over'){
        //设置当前状态为结束over
        this.state = 'over';
        //停止障碍的移动
        this.holdbacks.stopMove();
        //小鸟跳转到第一帧并暂停，即停止扇动翅膀
        this.bird.goto(0, true);
        //隐藏屏幕中间显示的分数
        this.currentScore.visible = false;
        //显示结束场景
        this.gameOverScene.show(this.calcScore(), this.saveBestScore());
    }
}
```

## 玩家交互

在此游戏中，玩家只有一种交互方式，在PC端是点击鼠标，在移动端则是触碰屏幕。因此，首先我们需要让舞台stage能接受mousedown或touchstart事件：

    this.stage.enableDOMEvent(Hilo.event.POINTER_START, true);

Hilo统一了事件的开始、移动和结束三个事件的映射名称，方便自动适配不同平台：

* `Hilo.event.POINTER_START` - mousedown/touchstart
* `Hilo.event.POINTER_MOVE` - mousemove/touchmove
* `Hilo.event.POINTER_END` - mouseup/touchend

然后，监听舞台的POINTER_START事件：

    this.stage.on(Hilo.event.POINTER_START, this.onUserInput.bind(this));

为了让PC玩家可以使用键盘空格键操作，我们增加如下兼容代码：

    document.addEventListener('keydown', function(e){
        if(e.keyCode === 32) this.onUserInput(e);
    }.bind(this));

事件监听器onUserInput的实现也简单，当游戏不在结束状态时，启动游戏，并控制小鸟往上飞。

```
onUserInput: function(e){
    if(this.state !== 'over'){
        //启动游戏场景
        if(this.state !== 'playing') this.gameStart();
        //控制小鸟往上飞
        this.bird.startFly();
    }
}
```

## 小结

至此，整个Flappy Bird游戏所有的功能就基本开发完成了。我们用到了Hilo的大部分功能：

* 加载队列 - 用LoadQueue预加载图片等资源。
* 可视对象 - 用View、Bitmap、Sprite、Container等创建和管理各种游戏对象。
* 舞台 - 所有游戏对象都需要加入到舞台才能显示出来。
* 缓动动画 - 用Tween来创建各种缓动动画。
* 碰撞检测 - 用View.hitTestObject检测可视对象的是否发生碰撞。
* 更新对象 - 用View.onUpdate更新对象各种属性和状态。
* 事件交互 - 用View.on监听事件。
