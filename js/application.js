CLOCK = {};

CLOCK.earthRotations = [
	330, 90, 210
];
 

CLOCK.colorStops = {
	night: {
		0: [205, 46, 42],
		1: [210, 95, 10]
	},
	day: {
		0: [205, 46, 90],
		1: [210, 95, 70]
	}
};

CLOCK.city = function(){
	
	this.radius = 0;
	this.x = 0;
	this.y = 0;
	this.onState = false;
	
	return {
		init: function($x, $y){
			this.x = $x;
			this.y = $y;
			this.radius = 3;
		},
		draw: function(ctx, onState){
			ctx.save();
			var grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius*2);
			grad.addColorStop(0, '#ffffff');
			if(onState){
				grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
			}else{
				grad.addColorStop(1, 'rgba(180, 210, 0, 0)');	
			}			
			ctx.fillStyle = grad;
			ctx.fillRect(this.x-(this.radius*2), this.y-(this.radius*2), this.radius*4, this.radius*4);
			ctx.restore();
			
			ctx.save();
			if(onState){
				ctx.fillStyle = '#ff0000';
			}else{
				ctx.fillStyle = '#b4d200';
			}
			ctx.beginPath();
		
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, true);
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		},
		getHitArea: function(){
			var hitArea = {};
			hitArea.x1 = this.x -5;
			hitArea.x2 = this.x + this.radius*2 +5;
			hitArea.y1 = this.y -5;
			hitArea.y2 = this.y + this.radius*2 +5;
			return hitArea;
		},
		mouseOver: function(){
		}
	}
	
};

CLOCK.sun = function(){

	this.sunData = {};
	var radius = 50;
	var targetX = 0;
	var targetY = 0;
	var easing = 0.3;
	var x = 0;
	var y = 0;
	var vx = 5;
	var vy = 5;
	var winObj = {};
	var sunGlow = 'rgba(246, 246, 7, 0)';
	var sunColor = '#ffffff';
	
	return {
		setData: function(obj, $winObj){
			this.sunData = obj;
			winObj = $winObj;
		},
		animate: function(targetX, targetY){
			var dx = targetX - x;
			var dy = targetY - y;
			if(Math.abs(dx) < 1){
				x = targetX;
			}else{
				vx = dx * easing;
				x += vx;
			}
			if(Math.abs(dy) < 1){
				y = targetY;
			}else{
				vy = dy * easing;
				y += vy;
			}		
		},
		draw: function(ctx, $int, $fill){
			tempX = this.sunData.azimuth * winObj.offsetX - radius;
			tempY = winObj.h - (this.sunData.altitude * winObj.offsetY) - radius;
			this.animate(tempX,tempY);
			ctx.save();
			var grad = ctx.createRadialGradient(x, y, 0, x, y, radius+20);
			grad.addColorStop(0, '#ffffff');	
			grad.addColorStop(1, sunGlow);	
			ctx.fillStyle = grad;
			ctx.fillRect(x-(radius*2), y-(radius*2), radius*4, radius*4)
			ctx.restore();
			
			ctx.save();
			ctx.fillStyle = $fill || sunColor;
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI*2, true);
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		}
	}
}

CLOCK.moon = function(){
	
	this.moonData = {};
	var radius = 30;
	var targetX = 0;
	var targetY = 0;
	var easing = 0.3;
	var x = 0;
	var y = 0;
	var vx = 5;
	var vy = 5;
	var winObj = {};
	var moonGlow = 'rgba(0, 174, 239, 0)';
	var moonColor = '#94dcf7';
	
	return {
		setData: function(obj, $winObj){
			this.moonData = obj;
			winObj = $winObj;
			radius = 30;
		},
		animate: function(targetX, targetY){
			var dx = targetX - x;
			var dy = targetY - y;
			if(Math.abs(dx) < 1){
				x = targetX;
			}else{
				vx = dx * easing;
				x += vx;
			}
			if(Math.abs(dy) < 1){
				y = targetY;
			}else{
				vy = dy * easing;
				y += vy;
			}		
		},
		draw: function(ctx, $int, $fill){
			var tempX = this.moonData.azimuth * winObj.offsetX - radius;
			var tempY = winObj.h - (this.moonData.altitude * winObj.offsetY) - radius;
			
			this.animate(tempX,tempY);
			ctx.save();
			var grad = ctx.createRadialGradient(x, y, 0, x, y, 45);
			grad.addColorStop(0, '#ffffff');	
			grad.addColorStop(1, moonGlow);	
			ctx.fillStyle = grad;
			ctx.fillRect(x-(radius*2), y-(radius*2), 200, 200)
			ctx.restore();
			
			ctx.save();
			ctx.fillStyle = $fill || moonColor;
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI*2, true);
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		}
	}
}


CLOCK.sky = function(el, winObj, $earth, $sun, $moon, $cities){
	var self = this;
	self.el = el;
	var canvas = $(el)[0];
	var earth = $earth;
	var sun = $sun;
	var moon = $moon;
	var cities = $cities;
	var ctx;
	var currentStops = CLOCK.colorStops.night;
	var satRatios = [];
	var sunsetThreshold = -10; //how far below the sunrise is there still light?
	var noonSunAltitude = 70; //this makes it lighter even when sun isn't really high in sky
	var currentAltitude = sunsetThreshold;
	var nextAltitude;
	var earthCounter = 0;
	var rotation = 0;
	var vx = 5;
	var vy = 5;
	var easing = 0.3;
	
	function getStopData(sunObj){
		var nightSatStart = CLOCK.colorStops.night[0][2];
		var nightSatEnd = CLOCK.colorStops.night[1][2];
		var daySatStart = CLOCK.colorStops.day[0][2];
		var daySatEnd = CLOCK.colorStops.day[1][2];
		var startDiff = daySatStart - nightSatStart;
		var endDiff = daySatEnd - nightSatEnd;
		var startRatio = startDiff/noonSunAltitude//sunObj.noon.altitude;
		var endRatio = endDiff/noonSunAltitude//sunObj.noon.altitude;
		satRatios[0] = startRatio;
		satRatios[1] = endRatio;
	}
	
	return {
		init: function(){
			if (canvas.getContext){
				ctx = canvas.getContext('2d');
				canvas.width = winObj.w;
				canvas.height = winObj.h;
			} else {
				alert('No canvas, guy!')
			}		
			rotation = CLOCK.earthRotations[0];
		},
		
		setCurrAltitude: function(nextAltitude){
			if(nextAltitude == currentAltitude){
				return;
			}else if(nextAltitude > currentAltitude){
				currentAltitude++;
			}else{
				currentAltitude--;
			}
		},
		
		rotate: function(targetRot){
			var dx = targetRot - rotation;
			if(Math.abs(dx) < 1){
				rotation = targetRot;
			}else{
				vx = dx * easing;
				rotation += vx;
			}
		},
		
		tick: function(winObj, $int, $time){
			var w = winObj.w;
			var h = winObj.h;
			var sat;
			var i = 0;

			nextAltitude = sun.sunData.altitude;
			this.setCurrAltitude(nextAltitude);
			canvas.width = w;
			canvas.height = h;
			var outerRadius = w*1.2;
			if(h < w){
				outerRadius = h*1.2;
			}
			var grad = ctx.createRadialGradient(w/2, h, 0, w/2, h, outerRadius);		
			getStopData(sun.sunData);
			for(var stop in currentStops){
				var color = currentStops[stop];
				if(nextAltitude > sunsetThreshold){
					sat = color[2] + (currentAltitude * satRatios[i]);
				}else{
					sat = color[2] + (sunsetThreshold * satRatios[i]);
				}
				if(i==0){var lightColor = 'hsl('+color[0]+','+color[1]+'%,'+sat+'%)';}
				grad.addColorStop(stop, 'hsl('+color[0]+','+color[1]+'%,'+sat+'%)');
				i++;
			}			
			ctx.fillStyle = grad;
			ctx.fillRect(0,0,w,h);
			
			ctx.save();
			
			sun.draw(ctx);
			moon.draw(ctx);
			
			this.rotate(CLOCK.earthRotations[$int]);
			
			ctx.translate(w/2, h+170);
			ctx.rotate(rotation * Math.PI / 180);

			ctx.translate(-360, -395);
			earth.drawEarth(ctx, '#000000');
			ctx.restore();
			ctx.save();
			
			ctx.translate(50, 50);
			earth.drawMap(ctx, lightColor);
			
			ctx.translate(-50,-50);
			for(i=0;i<3;i++){
				if(i == $int){
					cities[i].draw(ctx, true);
				}else{
					cities[i].draw(ctx);
				}
				
			}
			ctx.restore();
			ctx.font = '20pt Arial';
			ctx.textAlign = 'right';
			ctx.fillStyle = lightColor;
			ctx.fillText($time, w-70,0);
			earthCounter++;
			
		}	
	}
}


CLOCK.app = {
	
	sundata: {},
	sky: {},
	clock: {},
	sun: {},
	moon: {},
	earth: {},
	cities: [],
	nav: {},
	planetData: [],
	planetDataLen: 0,
	windowObj: {},
	timeOffsets: [0, 3, 2],
	isSunMoon: false,
	currentSecs: -1,
	currentInt: 0,
	numPhases: 3,
	timer: 50,
	secondsOffset: 0,
	
	init: function(){
		var self = this;	
		self.secondsOffset = 1000/self.timer;
		//init Listeners and EnterFrame
		$(window).resize(function(){
			self.onResize();
		});	
		self.onResize();		
		self.setIntval = setInterval(function(){
			self.onEnterFrame();
		}, self.timer);
		//init Time
		self.initClock();
		
		//init Sky, Sun, Moon, Nav objects
		self.initSky();
		self.initNav();
	},
	
	onMouseClick: function(e){
		var self = this;
		for(var i=0;i<3;i++){
			var button = {};
			button = self.cities[i].getHitArea();
			if(e.pageX > button.x1 && e.pageX < button.x2 && e.pageY > button.y1 && e.pageY < button.y2 ){
				self.changeCity(i);
			}
		}
	},
	
	onMouseMove: function(e){
		var self = this;
		$('canvas').css({'cursor': 'default'});
		for(var i=0;i<3;i++){
			var button = {};
			button = self.cities[i].getHitArea();
			if(e.pageX > button.x1 && e.pageX < button.x2 && e.pageY > button.y1 && e.pageY < button.y2 ){
				$('canvas').css({'cursor': 'pointer'});
				self.cities[i].mouseOver();
			}
		}
	},
	
	changeCity: function(newInt){
		var self = this;
		self.currentInt = newInt;
		self.setSunMoonData();
	},
	
	initClock: function(){
		var self = this;
		self.clock = $('#clock');
	},
	
	initNav: function(){
		var self = this;
		$('canvas').click(function(e){
			self.onMouseClick(e);
		});
		$('canvas').mousemove(function(e){
			self.onMouseMove(e);
		})
	},
	
	initEarth: function(){
		var self = this;
		
	},
	
	initSky: function(){
		var self = this;
		var date = new Date();
		self.sun = new CLOCK.sun();
		self.moon = new CLOCK.moon();
		self.earth = new CLOCK.earth();
		self.cities[0] = new CLOCK.city();
		self.cities[1] = new CLOCK.city();
		self.cities[2] = new CLOCK.city();
		self.cities[0].init(85, 90);
		self.cities[1].init(125, 95);
		self.cities[2].init(115, 125);
		self.currentSecs = date.getSeconds();
		self.setSunMoonData();
		self.isSunMoon = true;
		self.sky = new CLOCK.sky($('#sky'), self.windowObj, self.earth, self.sun, self.moon, self.cities);
		self.sky.init();
		self.sky.tick(self.windowObj, self.currentInt);
	},
	
	initSunMoon: function(){
		var self = this;
		
	},

	setSunMoonData: function(){
		var self = this;	
		var h = 0;
		var m = 0;
		for(var i=0; i<self.numPhases; i++){
			var date = new Date();
			self.planetData[i] = {};			
			date.setHours(date.getHours() + self.timeOffsets[i]);
			//date.setHours(1); //for testing different hours of day
			var time = new observatory(atlas[i], date);
			self.planetData[i].sunObj = doSun(time);
			self.planetData[i].moonObj = doMoon(time);
/******* not using this measure just yet 
			//date.setHours(Math.round(self.planetData[i].sunObj.midday));
			//var noon = new observatory(atlas[i], date);
			//self.planetData[i].sunObj.noon = doSun(noon);	
********/		
		}
		self.sun.setData(self.planetData[self.currentInt].sunObj, self.windowObj);
		self.moon.setData(self.planetData[self.currentInt].moonObj, self.windowObj);	
	},
	
	onEnterFrame: function(){
		var self = this;
		self.currentSecs++;	
		
		if(self.currentSecs == (60 * self.secondsOffset)){
			if(self.isSunMoon == true){
				self.setSunMoonData();				
			}	
			self.currentSecs = -1;
		}	
		var time = self.getClockTime();
		self.sky.tick(self.windowObj, self.currentInt, time);
	},
	
	onResize: function(){
		var self = this;
		self.windowObj.w = $(window).width();
		self.windowObj.h = $(window).height();
		self.windowObj.offsetX = self.windowObj.w / 360;
		self.windowObj.offsetY = self.windowObj.h / 90;
		$(self.sky).css({
			height: self.windowObj.h
		});
	},
	
	getClockTime: function(){
		var self = this;
		var currentTime = new Date();
		var currentHours = currentTime.getHours() + self.timeOffsets[self.currentInt];
		var currentMinutes = currentTime.getMinutes();
		var currentSeconds = currentTime.getSeconds();

		// Pad the minutes and seconds with leading zeros, if required
		currentMinutes = (currentMinutes < 10 ? "0" : "") + currentMinutes;
		currentSeconds = (currentSeconds < 10 ? "0" : "") + currentSeconds;

		// Choose either "AM" or "PM" as appropriate
		
		if(currentHours < 12 || currentHours >= 24){
			var timeOfDay = "am";
		}
		else{
			var timeOfDay = "pm";
		}

		// Convert the hours component to 12-hour 
		if(currentHours > 12 && currentHours < 24){
			currentHours -= 12;
		}
		if(currentHours > 23){
			currentHours -= 24;
		}
		if(currentHours == 0){
			currentHours = 12;
		}
		
		var currentTimeString = currentHours + ":" + currentMinutes + ":" + currentSeconds + " " + timeOfDay;
		return currentTimeString;
		// Update the time display
		//$(self.clock).html(currentTimeString);
		//ctx.drawText = function(font,size,x,y,text) 
	}
	
	
}

