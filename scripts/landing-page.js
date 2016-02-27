var currentTime;
var followingUser = false;
var autoplaying = false;
var goingLocal = false;
var fadeOut = {fade: 0.0, drop: 1.0,localFade:0.0};
var selectedObject;
var planeMesh;

var localButton;
var landingGui;
var mapObject;
var emitterObject;
var globalPilgrimageObject;

var timeline;
var localName;
var histogram = false;

function initLanding() {
    TIME_SPACE = "landing";
    params.speed = 1500;
   	camera.up.set( 0, -1, 1 );
    camera.position.x = width*0.5;
	camera.position.y = height*0.5;
	camera.position.z = 1000*world;
	targPos = new THREE.Vector3(width*0.5,height*0.5,200);
	camera.lookAt(targPos);
	camera.updateProjectionMatrix();
	
// 	scene.fog = new THREE.FogExp2( 0xffffff, 0.0025 );
//     scene.fog = null;

	gui = new dat.GUI({
		autoPlace: false,
	});

	var customContainer = document.getElementById('gui-container');
// 	customContainer.appendChild(gui.domElement);

// 	$("#menu-icon").click(function(){
// 		$(this).fadeOut("fast",function(){
// 			$("#gui-container").animate({right: "0px"},500);
// 		});
// 	});
	
// 	$("#gui-container").mouseleave(function(){
// 		$(this).animate({right: "-250px"},500,function(){
// 			$("#menu-icon").fadeIn("fast");
// 		});
// 	});


	
	
	createSelect();

// 	createMap();
	createWorld();
	createEmitters();
	createGlobalSurfs();

	function createMap(){
		var geometry = new THREE.PlaneGeometry(width,height);
		mapObject = new THREE.Mesh( geometry, blueMarbleMaterial );
		mapObject.position.x = width/2.0;
		mapObject.position.y = height/2.0;
		mapObject.position.z = 0;
		scene.add(mapObject);

	}

	function createWorld(){
		mapObject = new THREE.Group();
		mapObject.name = "coastline"
		scene.add(mapObject);
		var cMaterial = new THREE.LineBasicMaterial({
        	color: palette.landOutline,
        	linewidth: 1,
        	linejoin: "round",
        	transparent: true,
        	depthTest: false
    	});

    	var cMeshMaterial = new THREE.MeshBasicMaterial({
        	color: palette.landFill,
//         	wireframe: true,
        	transparent: true,
    	});


		var cl = landpolygons.features;
		var isWithinBounds = true;
		for(var i = 0; i < cl.length;i++){
			if(cl[i].geometry.type == "MultiPolygon"){
				var cG = cl[i].geometry.coordinates;
				for(var j = 0; j < cG.length; j++){
					var c = cG[j][0];
				}
			} else {
				var c = cl[i].geometry.coordinates[0];
			}
			if(isWithinBounds){
				var cPoints = [];
				var cGeometry = new THREE.Geometry();
				for(var j = 0; j < c.length; j++){
					var p = c[j];
					var point = latLngToPixel(p[1],p[0]);
					var vertex = new THREE.Vector3(point[0],point[1],0);
					cGeometry.vertices.push(vertex);
					cPoints.push(vertex);
				}
				var cShape = new THREE.Shape(cPoints);
				var cShapeGeometry = new THREE.ShapeGeometry(cShape);
				var cMesh = new THREE.Mesh(cShapeGeometry,cMeshMaterial);
				cMesh.name = "coastline";
				mapObject.add(cMesh);
// 				var cLine = new THREE.Line( cGeometry, cMaterial);
// 				cLine.name = "coastline";
// 				mapObject.add(cLine);
			}
		}
	}
	
    function createGlobalSurfs(){
		globalPilgrimageObject = new THREE.Group();
		globalPilgrimageObject.name = "globalPilgrimageObject";
		scene.add(globalPilgrimageObject);
		
		globalPilgrimageUniforms.alpha.value = 0.1;
		var gPMAterial = new THREE.ShaderMaterial({
			uniforms:       globalPilgrimageUniforms,
			vertexShader:   document.getElementById( 'gPilgrim_vertexshader' ).textContent,
			fragmentShader: document.getElementById( 'gPilgrim_fragmentshader' ).textContent,
			blending:       THREE.NormalBlending,
			depthTest: 		false,
			transparent:    true
		});

        var geometry = new THREE.BufferGeometry();
        var vertices = new Float32Array(landing.length*3);
        var timestamps = new Float32Array(landing.length);
        var scales = new Float32Array(landing.length);
        var swellSizes = new Float32Array(landing.length);
        var targets = new Float32Array(landing.length*3);

        for(var i = 0; i < landing.length; i++){
        	var s = landing[i];
        	var isUser = false;
        	if(s.id == userOptions.searchGPSId) isUser = true;
        	if(isUser) userOptions.timestamps.push(s.start_timestamp);
            var lat = +s.latitude;
            var lng = +s.longitude;

			var pLat, pLng;

            var z = 0;
			if(s.hasOwnProperty("detected_location_name")){
				var name1 = s.detected_location_name;
				var prevName1 = s.previous_location;
				for(var j = 0; j < distinctLocations.length; j++){
					var name2 = distinctLocations[j].detected_location_name;
					if(name1 == name2){
						lat = distinctLocations[j].latitude;
						lng = distinctLocations[j].longitude;
// 						landing[i].detected_location_name = distinctLocations[j].detected_location_name;
						if(isUser) userOptions.locationIndices.push(j);
						if(distinctLocations[j].hasOwnProperty('count')){
							z = distinctLocations[j].count;
							distinctLocations[j].count += 1;
						} else {
							z = 0;
							distinctLocations[j].count = 1;
						}
						break;
					} else {
						z = 0;
					}
				}

				for(var j = 0; j < distinctLocations.length; j++){
					var name2 = distinctLocations[j].detected_location_name;
					if(prevName1 == name2){
						var prev = latLngToPixel(distinctLocations[j].latitude,distinctLocations[j].longitude);
						var n = latLngToPixel(lat,lng);
						var prev = new THREE.Vector3(prev[0],prev[1],0);
						var target = new THREE.Vector3(n[0],n[1],0);
						var e = new THREE.Vector3();
						e.subVectors(target,prev);
						var curvature = e.length()*0.5*world;
						e.multiplyScalar(0.5);
						e.add(prev);
						var curve = new THREE.CubicBezierCurve3(
							prev,
							new THREE.Vector3(prev.x,prev.y,curvature),
							new THREE.Vector3(target.x,target.y, curvature),
							target
						);
						var gPGeometry = new THREE.Geometry();
						gPGeometry.vertices = curve.getPoints( 100 );
						var gPBufferGeometry = new THREE.BufferGeometry();
						var position = new THREE.Float32Attribute( gPGeometry.vertices.length * 3, 3 ).copyVector3sArray( gPGeometry.vertices );
						gPBufferGeometry.addAttribute( 'position', position )
						var gPtimestamps = new Float32Array(gPGeometry.vertices.length);
						var gPindices = new Float32Array(gPGeometry.vertices.length);
						for(var k = 0; k < gPGeometry.vertices.length; k++){
							gPtimestamps[k] = s.start_timestamp;
							gPindices[k] = k;
						}
						gPBufferGeometry.addAttribute('timestamp',new THREE.BufferAttribute(gPtimestamps,1) );
						gPBufferGeometry.addAttribute('curveIndex',new THREE.BufferAttribute(gPindices,1) );
						var line = new THREE.Line(gPBufferGeometry,gPMAterial);
						globalPilgrimageObject.add(line);
						break;
					}
				}
            }

            var p = latLngToPixel(lat,lng);

            var vertex = new THREE.Vector3(p[0],p[1],0);

            var emitterName;
            var emitterScale = width*1/1920.0;
            var emitterRadius = 1000000000;
            for (var j = 0; j < swellEmitters.length;j++){
				var emitter = latLngToPixel(swellEmitters[j].FIELD2,swellEmitters[j].FIELD3);
            	var e = new THREE.Vector3(emitter[0],emitter[1],0);
            	var dist = vertex.distanceTo(e);
            	if(dist<swellEmitters[j].FIELD5*emitterScale&&swellEmitters[j].FIELD5*emitterScale<emitterRadius){
            		emitterName = swellEmitters[j].FIELD1;
            		emitterRadius = swellEmitters[j].FIELD5*emitterScale;
            		vertices[i*3] = e.x;
            		vertices[i*3+1] = e.y;
            		vertices[i*3+2] = e.z;
            		s.emitter = emitterName;
            	} 
            }

            if(s.hasOwnProperty("emitter")){
            	
            } else {
            	emitterName = null;
				vertices[i*3] = vertex.x;
				vertices[i*3+1] = vertex.y;
				vertices[i*3+2] = 0.0;
				s.emitter = emitterName;
            }

            targets[ i*3 + 0 ] = vertex.x;
            targets[ i*3 + 1 ] = vertex.y;
            targets[ i*3 + 2 ] = vertex.z;
            
            timestamps[i] = s.start_timestamp ;
            s.date = new Date(s.start_timestamp*1000);

            scales[i] = z*world*0.5;

            swellSizes[i] = s.swell_size;
        }
        geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        geometry.addAttribute( 'timestamp', new THREE.BufferAttribute( timestamps, 1 ) );
        geometry.addAttribute( 'scale', new THREE.BufferAttribute(scales,1));
		geometry.addAttribute( 'swellSize', new THREE.BufferAttribute(swellSizes,1));
        geometry.addAttribute( 'target', new THREE.BufferAttribute(targets,3));

		swellUniforms.equator.value = height/2.0;
		swellUniforms.pointWidth.value = 20.0*world;

        landingObject = new THREE.Points( geometry,surfMaterial);
        landingObject.name = "landing";
        scene.add( landingObject );
        params.count = 0;
    }

	function createSelect(){
		var select = document.getElementById("location-select");
		select.style.width = "100%";
		select.style.margin = '10px 0px';
		for(var i = 0; i<distinctLocations.length;i++){

			var l = document.createElement("option");
			l.value = i;
			l.text = distinctLocations[i].detected_location_name;
			select.options.add(l);
		}
		document.getElementById("location-select-container").appendChild(select);
		select.style.visibility = "visible";
		
	}

	$("#gui-container").animate({right: "0px"},1000);
	$("#login-container").fadeOut("slow");
	
	timeline = document.getElementById("timeline");

//     landingObject.visible = false;

	landingObject.visible = true;
	globalPilgrimageObject.visible = false;


	goGlobal();
	console.log(scene);
	console.log(userOptions);
}

