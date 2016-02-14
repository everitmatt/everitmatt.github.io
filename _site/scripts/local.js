var currentTime;
// var testLocal = [-28.2,153.6]; //Snapper
// var testLocal = [-41.3,174.8]; //lyall
// var testLocal = [-38,177]; //ohope beach
// var testLocal = [-39.1,174.1]; //fitzroy
var testZoom = 10;
var t, end;
var users;
var grid;
var showcase;
var splashes;
var pilgrimageObject;
var localGui;
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
//     TIME_SPACE = "local";
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

    function createLocalSurfs(){
//     	scene.remove(localObject);
    	localObject = new THREE.Group();
    	localObject.name = "local";
    	scene.add(localObject);
		
		pilgrimageObject = new THREE.Group();
		pilgrimageObject.name = "pilgrimage";
		scene.add(pilgrimageObject);

		for(var i = 0; i < local.length; i++){

			// find previous location and add to data.
			local[i].visible = false;
			local[i].splash = false;

			var location = local[i];
			var lat = +location.latitude.toFixed(4);
            var lng = +location.longitude.toFixed(4);
			var p = latLngToPixel(lat,lng);

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

			var curve = new THREE.EllipseCurve(
				p[0],  p[1],            // ax, aY
				200, 200,           // xRadius, yRadius
				0,  2 * Math.PI,  // aStartAngle, aEndAngle
				false,            // aClockwise
				0                 // aRotation 
			);

			var path = new THREE.Path( curve.getPoints( 50 ) );
			var geometry = path.createPointsGeometry( 50 );
			var material = new THREE.LineBasicMaterial( { color : c1, transparent: true, linewidth: 2 } );

			// Create the final Object3d to add to the scen
			var ellipse = new THREE.Line( geometry, material );
			ellipse.name = location.id;
			localObject.add(ellipse);

		}

    }
	
	var tBounds = [bounds.topLeft.y+(bounds.bottomRight.y-bounds.topLeft.y)/2,bounds.topLeft.x+(bounds.bottomRight.x-bounds.topLeft.x)/2];

	t = latLngToPixel(tBounds[0],tBounds[1]);

	localCamera = new THREE.PerspectiveCamera( 75, window.innerWidth/ window.innerHeight, 1, 10000000 );
	localCamera.up.set( 0, -1, 1 );
	localCamera.position.x = t[0];
	localCamera.position.y = t[1];
	localCamera.position.z = 1.5*world;
// 	end = latLngToPixel(local[local.length-1].latitude,local[local.length-1].longitude);
	var drop = new TWEEN.Tween(fadeOut).to({drop:0.0},500).easing(TWEEN.Easing.Quadratic.In).onComplete(function(){
		TIME_SPACE = 'local';
		interactive = true;
		var cameraTween = new TWEEN.Tween(camera.position).to({ x: t[0]+10*world, y: t[1]+1*world, z:1.5*world }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
			camera.lookAt(targPos);
		}).onComplete(function(){
			interactive = false;
			scene.remove(selectedObject);
		}).start();
		var targTween = new TWEEN.Tween(targPos).to({ x: t[0], y: t[1], z: 0.02*world }, 1000).easing(TWEEN.Easing.Quadratic.InOut).start();
		var zoomTween = new TWEEN.Tween(params).to({zoom:6},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
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
// 	if(!interactive){
// 		var cameraX = t[0] + 10*world * Math.cos(Math.PI/2.0+(params.count*0.001/Math.pow(2,params.speed)));
// 		var cameraY = t[1] + 10*world * Math.sin(Math.PI/2.0+(params.count*0.001/Math.pow(2,params.speed)));
// // 		console.log(targPos);
// 		camera.up.set( 0, 0, 1 );
// 		camera.position.x = cameraX;
// 		camera.position.y = cameraY;
// 		camera.position.z = 1.5*world;
// 		camera.lookAt(targPos);
// 	}
	camera.zoom = Math.pow(2,params.zoom);
	camera.updateProjectionMatrix();
// 	localCamera.up.set( 0, -1, 1 );
// 	localCamera.position.x = t[0];
// 	localCamera.position.y = t[1];
// 	localCamera.position.z = 10*world;
// 	localCamera.lookAt(targPos);
// 	localCamera.zoom = Math.pow(2,params.zoom);
// 	localCamera.updateProjectionMatrix();
	
	var frame = startTimestamp+params.count;
	var d = new Date(frame*1000);
	var start = 43200*params.speed;
	var lerpValue = 1/start;
    params.date = d.toUTCString();
// 	console.log(lerpValue);
    if(userOptions.timestamps[userOptions.surfIndex] < frame){
		if(userOptions.surfIndex < userOptions.locationIndices.length-1){
			userOptions.surfIndex++;
			userLocation = distinctLocations[userOptions.locationIndices[userOptions.surfIndex]];
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
							attributes.alpha.array[k] = 1.1-(frame-local[i].start_timestamp+start)*lerpValue;
						}
// 	 						attributes.alpha.array[k] = 1.0-(frame-local[i].start_timestamp+start)*lerpValue;
					}
					attributes.alpha.needsUpdate = true;
				}
			}
    	} else if(local[i].start_timestamp < frame && local[i].start_timestamp+start > frame){
    		// splash
    		if(splashStartIndex == -1) splashStartIndex = i;
			if(local[i].splash == false){
				//create the object
				console.log(local[i])
				local[i].splash = true;
				createSplash(i);
			} else {
				var splash = splashes.children[i-splashStartIndex];
				var geometry = splash.geometry;
				var attributes = geometry.attributes;
				attributes.alpha.array[0] = 1.0-(frame-local[i].start_timestamp)*lerpValue*5;
				attributes.alpha.needsUpdate = true;
			}
    	} else {
    		local[i].visible = false;
    		local[i].splash = false;
    	}
