var container, camera, cssCamera, localCamera, orthoCamera, scene, cssScene, renderer, cssRenderer, material_depth;
var loadingScreen, statsContainer;
var TIME_SPACE = "loading";
var targPos;
var gui;
var auto = true;
var playing = true;
var params = {
	count: 0,
	date: '',
	zoom: 1,
	speed: 1,
	timeline: 0,
	frame: 0,
	restart: function(){
		params.count = 0;
		localStartFrame = startTimestamp;
		userOptions.surfIndex = 0;
	},
	play: function(){
		if(playing){
			playing = false;
			$("#play-pause img").attr("src","../local-sources/play.svg");
		} else {
			playing = true;
			$("#play-pause img").attr("src","../local-sources/pause.svg");
		}
	},
	end: function(){
		params.count = endTimestamp;
	}
}

var userOptions = {
	searchGPSId: '546a8e195101c0076728c57a',
	surfIds: ['562a98b86ba2a21100b30ea8','5625c5d82ec0af1100dfc700','5635dffb1716481100732228','568b13052acbc811009b7d37'],
	surfIndex: 0,
	locationIndices: [],
	timestamps: []
}

var proIds = [
	'53478b455001c0410ca7c6d2',
	'53478bb25001c0243aa7c6d2',
	'53478bbc4f01c0f120e4aec9',
	'53478d095001c0410ca7c6e9',
	'53478bc25101c0900f3a4381',
	'53478b4a5101c021783a4381',
	'53478bad4f01c01f25e4aec9'
];
//Ocean
//0x253069
//0x2881c3
//0x37a0d9
//0x52c9f4
//0xc8e9ed

//land
//0x707d34
//0xcdcd93
//0xd7b3a0
//0x2e3523

//pink
//0xed1c7e
//green
//0x69bd45

var palette = {
	background: 0xffffff,
	background_alpha: 0.0,
	landOutline: 0xDCE6E6,
	landFill: 0xe6f0f0,

}

var count = 0;
var totalPerc = 0;
var swellUniforms = {};
// var bounds = [[-180,180],[-90,90]];
var startTimestamp = 1414819736-1000000, endTimestamp = 1447870200;
var totalDuration = endTimestamp-startTimestamp;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var landing = [];
var global = [];
var local = [];
var personal;

var interactive = true;
var autoLocation, autoUser, userLocation;

var postprocessing = {enabled:false};
var shaderSettings = {
				rings: 3,
				samples: 4
			};
var effectController;

var width, height, world = 1;

var loadingObject, landingObject, globalObject, localObject, usersObject, personalObject, localHoverObject, mapPlaneObject;

var surfMaterial;
var isMouseDown = false;
var zooming = false;
// var mouseMovedWhileZooming = false;
var mouseDown = [];
var mouseDiff = [];
var mouseZoomTarg;
var mouseDownTarget = [];
var mouseDownPosition = [];
var mouseDragging = false;
var mouse = new THREE.Vector3(), raycaster = new THREE.Raycaster(),GLOBAL_INTERSECTED ,LOCAL_INTERSECTED, dir, intersected, intersectedLocals, totalPerc;

var blueMarbleMaterial;
var localSurfMaterial;
var personalMaterial;
var localSurfUniforms;
var globalPilgrimageUniforms;
var pilgrimageUniforms;
var localSwellUniforms;
var splashUniforms;
var personalUniforms;
var personalWaveUniforms;
var personalSwellUniforms;

var loader;

var mouseSelectedObject;
var mouseSelectedIndex = -1;

var zoomHelper;
var infoDiv;

$(document).ready(function(){
	console.log("is chrome: " + !!window.chrome);
	console.log("is safari: " + !!window.safari);
	var canvas = document.createElement( 'canvas' );
	if (canvas.getContext( 'webgl' ) == null && canvas.getContext( 'experimental-webgl' ) == null) {
		// the browser doesn't even know what WebGL is
		window.location = "http://get.webgl.org";
	} else {
		loadTextures();
	}
});

var map;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
	center: {lat: 0, lng: 0},
	zoom: 3
  });

  mainApiCall();
}