function createEmitters(){
		scene.remove(emitterObject);
		emitterObject = new THREE.Group();
		emitterObject.name = "emitters";
		scene.add(emitterObject);
		var eMaterial = new THREE.LineBasicMaterial({
        	color: 0xff9100,
        	transparent: true,
        	linewidth: 1,
    	});
		
		var emitterScale = width*1/1920.0;

		swellEmitters.forEach(function(e,i){
			var p = latLngToPixel(e.FIELD2,e.FIELD3);
			var curve = new THREE.EllipseCurve(
				p[0],  p[1],            // ax, aY
				e.FIELD5*emitterScale, e.FIELD5*emitterScale,           // xRadius, yRadius
				0,  2 * Math.PI,  // aStartAngle, aEndAngle
				false,            // aClockwise
				0 
			)
			var path = new THREE.Path( curve.getPoints( 50 ) );
			var eGeometry = path.createPointsGeometry( 50 );
			var eLine = new THREE.Line(eGeometry,eMaterial);
			eLine.name = e.FIELD1;
			emitterObject.add(eLine);
		});
	}

function updateLanding(){
	var d = new Date((startTimestamp+params.count)*1000);
	$("#date").text(dateFormat(d, "yyyy, mmmm dS"));
// 	createEmitters();
	emitterObject.visible = false;
// 	mapObject.visible = false;
	scene.fog = new THREE.FogExp2( 0xffffff, 0.0005 );
	raycaster.setFromCamera(mouse,camera);
	raycaster.params.Points.threshold = 1;
	camera.zoom = Math.pow(2,params.zoom);
	camera.updateProjectionMatrix();
	if(!interactive){
		var targLocation;
		if(autoplaying){
			targLocation = latLngToPixel(autoLocation.latitude,autoLocation.longitude);
		}
		else if (followingUser){
			targLocation = latLngToPixel(userLocation.latitude,userLocation.longitude);
		}
		targPos = new THREE.Vector3(targLocation[0],targLocation[1],0);
		var cameraX = targLocation[0] + height * Math.cos(Math.PI/2.0+(params.count*0.001/params.speed));
		var cameraY = targLocation[1] + height * Math.sin(Math.PI/2.0+(params.count*0.001/params.speed));
		camera.up.set( 0, 0, 1 );
		camera.position.x = cameraX;
		camera.position.y = cameraY;
		camera.position.z = 300*world;
		camera.lookAt(targPos);
	}
	swellUniforms.time.value = startTimestamp+params.count;
	swellUniforms.zoom.value = Math.pow(2,params.zoom)/(params.zoom*0.5);
	swellUniforms.alpha.value = fadeOut.fade;

	globalPilgrimageUniforms.time.value = startTimestamp+params.count;
	globalPilgrimageUniforms.zoom.value = Math.pow(2,params.zoom)/(params.zoom*0.5);
	globalPilgrimageUniforms.alpha.value = fadeOut.fade;

	
    var frame = startTimestamp+params.count;
    var lerpValue = 1/518400;
    params.date = d.toUTCString();
    var geometry = landingObject.geometry;
	var attributes = geometry.attributes;
	var locIndex;
	if(userOptions.timestamps[userOptions.surfIndex]-259200 < frame){
// 		if(userOptions.timestamps[userOptions.surfIndex] < frame){
			if(userOptions.surfIndex < userOptions.locationIndices.length-1){
				var name1;
				if(userLocation != null){
					name1 = userLocation.detected_location_name.split(",");
				} else {
					name1 = ["nothing"];
				}
				
				userLocation = distinctLocations[userOptions.locationIndices[userOptions.surfIndex]];
				var name2 = userLocation.detected_location_name.split(",");
				if (followingUser && name1[0] != name2[0]){
					scene.remove(selectedObject);
					interactive = true;
					console.log(userOptions.surfIndex+": "+userLocation.detected_location_name);
					$("#location-name").text(userLocation.detected_location_name);
					var targLocation = latLngToPixel(userLocation.latitude,userLocation.longitude);
					var cameraX = targLocation[0] + height * Math.cos(Math.PI/2.0+((params.count+120)*0.001/params.speed))
					var cameraY = targLocation[1] + height * Math.sin(Math.PI/2.0+((params.count+120)*0.001/params.speed));
					camera.up.set( 0, 0, 1 );
					TWEEN.removeAll();
					var cameraTween = new TWEEN.Tween(camera.position).to({ x: cameraX, y: cameraY, z:300*world }, 2000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
						 camera.lookAt(targPos);
					}).start();
					var targTween = new TWEEN.Tween(targPos).to({ x: targLocation[0], y: targLocation[1], z: 0 }, 2000).easing(TWEEN.Easing.Quadratic.InOut).start();
					var zoomTween = new TWEEN.Tween(params).to({zoom:5},2000).easing(TWEEN.Easing.Quadratic.InOut).onComplete(function(){interactive=false;}).start();
					var curve = new THREE.EllipseCurve(
						targLocation[0],  targLocation[1],            // ax, aY
						0.5*world, 0.5*world,           // xRadius, yRadius
						0,  2 * Math.PI,  // aStartAngle, aEndAngle
						false,            // aClockwise
						0                 // aRotation 
					);

					var path = new THREE.Path( curve.getPoints( 50 ) );
					var geometry = path.createPointsGeometry( 50 );
					var material = new THREE.LineBasicMaterial( { color : 0xff0000, transparent: true, linewidth: 1 } );

					// Create the final Object3d to add to the scen
					selectedObject = new THREE.Line( geometry, material );
					selectedObject.name = userLocation.detected_location_name;
					scene.add(selectedObject);
				}
				userOptions.surfIndex++;
			}
// 		}
	}
	var updateCount = 0;
	
