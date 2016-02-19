var currentTime;
var followingUser = false;
var autoplaying = false;
var goingLocal = false;
var fadeOut = {fade: 0.0, drop: 1.0};
var selectedObject;
var planeMesh;

var localButton;
var landingGui;
var mapObject;
var emitterObject;

var timeline;

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
	scene.fog = new THREE.FogExp2( 0xffffff, 0.0025 );
//     scene.fog = null;

	gui = new dat.GUI({
		autoPlace: false,
	});

	var customContainer = document.getElementById('gui-container');
	customContainer.appendChild(gui.domElement);

	$('#gui-container').mouseenter(function(){
		$(this).animate({left:'0px'},350);
	});

	$('#gui-container').mouseleave(function(){
		$(this).delay(500).animate({left:'-250px'},350);
	});

	timeline = document.createElement("INPUT");
    timeline.setAttribute("type", "range");
    timeline.style.width = "90%";
    timeline.style.margin = "0px 5%";
    timeline.step = 0.1;
    timeline.value = 0;
    document.getElementById("timeline-centered").appendChild(timeline);
	
	createSelect();

	createWorld();
	createEmitters();
	createGlobalSurfs();

	function createWorld(){
		var group = new THREE.Group();
		group.name = "coastline"
		scene.add(group);
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
				group.add(cMesh);
// 				var cLine = new THREE.Line( cGeometry, cMaterial);
// 				cLine.name = "coastline";
// 				group.add(cLine);
			}
		}
	}
	
    function createGlobalSurfs(){
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
            var lat = +s.latitude.toFixed(1);
            var lng = +s.longitude.toFixed(1);
            var z = 0;
			if(s.hasOwnProperty("detected_location_name")){
				var name1 = s.detected_location_name.split(",");
				for(var j = 0; j < distinctLocations.length; j++){
					var name2 = distinctLocations[j].detected_location_name.split(",");
					if(name1[0] == name2[0]){
						lat = distinctLocations[j].latitude;
						lng = distinctLocations[j].longitude;
						landing[i].detected_location_name = distinctLocations[j].detected_location_name;
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
            
            timestamps[i] = parseFloat(s.start_timestamp) ;
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
		var select = document.getElementById("location-select")
		select.style.marginTop = '50px';
		for(var i = 0; i<distinctLocations.length;i++){
			var l = document.createElement("option");
			l.value = i;
			l.text = distinctLocations[i].detected_location_name;
			select.options.add(l);
		}
		customContainer.appendChild(select);
		select.style.visibility = "visible";
		
	}

	gui.add(params,'date').listen();
	gui.add(params,'zoom',1,14).listen();
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
// 	params.local = function(){goLocal();}
// 	landingGui.add(params,'local');
	landingGui.open();

	goGlobal();

	// console.log(landing);
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
// 	createEmitters();
	emitterObject.visible = false;
	mapObject.visible = false;
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
		var cameraX = targLocation[0] + width * Math.cos(Math.PI/2.0+(params.count*0.001/Math.pow(2,params.speed)));
		var cameraY = targLocation[1] + width * Math.sin(Math.PI/2.0+(params.count*0.001/Math.pow(2,params.speed)));
		camera.up.set( 0, 0, 1 );
		camera.position.x = cameraX;
		camera.position.y = cameraY;
		camera.position.z = 400*world;
		camera.lookAt(targPos);
	}
	swellUniforms.time.value = startTimestamp+params.count;
	swellUniforms.zoom.value = Math.pow(2,params.zoom)/(params.zoom*0.5);
	swellUniforms.alpha.value = fadeOut.fade;
    var frame = startTimestamp+params.count;
    var d = new Date(frame*1000);
    var lerpValue = 1/518400;
    params.date = d.toUTCString();
    var geometry = landingObject.geometry;
	var attributes = geometry.attributes;
	var locIndex;
	if(userOptions.timestamps[userOptions.surfIndex]-43200*params.speed < frame){
		if(userOptions.timestamps[userOptions.surfIndex] < frame){
			if(userOptions.surfIndex < userOptions.locationIndices.length-1){
				var name1;
				if(userLocation != null){
					name1 = userLocation.detected_location_name.split(",");
				} else {
					name1 = ["nothing"];
				}
				userOptions.surfIndex++;
				userLocation = distinctLocations[userOptions.locationIndices[userOptions.surfIndex]];
				var name2 = userLocation.detected_location_name.split(",");
				if (followingUser && name1[0] != name2[0]){
					scene.remove(selectedObject);
					interactive = true;
					console.log(userOptions.surfIndex+": "+userLocation.detected_location_name);
					var targLocation = latLngToPixel(userLocation.latitude,userLocation.longitude);
					var cameraX = targLocation[0] + width * Math.cos(Math.PI/2.0+((params.count+120)*0.001/Math.pow(2,params.speed)))
					var cameraY = targLocation[1] + width * Math.sin(Math.PI/2.0+((params.count+120)*0.001/Math.pow(2,params.speed)));
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
	}
	var updateCount = 0;
}

function autoPlay(){
	$('#information2').fadeOut("fast");
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
	var cameraY = targLocation[1] + width * Math.sin(Math.PI/2.0+((params.count+120*Math.pow(2,params.speed))*0.001/Math.pow(2,params.speed)));

	var cameraTween = new TWEEN.Tween(camera.position).to({ x: cameraX, y: cameraY, z:400*world }, 2000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: targLocation[0], y: targLocation[1], z: 0 }, 2000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:5},1000).easing(TWEEN.Easing.Quadratic.In).onComplete(function(){
    	var info = document.getElementById("information2");
    	info.style.left = width/2+5 +"px";
    	info.style.top = height/2+5 +"px";
    	$('#information2').fadeTo("slow",0.5);
    });
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
	$('#information2').fadeOut("fast");
	scene.remove(selectedObject);

	followingUser = false;
	autoplaying = true;
	interactive = true;

	camera.up.set( 0, 0, 1 );
	autoLocation = distinctLocations[num];
	console.log(num+": "+autoLocation.detected_location_name);
	var targLocation = latLngToPixel(autoLocation.latitude,autoLocation.longitude);
	var cameraX = targLocation[0] + width * Math.cos(Math.PI/2.0+((params.count+120*Math.pow(2,params.speed))*0.001/Math.pow(2,params.speed)))
	var cameraY = targLocation[1] + width * Math.sin(Math.PI/2.0+((params.count+120*Math.pow(2,params.speed))*0.001/Math.pow(2,params.speed)));
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: cameraX, y: cameraY, z:400*world }, 2000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: targLocation[0], y: targLocation[1], z: 0 }, 2000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:5},1000).easing(TWEEN.Easing.Quadratic.In).onComplete(function(){
    	interactive=false;

    	});
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
	$('#information2').fadeOut("fast");
	scene.remove(selectedObject);

	autoplaying = false;
	followingUser = true;
	interactive = true;

	userLocation = distinctLocations[userOptions.locationIndices[userOptions.surfIndex]];
	console.log(userOptions.surfIndex+": "+userLocation.detected_location_name);


	var targLocation = latLngToPixel(userLocation.latitude,userLocation.longitude);
	var cameraX = targLocation[0] + width * Math.cos(Math.PI/2.0+((params.count+60*Math.pow(2,params.speed))*0.001/Math.pow(2,params.speed)))
	var cameraY = targLocation[1] + width * Math.sin(Math.PI/2.0+((params.count+60*Math.pow(2,params.speed))*0.001/Math.pow(2,params.speed)));
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
	$('#information2').fadeOut("fast");
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
}

