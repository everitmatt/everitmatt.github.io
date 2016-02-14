var currentTime;
var followingUser = false;
var autoplaying = false;
var goingLocal = false;
var fadeOut = {fade: 1.0, drop: 1.0};
var selectedObject;

var localButton;
var landingGui;

function initLanding() {
    TIME_SPACE = "landing";
    params.speed = 11;
   	camera.up.set( 0, -1, 1 );
    camera.position.x = width*0.5;
	camera.position.y = height*0.5;
	camera.position.z = 1000*world;
	targPos = new THREE.Vector3(width*0.5,height*0.5,200);
	camera.lookAt(targPos);
	camera.updateProjectionMatrix();
	$("#login-container").fadeOut("slow");
// 	scene.fog = new THREE.FogExp2( 0xffffff, 0.0025 );
    scene.fog = null;

	gui = new dat.GUI({
		height: 5*32-1
	});

	createSelect();
	createWorld();
	createGlobalSurfs();

	function createEmitters(){
		var eGroup = new THREE.Group();
		eGroup.name = "emitters";
		scene.add(eGroup);
		var eMaterial = new THREE.LineBasicMaterial({
        	vertexColors: THREE.VertexColors,
        	linewidth: 1,
        	linejoin: "round" 
    	});

		swellEmitters.forEach(function(e,i){
			var eGeometry = new THREE.Geometry();
			var eLine = new THREE.Line(eGeometry,eMaterial);
			eLine.name = e.FIELD1;
			eGroup.add(eLine);
		});
	}

	function createWorld(){
		var group = new THREE.Group();
		group.name = "coastline"
		scene.add(group);
		var cMaterial = new THREE.LineBasicMaterial({
        	color: palette.landOutline,
        	linewidth: 1,
        	linejoin: "round" 
    	});

    	var cMeshMaterial = new THREE.MeshBasicMaterial({
        	color: palette.landFill,
        	transparent: true,
    	});

//     	var cMeshMaterial = new THREE.ShaderMaterial({
//             vertexShader:   document.getElementById( 'land_vertexshader' ).textContent,
//             fragmentShader: document.getElementById( 'land_fragmentshader' ).textContent,
//             transparent: true,
//             depthTest: false,
//             blending: THREE.NormalBlending,
//     	})

		var cl = landpolygons.features;
		var isWithinBounds = true;
		for(var i = 0; i < cl.length;i++){
			if(cl[i].geometry.type == "MultiPolygon"){
				var cG = cl[i].geometry.coordinates;
				for(var j = 0; j < cG.length; j++){
					var c = cG[j][0];
// 					for(var k = 0; k < c.length; k++){
// 						var p = c[k];
// 						if(checkBounds(p)){
// 							isWithinBounds = true;
// 							break;
// 						}
// 						isWithinBounds= false;
// 					}
				}
			} else {
				var c = cl[i].geometry.coordinates[0];
// 				var isWithinBounds = false;
// 				for(var j = 0; j < c.length; j++){
// 					var p = c[j];
// 					if(checkBounds(p)){
// 						isWithinBounds = true;
// 						break;
// 					}
// 					isWithinBounds= false;
// 				}
			}
			if(isWithinBounds){
				var cPoints = [];
				var cGeometry = new THREE.Geometry();
				for(var j = 0; j < c.length; j++){
					var p = c[j];
					var point = latLngToPixel(p[1],p[0]);
// 					var point = [convertToRange(p[0],xBounds,[0,window.innerWidth]),convertToRange(p[1],yBounds,[0,window.innerHeight])];
// 					var point = latLngToPixelWithZoom(p[1],p[0],testZoom);
					vertex = new THREE.Vector3(point[0],point[1],0);
					cGeometry.vertices.push(vertex);
					cPoints.push(vertex);
				}
// 				var cShape = new THREE.Shape(cPoints);
// 				var cShapeGeometry = new THREE.ShapeGeometry(cShape);
// 				var cMesh = new THREE.Mesh(cShapeGeometry,cMeshMaterial);
// 				cMesh.name = "coastline";
// 				group.add(cMesh);
				var cLine = new THREE.Line( cGeometry, cMaterial);
				cLine.name = "coastline";
				group.add(cLine);
			}
		}
	}
	
    function createGlobalSurfs(){
        var geometry = new THREE.BufferGeometry();
        var emitters = new Float32Array(landing.length*3);
        var vertices = new Float32Array(landing.length*3);
        var timestamps = new Int32Array(landing.length);
//         var colors = new Float32Array(landing.length*3);
        var alphas = new Float32Array(landing.length);
        var scales = new Float32Array(landing.length);
        var swellSizes = new Float32Array(landing.length);
//         var locationIndex = new Int32Array(landing.length);
        var targets = new Float32Array(landing.length*3);
        var groupName;
        landing.forEach(function(s,i){
        	var isUser = false;
        	if(s.id == userOptions.searchGPSId) isUser = true;
        	if(isUser) userOptions.timestamps.push(s.start_timestamp);
            var lat = +s.latitude.toFixed(1);
            var lng = +s.longitude.toFixed(1);
            var z;

            for(var j = 0; j < distinctLocations.length; j++){
                if(distinctLocations[j].latitude == lat && distinctLocations[j].longitude == lng){
                	if(isUser) userOptions.locationIndices.push(j);
                	s.location = distinctLocations[j].detected_location_name;
                	if(distinctLocations[j].hasOwnProperty('count')){
                		z = distinctLocations[j].count;
						distinctLocations[j].count += 1;
                	} else {
                		z = 0;
                		distinctLocations[j].count = 1;
                	}
//                 	locationIndex[i] = j;
                	break;
                } else {
                	z = 0;
                }
            }

            var p = latLngToPixel(lat,lng);

            vertex = new THREE.Vector3(p[0],p[1],0);

            var emitterName;
            var emitterRadius = 1000000000;
            for (var j = 0; j < swellEmitters.length;j++){
				var emitter = latLngToPixel(swellEmitters[j].FIELD2,swellEmitters[j].FIELD3);
            	var e = new THREE.Vector3(emitter[0],emitter[1],0);
            	var dist = vertex.distanceTo(e);
            	if(dist<swellEmitters[j].FIELD5*world&&swellEmitters[j].FIELD5*world<emitterRadius){
            		emitterName = swellEmitters[j].FIELD1;
            		emitterRadius = swellEmitters[j].FIELD5;
//             		emitters[i*3] = e.x+(-10+(Math.random()*20));
//             		emitters[i*3+1] = e.y+(-10+(Math.random()*20));
            		emitters[i*3] = e.x;
            		emitters[i*3+1] = e.y;
            		emitters[i*3+2] = e.z;
            		vertices[i*3] = e.x;
            		vertices[i*3+1] = e.y;
            		vertices[i*3+2] = e.z;
            		s.emitter = emitterName;
//             		console.log(swellEmitters[j].FIELD1);
            	}
            }

            targets[ i*3 + 0 ] = vertex.x;
            targets[ i*3 + 1 ] = vertex.y;
            targets[ i*3 + 2 ] = vertex.z;
            
            timestamps[i] = s.start_timestamp ;
            s.date = new Date(s.start_timestamp*1000);
//             var c1;
//             if(s.id == userOptions.searchGPSId){
//             	c1 = new THREE.Color(0xff0000); 
//             } else { 
//             	c1 = new THREE.Color(0x0000ff); 
//             }
//             colors[ i*3 + 0 ] = c1.r;
//             colors[ i*3 + 1 ] = c1.g;
//             colors[ i*3 + 2 ] = c1.b;

            alphas[i] = 1.0;

            scales[i] = z*world*0.5;

            swellSizes[i] = s.swell_size;
        });
		geometry.addAttribute( 'emitter', new THREE.BufferAttribute(emitters,3));
        geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        geometry.addAttribute( 'timestamp', new THREE.BufferAttribute( timestamps, 1 ) );
//         geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
        geometry.addAttribute( 'alpha', new THREE.BufferAttribute(alphas,1));
        geometry.addAttribute( 'scale', new THREE.BufferAttribute(scales,1));
//         geometry.addAttribute( 'location', new THREE.BufferAttribute(locationIndex,1));
		geometry.addAttribute( 'swellSize', new THREE.BufferAttribute(swellSizes,1));
        geometry.addAttribute( 'target', new THREE.BufferAttribute(targets,3));
        geometry.attributes.swellSize.needsUpdate = true;
		
        surfMaterial = new THREE.ShaderMaterial( {
        	uniforms: {
        		texture: {type: 't', value: THREE.ImageUtils.loadTexture("../textures/sprites/spark1.png")},
        		pointWidth: {type: 'f', value: 20.0*world}
        	},
            vertexShader:   document.getElementById( 'swell_vertexshader' ).textContent,
            fragmentShader: document.getElementById( 'swell_fragmentshader' ).textContent,
            transparent: true,
            depthTest: false,
            blending: THREE.NormalBlending,
        });

        landingObject = new THREE.Points( geometry,surfMaterial);
        landingObject.name = "landing";
        scene.add( landingObject );
        params.count = 0;
    }

	function createSelect(){
		var select = document.getElementById("location-select");
		for(var i = 0; i<distinctLocations.length;i++){
			var l = document.createElement("option");
			l.value = i;
			l.text = distinctLocations[i].detected_location_name;
			select.options.add(l);
		}
// 		select.onchange = "goSelectedLocation(this.value)";
		select.style.visibility = "visible";
	}

	gui.add(params,'date').listen();
	gui.add(params,'zoom',1,14).listen();
//         gui.add(params,'count').listen();
	gui.add(params,'speed',0,15).listen();
	gui.add(params,'restart');
	landingGui = gui.addFolder('actions');
	params.global = function(){goGlobal();}
	landingGui.add(params,'global');
	params.histogram = function(){goHistogram();}
	landingGui.add(params,'histogram');
	params.birds_eye = function(){goBirdsEye();}
	landingGui.add(params,'birds_eye');
	params.autoPlay = function(){autoPlay();}
	landingGui.add(params,'autoPlay');
	params.user = function(){goUser();}
	landingGui.add(params,'user');
	params.local = function(){goLocal();}
	landingGui.add(params,'local');
	landingGui.open();
//         params.local = function(){goLocal();}
//         gui.add(params,'local');

	goGlobal();

	console.log(landing);
	console.log(scene);
	console.log(userOptions);
}

