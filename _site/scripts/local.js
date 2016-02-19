var currentTime;

var testZoom = 10;
var t, end;
var users;
var grid;
var showcase;
var splashes;
var pilgrimageObject;
var localGui;
var goingPersonal = false;
var personal = false;
var topUsers = {
	surfCount:{id:"",value:0},
	waveCount:{id:"",value:0},
	distanceWaves:{id:"",value:0},
	distanceTotal:{id:"",value:0},
	duration:{id:"",value:0},
	speedMax:{id:"",value:0}
	};

var bounds;
var startFrame;
var pilgrimStartIndex;
var splashStartIndex;

function initLocal() {
	users = [];
	topUsers = {
		surfCount:{id:"",value:0},
		waveCount:{id:"",value:0},
		distanceWaves:{id:"",value:0},
		distanceTotal:{id:"",value:0},
		duration:{id:"",value:0},
		speedMax:{id:"",value:0}
		};
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

	
	splashes = new THREE.Group();
	splashes.name = "splashes";
	scene.add(splashes);

    createLocalSurfs();

    // 	function createCoastline(){
// 		var group = new THREE.Group();
// 		group.name = "coastline"
// 		scene.add(group);
// 		var cMaterial = new THREE.LineBasicMaterial({
//         	color: 0x0000f0,
//         	linewidth: 2,
//         	linejoin: "round" 
//     	});

//     	var cMeshMaterial = new THREE.MeshBasicMaterial({
//         	color: 0x0000ff,
//     	});

// 		var cl = coastline.features;
// 		for(var i = 0; i < cl.length;i++){
// 			if(cl[i].geometry.type == "MultiPolygon"){
// 				var cG = cl[i].geometry.coordinates;
// 				for(var j = 0; j < cG.length; j++){
// 					var c = cG[j][0];
// 					for(var k = 0; k < c.length; k++){
// 						var p = c[k];
// 						if(checkBounds(p)){
// 							isWithinBounds = true;
// 							break;
// 						}
// 						isWithinBounds= false;
// 					}
// 				}
// 			} else {
// 				var c = cl[i].geometry.coordinates[0];
// 				var isWithinBounds = false;
// 				for(var j = 0; j < c.length; j++){
// 					var p = c[j];
// 					if(checkBounds(p)){
// 						isWithinBounds = true;
// 						break;
// 					}
// 					isWithinBounds= false;
// 				}
// 			}
// 			if(isWithinBounds){
// // 				var cPoints = [];
// 				var cGeometry = new THREE.Geometry();
// 				for(var j = 0; j < c.length; j++){
// 					var p = c[j];
// 					var point = [convertToRange(p[0],xBounds,[0,window.innerWidth]),convertToRange(p[1],yBounds,[0,window.innerHeight])];
// // 					var point = latLngToPixelWithZoom(p[1],p[0],testZoom);
// 					vertex = new THREE.Vector3(point[0],point[1],0);
// 					cGeometry.vertices.push(vertex);
// // 					cPoints.push(vertex);
// 				}
// // 				var cShape = new THREE.Shape(cPoints);
// // 				var cShapeGeometry = new THREE.ShapeGeometry(cShape);
// // 				var cMesh = new THREE.Mesh(cShapeGeometry,cMeshMaterial);
// // 				cMesh.name = "coastline";
// // 				group.add(cMesh);
// 				var cLine = new THREE.Line( cGeometry, cMaterial);
// 				cLine.name = "coastline";
// 				group.add(cLine);
// 			}
// 		}
// 	}

    function createLocalSurfs(){
    	scene.remove(localObject);
//     	localObject = new THREE.Points();
//     	localObject.name = "local";
//     	scene.add(localObject);
		
		pilgrimageObject = new THREE.Group();
		pilgrimageObject.name = "pilgrimage";
		scene.add(pilgrimageObject);

		var pGeometry = new THREE.Geometry();
		var pMaterial = new THREE.PointsMaterial({color: 0xff9100});

		var positions = new Float32Array(local.length*3);
		var colors = new Float32Array(local.length*3);

		for(var i = 0; i < local.length; i++){

			// find previous location and add to data.
			local[i].visible = false;
			local[i].splash = false;

			var location = local[i];
			var lat = +location.latitude.toFixed(4);
            var lng = +location.longitude.toFixed(4);
			var p = latLngToPixel(lat,lng);
			
			for(var j = 0; j < userOptions.surfIds.length; j++){
				if(location.surf_id == userOptions.surfIds[j]){
					personal = true;
				}
			}

			var cString = "#"+location.id.substring(0,6);
			var c1 = new THREE.Color(cString);

			//find bounds
			if(lng > bounds.topLeft.x) bounds.topLeft.x = lng;
			if(lng < bounds.bottomRight.x) bounds.bottomRight.x = lng;
			if(lat > bounds.topLeft.y) bounds.topLeft.y = lat;
			if(lat < bounds.bottomRight.y) bounds.bottomRight.y = lat;
			
			//find top users and create unique users.
			if(users.length == 0) {
				topUsers.surfCount.id = location.id;
				topUsers.waveCount.id = location.id;
				topUsers.distanceWaves.id = location.id;
				topUsers.distanceTotal.id = location.id;
				topUsers.duration.id = location.id;
				topUsers.speedMax.id = location.id;
				topUsers.surfCount.value = 1;
				topUsers.waveCount.value = parseInt(location.wave_count);
				topUsers.distanceWaves.value = location.distance_waves;
				topUsers.distanceTotal.value = location.distance_total;
				topUsers.duration.value = parseFloat(location.duration);
				topUsers.speedMax.value = location.speed_max;
				var u = {
					id:local[i].id,
					surfCount:1,
					waveCount:parseInt(location.wave_count),
					distanceWaves:location.distance_waves,
					distanceTotal:location.distance_total,
					duration: parseFloat(location.duration),
					vertices:[p]
					};
				users.push(u);
			} else {
				var newUser = true;
				for(var j = 0; j < users.length; j++){
					if(users[j].id == local[i].id){
						newUser = false;
						users[j].surfCount++;
						users[j].waveCount += parseInt(location.wave_count);
						users[j].distanceWaves += location.distance_waves;
						users[j].distanceTotal += location.distance_total;
						users[j].duration += parseFloat(location.duration);
						users[j].vertices.push(p);

						if(users[j].surfCount > topUsers.surfCount.value){
							topUsers.surfCount.id = users[j].id;
							topUsers.surfCount.value = users[j].surfCount;
						}
						if(users[j].waveCount > topUsers.waveCount.value){
							topUsers.waveCount.id = users[j].id;
							topUsers.waveCount.value = users[j].waveCount;
						}
						if(users[j].distanceWaves > topUsers.distanceWaves.value){
							topUsers.distanceWaves.id = users[j].id;
							topUsers.distanceWaves.value = users[j].distanceWaves;
						}
						if(users[j].distanceTotal > topUsers.distanceTotal.value){
							topUsers.distanceTotal.id = users[j].id;
							topUsers.distanceTotal.value = users[j].distanceTotal;
						}
						if(users[j].duration > topUsers.duration.value){
							topUsers.duration.id = users[j].id;
							topUsers.duration.value = users[j].duration;
						}
						if(location.speed_max > topUsers.speedMax.value){
							topUsers.speedMax.id = users[j].id;
							topUsers.speedMax.value = location.speed_max;
						}
						break;
					} else {
						newUser = true;
					}
				}
				if(newUser) {
					var u = {
						id:local[i].id,
						surfCount:1,
						waveCount:parseInt(location.wave_count),
						distanceWaves:location.distance_waves,
						distanceTotal:location.distance_total,
						duration: parseFloat(location.duration),
						vertices:[p]
						};
					users.push(u);
					if(u.surfCount > topUsers.surfCount.value){
						topUsers.surfCount.id = u.id;
						topUsers.surfCount.value = u.surfCount;
					}
					if(u.waveCount > topUsers.waveCount.value){
						topUsers.waveCount.id = u.id;
						topUsers.waveCount.value = u.waveCount;
					}
					if(u.distanceWaves > topUsers.distanceWaves.value){
						topUsers.distanceWaves.id = u.id;
						topUsers.distanceWaves.value = u.distanceWaves;
					}
					if(u.distanceTotal > topUsers.distanceTotal.value){
						topUsers.distanceTotal.id = u.id;
						topUsers.distanceTotal.value = u.distanceTotal;
					}
					if(u.duration > topUsers.duration.value){
						topUsers.duration.id = u.id;
						topUsers.duration.value = u.duration;
					}
					if(location.speed_max > topUsers.speedMax.value){
						topUsers.speedMax.id = location.id;
						topUsers.speedMax.value = location.speed_max;
					}
				}
			}
			
			pGeometry.vertices.push(new THREE.Vector3(p[0],p[1],0.0));
// 			var curve = new THREE.EllipseCurve(
// 				p[0],  p[1],            // ax, aY
// 				0.0002, 0.0002,           // xRadius, yRadius
// 				0,  2 * Math.PI,  // aStartAngle, aEndAngle
// 				false,            // aClockwise
// 				0                 // aRotation 
// 			);

// 			var path = new THREE.Path( curve.getPoints( 50 ) );
// 			var geometry = path.createPointsGeometry( 50 );
// 			var material = new THREE.LineBasicMaterial( { color : c1, transparent: true, linewidth: 2 } );

// 			// Create the final Object3d to add to the scen
// 			var ellipse = new THREE.Line( geometry, material );
// 			ellipse.name = location.id;
// 			localObject.add(ellipse);
		}
		localObject = new THREE.Points(pGeometry,pMaterial);
    	localObject.name = "local";
    	scene.add(localObject);

    }
	
	var tBounds = [bounds.topLeft.y+(bounds.bottomRight.y-bounds.topLeft.y)/2,bounds.topLeft.x+(bounds.bottomRight.x-bounds.topLeft.x)/2];

	t = latLngToPixel(tBounds[0],tBounds[1]);

	localCamera = new THREE.PerspectiveCamera( 75, window.innerWidth/ window.innerHeight, 1, 10000000 );
	localCamera.up.set( 0, -1, 1 );
	localCamera.position.x = t[0];
	localCamera.position.y = t[1];
	localCamera.position.z = 1.5*world;
	var drop = new TWEEN.Tween(fadeOut).to({drop:0.0},500).easing(TWEEN.Easing.Quadratic.In).onComplete(function(){
		interactive = true;
		var cameraTween = new TWEEN.Tween(camera.position).to({ x: t[0]+10*world, y: t[1]+1*world, z:1.5*world }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
			camera.lookAt(targPos);
		}).onComplete(function(){
			TIME_SPACE = 'local';
			interactive = false;
			scene.remove(selectedObject);
		}).start();
		var targTween = new TWEEN.Tween(targPos).to({ x: t[0], y: t[1], z: 0.005*world }, 1000).easing(TWEEN.Easing.Quadratic.InOut).start();
		var targTween = new TWEEN.Tween(params).to({ zoom: 6 }, 2000).easing(TWEEN.Easing.Quadratic.InOut).start();
	});
	var jump = new TWEEN.Tween(fadeOut).to({drop:1.1},100).easing(TWEEN.Easing.Quadratic.Out).chain(drop).start();

	gui.removeFolder("actions");
	localGui = gui.addFolder('local');
	params.surfCount = function(){showSurfCount();}
	localGui.add(params,'surfCount');
	params.waveCount = function(){showWaveCount();}
	localGui.add(params,'waveCount');
	params.distanceWaves = function(){showDistanceWaves();}
	localGui.add(params,'distanceWaves');
	params.distanceTotal = function(){showDistanceTotal();}
	localGui.add(params,'distanceTotal');
	params.duration = function(){showDuration();}
	localGui.add(params,'duration');
	params.speedMax = function(){showSpeedMax();}
	localGui.add(params,'speedMax');
	if(personal){
		params.personal = function(){goPersonal();}
		localGui.add(params, 'personal');
	}
	params.returnToLanding = function(){returnToLanding();}
	localGui.add(params,'returnToLanding');
	localGui.open();