// 	camera.position.x = width/2.0;
// 	camera.position.y = height*2.0;
// 	camera.position.z = 0;
// 	targPos.z = 300;
// 	camera.lookAt(targPos); 
}

function showPilg(){
	landingObject.visible = false;
	globalPilgrimageObject.visible = true;
}

function showStorm(){
	landingObject.visible = true;
	globalPilgrimageObject.visible = false;
}

function autoPlay(){
	$('#local-button').slideDown("fast");
	$('#information2').fadeOut("fast");
	scene.remove(selectedObject);
	histogram = false;
	followingUser = false;
	autoplaying = true;
	interactive = true;
	
	camera.up.set( 0, 0, 1 );
	var num = Math.floor(Math.random()*30+1);
	document.getElementById("location-select").selectedIndex = num;
	autoLocation = distinctLocations[num];
	console.log(num+": "+autoLocation.detected_location_name);
	$("#location-name").text(autoLocation.detected_location_name);
	var targLocation = latLngToPixel(autoLocation.latitude,autoLocation.longitude);
	var cameraX = targLocation[0] + height * Math.cos(Math.PI/2.0+((params.count+120*params.speed)*0.001/params.speed))
	var cameraY = targLocation[1] + height * Math.sin(Math.PI/2.0+((params.count+120*params.speed)*0.001/params.speed));

	var zoomTween = new TWEEN.Tween(params).to({zoom:4},1000).easing(TWEEN.Easing.Quadratic.In).onComplete(function(){
    	interactive = false;
    	
    });
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: cameraX, y: cameraY, z: 300*world}, 2000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: targLocation[0], y: targLocation[1], z: 0 }, 2000).easing(TWEEN.Easing.Quadratic.InOut).onComplete(function(){
		zoomTween.start();
    }).start();
    var dropTween = new TWEEN.Tween(swellUniforms.drop).to({value:1.0},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
//     var zoomTween2 = new TWEEN.Tween(params).to({zoom:4},1000).easing(TWEEN.Easing.Quadratic.Out).chain(zoomTween).start();

    var curve = new THREE.EllipseCurve(
		targLocation[0],  targLocation[1],            // ax, aY
		0.5*world, 0.5*world,           // xRadius, yRadius
		0,  2 * Math.PI,  // aStartAngle, aEndAngle
		false,            // aClockwise
		0                 // aRotation 
	);

	var path = new THREE.Path( curve.getPoints( 50 ) );
	var geometry = path.createPointsGeometry( 50 );
	var material = new THREE.LineBasicMaterial( { color : 0xff0000, transparent: true, linewidth: 1 } );

	// Create the final Object3d to add to the scen
	selectedObject = new THREE.Line( geometry, material );
	selectedObject.name = autoLocation.detected_location_name;
	scene.add(selectedObject);
}

