#version 450

in vec3 origin, direction;
out vec4 outputColor;

struct Sphere {
	vec3 position;
	float radius;
	vec3 color;
};

struct Ray {
	vec3 origin;
	vec3 direction;
};

struct RayNode {
	Ray ray;
	vec3 color;
	int depth;
};

const int Max_Depth = 5;
const int Max_Nodes = 64;
RayNode rayNode[Max_Nodes];

struct HitInfo {
	bool hitDetected;
	vec3 hitPoint;
	vec3 surfaceNormal;
	float distance;
};

void sphereIntersect(Ray ray, Sphere sphere, inout HitInfo hitInfo){
	vec3 trackToSphere = ray.origin - sphere.position;
	float a = dot(ray.direction, ray.direction);
	float b = 2 * dot(trackToSphere, ray.direction);
	float c = dot(trackToSphere, trackToSphere) - sphere.radius * sphere.radius;
	float discriminant = b * b - 4.0f * a * c;

	if(discriminant > 0.0f){
		float distance = (-b - sqrt(discriminant)) / (2.0f * a);
		if(distance > 0.0001f && (distance < hitInfo.distance && hitInfo.hitDetected || !hitInfo.hitDetected)){
			hitInfo.distance = distance;
			hitInfo.hitPoint = ray.origin + ray.direction * hitInfo.distance;
			hitInfo.surfaceNormal = normalize(hitInfo.hitPoint - sphere.position);
			hitInfo.hitDetected = true;
		}
	}
}

vec3 iterativeRayTrace(Ray ray){
	Sphere sphere;
	sphere.position = vec3(0.0f, 0.0f, -1.0f);
	sphere.radius = 0.5;
	sphere.color = vec3(0.9f, 0.5f, 0.7f);
	
	int numberOfNodes = 1, currentNodeIndex = 0;
	
	rayNode[currentNodeIndex].ray = ray;
	rayNode[currentNodeIndex].depth = 0;
	
	while(currentNodeIndex < numberOfNodes){
		HitInfo hitInfo;
		hitInfo.hitDetected = false;
		sphereIntersect(ray, sphere, hitInfo);

		if(hitInfo.hitDetected){
			rayNode[currentNodeIndex].color = sphere.color;
		}
		else break;
		currentNodeIndex++;
	}
	return rayNode[0].color; 
}

void main(){
	Ray ray = Ray(origin, direction);
	outputColor = vec4(iterativeRayTrace(ray), 1.0f);
}

