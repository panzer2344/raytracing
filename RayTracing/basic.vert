#version 450

uniform float aspect;
uniform vec3 campos;
in vec3 vPosition;

out vec3 origin, direction;

void min(){
	gl_Position = vec4(vPosition, 1.0f);
	direction = normalize(vec3(vPosition.x*aspect, vPosition.y, -1.0f));
	origin = campos;
}

