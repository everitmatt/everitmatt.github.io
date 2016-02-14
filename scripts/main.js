var container, camera, localCamera, scene, renderer, cssRenderer, material_depth;
var loadingScreen, statsContainer;
var TIME_SPACE = "loading";
var targPos;
var gui;
var auto = true;
var params = {
	count: 0,
	date: '',
	zoom: 1,
	speed: 1,
	timeline: 0,
	restart: function(){
		params.count = 0
		userOptions.surfIndex = 0;
	},
}

var userOptions = {
	searchGPSId: '546a8e195101c0076728c57a',
	surfId: '5635dffb1716481100732228',
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

var palette = {
	background: 0xffffff,
	background_alpha: 1.0,
	landOutline: 0xaaaaaa,
	landFill: 0x000000,
}

var count = 0;
var totalPerc = 0;
// var bounds = [[-180,180],[-90,90]];
var startTimestamp = 1414819736-86400, endTimestamp = 1447870200;
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

var width, height, world = 1000000;

var loadingObject, landingObject, globalObject, localObject, usersObject, personalObject, localHoverObject, mapPlaneObject;

var surfMaterial;
var isMouseDown = false;
var mouseDown = [];
var mouseDiff = [];
var mouseDownTarget = [];
var mouseDownPosition = [];
var mouse = new THREE.Vector3(), raycaster = new THREE.Raycaster(),GLOBAL_INTERSECTED ,LOCAL_INTERSECTED, dir, intersected, intersectedLocals, totalPerc;

$(document).ready(function(){
	mainApiCall();
});


function initCanvas(){
	width = window.innerWidth*world;
	height = window.innerHeight*world;
	$("#login-container").fadeIn("slow");
// 	statsContainer = document.getElementById('stats-container');
// 	statsContainer.style.visibility = 'hidden';
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	container.id = "webgl-container";
	container.style.opacity = '0';
	container.style.position = 'absolute';
	container.style.top = '0px';
	$("#webgl-container").animate({opacity:'1'},5000);

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth/ window.innerHeight, 1, 1000000000 );
	camera.up.set( 0, 0, 1 );
	camera.position.x = window.innerWidth/2.0;
	camera.position.y = window.innerHeight;
	camera.position.z = 200;
	targPos = new THREE.Vector3(window.innerWidth/2,window.innerHeight/2,0);
	camera.lookAt(targPos);
	params.camera = camera;

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( palette.background, 0.005 );
	cssScene = new THREE.Scene();

	createLoading();
	initPostprocessing();

	effectController  = {

		enabled: true,
		jsDepthCalculation: true,
		shaderFocus: false,

		fstop: 2.2,
		maxblur: 1.0,

		showFocus: false,
		focalDepth: 2.8,
		manualdof: false,
		vignetting: false,
		depthblur: false,

		threshold: 0.5,
		gain: 2.0,
		bias: 0.5,
		fringe: 0.7,

		focalLength: 35,
		noise: true,
		pentagon: false,

		dithering: 0.0001

	};
	
	renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true, alpha: true});
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor(palette.background,1);
	container.appendChild( renderer.domElement );

	material_depth = new THREE.MeshDepthMaterial();

	//stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.height = '20px';
	container.appendChild( stats.domElement );

	//event listeners
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );
	document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	document.addEventListener( 'touchmove', onDocumentTouchMove, false );
	document.addEventListener( 'mousewheel', onDocumentMouseScroll, false);

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
      
function mainApiCall(){
	initCanvas();

	database = [];
	var chunkCount = 0;
	var loadingBar = document.getElementById("loading-bar");
	jsonpipe.flow('../local-sources/SGPS-15-Timestamps-1.json', {
		"delimiter": "\n", // String. The delimiter separating valid JSON objects; default is "\n\n"
		"success": function(data) {
			// Do something with this JSON chunk
			landing.push(data);

		},
		"error": function(errorMsg) {
			console.log(errorMsg);
			// Something wrong happened, check the error message
		},
		"complete": function(statusText) {
			// Called after success/error, with the XHR status text
// 			console.log(landing);
			getNext();
		},
		"timeout": 10000, // Number. Set a timeout (in milliseconds) for the request
		"method": "GET", // String. The type of request to make (e.g. "POST", "GET", "PUT"); default is "GET"
		"headers": { // Object. An object of additional header key/value pairs to send along with request
			"X-Requested-With": "XMLHttpRequest"
		},
		"data": "", // String. A serialized string to be sent in a POST/PUT request,
		"withCredentials": true // Boolean. Send cookies when making cross-origin requests; default is true
	});
}