//     	if(local[i].start_timestamp < frame && local[i].visible == true){
//     		if(local[i].previous_location != null){
// 				var surf = pilgrimageObject.children[i];
// 				var geometry = surf.geometry;
// 				var attributes = geometry.attributes;
// 				for( var k = 0; k < attributes.alpha.array.length; k++){
// 						attributes.alpha.array[k] = 0.0;
// 				}
// 				attributes.alpha.needsUpdate = true;
// 			}
// 			local[i].visible == false;
//     	}
//     	if(local[i].start_timestamp+3600*params.speed < frame){
//     		if(local[i].previous_location != null){
// 				var splash = splashes.children[i];
// 				console.log(splashes);
// 				var geometry = splash.geometry;
// 				var attributes = geometry.attributes;
// 				for( var k = 0; k < attributes.alpha.array.length; k++){
//  						attributes.alpha.array[k] = 0.0 ;
// 				}
// 				attributes.alpha.needsUpdate = true;
// 			}
//     	}
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
	fadeOut = {fade: 1.0, drop: 1.0};
	autoplaying = false;
	followingUser = false;
// 	params.speed = 11;
	goingLocal = false;
	TIME_SPACE = "landing";
	scene.remove(localObject);
	scene.remove(usersObject);
	scene.remove(grid);
	scene.remove(pilgrimageObject);
	scene.remove(showcase);
	scene.remove(splashes);
	camera.up.set( 0, 0, 1 );
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: width*0.5, y: height*1.8, z: height }, 2000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).start();
    var targTween = new TWEEN.Tween(targPos).to({ x: width*0.5, y: height*0, z: 0 }, 2000).easing(TWEEN.Easing.Quadratic.InOut).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:1},2000).easing(TWEEN.Easing.Quadratic.InOut).start();
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

function goPersonal(){
	TIME_SPACE = "personal";
// 	queryOptions.query = generateQuery(["Lyall Bay, New Zealand"]);
// 	queryOptions.query = generateQuery(["Ohope Beach, New Zealand"]);
//     queryOptions.query = generateQuery(["Snapper Rocks, Australia",
//     	"Snapper Rocks, QLD, Australia",
//     	"Kirra, Australia",
//     	"Kirra, QLD, Australia",
//     	"Duranbah, Australia",
//     	"Duranbah, NSW, Australia"
//     ]);
// 	queryOptions.query = 'select * from sgps_15.'+userOptions.surfId;
// 	makeApiCall(queryOptions,exitLocal);
}

function exitLocal(pObject){
	console.log(pObject);
	personal.data = pObject;
	scene.remove(localObject);
// 	localObject = null;
	initPersonal();
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
		if(name1[0] == name2[0]){
			location.previous_location = null;
		}
		if(name1[name1.length-1] == name2[name2.length-1]){
			c1 = new THREE.Color(0x00ff00);
		} else {
			c1 = new THREE.Color(0xff0000);
		}
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
			color:     { type: "c", value: c1  }
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