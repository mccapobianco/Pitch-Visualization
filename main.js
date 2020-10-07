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
			ball.v = [0, 0, parseInt(elements[0].value)];
			ball.v = add(miph2mps(ball.v), [0,2.24567,0]);
			ball.w = [-parseInt(elements[1].value), parseInt(elements[2].value), -parseInt(elements[3].value)];
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
		for (let j=1; j<=5; j++){
			if (j==5)
				document.getElementById(i.toString()+j.toString()).checked=data[i-1][j-1];
			else
				document.getElementById(i.toString()+j.toString()).value=data[i-1][j-1];
		}
	}
}

function default_pitcher(){
	let name = document.getElementById('pitchers').value
	let data = []
	switch(name){
		case 'custom':
			return;
		case 'kershaw':
			data = [[87, 2022, 1484, 192, 1], [91, 2464, 89, 66, 1], [74, -2458, 562, 5, 1], [86, 1706, -1321, -86, 1], ['', '', '', '', 0]];
			break;
		case 'cole':
			data = [[96, 2039, 1459, 6, 1], [88, 869, -2148, -206, 1], [83, -2242, -1650, -36, 1], [88, 901, 1477, 74, 1], ['', '', '', '', 0]];
			break;
		case 'degrom':
			data = [[98, 2253, 998, -6, 1], [92, 1703, -1668, -176, 1], [91, 281, 1560, 101, 1], [84, -1581, -2028, -110, 1], ['', '', '', '', 0]];
			break;
		case 'glasnow':
			data = [[96, 2374, 96, -70, 1], [82, -2775, -916, 22, 1], [91, 1074, 1400, 62, 1], ['', '', '', '', 0], ['', '', '', '', 0]];
			break;
		case 'sale':
			data= [[78, -1018, 2228, 73, 1], [93, 1407, -1903, -2, 1], [85, -192, -1925, -121, 1], [92, 356, -2246, -103, 1], ['', '', '', '', 0]];
			break;
//TODO i think gyro is negative backwards
	}
	input_pitcher(data);
}

window.onload = main