function getNext(){
	jsonpipe.flow('../local-sources/SGPS-15-Timestamps-2.json', {
		"delimiter": "\n", // String. The delimiter separating valid JSON objects; default is "\n\n"
		"success": function(data) {
			// Do something with this JSON chunk
			landing.push(data);

		},
		"error": function(errorMsg) {
			console.log(errorMsg);
			// Something wrong happened, check the error message
		},
		"complete": function(statusText) {
			// Called after success/error, with the XHR status text
			console.log(landing);
			exitLoading();
		},
		"timeout": 10000, // Number. Set a timeout (in milliseconds) for the request
		"method": "GET", // String. The type of request to make (e.g. "POST", "GET", "PUT"); default is "GET"
		"headers": { // Object. An object of additional header key/value pairs to send along with request
			"X-Requested-With": "XMLHttpRequest"
		},
		"data": "", // String. A serialized string to be sent in a POST/PUT request,
		"withCredentials": true // Boolean. Send cookies when making cross-origin requests; default is true
	});
}

function initPostprocessing() {

	postprocessing.scene = new THREE.Scene();

	postprocessing.camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2,  window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000 );
	postprocessing.camera.position.z = 100;

	postprocessing.scene.add( postprocessing.camera );

	var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
	postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );
	postprocessing.rtTextureColor = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );



	var bokeh_shader = THREE.BokehShader;

	postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone( bokeh_shader.uniforms );

	postprocessing.bokeh_uniforms[ "tColor" ].value = postprocessing.rtTextureColor;
	postprocessing.bokeh_uniforms[ "tDepth" ].value = postprocessing.rtTextureDepth;

	postprocessing.bokeh_uniforms[ "textureWidth" ].value = window.innerWidth;

	postprocessing.bokeh_uniforms[ "textureHeight" ].value = window.innerHeight;

	postprocessing.materialBokeh = new THREE.ShaderMaterial( {

		uniforms: postprocessing.bokeh_uniforms,
		vertexShader: bokeh_shader.vertexShader,
		fragmentShader: bokeh_shader.fragmentShader,
		defines: {
			RINGS: shaderSettings.rings,
			SAMPLES: shaderSettings.samples
		}

	} );

	postprocessing.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( window.innerWidth, window.innerHeight ), postprocessing.materialBokeh );
	postprocessing.quad.position.z = - 500;
	postprocessing.scene.add( postprocessing.quad );

}


function animate(time){
	TWEEN.update(time);
	requestAnimationFrame( animate );
	if(TIME_SPACE == "loading"){
		updateLoading();
	} else if (TIME_SPACE == "landing"){
// 		intersectGlobal();
		updateLanding();
	} else if(TIME_SPACE == "local"){
// 		intersect();
		updateLocal();
	} else if(TIME_SPACE == "personal"){
		updatePersonal();
	}
	render();
	stats.update();
	params.count+=(Math.pow(2,params.speed));
}

function render(){
	if ( postprocessing.enabled ) {

		renderer.clear();
		renderer.setClearColor(palette.background,palette.background_alpha);
		// Render scene into texture

		scene.overrideMaterial = null;
		renderer.render( scene, camera, postprocessing.rtTextureColor, true );

		// Render depth into texture

		scene.overrideMaterial = material_depth;
		renderer.render( scene, camera, postprocessing.rtTextureDepth, true );

		// Render bokeh composite

		renderer.render( postprocessing.scene, postprocessing.camera );


	} else {

		scene.overrideMaterial = null;
// 		renderer.clear();
		renderer.setClearColor(palette.background,palette.background_alpha);
// 		renderer.autoClear = false;
		renderer.render( scene, params.camera);

	}
}

