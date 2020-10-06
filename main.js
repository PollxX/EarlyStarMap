//initialisation of variables
var map, scene, camera, renderer, controls, horizon, azmGrid, equGrid, dateString, ephemeris, planetLoop, planetDate;
var sun, moon, mercury, venus, mars, jupiter, saturn, neptune, uranus;
var scaleVector = new THREE.Vector3();
var orbitters = [];
var modifier = 1;

//defaults for menu options
var invertControls = false;
var locationSet = false;
var aspect = window.innerWidth / window.innerHeight;

//button and input controller
var resetFOV = document.querySelector("button[id=resetFOV]");
var increaseFOV = document.querySelector("button[id=increaseFOV]");
var decreaseFOV = document.querySelector("button[id=decreaseFOV]");
var focusObj = document.querySelector("input[id=focusObj]");

var inversion = document.querySelector("input[id=inversion]");
var hideAzmuthal = document.querySelector("input[id=hideAzmuthal]");
var hideEquatorial = document.querySelector("input[id=hideEquatorial]");
var hideHorizon = document.querySelector("input[id=hideHorizon]");
var hideTrails = document.querySelector("input[id=hideTrails]");

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

//for now take current time for start of simulation
var dateNow = null;
var paused = document.querySelector("button[id=paused]");
var printDate = $("#date");
var printLatLng = $("#LatLng");
var loop = null;
var dateInUse = new Date();
$("#mult").val($("#slider").val());
//var pauseTime = true;
//var multiplier = 0.000000001; //0.00000001

var trial = true; //for viva purposes only, to prevent overuse of api (limited to 2000 uses)
var desc = $("#desc");

//eventlisteners
//alternative method, use of buttons for changing fov
function startListeners(){
	/*timeMultiplier.addEventListener( 'input', function(){
		multiplier = timeMultiplier.value / 100000000; //100000000
		//console.log(multiplier);
	});*/
	
	focusObj.addEventListener( 'input', function(){
		alert("not currently implemented");
		/*var object = focusObj.value;
		camera.lookAt( object.position );*/
	});
	
	resetFOV.addEventListener( 'click', function(){
		camera.fov = 70;
		camera.updateProjectionMatrix();
		document.getElementById('fovoutput').innerHTML = "FOV: "+camera.fov;
	});
	increaseFOV.addEventListener( 'click', function(){
		if (camera.fov < 127){
			camera.fov += 4;
			camera.updateProjectionMatrix();
			document.getElementById('fovoutput').innerHTML = "FOV: "+camera.fov;
		}
	});
	decreaseFOV.addEventListener( 'click', function(){
		if (camera.fov > 10){
			camera.fov -= 4;
			camera.updateProjectionMatrix();
			document.getElementById('fovoutput').innerHTML = "FOV: "+camera.fov;
		}
	});

	//toggle of control scheme method
	inversion.addEventListener( 'change', function() {
		if(this.checked) {
			invertControls = true;
		} else {
			invertControls = false;
		}
	});

	//toggle for timescale pausing of simulation
	/*paused.addEventListener( 'click', function(){
		if(!pauseTime){
			pauseTime = true;
			document.getElementById('paused').innerHTML = "Unpause";
		} else {
			pauseTime = false;
			document.getElementById('paused').innerHTML = "Pause";
		}
	});*/

	hideAzmuthal.addEventListener( 'change', function(){
		if (azmGrid.visible){
			azmGrid.visible = false;
		} else {
			azmGrid.visible = true;
		}
	});
	hideEquatorial.addEventListener( 'click', function(){
		if (equGrid.visible){
			equGrid.visible = false;
		} else {
			equGrid.visible = true;
		}
	});

	hideHorizon.addEventListener( 'click', function(){
		if (horizon.visible){
			horizon.visible = false;
		} else {
			horizon.visible = true;
		}
	});
	
	hideTrails.addEventListener( 'click', function(){
		if (hideTrails.checked){
			ephemeris.visible = false;
			
		} else {
			ephemeris.visible = true;
			
		}
	});
}