function updateLanding(){
	raycaster.setFromCamera(mouse,camera);
	raycaster.params.Points.threshold = 1;
// 	intersected = raycaster.intersectObject(landingObject);
// 	if(intersected.length > 0) {
// 		console.log(intersected);
// 	}
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
		var cameraX = targLocation[0] + width * Math.cos(Math.PI/2.0+(params.count*0.001/Math.pow(2,params.speed)));
		var cameraY = targLocation[1] + height * Math.sin(Math.PI/2.0+(params.count*0.001/Math.pow(2,params.speed)));
		camera.up.set( 0, 0, 1 );
		camera.position.x = cameraX;
		camera.position.y = cameraY;
		camera.position.z = 400*world;
		camera.lookAt(targPos);
	}
    var frame = startTimestamp+params.count;
    var d = new Date(frame*1000);
    var lerpValue = 1/518400;
    params.date = d.toUTCString();
    var geometry = landingObject.geometry;
	var attributes = geometry.attributes;
	var locIndex;

	if(userOptions.timestamps[userOptions.surfIndex] < frame){
		if(userOptions.surfIndex < userOptions.locationIndices.length-1){
		userOptions.surfIndex++;
		userLocation = distinctLocations[userOptions.locationIndices[userOptions.surfIndex]];
		if (followingUser){
			scene.remove(selectedObject);
			interactive = true;
			console.log(userOptions.surfIndex+": "+userLocation.detected_location_name);
			var targLocation = latLngToPixel(userLocation.latitude,userLocation.longitude);
			var cameraX = targLocation[0] + width * Math.cos(Math.PI/2.0+((params.count+120)*0.001/Math.pow(2,params.speed)))
			var cameraY = targLocation[1] + height * Math.sin(Math.PI/2.0+((params.count+120)*0.001/Math.pow(2,params.speed)));
			camera.up.set( 0, 0, 1 );
			TWEEN.removeAll();
			var cameraTween = new TWEEN.Tween(camera.position).to({ x: cameraX, y: cameraY, z:400*world }, 2000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
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
		}
	}

	if(autoplaying){
// 		if(params.count%840 == 0) autoPlay();
	}

	var updateCount = 0;
	if(!goingLocal){
		for(var i = 0; i<attributes.alpha.array.length; i++){
			if(attributes.timestamp.array[i]-259200 < frame){
				if(attributes.timestamp.array[i] < frame){
					attributes.position.array[i*3] = attributes.target.array[i*3];
					attributes.position.array[i*3+1] = attributes.target.array[i*3+1];
					attributes.position.array[i*3+2] = attributes.scale.array[i]/Math.pow(2,params.zoom)*(params.zoom*0.5);
					attributes.alpha.array[i] = 1.0;
				} else {
					attributes.position.array[i*3] = attributes.emitter.array[i*3]+(attributes.target.array[i*3]-attributes.emitter.array[i*3])*(0.5+lerpValue*(frame-attributes.timestamp.array[i]+259200));
					attributes.position.array[i*3+1] = attributes.emitter.array[i*3+1]+(attributes.target.array[i*3+1]-attributes.emitter.array[i*3+1])*(0.5+lerpValue*(frame-attributes.timestamp.array[i]+259200));
					attributes.position.array[i*3+2] = attributes.swellSize.array[i]*0.1;
					attributes.alpha.array[i] = 1.0;
					attributes.alpha.array[i] = lerpValue*(frame-attributes.timestamp.array[i]+172800)*2;
				}
			} else {
				attributes.alpha.array[i] = 0.0;
			}
		}
		attributes.alpha.needsUpdate = true;
		attributes.position.needsUpdate = true;
	} else {
		for(var i = 0; i<attributes.alpha.array.length; i++){
			attributes.alpha.array[i] = fadeOut.fade;
		}
		attributes.alpha.needsUpdate = true;
	}
}

function autoPlay(){
	scene.remove(selectedObject);

	followingUser = false;
	autoplaying = true;
	interactive = true;

	camera.up.set( 0, 0, 1 );
	var num = Math.floor(Math.random()*30+1);
	autoLocation = distinctLocations[num];
	console.log(num+": "+autoLocation.detected_location_name);
	var targLocation = latLngToPixel(autoLocation.latitude,autoLocation.longitude);
	var cameraX = targLocation[0] + width * Math.cos(Math.PI/2.0+((params.count+120*Math.pow(2,params.speed))*0.001/Math.pow(2,params.speed)))
	var cameraY = targLocation[1] + height * Math.sin(Math.PI/2.0+((params.count+120*Math.pow(2,params.speed))*0.001/Math.pow(2,params.speed)));

	var cameraTween = new TWEEN.Tween(camera.position).to({ x: cameraX, y: cameraY, z:400*world }, 2000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: targLocation[0], y: targLocation[1], z: 0 }, 2000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:5},1000).easing(TWEEN.Easing.Quadratic.In).onComplete(function(){interactive=false;});
    var zoomTween2 = new TWEEN.Tween(params).to({zoom:4},1000).easing(TWEEN.Easing.Quadratic.Out).chain(zoomTween).start();

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
	scene.remove(selectedObject);

	followingUser = false;
	autoplaying = true;
	interactive = true;

	camera.up.set( 0, 0, 1 );
	autoLocation = distinctLocations[num];
	console.log(num+": "+autoLocation.detected_location_name);
	var targLocation = latLngToPixel(autoLocation.latitude,autoLocation.longitude);
	var cameraX = targLocation[0] + width * Math.cos(Math.PI/2.0+((params.count+120*Math.pow(2,params.speed))*0.001/Math.pow(2,params.speed)))
	var cameraY = targLocation[1] + height * Math.sin(Math.PI/2.0+((params.count+120*Math.pow(2,params.speed))*0.001/Math.pow(2,params.speed)));
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: cameraX, y: cameraY, z:400*world }, 2000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: targLocation[0], y: targLocation[1], z: 0 }, 2000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:5},1000).easing(TWEEN.Easing.Quadratic.In).onComplete(function(){interactive=false;});
    var zoomTween2 = new TWEEN.Tween(params).to({zoom:4},1000).easing(TWEEN.Easing.Quadratic.Out).chain(zoomTween).start();

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
	scene.remove(selectedObject);

	autoplaying = false;
	followingUser = true;
	interactive = true;

	userLocation = distinctLocations[userOptions.locationIndices[userOptions.surfIndex]];
	console.log(userOptions.surfIndex+": "+userLocation.detected_location_name);


	var targLocation = latLngToPixel(userLocation.latitude,userLocation.longitude);
	var cameraX = targLocation[0] + width * Math.cos(Math.PI/2.0+((params.count+60*Math.pow(2,params.speed))*0.001/Math.pow(2,params.speed)))
	var cameraY = targLocation[1] + height * Math.sin(Math.PI/2.0+((params.count+60*Math.pow(2,params.speed))*0.001/Math.pow(2,params.speed)));
	camera.up.set( 0, 0, 1 );
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: cameraX, y: cameraY, z:400*world }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: targLocation[0], y: targLocation[1], z: 0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:5},1000).easing(TWEEN.Easing.Quadratic.InOut).onComplete(function(){interactive=false;}).start();
	
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
	autoplaying = false;
	followingUser = false;
	camera.up.set( 0, -1, 1 );
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: width*0.5, y: height*0.5, z: 2000*world }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: width*0.5, y: height*0.5, z: 0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:1},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
	interactive = true;
	var geometry = landingObject.geometry;
	var attributes = geometry.attributes;
	var updateCount = 0;
    for(var i = 0; i<attributes.alpha.array.length; i++){
    	attributes.position.array[i*3+2] = 0;
    }
	attributes.position.needsUpdate = true;
}

