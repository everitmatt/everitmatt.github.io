attribute float scale;
		attribute float swellSize;
		attribute float timestamp;
		attribute vec3 target;
		
		uniform float equator;
		uniform float time;
		uniform float zoom;
		uniform float alpha;
		uniform float pointWidth;

		varying float vAlpha;
		varying float vSwell;

		vec3 emitter;
		float x;
		float y;
			
		void main() {
			float lerp = 1.0/518400.0;
			float start = timestamp-518400.0;
			vAlpha = 0.0;
			vSwell = 1.0/10.0*swellSize;
			vec3 newPosition = position;
			
			if(start-500000.0 < time){
				vAlpha = 1.0;
				if(position.y > equator){
					x = position.x + (20.0 - vSwell*10.0) * cos((time+timestamp)*-0.00005*(vSwell+0.1));
					y = position.y + (20.0 - vSwell*10.0) * sin((time+timestamp)*-0.00005*(vSwell+0.1));
					newPosition = vec3(x,y,position.z);
				} else {
					x = position.x + (20.0 - vSwell*10.0) * cos((time+timestamp)*0.00005*(vSwell+0.1));
					y = position.y + (20.0 - vSwell*10.0) * sin((time+timestamp)*0.00005*(vSwell+0.1));
					newPosition = vec3(x,y,position.z);
				}
				emitter = newPosition;
			}
			if(start < time){
				vAlpha = 1.0;
				vec3 dir = target-emitter;
				float l2 = 1.0-lerp*(timestamp-time);
				newPosition = emitter+dir*l2;
			}
			if(timestamp < time){
				newPosition = vec3(target.x,target.y,scale/zoom);
			}
			if(alpha < 0.0){
				vAlpha = 1.0+alpha;
			}

			vec4 mvPosition = modelViewMatrix * vec4( newPosition, 1.0 );

			gl_PointSize = equator*0.05 * (vSwell+1.0) * ( 300.0 / length( mvPosition.xyz ) );

			gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition,1.0);

		}