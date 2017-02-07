# demo-require
自己动手实现一个简化版的requireJs


一直想实现一个简单版本的requireJs，最直接的办法去看requireJs源码搞明白原理，但是能力有限requireJs的源码比想象的要复杂许多，看了几遍也不是很明白，最后通过搜索找到了一些有价值的资料，理顺了自己的思路，才有了这个教程。

我们都知道define是定义一个模块，require是加载一个模块（其本身也是定义一个模块，严格来说是顶层模块对象），所以require方法就是程序的入口。

我们先看requireJs的使用：

 

require.config({
        paths: {
            a: 'js/a',
            b: 'js/b',
            home: 'js/home'
        },
        shim: {
            'home': {
                deps: ['a']
            },
            'a': {
                deps: ['b']
            }
        }
});


//index.js
require(['home'], function (home) {

});

//home.js
define(['a'],function(a){

});

//a.js
define(['b'],function(b){

});

//b.js
define([],function(){

});

 

查看html元素，会在head中看到：
<script src="js/b.js"></script>
<script src="js/a.js"></script>
<script src="js/home.js"></script>
很明显程序的执行顺序是b - > a -> home

如果我们把require.config中的shim删除，那么程序就不知道js的依赖关系，于是我们查看head：
<script src="js/home.js"></script>
<script src="js/a.js"></script>
<script src="js/b.js"></script>

我们发现标签的顺序不对了，由于没有了shim，程序无法预处理js的依赖关系，只能通过执行js后在define的第一个参数中获得。

奇怪的是程序运行后并没有发生错误，奥秘就在于每个js文件都做了amd规范，我们把逻辑都放在了define的回调函数中，当加载了js文件后并不会马上执行我们的逻辑代码。

define做了一件重要的事情，生成模块。当确定模块都加载完毕了，利用一个递归函数按顺序执行define中的回调函数。最后执行顶层模块对象的回调函数，即require方法的第二个参数。

模块之间的通信是利用args这个参数，它保存了它的子级模块回调函数的返回值，callback顾名思义保存了当前模块的回调函数。

模块对象如下：

{moduleName:"_@$1",deps:["a","b"],callback:null,args:null}

 

现在我们明白了，其实head中插入的script标签先后顺序无关紧要了。

原理就是这么的简单，理清了思路后我们就开始实现它吧。