// 	params.restart();
	startFrame = startTimestamp+params.count;
	pilgrimStartIndex = -1;
	splashStartIndex = -1;

    console.log(scene);
    console.log(camera);
    console.log(local);
    console.log(users);
    console.log(topUsers);
    console.log(bounds);
    console.log(tBounds);
}

function updateLocal(){
	var targLocation;

// 		camera.up.set( 0, -1, 1 );
// 		camera.position.x = targPos.x;
// 		camera.position.y = targPos.y;
// 		camera.position.z = 5.0*world;
// 		camera.lookAt(targPos);
// 		params.zoom = 1;
	camera.zoom = Math.pow(2,params.zoom);
	camera.updateProjectionMatrix();

	
	var frame = startTimestamp+params.count;
	var d = new Date(frame*1000);
	var start = 43200*params.speed;
	var lerpValue = 1/start;
    params.date = d.toUTCString();
	if(!goingPersonal){
		if(followingUser && userOptions.timestamps[userOptions.surfIndex]-43200*params.speed < frame){
		console.log("about to move");
			if(userOptions.timestamps[userOptions.surfIndex] < frame){
				if(userOptions.surfIndex < userOptions.locationIndices.length-1){
					var name1 = userLocation.detected_location_name.split(",");
					userOptions.surfIndex++;
					userLocation = distinctLocations[userOptions.locationIndices[userOptions.surfIndex]];
					var name2 = userLocation.detected_location_name.split(",");
					console.log(userLocation.detected_location_name);
					if(name1[0] != name[0]){
// 						returnToLanding();
					}
// 					
				}
			}
		}

		for(var i = 0; i < local.length; i++){
			//create pilgrim and animate in;
			if(local[i].start_timestamp-start < frame && local[i].start_timestamp > frame){
				if(pilgrimStartIndex == -1) pilgrimStartIndex = i;
				if(local[i].visible == false){
					//create the object
					local[i].visible = true;
					local[i].previous_location = null;
					for(var j = 0; j< landing.length; j++){
						if(local[i].id == landing[j].id && landing[j].start_timestamp < local[i].start_timestamp && landing[j].location != undefined){
							local[i].previous_location = [landing[j].latitude,landing[j].longitude,landing[j].location,local[i].start_timestamp-landing[j].start_timestamp];
						}
					}
	// 				console.log(local[i].previous_location);
					createPilgrim(i);
				} else {
					if(local[i].previous_location != null && i >= pilgrimStartIndex){
						var surf = pilgrimageObject.children[i-pilgrimStartIndex];
						var geometry = surf.geometry;
						var attributes = geometry.attributes;
						for( var k = 0; k < attributes.alpha.array.length; k++){
							if(k<(frame-local[i].start_timestamp+start)*lerpValue*attributes.alpha.array.length){
								attributes.alpha.array[k] = 1.2-(frame-local[i].start_timestamp+start)*lerpValue;
							}
	// 	 						attributes.alpha.array[k] = 1.0-(frame-local[i].start_timestamp+start)*lerpValue;
						}
						attributes.alpha.needsUpdate = true;
					}
				}
// 			} else if(local[i].start_timestamp < frame && local[i].start_timestamp+start > frame){
// 				splash
// 				if(splashStartIndex == -1) splashStartIndex = i;
// 				if(local[i].splash == false){
// 					//create the object
// 					console.log(local[i])
// 					local[i].splash = true;
// 					createSplash(i);
// 					for(var j = 0; j < userOptions.surfIds.length; j++){
// 						if(local[i].surf_id == userOptions.surfIds[j]){
// 							personal = local[i];
// 							params.speed = 1;
// 							console.log("going personal");
// 							goPersonal();
// 						}
// 					}
// 				} else {
// 					var splash = splashes.children[i-splashStartIndex];
// 					var geometry = splash.geometry;
// 					var attributes = geometry.attributes;
// 					attributes.alpha.array[0] = 1.0-(frame-local[i].start_timestamp)*lerpValue*5;
// 					attributes.alpha.needsUpdate = true;
// 				}
			} else {
				local[i].visible = false;
				//local[i].splash = false;
			}
		}
	}
}

