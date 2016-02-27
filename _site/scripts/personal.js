var particles, particle, polygons = [], land, waves = [];

var targVel = new THREE.Vector3(0, 0, 0),
    targAccel = new THREE.Vector3(0, 0, 0),
    camPos = new THREE.Vector3(0, 0, 0),
    camVel = new THREE.Vector3(0, 0, 0),
    camAccel = new THREE.Vector3(0, 0, 0);

var intersects;
var onWave = false;
var replaySpeed = 1;

var coastlineObject;
var sandObject;
var personalSwellObject;
var waveObject;
var waveThreshold = 10.0;
var personalTimeDiff = 0.0;
// var mouse = new THREE.Vector2(), raycaster = new THREE.Raycaster(),INTERSECTED,activeParticle, dir, intersectedIndex = -1, cleared = true;

function initPersonal() {
// 	TIME_SPACE = "personal"
// 	$("#steplist").fadeOut("fast");
	personalUniforms.stat.value = 0.0, personalUniforms.min.value = 0.0, personalUniforms.max.value = 10.0;

	bounds = {
		topLeft: {
			x: -180,
			y: -90
		},
		bottomRight: {
			x:180,
			y:90
		},
		center: {
			x: 0,
			y: 0,	
		}
	};

	loader.load(
		// resource URL
		"../textures/sprites/surf2.png",
		// Function when resource is loaded
		function ( texture ) {
			// do something with the texture
			personalUniforms.texture.value = texture;
		},
		function ( xhr ) {
			console.log( 'An error happened' );
		}
	);

	console.log(personal.data);

	personalTimeDiff = personal.data[0].date-personal.surfs[0].start_timestamp;

	//particle geometry
	function createParticles(){
		personalObject = new THREE.Group();
		personalObject.name = "personalObject";

		waveObject = new THREE.Group();
		waveObject.name = "waveObject";

		var vertices = new Float32Array( personal.data.length * 3 - 30 );
		var ptimestamps = [];
// 		new Float32Array( personal.data.length - 10 );
		var speeds = new Float32Array( personal.data.length - 10 );
		var accelerations = new Float32Array( personal.data.length * 3 - 30 );
		var rotations = new Float32Array( personal.data.length * 3 - 30 );

		var waveGeometry;
		var waveMaterial = new THREE.LineBasicMaterial({
			linewidth: 2,
			vertexColors: THREE.VertexColors,
			transparent: true,
			depthTest: false
		});

	  	var step = 1/50.0;

	  	var wGeometry, colors;
	  	var currentLocation = [0.0,0.0,0.0];
	  	var waveCount = 0;
	  	var onWave = false;
	  	var prev = {vertex: 0, color: 0};
// 	  	var pGeometry = new THREE.Geometry();

	  	for(var i = 0; i < personal.data.length; i++){
			var s = personal.data[i];

	        var location = [s.latitude, s.longitude, s.altitude];
	        var lat = s.latitude;
	        var lng = s.longitude;
	        if(lng > bounds.topLeft.x) bounds.topLeft.x = lng;
			if(lng < bounds.bottomRight.x) bounds.bottomRight.x = lng;
			if(lat > bounds.topLeft.y) bounds.topLeft.y = lat;
			if(lat < bounds.bottomRight.y) bounds.bottomRight.y = lat;
			
			var p = latLngToPixel(s.latitude,s.longitude);
			var vertex = new THREE.Vector3(p[0],p[1],0);
			ptimestamps[i] = i;

			if(s.speed < waveThreshold && !onWave){
				prev.vertex = vertex;
				var c1 = new THREE.Color(0x0000ff);
				var c2 = new THREE.Color(0x00ff00);
				c1.lerp(c2,s.speed*step);
				prev.color = c1;

				vertices[ i*3 ] = +vertex.x.toFixed(4);
				vertices[ i*3 + 1 ] = +vertex.y.toFixed(4);
				vertices[ i*3 + 2 ] = vertex.z;

				speeds[i] = s.speed;

				accelerations[ i*3 ] = s.xAccel;
				accelerations[ i*3 + 1 ] = s.yAccel;
				accelerations[ i*3 + 2 ] = s.zAccel;

				rotations[ i*3 ] = s.pitch;
				rotations[ i*3 + 1 ] = s.roll;
				rotations[ i*3 + 2 ] = s.yaw;


			} else if (s.speed < waveThreshold && onWave){
				onWave = false;

				var line = new THREE.Line(waveGeometry,waveMaterial, THREE.LineSegments);
				waveObject.add(line);
			}
			else if(!onWave){
				onWave = true;
				waveGeometry = new THREE.Geometry();

				waveGeometry.vertices.push(prev.vertex);
				waveGeometry.colors.push(prev.color);


				waveGeometry.vertices.push(vertex);
				var c1 = new THREE.Color(0x0000ff);
				var c2 = new THREE.Color(0x00ff00);
				c1.lerp(c2,s.speed*step);
				waveGeometry.colors.push(c1);
			} else if(onWave){
				waveGeometry.vertices.push(vertex);

				var c1 = new THREE.Color(0x0000ff);
				var c2 = new THREE.Color(0x00ff00);
				c1.lerp(c2,s.speed*step);
				waveGeometry.colors.push(c1);
			}
	    }
	    var timestamps = new Float32Array(ptimestamps);
	    console.log(timestamps);
	    var pGeometry = new THREE.BufferGeometry();
	    pGeometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
	    pGeometry.addAttribute( 'timestamp', new THREE.BufferAttribute( timestamps, 1 ) );
	    pGeometry.addAttribute( 'speed', new THREE.BufferAttribute(speeds,1));
	    pGeometry.addAttribute( 'acc', new THREE.BufferAttribute(accelerations,3));
	    pGeometry.addAttribute( 'rot', new THREE.BufferAttribute(rotations,3));

	    var points = new THREE.Points( pGeometry,personalMaterial);
	    personalObject.add(points);
	    personalObject.add(waveObject);

	}

	function createGrid(){
		var planeW = 50; // pixels
		var planeH = 50; // pixels 
		var numW = 50; // how many wide (50*50 = 2500 pixels wide)
		var numH = 50; // how many tall (50*50 = 2500 pixels tall)
		var plane = new THREE.Mesh(
		    new THREE.PlaneGeometry( planeW*numW, planeH*numH, planeW, planeH ),
		    new THREE.MeshBasicMaterial( {
		        color: 0x000000,
		        wireframe: true
		    } )
		);

		scene.add(plane);
	}

	function createSand(){
		sandObject = new THREE.Group();
		sandObject.name = "sand";
		var sLineMaterial = new THREE.LineBasicMaterial({
        	color: 0x707d34,
        	linewidth: 2,
        	linejoin: "round" 
    	});

    	var sMeshMaterial = new THREE.MeshBasicMaterial({
        	color: 0xffff00,
    	});

    	var sl = sand.features;
		for(var i = 0; i < sl.length;i++){
			var s = sl[i].geometry.coordinates[0];
			var isWithinBounds = false;
			for(var j = 0; j < s.length; j++){
				var p = s[j];
				if(checkBounds(p)){
					isWithinBounds = true;
					break;
				}
				isWithinBounds= false;
			}
			if(isWithinBounds){
				var sPoints = [];
				var sGeometry = new THREE.Geometry();
				for(var j = 0; j < s.length; j++){
					var p = s[j];
					var point = latLngToPixel(p[1],p[0]);
// 					var point = latLngToPixelWithZoom(p[1],p[0],testZoom);
					vertex = new THREE.Vector3(point[0],point[1],0);
					sGeometry.vertices.push(vertex);
					sPoints.push(vertex);
				}
// 				var sShape = new THREE.Shape(sPoints);
// 				var sShapeGeometry = new THREE.ShapeGeometry(sShape);
// 				var sMesh = new THREE.Mesh(sShapeGeometry,sMeshMaterial);
// 				sMesh.name = "sand";
// 				sandObject.add(sMesh);
				var sLine = new THREE.Line( sGeometry, sLineMaterial);
				sLine.name = "sand";
				sandObject.add(sLine);
			}
		}
	}

	function createCoastline(){
		scene.remove(coastlineObject);
		coastlineObject = new THREE.Group();
		coastlineObject.name = "coastline"
		var cMaterial = new THREE.LineBasicMaterial({
        	color: palette.landOutline,
        	linewidth: 2,
        	linejoin: "round" 
    	});

    	var cMeshMaterial = new THREE.MeshBasicMaterial({
        	color: 0x0000ff,
    	});

		var cl = coastline.features;
		for(var i = 0; i < cl.length;i++){
			if(cl[i].geometry.type == "MultiPolygon"){
				var cG = cl[i].geometry.coordinates;
				for(var j = 0; j < cG.length; j++){
					var c = cG[j][0];
					isWithinBounds = true;
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
				var isWithinBounds = false;
				for(var j = 0; j < c.length; j++){
					var p = c[j];
					isWithinBounds = true;
// 					if(checkBounds(p)){
// 						isWithinBounds = true;
// 						break;
// 					}
// 					isWithinBounds= false;
				}
			}
			if(isWithinBounds){
// 				var cPoints = [];
				var cGeometry = new THREE.Geometry();
				for(var j = 0; j < c.length; j++){
					var p = c[j];
					var point = latLngToPixel(p[1],p[0]);
// 					var point = [convertToRange(p[0],xBounds,[0,window.innerWidth]),convertToRange(p[1],yBounds,[0,window.innerHeight])];
// 					var point = latLngToPixelWithZoom(p[1],p[0],testZoom);
					vertex = new THREE.Vector3(point[0],point[1],0);
					cGeometry.vertices.push(vertex);
// 					cPoints.push(vertex);
				}
// 				var cShape = new THREE.Shape(cPoints);
// 				var cShapeGeometry = new THREE.ShapeGeometry(cShape);
// 				var cMesh = new THREE.Mesh(cShapeGeometry,cMeshMaterial);
// 				cMesh.name = "coastline";
// 				group.add(cMesh);
				var cLine = new THREE.Line( cGeometry, cMaterial);
				cLine.name = "coastline";
				coastlineObject.add(cLine);
			}
		}
	}

	function createSurfer(){

	}


	// createGrid();
	createSand();
	createCoastline();
	createParticles();

	scene.add(sandObject);
	scene.add(coastlineObject);
	scene.add(personalObject);

// 	params.count = 0;
	console.log(scene);
	var tBounds = [bounds.topLeft.y+(bounds.bottomRight.y-bounds.topLeft.y)/2,bounds.topLeft.x+(bounds.bottomRight.x-bounds.topLeft.x)/2];

	t = latLngToPixel(personal.surfs[0].latitude,personal.surfs[0].longitude);

	function createPersonalSwell(){
    	var pSGeometry = new THREE.PlaneGeometry( 0.5, 0.5);
    	var pSMaterial = new THREE.ShaderMaterial({
    		uniforms:       personalSwellUniforms,
			vertexShader:   document.getElementById( 'localSwell_vertexshader' ).textContent,
			fragmentShader: document.getElementById( 'localSwell_fragmentshader' ).textContent,
			blending:       THREE.NormalBlending,
			depthTest: 		false,
			transparent:    true

    	});
// 		var lSMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00, wireframe: true, transparent: true} );
		personalSwellObject = new THREE.Mesh( pSGeometry, pSMaterial );
		personalSwellObject.name = "localSwellObject";
		personalSwellObject.position.set(t[0],t[1],0);
    }
	
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: t[0], y: t[1]+0.0001*world, z:10*world }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
		camera.lookAt(targPos);
	}).onComplete(function(){
		interactive = false;
		scene.remove(selectedObject);
		scene.remove(mapObject);
		scene.remove(pilgrimageObject);
		scene.remove(localObject);
		params.speed = 1;
// 		if(personal.swell_direction != undefined){
// 			localSwellUniforms.direction.value = calculateSwellDirection(personal.swell_direction);
// 		}
		TIME_SPACE = "personal";
		params.count = (personal.data[0].date-personalTimeDiff)-startTimestamp;
	}).start();
	var targTween = new TWEEN.Tween(targPos).to({ x: t[0], y: t[1], z: 0.0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function(){
		camera.lookAt(targPos);
	}).start();
	var zoomTween = new TWEEN.Tween(params).to({zoom:17},1000).easing(TWEEN.Easing.Quadratic.In).start();

	$("#goPersonal-gui").slideUp("fast");
	$("#local-gui").slideUp("fast");
	$("#personal-gui").slideDown("fast");
}