function goSelectedLocation(num){
	$('#local-button').slideDown("fast");
	$('#information2').fadeOut("fast");
	scene.remove(selectedObject);
	histogram = false;
	followingUser = false;
	autoplaying = true;
	interactive = true;
	
	camera.up.set( 0, 0, 1 );
	autoLocation = distinctLocations[num];
	console.log(num+": "+autoLocation.detected_location_name);
	$("#location-name").text(autoLocation.detected_location_name);
	var targLocation = latLngToPixel(autoLocation.latitude,autoLocation.longitude);
	var cameraX = targLocation[0] + height * Math.cos(Math.PI/2.0+((params.count+120*params.speed)*0.001/params.speed))
	var cameraY = targLocation[1] + height * Math.sin(Math.PI/2.0+((params.count+120*params.speed)*0.001/params.speed));
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: cameraX, y: cameraY, z:300*world }, 2000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: targLocation[0], y: targLocation[1], z: 0 }, 2000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:5},1000).easing(TWEEN.Easing.Quadratic.In).onComplete(function(){
    	interactive=false;
		
    	});
    var zoomTween2 = new TWEEN.Tween(params).to({zoom:4},1000).easing(TWEEN.Easing.Quadratic.Out).chain(zoomTween).start();
    var dropTween = new TWEEN.Tween(swellUniforms.drop).to({value:1.0},1000).easing(TWEEN.Easing.Quadratic.InOut).start();

    var curve = new THREE.EllipseCurve(
		targLocation[0],  targLocation[1],            // ax, aY
		0.5*world, 0.5*world,           // xRadius, yRadius
		0,  2 * Math.PI,  // aStartAngle, aEndAngle
		false,            // aClockwise
		0                 // aRotation 
	);

	var path = new THREE.Path( curve.getPoints( 50 ) );
	var geometry = path.createPointsGeometry( 50 );
	var material = new THREE.LineBasicMaterial( { color : 0xff0000, transparent: true, linewidth: 1 } );

	// Create the final Object3d to add to the scen
	selectedObject = new THREE.Line( geometry, material );
	selectedObject.name = autoLocation.detected_location_name;
	scene.add(selectedObject);
}