function showSurfCount(){
	console.log(topUsers.surfCount);
	createShowcase(topUsers.surfCount.id)
}

function showWaveCount(){
	console.log(topUsers.waveCount);
	createShowcase(topUsers.waveCount.id)
}

function showDistanceWaves(){
	console.log(topUsers.distanceWaves);
	createShowcase(topUsers.distanceWaves.id);
}

function showDistanceTotal(){
	console.log(topUsers.distanceTotal);
	createShowcase(topUsers.distanceTotal.id); 	
}

function showDuration(){
	console.log(topUsers.duration);
	createShowcase(topUsers.duration.id);
}

function showSpeedMax(){
	console.log(topUsers.speedMax);
	createShowcase(topUsers.speedMax.id);
}

function returnToLanding(){
	gui.removeFolder("local");
	landingGui = gui.addFolder('actions');
	landingGui.add(params,'global');
	landingGui.add(params,'histogram');
	landingGui.add(params,'birds_eye');
	landingGui.add(params,'autoPlay');
	landingGui.add(params,'user');
	landingGui.add(params,'local');
	landingGui.open();
	params.camera = camera;
	var fade = new TWEEN.Tween(fadeOut).to({fade:0.0},2000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function(){
		swellUniforms.alpha.value = fadeOut.fade;
	}).start();
	fadeOut.drop = 1.0;
	autoplaying = false;
	followingUser = false;
	goingLocal = false;
	TIME_SPACE = "landing";
	scene.remove(localObject);
	scene.remove(usersObject);
	scene.remove(grid);
	scene.remove(pilgrimageObject);
	scene.remove(showcase);
	scene.remove(splashes);
	scene.remove(personal);
	camera.up.set( 0, 0, 1 );
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: width*0.5, y: height*1.8, z: height }, 2000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: width*0.5, y: height*0, z: 0 }, 2000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:1},2000).easing(TWEEN.Easing.Quadratic.InOut).start();
	interactive = true;

	var geometry = landingObject.geometry;
	var attributes = geometry.attributes;
	var updateCount = 0;

}