function initCanvas(){
	width = window.innerWidth*world;
	height = window.innerWidth*0.5*world;
	$("#login-container").fadeIn("slow");
// 	statsContainer = document.getElementById('stats-container');
// 	statsContainer.style.visibility = 'hidden';
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	container.id = "webgl-container";
	container.style.opacity = '0';
	container.style.position = 'absolute';
	container.style.top = '0px';
	container.style.background= "linear-gradient(to bottom, rgb(255, 255, 230) 10%, rgb(255, 255, 255) 75%)";
	$("#webgl-container").animate({opacity:'1'},5000);

	infoDiv = document.getElementById("information");

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth/ window.innerHeight, 1, 10000);
// 	camera = new THREE.OrthographicCamera( -window.innerWidth , window.innerWidth , window.innerHeight , -window.innerHeight, 1, 10000 );
	camera.up.set( 0, 0, 1 );
	camera.position.x = window.innerWidth/2.0;
	camera.position.y = window.innerHeight;
	camera.position.z = 200;
	targPos = new THREE.Vector3(window.innerWidth/2,window.innerHeight/2,0);
	camera.lookAt(targPos);
	params.camera = camera;

	interactive = true;

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( palette.background, 0.005 );

	createLoading();

	renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true, alpha: true});
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.sortObjects = false;
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor(palette.background,1);
	container.appendChild( renderer.domElement );

	material_depth = new THREE.MeshDepthMaterial();

	//stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.right = '0px';
	stats.domElement.style.height = '20px';
// 	container.appendChild( stats.domElement );

	//event listeners
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );
	document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	document.addEventListener( 'touchmove', onDocumentTouchMove, false );
	document.addEventListener( 'mousewheel', onDocumentMouseScroll, false);
	document.addEventListener( 'dblclick', onDocumentDoubleClick, false);

	window.addEventListener( 'resize', onWindowResize, false );

// 	gui.add(count);
	console.log(scene);
	animate();

	function createLoading(){
		var AMOUNTX = 100,
			AMOUNTY = 500,
			SEPARATIONX = window.innerWidth/AMOUNTX;
			SEPARATIONY = window.innerHeight/AMOUNTY;
		//create loading geometry;
		var group = new THREE.Group();
		group.name = "loadingWave";
		scene.add(group);
		var material = new THREE.LineBasicMaterial({
				color: palette.landOutline,
				linewidth: 2,
				transparent: true
		})

		for ( var ix = 0; ix < AMOUNTX; ix ++ ) {
			var geometry = new THREE.Geometry();
			for ( var iy = 0; iy < AMOUNTY; iy ++ ) {
				var vertex = new THREE.Vector3();
				vertex.x = ix * SEPARATIONX;
				vertex.y = iy * SEPARATIONY;
				vertex.z = 0;
				geometry.vertices.push(vertex);

			}
			var line = new THREE.Line(geometry,material);
			group.add(line);
		}
		loadingObject = group;
	}
}

