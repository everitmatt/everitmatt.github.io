var currentTime;

var testZoom = 10;
var t, end;
var users;
var grid;
var showcase;
var showcasing = "";
var splashes;
var pilgrimageObject;	

var localGui;
var goingPersonal = false;
var isPersonal = false;
var topUsers = {
	surfCount:{id:"",value:0},
	waveCount:{id:"",value:0},
	distanceWaves:{id:"",value:0},
// 	distanceTotal:{id:"",value:0},
	duration:{id:"",value:0},
	speedMax:{id:"",value:0}
	};

var bounds;
var localStartFrame;
var pilgrimStartIndex;
var splashStartIndex;

var swellDirectionTween;
var localSwellObject;

function initLocal() {
	personal = {surfs:[],data:[]};
	users = [];
	topUsers = {
		surfCount:{id:"",value:0},
		waveCount:{id:"",value:0},
		distanceWaves:{id:"",value:0},
// 		distanceTotal:{id:"",value:0},
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
	$("#location-name").text(localName);
	var lName = localName.split(",");
	if(lName[lName.length-1] == " New Zealand"){
		console.log("in NZ");
		createCoastline();
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
        	color: palette.landFill,
    	});
		var cPoints = [];
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
					cPoints.push(vertex);
				}
// 				var cShape = new THREE.Shape(cPoints);
// 				var cShapeGeometry = new THREE.ShapeGeometry(cShape);
// 				var cMesh = new THREE.Mesh(cShapeGeometry,cMeshMaterial);
// 				cMesh.name = "coastline";
// 				coastlineObject.add(cMesh);
				var cLine = new THREE.Line( cGeometry, cMaterial);
				cLine.name = "coastline";
				coastlineObject.add(cLine);
			}
		}
	}

    createLocalSurfs();

    function createLocalSurfs(){
    	scene.remove(localObject);
		
		pilgrimageObject = new THREE.Group();
		pilgrimageObject.name = "pilgrimage";

		localObject = new THREE.Group();
		localObject.name  = "localObject";
		

// 		var pGeometry = new THREE.BufferGeometry();

// 		var positions = new Float32Array(local.length*3);
// 		var timestamps = new Float32Array(local.length);
// 		var colors = new Float32Array(local.length*3);
// 		var waveCounts = new Float32Array(local.length);
// 		var waveDistances = new Float32Array(local.length);
// // 		var totalDistances = new Float32Array(local.length);
// 		var durations = new Float32Array(local.length);
// 		var topSpeeds = new Float32Array(local.length);


		localSurfUniforms.equator.value = height/2;
// 		localSurfUniforms.pointWidth.value = 20.0*world;
		localSurfUniforms.stat.value = 2.0;
		localSurfUniforms.min.value = 0.0;
		localSurfUniforms.max.value = 2000.0;

		var timeCenter = document.getElementById("timeline-centered");
		var steplist = document.getElementById("steplist");
		if( steplist != undefined ) steplist.remove();
		var steplist = document.createElement("div");
		steplist.id = "steplist";
		steplist.style.width = "80%";
		steplist.style.height = "10px";
		steplist.style.margin = "0px 10%";
		steplist.style.position = "absolute";

		for(var i = 0; i < local.length; i++){
			
			// find previous location and add to data.
			local[i].visible = false;
			local[i].splash = false;

			var location = local[i];
			var lat = +location.latitude.toFixed(4);
            var lng = +location.longitude.toFixed(4);
			var p = latLngToPixel(lat,lng);
			
			var isUser = false;
        	if(location.id == userOptions.searchGPSId) isUser = true;

			var shape = document.createElement("div");
			// Set any attributes as desired
			shape.style.top = "0px";
			shape.style.left = (location.start_timestamp-startTimestamp)*100.0/totalDuration + "%";
			shape.style.position = "absolute";
			shape.style.borderRadius = "3px";
			shape.style.width = "6px";
			shape.style.height = "6px";
			var c1 = new THREE.Color("rgb(0%, 50%, 100%)");
			var c2 = new THREE.Color("rgb(0%, 100%, 0%)");
			var col = 1.0/10.0*location.swell_size;
			c1.lerp(c2,col);
			if(isUser){
				shape.style.backgroundColor = "#FFDF00";
				shape.style.opacity = "1.0";
			} else {
				shape.style.backgroundColor = "#"+c1.getHexString();
				shape.style.opacity = "0.5";
			}
			
			steplist.appendChild(shape);
			
			for(var j = 0; j < userOptions.surfIds.length; j++){
				if(location.surf_id == userOptions.surfIds[j]){
					console.log(location);
					personal.surfs.push(location);
					isPersonal = true;
				}
			}

			var cString = "#"+location.id.substring(0,6);
			var c1 = new THREE.Color(cString);

			var pGeometry = new THREE.BufferGeometry();
			var positions = new Float32Array(location.wave_count*3);
			var timestamps = new Float32Array(location.wave_count*1);
			var colors = new Float32Array(location.wave_count*3);
			var waveCounts = new Float32Array(location.wave_count*1);
			var waveDistances = new Float32Array(location.wave_count*1);
	// 		var totalDistances = new Float32Array(local.length);
			var durations = new Float32Array(location.wave_count*1);
			var topSpeeds = new Float32Array(location.wave_count*1);

			for(var j = 0; j < location.wave_count; j++){
				positions[j*3] = p[0];
				positions[j*3+1] = p[1];
				positions[j*3+2] = j*0.001;

				timestamps[j] = location.start_timestamp;

				colors[j*3] =c1.r;
				colors[j*3+1] =c1.g;
				colors[j*3+2] =c1.b;

				waveCounts[j] = location.wave_count;
				waveDistances[j] = location.distance_waves;
	// 			totalDistances[i] = location.distance_total;
				durations[j] = location.duration;
				topSpeeds[j] = location.speed_max;
			}

			pGeometry.addAttribute( 'position', new THREE.BufferAttribute(positions,3) );
			pGeometry.addAttribute( 'timestamp', new THREE.BufferAttribute(timestamps,1) );
			pGeometry.addAttribute( 'color', new THREE.BufferAttribute(colors,3) );
			pGeometry.addAttribute( 'waveCount', new THREE.BufferAttribute(waveCounts,1) );
			pGeometry.addAttribute( 'waveDistance', new THREE.BufferAttribute(waveDistances,1) );
// 			pGeometry.addAttribute( 'totalDistance', new THREE.BufferAttribute(totalDistances,1) );
			pGeometry.addAttribute( 'duration', new THREE.BufferAttribute(durations,1) );
			pGeometry.addAttribute( 'topSpeed', new THREE.BufferAttribute(topSpeeds,1) );

			var points = new THREE.Points(pGeometry,localSurfMaterial);
    		localObject.add(points);

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
// 				topUsers.distanceTotal.id = location.id;
				topUsers.duration.id = location.id;
				topUsers.speedMax.id = location.id;
				topUsers.surfCount.value = 1;
				topUsers.waveCount.value = parseInt(location.wave_count);
				topUsers.distanceWaves.value = location.distance_waves;
// 				topUsers.distanceTotal.value = location.distance_total;
				topUsers.duration.value = parseFloat(location.duration);
				topUsers.speedMax.value = location.speed_max;
				var u = {
					id:local[i].id,
					surfCount:1,
					waveCount:parseInt(location.wave_count),
					distanceWaves:location.distance_waves,
// 					distanceTotal:location.distance_total,
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
// 						users[j].distanceTotal += location.distance_total;
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
// 						if(users[j].distanceTotal > topUsers.distanceTotal.value){
// 							topUsers.distanceTotal.id = users[j].id;
// 							topUsers.distanceTotal.value = users[j].distanceTotal;
// 						}
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
// 						distanceTotal:location.distance_total,
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
// 					if(u.distanceTotal > topUsers.distanceTotal.value){
// 						topUsers.distanceTotal.id = u.id;
// 						topUsers.distanceTotal.value = u.distanceTotal;
// 					}
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
		}
		
		timeCenter.appendChild(steplist);
    }

    var tBounds = [bounds.topLeft.y+(bounds.bottomRight.y-bounds.topLeft.y)/2,bounds.topLeft.x+(bounds.bottomRight.x-bounds.topLeft.x)/2];

	t = latLngToPixel(tBounds[0],tBounds[1]);

	createLocalSwell();

    function createLocalSwell(){
    	var lSGeometry = new THREE.PlaneGeometry( 0.75, 0.75);
    	var lSMaterial = new THREE.ShaderMaterial({
    		uniforms:       localSwellUniforms,
			vertexShader:   document.getElementById( 'localSwell_vertexshader' ).textContent,
			fragmentShader: document.getElementById( 'localSwell_fragmentshader' ).textContent,
			blending:       THREE.NormalBlending,
			depthTest: 		false,
			transparent:    true

    	});
// 		var lSMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00, wireframe: true, transparent: true} );
		localSwellObject = new THREE.Mesh( lSGeometry, lSMaterial );
		localSwellObject.name = "localSwellObject";
		localSwellObject.position.set(t[0],t[1],0);
    }
	

	localCamera = new THREE.PerspectiveCamera( 75, window.innerWidth/ window.innerHeight, 1, 10000000 );
	localCamera.up.set( 0, 0, 1 );
	localCamera.position.x = t[0];
	localCamera.position.y = t[1];
	localCamera.position.z = 1.5*world;
	var drop = new TWEEN.Tween(fadeOut).to({drop:0.0},500).easing(TWEEN.Easing.Quadratic.In).onComplete(function(){
		interactive = true;
		var cameraTween = new TWEEN.Tween(camera.position).to({ x: t[0], y: t[1]+5*world, z:1.5*world }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
			camera.lookAt(targPos);
				}).onComplete(function(){
					loader.load(
				// resource URL
				"../textures/sprites/spark2.png",
				// Function when resource is loaded
				function ( texture ) {
					// do something with the texture
					localSurfUniforms.texture.value = texture;
					
				},
				function ( xhr ) {
					console.log( 'An error happened' );
				}
			);
			TIME_SPACE = 'local';
			interactive = false;
			scene.remove(selectedObject);
			scene.remove(landingObject);
			scene.remove(mapObject);
			scene.add(localSwellObject);
			if(lName[lName.length-1] != " New Zealand"){
				scene.add(mapObject);
			} else {
				scene.add(coastlineObject);
			}
			params.speed = 750;
			
			scene.add(localObject);
			scene.add(pilgrimageObject);
			scene.add(splashes);

			$("#steplist").fadeIn("slow");
		}).start();
		var targTween = new TWEEN.Tween(targPos).to({ x: t[0], y: t[1], z: 0.005*world }, 1000).easing(TWEEN.Easing.Quadratic.InOut).start();
		var zoomTween = new TWEEN.Tween(params).to({ zoom: 14 }, 2000).easing(TWEEN.Easing.Quadratic.InOut).start();
		var fadeTween = new TWEEN.Tween(localSurfUniforms.alpha).to({ value: 1.0 }, 2000).easing(TWEEN.Easing.Quadratic.InOut).start();
	});
	var jump = new TWEEN.Tween(fadeOut).to({drop:1.1},100).easing(TWEEN.Easing.Quadratic.Out).chain(drop).start();