function goPersonal(){
	exitLocal();
}

function exitLocal(){
	goingPersonal = true;
// 	scene.remove(localObject);
// 	scene.remove(usersObject);
// 	scene.remove(grid);
// 	scene.remove(pilgrimageObject);
// 	scene.remove(showcase);
// 	scene.remove(splashes);
	gui.removeFolder('local');
// 	localObject = null;
	personal.data = [];
	jsonpipe.flow('../local-sources/'+personal.surf_id+'.json', {
			"delimiter": "\n", // String. The delimiter separating valid JSON objects; default is "\n\n"
			"success": function(data) {
				// Do something with this JSON chunk
				personal.data.push(data);

			},
			"error": function(errorMsg) {
				console.log(errorMsg);
				// Something wrong happened, check the error message
			},
			"complete": function(statusText) {
				// Called after success/error, with the XHR status text
				console.log(personal);
				initPersonal();
			},
			"timeout": 10000, // Number. Set a timeout (in milliseconds) for the request
			"method": "GET", // String. The type of request to make (e.g. "POST", "GET", "PUT"); default is "GET"
			"headers": { // Object. An object of additional header key/value pairs to send along with request
				"X-Requested-With": "XMLHttpRequest"
			},
			"data": "", // String. A serialized string to be sent in a POST/PUT request,
			"withCredentials": true // Boolean. Send cookies when making cross-origin requests; default is true
	});
// 	initPersonal();
}