function loadTextures(){
	initCanvas();
	// instantiate a loader
	loader = new THREE.TextureLoader();

	globalPilgrimageUniforms = {
		equator: {type: 'f', value: 0.0},
		time: {type: 'f', value: 0.0 },
		zoom: {type: 'f', value: 0.0},
		alpha: {type: 'f', value: 0.0},
	}

	localSwellUniforms = {
		equator: {type: 'f', value: 0.0},
		time: {type: 'f', value: 0.0 },
		zoom: {type: 'f', value: 0.0},
		alpha: {type: 'f', value: 0.0},
		direction: {type: 'f', value: 0.0},
	}

	personalSwellUniforms = {
		equator: {type: 'f', value: 0.0},
		time: {type: 'f', value: 0.0 },
		zoom: {type: 'f', value: 0.0},
		alpha: {type: 'f', value: 0.0},
		direction: {type: 'f', value: 0.0},
	}

	pilgrimageUniforms = {
			equator: {type: 'f', value: 0.0},
			time: {type: 'f', value: 0.0 },
			zoom: {type: 'f', value: 0.0},
			pointWidth: {type: 'f', value: 20.0*world},
		};

	splashUniforms = {
			equator: {type: 'f', value: 0.0},
			time: {type: 'f', value: 0.0 },
			zoom: {type: 'f', value: 0.0},
			pointWidth: {type: 'f', value: 20.0*world},
		};

	loader.load(
		// resource URL
		"../textures/sprites/spark1.png",
		// Function when resource is loaded
		function ( texture ) {
			// do something with the texture
			swellUniforms = {
				equator: {type: 'f', value: 0.0},
				time: {type: 'f', value: 0.0 },
				zoom: {type: 'f', value: 0.0},
				alpha: {type: 'f', value: 0.0},
				drop: {type: 'f', value: 1.0},
				texture: {type: 't', value: texture},
				pointWidth: {type: 'f', value: 20.0*world}
			}

			surfMaterial = new THREE.ShaderMaterial( {
				uniforms: swellUniforms,
				vertexShader:   document.getElementById( 'swell_vertexshader' ).textContent,
				fragmentShader: document.getElementById( 'swell_fragmentshader' ).textContent,
				transparent: true,
				depthTest: false,
				blending: THREE.NormalBlending,
			});

			mainApiCall();

		},
		// Function called when download progresses
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},
		// Function called when download errors
		function ( xhr ) {
			console.log( 'An error happened' );
		}
	);

	loader.load(
		// resource URL
		"../textures/sprites/spark1.png",
		// Function when resource is loaded
		function ( texture ) {
			// do something with the texture
			localSurfUniforms = {
				equator: {type: 'f', value: 0.0},
				time: {type: 'f', value: 0.0 },
				zoom: {type: 'f', value: 0.0},
				texture: {type: 't', value: texture},
				alpha: {type: 'f', value: 0.0},
				stat: {type: 'f', value: 0.0},
				min: {type: 'f', value: 0.0},
				max: {type: 'f', value: 0.0},
			}

			localSurfMaterial = new THREE.ShaderMaterial( {
				uniforms: localSurfUniforms,
				vertexShader:   document.getElementById( 'local_vertexshader' ).textContent,
				fragmentShader: document.getElementById( 'local_fragmentshader' ).textContent,
				transparent: true,
				depthTest: false,
				blending: THREE.NormalBlending,
			});

			personalUniforms = {
				equator: {type: 'f', value: 0.0},
				time: {type: 'f', value: 0.0 },
				zoom: {type: 'f', value: 0.0},
				texture: {type: 't', value: texture},
				stat: {type: 'f', value: 0.0},
				min: {type: 'f', value: 0.0},
				max: {type: 'f', value: 0.0},
			}

			personalMaterial = new THREE.ShaderMaterial( {
				uniforms: personalUniforms,
				vertexShader:   document.getElementById( 'personal_vertexshader' ).textContent,
				fragmentShader: document.getElementById( 'personal_fragmentshader' ).textContent,
				transparent: true,
				depthTest: false,
				blending: THREE.NormalBlending,
			});


		},
		// Function called when download progresses
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},
		// Function called when download errors
		function ( xhr ) {
			console.log( 'An error happened' );
		}
	);

	// load a resource

}
      
function mainApiCall(){
	
	var chunkCount = 0;
	var lerp = 100/250000;
	var loadingBar = document.getElementById("loading-bar");
	
	jsonpipe.flow('../local-sources/searchGPSData-minified.json', {
		"delimiter": "\n", // String. The delimiter separating valid JSON objects; default is "\n\n"
		"success": function(data) {
			// Do something with this JSON chunk
			loadingBar.style.width = chunkCount*lerp + "%";
			landing.push(data);
			chunkCount++;

		},
		"error": function(errorMsg) {
			console.log(errorMsg);
		},
		"complete": function(statusText) {
			console.log("complete");
			exitLoading();
		},
		"timeout": 120000, // Number. Set a timeout (in milliseconds) for the request
		"method": "GET", // String. The type of request to make (e.g. "POST", "GET", "PUT"); default is "GET"
		"headers": { // Object. An object of additional header key/value pairs to send along with request
			"X-Requested-With": "XMLHttpRequest"
		},
		"data": "", // String. A serialized string to be sent in a POST/PUT request,
		"withCredentials": true // Boolean. Send cookies when making cross-origin requests; default is true
	});
// 	exitLoading();
}


function animate(time){
	TWEEN.update(time);
	requestAnimationFrame( animate );
	if(TIME_SPACE == "loading"){
		updateLoading();
	} else if (TIME_SPACE == "landing"){
		if(params.zoom > 3.99){
// 			intersectGlobal();	
		}
		updateLanding();
		if(!isMouseDown){
			timeline.value = params.count*100.0/totalDuration;
		}
// 		console.log(toScreenXY(targPos));

	} else if(TIME_SPACE == "local"){
// 		intersect();
		updateLocal();
		if(!isMouseDown){
			timeline.value = params.count*100.0/totalDuration;
		}
	} else if(TIME_SPACE == "personal"){
		updatePersonal();
		if(!isMouseDown){
			timeline.value = params.count*100.0/totalDuration;
		}
	}
	render();
	stats.update();
	if(!isMouseDown && playing){
		params.count+=params.speed;
	}
	if(timeline != undefined){
		$("#date").css({left:10+timeline.value*0.8+"%"});
	}

}