首先定义全局变量context
由于require方法可以多次调用，意味着顶层模块对象也是多个，所以topModule是一个数组。
modules模块对象上面已经解释过了。
waiting保存了等待加载完成的模块。它很重要，我们通过判断：if(!context.waiting.length){  //执行递归函数按顺序执行define中的回调函数  }  

var context = {
        topModule:[], //存储requre函数调用生成的顶层模块对象名。　　
        modules:{}, //存储所有的模块。使用模块名作为key，模块对象作为value　　
        waiting:[], //等待加载完成的模块
        loaded:[] //加载好的模块   (加载好是指模块所在的文件加载成功)
};

接着我们看require方法：

var require = root.require = function(dep,callback) {

        if (typeof dep == 'function'){

            callback = dep;
            dep = [];

        }else if (typeof callback != 'function'){

            callback = function(){};
            dep = dep || [];

        }
    
        var name = '_@$' + (requireCounter++);
        context.topModule.push(name);

        //剔除数组重复项
        dep = unique(dep);

        //context.modules._@$1 = {moduleName:"_@$1",deps:["a","b"],callback:null,callbackReturn:null,args:null}
        createModule({
            moduleName:name,
            deps:deps2format(dep),
            callback:callback
        });

        each(dep,function(name){
            req(name);
        });

        //如果dep是空数组直接执行callback
        completeLoad();

    };

requier方法做了5件事情：
1、参数容错处理
2、生成顶层模块名并添加到topModule数组中
3、剔除数组（依赖）重复项
4、创建顶层模块
5、遍历数组（依赖）

遍历数组中调用了req方法，我们来看一下：

function req(name,callback){

        var deps = config.shim[name];

        deps = deps ? deps.deps : [];

        function notifymess(){

            //检查依赖是否全部加载完成
            if(iscomplete(deps)){
                var element = createScript(name);
                element && (element.onload = element.onreadystatechange = function () {         
                    onscriptLoaded.call(this,callback);
                });
            }
        };

        //如果存在依赖则把创建script标签的任务交给依赖去完成
        if(deps.length > 0){
            each(deps,function(name){
                req(name, notifymess);
            });
        }else{
            notifymess();  
        }
   
    };

req方法是一个递归函数，首先判断是否存在依赖，如果存在则遍历依赖，在循环中调用req，传递2个参数，模块名与notifymess方法，由于存在依赖，所以不创建script标签，也就是说不执行notifymess方法，而是把它当成回调函数传递给req，等待下次执行req再执行。否则执行notifymess方法，即创建script标签添加到head中。
大致的思路就是父模块创建script方法交给子模块去完成，当子模块创建了script标签，然后在onload事件中创建父script标签
只有这样才能按照依赖关系在head中按先后顺序插入script标签。
也许有人觉得这样做太过麻烦，不是说插入script标签顺序不重要了吗，他是由define回调统一处理。但是你别忘了，如果加载的js文件不是amd规范的是没有包裹define方法的。req函数之所以这样做正是出于这种情况的考虑。

现在我们根据配置参数完成了首次插入script标签的任务。第二次插入标签的任务将在define中完成。（其实插入标签是交替进行的，这里说的首次和再次是思路上的划分）

接着我们就看一下define方法：

var define = root.define = function(name,dep,callback){

        if(typeof name === 'object'){

            callback = dep;
            dep = name;
            name = 'temp';

        }else if (typeof dep == 'function') {

            callback = dep;
            dep = [];

        }else if (typeof callback != 'function') {

            callback = function () {};
            dep = dep || [];

        }
        
        //剔除数组重复项
        dep = unique(dep);

        //创建一个临时模块，在onload完成后修改它
        createModule({
            moduleName:name,
            deps:deps2format(dep),
            callback:callback
        });

        //遍历依赖，如果配置文件中不存在则创建script标签
        each(dep,function(name){
            var element = createScript(name);
            element && (element.onload = element.onreadystatechange = onscriptLoaded);
        });

    };

define方法做了4件事情：

1、参数容错处理
2、剔除数组（依赖）重复项
3、创建一个临时模块，在onload完成后修改它
4、遍历数组（依赖），如果配置文件中不存在则创建script标签

模块就是在define方法执行后创建的，这也不难理解只有define需要模块化方便之后的回调函数统一处理，如果程序一上来就创建模块势必造成资源浪费（没有amd规范的js文件当然不需要模块化管理啦）
由于无法得知模块名，我们只能创建一个临时模块，模块名暂时叫temp，然后在该js文件的onload事件中通过this.getAttribute('data-requiremodule') 获得模块名再改回来。
这里的思路是script标签添加到head中，首先执行的是该js文件（define方法），然后再执行onload事件，我们正是利用这个时间差修改了模块名。

接着看一下script标签onload事件做了哪些事情：

function onscriptLoaded(callback){

        if (!this.readyState || /loaded|complete/.test(this.readyState)) {
            this.onload = this.onreadystatechange = null;

            var name = this.getAttribute('data-requiremodule');

            context.waiting.splice(context.waiting.indexOf(name),1);
            context.loaded.push(name);

            typeof callback === 'function' && callback();

            
            if(context.modules.hasOwnProperty('temp')){

                var tempModule = context.modules['temp'];

                //修改临时模块名
                tempModule.moduleName = name;

                //生成新模块
                createModule(tempModule);

                //删除临时模块
                delete context.modules['temp'];
            }
           
            //script标签全部加载完成，准备依次执行define的回调函数
            completeLoad();
        }

    };

它做了4件事情：

1、获得模块名
2、waiting数组中删除一个当前的模块名，loaded数组中添加一个当前的模块名
3、如果有临时模块修改它
4、如果script标签全部加载完成，准备依次执行define的回调函数

获得模块名的思路是在创建script时给一个自定义属性：element.setAttribute('data-requiremodule', name);  在onload中获取 this.getAttribute('data-requiremodule');

function createScript(name){

        var element,
            scripts = document.head || document.getElementsByTagName('head')[0] || document.documentElement;

        name = name2format(name);

        if(!iscontain(name)) return false;

        context.waiting.push(name);
        element = document.createElement('script');
        element.setAttribute('type', 'text/javascript');
        element.setAttribute('async', true);
        element.setAttribute('charset', 'utf-8');
        element.setAttribute('src', (config.paths[name] || name) + '.js');
        element.setAttribute('data-requiremodule', name);
        scripts.appendChild(element, scripts.firstChild);
        return element;
    };

最后依次执行回调：

function exec(module) {　　    
    var deps = module.deps;　　//当前模块的依赖数组    
    var args = module.args;　　//当前模块的回调函数参数    
    for (var i = 0, len = deps.length; i < len; i++) { //遍历 　　　
        var dep = context.modules[deps[i]];
        args[i] = exec(dep); //递归得到依赖模块返回值作为对应参数    
    }    
    return module.callback.apply(module, args); // 调用回调函数，传递给依赖模块对应的参数。
}

function completeLoad(){
    if(!context.waiting.length){
        while(context.topModule.length){
            var name = context.topModule.shift(),
                topModule = context.modules[name]; //找到顶层模块。
            exec(topModule);
        }
    }
};