// 	$("#menu-icon").click(function(){
// 		$(this).fadeOut("fast",function(){
// 			$("#gui-container").animate({right: "0px"},500);
// 		});
// 	});
	
// 	$("#gui-container").mouseleave(function(){
// 		$(this).animate({right: "-250px"},500);
// 	});
	
	if(isPersonal){
		console.log(personal);
		$("#goPersonal-gui").slideDown("fast");
	}

	$("#local-gui").slideDown("fast");

	$("#key img").attr("src","../local-sources/distance-key.png");

	document.getElementById("top-button").onclick = function(){localGoBirdsEye()};
	document.getElementById("45-button").onclick = function(){localGoGlobal()};
	document.getElementById("front-button").onclick = function(){localGoHistogram()};

	localStartFrame = startTimestamp+params.count;
	pilgrimStartIndex = -1;
	splashStartIndex = -1;

    console.log(scene);
    console.log(local);
}

function updateLocal(){
	var d = new Date((startTimestamp+params.count)*1000);
	$("#date").text(dateFormat(d, "yyyy, mmmm dS, h TT"));
	var targLocation;
	params.speed = 750;

// 		camera.up.set( 0, -1, 1 );
// 		camera.position.x = targPos.x;
// 		camera.position.y = targPos.y;
// 		camera.position.z = 5.0*world;
// 		camera.lookAt(targPos);
// 		params.zoom = 1;
	camera.zoom = Math.pow(2,params.zoom);
	camera.updateProjectionMatrix();

	localSurfUniforms.time.value = startTimestamp+params.count;
	localSurfUniforms.zoom.value = Math.pow(2,params.zoom)/(params.zoom*0.5);
	localSwellObject.rotation.z = Math.PI/2.0-localSwellUniforms.direction.value;

	localSwellUniforms.time.value = startTimestamp+params.count;
	localSwellUniforms.zoom.value = Math.pow(2,params.zoom)/(params.zoom*0.5);

	pilgrimageUniforms.time.value = startTimestamp+params.count;
	pilgrimageUniforms.zoom.value = Math.pow(2,params.zoom)/(params.zoom*0.5);

	splashUniforms.time.value = startTimestamp+params.count;
	splashUniforms.zoom.value = Math.pow(2,params.zoom)/(params.zoom*0.5);

	
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
					var name1 = userLocation.detected_location_name;
					userOptions.surfIndex++;
					userLocation = distinctLocations[userOptions.locationIndices[userOptions.surfIndex]];
					var name2 = userLocation.detected_location_name;
					console.log(userLocation.detected_location_name);
					if(name1 != name){
// 						returnToLanding();
					}
// 					
				}
			}
		}

		for(var i = 0; i < local.length; i++){
			//create pilgrim and animate in;
			if(local[i].start_timestamp-start < frame && local[i].visible == false){
				//create the object
				local[i].visible = true;
				for(var j = 0; j< distinctLocations.length; j++){
					if(distinctLocations[j].detected_location_name == local[i].previous_location){
						local[i].previous_location = [distinctLocations[j].latitude,distinctLocations[j].longitude,local[i].previous_location];
					}
				}

				
				createPilgrim(i);
			}
			if(local[i].start_timestamp-start < frame && local[i].start_timestamp < frame){
				if(local[i].swell_direction != undefined){
					var newSwell = calculateSwellDirection(local[i].swell_direction);
					if(newSwell != localSwellUniforms.direction.value){
						swellDirectionTween = new TWEEN.Tween(localSwellUniforms.direction).to({ value: newSwell }, 2000).start();
// 						localSwellUniforms.direction.value = newSwell;
// 						console.log(localSwellUniforms.direction.value);
					}
				}
			}
// 			if(local[i].start_timestamp < frame && local[i].start_timestamp+start > frame && local[i].splash == false){
// 				console.log(local[i])
// 				local[i].splash = true;
// 				createSplash(i);
// // 					for(var j = 0; j < userOptions.surfIds.length; j++){
// // 						if(local[i].surf_id == userOptions.surfIds[j]){
// // 							personal = local[i];
// // 							params.speed = 1;
// // 							console.log("going personal");
// // 							goPersonal();
// // 						}
// // 					}
// 			}
		}
	}
}

