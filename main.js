const DELTA_T = 0.0115; //seconds
const DIST_TO_PLATE = 60.5*0.3048;
const colors = ["rgba(255, 0, 0, 0.8)","rgba(255, 175, 0, 0.8)","rgba(0, 255, 0, 0.8)","rgba(0, 0, 255, 0.8)","rgba(255, 0, 255, 0.8)"]
const VIEWS = ['Mound View', 'Top View', 'Side View']
var current_view = 0;

//PHYSICS FUNCTIONS:

function cross(v1, v2){
	let x = v1[1]*v2[2] - v1[2]*v2[1];
	let y = v1[2]*v2[0] - v1[0]*v2[2];
	let z = v1[0]*v2[1] - v1[1]*v2[0];
	return [x,y,z];
}

function scalar(vector, scalar){
	let output = [];
	for (let i=0; i < vector.length; i++)
		output.push(vector[i]*scalar);
	return output;
}

function add(v1, v2){
	let output = [];
	for (let i=0; i < 3; i++){
		output.push(v1[i]+v2[i]);
	}
	return output;
}

function rpm2rads(rpm){
	return scalar(rpm, 2*Math.PI/60);
}

function miph2mps(mph){
	return scalar(mph, 5280*0.3048/(60*60));
}

function magnus_acc(w, v, S=4.1e-4){
	let cprod = cross(w, v);
	return scalar(cprod, S); // Fm = S(w x v) | S ~ 4.1*10^-4 / m
}

function move(x, w, v){
	let acc = magnus_acc(w, v);
	acc = add(acc, [0, -9.8, 0]); //gravity
	let new_v = add(v, scalar(acc, DELTA_T));
	let new_x = add(x, scalar(add(v, new_v), DELTA_T/2));
	return {'x':new_x, 'v':new_v};
}

//VISUAL FUNCTIONS

function draw_zone(balls, fillSyles) {
	let start_size = 4;
	let end_size = 3;
	let canvas = document.getElementById('canvas');
	let ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.beginPath();
	ctx.strokeStyle	= 'rgba(0,0,0, 1)';
	let rect_width = 17/12*0.3048*2000*end_size/76;
	let rect_height = 5/3*0.3048*2000*end_size/76;
	ctx.rect((canvas.width-rect_width)/2, (canvas.height-rect_height)/2, rect_width, rect_height);
	ctx.stroke();
	ctx.closePath();
	return ctx;
}

function draw_ball(ball, fillStyle, ctx) {
	let start_size = 4;
	let end_size = 3;
	let radius = start_size-ball[2]*(start_size-end_size)/DIST_TO_PLATE;
	let mm = 2*radius/76;
	let m = mm*1000;
	let x = canvas.width/2+ball[0]*m;
	let y = canvas.height/2-ball[1]*m;
	ctx.beginPath();
	ctx.moveTo(x+radius, y);
	ctx.fillStyle = fillStyle;
	ctx.arc(x, y, radius, 0, Math.PI * 2, true);
	ctx.fill()
	ctx.stroke();
	ctx.closePath();
}

function get_balls(){
	default_pitcher();
	let balls = [];
	for (let i=1; i<=5; i++){
		let elements = document.getElementsByClassName(`p${i}`);
		if (elements[4].checked){
			let ball = {};
			ball.v = [0, 0, parseFloat(elements[0].value)];
			ball.v = add(miph2mps(ball.v), [0,2.24567,0]);
			ball.w = [-parseFloat(elements[1].value), -parseFloat(elements[2].value), -parseFloat(elements[3].value)];
			ball.w = rpm2rads(ball.w);
			ball.pos = [0,0,0];
			ball.color = colors[i-1];
			balls.push(ball);
		}
	}
	return balls;
}

