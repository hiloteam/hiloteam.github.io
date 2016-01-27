# 模块化支持
---

Hilo是模块化的架构，且每个模块尽量保持无依赖或最小依赖。在Hilo的源码中，你看不到一般的模块定义的范式：

```
define(function(require, exports, module){
        var a = require('a'),
            b = require('b');

        //something code here
        return someModule;
    }
);
```

取而代之的是，Hilo的每个模块都会有这样的注释定义：

```
/**
 * @module hilo/view/Sprite
 * @requires hilo/core/Hilo
 * @requires hilo/core/Class
 * @requires hilo/view/View
 * @requires hilo/view/Drawable
 */
```
我们使用注释标签`@module`来标记模块名称，用`@requires`标记模块的依赖。

在编译阶段，我们会根据这些标记获取模块的相关信息，然后编译生成符合不同的模块范式定义的代码。比如：

```
define(function(require, exports, module){
    var Hilo = require('hilo/core/Hilo');
    var Class = require('hilo/core/Class');
    var View = require('hilo/view/View');
    var Drawable = require('hilo/view/Drawable');

    //some code here
    return Sprite;
};
```

我们除开提供一个独立无依赖的版本外，还提供AMD、CommonJS、CMD、CommonJS等多种模块范式的版本。开发者可以根据自己的习惯，下载Hilo的不同范式版本使用。

    hilo/
    └── build/
        ├── standalone/
        ├── amd/
        ├── commonjs/
        ├── kissy/
        └── cmd/