function createPilgrim(index){
	//create line
	var location = local[index];
	var lat = +location.latitude.toFixed(4);
	var lng = +location.longitude.toFixed(4);
	var p = latLngToPixel(lat,lng);

	var cString = "#"+location.id.substring(0,6);
	var c1 = new THREE.Color(cString);

	//create pilgrimage bezier
	if(location.previous_location != null){
		var name1 = local[index].detected_location_name.split(",");
		var name2 = local[index].previous_location[2].split(",");
		if(name1[name1.length-1] == name2[name2.length-1]){
			location.previous_location = null;
			
		}
		c1 = new THREE.Color(0xff0000);
// 		if(name1[name1.length-1] == name2[name2.length-1]){
// 			c1 = new THREE.Color(0x00ff00);
// 		} else {
// 			c1 = new THREE.Color(0xff0000);
// 		}
	}
	if(location.previous_location != null){
		console.log(location.previous_location[2]);
		console.log(location);
		var target = latLngToPixel(+location.latitude.toFixed(4),+location.longitude.toFixed(4));
		var previous = latLngToPixel(+location.previous_location[0].toFixed(4),+location.previous_location[1].toFixed(4))
		var e = new THREE.Vector2(previous[0] - target[0],previous[1] - target[1]);
		var m1 = new THREE.Vector2(target[0]+(e.x / e.length()*world),target[1]+(e.y/e.length()*world));
		var m2 = new THREE.Vector2(target[0]+(e.x / e.length()*world/2),target[1]+(e.y/e.length()*world/2));
		console.log(e.length()/location.previous_location[3]);
		var curvature = 0.2*world;

		var curve = new THREE.QuadraticBezierCurve3(
			new THREE.Vector3( m2.x, m2.y, curvature ),
			new THREE.Vector3( target[0], target[1], curvature ),
			new THREE.Vector3( target[0], target[1], 0 )
		);
		var pGeometry = new THREE.Geometry();
		pGeometry.vertices = curve.getPoints( 200 );

		var pVertices = pGeometry.vertices;
		var buffergeometry = new THREE.BufferGeometry();
		var position = new THREE.Float32Attribute( pVertices.length * 3, 3 ).copyVector3sArray( pVertices );
		buffergeometry.addAttribute( 'position', position )
		var alphas = new Float32Array( pVertices.length);
		for(var j = 0; j < pVertices.length; j++){
			alphas[j] = 0.0;
		}
		buffergeometry.addAttribute( 'alpha', new THREE.BufferAttribute(alphas,1));

		var uniforms = {
			color:     { type: "c", value: c1  },
			pointWidth:{ type: "f", value: 1.0},
		};

		var shaderMaterial = new THREE.ShaderMaterial( {

			uniforms:       uniforms,
			vertexShader:   document.getElementById( 'pilgrim_vertexshader' ).textContent,
			fragmentShader: document.getElementById( 'pilgrim_fragmentshader' ).textContent,
			blending:       THREE.NormalBlending,
			depthTest:      false,
			transparent:    true

		});

		var curveObject = new THREE.Line( buffergeometry, shaderMaterial );
		curveObject.name = location.id;
		pilgrimageObject.add(curveObject);
	} else {
		var curveObject = new THREE.Line();
		curveObject.name = location.id;
		pilgrimageObject.add(curveObject);
	}
// 	createSplash(location, c1);
}