function init(){
	//setup of scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x87CEFA);
	camera = new THREE.PerspectiveCamera( 70, aspect, 1, 9999 );
	camera.position.set(1, 0, 0);
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
	
	//creates:    			 		name,			size/radius, 	orbit,		speed,	    inc,		colour
	sun = createObject(				"Sun", 			30, 			1000,		1.00, 		1, 			0xf1a034);
	mercury = createObject(			"Mercury", 		5,  			1100,		1.01, 		1, 			0xc9c8c7);
	venus = createObject(			"Venus", 		5,  			1150, 		1.02, 		1, 			0xf2d79e);
	moon = createObject(			"Moon", 		25,				900,		1.50, 		1, 			0xd9d9d9);
	mars = createObject(			"Mars", 		5,				1200,		1.03, 		1, 			0xe97b56);
	jupiter = createObject(			"Jupiter", 		5,  			1250,		1.04, 		1, 			0xa27f5d);
	saturn = createObject(			"Saturn", 		5,  			1300, 		1.05, 		1, 			0xe5bf57);
	uranus = createObject(			"Uranus", 		5,  	 		1350,		1.06, 		1, 			0x99c3c4);
	neptune = createObject(			"Neptune", 		5,  	 		1400, 		1.07, 		1, 			0x527fdb);
	
	//creates rendered object
	function createObject(name, radius, orbit, speed, inclination, colour) {
		var objGeo = new THREE.SphereGeometry( radius, 32, 32 );
		var objMat = new THREE.MeshBasicMaterial({color: colour, side: THREE.DoubleSide});
		var orbitter = new THREE.Mesh(objGeo, objMat);
		orbitter.userData.name = name;
		orbitter.userData.orbit = orbit;
		orbitter.userData.speed = speed;
		orbitter.userData.highlight = true;
		//orbitter.userData.clicked = false; //for mouse click on orbitting objects
	
		//renders tags for objects
		var canvas = document.createElement('canvas');
		canvas.setAttribute("id", "canvas");
		canvas.width = 256;
		canvas.height = 256;
		var canvasText = canvas.getContext("2d");
		canvasText.font = "40pt Arial";
		canvasText.fillStyle = "white";
		canvasText.textAlign = "center";
		canvasText.fillText(name, 128, 45);
		
		var tex = new THREE.Texture(canvas);
		tex.needsUpdate = true;
		var spriteMat = new THREE.SpriteMaterial({
		  map: tex
		});
		var sprite = new THREE.Sprite(spriteMat);
		
		orbitter.add(sprite);
		orbitters.push(orbitter);
		scene.add(orbitter);
		
		//orbitting system, the lines that show path
		var shape = new THREE.Shape();
		shape.moveTo(orbit, 0);
		//attempt to work objects to orbit sun (unsuccessful)
		if (orbitter.userData.name != "Sun" && orbitter.userData.name != "Moon"){
			//console.log(name);
			shape.absarc(sun.position.x, sun.position.y, orbit/2, 0, 2 * Math.PI, false);
			} else {
			//x:Float, y:Float, radius:Float, startAngle:Float, endAngle:Float, clockwise:Boolean
			shape.absarc(0, -4, orbit, 0, 2 * Math.PI, false);
			//console.log(name);
		}
		
		if(name == "Sun"){ //makes trial follow sun's movement
			var spacedPoints = shape.createSpacedPointsGeometry(128);
			spacedPoints.rotateX(THREE.Math.degToRad(45));
			ephemeris = new THREE.Line(spacedPoints, new THREE.LineBasicMaterial({
			  color: 0xf1a020
			}));
			scene.add(ephemeris);			
			
			var compassGeo = new THREE.CubeGeometry( 2, 32, 32 );
			var compassMat = new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0.95});
			var compassNMat = new THREE.MeshBasicMaterial({color: 0xff0505, opacity: 0.95});
			
			north = new THREE.Mesh(compassGeo,compassNMat);
			east = new THREE.Mesh(compassGeo,compassMat);
			south = new THREE.Mesh(compassGeo,compassMat);
			west = new THREE.Mesh(compassGeo,compassMat);
			
			scene.add(north);
			north.position.set( 0, 0, -5000);
			north.rotateY(1.570796);
			
			scene.add(east);
			east.position.set( 5000, 0, 0);
			
			scene.add(south);
			south.position.set( 0, 0, 5000);
			south.rotateY(1.570796);
			
			scene.add(west);
			west.position.set( -5000, 0, 0);
			
		}
		
		return orbitter;
	};
	
	/*old rendering sun
	var sunGeo = new THREE.SphereGeometry( 10, 32, 32 );
	var sunMat = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide});
	sun = new THREE.Mesh(sunGeo,sunMat);
	scene.add(sun);
	sun.position.set( 999, 0, 0);

	old rendering moon
	var moonGeo = new THREE.SphereGeometry( 5, 32, 32 );
	var moonMat = new THREE.MeshBasicMaterial({color: 0xAEa0f0, side: THREE.DoubleSide});
	moon = new THREE.Mesh(moonGeo,moonMat);
	scene.add(moon);
	moon.position.set( 999, 0, 0);
	*/

	//rendering of horizon
	var horGeo = new THREE.CircleGeometry( 100, 64 );
	var horMat = new THREE.MeshBasicMaterial({color: 0x8B4513, transparent: true, opacity: 0.5, side: THREE.DoubleSide});
	horizon = new THREE.Mesh(horGeo,horMat);
	scene.add(horizon);
	horizon.position.set( 0, -4, 0);
	//rotated 90 degrees -> 1.570796 radians
	horizon.rotateX(1.570796);
	//could have used this...  THREE.Math.degToRad(90)  !

	//(in radians) 2 argument arctangent
	//cartographicalAzimuth = atan2(X2 -X1, Y2 - Y1)

	//rendering Azimuthal and Equatorial grids
	var azmGeo = new THREE.SphereGeometry( 100, 24, 10 );
	var azmMat = new THREE.MeshBasicMaterial( {color: 0xff0000, transparent: true, opacity: 0.1, side: THREE.DoubleSide, wireframe: true} );
	azmGrid = new THREE.Mesh(azmGeo,azmMat);
	scene.add(azmGrid);
	//should point, not north -- todo
	var equGeo = new THREE.SphereGeometry( 100, 24, 10 );
	var equMat = new THREE.MeshBasicMaterial( {color: 0x009900, transparent: true, opacity: 0.1, side: THREE.DoubleSide, wireframe: true} );
	equGrid = new THREE.Mesh(equGeo,equMat);
	scene.add(equGrid);
	//equatorial grid depends on user location...

	window.addEventListener( 'resize', onWindowResize, false );
	createControls( camera );
	render();
	startListeners();
	window.addEventListener( 'mousemove', onMouseMove, false );
	window.requestAnimationFrame(render);
}