CLOCK.earth = function(){

	return {
	
		drawEarth: function(ctx, fillstyle) {

	      			// layer1/Compound Path
			ctx.save();
			ctx.beginPath();
			ctx.fillStyle = fillstyle;
			// layer1/Compound Path/Path
			ctx.moveTo(439.5, 16.4);
			ctx.bezierCurveTo(438.2, 16.1, 435.4, 17.9, 435.4, 17.9);
			ctx.bezierCurveTo(435.0, 19.4, 434.6, 21.0, 434.2, 22.5);
			ctx.bezierCurveTo(434.2, 22.5, 429.7, 21.6, 427.8, 22.8);
			ctx.bezierCurveTo(426.7, 23.4, 425.1, 25.2, 425.1, 25.2);
			ctx.bezierCurveTo(425.1, 25.1, 408.9, 24.0, 408.7, 25.6);
			ctx.bezierCurveTo(408.4, 27.1, 423.6, 30.5, 423.6, 30.6);
			ctx.bezierCurveTo(423.3, 32.0, 423.0, 33.4, 422.7, 34.9);
			ctx.bezierCurveTo(424.5, 35.2, 426.3, 35.6, 428.2, 35.9);
			ctx.bezierCurveTo(428.2, 35.9, 426.2, 49.6, 425.7, 56.5);
			ctx.bezierCurveTo(425.2, 63.4, 423.5, 72.8, 419.8, 87.3);
			ctx.bezierCurveTo(418.2, 93.3, 414.6, 103.7, 411.1, 113.8);
			ctx.bezierCurveTo(407.1, 113.0, 403.2, 112.3, 399.2, 111.7);
			ctx.bezierCurveTo(397.6, 119.9, 396.1, 128.2, 394.5, 136.4);
			ctx.bezierCurveTo(390.6, 135.8, 386.7, 135.3, 382.9, 134.8);
			ctx.bezierCurveTo(383.2, 132.6, 383.5, 130.3, 383.9, 128.0);
			ctx.bezierCurveTo(380.3, 127.6, 376.8, 127.3, 373.2, 127.0);
			ctx.bezierCurveTo(372.6, 132.1, 372.1, 137.1, 371.5, 142.1);
			ctx.bezierCurveTo(359.8, 141.2, 348.0, 141.1, 336.1, 141.9);
			ctx.bezierCurveTo(336.1, 144.8, 336.1, 147.8, 336.2, 150.8);
			ctx.bezierCurveTo(336.2, 151.1, 328.5, 155.1, 300.4, 162.5);
			ctx.bezierCurveTo(287.2, 166.5, 277.1, 174.6, 270.2, 182.1);
			ctx.bezierCurveTo(234.8, 196.8, 203.8, 220.0, 179.9, 249.2);
			ctx.bezierCurveTo(172.7, 252.5, 162.2, 256.5, 160.9, 256.9);
			ctx.bezierCurveTo(158.9, 257.3, 155.4, 264.3, 155.4, 264.3);
			ctx.bezierCurveTo(146.2, 258.7, 137.0, 253.1, 127.8, 247.6);
			ctx.bezierCurveTo(125.4, 251.4, 123.2, 255.3, 121.0, 259.3);
			ctx.bezierCurveTo(129.2, 263.7, 137.5, 268.2, 145.7, 272.6);
			ctx.bezierCurveTo(145.3, 273.4, 144.9, 274.1, 144.5, 274.8);
			ctx.bezierCurveTo(138.6, 271.7, 132.7, 268.5, 126.8, 265.4);
			ctx.bezierCurveTo(124.8, 269.3, 122.8, 273.2, 121.0, 277.1);
			ctx.bezierCurveTo(123.4, 278.2, 125.8, 279.4, 128.2, 280.5);
			ctx.bezierCurveTo(127.3, 282.4, 126.4, 284.3, 125.6, 286.3);
			ctx.bezierCurveTo(119.2, 283.4, 112.8, 280.6, 106.4, 277.7);
			ctx.bezierCurveTo(104.7, 281.5, 103.2, 285.2, 101.7, 289.0);
			ctx.bezierCurveTo(106.6, 291.0, 111.6, 292.9, 116.5, 294.9);
			ctx.bezierCurveTo(115.9, 296.5, 115.3, 298.1, 114.7, 299.7);
			ctx.bezierCurveTo(118.8, 301.2, 122.8, 302.7, 126.9, 304.2);
			ctx.bezierCurveTo(126.5, 305.4, 126.1, 306.5, 125.6, 307.7);
			ctx.bezierCurveTo(120.0, 305.6, 114.3, 303.6, 108.7, 301.6);
			ctx.bezierCurveTo(107.8, 304.1, 107.0, 306.5, 106.2, 309.0);
			ctx.bezierCurveTo(110.0, 310.2, 113.8, 311.5, 117.6, 312.7);
			ctx.bezierCurveTo(117.2, 313.9, 116.8, 315.1, 116.4, 316.3);
			ctx.bezierCurveTo(114.2, 315.6, 112.0, 314.9, 109.8, 314.2);
			ctx.bezierCurveTo(109.5, 315.0, 109.3, 315.8, 109.0, 316.6);
			ctx.bezierCurveTo(100.7, 314.1, 92.4, 311.6, 84.1, 309.1);
			ctx.bezierCurveTo(83.9, 309.8, 83.7, 310.5, 83.5, 311.2);
			ctx.bezierCurveTo(81.6, 310.9, 79.7, 310.6, 77.8, 310.3);
			ctx.bezierCurveTo(79.5, 311.1, 81.3, 312.0, 83.0, 312.8);
			ctx.bezierCurveTo(82.7, 313.8, 82.5, 314.8, 82.2, 315.8);
			ctx.bezierCurveTo(90.9, 318.2, 99.5, 320.6, 108.2, 323.0);
			ctx.bezierCurveTo(108.0, 323.8, 107.8, 324.6, 107.6, 325.5);
			ctx.bezierCurveTo(104.3, 324.6, 101.1, 323.7, 97.9, 322.9);
			ctx.bezierCurveTo(97.6, 324.2, 97.2, 325.4, 96.9, 326.7);
			ctx.bezierCurveTo(103.4, 328.3, 109.8, 330.0, 116.3, 331.6);
			ctx.bezierCurveTo(116.2, 332.0, 116.1, 332.4, 116.0, 332.8);
			ctx.bezierCurveTo(114.1, 332.3, 112.1, 331.8, 110.2, 331.3);
			ctx.bezierCurveTo(110.0, 332.1, 109.8, 332.9, 109.6, 333.8);
			ctx.bezierCurveTo(94.0, 330.1, 78.5, 326.4, 62.9, 322.7);
			ctx.bezierCurveTo(61.9, 327.0, 61.0, 331.3, 60.1, 335.6);
			ctx.bezierCurveTo(75.5, 338.6, 90.9, 341.5, 106.3, 344.5);
			ctx.bezierCurveTo(105.9, 346.2, 105.6, 347.8, 105.4, 349.4);
			ctx.bezierCurveTo(101.7, 348.8, 98.1, 348.2, 94.5, 347.6);
			ctx.bezierCurveTo(94.4, 348.0, 94.4, 348.4, 94.3, 348.8);
			ctx.bezierCurveTo(75.6, 345.6, 56.8, 342.4, 38.1, 339.2);
			ctx.bezierCurveTo(37.5, 342.8, 36.9, 346.4, 36.5, 350.0);
			ctx.bezierCurveTo(52.9, 352.3, 69.2, 354.6, 85.6, 356.8);
			ctx.bezierCurveTo(85.4, 357.7, 85.2, 358.6, 85.0, 359.4);
			ctx.bezierCurveTo(78.3, 358.6, 71.6, 357.7, 64.8, 356.8);
			ctx.bezierCurveTo(64.8, 357.3, 64.7, 357.8, 64.6, 358.2);
			ctx.bezierCurveTo(61.3, 357.8, 58.0, 357.4, 54.7, 357.0);
			ctx.bezierCurveTo(54.5, 357.5, 54.3, 357.9, 54.1, 358.4);
			ctx.bezierCurveTo(52.7, 358.3, 51.4, 358.1, 50.1, 357.9);
			ctx.bezierCurveTo(50.1, 357.9, 47.1, 357.8, 46.2, 358.3);
			ctx.bezierCurveTo(45.3, 358.8, 42.9, 357.9, 42.0, 358.2);
			ctx.bezierCurveTo(41.1, 358.6, 39.3, 357.5, 38.4, 358.1);
			ctx.bezierCurveTo(37.5, 358.7, 34.3, 358.6, 34.3, 358.6);
			ctx.bezierCurveTo(34.3, 358.6, 16.9, 356.7, 16.9, 357.3);
			ctx.bezierCurveTo(16.8, 357.9, 34.1, 360.2, 34.1, 360.2);
			ctx.bezierCurveTo(34.1, 360.2, 37.3, 360.8, 38.0, 361.6);
			ctx.bezierCurveTo(38.7, 362.3, 40.8, 361.8, 41.6, 362.3);
			ctx.bezierCurveTo(42.4, 362.8, 44.9, 362.9, 45.7, 363.6);
			ctx.bezierCurveTo(46.4, 364.2, 49.3, 365.4, 49.3, 365.4);
			ctx.bezierCurveTo(50.6, 365.5, 52.0, 365.6, 53.3, 365.7);
			ctx.bezierCurveTo(53.4, 365.8, 53.6, 365.8, 53.7, 365.8);
			ctx.bezierCurveTo(57.0, 366.1, 60.4, 366.4, 63.7, 366.7);
			ctx.bezierCurveTo(63.7, 367.2, 63.6, 367.7, 63.6, 368.2);
			ctx.bezierCurveTo(73.9, 369.1, 84.2, 370.0, 94.5, 371.0);
			ctx.bezierCurveTo(94.4, 371.4, 94.3, 371.9, 94.2, 372.4);
			ctx.bezierCurveTo(85.0, 371.7, 75.7, 371.0, 66.4, 370.4);
			ctx.bezierCurveTo(66.2, 372.1, 66.1, 373.8, 66.0, 375.5);
			ctx.bezierCurveTo(78.3, 376.3, 90.6, 377.1, 102.9, 378.0);
			ctx.bezierCurveTo(102.8, 379.6, 102.7, 381.2, 102.6, 382.9);
			ctx.bezierCurveTo(98.6, 382.6, 94.6, 382.4, 90.7, 382.1);
			ctx.bezierCurveTo(90.6, 383.9, 90.5, 385.7, 90.4, 387.5);
			ctx.bezierCurveTo(82.4, 387.3, 74.4, 387.0, 66.4, 386.8);
			ctx.bezierCurveTo(66.3, 391.0, 66.3, 395.2, 66.3, 399.4);
			ctx.bezierCurveTo(71.0, 399.4, 75.6, 399.3, 80.3, 399.3);
			ctx.bezierCurveTo(80.3, 403.8, 80.5, 408.2, 80.7, 412.7);
			ctx.bezierCurveTo(87.1, 412.3, 93.4, 412.0, 99.7, 411.6);
			ctx.bezierCurveTo(99.8, 413.2, 99.9, 414.7, 100.0, 416.2);
			ctx.bezierCurveTo(90.3, 416.9, 80.7, 417.7, 71.1, 418.4);
			ctx.bezierCurveTo(71.1, 419.5, 71.2, 420.5, 71.3, 421.5);
			ctx.bezierCurveTo(70.4, 421.6, 69.5, 421.7, 68.6, 421.8);
			ctx.bezierCurveTo(66.1, 422.0, 63.6, 425.9, 63.6, 425.9);
			ctx.bezierCurveTo(63.1, 426.5, 62.7, 427.1, 62.2, 427.7);
			ctx.bezierCurveTo(62.2, 427.7, 60.4, 428.6, 60.7, 430.8);
			ctx.bezierCurveTo(61.0, 433.0, 62.1, 432.6, 63.5, 434.1);
			ctx.bezierCurveTo(64.0, 434.7, 64.5, 435.5, 65.0, 435.9);
			ctx.bezierCurveTo(68.4, 439.3, 71.6, 438.3, 71.6, 438.3);
			ctx.bezierCurveTo(72.2, 438.2, 72.8, 438.2, 73.4, 438.1);
			ctx.bezierCurveTo(73.5, 439.0, 73.6, 439.9, 73.7, 440.8);
			ctx.bezierCurveTo(84.2, 439.1, 94.6, 437.4, 105.1, 435.7);
			ctx.bezierCurveTo(105.2, 436.3, 105.3, 436.9, 105.4, 437.4);
			ctx.bezierCurveTo(104.4, 437.6, 103.4, 437.7, 102.4, 437.9);
			ctx.bezierCurveTo(102.5, 438.3, 102.5, 438.7, 102.6, 439.1);
			ctx.bezierCurveTo(86.1, 441.7, 69.7, 444.3, 53.2, 446.9);
			ctx.bezierCurveTo(53.2, 447.1, 53.3, 447.4, 53.3, 447.6);
			ctx.bezierCurveTo(49.7, 448.3, 46.1, 448.9, 42.5, 449.6);
			ctx.bezierCurveTo(42.5, 449.9, 42.6, 450.2, 42.6, 450.4);
			ctx.bezierCurveTo(40.6, 450.8, 38.7, 451.2, 36.7, 451.5);
			ctx.bezierCurveTo(36.8, 451.9, 36.8, 452.2, 36.9, 452.6);
			ctx.bezierCurveTo(35.9, 452.8, 35.0, 453.0, 34.0, 453.2);
			ctx.bezierCurveTo(34.0, 453.2, 29.1, 455.4, 26.3, 456.0);
			ctx.bezierCurveTo(24.4, 456.4, 17.7, 457.6, 17.7, 457.6);
			ctx.bezierCurveTo(17.3, 457.8, 16.9, 458.0, 16.6, 458.2);
			ctx.bezierCurveTo(11.0, 459.4, 5.5, 460.6, 0.0, 461.8);
			ctx.bezierCurveTo(5.6, 460.9, 11.2, 460.0, 16.9, 459.0);
			ctx.bezierCurveTo(17.3, 459.0, 17.8, 459.0, 18.3, 459.0);
			ctx.bezierCurveTo(18.3, 459.0, 23.6, 458.1, 26.7, 457.6);
			ctx.bezierCurveTo(29.8, 457.0, 35.1, 457.7, 35.1, 457.7);
			ctx.bezierCurveTo(35.9, 457.5, 36.8, 457.4, 37.7, 457.2);
			ctx.bezierCurveTo(37.8, 457.7, 37.9, 458.2, 38.0, 458.8);
			ctx.bezierCurveTo(39.9, 458.4, 41.9, 458.0, 43.9, 457.7);
			ctx.bezierCurveTo(43.9, 457.9, 43.9, 458.1, 44.0, 458.2);
			ctx.bezierCurveTo(47.6, 457.5, 51.3, 456.8, 54.9, 456.1);
			ctx.bezierCurveTo(55.1, 456.4, 55.2, 456.7, 55.4, 457.0);
			ctx.bezierCurveTo(68.0, 454.6, 80.6, 452.2, 93.3, 449.8);
			ctx.bezierCurveTo(93.5, 451.0, 93.7, 452.1, 93.9, 453.2);
			ctx.bezierCurveTo(96.6, 452.7, 99.2, 452.2, 101.8, 451.7);
			ctx.bezierCurveTo(102.2, 453.7, 102.6, 455.7, 103.0, 457.6);
			ctx.bezierCurveTo(81.0, 462.8, 58.9, 468.0, 36.9, 473.3);
			ctx.bezierCurveTo(37.8, 477.5, 38.8, 481.6, 39.9, 485.8);
			ctx.bezierCurveTo(67.0, 478.6, 94.1, 471.3, 121.1, 464.1);
			ctx.bezierCurveTo(121.5, 465.7, 122.0, 467.2, 122.4, 468.8);
			ctx.bezierCurveTo(103.5, 474.2, 84.6, 479.6, 65.7, 485.0);
			ctx.bezierCurveTo(67.0, 489.8, 68.5, 494.5, 70.1, 499.1);
			ctx.bezierCurveTo(88.1, 493.1, 106.1, 487.0, 124.1, 480.9);
			ctx.bezierCurveTo(124.5, 482.1, 124.9, 483.2, 125.3, 484.4);
			ctx.bezierCurveTo(117.7, 487.0, 110.2, 489.7, 102.6, 492.4);
			ctx.bezierCurveTo(103.5, 494.9, 104.4, 497.4, 105.4, 499.8);
			ctx.bezierCurveTo(113.8, 496.6, 122.2, 493.4, 130.6, 490.2);
			ctx.bezierCurveTo(131.0, 491.3, 131.5, 492.4, 131.9, 493.5);
			ctx.bezierCurveTo(130.1, 494.3, 128.2, 495.0, 126.4, 495.8);
			ctx.bezierCurveTo(127.1, 497.7, 127.9, 499.6, 128.7, 501.5);
			ctx.bezierCurveTo(130.9, 500.6, 133.0, 499.6, 135.2, 498.7);
			ctx.bezierCurveTo(135.4, 499.2, 135.6, 499.7, 135.8, 500.2);
			ctx.bezierCurveTo(135.2, 500.5, 134.6, 500.7, 134.0, 501.0);
			ctx.bezierCurveTo(134.3, 501.7, 134.6, 502.5, 134.9, 503.2);
			ctx.bezierCurveTo(134.6, 503.2, 134.2, 503.2, 133.8, 503.3);
			ctx.bezierCurveTo(129.9, 505.0, 125.9, 506.8, 122.0, 508.5);
			ctx.bezierCurveTo(122.2, 509.0, 122.4, 509.4, 122.6, 509.9);
			ctx.bezierCurveTo(121.2, 510.7, 119.8, 511.4, 118.4, 512.2);
			ctx.bezierCurveTo(117.4, 511.7, 116.4, 511.3, 115.4, 510.8);
			ctx.bezierCurveTo(113.5, 511.8, 111.6, 512.8, 109.7, 513.8);
			ctx.bezierCurveTo(110.2, 515.2, 110.6, 516.5, 111.1, 517.8);
			ctx.bezierCurveTo(109.0, 518.8, 106.9, 519.7, 104.8, 520.7);
			ctx.bezierCurveTo(105.0, 521.8, 105.2, 522.9, 105.4, 524.0);
			ctx.bezierCurveTo(104.6, 524.6, 103.8, 525.3, 103.0, 526.0);
			ctx.bezierCurveTo(100.7, 527.2, 98.5, 528.3, 96.2, 529.5);
			ctx.bezierCurveTo(94.9, 530.6, 93.7, 531.6, 92.4, 532.7);
			ctx.bezierCurveTo(92.1, 532.2, 91.9, 531.7, 91.6, 531.1);
			ctx.bezierCurveTo(88.3, 533.1, 85.0, 535.0, 81.7, 537.0);
			ctx.bezierCurveTo(80.9, 536.8, 80.1, 536.6, 79.3, 536.5);
			ctx.bezierCurveTo(79.3, 536.4, 59.4, 548.9, 58.4, 548.5);
			ctx.bezierCurveTo(57.3, 548.1, 63.1, 545.4, 63.1, 545.4);
			ctx.bezierCurveTo(63.2, 544.0, 63.4, 542.7, 63.5, 541.4);
			ctx.bezierCurveTo(61.1, 541.7, 58.6, 541.9, 56.1, 542.2);
			ctx.bezierCurveTo(56.0, 542.0, 55.8, 541.9, 55.5, 541.7);
			ctx.bezierCurveTo(53.1, 540.1, 50.6, 542.7, 50.6, 542.7);
			ctx.bezierCurveTo(49.0, 543.0, 47.3, 543.2, 45.6, 543.4);
			ctx.bezierCurveTo(45.3, 546.1, 45.0, 548.7, 44.8, 551.4);
			ctx.bezierCurveTo(44.8, 551.4, 54.9, 549.3, 53.6, 550.8);
			ctx.bezierCurveTo(52.3, 552.4, 46.0, 555.1, 44.2, 557.3);
			ctx.bezierCurveTo(42.3, 559.5, 44.7, 559.2, 44.8, 560.2);
			ctx.bezierCurveTo(44.8, 561.1, 43.3, 560.8, 41.7, 560.7);
			ctx.bezierCurveTo(40.1, 560.7, 37.1, 561.8, 36.9, 562.3);
			ctx.bezierCurveTo(37.0, 563.2, 37.1, 564.0, 37.3, 564.9);
			ctx.bezierCurveTo(38.0, 565.5, 42.3, 562.8, 42.9, 564.0);
			ctx.bezierCurveTo(43.7, 565.6, 39.1, 565.6, 37.8, 566.6);
			ctx.bezierCurveTo(37.4, 566.9, 38.5, 568.3, 37.7, 568.7);
			ctx.bezierCurveTo(36.3, 569.2, 36.6, 563.3, 35.6, 562.8);
			ctx.bezierCurveTo(35.2, 562.6, 34.3, 563.7, 34.3, 563.7);
			ctx.bezierCurveTo(33.1, 562.1, 31.9, 560.5, 30.7, 558.9);
			ctx.bezierCurveTo(30.9, 560.4, 31.1, 562.0, 31.3, 563.5);
			ctx.bezierCurveTo(29.8, 563.2, 28.2, 562.8, 26.6, 562.5);
			ctx.bezierCurveTo(27.9, 563.6, 29.2, 564.8, 30.4, 566.0);
			ctx.bezierCurveTo(28.5, 566.3, 26.5, 566.5, 24.5, 566.8);
			ctx.bezierCurveTo(26.4, 567.5, 28.3, 568.1, 30.3, 568.8);
			ctx.bezierCurveTo(28.7, 570.1, 27.2, 571.4, 25.7, 572.7);
			ctx.bezierCurveTo(27.8, 572.0, 29.8, 571.3, 31.9, 570.6);
			ctx.bezierCurveTo(31.2, 572.6, 30.6, 574.7, 30.0, 576.7);
			ctx.bezierCurveTo(31.4, 575.1, 32.8, 573.4, 34.2, 571.8);
			ctx.bezierCurveTo(34.3, 572.4, 34.3, 573.1, 34.4, 573.7);
			ctx.bezierCurveTo(36.0, 572.7, 37.5, 571.7, 39.1, 570.7);
			ctx.bezierCurveTo(39.1, 570.7, 44.1, 566.5, 44.4, 566.9);
			ctx.bezierCurveTo(45.2, 567.8, 38.4, 572.6, 37.4, 573.1);
			ctx.bezierCurveTo(36.4, 573.7, 25.4, 580.9, 25.4, 580.9);
			ctx.bezierCurveTo(25.4, 580.9, 23.7, 581.0, 22.3, 581.5);
			ctx.bezierCurveTo(20.8, 581.9, 20.2, 584.0, 20.2, 584.0);
			ctx.bezierCurveTo(19.8, 584.2, 19.4, 584.3, 19.0, 584.5);
			ctx.bezierCurveTo(18.7, 584.1, 18.4, 583.7, 18.1, 583.3);
			ctx.bezierCurveTo(16.8, 583.8, 15.4, 584.3, 14.1, 584.9);
			ctx.bezierCurveTo(14.4, 585.6, 14.8, 586.3, 15.1, 587.0);
			ctx.bezierCurveTo(15.1, 587.0, 12.9, 586.2, 11.1, 586.9);
			ctx.bezierCurveTo(7.7, 588.4, 4.5, 592.6, 6.3, 591.8);
			ctx.bezierCurveTo(8.6, 590.8, 10.3, 592.5, 12.7, 592.3);
			ctx.bezierCurveTo(15.2, 592.1, 16.2, 589.1, 16.2, 589.1);
			ctx.bezierCurveTo(16.5, 589.8, 16.8, 590.4, 17.1, 591.0);
			ctx.bezierCurveTo(17.1, 591.0, 19.1, 589.5, 20.1, 589.0);
			ctx.bezierCurveTo(21.1, 588.5, 20.2, 586.9, 20.2, 586.9);
			ctx.bezierCurveTo(20.4, 586.6, 20.6, 586.4, 20.9, 586.1);
			ctx.bezierCurveTo(21.4, 586.2, 21.9, 586.3, 22.3, 586.4);
			ctx.bezierCurveTo(22.3, 586.4, 24.1, 585.8, 25.1, 585.2);
			ctx.bezierCurveTo(26.1, 584.7, 26.0, 583.7, 27.0, 583.2);
			ctx.bezierCurveTo(28.0, 582.6, 31.0, 581.0, 35.2, 579.4);
			ctx.bezierCurveTo(39.5, 577.8, 40.0, 574.8, 42.1, 575.4);
			ctx.bezierCurveTo(44.1, 576.0, 46.3, 576.1, 48.3, 575.0);
			ctx.bezierCurveTo(50.2, 573.9, 50.1, 569.7, 51.9, 569.1);
			ctx.bezierCurveTo(53.7, 568.5, 55.5, 570.2, 56.8, 569.4);
			ctx.bezierCurveTo(58.1, 568.7, 57.7, 566.4, 57.7, 566.4);
			ctx.bezierCurveTo(59.1, 565.6, 60.6, 564.9, 62.0, 564.1);
			ctx.bezierCurveTo(62.0, 564.1, 63.9, 564.3, 65.6, 564.3);
			ctx.bezierCurveTo(67.3, 564.3, 70.4, 562.2, 69.4, 561.1);
			ctx.bezierCurveTo(68.4, 560.1, 66.4, 559.2, 57.6, 559.7);
			ctx.bezierCurveTo(54.4, 559.8, 49.3, 560.8, 51.6, 559.6);
			ctx.bezierCurveTo(54.0, 558.4, 59.3, 557.3, 65.7, 557.3);
			ctx.bezierCurveTo(72.7, 557.3, 72.8, 560.3, 74.6, 559.7);
			ctx.bezierCurveTo(76.4, 559.0, 75.2, 556.9, 77.9, 555.5);
			ctx.bezierCurveTo(80.5, 554.1, 86.7, 552.0, 88.0, 551.2);
			ctx.bezierCurveTo(89.3, 550.5, 81.6, 549.6, 78.0, 550.1);
			ctx.bezierCurveTo(64.4, 552.0, 46.4, 559.3, 47.3, 558.6);
			ctx.bezierCurveTo(48.2, 557.8, 63.2, 551.0, 76.2, 549.0);
			ctx.bezierCurveTo(89.9, 546.7, 90.3, 549.1, 92.4, 549.1);
			ctx.bezierCurveTo(94.5, 549.1, 97.9, 545.9, 97.9, 545.9);
			ctx.bezierCurveTo(97.9, 545.8, 98.1, 542.3, 77.5, 545.7);
			ctx.bezierCurveTo(66.7, 547.3, 48.8, 556.5, 47.6, 556.6);
			ctx.bezierCurveTo(46.3, 556.5, 67.9, 546.1, 74.5, 544.8);
			ctx.bezierCurveTo(97.7, 540.3, 101.1, 543.8, 103.8, 543.3);
			ctx.bezierCurveTo(106.4, 542.6, 107.6, 543.9, 109.2, 543.0);
			ctx.bezierCurveTo(109.7, 542.8, 112.4, 541.1, 113.0, 540.7);
			ctx.bezierCurveTo(113.4, 540.4, 104.8, 526.0, 105.5, 525.7);
			ctx.bezierCurveTo(106.5, 525.1, 106.4, 524.6, 106.9, 525.2);
			ctx.bezierCurveTo(107.8, 526.6, 116.4, 542.7, 116.6, 542.7);
			ctx.bezierCurveTo(118.1, 541.8, 119.6, 541.0, 121.1, 540.1);
			ctx.bezierCurveTo(117.5, 533.8, 114.2, 527.3, 111.1, 520.8);
			ctx.bezierCurveTo(111.4, 520.5, 111.8, 520.2, 112.1, 520.0);
			ctx.bezierCurveTo(115.9, 527.7, 120.1, 535.3, 124.6, 542.8);
			ctx.bezierCurveTo(126.6, 541.6, 128.6, 540.5, 130.6, 539.3);
			ctx.bezierCurveTo(130.8, 537.9, 131.0, 536.6, 131.2, 535.2);
			ctx.bezierCurveTo(131.7, 534.9, 132.3, 534.6, 132.8, 534.4);
			ctx.bezierCurveTo(133.8, 536.0, 134.7, 537.7, 135.7, 539.3);
			ctx.bezierCurveTo(139.4, 537.1, 143.2, 534.9, 146.9, 532.6);
			ctx.bezierCurveTo(148.6, 535.5, 150.4, 538.3, 152.2, 541.1);
			ctx.bezierCurveTo(146.0, 545.1, 139.9, 549.1, 133.8, 553.1);
			ctx.bezierCurveTo(136.0, 556.6, 138.3, 559.9, 140.7, 563.3);
			ctx.bezierCurveTo(147.0, 558.8, 153.2, 554.3, 159.5, 549.8);
			ctx.bezierCurveTo(159.5, 549.8, 161.6, 550.4, 165.0, 552.7);
			ctx.bezierCurveTo(166.6, 555.2, 177.3, 554.7, 179.1, 557.1);
			ctx.bezierCurveTo(182.7, 561.8, 192.8, 562.2, 199.7, 563.1);
			ctx.bezierCurveTo(225.2, 587.2, 256.2, 605.6, 290.6, 616.2);
			ctx.bezierCurveTo(293.5, 622.2, 296.3, 627.1, 299.3, 629.2);
			ctx.bezierCurveTo(299.1, 630.6, 299.0, 632.1, 298.9, 633.5);
			ctx.bezierCurveTo(302.5, 634.3, 306.1, 634.9, 309.6, 635.5);
			ctx.bezierCurveTo(309.5, 639.8, 309.3, 644.1, 309.1, 648.4);
			ctx.bezierCurveTo(314.6, 649.3, 320.0, 650.1, 325.5, 650.7);
			ctx.bezierCurveTo(325.5, 648.7, 325.2, 646.0, 325.6, 644.4);
			ctx.bezierCurveTo(326.5, 644.7, 327.8, 644.4, 328.5, 645.0);
			ctx.bezierCurveTo(328.9, 665.7, 329.3, 686.5, 329.8, 707.2);
			ctx.bezierCurveTo(334.4, 707.7, 339.0, 708.0, 343.6, 708.3);
			ctx.bezierCurveTo(342.4, 685.4, 340.8, 662.0, 339.8, 639.5);
			ctx.bezierCurveTo(341.3, 639.8, 343.1, 639.4, 344.4, 640.0);
			ctx.bezierCurveTo(344.8, 645.6, 345.2, 651.1, 345.6, 656.8);
			ctx.bezierCurveTo(346.0, 662.3, 345.9, 668.3, 346.8, 673.6);
			ctx.bezierCurveTo(347.3, 676.2, 348.6, 679.1, 349.5, 681.8);
			ctx.bezierCurveTo(350.5, 684.7, 351.5, 687.6, 352.5, 690.0);
			ctx.bezierCurveTo(353.1, 687.5, 353.8, 684.6, 354.5, 681.7);
			ctx.bezierCurveTo(355.2, 679.0, 356.5, 676.1, 356.6, 673.3);
			ctx.bezierCurveTo(356.6, 668.0, 355.4, 661.8, 354.8, 656.2);
			ctx.bezierCurveTo(354.2, 650.6, 353.7, 645.0, 353.1, 639.2);
			ctx.bezierCurveTo(353.7, 639.4, 354.6, 638.9, 355.1, 639.4);
			ctx.bezierCurveTo(355.8, 646.0, 356.5, 652.5, 357.2, 659.0);
			ctx.bezierCurveTo(363.5, 659.0, 369.8, 658.8, 376.1, 658.3);
			ctx.bezierCurveTo(374.8, 650.1, 373.1, 641.4, 372.1, 633.6);
			ctx.bezierCurveTo(373.3, 633.7, 374.7, 633.1, 375.7, 633.6);
			ctx.bezierCurveTo(376.8, 639.9, 378.0, 646.3, 379.1, 652.6);
			ctx.bezierCurveTo(382.8, 652.3, 386.4, 651.9, 390.0, 651.4);
			ctx.bezierCurveTo(388.7, 644.8, 386.9, 637.7, 385.9, 631.5);
			ctx.bezierCurveTo(387.8, 631.4, 389.9, 630.6, 391.7, 630.9);
			ctx.bezierCurveTo(392.5, 634.4, 393.4, 638.0, 394.2, 641.5);
			ctx.bezierCurveTo(395.6, 642.0, 397.5, 640.8, 398.8, 641.2);
			ctx.bezierCurveTo(399.9, 645.2, 400.9, 649.2, 401.9, 653.2);
			ctx.bezierCurveTo(404.2, 652.8, 406.6, 652.3, 409.0, 651.9);
			ctx.bezierCurveTo(406.5, 642.4, 403.5, 632.5, 401.3, 623.4);
			ctx.bezierCurveTo(402.6, 623.3, 404.1, 622.5, 405.3, 622.8);
			ctx.bezierCurveTo(408.2, 632.6, 411.0, 642.4, 413.9, 652.3);
			ctx.bezierCurveTo(416.4, 651.7, 418.9, 651.1, 421.3, 650.5);
			ctx.bezierCurveTo(419.2, 643.4, 416.5, 635.7, 414.7, 628.9);
			ctx.bezierCurveTo(418.0, 628.2, 421.4, 626.8, 424.6, 626.4);
			ctx.bezierCurveTo(427.8, 635.4, 430.9, 644.4, 434.1, 653.5);
			ctx.bezierCurveTo(440.8, 651.5, 447.5, 649.2, 454.0, 646.7);
			ctx.bezierCurveTo(452.1, 642.1, 450.1, 637.6, 448.2, 633.0);
			ctx.bezierCurveTo(449.9, 632.5, 451.6, 631.3, 453.2, 631.3);
			ctx.bezierCurveTo(457.2, 640.2, 461.2, 649.2, 465.2, 658.2);
			ctx.bezierCurveTo(469.6, 656.4, 474.0, 654.5, 478.3, 652.4);
			ctx.bezierCurveTo(473.1, 641.5, 467.2, 630.1, 462.2, 619.4);
			ctx.bezierCurveTo(464.0, 618.8, 465.9, 617.3, 467.6, 617.1);
			ctx.bezierCurveTo(473.2, 627.9, 478.8, 638.7, 484.3, 649.5);
			ctx.bezierCurveTo(490.2, 646.6, 495.9, 643.4, 501.5, 640.1);
			ctx.bezierCurveTo(496.8, 632.0, 491.5, 623.5, 487.2, 615.6);
			ctx.bezierCurveTo(489.2, 614.5, 491.1, 613.3, 493.0, 612.0);
			ctx.bezierCurveTo(494.4, 614.2, 495.7, 616.4, 497.1, 618.6);
			ctx.bezierCurveTo(498.2, 617.9, 499.2, 617.2, 500.3, 616.5);
			ctx.bezierCurveTo(504.9, 623.7, 509.5, 630.9, 514.1, 638.2);
			ctx.bezierCurveTo(514.9, 637.6, 515.7, 637.1, 516.5, 636.6);
			ctx.bezierCurveTo(519.3, 640.3, 522.3, 644.9, 524.8, 648.3);
			ctx.bezierCurveTo(525.0, 648.5, 525.1, 648.3, 524.8, 648.0);
			ctx.bezierCurveTo(522.2, 643.9, 520.1, 640.1, 517.4, 636.0);
			ctx.bezierCurveTo(518.1, 635.5, 518.8, 635.0, 519.6, 634.5);
			ctx.bezierCurveTo(522.1, 638.1, 524.7, 641.7, 527.3, 645.4);
			ctx.bezierCurveTo(527.5, 645.7, 527.7, 646.0, 527.9, 646.2);
			ctx.bezierCurveTo(528.0, 646.4, 528.1, 646.3, 527.9, 645.9);
			ctx.bezierCurveTo(525.5, 641.9, 522.5, 637.5, 520.7, 633.7);
			ctx.bezierCurveTo(521.5, 633.1, 522.4, 632.5, 523.2, 631.9);
			ctx.bezierCurveTo(517.9, 623.9, 511.9, 615.6, 507.0, 607.8);
			ctx.bezierCurveTo(511.0, 604.8, 515.6, 601.9, 519.0, 598.5);
			ctx.bezierCurveTo(516.9, 595.5, 514.1, 592.3, 512.5, 589.6);
			ctx.bezierCurveTo(513.9, 588.4, 515.3, 587.3, 516.7, 586.1);
			ctx.bezierCurveTo(525.0, 596.7, 533.2, 607.4, 541.5, 618.0);
			ctx.bezierCurveTo(541.9, 617.9, 542.3, 617.0, 542.7, 617.3);
			ctx.bezierCurveTo(547.6, 623.6, 552.5, 629.9, 557.5, 636.2);
			ctx.bezierCurveTo(558.1, 635.8, 558.6, 634.8, 559.2, 634.9);
			ctx.bezierCurveTo(561.3, 637.6, 563.4, 640.2, 565.5, 642.8);
			ctx.bezierCurveTo(566.6, 642.2, 567.6, 639.9, 568.9, 641.1);
			ctx.bezierCurveTo(568.7, 639.5, 571.0, 637.3, 572.5, 637.8);
			ctx.bezierCurveTo(571.8, 636.4, 573.7, 635.6, 574.6, 634.6);
			ctx.bezierCurveTo(572.4, 632.0, 570.1, 629.4, 567.9, 626.8);
			ctx.bezierCurveTo(568.4, 626.3, 568.9, 625.9, 569.4, 625.4);
			ctx.bezierCurveTo(564.2, 619.3, 559.0, 613.2, 553.7, 607.1);
			ctx.bezierCurveTo(554.2, 606.7, 554.6, 606.3, 555.0, 605.9);
			ctx.bezierCurveTo(546.4, 595.9, 537.7, 585.9, 529.1, 575.8);
			ctx.bezierCurveTo(531.0, 574.3, 532.7, 571.9, 534.6, 570.8);
			ctx.bezierCurveTo(538.3, 574.8, 542.0, 578.9, 545.6, 583.0);
			ctx.bezierCurveTo(546.1, 582.7, 546.4, 581.7, 547.0, 581.9);
			ctx.bezierCurveTo(553.5, 589.1, 560.1, 596.2, 566.6, 603.4);
			ctx.bezierCurveTo(567.2, 603.6, 567.5, 602.2, 568.1, 602.5);
			ctx.bezierCurveTo(569.2, 603.4, 570.3, 604.6, 571.5, 605.9);
			ctx.bezierCurveTo(574.2, 606.5, 577.7, 603.1, 576.9, 600.1);
			ctx.bezierCurveTo(575.8, 598.8, 574.9, 597.6, 573.5, 596.3);
			ctx.bezierCurveTo(574.0, 595.8, 574.4, 595.3, 574.9, 594.8);
			ctx.bezierCurveTo(568.0, 587.7, 561.2, 580.7, 554.3, 573.7);
			ctx.bezierCurveTo(554.7, 573.2, 555.2, 572.7, 555.6, 572.2);
			ctx.bezierCurveTo(553.3, 569.9, 551.0, 567.6, 548.7, 565.3);
			ctx.bezierCurveTo(551.8, 562.1, 554.5, 558.1, 557.5, 555.1);
			ctx.bezierCurveTo(559.7, 557.1, 561.8, 559.1, 563.9, 561.1);
			ctx.bezierCurveTo(565.9, 558.6, 567.9, 556.1, 569.8, 553.5);
			ctx.bezierCurveTo(567.5, 551.3, 564.5, 549.0, 562.6, 546.9);
			ctx.bezierCurveTo(564.7, 544.0, 566.8, 541.1, 568.8, 538.1);
			ctx.bezierCurveTo(563.3, 533.5, 557.8, 529.0, 552.3, 524.5);
			ctx.bezierCurveTo(553.4, 522.8, 554.5, 521.1, 555.6, 519.3);
			ctx.bezierCurveTo(560.3, 523.0, 565.0, 526.7, 569.6, 530.4);
			ctx.bezierCurveTo(571.0, 528.3, 572.4, 526.1, 573.7, 523.9);
			ctx.bezierCurveTo(591.4, 536.8, 610.7, 551.4, 628.8, 564.9);
			ctx.bezierCurveTo(635.3, 569.9, 644.7, 576.3, 649.0, 581.1);
			ctx.bezierCurveTo(648.1, 581.3, 646.0, 580.4, 645.7, 581.1);
			ctx.bezierCurveTo(646.3, 581.2, 647.9, 582.0, 648.1, 582.5);
			ctx.bezierCurveTo(646.7, 583.3, 644.7, 581.9, 642.8, 581.0);
			ctx.bezierCurveTo(643.4, 582.7, 644.5, 584.4, 646.8, 586.0);
			ctx.bezierCurveTo(646.4, 586.1, 644.5, 585.6, 645.2, 586.4);
			ctx.bezierCurveTo(646.4, 586.6, 647.1, 588.0, 646.2, 588.8);
			ctx.bezierCurveTo(647.6, 589.6, 649.5, 587.8, 650.0, 590.1);
			ctx.bezierCurveTo(649.9, 590.6, 649.2, 588.8, 648.9, 589.7);
			ctx.bezierCurveTo(648.6, 591.0, 647.9, 592.9, 646.6, 592.9);
			ctx.bezierCurveTo(647.6, 593.2, 647.5, 593.9, 646.9, 594.6);
			ctx.bezierCurveTo(646.7, 595.2, 647.8, 596.3, 647.1, 596.5);
			ctx.bezierCurveTo(646.6, 595.5, 646.6, 596.2, 646.9, 596.8);
			ctx.bezierCurveTo(646.4, 597.8, 646.1, 596.1, 645.7, 596.8);
			ctx.bezierCurveTo(644.6, 597.6, 645.8, 599.0, 645.3, 599.2);
			ctx.bezierCurveTo(643.7, 598.0, 644.5, 600.4, 643.4, 598.1);
			ctx.bezierCurveTo(643.2, 598.7, 643.5, 599.3, 643.4, 599.8);
			ctx.bezierCurveTo(642.4, 598.6, 643.0, 597.3, 640.9, 596.1);
			ctx.bezierCurveTo(640.4, 597.7, 641.2, 600.1, 641.0, 601.3);
			ctx.bezierCurveTo(638.9, 599.0, 639.3, 596.7, 638.9, 594.4);
			ctx.bezierCurveTo(637.3, 593.2, 636.0, 591.9, 634.9, 590.7);
			ctx.bezierCurveTo(634.3, 591.3, 634.0, 592.6, 633.3, 592.7);
			ctx.bezierCurveTo(633.2, 591.5, 633.8, 590.3, 633.6, 589.2);
			ctx.bezierCurveTo(632.1, 591.1, 632.1, 593.0, 632.0, 594.9);
			ctx.bezierCurveTo(630.9, 593.6, 631.0, 590.2, 630.3, 590.0);
			ctx.bezierCurveTo(629.5, 591.4, 630.4, 593.6, 630.0, 594.5);
			ctx.bezierCurveTo(629.8, 593.5, 629.0, 592.4, 628.6, 591.2);
			ctx.bezierCurveTo(628.3, 590.1, 628.4, 588.5, 627.7, 588.3);
			ctx.bezierCurveTo(626.6, 590.2, 628.2, 592.9, 628.2, 594.3);
			ctx.bezierCurveTo(625.8, 591.5, 624.6, 588.0, 623.5, 585.7);
			ctx.bezierCurveTo(624.7, 602.4, 650.9, 615.4, 658.5, 600.7);
			ctx.bezierCurveTo(660.7, 601.8, 662.2, 600.0, 664.4, 601.1);
			ctx.bezierCurveTo(663.2, 601.8, 661.9, 601.9, 660.9, 603.6);
			ctx.bezierCurveTo(661.5, 604.4, 663.9, 604.1, 664.5, 604.9);
			ctx.bezierCurveTo(662.6, 605.9, 660.1, 604.3, 658.5, 606.4);
			ctx.bezierCurveTo(660.5, 607.5, 662.2, 607.6, 664.1, 608.1);
			ctx.bezierCurveTo(662.2, 609.3, 659.8, 608.2, 657.7, 608.0);
			ctx.bezierCurveTo(659.9, 610.1, 661.8, 611.6, 664.1, 612.8);
			ctx.bezierCurveTo(661.8, 613.2, 659.0, 611.3, 656.1, 608.8);
			ctx.bezierCurveTo(655.0, 609.8, 653.8, 610.6, 652.6, 611.4);
			ctx.bezierCurveTo(654.1, 612.7, 655.6, 613.7, 657.1, 614.4);
			ctx.bezierCurveTo(655.4, 614.5, 653.5, 613.5, 651.8, 613.0);
			ctx.bezierCurveTo(653.0, 614.8, 655.3, 615.7, 656.8, 616.5);
			ctx.bezierCurveTo(654.3, 616.8, 651.4, 615.4, 648.6, 614.2);
			ctx.bezierCurveTo(650.7, 617.2, 654.3, 617.9, 655.9, 618.6);
			ctx.bezierCurveTo(651.7, 620.2, 647.1, 620.0, 642.1, 618.0);
			ctx.bezierCurveTo(651.7, 623.7, 660.3, 622.9, 666.8, 613.4);
			ctx.bezierCurveTo(667.2, 614.4, 666.2, 615.4, 667.0, 616.4);
			ctx.bezierCurveTo(668.2, 616.9, 669.2, 617.2, 670.3, 617.5);
			ctx.bezierCurveTo(669.1, 618.0, 666.9, 617.2, 666.4, 618.2);
			ctx.bezierCurveTo(668.7, 618.9, 671.7, 619.2, 673.4, 619.5);
			ctx.bezierCurveTo(670.4, 620.1, 667.2, 619.9, 663.9, 619.0);
			ctx.bezierCurveTo(666.9, 621.9, 670.2, 621.9, 672.3, 622.5);
			ctx.bezierCurveTo(671.2, 622.9, 670.0, 623.5, 668.6, 623.7);
			ctx.bezierCurveTo(667.4, 624.0, 665.5, 623.6, 665.3, 624.4);
			ctx.bezierCurveTo(667.2, 625.7, 669.5, 625.0, 670.7, 625.2);
			ctx.bezierCurveTo(668.8, 626.8, 665.8, 627.0, 664.3, 627.5);
			ctx.bezierCurveTo(669.1, 627.9, 673.6, 626.9, 677.2, 622.3);
			ctx.bezierCurveTo(683.9, 613.7, 681.0, 602.0, 672.6, 594.8);
			ctx.bezierCurveTo(673.4, 594.4, 673.4, 593.5, 673.5, 592.7);
			ctx.bezierCurveTo(679.2, 592.1, 684.6, 589.6, 687.6, 582.2);
			ctx.bezierCurveTo(690.5, 574.9, 687.7, 566.3, 683.0, 561.3);
			ctx.bezierCurveTo(686.0, 566.1, 687.5, 572.2, 685.6, 577.4);
			ctx.bezierCurveTo(686.0, 572.5, 684.3, 567.0, 680.7, 563.4);
			ctx.bezierCurveTo(683.3, 567.4, 684.0, 571.9, 683.5, 576.5);
			ctx.bezierCurveTo(682.2, 573.8, 681.6, 571.0, 678.0, 568.8);
			ctx.bezierCurveTo(679.8, 571.9, 681.9, 575.9, 681.8, 578.8);
			ctx.bezierCurveTo(681.0, 577.3, 679.6, 575.9, 678.0, 574.5);
			ctx.bezierCurveTo(677.6, 574.8, 679.7, 577.0, 679.1, 577.3);
			ctx.bezierCurveTo(678.6, 576.6, 678.0, 575.9, 677.0, 575.3);
			ctx.bezierCurveTo(676.2, 576.8, 675.2, 577.5, 674.2, 578.2);
			ctx.bezierCurveTo(676.5, 580.4, 679.3, 582.4, 679.0, 585.0);
			ctx.bezierCurveTo(677.4, 582.9, 676.0, 580.8, 673.0, 578.9);
			ctx.bezierCurveTo(678.6, 566.9, 663.9, 548.5, 650.5, 549.4);
			ctx.bezierCurveTo(653.9, 549.6, 660.6, 553.2, 663.6, 556.8);
			ctx.bezierCurveTo(661.0, 556.1, 657.5, 555.0, 656.3, 556.8);
			ctx.bezierCurveTo(658.7, 556.7, 661.3, 557.5, 664.3, 559.1);
			ctx.bezierCurveTo(662.5, 559.1, 659.7, 558.5, 658.8, 559.6);
			ctx.bezierCurveTo(660.5, 559.7, 662.4, 560.5, 664.3, 561.2);
			ctx.bezierCurveTo(662.9, 561.2, 659.8, 560.9, 659.8, 561.8);
			ctx.bezierCurveTo(660.5, 563.2, 661.6, 564.5, 662.3, 565.9);
			ctx.bezierCurveTo(664.8, 565.6, 667.8, 564.7, 670.5, 566.7);
			ctx.bezierCurveTo(668.0, 566.5, 665.6, 566.7, 663.5, 567.6);
			ctx.bezierCurveTo(665.4, 568.1, 668.5, 568.9, 669.6, 571.0);
			ctx.bezierCurveTo(667.6, 569.9, 665.8, 569.6, 664.1, 569.4);
			ctx.bezierCurveTo(664.8, 571.5, 668.3, 572.3, 669.6, 574.4);
			ctx.bezierCurveTo(668.5, 574.1, 667.3, 573.5, 666.1, 573.1);
			ctx.bezierCurveTo(666.4, 573.9, 666.2, 576.2, 665.3, 576.1);
			ctx.bezierCurveTo(663.6, 574.1, 664.2, 571.7, 661.6, 569.8);
			ctx.bezierCurveTo(661.4, 570.4, 661.7, 572.3, 661.7, 573.4);
			ctx.bezierCurveTo(660.0, 571.9, 661.2, 574.6, 660.7, 575.3);
			ctx.bezierCurveTo(659.6, 571.4, 656.9, 567.7, 652.4, 564.3);
			ctx.bezierCurveTo(651.5, 564.1, 653.4, 566.1, 653.1, 566.9);
			ctx.bezierCurveTo(652.2, 566.3, 651.3, 565.6, 650.7, 565.9);
			ctx.bezierCurveTo(651.2, 567.5, 652.4, 569.0, 653.5, 570.6);
			ctx.bezierCurveTo(653.0, 570.2, 652.7, 570.1, 652.4, 570.1);
			ctx.bezierCurveTo(651.7, 570.9, 653.5, 572.2, 652.9, 572.5);
			ctx.bezierCurveTo(651.4, 570.5, 649.5, 568.6, 646.8, 566.8);
			ctx.bezierCurveTo(646.4, 569.1, 647.2, 571.3, 648.6, 573.5);
			ctx.bezierCurveTo(647.9, 573.0, 647.2, 572.5, 646.5, 572.0);
			ctx.bezierCurveTo(646.3, 573.7, 644.7, 572.0, 643.5, 571.6);
			ctx.bezierCurveTo(643.0, 571.9, 644.0, 572.9, 643.4, 572.7);
			ctx.bezierCurveTo(620.6, 555.9, 596.9, 538.4, 574.8, 522.0);
			ctx.bezierCurveTo(576.8, 518.6, 578.7, 515.1, 580.6, 511.6);
			ctx.bezierCurveTo(578.3, 509.9, 575.4, 508.2, 573.5, 506.6);
			ctx.bezierCurveTo(575.7, 502.5, 577.7, 498.4, 579.7, 494.2);
			ctx.bezierCurveTo(577.8, 493.1, 576.0, 492.0, 574.1, 490.8);
			ctx.bezierCurveTo(574.0, 482.0, 576.0, 474.2, 579.8, 465.6);
			ctx.bezierCurveTo(580.8, 463.2, 581.4, 459.8, 581.6, 455.8);
			ctx.bezierCurveTo(586.8, 436.6, 589.6, 416.4, 589.6, 395.6);
			ctx.bezierCurveTo(589.6, 362.1, 582.5, 330.3, 569.7, 301.5);
			ctx.bezierCurveTo(570.4, 289.7, 571.0, 280.2, 569.4, 276.6);
			ctx.bezierCurveTo(565.8, 267.6, 561.6, 253.2, 561.5, 253.2);
			ctx.bezierCurveTo(564.0, 251.4, 566.4, 249.5, 568.8, 247.7);
			ctx.bezierCurveTo(566.6, 244.6, 564.4, 241.6, 562.2, 238.6);
			ctx.bezierCurveTo(560.4, 240.0, 558.7, 241.5, 556.9, 243.0);
			ctx.bezierCurveTo(556.2, 241.9, 555.4, 240.9, 554.6, 239.9);
			ctx.bezierCurveTo(559.2, 236.0, 563.8, 232.0, 568.5, 228.1);
			ctx.bezierCurveTo(565.7, 224.5, 562.8, 221.0, 559.8, 217.5);
			ctx.bezierCurveTo(556.2, 220.9, 552.6, 224.3, 549.0, 227.7);
			ctx.bezierCurveTo(547.3, 225.7, 545.6, 223.8, 543.9, 221.9);
			ctx.bezierCurveTo(550.9, 214.9, 558.0, 208.0, 565.0, 201.0);
			ctx.bezierCurveTo(563.3, 199.1, 561.5, 197.2, 559.7, 195.3);
			ctx.bezierCurveTo(563.7, 191.2, 567.7, 187.1, 571.6, 183.0);
			ctx.bezierCurveTo(572.1, 180.7, 572.6, 178.4, 573.0, 176.1);
			ctx.bezierCurveTo(574.5, 174.5, 576.1, 172.8, 577.7, 171.1);
			ctx.bezierCurveTo(578.2, 168.4, 578.6, 165.6, 579.1, 162.8);
			ctx.bezierCurveTo(576.3, 163.5, 573.6, 164.2, 570.8, 164.9);
			ctx.bezierCurveTo(569.4, 166.5, 567.9, 168.1, 566.5, 169.8);
			ctx.bezierCurveTo(564.3, 170.3, 562.1, 170.9, 560.0, 171.5);
			ctx.bezierCurveTo(554.2, 178.1, 548.4, 184.7, 542.6, 191.3);
			ctx.bezierCurveTo(540.9, 189.8, 539.2, 188.2, 537.5, 186.7);
			ctx.bezierCurveTo(549.1, 173.0, 560.6, 159.2, 572.1, 145.4);
			ctx.bezierCurveTo(568.3, 142.0, 564.5, 138.7, 560.5, 135.6);
			ctx.bezierCurveTo(551.6, 147.1, 542.8, 158.6, 533.9, 170.2);
			ctx.bezierCurveTo(532.6, 169.2, 531.3, 168.1, 530.0, 167.1);
			ctx.bezierCurveTo(527.3, 170.8, 524.6, 174.5, 521.8, 178.2);
			ctx.bezierCurveTo(519.9, 176.7, 517.9, 175.2, 515.9, 173.7);
			ctx.bezierCurveTo(522.6, 164.3, 529.2, 155.0, 535.8, 145.6);
			ctx.bezierCurveTo(532.0, 142.8, 528.1, 140.1, 524.2, 137.4);
			ctx.bezierCurveTo(515.7, 150.7, 507.1, 163.9, 498.6, 177.1);
			ctx.bezierCurveTo(498.1, 176.7, 497.5, 176.3, 497.0, 176.0);
			ctx.bezierCurveTo(503.0, 166.6, 508.9, 157.2, 514.9, 147.9);
			ctx.bezierCurveTo(511.6, 145.7, 508.3, 143.6, 504.9, 141.6);
			ctx.bezierCurveTo(498.6, 152.3, 492.3, 163.1, 486.0, 173.8);
			ctx.bezierCurveTo(486.2, 166.2, 486.2, 158.4, 485.9, 150.6);
			ctx.bezierCurveTo(483.9, 154.3, 481.9, 158.1, 479.9, 161.8);
			ctx.bezierCurveTo(477.6, 160.5, 475.3, 159.3, 473.0, 158.2);
			ctx.bezierCurveTo(476.8, 150.6, 480.6, 143.1, 484.4, 135.5);
			ctx.bezierCurveTo(483.6, 135.2, 482.9, 134.8, 482.2, 134.4);
			ctx.bezierCurveTo(483.3, 132.2, 484.4, 130.0, 485.5, 127.7);
			ctx.bezierCurveTo(485.5, 127.7, 488.2, 121.4, 484.6, 119.6);
			ctx.bezierCurveTo(480.9, 117.9, 477.1, 124.4, 477.1, 124.4);
			ctx.bezierCurveTo(476.1, 126.5, 475.2, 128.6, 474.2, 130.7);
			ctx.bezierCurveTo(473.2, 130.2, 472.1, 129.7, 471.0, 129.2);
			ctx.bezierCurveTo(467.9, 136.2, 464.7, 143.2, 461.6, 150.2);
			ctx.bezierCurveTo(460.0, 149.5, 458.4, 148.9, 456.8, 148.2);
			ctx.bezierCurveTo(459.0, 142.9, 461.3, 137.6, 463.6, 132.3);
			ctx.bezierCurveTo(459.1, 130.4, 454.6, 128.7, 450.0, 127.0);
			ctx.bezierCurveTo(453.9, 116.6, 457.8, 106.2, 461.7, 95.8);
			ctx.bezierCurveTo(455.6, 92.4, 449.4, 89.2, 443.0, 86.1);
			ctx.bezierCurveTo(435.5, 110.3, 428.1, 134.5, 420.7, 158.7);
			ctx.bezierCurveTo(419.4, 158.3, 418.1, 157.9, 416.9, 157.6);
			ctx.bezierCurveTo(416.0, 157.3, 415.1, 157.0, 414.3, 156.7);
			ctx.bezierCurveTo(414.8, 154.7, 415.2, 152.7, 415.7, 150.8);
			ctx.bezierCurveTo(415.7, 150.8, 416.8, 150.7, 417.5, 148.4);
			ctx.bezierCurveTo(418.1, 146.2, 416.8, 145.5, 416.8, 145.5);
			ctx.bezierCurveTo(417.0, 145.5, 423.6, 101.8, 426.3, 90.7);
			ctx.bezierCurveTo(429.2, 79.6, 433.0, 64.8, 435.4, 59.0);
			ctx.bezierCurveTo(437.7, 53.3, 443.0, 39.2, 443.0, 39.2);
			ctx.bezierCurveTo(444.6, 39.6, 446.3, 40.0, 447.9, 40.4);
			ctx.bezierCurveTo(448.2, 39.1, 448.6, 37.7, 449.0, 36.4);
			ctx.bezierCurveTo(449.0, 36.3, 463.2, 38.9, 463.6, 37.9);
			ctx.bezierCurveTo(464.0, 36.7, 451.2, 30.9, 451.2, 31.0);
			ctx.bezierCurveTo(451.2, 31.0, 451.3, 29.5, 450.4, 28.1);
			ctx.bezierCurveTo(449.6, 26.6, 444.1, 24.9, 444.1, 24.9);
			ctx.bezierCurveTo(444.1, 24.9, 445.3, 21.3, 445.4, 19.7);
			ctx.bezierCurveTo(445.5, 18.2, 442.5, 17.1, 442.5, 17.1);
			ctx.bezierCurveTo(443.3, 11.4, 444.2, 5.7, 445.0, 0.0);
			ctx.bezierCurveTo(443.1, 5.5, 441.3, 10.9, 439.5, 16.4);
			ctx.closePath();

			// layer1/Compound Path/Path
			ctx.moveTo(676.7, 610.1);
			ctx.bezierCurveTo(674.9, 612.6, 671.0, 611.9, 667.8, 610.6);
			ctx.bezierCurveTo(667.9, 608.4, 670.7, 609.9, 672.5, 610.2);
			ctx.bezierCurveTo(674.4, 610.4, 675.6, 610.4, 676.7, 610.1);
			ctx.closePath();

			// layer1/Compound Path/Path
			ctx.moveTo(675.1, 606.5);
			ctx.bezierCurveTo(673.8, 608.5, 670.8, 608.3, 668.6, 608.4);
			ctx.bezierCurveTo(668.1, 607.8, 668.9, 607.0, 668.6, 606.3);
			ctx.bezierCurveTo(670.7, 606.3, 673.1, 607.2, 675.1, 606.5);
			ctx.closePath();

			// layer1/Compound Path/Path
			ctx.moveTo(646.6, 597.1);
			ctx.bezierCurveTo(647.7, 597.3, 647.2, 598.6, 647.8, 599.2);
			ctx.bezierCurveTo(647.4, 599.1, 646.5, 597.8, 646.6, 597.1);
			ctx.closePath();

			// layer1/Compound Path/Path
			ctx.moveTo(673.4, 600.2);
			ctx.bezierCurveTo(671.9, 601.1, 670.3, 601.6, 668.6, 601.8);
			ctx.bezierCurveTo(668.2, 601.0, 668.3, 600.2, 667.9, 599.5);
			ctx.bezierCurveTo(669.6, 599.3, 671.5, 599.5, 673.4, 600.2);
			ctx.closePath();

			// layer1/Compound Path/Path
			ctx.moveTo(648.7, 599.5);
			ctx.bezierCurveTo(648.3, 599.3, 647.6, 597.7, 647.6, 596.9);
			ctx.bezierCurveTo(648.3, 597.8, 648.3, 598.7, 648.7, 599.5);
			ctx.closePath();

			// layer1/Compound Path/Path
			ctx.moveTo(670.7, 596.6);
			ctx.bezierCurveTo(669.5, 596.5, 668.5, 597.0, 667.3, 596.8);
			ctx.bezierCurveTo(667.8, 596.4, 669.5, 596.1, 670.7, 596.6);
			ctx.closePath();

			// layer1/Compound Path/Path
			ctx.moveTo(676.7, 585.3);
			ctx.bezierCurveTo(675.5, 585.0, 674.4, 582.0, 672.3, 580.8);
			ctx.bezierCurveTo(672.8, 580.2, 672.5, 579.7, 672.9, 579.1);
			ctx.bezierCurveTo(675.1, 581.0, 675.9, 583.2, 676.7, 585.3);
			ctx.closePath();

			// layer1/Compound Path/Path
			ctx.moveTo(121.0, 516.0);
			ctx.bezierCurveTo(122.2, 515.4, 123.3, 514.7, 124.5, 514.1);
			ctx.bezierCurveTo(125.0, 515.1, 125.4, 516.1, 125.9, 517.0);
			ctx.bezierCurveTo(124.7, 517.6, 123.5, 518.1, 122.2, 518.6);
			ctx.bezierCurveTo(121.8, 517.7, 121.4, 516.9, 121.0, 516.0);
			ctx.closePath();

			// layer1/Compound Path/Path
			ctx.moveTo(124.1, 522.3);
			ctx.bezierCurveTo(125.2, 521.6, 126.4, 520.9, 127.5, 520.3);
			ctx.bezierCurveTo(127.7, 520.6, 127.9, 521.0, 128.0, 521.3);
			ctx.bezierCurveTo(131.0, 519.8, 134.0, 518.3, 137.0, 516.8);
			ctx.bezierCurveTo(137.3, 517.5, 137.7, 518.3, 138.1, 519.0);
			ctx.bezierCurveTo(137.3, 519.4, 136.6, 519.8, 135.8, 520.2);
			ctx.bezierCurveTo(132.4, 521.8, 129.0, 523.5, 125.5, 525.1);
			ctx.bezierCurveTo(125.0, 524.2, 124.6, 523.3, 124.1, 522.3);
			ctx.closePath();

			// layer1/Compound Path/Path
			ctx.moveTo(127.8, 528.5);
			ctx.bezierCurveTo(128.3, 528.2, 128.7, 528.0, 129.1, 527.7);
			ctx.bezierCurveTo(129.6, 528.5, 130.0, 529.3, 130.4, 530.1);
			ctx.bezierCurveTo(129.9, 530.4, 129.3, 530.6, 128.8, 530.9);
			ctx.bezierCurveTo(128.4, 530.1, 128.1, 529.3, 127.8, 528.5);
			ctx.closePath();

			// layer1/Compound Path/Path
			ctx.moveTo(372.6, 395.0);
			ctx.bezierCurveTo(372.6, 402.5, 366.5, 408.5, 359.1, 408.5);
			ctx.bezierCurveTo(351.6, 408.5, 345.6, 402.5, 345.6, 395.0);
			ctx.bezierCurveTo(345.6, 387.6, 351.6, 381.5, 359.1, 381.5);
			ctx.bezierCurveTo(366.5, 381.5, 372.6, 387.6, 372.6, 395.0);
			ctx.closePath();
			ctx.fill();

			// layer1/Guide

			// layer1/Guide
			ctx.restore();
	    },
		drawMap: function(ctx, fillstyle){
			// layer1Copy/Group
		    ctx.save();

			// layer1Copy/Group/Compound Path
			ctx.save();
			ctx.beginPath();
			ctx.fillStyle = fillstyle || '#000000';
			// layer1Copy/Group/Compound Path/Path
			ctx.moveTo(66.7, 6.7);
		      ctx.bezierCurveTo(68.4, 6.3, 68.6, 7.3, 69.7, 7.5);
		      ctx.bezierCurveTo(69.6, 8.7, 68.8, 9.5, 70.1, 10.5);
		      ctx.bezierCurveTo(69.9, 12.4, 67.0, 11.7, 66.7, 13.5);
		      ctx.bezierCurveTo(66.1, 13.4, 66.6, 12.4, 65.9, 12.4);
		      ctx.bezierCurveTo(65.9, 12.9, 65.2, 13.8, 64.8, 15.0);
		      ctx.bezierCurveTo(62.2, 15.7, 60.1, 17.8, 58.8, 21.4);
		      ctx.bezierCurveTo(59.6, 22.4, 61.1, 22.6, 61.0, 24.4);
		      ctx.bezierCurveTo(64.0, 23.5, 64.9, 27.7, 68.9, 27.1);
		      ctx.bezierCurveTo(68.6, 29.6, 69.5, 30.7, 70.5, 32.0);
		      ctx.bezierCurveTo(70.8, 31.9, 70.8, 31.6, 71.2, 31.6);
		      ctx.bezierCurveTo(70.2, 27.3, 74.8, 26.5, 72.7, 23.3);
		      ctx.bezierCurveTo(71.7, 21.7, 72.7, 20.7, 72.3, 18.0);
		      ctx.bezierCurveTo(75.6, 16.5, 77.0, 18.3, 79.5, 19.1);
		      ctx.bezierCurveTo(79.1, 19.6, 79.1, 20.5, 79.1, 21.4);
		      ctx.bezierCurveTo(80.8, 23.2, 82.5, 22.8, 82.9, 19.9);
		      ctx.bezierCurveTo(83.4, 21.4, 86.2, 24.5, 85.1, 25.2);
		      ctx.bezierCurveTo(86.1, 27.5, 89.1, 27.8, 90.4, 29.7);
		      ctx.bezierCurveTo(90.2, 31.7, 87.3, 31.1, 87.0, 33.1);
		      ctx.bezierCurveTo(85.3, 33.1, 83.5, 33.1, 81.8, 33.1);
		      ctx.bezierCurveTo(80.9, 34.1, 79.6, 34.6, 79.1, 36.1);
		      ctx.bezierCurveTo(80.2, 35.2, 81.0, 34.0, 83.3, 34.2);
		      ctx.bezierCurveTo(83.2, 35.4, 83.0, 36.8, 83.3, 37.6);
		      ctx.bezierCurveTo(83.5, 38.1, 84.3, 37.4, 85.1, 38.0);
		      ctx.bezierCurveTo(85.1, 39.3, 83.9, 37.2, 84.0, 38.4);
		      ctx.bezierCurveTo(84.8, 39.5, 86.0, 37.8, 86.3, 37.2);
		      ctx.bezierCurveTo(87.0, 37.4, 85.7, 38.3, 87.4, 38.0);
		      ctx.bezierCurveTo(85.9, 38.7, 85.0, 40.4, 82.1, 41.4);
		      ctx.bezierCurveTo(81.1, 40.4, 82.6, 39.9, 82.9, 39.1);
		      ctx.bezierCurveTo(81.5, 39.7, 76.6, 42.0, 79.1, 42.9);
		      ctx.bezierCurveTo(78.5, 43.4, 77.5, 43.5, 76.5, 43.6);
		      ctx.bezierCurveTo(77.8, 44.5, 74.2, 45.8, 74.2, 47.8);
		      ctx.bezierCurveTo(73.4, 48.0, 73.5, 47.2, 73.5, 46.6);
		      ctx.bezierCurveTo(75.6, 51.5, 67.3, 53.1, 70.5, 61.0);
		      ctx.bezierCurveTo(68.2, 60.7, 68.9, 57.5, 67.8, 56.1);
		      ctx.bezierCurveTo(66.4, 57.1, 65.5, 55.0, 63.3, 55.7);
		      ctx.bezierCurveTo(63.3, 56.2, 63.2, 56.8, 63.7, 56.8);
		      ctx.bezierCurveTo(62.4, 57.4, 58.5, 55.6, 56.5, 58.3);
		      ctx.bezierCurveTo(56.5, 62.0, 55.4, 69.9, 61.4, 68.1);
		      ctx.bezierCurveTo(62.2, 67.6, 62.3, 66.4, 62.5, 65.5);
		      ctx.bezierCurveTo(63.7, 65.5, 64.5, 64.4, 65.2, 65.1);
		      ctx.bezierCurveTo(64.7, 67.2, 64.2, 69.1, 63.7, 71.1);
		      ctx.bezierCurveTo(65.2, 71.4, 65.6, 70.6, 67.1, 70.8);
		      ctx.bezierCurveTo(67.3, 71.3, 67.7, 71.7, 68.2, 71.9);
		      ctx.bezierCurveTo(67.4, 73.9, 67.7, 77.2, 69.3, 77.9);
		      ctx.bezierCurveTo(71.1, 76.8, 72.3, 77.4, 73.1, 79.0);
		      ctx.bezierCurveTo(73.7, 76.8, 75.7, 75.9, 77.2, 74.5);
		      ctx.bezierCurveTo(78.3, 74.8, 76.7, 75.5, 77.2, 76.4);
		      ctx.bezierCurveTo(78.9, 73.2, 80.6, 78.1, 84.8, 76.4);
		      ctx.bezierCurveTo(86.0, 78.4, 87.4, 78.4, 88.9, 80.6);
		      ctx.bezierCurveTo(94.1, 79.5, 93.5, 84.3, 94.9, 86.2);
		      ctx.bezierCurveTo(96.3, 88.0, 98.1, 87.4, 99.5, 89.6);
		      ctx.bezierCurveTo(103.1, 89.2, 104.2, 91.4, 106.6, 92.2);
		      ctx.bezierCurveTo(108.7, 96.1, 105.0, 97.9, 103.6, 100.5);
		      ctx.bezierCurveTo(104.2, 105.2, 102.4, 105.8, 101.7, 109.6);
		      ctx.bezierCurveTo(99.6, 111.0, 96.6, 111.5, 95.3, 113.7);
		      ctx.bezierCurveTo(96.1, 118.8, 92.3, 118.9, 91.2, 122.8);
		      ctx.bezierCurveTo(89.3, 123.1, 88.6, 122.3, 87.8, 121.6);
		      ctx.bezierCurveTo(87.9, 123.0, 89.0, 123.5, 89.3, 124.6);
		      ctx.bezierCurveTo(89.1, 126.9, 87.1, 127.3, 84.8, 127.3);
		      ctx.bezierCurveTo(84.8, 128.3, 84.9, 129.4, 84.4, 129.9);
		      ctx.bezierCurveTo(83.3, 130.2, 83.4, 129.4, 82.5, 129.5);
		      ctx.bezierCurveTo(82.6, 130.4, 82.8, 131.3, 84.0, 131.0);
		      ctx.bezierCurveTo(82.4, 132.1, 82.2, 134.5, 80.6, 135.6);
		      ctx.bezierCurveTo(80.5, 136.8, 81.8, 136.6, 82.1, 137.4);
		      ctx.bezierCurveTo(81.1, 138.8, 80.2, 140.3, 79.1, 141.6);
		      ctx.bezierCurveTo(80.0, 142.9, 78.7, 144.8, 82.1, 145.7);
		      ctx.bezierCurveTo(79.0, 148.6, 77.0, 145.8, 74.2, 143.1);
		      ctx.bezierCurveTo(74.3, 142.0, 74.9, 141.5, 75.0, 140.5);
		      ctx.bezierCurveTo(73.9, 142.3, 74.3, 139.5, 74.2, 138.2);
		      ctx.bezierCurveTo(74.7, 137.7, 74.8, 138.1, 75.4, 138.2);
		      ctx.bezierCurveTo(75.5, 137.2, 75.5, 136.3, 74.2, 136.7);
		      ctx.bezierCurveTo(74.8, 135.3, 75.5, 134.0, 76.5, 132.9);
		      ctx.bezierCurveTo(76.4, 132.5, 75.8, 132.6, 75.4, 132.5);
		      ctx.bezierCurveTo(75.0, 130.2, 76.9, 128.1, 75.7, 126.1);
		      ctx.bezierCurveTo(77.9, 120.6, 79.0, 110.5, 78.0, 104.3);
		      ctx.bezierCurveTo(72.2, 103.6, 74.0, 95.5, 69.7, 93.4);
		      ctx.bezierCurveTo(69.7, 92.8, 69.9, 91.9, 69.3, 91.9);
		      ctx.bezierCurveTo(69.7, 91.4, 69.7, 90.5, 70.5, 90.3);
		      ctx.bezierCurveTo(67.8, 87.0, 76.0, 82.2, 71.2, 77.9);
		      ctx.bezierCurveTo(70.5, 81.0, 68.2, 77.7, 65.9, 77.2);
		      ctx.bezierCurveTo(65.9, 76.2, 65.7, 74.7, 66.7, 75.7);
		      ctx.bezierCurveTo(66.2, 74.6, 64.8, 75.5, 64.8, 73.4);
		      ctx.bezierCurveTo(62.7, 74.2, 60.9, 71.8, 59.5, 70.8);
		      ctx.bezierCurveTo(55.4, 71.5, 52.5, 69.1, 50.1, 67.0);
		      ctx.bezierCurveTo(49.9, 60.8, 44.9, 59.4, 43.7, 54.2);
		      ctx.bezierCurveTo(43.2, 54.6, 43.1, 54.3, 42.6, 54.2);
		      ctx.bezierCurveTo(43.6, 57.6, 45.6, 60.0, 46.7, 63.2);
		      ctx.bezierCurveTo(44.6, 62.5, 44.9, 59.3, 42.6, 58.7);
		      ctx.bezierCurveTo(42.9, 58.3, 43.1, 57.7, 43.0, 56.8);
		      ctx.bezierCurveTo(40.2, 52.7, 36.9, 49.3, 35.0, 45.1);
		      ctx.bezierCurveTo(35.3, 42.4, 35.3, 37.4, 35.0, 35.3);
		      ctx.bezierCurveTo(34.0, 34.5, 33.2, 33.4, 31.6, 33.1);
		      ctx.bezierCurveTo(33.4, 30.1, 29.9, 30.5, 30.1, 27.4);
		      ctx.bezierCurveTo(26.1, 27.2, 24.9, 19.2, 19.2, 20.6);
		      ctx.bezierCurveTo(18.2, 19.9, 16.8, 18.9, 16.2, 18.8);
		      ctx.bezierCurveTo(15.3, 18.9, 16.2, 20.2, 16.6, 20.3);
		      ctx.bezierCurveTo(15.5, 19.9, 14.3, 21.1, 12.8, 21.4);
		      ctx.bezierCurveTo(13.0, 20.2, 12.9, 18.7, 14.3, 18.8);
		      ctx.bezierCurveTo(13.0, 17.7, 12.6, 20.8, 10.9, 20.6);
		      ctx.bezierCurveTo(10.9, 21.3, 11.4, 21.4, 11.3, 22.2);
		      ctx.bezierCurveTo(8.9, 23.7, 6.7, 26.4, 4.5, 27.1);
		      ctx.bezierCurveTo(4.5, 25.6, 8.4, 24.7, 8.7, 22.2);
		      ctx.bezierCurveTo(7.5, 22.3, 6.2, 21.1, 4.9, 22.2);
		      ctx.bezierCurveTo(4.5, 20.2, 1.9, 20.4, 1.5, 18.4);
		      ctx.bezierCurveTo(1.6, 16.0, 4.2, 16.3, 5.7, 15.4);
		      ctx.bezierCurveTo(5.6, 15.1, 5.3, 15.0, 5.3, 14.6);
		      ctx.bezierCurveTo(4.1, 14.0, 0.2, 15.0, 0.0, 12.4);
		      ctx.bezierCurveTo(1.8, 12.8, 1.5, 11.1, 3.0, 11.2);
		      ctx.bezierCurveTo(3.0, 11.6, 3.0, 12.0, 3.0, 12.4);
		      ctx.bezierCurveTo(3.6, 12.4, 4.3, 12.4, 4.9, 12.4);
		      ctx.bezierCurveTo(4.7, 12.1, 4.5, 11.7, 4.5, 11.2);
		      ctx.bezierCurveTo(3.2, 10.4, 1.2, 10.3, 1.1, 8.2);
		      ctx.bezierCurveTo(4.7, 8.0, 5.0, 4.6, 8.7, 4.4);
		      ctx.bezierCurveTo(12.7, 6.4, 21.1, 5.0, 24.9, 7.8);
		      ctx.bezierCurveTo(27.0, 6.2, 30.6, 7.4, 31.6, 4.8);
		      ctx.bezierCurveTo(32.6, 5.7, 34.0, 6.2, 34.7, 7.5);
		      ctx.bezierCurveTo(35.6, 5.7, 40.7, 8.4, 43.3, 9.0);
		      ctx.bezierCurveTo(43.2, 9.4, 42.6, 9.2, 42.6, 9.7);
		      ctx.bezierCurveTo(44.3, 10.8, 47.3, 8.6, 47.5, 11.6);
		      ctx.bezierCurveTo(47.8, 10.2, 48.2, 9.8, 47.5, 8.6);
		      ctx.bezierCurveTo(48.4, 8.5, 48.9, 8.0, 50.1, 8.2);
		      ctx.bezierCurveTo(51.0, 10.4, 54.8, 10.7, 56.5, 9.0);
		      ctx.bezierCurveTo(57.4, 9.2, 57.2, 10.6, 57.6, 11.2);
		      ctx.bezierCurveTo(58.6, 9.5, 59.2, 8.8, 59.9, 7.5);
		      ctx.bezierCurveTo(58.6, 7.7, 55.8, 5.4, 58.8, 3.7);
		      ctx.bezierCurveTo(58.6, 2.6, 58.2, 1.7, 58.0, 0.7);
		      ctx.bezierCurveTo(59.2, -0.4, 60.8, 0.1, 62.5, 0.3);
		      ctx.bezierCurveTo(62.5, 1.9, 61.3, 2.4, 59.5, 2.2);
		      ctx.bezierCurveTo(59.6, 2.7, 59.6, 3.3, 59.2, 3.3);
		      ctx.bezierCurveTo(59.7, 4.3, 60.4, 5.0, 61.8, 5.2);
		      ctx.bezierCurveTo(61.7, 5.9, 61.5, 6.5, 61.0, 6.7);
		      ctx.bezierCurveTo(61.4, 7.7, 63.1, 7.4, 62.5, 9.3);
		      ctx.bezierCurveTo(63.8, 9.3, 62.8, 7.1, 64.4, 7.5);
		      ctx.bezierCurveTo(64.3, 9.1, 63.5, 10.7, 65.6, 10.9);
		      ctx.bezierCurveTo(64.8, 10.1, 67.9, 9.1, 66.7, 6.7);
		      ctx.closePath();

		      // layer1Copy/Group/Compound Path/Path
		      ctx.moveTo(36.2, 11.2);
		      ctx.bezierCurveTo(35.6, 12.6, 37.4, 11.5, 37.3, 12.4);
		      ctx.bezierCurveTo(36.5, 12.5, 36.3, 13.5, 36.5, 14.2);
		      ctx.bezierCurveTo(39.0, 13.1, 37.9, 13.8, 40.3, 13.1);
		      ctx.bezierCurveTo(40.3, 12.7, 40.3, 12.4, 40.3, 12.0);
		      ctx.bezierCurveTo(38.1, 12.4, 39.7, 11.2, 38.4, 10.9);
		      ctx.bezierCurveTo(37.9, 11.4, 36.6, 11.7, 36.2, 11.2);
		      ctx.closePath();

		      // layer1Copy/Group/Compound Path/Path
		      ctx.moveTo(41.1, 18.8);
		      ctx.bezierCurveTo(43.4, 19.8, 45.6, 17.6, 46.7, 16.1);
		      ctx.bezierCurveTo(45.4, 17.7, 42.9, 16.9, 42.2, 16.5);
		      ctx.bezierCurveTo(44.0, 17.7, 41.4, 17.7, 41.1, 18.8);
		      ctx.closePath();

		      // layer1Copy/Group/Compound Path/Path
		      ctx.moveTo(57.6, 32.3);
		      ctx.bezierCurveTo(57.0, 30.9, 56.5, 29.4, 55.8, 28.2);
		      ctx.bezierCurveTo(54.0, 29.4, 57.7, 31.8, 57.6, 32.3);
		      ctx.closePath();

		      // layer1Copy/Group/Compound Path/Path
		      ctx.moveTo(61.4, 37.2);
		      ctx.bezierCurveTo(62.8, 38.0, 63.0, 36.6, 64.4, 36.5);
		      ctx.bezierCurveTo(63.3, 37.5, 66.0, 38.0, 66.7, 37.2);
		      ctx.bezierCurveTo(66.8, 37.5, 66.7, 38.0, 67.1, 38.0);
		      ctx.bezierCurveTo(67.5, 36.1, 65.6, 36.5, 65.6, 35.0);
		      ctx.bezierCurveTo(63.3, 34.9, 62.6, 36.2, 61.4, 37.2);
		      ctx.closePath();

		      // layer1Copy/Group/Compound Path/Path
		      ctx.moveTo(64.8, 38.7);
		      ctx.bezierCurveTo(65.1, 40.4, 63.5, 42.5, 65.2, 43.3);
		      ctx.bezierCurveTo(65.8, 41.6, 65.3, 38.8, 67.4, 38.7);
		      ctx.bezierCurveTo(67.8, 39.9, 68.2, 41.0, 68.9, 41.7);
		      ctx.bezierCurveTo(69.3, 40.9, 69.5, 39.0, 70.8, 40.2);
		      ctx.bezierCurveTo(70.7, 37.2, 66.8, 38.2, 64.8, 38.7);
		      ctx.closePath();

		      // layer1Copy/Group/Compound Path/Path
		      ctx.moveTo(67.8, 43.3);
		      ctx.bezierCurveTo(69.9, 43.9, 71.9, 41.4, 73.8, 40.6);
		      ctx.bezierCurveTo(71.2, 40.8, 70.0, 42.6, 67.8, 43.3);
		      ctx.closePath();
		      ctx.fill();
		      ctx.restore();
		}
	}
}

$(document).ready(function(){
	
	CLOCK.app.init();
	
});