define(['a2','a3','a4'],function(a2,a3,a4){

	var p = document.createElement('p');
	p.innerHTML = 'a1.js -> ';
	document.body.appendChild(p);

	for(var i=0; i<3; i++){
		var a = document.createElement('a');
		a.href = 'javascript:;';
		a.onclick = arguments[i];
		a.innerHTML = ' 我是a' + (i+2) + '.js导出的方法 ';
		a.style.margin = '0 5px';

		p.appendChild(a);
	}

	console.log(a2,a3,a4);

	return function(){
		alert('我是a1.js导出的方法');
	};
});