function goHistogram(){
	autoplaying = false;
	followingUser = false;
	camera.up.set( 0, 0, 1 );
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: width*0.5, y: height*2.0, z:0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: width*0.5, y: height*0.5, z: 0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:1},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
// 	params.zoom = 1;
	interactive = true;
// 	camera.up.set( 0, 0, 1 );
//     camera.position.x = width*0.5;
// 	camera.position.y = height+300;
// 	camera.position.z = 0;
// 	targPos = new THREE.Vector3(width*0.5,height*0.5,0);
// 	camera.lookAt(targPos);
	var geometry = landingObject.geometry;
	var attributes = geometry.attributes;
	var updateCount = 0;
    for(var i = 0; i<attributes.alpha.array.length; i++){
    	attributes.position.array[i*3+2] = attributes.scale.array[i];
    }
	attributes.position.needsUpdate = true;
}

function goGlobal(){
	autoplaying = false;
	followingUser = false;
	params.speed = 11;
	goingLocal = false;
	TIME_SPACE = "landing";
	scene.remove(localObject);
	scene.remove(usersObject);
	camera.up.set( 0, 0, 1 );
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: width*0.5, y: height*1.8, z: height }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: width*0.5, y: height*0.5, z: 0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:1},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
// 	params.zoom = 1;
	interactive = true;
	//TODO camera lerp
