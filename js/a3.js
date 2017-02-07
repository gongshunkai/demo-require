define([],function(){

	var p = document.createElement('p');
	p.innerHTML = 'a3.js';
	document.body.appendChild(p);

	return function(){
		alert('我是a3.js导出的方法');
	};
});