function createSplash(index){

	var location = local[index];
	var lat = +location.latitude.toFixed(4);
	var lng = +location.longitude.toFixed(4);
	var p = latLngToPixel(lat,lng);

	var cString = "#"+location.id.substring(0,6);
	var c1 = new THREE.Color(cString);

	var uniforms = {
		color:     { type: "c", value: c1 },
		pointWidth:{ type: "f", value: 2.0},
	};

	var shaderMaterial = new THREE.ShaderMaterial( {

		uniforms:       uniforms,
		vertexShader:   document.getElementById( 'pilgrim_vertexshader' ).textContent,
		fragmentShader: document.getElementById( 'pilgrim_fragmentshader' ).textContent,
		blending:       THREE.NormalBlending,
		depthTest:      false,
		transparent:    true

	});

	var u;
	var buffergeometry = new THREE.BufferGeometry();

	var position = new Float32Array( 6 );
	var alphas = new Float32Array( 2 );

	for(var j = 0; j < 2; j++){
		var vertex = new THREE.Vector3(p[0],p[1],j*location.wave_count*0.005*world);
		position[j*3] = vertex.x;
		position[j*3+1] = vertex.y;
		position[j*3+2] = vertex.z;

		alphas[j] = 1-j;
// 				showGeometry.vertices.push(vertex);
	}

	buffergeometry.addAttribute( 'position', new THREE.BufferAttribute(position,3) )
	buffergeometry.addAttribute( 'alpha', new THREE.BufferAttribute(alphas,1));

	var splash = new THREE.Line( buffergeometry, shaderMaterial );
	splash.name = location.surf_id;
// 			var showLine = new THREE.Line(showGeometry,showMaterial);
	splashes.add(splash);
}