function showSurfCount(){
// 	if(showcasing != "surfCount"){
// 		console.log(topUsers.surfCount);
// 		createShowcase(topUsers.surfCount.id);
// 		showcasing = "surfCount";
// 	} else {
// 		scene.remove(showcase);
// 		showcasing = "";
// 	}
}

function showWaveCount(){
	if(showcasing != "waveCount"){
		localSurfUniforms.stat.value = 1.0;
		localSurfUniforms.min.value = -10.0;
		localSurfUniforms.max.value = 150.0;
// 		console.log(topUsers.waveCount);
// 		createShowcase(topUsers.waveCount.id);
		showcasing = "waveCount";
	} else {
		localSurfUniforms.stat.value = 0.0;
		// 		scene.remove(showcase);
		showcasing = "";
	}
	
}

function showDistanceWaves(){
	$("#key img").attr("src","../local-sources/distance-key.png");
	if(showcasing != "distanceWaves"){
		localSurfUniforms.stat.value = 2.0;
		localSurfUniforms.min.value = 0.0;
		localSurfUniforms.max.value = 2000.0;
// 	console.log(topUsers.distanceWaves);
// 	createShowcase(topUsers.distanceWaves.id);
		showcasing = "distanceWaves";
	} else {
		localSurfUniforms.stat.value = 0.0;
// 		scene.remove(showcase);
		showcasing = "";
	}
	
}