function updatePersonal(){
	var d = new Date((startTimestamp+params.count)*1000);
	$("#date").text(dateFormat(d, "yyyy, mmmm dS, h:MM:ss TT"));
	camera.zoom = Math.pow(2,params.zoom);
	camera.updateProjectionMatrix();
	
	localSurfUniforms.time.value = startTimestamp+params.count;
	localSurfUniforms.zoom.value = Math.pow(2,params.zoom)/(params.zoom*0.5);
	localSwellObject.position.set(t[0],t[1],0.0);
	localSwellObject.scale.set(0.1,0.1,1.0);
	localSwellObject.rotation.z = Math.PI/2.0-localSwellUniforms.direction.value;

	personalSwellUniforms.time.value = startTimestamp+params.count;
	personalSwellUniforms.zoom.value = Math.pow(2,params.zoom)/(params.zoom*0.5);
// 	personalSwellUniforms.rotation.z = Math.PI/2.0-personalSwellUniforms.direction.value;

	personalSwellUniforms.time.value = startTimestamp+params.count;
	personalSwellUniforms.zoom.value = Math.pow(2,params.zoom)/(params.zoom*0.5);

	personalUniforms.time.value = startTimestamp+params.count-personal.surfs[0].start_timestamp;
	personalUniforms.zoom.value = Math.pow(2,params.zoom)/(params.zoom*0.5);
	//speed
// 	personalUniforms.stat.value = 0.0, personalUniforms.min.value = 0.0, personalUniforms.max.value = 10.0;
// 	personalUniforms.stat.value = 1.0, personalUniforms.min.value = -30.0, personalUniforms.max.value = 30.0;
// 	personalUniforms.stat.value = 2.0, personalUniforms.min.value = -30.0, personalUniforms.max.value = 40.0;
// 	personalUniforms.stat.value = 3.0, personalUniforms.min.value = -20.0, personalUniforms.max.value = 30.0;
	//pitch
// 	personalUniforms.stat.value = 4.0, personalUniforms.min.value = 0, personalUniforms.max.value = Math.PI/2.0;
	//direction
// 	personalUniforms.stat.value = 6.0, personalUniforms.min.value = -Math.PI, personalUniforms.max.value = Math.PI;
	
	
}