// 	statsContainer.style.visibility = 'hidden';
// 	
// 	camera.zoom = Math.pow(2,params.zoom);
// 	camera.updateProjectionMatrix();
//     camera.position.x = width*0.5;
// 	camera.position.y = height*1.8;
// 	camera.position.z = height*world;
// 	targPos = new THREE.Vector3(width*0.5,height*0,0);
// 	camera.lookAt(targPos);
	var geometry = landingObject.geometry;
	var attributes = geometry.attributes;
	var updateCount = 0;
    for(var i = 0; i<attributes.alpha.array.length; i++){
    	attributes.position.array[i*3+2] = attributes.scale.array[i];
    }
	attributes.position.needsUpdate = true;
}

// function goNational(){
// 	interactive = true;
// 	//TODO camera lerp
// 	//TODO target object ie. NZ, HAWAII
// 	var t = latLngToPixel(-40.912061, 174.613711); //nz
// //	var t = latLngToPixel(-8.814031, 115.172323); //bali
// // 	var t = latLngToPixel(21.480012, -157.988218); //
// 	camera.up.set( 0, 0, 1 );
//     camera.position.x = t[0];
// 	camera.position.y = t[1]+50;
// 	camera.position.z = 30*world;
// 	targPos = new THREE.Vector3(t[0],t[1],0);
// 	camera.lookAt(targPos);
// 	var geometry = landingObject.geometry;
// 	var attributes = geometry.attributes;
// 	var updateCount = 0;
//     for(var i = 0; i<attributes.alpha.array.length; i++){
//     	attributes.position.array[i*3+2] = attributes.scale.array[i];
//     }
// 	attributes.position.needsUpdate = true;
// }