var standardRotationX = 1.570796; //see line 220

//could have used this...  THREE.Math.degToRad(90)  etc!
function rotateEqu(currentLAT, currentLNG){
	//	radians     <= 			degrees
	var newRotationX = currentLAT * (Math.PI / 180);
	equGrid.rotation.x = standardRotationX + newRotationX;
	ephemeris.rotation.x = newRotationX - 0.7853982;
	modifier = newRotationX;
	//console.log(modifier);
	printLatLng.html("Latitude: "+currentLAT+", Longitude: "+currentLNG);
}

/*function timer(){ //old timer
	// todo: timer allows for rendering at specific timing
	// must have controls of forwards and backwards, pause and play
	if (!pauseTime){
		//if unpaused, for now run the timer
		dateString = new Date(timestamp).toUTCString();
		
		dateNow = dateNow + (1 * multiplier);
		//console.log(dateNow);

		document.getElementById('time').innerHTML = dateString;
		//rotate objects as necessary and temp position func to be replaced
		//positions();
		skycolour();
	}
}
function positions(){ //old positioning of objects
	object.position.x = Math.cos(timestamp * speed) * orbit;
	object.position.y = Math.sin(timestamp * speed) * orbit;
	object.position.z = Math.sin(timestamp * speed) * orbit;
	moon.position.x = Math.cos(dateNow * 0.0338) * 100;
	moon.position.y = Math.sin(dateNow * 0.0338) * 100;
	moon.position.z = Math.sin(dateNow * 0.0338) * 100;
	sun.position.x = Math.cos(dateNow * 1) * 200;
	sun.position.y = Math.sin(dateNow * 1) * 200;
	sun.position.z = Math.sin(dateNow * 1) * 200;
	//console.log("x "+sun.position.x+" y "+sun.position.y+" z "+sun.position.z);
}*/