function render(){

		scene.overrideMaterial = null;
// 		renderer.clear();
		renderer.setClearColor(palette.background,palette.background_alpha);
// 		renderer.autoClear = false;
// 		cssRenderer.render( cssScene, params.camera );
// 		scene.fog.density = 4.0;
		renderer.render( scene, params.camera);
		
}

function updateLoading(){
	//TODO swell lerp
	totalPerc = 50;
	var AMOUNTX = 100;
	var AMOUNTY = 500;
	for(var i = 0; i<AMOUNTX;i++){
		var geometry = loadingObject.children[i].geometry;
		var vertices = geometry.vertices;
		for(var j = 0; j<vertices.length;j++){
			var xValue = Math.sin((-i+AMOUNTX*4)/AMOUNTX*4)*20;
			vertices[j].z = Math.sin((-j+params.count)/AMOUNTY*10)*(10+totalPerc)+xValue;
		}
		loadingObject.children[i].geometry.verticesNeedUpdate = true;
	}	

}
	
function exitLoading(){
	//fadeout
	if(auto){
		userOptions.searchGPSId = proIds[Math.floor((Math.random() * 7))];
	}

	scene.remove(loadingObject);
	loadingObject = null;
	initLanding();
}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	width = window.innerWidth*world;
	height = window.innerHeight*world;

	renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function onDocumentMouseMove( event ) {
// 	event.preventDefault();
	raycaster.setFromCamera(mouse,camera);
	mouseX = event.clientX - windowHalfX;
	mouseY = event.clientY - windowHalfY;
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	infoDiv.style.left = (event.clientX+5) + "px";
	infoDiv.style.top = (event.clientY+5) + "px";
	zooming = false;
	if(isMouseDown){
		mouseDragging = true;
		params.count = timeline.value/100*totalDuration;
	}

	var mouseWorldPos = getXY(event.clientX,event.clientY);

	function getXY(cX, cY){
		var planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
		var pos = raycaster.ray.intersectPlane(planeZ);

		return pos;
	}

	scene.remove(mouseSelectedObject);
	infoDiv.style.visibility = "hidden";
	if(TIME_SPACE == "landing" && params.zoom > 3.99 && !goingLocal && !isMouseDown){
		mouseSelectedIndex = -1;
		var minDist = 1000000;
		var minVec;
		for(var i = 0; i < distinctLocations.length; i++){
			var p = latLngToPixel(distinctLocations[i].latitude,distinctLocations[i].longitude);
			var pV = new THREE.Vector3(p[0],p[1],0);
			var dist = mouseWorldPos.distanceTo(pV);
			if(dist < minDist){
				mouseSelectedIndex = i;
				minDist = dist;
				minVec = pV;
			}
		}
		if(minDist < 15){
			$("#information #location").text(distinctLocations[mouseSelectedIndex].detected_location_name);
// 			infoDiv.textContent = distinctLocations[mouseSelectedIndex].detected_location_name;
			infoDiv.style.visibility = "visible";
			console.log(distinctLocations[mouseSelectedIndex].detected_location_name);
			var lMaterial = new THREE.LineBasicMaterial({
				color: palette.landOutline,
				transparent: true
			});

			var lGeometry = new THREE.Geometry();

			lGeometry.vertices.push(mouseWorldPos,minVec);

			mouseSelectedObject = new THREE.Line( lGeometry, lMaterial );
			scene.add( mouseSelectedObject );
		} else {
			$("#information #location").text("");
			$("#information #waveCount").text("");
			$("#information #distanceWaves").text("");
			$("#information #duration").text("");
			$("#information #topSpeed").text("");
			$("#information #previous").text("");
// 			infoDiv.style.visibility = "hidden";
		}
	}
	if(TIME_SPACE == "local" && params.zoom > 3.99 && !isMouseDown){
		mouseSelectedIndex = -1;
		var minDist = 1000000;
		var minVec;
		for(var i = 0; i < local.length; i++){
			var p = latLngToPixel(local[i].latitude,local[i].longitude);
			var pV = new THREE.Vector3(p[0],p[1],0);
			var dist = mouseWorldPos.distanceTo(pV);
			if(dist < minDist){
				mouseSelectedIndex = i;
				minDist = dist;
				minVec = pV;
			}
		}
		if(minDist < 0.04){
			$("#information #location").text("");
			$("#information #waveCount").text("wave_count: "+local[mouseSelectedIndex].wave_count);
			$("#information #distanceWaves").text("distance_waves: "+local[mouseSelectedIndex].distance_waves);
			$("#information #duration").text("duration: "+local[mouseSelectedIndex].duration);
			$("#information #topSpeed").text("max_speed: "+local[mouseSelectedIndex].speed_max);
			if(local[mouseSelectedIndex].previous_location != null){
				$("#information #previous").text("previous_location: "+local[mouseSelectedIndex].previous_location[2]);
			} else {
				$("#information #previous").text("");
			}
			
			infoDiv.style.visibility = "visible";
			var lMaterial = new THREE.LineBasicMaterial({
				color: palette.landOutline,
				transparent: true
			});

			var lGeometry = new THREE.Geometry();

			lGeometry.vertices.push(mouseWorldPos,minVec);

			mouseSelectedObject = new THREE.Line( lGeometry, lMaterial );
			scene.add( mouseSelectedObject );
		} else {
			$("#information #location").text("");
			$("#information #waveCount").text("");
			$("#information #distanceWaves").text("");
			$("#information #duration").text("");
			$("#information #topSpeed").text("");
			$("#information #previous").text("");
		}
	}
}