function goLocal(){
// 	TIME_SPACE = "local";
	goingLocal = true;
// 	params.speed = 6;
	var fade = new TWEEN.Tween(fadeOut).to({fade:0.0},500).easing(TWEEN.Easing.Quadratic.InOut).start();
	if(autoplaying) {
// 		queryOptions.query = generateQuery([autoLocation.detected_location_name]);
		queryLanding(autoLocation.detected_location_name,exitLanding);
	}
	if(followingUser) {
// 		queryOptions.query = generateQuery([userLocation.detected_location_name]);
		queryLanding(userLocation.detected_location_name,exitLanding);
	}
// 	var speedFade = new TWEEN.Tween(params).to({speed:6.0},2000).easing(TWEEN.Easing.Quadratic.InOut).start();
// 	queryOptions.query = generateQuery(["Lyall Bay, New Zealand"]);
// 	queryOptions.query = generateQuery(["Ohope Beach, New Zealand"]);
//     queryOptions.query = generateQuery(["Snapper Rocks, Australia",
//     	"Snapper Rocks, QLD, Australia",
//     	"Kirra, Australia",
//     	"Kirra, QLD, Australia",
//     	"Duranbah, Australia",
//     	"Duranbah, NSW, Australia"
//     ]);
//     queryOptions.query = generateQuery(["Fitzroy Beach, New Zealand"]);
// 	makeApiCall(queryOptions,exitLanding);
}

function queryLanding(locationName, callback){
	local = [];
	for(var i = 0; i < landing.length; i++){
		if(landing[i].detected_location_name == locationName && landing[i].speed_max < 40){
			local.push(landing[i]);
		}
// 		where detected_location_name = and speed_max < 50
	}
	callback();
}
// function exitLanding(rObject){
function exitLanding(){
	var name;
	var geometry = landingObject.geometry;
	var attributes = geometry.attributes;
	if(autoplaying) {
		name = autoLocation.detected_location_name;
	}
	if(followingUser) {
		name = userLocation.detected_location_name;
	}
	console.log(name);
// 	scene.remove(landingObject);
// 	landingObject = null;
	initLocal();
}

function generateQuery(ls){
	var qString = 'select * from sgps_15.surfs_timestamp ';
	ls.forEach(function(d,i){
		var st = d;
// 		var st = surfs[d].detected_location_name;
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