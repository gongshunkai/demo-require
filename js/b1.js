define(['js/b2','js/b3'],function(b2,b3){

	var p = document.createElement('p');
	p.innerHTML = 'b1.js -> ';
	document.body.appendChild(p);

	for(var i=0; i<2; i++){
		var a = document.createElement('a');
		a.href = 'javascript:;';
		a.onclick = arguments[i];
		a.innerHTML = ' 我是b' + (i+2) + '.js导出的方法 ';
		a.style.margin = '0 5px';

		p.appendChild(a);
	}

	console.log(b2,b3);

	return function(){
		alert('我是b1.js导出的方法');
	};
});