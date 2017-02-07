define([],function(){

	var p = document.createElement('p');
	p.innerHTML = 'a4.js';
	document.body.appendChild(p);

	return function(){
		alert('我是a4.js导出的方法');
	};
});