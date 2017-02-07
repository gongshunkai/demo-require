define([],function(){

	var p = document.createElement('p');
	p.innerHTML = 'a2.js';
	document.body.appendChild(p);

	return function(){
		alert('我是a2.js导出的方法');
	};
});