define(['a1'],function(a1){

	var p = document.createElement('p');
	p.innerHTML = 'home.js -> ';
	document.body.appendChild(p);

	var a = document.createElement('a');
	a.href = 'javascript:;';
	a.onclick = a1;
	a.innerHTML = ' 我是a1.js导出的方法 ';
	a.style.margin = '0 5px';

	p.appendChild(a);

	console.log(a1);

	return function(){
		alert('我是home.js导出的方法');
	};
});