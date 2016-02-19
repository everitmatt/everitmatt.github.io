var particles, particle, polygons = [], land, waves = [];

var targVel = new THREE.Vector3(0, 0, 0),
    targAccel = new THREE.Vector3(0, 0, 0),
    camPos = new THREE.Vector3(0, 0, 0),
    camVel = new THREE.Vector3(0, 0, 0),
    camAccel = new THREE.Vector3(0, 0, 0);

var intersects;
var onWave = false;
var replaySpeed = 1;
// var mouse = new THREE.Vector2(), raycaster = new THREE.Raycaster(),INTERSECTED,activeParticle, dir, intersectedIndex = -1, cleared = true;

function initPersonal() {
	TIME_SPACE = "personal"

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
// 	testZoom = 15;
// 	xBounds = [ personal.longitude - 0.01,
//   		personal.longitude + 0.01];
// 	yBounds = [ personal.latitude - 0.01,
// 	  		personal.latitude + 0.01];

// 	camera.position.z = 1000;
// 	camera.up.set( 0, 0, 1 );
	
// 	var t = latLngToPixelWithZoom(personal.latitude,personal.longitude,testZoom);
	
// 	targPos.x = t[0];
//   	targPos.y = t[1];

// 	targPos.x = convertToRange(personal.longitude,xBounds,[0,window.innerWidth]);
//   	targPos.y = convertToRange(personal.latitude,yBounds,[0,window.innerHeight]);

//   	camPos.x = targPos.x
//   	camPos.y = targPos.y

// 	scene = new THREE.Scene();
// 	scene.fog = new THREE.FogExp2( 0xffffff, 0.0015 );

	//particle geometry
	function createParticles(){
		//particle shader
		var pMaterial = new THREE.ShaderMaterial( {
	        vertexShader:   document.getElementById( 'vertexshader' ).textContent,
	        fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
	        transparent:    true
	    });

	    var wMaterial = new THREE.LineBasicMaterial({
	        // color: 0x00ff00,
	        vertexColors: THREE.VertexColors,
	        linewidth: 3,
	    });


		var vertices = new Float32Array( personal.data.length * 3 - 30 );
	    var typedColors = new Float32Array( personal.data.length * 3 - 30);
	    var alphas = new Float32Array( personal.data.length * 1 - 10);
	    var scales = new Float32Array( personal.data.length * 1 - 10);

	  	var step = 1/40;

	  	var wGeometry, colors;
	  	var currentLocation = [0.0,0.0,0.0];
	  	var waveCount = 0;
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
	        //check to see if new location, if new create lerped vertices, if not new do nothing;
	        if(currentLocation[0] != location[0] || currentLocation[1] != location[1] || currentLocation[2] != location[2]){
	        	//find the datum count till the next location update
	      		var datumCount = 0;
	        	for(var j = i; j < personal.data.length; j++){
	        		var sf = personal.data[j];
	        		var fLocation = [sf.latitude, sf.longitude, sf.altitude];
	        		if(location[0] != fLocation[0] || location[1] != fLocation[1] || location[2] != fLocation[2]){
	        			datumCount = j-i;
	        			break;
	        		}
	        	}

	        	//find the final vertex location
	        	var fS = personal.data[i+datumCount];
	        	// var finalLocation = [fS.lat,fs.lng];

	        	//create THREE.Vector3's
// 	        	var startPoint = [convertToRange(s.longitude,xBounds,[0,window.innerWidth]),convertToRange(s.latitude,yBounds,[0,window.innerHeight])];
	        	var startPoint = latLngToPixel(s.latitude,s.longitude);
	        	var startVertex = new THREE.Vector3(startPoint[0],startPoint[1],0);
// 	        	var finalPoint = [convertToRange(fS.longitude,xBounds,[0,window.innerWidth]),convertToRange(fS.latitude,yBounds,[0,window.innerHeight])];
	        	var finalPoint = latLngToPixel(fS.latitude,fS.longitude);
	        	var finalVertex = new THREE.Vector3(finalPoint[0],finalPoint[1],0);
	        	var lerpVal = 1/datumCount;
	        	var lerp = 0;
	        	//create geometry for each datum point with lerped locations
	        	for(var j = i; j<i+datumCount; j++){
	        		var lS = personal.data[j];

	        		var vertex = new THREE.Vector3();
	        		vertex.lerpVectors(startVertex,finalVertex,lerp);	
	        		lerp += lerpVal;
	        		var c1 = new THREE.Color(0x00ff00);
	    			var c2 = new THREE.Color(0xff0000);
	        		c1.lerp(c2,lS.speed*step);
			  		vertices[ j*3 + 0 ] = vertex.x;
					vertices[ j*3 + 1 ] = vertex.y;
					vertices[ j*3 + 2 ] = vertex.z;

					typedColors[ j*3 + 0 ] = c1.r;
					typedColors[ j*3 + 1 ] = c1.g;
					typedColors[ j*3 + 2 ] = c1.b;

					alphas[j] = 1.0;

					scales[j] = 5+lS.speed*0.2;
	        	}
	        	currentLocation = location;
	        }
	    }
	    var pGeometry = new THREE.BufferGeometry();
	    pGeometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
	    pGeometry.addAttribute( 'color', new THREE.BufferAttribute( typedColors, 3 ) );
	    pGeometry.addAttribute( 'alpha', new THREE.BufferAttribute(alphas,1));
	    pGeometry.addAttribute( 'scale', new THREE.BufferAttribute(scales,1));

	    particles = new THREE.Line( pGeometry,wMaterial);
	    particles.name = "surfs";

	    scene.add( particles );
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

// 	function createSand(){
// 		var group = new THREE.Group();
// 		group.name = "sand";
// 		scene.add(group);
// 		var sLineMaterial = new THREE.LineBasicMaterial({
//         	color: 0xfff000,
//         	linewidth: 2,
//         	linejoin: "round" 
//     	});

//     	var sMeshMaterial = new THREE.MeshBasicMaterial({
//         	color: 0xffff00,
//     	});

//     	var sl = sand.features;
// 		for(var i = 0; i < sl.length;i++){
// 			var s = sl[i].geometry.coordinates[0];
// 			var isWithinBounds = false;
// 			for(var j = 0; j < s.length; j++){
// 				var p = s[j];
// 				if(checkBounds(p)){
// 					isWithinBounds = true;
// 					break;
// 				}
// 				isWithinBounds= false;
// 			}
// 			if(isWithinBounds){
// 				var sPoints = [];
// 				var sGeometry = new THREE.Geometry();
// 				for(var j = 0; j < s.length; j++){
// 					var p = s[j];
// 					var point = [convertToRange(p[0],xBounds,[0,window.innerWidth]),convertToRange(p[1],yBounds,[0,window.innerHeight])];
// // 					var point = latLngToPixelWithZoom(p[1],p[0],testZoom);
// 					vertex = new THREE.Vector3(point[0],point[1],0);
// 					sGeometry.vertices.push(vertex);
// 					sPoints.push(vertex);
// 				}
// 				var sShape = new THREE.Shape(sPoints);
// 				var sShapeGeometry = new THREE.ShapeGeometry(sShape);
// 				var sMesh = new THREE.Mesh(sShapeGeometry,sMeshMaterial);
// 				sMesh.name = "sand";
// 				group.add(sMesh);
// 				var sLine = new THREE.Line( sGeometry, sLineMaterial);
// 				sLine.name = "sand";
// 				group.add(sLine);
// 			}
// 		}
// 	}

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

	function createSwell(){
	}

	function createSurfer(){

	}

	// createGrid();
// 	createSand();
// 	createCoastline();
	createParticles();

	localGui = gui.addFolder('local');
	localGui.add(params,'returnToLanding');
	localGui.open();

// 	params.count = 0;
	console.log(scene);
	var tBounds = [bounds.topLeft.y+(bounds.bottomRight.y-bounds.topLeft.y)/2,bounds.topLeft.x+(bounds.bottomRight.x-bounds.topLeft.x)/2];

	t = latLngToPixel(personal.latitude,personal.longitude);
	
	var cameraTween = new TWEEN.Tween(camera.position).to({ x: t[0], y: t[1]+10*world, z:1.5*world }, 1000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function() {
		camera.lookAt(targPos);
	}).onComplete(function(){
		interactive = false;
		scene.remove(selectedObject);
	}).start();
	var targTween = new TWEEN.Tween(targPos).to({ x: t[0], y: t[1], z: 0.0 }, 1000).easing(TWEEN.Easing.Quadratic.InOut).start();
	var zoomTween = new TWEEN.Tween(params).to({zoom:7},1000).easing(TWEEN.Easing.Quadratic.InOut).start();
}

function updatePersonal(){
	camera.zoom = Math.pow(2,params.zoom);
	camera.updateProjectionMatrix();
// 	updateCamera(params.count);
// 	updateParticle(params.count);
// 	camera.up.set( 0, 0, 1 );
//     camera.position.x = camPos.x;
// 	camera.position.y =	camPos.y;
// 	camera.position.z = 200;
// // 	targPos = new THREE.Vector3(cameraX,t[1]-100,0);
// 	camera.lookAt(targPos);
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

  	if(loc[0] < xBounds[1]+x && loc[0] > xBounds[0]-x && loc[1] < yBounds[1]+x && loc[1] > yBounds[0]-x){
    	return true;
  	}
  	return false;
}

function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}