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
				data = [['Curveball', 73, -1964, 1966, 114, 1], ['Sinker', 89, 1376, -1670, -86, 1], ['Cutter', 85, 1312, 1776, 177, 1], ['4-Seam Fastball', 89, 2149, -379, 14, 1], ['Changeup', 81, 603, -1548, -114, 1]];
				break;
		case 'snell':
				data = [['4-Seam Fastball', 95, 2282, 728, -27, 1], ['Changeup', 88, 1087, 1338, 87, 1], ['Slider', 87, 645, -1931, -217, 1], ['Curveball', 80, -1816, -1462, -84, 1], ['', '', '', '', '', 0]];
				break;
		case 'sale':
				data = [['Slider', 78, -1018, -2229, -73, 1], ['4-Seam Fastball', 93, 1408, 1903, 2, 1], ['Changeup', 85, -192, 1926, 121, 1], ['2-Seam Fastball', 92, 356, 2246, 103, 1], ['', '', '', '', '', 0]];
				break;
		case 'kershaw':
				data = [['4-Seam Fastball', 91, 2478, -73, -66, 1], ['Slider', 87, 2073, -1395, -188, 1], ['Curveball', 74, -2483, -502, 1, 1], ['Changeup', 86, 2233, 1112, 46, 1], ['', '', '', '', '', 0]];
				break;
		case 'kluber':
				data = [['Sinker', 91, 859, -2071, -60, 1], ['Cutter', 88, 1777, 1506, 167, 1], ['Curveball', 83, 5, 2559, 164, 1], ['4-Seam Fastball', 91, 2128, -1075, 42, 1], ['Changeup', 85, 294, -1657, -88, 1], ['Pitch Out', 85, 1894, -1289, 172, 1]];
				break;
		case 'cole':
				data = [['4-Seam Fastball', 96, 2031, -1469, -6, 1], ['Slider', 88, 924, 2118, 206, 1], ['Knuckle Curve', 83, -2260, 1612, 31, 1], ['Changeup', 88, 886, -1493, -77, 1], ['', '', '', '', '', 0]];
				break;
		case 'ryu':
				data = [['Changeup', 79, 476, 1361, 78, 1], ['Cutter', 85, 1775, -575, -119, 1], ['4-Seam Fastball', 89, 1557, 1223, -12, 1], ['Curveball', 72, -1956, -1589, -34, 1], ['Sinker', 89, 903, 1714, 84, 1]];
				break;
		case 'flaherty':
				data = [['4-Seam Fastball', 94, 2015, -838, 45, 1], ['Slider', 84, 507, 2100, 192, 1], ['Curveball', 77, -1772, 1606, 43, 1], ['Sinker', 92, 998, -1738, -84, 1], ['Changeup', 85, 764, -1649, -82, 1]];
				break;
		case 'degrom':
				data = [['4-Seam Fastball', 98, 2253, -998, 6, 1], ['Slider', 92, 1704, 1668, 176, 1], ['Changeup', 91, 281, -1560, -101, 1], ['Curveball', 84, -1582, 2028, 110, 1], ['', '', '', '', '', 0]];
				break;
		case 'verlander':
				data = [['4-Seam Fastball', 94, 2271, -1190, -26, 1], ['Slider', 87, 1696, 1627, 230, 1], ['Curveball', 79, -2479, 1301, 20, 1], ['Changeup', 86, 878, -1618, -122, 1], ['', '', '', '', '', 0]];
				break;
		case 'maeda':
				data = [['Slider', 82, 1696, 996, 160, 1], ['Changeup', 84, 69, -1459, -115, 1], ['4-Seam Fastball', 91, 1983, -1087, 27, 1], ['Sinker', 90, 954, -1970, -101, 1], ['Curveball', 78, -2182, 1284, 24, 1], ['Cutter', 87, 2242, 565, 140, 1]];
				break;
		case 'hendricks':
				data = [['Sinker', 87, 1030, -1528, -61, 1], ['Changeup', 79, 1329, -1496, -79, 1], ['4-Seam Fastball', 87, 1798, -764, 20, 1], ['Curveball', 72, -2058, 1883, 77, 1], ['', '', '', '', '', 0]];
				break;
		case 'lynn':
				data = [['4-Seam Fastball', 93, 2246, -1028, 70, 1], ['Cutter', 89, 2151, 963, 203, 1], ['Sinker', 91, 933, -2106, -96, 1], ['Curveball', 83, -1840, 1600, 10, 1], ['Changeup', 84, 1165, -1249, -25, 1]];
				break;
		case 'giolito':
				data = [['4-Seam Fastball', 93, 2158, -891, 0, 1], ['Changeup', 80, 1086, -841, -46, 1], ['Slider', 84, 717, 1481, 167, 1], ['Curveball', 77, -2365, 712, 15, 1], ['', '', '', '', '', 0]];
				break;
		case 'fried':
				data = [['4-Seam Fastball', 93, 2044, 229, -45, 1], ['Curveball', 74, -2410, -1292, -30, 1], ['Slider', 84, -306, -2398, -157, 1], ['Sinker', 92, 1163, 1538, 84, 1], ['Changeup', 83, 515, 1347, 84, 1]];
				break;
		case 'scherzer':
				data = [['4-Seam Fastball', 94, 1991, -1445, 36, 1], ['Slider', 85, 579, 2015, 184, 1], ['Changeup', 84, 135, -1406, -86, 1], ['Cutter', 91, 2466, -182, 173, 1], ['Curveball', 77, -1672, 2202, 66, 1]];
				break;
		case 'soroka':
				data = [['2-Seam Fastball', 92, 806, -1994, -142, 1], ['Slider', 83, -1706, 2064, 114, 1], ['4-Seam Fastball', 92, 2148, -868, 17, 1], ['Changeup', 81, 1361, -1667, -103, 1], ['', '', '', '', '', 0]];
				break;
		case 'bieber':
				data = [['4-Seam Fastball', 94, 2078, -1086, -17, 1], ['Knuckle Curve', 83, -2059, 1137, 36, 1], ['Cutter', 89, 2310, 650, 122, 1], ['Slider', 84, -2406, 576, -55, 1], ['Changeup', 88, 354, -1591, -113, 1]];
				break;
		case 'gray':
				data = [['Curveball', 80, -2030, 2122, 130, 1], ['Sinker', 93, 1383, -1951, -108, 1], ['4-Seam Fastball', 93, 2465, -349, 35, 1], ['Slider', 82, -1098, 2565, 159, 1], ['Changeup', 90, 1331, -1775, -111, 1]];
				break;
		case 'bauer':
				data = [['4-Seam Fastball', 93, 2483, -1222, 16, 1], ['Cutter', 84, -930, 2498, 131, 1], ['Slider', 80, -789, 2791, 150, 1], ['Knuckle Curve', 79, -2716, 1080, 6, 1], ['Sinker', 93, 2218, -1679, -21, 1], ['Changeup', 84, 870, -1109, -37, 1]];
				break;
		case 'glasnow':
				data = [['4-Seam Fastball', 97, 2376, -170, 69, 1], ['Curveball', 82, -2775, 972, -20, 1], ['Changeup', 91, 1096, -1397, -62, 1], ['', '', '', '', '', 0], ['', '', '', '', '', 0]];
				break;
		case 'buehler':
				data = [['4-Seam Fastball', 97, 2490, -722, 0, 1], ['Knuckle Curve', 82, -2377, 1789, 100, 1], ['Cutter', 92, 2234, 1510, 178, 1], ['Slider', 87, -358, 2776, 194, 1], ['Sinker', 97, 1725, -1735, -81, 1]];
				break;
		case 'darvish':
				data = [['Cutter', 87, -509, 1990, 119, 1], ['4-Seam Fastball', 95, 2411, -886, 36, 1], ['Slider', 81, -654, 2641, 153, 1], ['Sinker', 95, 1516, -1891, -63, 1], ['Knuckle Curve', 79, -2316, 1543, 25, 1], ['Split-Finger', 89, 976, -1342, -72, 1], ['Curveball', 72, -2158, 1380, 22, 1]];
				break;
		case 'greinke':
				data = [['4-Seam Fastball', 89, 2281, -289, 30, 1], ['Changeup', 87, 317, -1727, -147, 1], ['Slider', 83, -77, 2235, 199, 1], ['Curveball', 70, -1807, 1619, 92, 1], ['2-Seam Fastball', 90, 1395, -1743, -108, 1], ['Eephus', 63, -1560, 1512, 95, 1], ['Split-Finger', 80, 506, -1378, -93, 1], ['Cutter', 89, 2027, 1262, 171, 1]];
				break;
	}
	input_pitcher(data);
}

window.onload = main