function onDocumentMouseDown( event ) {
// 	event.preventDefault();
		isMouseDown = true;
		mouseDown = [event.clientX - windowHalfX,event.clientY - windowHalfY];
		mouseDownTarget = [targPos.x,targPos.y];
		mouseDownPosition = [camera.position.x, camera.position.y];

}

function onDocumentMouseUp( event ) {
// 	event.preventDefault();
	if(isMouseDown){
		//params.count*100.0/totalDuration;
		isMouseDown = false;
		mouseDragging = false;
		if(TIME_SPACE != "personal"){
			params.count = timeline.value/100*totalDuration;
		}
	}

}

function onDocumentDoubleClick(){
	event.preventDefault();
	if(TIME_SPACE == "landing"){
		scene.remove(mouseSelectedObject);
		if(mouseSelectedIndex != -1){
			goLocalOnClick(mouseSelectedIndex);
		}
	}
}

function onDocumentTouchStart( event ) {

	if ( event.touches.length === 1 ) {

		event.preventDefault();

		mouseX = event.touches[ 0 ].pageX - windowHalfX;
		mouseY = event.touches[ 0 ].pageY - windowHalfY;

	}

}

function onDocumentTouchMove( event ) {

	if ( event.touches.length === 1 ) {

		event.preventDefault();

		mouseX = event.touches[ 0 ].pageX - windowHalfX;
		mouseY = event.touches[ 0 ].pageY - windowHalfY;

	}

}

function onDocumentMouseScroll( event ) {

	event.preventDefault();
	scene.remove(mouseSelectedObject);

	function getXY(cX, cY){
		raycaster.setFromCamera(mouse,camera);
		var planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
		var pos = raycaster.ray.intersectPlane(planeZ);

		return pos;
	}

	var scrollValue = event.wheelDelta/360;
	var newZoom = constrain(params.zoom + scrollValue,1,20);
	params.zoom = newZoom;
	if(TIME_SPACE == "landing"){
		swellUniforms.zoom.value = Math.pow(2,params.zoom)/(params.zoom*0.5);
		globalPilgrimageUniforms.zoom.value = Math.pow(2,params.zoom)/(params.zoom*0.5);
	}
	if(TIME_SPACE == "local"){
		localSurfUniforms.zoom.value = Math.pow(2,params.zoom);
		localSwellUniforms.zoom.value = Math.pow(2,params.zoom)/(params.zoom*0.5);
	}
	if(TIME_SPACE == "personal"){
		personalSwellUniforms.zoom.value = Math.pow(2,params.zoom);
		personalSwellUniforms.zoom.value = Math.pow(2,params.zoom)/(params.zoom*0.5);
	}


	if(!zooming && TIME_SPACE == "landing" && !histogram){
		if(event.wheelDelta > 0){
			mouseZoomTarg = getXY(event.clientX,event.clientY);
			mouseZoomTarg.sub(targPos);
			mouseZoomTarg.divideScalar(3.85);
			targPos.add(mouseZoomTarg);
		}
		
		camera.position.x = targPos.x;
		camera.lookAt(targPos); 
	}

	camera.zoom = Math.pow(2,params.zoom);
	camera.updateProjectionMatrix();
}