function updateLoading(){
	//TODO swell lerp
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
		userOptions.searchGPSId = proIds[1];
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
	event.preventDefault();
	mouseX = event.clientX - windowHalfX;
	mouseY = event.clientY - windowHalfY;
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	var infoDiv = document.getElementById("information");
	infoDiv.style.left = (event.clientX+10) + "px";
	infoDiv.style.top = (event.clientY-60) + "px";
	if(isMouseDown){
		mouseDiff = [(mouseX - mouseDown[0])*world/Math.pow(2,params.zoom)*2,(mouseY - mouseDown[1])*world/Math.pow(2,params.zoom)*2];
		camera.position.x = mouseDownPosition[0] + mouseDiff[0];
		targPos.x = mouseDownTarget[0] + mouseDiff[0];
		camera.position.y = mouseDownPosition[1] - mouseDiff[1];
		targPos.y = mouseDownTarget[1] - mouseDiff[1];
		camera.lookAt(targPos);
// 		console.log(mouseDiff);
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
	event.preventDefault();
	if(isMouseDown){
		isMouseDown = false;
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

	var scrollValue = event.wheelDelta/120;
	console.log(event);
	var newZoom = constrain(params.zoom + scrollValue,1,14);
	params.zoom = newZoom;
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

// 			attributes.position.array[LOCAL_INTERSECTED*3+2] = attributes.scale.array[LOCAL_INTERSECTED]*0.001;
// 			attributes.position.needsUpdate = true;

		}
	}
// 	} else if (LOCAL_INTERSECTED !== null) {

// 		if ( LOCAL_INTERSECTED ){
// 			console.log(local[LOCAL_INTERSECTED]);
// 		}

// 		attributes.position.array[LOCAL_INTERSECTED*3+2] = 0;
// 		attributes.position.needsUpdate = true;
// 		LOCAL_INTERSECTED = null;

// 	}
// 	var intersects = raycaster.intersectObjects( localObject.children);
	
}

function intersectGlobal(){
	var infoDiv = document.getElementById("information");
	raycaster.setFromCamera(mouse,camera);
	raycaster.params.Points.threshold = 0.1;

// 	console.log(raycaster);

// 	scene.remove(arrowHelper);
// 	arrowHelper = new THREE.ArrowHelper(raycaster.ray.direction, targPos, 10000, 0xffff00);
// 	scene.add(arrowHelper);
// 	console.log(raycaster.ray.direction);

	var intersects = raycaster.intersectObject( landingObject);
	var d, l;
	if ( intersects.length > 0 ) {
		if ( GLOBAL_INTERSECTED != intersects[ 0 ] ) {

			if ( GLOBAL_INTERSECTED ) {
				d = landing[GLOBAL_INTERSECTED.index].date;
// 				d = new Date((landing[GLOBAL_INTERSECTED.index].start_timestamp - Math.floor(landing[GLOBAL_INTERSECTED.index].longitude/15)*3600)*1000);
				console.log(d);

// 				console.log(GLOBAL_INTERSECTED.object);
			}
			GLOBAL_INTERSECTED = intersects[ 0 ];


            l = landing[GLOBAL_INTERSECTED.index].location;
            console.log(l);
			infoDiv.style.visibility = "visible"
            infoDiv.textContent = l + "\n" + d

		}

	} else {

		if ( GLOBAL_INTERSECTED ){
// 			 console.log(landing[GLOBAL_INTERSECTED.index]);
// 			 console.log(GLOBAL_INTERSECTED.object);
		}
		infoDiv.style.visibility = "hidden";
		GLOBAL_INTERSECTED = null;

	}
}

function latLngToPixel(lat,lng){
	mapWidth = width;
    mapHeight = height;
	var x = mapWidth-(lng+180)*(mapWidth/360);
    var latRad = lat*Math.PI/180;
    var mercN = Math.log(Math.tan((Math.PI/4)+(latRad/2)));
    var y = (mapHeight/2)-(mapWidth*mercN/(2*Math.PI));
    return [x,y];
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