function skycolour(){
	if (sun.position.y > -20){
		scene.background = new THREE.Color(0x87CEFA);
	} else {
		scene.background = new THREE.Color(0x000000);
	}
}

//animation and taking controls
function animate() {
    //timer();
    skycolour();
    requestAnimationFrame(animate);

    //change this depending on fov?
    if (!invertControls){
        controls.rotateSpeed = -0.5;
    } else {
        controls.rotateSpeed = 0.5;
    }
    controls.update();

    orbitters.forEach(function(orbitter){
        var scaleFactor = 8;
        var sprite = orbitter.children[0];
        var scale = scaleVector.subVectors(orbitter.position, camera.position).length() / scaleFactor;
        sprite.scale.set(scale, scale, 1);
        var orbit = orbitter.userData.orbit;
        var speed = orbitter.userData.speed/86400000; //milliseconds in a day
        //var offset = orbitter.userData.inclination; //unused
        if(modifier == 0){
            modifier = 0.000001
        }
		orbitter.position.x = (Math.cos((planetDate * speed)) * orbit);
		orbitter.position.z =  Math.sin(modifier) * Math.sin((planetDate * speed)) * orbit;
		orbitter.position.y =  Math.sin(modifier - 1.5708) * -Math.sin((planetDate * speed)) * orbit -4;
        //console.log(orbitters[0].position.y);
    });
    render();
}

var descriptions = [];
function apiSetup(inputName){
	//console.log(inputName);
	$.ajax({
		type: "GET",
		url: "https://cors-anywhere.herokuapp.com/http://api.wolframalpha.com/v2/query?input="+inputName+"&appid=2Y738H-5R3YU6R3TV",
		cache: false,
		dataType: "xml",
		success: function(data) {
			subPods = $(data).find("img");
			for(k = 0; k < subPods.length; k++){
				if(subPods[k].parentElement.parentElement.id.includes("WikipediaSummary")){
					answerString = subPods[k].getAttribute("alt");
					//console.log(answerString);
					firstFullStop = answerString.indexOf(".");
					secondFullStop = answerString.indexOf(".", firstFullStop+1);
					thirdFullStop = answerString.indexOf(".", secondFullStop+1); //didn't always work as some Summarys had ... (elipses)
					//console.log(secondFullStop);
					if (inputName == "Planet Mercury"){
						descriptions.push({name: inputName, desc: answerString.substr(0,thirdFullStop+1)});
					} else {
						descriptions.push({name: inputName, desc: answerString.substr(0,secondFullStop+1)});
					}
					//console.log(descriptions.length);
				}
			}
		}
	});
}