function goUser(){
	$('#local-button').slideDown("fast");
	$('#information2').fadeOut("fast");
	scene.remove(selectedObject);
	histogram = false;
	autoplaying = false;
	followingUser = true;
	interactive = true;
	
	userLocation = distinctLocations[userOptions.locationIndices[userOptions.surfIndex]];
	console.log(userOptions.surfIndex+": "+userLocation.detected_location_name);
	$("#location-name").text(userLocation.detected_location_name);

	var targLocation = latLngToPixel(userLocation.latitude,userLocation.longitude);
	var cameraX = targLocation[0] + height * Math.cos(Math.PI/2.0+((params.count+60*params.speed)*0.001/params.speed))
	var cameraY = targLocation[1] + height * Math.sin(Math.PI/2.0+((params.count+60*params.speed)*0.001/params.speed));
	camera.up.set( 0, 0, 1 );
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: cameraX, y: cameraY, z:300*world }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).onComplete(function(){
    	
    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: targLocation[0], y: targLocation[1], z: 0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:5},1000).easing(TWEEN.Easing.Quadratic.InOut).onComplete(function(){interactive=false;}).start();
    var dropTween = new TWEEN.Tween(swellUniforms.drop).to({value:1.0},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
	
	var curve = new THREE.EllipseCurve(
		targLocation[0],  targLocation[1],            // ax, aY
		0.5*world, 0.5*world,           // xRadius, yRadius
		0,  2 * Math.PI,  // aStartAngle, aEndAngle
		false,            // aClockwise
		0                 // aRotation 
	);

	var path = new THREE.Path( curve.getPoints( 50 ) );
	var geometry = path.createPointsGeometry( 50 );
	var material = new THREE.LineBasicMaterial( { color : 0xff0000, transparent: true, linewidth: 1 } );

	// Create the final Object3d to add to the scen
	selectedObject = new THREE.Line( geometry, material );
	selectedObject.name = userLocation.detected_location_name;
	scene.add(selectedObject);
}