function createShowcase(id){
	scene.remove(showcase);
	var cString = "#"+id.substring(0,6);
	var c1 = new THREE.Color(cString);
	showcase = new THREE.Group();
	showcase.name = "showcase";
	scene.add(showcase);

// 	var showGeometry = new THREE.Geometry();
	var showMaterial = new THREE.LineBasicMaterial({color: c1, linewidth: 2, transparent: true});
	var uniforms = {
		color:     { type: "c", value: c1 }
	};

	var shaderMaterial = new THREE.ShaderMaterial( {

		uniforms:       uniforms,
		vertexShader:   document.getElementById( 'pilgrim_vertexshader' ).textContent,
		fragmentShader: document.getElementById( 'pilgrim_fragmentshader' ).textContent,
		blending:       THREE.NormalBlending,
		depthTest:      false,
		transparent:    true

	});

	var u;
	for(var i = 0; i< local.length; i++){
		if(local[i].id == id) {
// 			var showGeometry = new THREE.Geometry();
			var buffergeometry = new THREE.BufferGeometry();

			var location = local[i];
			var lat = +location.latitude.toFixed(4);
            var lng = +location.longitude.toFixed(4);
			var p = latLngToPixel(lat,lng);
			
			var position = new Float32Array( 2*3 );
			var alphas = new Float32Array(2);

			for(var j = 0; j < 2; j++){
				var vertex = new THREE.Vector3(p[0],p[1],j*location.wave_count*0.001*world);
				position[j*3] = vertex.x;
				position[j*3+1] = vertex.y;
				position[j*3+2] = vertex.z;

				alphas[j] = 1-j;
// 				showGeometry.vertices.push(vertex);
			}

			buffergeometry.addAttribute( 'position', new THREE.BufferAttribute(position,3) )
			buffergeometry.addAttribute( 'alpha', new THREE.BufferAttribute(alphas,1));

			var showLine = new THREE.Line( buffergeometry, shaderMaterial );

// 			var showLine = new THREE.Line(showGeometry,showMaterial);
			showcase.add(showLine);
		}
	}
}

function clearScene(){

}