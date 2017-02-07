define([],function(){
	var p = document.createElement('p');
	p.innerHTML = 'b2.js';
	document.body.appendChild(p);

	return function(){
		alert('我是b2.js导出的方法');
	};
});