function goBirdsEye(){
	histogram = false;
// 	params.camera = camera;
	$('#local-button').slideUp("fast");
	$('#information2').fadeOut("fast");
	$("#location-name").text("");
	autoplaying = false;
	followingUser = false;
	camera.up.set( 0, 0, 1 );
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: width*0.5, y: height*0.52, z: 1750*world }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).onComplete(function(){

    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: width*0.5, y: height*0.5, z: 0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:1},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var dropTween = new TWEEN.Tween(swellUniforms.drop).to({value:0.0},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
	interactive = true;
	var geometry = landingObject.geometry;
	var attributes = geometry.attributes;
	var updateCount = 0;
}

function goHistogram(){
	$('#local-button').slideUp("fast");
	$('#information2').fadeOut("fast");
	$("#location-name").text("");
	histogram = true;
	autoplaying = false;
	followingUser = false;
	camera.up.set( 0, 0, 1 );
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: width*0.5, y: height*2.0, z:0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).onComplete(function(){
    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: width*0.5, y: height*0.5, z: 0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:1},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
	var dropTween = new TWEEN.Tween(swellUniforms.drop).to({value:1.0},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
	interactive = true;

	var geometry = landingObject.geometry;
	var attributes = geometry.attributes;
	var updateCount = 0;
}

function goGlobal(){
// 	params.camera = camera;
	$('#local-button').slideUp("fast");
	$('#information2').fadeOut("fast");
	$("#location-name").text("");
	histogram = false;
	autoplaying = false;
	followingUser = false;
	params.speed = 1500;
	goingLocal = false;
	TIME_SPACE = "landing";
	scene.remove(localObject);
	scene.remove(usersObject);
	camera.up.set( 0, 0, 1 );
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: width*0.5, y: height*1.8, z: height }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).onComplete(function(){

    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: width*0.5, y: height*0.5, z: 0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:1},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var dropTween = new TWEEN.Tween(swellUniforms.drop).to({value:1.0},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
	interactive = true;

	var geometry = landingObject.geometry;
	var attributes = geometry.attributes;
	var updateCount = 0;
}


function goLocal(){
	$('#topspot-container').slideUp("fast");
	$('#local-button').slideUp("fast");
	$('#information2').fadeOut("fast");
	$('#location-select-container').slideUp("fast");
	histogram = false;
	goingLocal = true;
	var fade = new TWEEN.Tween(fadeOut).to({fade:-1.0},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
	if(autoplaying) {

		queryLanding(autoLocation.detected_location_name,exitLanding);
	}
	if(followingUser) {

		queryLanding(userLocation.detected_location_name,exitLanding);
	}
}

function goLocalOnClick(i){
	$('#topspot-container').slideUp("fast");
	$('#local-button').slideUp("fast");
	$('#information2').fadeOut("fast");
	$('#location-select-container').slideUp("fast");
	histogram = false;
	goingLocal = true;
	var fade = new TWEEN.Tween(fadeOut).to({fade:-1.0},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
	queryLanding(distinctLocations[i].detected_location_name,exitLanding);
}

function queryLanding(locationName, callback){
	local = [];
	for(var i = 0; i < landing.length; i++){
		if(landing[i].detected_location_name == locationName && landing[i].speed_max < 35){
			local.push(landing[i]);
		}

	}
	callback(locationName);
}

function exitLanding(name){
	var geometry = landingObject.geometry;
	var attributes = geometry.attributes;
	localName = name;
	console.log(name);

	initLocal();
}

function generateQuery(ls){
	var qString = 'select * from sgps_15.surfs_timestamp ';
	ls.forEach(function(d,i){
		var st = d;
		if(i==0){
			qString = qString + 'where detected_location_name = "'+st+'"';
		} else {
			qString = qString + ' or detected_location_name = "'+st+'"';
		}
	});
	qString = qString + " and speed_max < 50";
	console.log(qString);
	return qString;
}