// function showDistanceTotal(){
// 	if(showcasing != "distanceTotal"){
// 	console.log(topUsers.distanceTotal);
// 	createShowcase(topUsers.distanceTotal.id); 
// 	showcasing = "distanceTotal";
// 	} else {
// 		scene.remove(showcase);
// 		showcasing = "";
// 	}	
// }

function showDuration(){
	$("#key img").attr("src","../local-sources/duration-key.png");
	if(showcasing != "duration"){
		localSurfUniforms.stat.value = 3.0;
		localSurfUniforms.min.value = 0.0;
		localSurfUniforms.max.value = 10000.0;
// 	console.log(topUsers.duration);
// 	createShowcase(topUsers.duration.id);
	showcasing = "duration";
	} else {
		localSurfUniforms.stat.value = 0.0;
// 		scene.remove(showcase);
		showcasing = "";
	}
}

function showSpeedMax(){
	$("#key img").attr("src","../local-sources/speed-key.png");
	if(showcasing != "speedMax"){
		localSurfUniforms.stat.value = 4.0;
		localSurfUniforms.min.value = 10.0;
		localSurfUniforms.max.value = 40.0;
// 	console.log(topUsers.speedMax);
// 	createShowcase(topUsers.speedMax.id);
		showcasing = "speedMax";
	} else {
		localSurfUniforms.stat.value = 0.0;
// 		scene.remove(showcase);
		showcasing = "";
	}
	
}