//renders scene
var checker = true;
var loaded = false;
function render(){
	if (checker){
		rotateEqu(0,0);
		if (trial){
			for (var i = 0; i < scene.children.length; i++){
				if (scene.children[i].userData.name != undefined){
					if (scene.children[i].userData.name == "Mercury"){
						apiSetup("Planet Mercury"); //because the element is a thing...
					}
					//console.log(scene.children[i].userData.name);
					apiSetup(scene.children[i].userData.name);
				}
			}
		}
		checker = false;
	}
	if (!loaded){
		if (descriptions.length == 8 && descriptions[8] != null){
			alert("Wolfram Alpha API has fully loaded.");
			loaded = true;
		}
	}
	raycaster.setFromCamera( mouse, camera );
	var intersects = raycaster.intersectObjects(scene.children);
	if ( intersects.length > 0 && intersects.length < 6 ){
		for ( var i = 0; i < intersects.length; i++ ) {
			if (intersects[i].object.userData.highlight == true){ //&& intersects[i].object.userData.highlight == true
				//console.log( intersects[ i ].object.userData.name ); //test change colour
				intersects[ i ].object.material.color.set( 0xff0000 );
				if (trial){ //to stop unnecessary requests to Wolfram Alpha API (limited to 2000)
					for (var ii = 0; ii < descriptions.length; ii++){
						//console.log(intersects[i].object.userData.name + " " + descriptions[ii].includes(intersects[i].object.userData.name));
						if (descriptions[ii].name == intersects[i].object.userData.name || (intersects[i].object.userData.name == "Mercury" && descriptions[ii].name == "Planet Mercury")){//need to get planet by name, but is misordered in "descriptions"
							$("#desc").html(descriptions[ii].desc);
							break;
						} else {
							$("#desc").html(intersects[i].object.userData.name+" has been highlighted.\nAPI hasn't properly loaded or an error has occured.");
						}
					}
				} else {
					$("#desc").html(intersects[i].object.userData.name+" has been highlighted.");
				}
			} else {
				//console.log("colours reset");
				$("#desc").html("No object highlighted.");
				sun.material.color.set(0xf1a034);
				mercury.material.color.set(0xc9c8c7);
				venus.material.color.set(0xf2d79e);
				moon.material.color.set(0xd9d9d9);
				mars.material.color.set(0xe97b56);
				jupiter.material.color.set(0xa27f5d);
				saturn.material.color.set(0xe5bf57);
				uranus.material.color.set(0x99c3c4);
				neptune.material.color.set(0x527fdb);
				/*ephemeris.material.color.set(0xf1a020);
				horMat.material.color.set(0x8B4513);
				azmMat.material.color.set(0xff0000);
				equMat.material.color.set(0x009900);*/
			}
		}
	} else {
		intersects = null;
	}
	renderer.render( scene , camera );
}

//creates orbit style controls for user
function createControls( camera ) {
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	//necessary to disable these as they move the camera rather than effect the camera.FOV
	controls.zoomSpeed = 0;
	controls.panSpeed = 0;
	controls.rotateSpeed = 0.5;

	window.addEventListener( 'wheel', function(event){
		//stops scrolling
		event.preventDefault();
		if (!event.ctrlKey){
			if (event.deltaY < 0){
				if (camera.fov > 10){
					camera.fov -= 2;
					camera.updateProjectionMatrix();
					document.getElementById('fovoutput').innerHTML = "FOV: "+camera.fov;
				}
			} else if (event.deltaY > 0){
				//Note: fov gets very weird after ~130
				if (camera.fov < 130){
					camera.fov += 2;
					camera.updateProjectionMatrix();
					document.getElementById('fovoutput').innerHTML = "FOV: "+camera.fov;
				}
			}
		}
	});

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	controls.keys = [ 65, 83, 68 ];

	controls.addEventListener( 'change', render );
}

//when user resizes the screen, camera will auto update
function onWindowResize() {
	camera.aspect = aspect;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	render();
}

//todo: look into three.raycaster for interactions with rendered objects
function onMouseMove( event ) {
	mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
}

//test of input receive on object
/*function sunAlert(){
	alert("you clicked "+this.name);
}*/

$("#go").click(function(){
	$("#pause").click();
	var dateChosen = $("#dateInput").val();
	var dateTimeSplit = dateChosen.split("T");

	var year = dateTimeSplit[0].split("-")[0];
	var month = dateTimeSplit[0].split("-")[1];
	var day = dateTimeSplit[0].split("-")[2];
	var hour = dateTimeSplit[1].split(":")[0];
	var min = dateTimeSplit[1].split(":")[1];
	var seconds = 0;
	
	dateInUse.setDate(day);
	dateInUse.setFullYear(year);
	dateInUse.setHours(hour);
	dateInUse.setSeconds(seconds);
	dateInUse.setMonth(month - 1);
	dateInUse.setMinutes(min);
	
	$("#play").click();
});

