define(['js/b1'],function(b1){

	var p = document.createElement('p');
	p.innerHTML = 'home2.js -> ';
	document.body.appendChild(p);

	var a = document.createElement('a');
	a.href = 'javascript:;';
	a.onclick = b1;
	a.innerHTML = ' 我是b1.js导出的方法 ';
	a.style.margin = '0 5px';

	p.appendChild(a);

	console.log(b1);

	return function(){
		alert('我是home2.js导出的方法');
	};
});