function pitcher_view(){
	let balls = get_balls();
	let ctx = draw_zone();
	let timeout = setTimeout(delay, 500);
	let id = 0;
	for (let i=0; i<balls.length; i++){
		let ball = balls[i];
		draw_ball(ball.pos, ball.color, ctx)
	}
	function delay(){
		for (let i=0; i<balls.length; i++){
			let ball = balls[i];
			draw_ball(ball.pos, ball.color, ctx)
		}
		id = setInterval(loop, 10);
		clearTimeout(timeout);
	}
	function loop() {
		let finished = true;
		ctx = draw_zone();
		for (let i=0; i<balls.length; i++){
			let ball = balls[i];
			if (ball.pos[2] < DIST_TO_PLATE){
				finished = false;
				moved = move(ball.pos, ball.w, ball.v);
				ball.pos = moved.x;
				ball.v = moved.v;
			}
			draw_ball(ball.pos, ball.color, ctx)
		}
		if (finished){
			clearInterval(id);
		}
	}
}

function top_view(){
	let balls = get_balls();
	let canvas = document.getElementById('canvas');
	let ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.beginPath();
	let plate_width = 28*canvas.height/150;
	let side_pad = 60;
	ctx.moveTo(canvas.width-side_pad/2, canvas.height/2+plate_width/2);
	ctx.lineTo(canvas.width-side_pad/2, canvas.height/2-plate_width/2);
	ctx.lineTo(canvas.width-side_pad/2+plate_width/2, canvas.height/2-plate_width/2);
	ctx.lineTo(canvas.width-side_pad/2+plate_width, canvas.height/2);
	ctx.lineTo(canvas.width-side_pad/2+plate_width/2, canvas.height/2+plate_width/2);
	ctx.lineTo(canvas.width-side_pad/2, canvas.height/2+plate_width/2);;
	ctx.strokeStyle	= 'rgba(0,0,0, 1)';
	ctx.stroke();
	let radius = 1;
	id = setInterval(loop, 10);
	function loop() {
		let finished = true;
		for (let i=0; i<balls.length; i++){
			let ball = balls[i];
			if (ball.pos[2] < DIST_TO_PLATE){
				finished = false;
				moved = move(ball.pos, ball.w, ball.v);
				ball.pos = moved.x;
				ball.v = moved.v;
			}
			let x = ball.pos[2]/DIST_TO_PLATE*(canvas.width-side_pad)+side_pad/2;
			let y = canvas.height/2 + 60*canvas.height/150*ball.pos[0];
			ctx.beginPath();
			ctx.moveTo(x+radius, y);
			ctx.strokeStyle = ball.color;
			ctx.fillStyle = ball.color;
			ctx.arc(x, y, radius, 0, Math.PI * 2, true);
			ctx.fill()
			ctx.stroke();
			ctx.closePath();
		}
		if (finished){
			clearInterval(id);
		}
	}
}

function side_view(){
	let balls = get_balls();
	let canvas = document.getElementById('canvas');
	let ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.beginPath();
	ctx.moveTo(canvas.width-25, canvas.height/2+16*canvas.height/150);
	ctx.lineTo(canvas.width-25, canvas.height/2-16*canvas.height/150);//strike zone
	ctx.strokeStyle	= 'rgba(0,0,0, 1)';
	ctx.stroke();
	let radius = 1;
	id = setInterval(loop, 10);
	function loop() {
		let finished = true;
		for (let i=0; i<balls.length; i++){
			let ball = balls[i];
			if (ball.pos[2] < DIST_TO_PLATE){
				finished = false;
				moved = move(ball.pos, ball.w, ball.v);
				ball.pos = moved.x;
				ball.v = moved.v;
			}
			let x = ball.pos[2]/DIST_TO_PLATE*(canvas.width-50)+25;
			let y = canvas.height/2 - 60*canvas.height/150*ball.pos[1];
			ctx.beginPath();
			ctx.moveTo(x+radius, y);
			ctx.strokeStyle = ball.color;
			ctx.fillStyle = ball.color;
			ctx.arc(x, y, radius, 0, Math.PI * 2, true);
			ctx.fill()
			ctx.stroke();
			ctx.closePath();
		}
		if (finished){
			clearInterval(id);
		}
	}
}

function view(){
	document.getElementById('view').value = VIEWS[(current_view+2)%3]
	current_view = (current_view+1)%3;
	document.getElementById('current_view').innerHTML = VIEWS[current_view];
	main();
}

