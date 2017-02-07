/*!
 * require.js 1.0
 *
 * Author: 龚顺凯 49078111@qq.com
 * Update: 2017-1-27
 *
 */
(function(root){

    var context = {
        topModule:[], //存储requre函数调用生成的顶层模块对象名。　　
        modules:{}, //存储所有的模块。使用模块名作为key，模块对象作为value　　
        waiting:[], //等待加载完成的模块
        loaded:[] //加载好的模块   (加载好是指模块所在的文件加载成功)
    };

    var config = {
        paths:{},
        shim:{}
    };
    
    var jsSuffixRegExp = /\.js$/,
        requireCounter = 1;

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

    function createModule(options){

        var name = options.moduleName,
            module = context.modules[name] = {};

        module.moduleName = name;
        module.deps = [];
        module.callback = function(){};
        module.args = [];

        extend(module,options);
    };

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

    function name2format(name){
        return name.replace(jsSuffixRegExp, '');
    };

    function deps2format(deps){
        var newDeps = [];
        each(deps,function(name){
            newDeps.push(name2format(name));
        });
        return newDeps;
    };

    function iscomplete(deps){

        var complete = true,
            len = deps.length;
            
        for (var i = 0; i < len; i++) {
            if (context.loaded.indexOf(name2format(deps[i])) == -1) {
                complete = false;
                break;
            }
        }
        return complete;

    };

    function iscontain(name){
        return context.waiting.indexOf(name) == -1 && context.loaded.indexOf(name) == -1;
    };

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

    require.config = function(options){
        config = extend(config,options);
    };




/************* 工具方法 *******************/

    function unique(arr){
        // 遍历arr，把元素分别放入tmp数组(不存在才放)
        var tmp = new Array();
        for(var i in arr){
            //该元素在tmp内部不存在才允许追加
            if(tmp.indexOf(arr[i])==-1){
                tmp.push(arr[i]);
            }
        }
        return tmp;
    };

    function extend(destination, source) {
        for (var property in source) {
            destination[property] = source[property];
        }
        return destination;
    };

    function each(obj,callback){
        var value,
            i = 0,
            length = obj.length;

        for(;i<length;i++){
            value = callback.call(obj[i],obj[i],i);
            if(value === false){
                break;
            }
        }    
    };

})(this);