function returnToLanding(){
	scene.remove(globalPilgrimageObject);
	scene.remove(localSwellObject);
		
	scene.remove(usersObject);
	scene.remove(grid);
	scene.remove(pilgrimageObject);
	scene.remove(personalObject);
	scene.remove(showcase);
	scene.remove(splashes);
	scene.remove(personal);
	scene.remove(personalObject);
	scene.remove(coastlineObject);
	scene.remove(sandObject);
	document.getElementById("steplist").remove();
	document.getElementById("top-button").onclick = function(){goBirdsEye()};
	document.getElementById("45-button").onclick = function(){goGlobal()};
	document.getElementById("front-button").onclick = function(){goHistogram()};
	$("#goPersonal-gui").slideUp("fast");
	$("#personal-gui").slideUp("fast");
	$("#local-gui").slideUp("fast");
	$("#topspot-container").slideDown("fast");
	$('#location-select-container').slideDown("fast");
	$("#key img").attr("src","../local-sources/swell-key.png");
// 	$("#location-name").text("");
	isPersonal = false;
	params.camera = camera;
	var fade = new TWEEN.Tween(fadeOut).to({fade:0.0},2000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function(){
		swellUniforms.alpha.value = fadeOut.fade;
	}).start();
	fadeOut.drop = 1.0;
	autoplaying = false;
	followingUser = false;
	goingLocal = false;
	TIME_SPACE = "landing";
	camera.up.set( 0, 0, 1 );
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: width*0.5, y: height*1.8, z: height }, 2000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
        camera.lookAt(targPos);
    }).start();
	var fadeTween = new TWEEN.Tween(localSurfUniforms.alpha).to({ value: -1.0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onComplete(function(){
		scene.remove(localObject);
		params.speed = 1500;
	}).start();
    var zoomTween = new TWEEN.Tween(params).to({zoom:4},2000).easing(TWEEN.Easing.Quadratic.InOut).start();
	interactive = true;
	scene.add(mapObject);
	scene.add(landingObject);
	scene.add(globalPilgrimageObject);

	var geometry = landingObject.geometry;
	var attributes = geometry.attributes;
	var updateCount = 0;

}

function localGoGlobal(){
	console.log("global?");
	if(TIME_SPACE == "local"){
		loader.load(
			// resource URL
			"../textures/sprites/spark2.png",
			// Function when resource is loaded
			function ( texture ) {
				// do something with the texture
				localSurfUniforms.texture.value = texture;
				personalUniforms.texture.value = texture;
			},
			function ( xhr ) {
				console.log( 'An error happened' );
			}
		);
	}
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: t[0], y: t[1]+5*world, z:1.5*world }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
		camera.lookAt(targPos);
	}).start();
	//localSurfUniforms.texture.value = ;
}

function localGoBirdsEye(){
	console.log("bird?");
	if(TIME_SPACE == "local"){
		loader.load(
			// resource URL
			"../textures/sprites/spark2.png",
			// Function when resource is loaded
			function ( texture ) {
				// do something with the texture
				localSurfUniforms.texture.value = texture;
				personalUniforms.texture.value = texture;
			},
			function ( xhr ) {
				console.log( 'An error happened' );
			}
		);
	}
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: t[0], y: t[1]+0.0001*world, z:10*world }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
		camera.lookAt(targPos);
	}).start();
	//localSurfUniforms.texture.value = ;
}

