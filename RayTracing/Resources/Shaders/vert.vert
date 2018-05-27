#version 450 core

uniform float aspect;
uniform vec3 campos;
layout(location = 0) in vec3 vPosition;

out vec3 origin, direction;

void main(){
	gl_Position = vec4(vPosition, 1.0);
	direction = normalize(vec3(vPosition.x*aspect, vPosition.y, -1.0));
	origin = campos;
}