function showSpeed(){
	personalUniforms.stat.value = 0.0, personalUniforms.min.value = 0.0, personalUniforms.max.value = 10.0;
}

function showPitch(){
	personalUniforms.stat.value = 4.0, personalUniforms.min.value = 0, personalUniforms.max.value = Math.PI/2.0;
}

function showYaw(){
	personalUniforms.stat.value = 6.0, personalUniforms.min.value = -Math.PI, personalUniforms.max.value = Math.PI;
}


function updateCamera(frameNumber){
	var surfer = new THREE.Vector3(convertToRange(personal.data[frameNumber].longitude,xBounds,[0,window.innerWidth]),
		convertToRange(personal.data[frameNumber].latitude,yBounds,[0,window.innerHeight]));
// 	var p = latLngToPixelWithZoom(personal.data[frameNumber].latitude,personal.data[frameNumber].longitude,testZoom);
// 	var surfer = new THREE.Vector3(p[0],p[1]);
	surfer.sub(targPos);
	var d = surfer.length();
	surfer.normalize();
	if(d<100) {
		var m = convertToRange(d,[0.0,100.0],[0.0,2.0]);
		surfer.multiplyScalar(m);
	} else {
		surfer.multiplyScalar(2.0);
	}
	var force = new THREE.Vector3();
	force.subVectors(surfer,targVel);
	// force.clampScalar(-.5,.5);
	// console.log(force);
	targAccel.add(force);
	targVel.add(targAccel);
	targPos.add(targVel);
	targAccel.multiplyScalar(0.0);

// 	var lookAtPoint = new THREE.Vector3();
// 	lookAtPoint.x = convertToRange(personal.data[frameNumber].lng,xBounds,[0,window.innerWidth]);
// 	lookAtPoint.y = convertToRange(personal.data[frameNumber].lat,yBounds,[0,window.innerHeight]);
	camera.lookAt( targPos );

	camera.position.x = camPos.x;
	camera.position.y = camPos.y;
	camera.position.z = 20;
}