function intersect(){
	raycaster.setFromCamera(mouse,camera);
	raycaster.params.Points.threshold = 0.0009;
	var geometry = localObject.geometry;
	var attributes = geometry.attributes;
	var intersects = raycaster.intersectObject(localObject);
	if ( intersects.length > 0 ) {
		if ( LOCAL_INTERSECTED != intersects[ 0 ].index ) {

			if ( LOCAL_INTERSECTED ) {
				console.log(local[LOCAL_INTERSECTED]);
			}
			
// 			attributes.position.array[LOCAL_INTERSECTED*3+2] = 0;

			LOCAL_INTERSECTED = intersects[ 0 ].index;

			scene.remove(localHoverObject);
			localHoverObject = new THREE.Group();
			scene.add(localHoverObject);
			var id = local[LOCAL_INTERSECTED].id;

			for(var h = 0; h < local.length; h++){
				if(local[h].id == id){
					var lat = +local[h].latitude.toFixed(4);
            		var lng = +local[h].longitude.toFixed(4);
					var p = latLngToPixel(lat,lng);
					var waves = local[h].wave_count;
					var geometry = new THREE.BufferGeometry();
					var vertices = new Float32Array(waves*3);
					var alphas = new Float32Array( waves);
					var scales = new Float32Array( waves);
					var colors = new Float32Array(waves*3);
					for(var i = 0; i < waves; i++){
						vertices[i*3] = p[0];
						vertices[i*3+1] = p[1];
						vertices[i*3+2] = i*0.001;
						alphas[i] = 1.0;
						scales[i] = 1.0;
						colors[i*3] = attributes.color.array[LOCAL_INTERSECTED*3];
						colors[i*3+1] = attributes.color.array[LOCAL_INTERSECTED*3+1];
						colors[i*3+2] = attributes.color.array[LOCAL_INTERSECTED*3+2];
					}
					geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
					geometry.addAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );
					geometry.addAttribute( 'scale', new THREE.BufferAttribute( scales, 1 ) );
					geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
					var userTower = new THREE.Points( geometry, material);
					localHoverObject.add(userTower);

				}
			}



		}
	}
	
}

function latLngToPixel(lat,lng)
{
  var screenX = (((lng * -1)  + 180) * (width  / 360));
  var screenY = (((lat * -1) + 90) * (height/ 180));

  return [screenX,screenY];
}

function latLngToPixelReal(lat,lng){
	mapWidth = width;
    mapHeight = height;
	var x = mapWidth-(lng+180)*(mapWidth/360);
    var latRad = lat*Math.PI/180;
    var mercN = Math.log(Math.tan((Math.PI/4)+(latRad/2)));
    var y = (mapHeight/2)-(mapWidth*mercN/(2*Math.PI));
    return [x,y];
}

function latLngToPixelWithZoom(lat,lng, zoom){
	mapWidth = window.innerWidth*Math.pow(2,zoom);
    mapHeight = window.innerHeight*Math.pow(2,zoom);
	var x = mapWidth-(lng+180)*(mapWidth/360);
    var latRad = lat*Math.PI/180;
    var mercN = Math.log(Math.tan((Math.PI/4)+(latRad/2)));
    var y = (mapHeight/2)-(mapWidth*mercN/(2*Math.PI));
    return [x,y];
}

function constrain(v,min,max){
	return (Math.min(max,Math.max(min,v)));
}

function convertToRange(value, srcRange, dstRange){
	return dstRange[0] + (dstRange[1]-dstRange[0]) * (value - srcRange[0])/(srcRange[1]-srcRange[0]);
}

function toScreenXY ( position ) {

    var pos = position.clone();
    projScreenMat = new THREE.Matrix4();
    projScreenMat.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
    pos.applyMatrix4(projScreenMat);
//     projScreenMat.multiplyVector3( pos );

    return { x: ( pos.x + 1 ) * width / 2 ,
         y: ( - pos.y + 1) * height / 2 };

}

function hideMenu(){
	$("#initial-menu").fadeOut("slow");
	$("#menu-icon").fadeOut("fast",function(){
		$("#gui-container").animate({right: "0px"},1000);
	});
}