function main(){
	if (current_view==0)
		pitcher_view();
	else if (current_view==1)
		top_view();
	else if (current_view==2)
		side_view();
}

function input_pitcher(data){
	for (let i=1; i<=5; i++){
		for (let j=0; j<=5; j++){
			if (j==0 && data[i-1][5])
				document.getElementById(i.toString()+j.toString()).innerHTML=`Pitch ${i} (${data[i-1][j]}):`;
			else if (j==5)
				document.getElementById(i.toString()+j.toString()).checked=data[i-1][j];
			else
				document.getElementById(i.toString()+j.toString()).value=data[i-1][j];
		}
	}
}

function default_pitcher(){
	let name = document.getElementById('pitchers').value
	let data = []
	switch(name){
		case 'custom':
			for (let i=1; i<=5; i++){
				document.getElementById(i.toString()+'0').innerHTML=`Pitch ${i}:`;
			}
			return;
		case 'wainwright':
			data = [['Curveball', 73, -1964, 1965, 114, 1], ['Sinker', 89, 1375, -1670, -86, 1], ['Cutter', 85, 1312, 1776, 177, 1], ['4-Seam Fastball', 89, 2149, -379, 14, 1], ['Changeup', 81, 603, -1547, -114, 1]];
			break;
		case 'snell':
			data = [['4-Seam Fastball', 95, 2276, 731, -27, 1], ['Changeup', 88, 1077, 1340, 88, 1], ['Curveball', 80, -1820, -1490, -88, 1], ['Slider', 87, 748, -1871, -222, 1], ['', '', '', '', '', 0]];
			break;
		case 'sale':
			data = [['Slider', 78, -1018, -2228, -73, 1], ['4-Seam Fastball', 93, 1407, 1903, 2, 1], ['Changeup', 85, -192, 1925, 121, 1], ['2-Seam Fastball', 92, 356, 2246, 103, 1], ['', '', '', '', '', 0]];
			break;
		case 'kershaw':
			data = [['4-Seam Fastball', 91, 2464, -83, -66, 1], ['Slider', 87, 2040, -1462, -192, 1], ['Curveball', 74, -2461, -560, -4, 1], ['Changeup', 86, 1706, 1321, 86, 1], ['', '', '', '', '', 0]];
			break;
		case 'kluber':
			data = [['Sinker', 91, 859, -2070, -60, 1], ['Cutter', 88, 1777, 1505, 167, 1], ['Curveball', 83, 5, 2559, 164, 1], ['4-Seam Fastball', 91, 2127, -1074, 42, 1], ['Changeup', 85, 294, -1656, -88, 1], ['Pitch Out', 85, 1894, -1289, 172, 1]];
			break;
		case 'cole':
			data = [['4-Seam Fastball', 96, 2040, -1465, -6, 1], ['Slider', 88, 898, 2142, 206, 1], ['Knuckle Curve', 83, -2249, 1636, 34, 1], ['Changeup', 88, 896, -1486, -75, 1], ['', '', '', '', '', 0]];
			break;
		case 'flaherty':
			data = [['4-Seam Fastball', 94, 2015, -838, 45, 1], ['Slider', 84, 507, 2100, 192, 1], ['Curveball', 77, -1772, 1606, 43, 1], ['Sinker', 92, 997, -1738, -84, 1], ['Changeup', 85, 763, -1649, -82, 1]];
			break;
		case 'degrom':
			data = [['4-Seam Fastball', 98, 2253, -998, 6, 1], ['Slider', 92, 1703, 1668, 176, 1], ['Changeup', 91, 281, -1560, -101, 1], ['Curveball', 84, -1581, 2028, 110, 1], ['', '', '', '', '', 0]];
			break;
		case 'verlander':
			data = [['4-Seam Fastball', 94, 2270, -1189, -26, 1], ['Slider', 87, 1696, 1627, 230, 1], ['Curveball', 79, -2478, 1300, 20, 1], ['Changeup', 86, 878, -1618, -122, 1], ['', '', '', '', '', 0]];
			break;
		case 'hendricks':
			data = [['Sinker', 87, 1029, -1527, -61, 1], ['Changeup', 79, 1328, -1495, -79, 1], ['4-Seam Fastball', 87, 1798, -764, 20, 1], ['Curveball', 72, -2058, 1883, 77, 1], ['', '', '', '', '', 0]];
			break;
		case 'lynn':
			data = [['4-Seam Fastball', 93, 2246, -1027, 70, 1], ['Cutter', 89, 2151, 963, 203, 1], ['Sinker', 91, 933, -2105, -95, 1], ['Curveball', 83, -1840, 1600, 10, 1], ['Changeup', 84, 1165, -1249, -25, 1]];
			break;
		case 'giolito':
			data = [['4-Seam Fastball', 93, 2157, -891, 0, 1], ['Changeup', 80, 1085, -840, -46, 1], ['Slider', 84, 717, 1480, 167, 1], ['Curveball', 77, -2365, 712, 15, 1], ['', '', '', '', '', 0]];
			break;
		case 'scherzer':
			data = [['4-Seam Fastball', 94, 1991, -1445, 36, 1], ['Slider', 85, 578, 2014, 184, 1], ['Changeup', 84, 135, -1406, -86, 1], ['Cutter', 91, 2466, -182, 173, 1], ['Curveball', 77, -1672, 2202, 66, 1]];
			break;
		case 'fried':
			data = [['4-Seam Fastball', 93, 2037, 248, -45, 1], ['Curveball', 74, -2420, -1301, -30, 1], ['Slider', 84, -322, -2389, -154, 1], ['Sinker', 92, 1135, 1546, 84, 1], ['Changeup', 83, 551, 1366, 85, 1]];
			break;
		case 'soroka':
			data = [['2-Seam Fastball', 92, 806, -1994, -142, 1], ['Slider', 83, -1706, 2063, 114, 1], ['4-Seam Fastball', 92, 2147, -868, 17, 1], ['Changeup', 81, 1361, -1667, -103, 1], ['', '', '', '', '', 0]];
			break;
		case 'gray':
			data = [['Curveball', 80, -2030, 2122, 130, 1], ['4-Seam Fastball', 93, 2420, -405, 30, 1], ['Sinker', 92, 1391, -1944, -107, 1], ['Slider', 82, -1098, 2565, 159, 1], ['Changeup', 90, 1342, -1768, -110, 1]];
			break;
		case 'bauer':
			data = [['4-Seam Fastball', 93, 2482, -1222, 16, 1], ['Cutter', 84, -930, 2498, 131, 1], ['Slider', 80, -789, 2790, 150, 1], ['Knuckle Curve', 79, -2716, 1079, 6, 1], ['Sinker', 93, 2218, -1679, -21, 1], ['Changeup', 84, 870, -1109, -37, 1]];
			break;
		case 'glasnow':
			data = [['4-Seam Fastball', 97, 2371, -122, 70, 1], ['Curveball', 82, -2790, 910, -24, 1], ['Changeup', 91, 1077, -1399, -62, 1], ['', '', '', '', '', 0], ['', '', '', '', '', 0]];
			break;
		case 'darvish':
			data = [['Cutter', 87, -509, 1989, 119, 1], ['4-Seam Fastball', 95, 2411, -885, 36, 1], ['Slider', 81, -654, 2640, 153, 1], ['Sinker', 95, 1515, -1891, -63, 1], ['Knuckle Curve', 79, -2315, 1543, 25, 1], ['Split-Finger', 89, 976, -1342, -72, 1], ['Curveball', 72, -2158, 1380, 22, 1]];
			break;
		case 'greinke':
			data = [['4-Seam Fastball', 89, 2281, -289, 30, 1], ['Changeup', 87, 317, -1727, -147, 1], ['Slider', 83, -77, 2235, 199, 1], ['Curveball', 70, -1807, 1619, 92, 1], ['2-Seam Fastball', 90, 1395, -1742, -108, 1], ['Eephus', 63, -1559, 1511, 95, 1], ['Split-Finger', 80, 506, -1378, -93, 1], ['Cutter', 89, 2027, 1261, 170, 1]];
			break;
	}
	input_pitcher(data);
}

window.onload = main