function updateParticle(frameNumber){
	var step = 1/40;
	var n = 10;
	var h = 3;
	var geometry = particles.geometry;
	var attributes = geometry.attributes;
// 	if(activeParticle !== undefined){
// 		attributes.position.array[activeParticle*3+2] = 0.0;
// 	}
	if(frameNumber > n && frameNumber < personal.data.length - n){
		for(var i = 0; i<n-1;i++){
// 			attributes.position.array[(frameNumber-i)*3+2] = h-i*h/n;
			attributes.position.array[(frameNumber-i)*3+2] = Math.cos(-i/n*2);
		}
// 		attributes.position.array[frameNumber*3+2] = h; 
		for(var i = 0; i<n-1;i++){
// 			attributes.position.array[(frameNumber+i)*3+2] = h-i*h/n;
			attributes.position.array[(frameNumber+i)*3+2] = Math.cos(i/n*2);
		}
	}
// 	attributes.position.array[frameNumber*3+2] = 5.0; 
	attributes.position.needsUpdate = true;
	activeParticle = frameNumber;
}

function intersectSurfData(raycaster){
	var geometry = particles.geometry;
	var attributes = geometry.attributes;
	intersects = raycaster.intersectObject( particles );
	if ( intersects.length > 0 ) {

	}
  }

function checkBounds(loc){
	var x = 0.1;

	

  	if(loc[0] < bounds.bottomRight.x && loc[0] > bounds.topLeft.x && loc[1] < bounds.bottomRight.y && loc[1] > bounds.topLeft.y){
    	return true;
  	}
  	return false;
}

function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}