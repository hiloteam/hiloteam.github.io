# 预加载资源

---

在游戏开发中，会涉及到各种资源的预加载，比如图片素材、声音音效、各种数据等等。Hilo提供了一个简单的资源加载队列工具`LoadQueue`。

## 创建加载队列

    var queue = new Hilo.LoadQueue();
    queue.maxConnections = 2; //设置同时下载的最大连接数，默认为2

## 增加下载资源

使用 LoadQueue.add(item) 方法可以增加资源对象到下载队列。比如：

    queue.add({id:'bg', src:'images/bg.png'});

其中，每个资源对象item包含以下属性：

* `id` - 资源的唯一标识符。可用于从下载队列获取目标资源。
* `src` - 资源的地址url。
* `type` - 指定资源的类型。默认会根据资源文件的后缀来自动判断类型，不同的资源类型会使用不同的加载器来加载资源。
* `loader` - 指定资源的加载器。默认会根据资源类型来自动选择加载器，若指定loader，则会使用指定的loader来加载资源。
* `noCache` - 指示加载资源时是否增加时间标签以防止缓存。
* `size` - 资源对象的预计大小。可用于预估下载进度。

此外，LoadQueue.add 方法还支持多个item的数组参数。比如：

```
queue.add([
    {id:'bg', size:100, noCache:true, src:'images/bg.png'},
    {id:'logo', size:100, noCache:true, src:'images/logo.png'},
    {id:'data', size:300, noCache:true, type:'jsonp', src:'http://Hilo.com/jsonp.js'}
]);
```

## 监听下载进度

LoadQueue 有3种事件可供监听。

* `load` - 当某一资源下载完成时派发。
* `error` - 当某一资源下载出错时派发。
* `complete` - 当资源队列完成时派发。注意：有可能某一资源下载失败。

```
queue.on('load', function(e){
    //console.log('load:', e.detail);
});
queue.on('error', function(e){
    //console.log('error:', e.detail);
});
queue.on('complete', function(e){
    //console.log('complete:', queue.getLoaded());
});
```

## 获取下载信息

LoadQueue 提供了一些方法，获取下载队列的情况：

* `get(id)` - 根据id或src地址获取资源对象item。
* `getContent(id)` - 根据id或src地址获取资源对象item的下载内容。
* `getLoaded` - 获取已下载的资源数。
* `getTotal` - 获取所有资源的总数。
* `getSize(loaded)` - 获取全部或已下载的资源的字节大小。

比如队列下载完成后获取某个资源的下载内容：

```
queue.on('complete', function(e){
    var bg = queue.getContent('bg');
    console.log(bg);
});
```

## 自定义下载器

当前 LoadQueue 仅提供了图片下载器 ImageLoader 和js/jsonp加载器 ScriptLoader。若要加载其他资源，可通过加载资源的loader属性来自定义下载器。其中loader要实现以下3个方法：

* `load(data)` - 下载资源的具体实现。
* `onLoad(e)` - 下载完成的回调方法。
* `onError(e)` - 下载出错的回调方法。

下面的示例演示了自定义加载css的加载器：

```
queue.add({id:'dummy_css', type:'css', src:'http://Hilo.com/dummy.css', loader:{
    load: function(data){
        var link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        if(data.id) link.id = data.id;
        link.addEventListener('load', this.onLoad.bind(this), false);
        link.addEventListener('error', this.onError.bind(this), false);
        link.href = data.src;
        document.getElementsByTagName('head')[0].appendChild(link);
    },
    onLoad: function(e){
        return e.target;
    },
    onError: function(e){
        return e;
    }
}});
```