function localGoHistogram(){
	console.log("hist?");
	if(TIME_SPACE == "local"){
		loader.load(
			// resource URL
			"../textures/sprites/spark2.png",
			// Function when resource is loaded
			function ( texture ) {
				// do something with the texture
				localSurfUniforms.texture.value = texture;
				personalUniforms.texture.value = texture;
			},
			function ( xhr ) {
				console.log( 'An error happened' );
			}
		);
	}
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: t[0], y: t[1]+5*world, z: 0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
		camera.lookAt(targPos);
	}).start();
	//localSurfUniforms.texture.value = ;
}

function goPersonal(){
	exitLocal();
}

function exitLocal(){
	var count = 0;
	var chunkCount = 0;
		personal.data = [];
		jsonpipe.flow('../local-sources/'+personal.surfs[count].surf_id+'.json', {
				"delimiter": "\n", // String. The delimiter separating valid JSON objects; default is "\n\n"
				"success": function(data) {
					// Do something with this JSON chunk
					chunkCount++;
					if(chunkCount > 100){
						personal.data.push(data);
					}

				},
				"error": function(errorMsg) {
					console.log(errorMsg);
					// Something wrong happened, check the error message
				},
				"complete": function(statusText) {
					// Called after success/error, with the XHR status text
					console.log(personal);
					if(count == personal.surfs.length-1){
						initPersonal();
					} else {
						count++;	
						getNext(count);
					}
					
				},
				"timeout": 10000, // Number. Set a timeout (in milliseconds) for the request
				"method": "GET", // String. The type of request to make (e.g. "POST", "GET", "PUT"); default is "GET"
				"headers": { // Object. An object of additional header key/value pairs to send along with request
					"X-Requested-With": "XMLHttpRequest"
				},
				"data": "", // String. A serialized string to be sent in a POST/PUT request,
				"withCredentials": true // Boolean. Send cookies when making cross-origin requests; default is true
		});
		function getNext(input){
			var chunkCount = 0;
			jsonpipe.flow('../local-sources/'+personal.surfs[input].surf_id+'.json', {
				"delimiter": "\n", // String. The delimiter separating valid JSON objects; default is "\n\n"
				"success": function(data) {
					// Do something with this JSON chunk
					chunkCount++;
					if(chunkCount > 100){
						personal.data.push(data);
					}

				},
				"error": function(errorMsg) {
					console.log(errorMsg);
					// Something wrong happened, check the error message
				},
				"complete": function(statusText) {
					// Called after success/error, with the XHR status text
					console.log(personal);
					if(count == personal.surfs.length-1){
						initPersonal();
					} else {
						count++;
						getNext(count);
					}
					
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
// 	initPersonal();
}

function createPilgrim(index){
	//create line
	var location = local[index];
	var lat = +location.latitude.toFixed(4);
	var lng = +location.longitude.toFixed(4);
	var p = latLngToPixel(lat,lng);


	if(location.previous_location != null){
		console.log(location.previous_location[2]);
		console.log(location);
		var target = latLngToPixel(+location.latitude.toFixed(4),+location.longitude.toFixed(4));
		var previous = latLngToPixel(+location.previous_location[0].toFixed(4),+location.previous_location[1].toFixed(4))
		var e = new THREE.Vector2(previous[0] - target[0],previous[1] - target[1]);
		var m1 = new THREE.Vector2(target[0]+(e.x / e.length()*world),target[1]+(e.y/e.length()*world));
		var m2 = new THREE.Vector2(target[0]+(e.x / e.length()*world/2),target[1]+(e.y/e.length()*world/2));
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
		var timestamps = new Float32Array( pVertices.length*1);
		var indices = new Float32Array( pVertices.length*1);
		for(var j = 0; j < pVertices.length; j++){
			timestamps[j] = location.start_timestamp;
			indices[j] = j;
		}
		buffergeometry.addAttribute( 'timestamp', new THREE.BufferAttribute(timestamps,1));
		buffergeometry.addAttribute( 'curveIndex', new THREE.BufferAttribute(indices,1));

		var shaderMaterial = new THREE.ShaderMaterial( {

			uniforms:       pilgrimageUniforms,
			vertexShader:   document.getElementById( 'pilgrim_vertexshader' ).textContent,
			fragmentShader: document.getElementById( 'pilgrim_fragmentshader' ).textContent,
			blending:       THREE.NormalBlending,
			depthTest: 		false,
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

	var shaderMaterial = new THREE.ShaderMaterial( {

		uniforms:       splashUniforms,
		vertexShader:   document.getElementById( 'splash_vertexshader' ).textContent,
		fragmentShader: document.getElementById( 'splash_fragmentshader' ).textContent,
		blending:       THREE.NormalBlending,
		depthTest:      false,
		transparent:    true

	});

	var u;
	var buffergeometry = new THREE.BufferGeometry();

	var position = new Float32Array( 6 );
	var timestamps = new Float32Array( 2 );
	var alphas = new Float32Array( 2 );

	for(var j = 0; j < 2; j++){
		var vertex = new THREE.Vector3(p[0],p[1],j*location.wave_count*0.005*world);
		position[j*3] = vertex.x;
		position[j*3+1] = vertex.y;
		position[j*3+2] = vertex.z;

		alphas[j] = 1-j;

		timestamps[j] = location.start_timestamp;
// 				showGeometry.vertices.push(vertex);
	}

	buffergeometry.addAttribute( 'position', new THREE.BufferAttribute(position,3) )
	buffergeometry.addAttribute( 'timestamp', new THREE.BufferAttribute(timestamps,3) )
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

	var u;
	for(var i = 0; i< local.length; i++){
		if(local[i].id == id) {
// 			var showGeometry = new THREE.Geometry();
			var buffergeometry = new THREE.BufferGeometry();

			var location = local[i];
			var lat = +location.latitude.toFixed(4);
            var lng = +location.longitude.toFixed(4);
			var p = latLngToPixel(lat,lng);
			
			var positions = new Float32Array( location.wave_count*3 );
			var colors = new Float32Array( location.wave_count*3);
			var pointWidths = new Float32Array( location.wave_count *1);

			for(var j = 0; j < location.wave_count; j++){
				var vertex = new THREE.Vector3(p[0],p[1],j*0.001*world);
				positions[j*3] = vertex.x;
				positions[j*3+1] = vertex.y;
				positions[j*3+2] = vertex.z;

				colors[j*3] = c1.r;
				colors[j*3+1] = c1.g;
				colors[j*3+2] = c1.b;

				pointWidths[j] = location.wave_count;
// 				showGeometry.vertices.push(vertex);
			}

			buffergeometry.addAttribute( 'position', new THREE.BufferAttribute(positions,3) );
			buffergeometry.addAttribute( 'color', new THREE.BufferAttribute(colors,3) );
			buffergeometry.addAttribute( 'pointWidth', new THREE.BufferAttribute(pointWidths,1) );

			var showLine = new THREE.Points( buffergeometry, localSurfMaterial );

// 			var showLine = new THREE.Line(showGeometry,showMaterial);
			showcase.add(showLine);
		}
	}
}

function clearScene(){

}

function calculateSwellDirection(dir){
	var dirInRadians = 0.0;
	if(dir == "N"){
		dirInRadians = 0.0;
	} else if(dir == "NNE"){
		dirInRadians = Math.PI*0.125;
	} else if(dir == "NE"){
		dirInRadians = Math.PI*0.25;
	} else if(dir == "ENE"){
		dirInRadians = Math.PI*0.375;
	} else if(dir == "E"){
		dirInRadians = Math.PI*0.5;
	} else if(dir == "ESE"){
		dirInRadians = Math.PI*0.625;
	} else if(dir == "SE"){
		dirInRadians = Math.PI*0.75;
	} else if(dir == "SSE"){
		dirInRadians = Math.PI*0.875;
	} else if(dir == "S"){
		dirInRadians = Math.PI;
	} else if(dir == "SSW"){
		dirInRadians = Math.PI*1.125;
	} else if(dir == "SW"){
		dirInRadians = Math.PI*1.25;
	} else if(dir == "WSW"){
		dirInRadians = Math.PI*1.375;
	} else if(dir == "W"){
		dirInRadians = Math.PI*1.5;
	} else if(dir == "WNW"){
		dirInRadians = Math.PI*1.625;
	} else if(dir == "NW"){ 
		dirInRadians = Math.PI*1.75;
	} else if(dir == "NNW"){
		dirInRadians = Math.PI*1.875;
	}
	return dirInRadians;
}