$("#slider").change(function(){
	//console.log("change");
	$("#mult").val($("#slider").val());
	$("#pause").click();
	$("#play").click();
});

$("#mult").change(function(){
	//console.log("change");
	$("#slider").val($("#mult").val());
	$("#pause").click();
	$("#play").click();
});

$("#pause").click(function(){
	clearInterval(planetLoop);
	$("#resetScale").hide();
});

$("#play").click(function(){
	$("#resetScale").show();
	clearInterval(planetLoop);
	printDate.html(dateInUse);
	
	planetLoop = setInterval(function(){
		printDate.html(dateInUse);
		dateInUse.setMilliseconds(dateInUse.getMilliseconds() + (1 * $("#mult").val()))
		planetDate = dateInUse;
	}, 1);
});

$("#now").click(function(){
	if (locationSet == false){
		alert("Don't forget to set a custom location, it defaults to the equator!\nTry double clicking the map, you can drag to edit the pin if you want!");
	}
	$("#resetScale").show();
	$("#mult").val(1);
	$("#slider").val(1);
	clearInterval(planetLoop);
	$("#now").html("Now");
	dateNow = new Date();
	printDate.html(dateNow);
	dateInUse = dateNow;
	
	planetLoop = setInterval(function(){
		dateNow = new Date();
		printDate.html(dateNow);
		dateInUse.setMilliseconds(dateInUse.getMilliseconds() + (1 * $("#mult").val()))
		planetDate = dateInUse;
	}, 1);
});

$("#resetScale").click(function(){
	clearInterval(planetLoop);
	$("#slider").val(1);
	$("#mult").val($("#slider").val());
	$("#play").click();
});

//locational mapping
function mapper(){
	var mapOptions = { 
		////51°30′26″N 0°7′39″W - London
        center: new google.maps.LatLng(30,0), 
		disableDefaultUI: true,
		zoom: 2, 
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP,
            mapTypeIds: [
                google.maps.MapTypeId.ROADMAP,
                google.maps.MapTypeId.HYBRID,
                google.maps.MapTypeId.SATELLITE,
                google.maps.MapTypeId.TERRAIN
            ]
        }
    };
	
	map = new google.maps.Map(document.getElementById('map'), mapOptions);
	google.maps.visualRefresh = true;
	var marker = null;
	
	map.addListener( 'dblclick', function(){
		if (marker == null){ //only one is made
			var startLAT = prompt("Latitude (between +/-85): ");
			var startLNG = prompt("Longitude (between +/-180): ");
			var input = new google.maps.LatLng(startLAT,startLNG);
			map.setOptions({center: input});
			dragPin(input);
			if (startLAT < 85.05115 && startLAT > -85.05115){
				rotateEqu(startLAT, startLNG); //*1.058823529411765
				locationSet = true;
			} else {
				alert("Invalid Latitude for calculation of position");
				var input = new google.maps.LatLng(0,0);
				map.setOptions({center: input});
				dragPin(input);
			}
		}
	});
	
	function dragPin(input){
		marker = new google.maps.Marker({
		map: map,
		position: input,
		draggable: true
		});
		marker.addListener( 'dragend', function() {
			var currentLAT = marker.getPosition().lat();
			var currentLNG = marker.getPosition().lng();
			//alert(new google.maps.LatLng(currentLAT,currentLNG));
			map.setOptions({center: new google.maps.LatLng(currentLAT,currentLNG)});
			if (currentLAT < 85.05115 && currentLAT > -85.05115){
				rotateEqu(currentLAT,currentLNG); //*1.058823529411765
				locationSet = true;
			} else {
				alert("Invalid Latitude for calculation of position");
			}
		});
	}
}

init();
mapper();
animate();
setTimeout(function (){
  alert("Double click the map, to change the location!");
}, 1000);