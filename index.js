var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

var can = document.getElementById('canvas');
var ctx = can.getContext('2d');
var tickcount = 0;

var mx = 0;
var my = 0;

var arrow = {
	visible: false,
	startX: 0,
	startY: 0,
	endX: 0,
	endY: 0,
	maxLength: 300
};

var circles = [];
var object = {
	x: 15,
	y: 15,
	dir: Math.PI / 4,
	vel: 2,
	r: 15,
	visible: false
};

function distance(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) +
	                 Math.pow(y2 - y1, 2));
}

can.addEventListener('mousemove', function(e) {
	var rect = can.getBoundingClientRect();
	mx = e.clientX - rect.left;
	my = e.clientY - rect.top;

	if(arrow.visible) {
		console.log('move arrow');
		var dist = distance(mx, my, arrow.startX, arrow.startY);
		dist = Math.min(dist, arrow.maxLength);
		var dir = Math.atan2(my - arrow.startY, mx - arrow.startX);
		arrow.endX = arrow.startX + dist * Math.cos(dir);
		arrow.endY = arrow.startY + dist * Math.sin(dir);
	}
});

can.addEventListener('mousedown', function(e) {
	object.visible = false;
	circles = [];

	arrow.visible = true;
	arrow.startX = mx;
	arrow.startY = my;
	arrow.endX = mx;
	arrow.endY = my;
});

can.addEventListener('mouseup', function(e) {
	arrow.visible = false;
	object.x = Math.max(Math.min(arrow.startX, 640), 0);
	object.y = Math.max(Math.min(arrow.startY, 480), 0);
	var dist = distance(arrow.startX, arrow.startY, arrow.endX, arrow.endY);
	object.vel = dist / arrow.maxLength;
	object.dir = Math.atan2(arrow.endY - arrow.startY, arrow.endX - arrow.startX);
	object.visible = true;
});

var Circle = function(x, y, r) {
	return {
		x: x || 0,
		y: y || 0,
		r: r || 0,
		dir: object.dir
	}
};

function circle(x, y, r, fill) {
	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2*Math.PI, false);
	if(fill) {
		ctx.fill();
	} else {
		ctx.stroke();
	}
}
function render() {
	ctx.clearRect(0, 0, can.width, can.height);

	// Render circles
	ctx.strokeStyle = 'white';
	ctx.lineWidth = 2;
	for(i = 0; i < circles.length; i++) {
		var c = circles[i];
		if(c.r < 800) circle(c.x, c.y, c.r, false);
	}

	// Render wave
	function wave(side) {
		var sineSide = side * ((circles.length % 2 === 0) ? -1 : 1);
		for(i = circles.length - 1; i > 0; i--) {
			var start = {
				x: circles[i].x + Math.cos(object.dir) * circles[i].r * side,
				y: circles[i].y + Math.sin(object.dir) * circles[i].r * side
			};
			var end = {
				x: circles[i - 1].x + Math.cos(object.dir) * circles[i - 1].r * side,
				y: circles[i - 1].y + Math.sin(object.dir) * circles[i - 1].r * side
			};
			var dist = distance(start.x, start.y, end.x, end.y);
			var perpDir = object.dir + Math.PI / 2;
			var midPt = {
				x: (start.x + end.x) / 2 + Math.cos(perpDir) * 20 * sineSide,
				y: (start.y + end.y) / 2 + Math.sin(perpDir) * 20 * sineSide
			};

			var r = Math.round(255 * (dist / 30));
			var b = Math.round(255 * (1 - dist / 30));
			ctx.strokeStyle = "rgb(" + r + ",0," + b + ")";

			ctx.beginPath();
			ctx.moveTo(start.x, start.y);
			ctx.quadraticCurveTo(midPt.x, midPt.y, end.x, end.y);
			ctx.stroke();

			sineSide *= -1;
		}
	}
	if(circles.length > 0) {
		var phantomCircleRadius = circles[circles.length - 1].r - 20;
	} else {
		var phantomCircleRadius = object.r;
	}
	circles.push(new Circle(object.x, object.y, phantomCircleRadius));
	ctx.lineWidth = 4;
	wave(1);
	wave(-1);
	circles.pop();

	// Render arrow
	if(arrow.visible) {
		ctx.strokeStyle = "blue";
		ctx.lineWidth = 2;
		canvas_arrow(ctx, arrow.startX, arrow.startY, arrow.endX, arrow.endY);
	}

	// Render object
	if(object.visible) {
		ctx.fillStyle = 'white';
		circle(object.x, object.y, object.r, true);
	}
}
function canvas_arrow(context, fromx, fromy, tox, toy){
    var headlen = 10;   // length of head in pixels
    var angle = Math.atan2(toy-fromy,tox-fromx);
    context.beginPath();
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));
    context.stroke();
}
function tick() {
	stats.begin();
	window.requestAnimationFrame(tick);

	// Update circles
	for(i = 0; i < circles.length; i++) {
		circles[i].r += 1;
		/*if(circles[i].r > 800) {
			circles.splice(i, 1);
			i--;
		}*/
	}
	if(object.visible && tickcount % 20 === 0) {
		circles.push(new Circle(object.x, object.y, object.r));
	}

	// Update object
	if(object.visible) {
		if(Math.abs(object.vel) > 1) object.vel = Math.sign(object.vel);
		object.x += Math.cos(object.dir) * object.vel;
		object.y += Math.sin(object.dir) * object.vel;
		if(object.x < object.r) {
			object.x = object.r;
			object.dir = Math.PI - object.dir;
			circles = [];
		}
		if(object.x > 640 - object.r) {
			object.x = 640 - object.r;
			object.dir = Math.PI - object.dir;
			circles = [];
		}
		if(object.y < object.r) {
			object.y = object.r;
			object.dir = 2 * Math.PI - object.dir;
			circles = [];
		}
		if(object.y > 480 - object.r) {
			object.y = 480 - object.r;
			object.dir = 2 * Math.PI - object.dir;
			circles = [];
		}
	}

	tickcount++;
	render();
	stats.end();
}

function init() {
	can.width = 640;
	can.height = 480;

	tick();
}

init();