function goHistogram(){
	$('#information2').fadeOut("fast");
	autoplaying = false;
	followingUser = false;
	camera.up.set( 0, 0, 1 );
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: width*0.5, y: height*2.0, z:0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: width*0.5, y: height*0.5, z: 0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:1},1000).easing(TWEEN.Easing.Quadratic.InOut).start();

	interactive = true;

	var geometry = landingObject.geometry;
	var attributes = geometry.attributes;
	var updateCount = 0;
}

function goGlobal(){
	$('#information2').fadeOut("fast");
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
	interactive = true;

	var geometry = landingObject.geometry;
	var attributes = geometry.attributes;
	var updateCount = 0;
}


function goLocal(){
	$('#information2').fadeOut("fast");

	goingLocal = true;
	params.speed = 11;
	var fade = new TWEEN.Tween(fadeOut).to({fade:-1.0},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
	if(autoplaying) {

		queryLanding(autoLocation.detected_location_name,exitLanding);
	}
	if(followingUser) {

		queryLanding(userLocation.detected_location_name,exitLanding);
	}
}

function queryLanding(locationName, callback){
	local = [];
	for(var i = 0; i < landing.length; i++){
		if(landing[i].detected_location_name == locationName && landing[i].speed_max < 35){
			local.push(landing[i]);
		}

	}
	callback();
}

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