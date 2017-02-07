define([],function(){
	var p = document.createElement('p');
	p.innerHTML = 'b3.js';
	document.body.appendChild(p);

	return function(){
		alert('我是b3.js导出的方法');
	};
});