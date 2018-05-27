#version 450 core

in vec3 origin, direction;
out vec4 outputColor;

struct Material{
	vec3 ambient;
	vec3 diffuse;
	vec3 reflection;
	vec3 specular;
	vec3 transparency;
	vec3 emission;
	vec3 atenuation;
	float refractionCoef;
	float shiness;
};

struct Sphere {
	vec3 position;
	float radius;
	Material material;
	//vec3 color;
};

struct Triangle{
	vec3 a;
	vec3 b;
	vec3 c;
	Material material;
};

struct Ray {
	vec3 origin;
	vec3 direction;
	int type;
};

struct RayNode {
	Ray ray;
	vec3 reflectionColor;
	vec3 refractionColor;
	vec3 diffuseColor;
	vec3 specular;
	vec3 reflection;
	vec3 refraction;
	int parentIndex;
	int depth;
};

const int TYPE_DIFFUSE = 1;
const int TYPE_REFLECTION = 3;
const int TYPE_SHADOW = 2;
const int TYPE_TRANSPARENCY = 4;

const int TYPE_SPHERE = 0;
const int TYPE_TRIANGLE = 1;

struct HitInfo {
	bool hitDetected;
	vec3 hitPoint;
	vec3 surfaceNormal;
	float distance;
	vec3 color;
	int objectid;
	int objectType;
};

Material mirror = {
	vec3(0.0, 0.0, 0.0),
	vec3(0.1, 0.1, 0.9),
	vec3(0.0, 0.0, 0.0),
	vec3(0.1, 1.0, 0.1),
	vec3(0),
	vec3(0),
	vec3(0),
	1, 
	200
};

Material stone = {
	vec3(0),
	vec3(0.9, 0.3, 0.1),
	vec3(0.0, 0.0, 0.0),
	vec3(0),
	vec3(0),
	vec3(0),
	vec3(0),
	0,
	0
};

Material light = {
	vec3(0.0),
	vec3(0.0),
	vec3(0.0),
	vec3(0.0),
	vec3(1.0),
	vec3(1.0),
	vec3(0.0),
	1.0,
	300
};

Material gold = {
	vec3(0.25, 0.2, 0.07),
	vec3(0.75, 0.6, 0.23),
	vec3(0.63, 0.56, 0.37),
	vec3(1.0, 1.0, 1.0),
	vec3(0.0, 0.0, 0.0),
	vec3(0.0, 0.0, 0.0),
	vec3(1.0, 1.0, 6),
	0,
	150
};

Material wood = {
	vec3(0.25, 0.2, 0.07),
	vec3(0.75, 0.6, 0.23),
	vec3(0.63, 0.56, 0.37),
	vec3(1.0, 1.0, 1.0),
	vec3(0.0, 0.0, 0.0),
	vec3(0.0, 0.0, 0.0),
	vec3(1.0, 1.0, 6),
	0,
	150
};

Material black = {
	vec3(0),
	vec3(0),
	vec3(0),
	vec3(0),
	vec3(0),
	vec3(0),
	vec3(0),
	0,
	0
};

const int sphereNumber = 2;
const int triangleNumber = 1;
const int objectNumber = sphereNumber + triangleNumber;

const int Max_Depth = 5;
const int Max_Nodes = 64;
RayNode rayNode[Max_Nodes];
Sphere spheres[sphereNumber];
Triangle triangles[triangleNumber];

void InitScene(){
	spheres[0].position = vec3(1, 1, -0.4);
	spheres[0].radius = 0.1;
	spheres[0].material = light;

	/*spheres[1].position = vec3(0.0, 1.0, -2.3);
	spheres[1].radius = 0.7;
	spheres[1].material = mirror;*/

	spheres[0].position = vec3(-0.5, 0.0, -0.8);
	spheres[0].radius = 0.8;
	spheres[0].material = stone;

	spheres[1].position = vec3(1.2, 0.9, -1.2);
	spheres[1].radius = 0.4;
	spheres[1].material = gold;

	/*spheres[4].position = vec3(1.5, 1.0, -0.8);
	spheres[4].radius = 0.6;
	spheres[4].material = wood;*/

	/*triangles[0].a = vec3(2, -2, -2);
	triangles[0].b = vec3(2, 2, -2);
	triangles[0].c = vec3(-2, -2, -2);
	triangles[0].material = wood;*/
}

void sphereIntersect(Ray ray, int objectid, inout HitInfo hitInfo){
	Sphere sphere = spheres[objectid];
	vec3 trackToSphere = ray.origin - sphere.position;
	float a = dot(ray.direction, ray.direction);
	float b = 2 * dot(trackToSphere, ray.direction);
	float c = dot(trackToSphere, trackToSphere) - sphere.radius * sphere.radius;
	float discriminant = b * b - 4.0 * a * c;

	if(discriminant > 0.0){
		float sdiscriminant = sqrt(discriminant);
		float t1 = ( -b - sdiscriminant ) / (2 * a);
		//float t2 = ( -b + sdiscriminant ) / (2 * a);
		float distance;

		//if(t1 > t2) distance = t2;
		//else distance = t1;

		distance = t1;

		if(distance > 0.0001 && 
			(distance < hitInfo.distance 
			&& hitInfo.hitDetected || !hitInfo.hitDetected)
		){
			hitInfo.distance = distance;
			hitInfo.hitPoint = ray.origin + ray.direction * hitInfo.distance;
			hitInfo.surfaceNormal = normalize(hitInfo.hitPoint - sphere.position);
			hitInfo.objectType = TYPE_SPHERE;
			hitInfo.objectid = objectid;
			hitInfo.hitDetected = true;
		}
	}
}

void triangleIntersect(Ray ray, int objectid, inout HitInfo hitInfo){
	Triangle triangle = triangles[objectid];
	
	vec3 normal = normalize(cross(triangle.b - triangle.a, triangle.c - triangle.a));
	float d = dot(normal, triangle.a);
	float distance = (d - dot(ray.origin, normal)) / dot(normal, ray.direction);
	vec3 Point = ray.origin + ray.direction * distance;;

	float firstCond = dot(cross((triangle.b - triangle.a), (Point - triangle.a)), normal);
	float secondCond = dot(cross((triangle.c - triangle.b), (Point - triangle.b)), normal);
	float thirdCond = dot(cross((triangle.a - triangle.c), (Point - triangle.c)), normal);

	if(!((firstCond >= 0) && (secondCond >= 0) && (thirdCond >= 0)))
		return;

	//vec3 a, b, n;
	/*a = triangle.a - ray.origin;
	b = triangle.b - ray.origin;
	n = cross(a,b);
	float ip1 = dot(ray.direction, n);
	a = triangle.b - ray.origin;
	b = triangle.c - ray.origin;
	n = cross(a,b);
	float ip2 = dot(ray.direction, n);
	a = triangle.c - ray.origin;
	b = triangle.a - ray.origin;
	n = cross(a,b); 
	float ip3 = dot(ray.direction, n);*/

	//if(!(((ip1 <= 0) && (ip2 <= 0) && (ip3 <= 0)) || ((ip1 >= 0) && (ip2 >= 0) && (ip3 >= 0))))
	//	return;

	if(distance > 0.0001 && (distance < hitInfo.distance && hitInfo.hitDetected || !hitInfo.hitDetected))
	{
		hitInfo.distance = distance;
		hitInfo.hitPoint = Point;
		hitInfo.objectType = TYPE_TRIANGLE;
		hitInfo.objectid = objectid;
		hitInfo.hitDetected = true;
	}
}


vec3 phongShading(Material material, Material lightMaterial, vec3 hitPoint, vec3 surfaceNormal,
				vec3 lightDir, vec3 reflectDir, vec3 eyeDir, float distance){
		float attenuation = 1.0 / (1.0 + lightMaterial.atenuation.x + 
			distance * lightMaterial.atenuation.y + distance * distance * lightMaterial.atenuation.z);

		float diffuseCoef = max(0.0, dot(surfaceNormal, lightDir));
		float specularCoef = pow(dot(eyeDir, reflectDir), material.shiness);

		return material.ambient * lightMaterial.ambient + (material.diffuse * lightMaterial.emission * diffuseCoef + material.specular * lightMaterial.emission * specularCoef) * attenuation;
	}

bool isShadowed(vec3 hitPoint, int lightIndex, int lightType, inout vec3 transparency){
	HitInfo hitInfoLight;
	hitInfoLight.hitDetected = false;
	Ray ray;
	
	if(lightType == TYPE_SPHERE){
		Sphere light = spheres[lightIndex];
		vec3 eps = normalize(light.position - hitPoint) * 0.001;
		ray = Ray(hitPoint + eps, normalize(light.position - hitPoint), TYPE_SHADOW);
		sphereIntersect(ray, lightIndex, hitInfoLight);
	}
	if(lightType == TYPE_TRIANGLE){
		Triangle light = triangles[lightIndex];
		vec3 center = (light.a + light.b + light.c) / 3;
		vec3 eps = normalize(center - hitPoint) * 0.001;
		ray = Ray(hitPoint + eps, normalize(center - hitPoint), TYPE_SHADOW);
		sphereIntersect(ray, lightIndex, hitInfoLight);
	}

	float distance = hitInfoLight.distance;
	HitInfo hitInfo;
	transparency = vec3(1.0);
	for(int i = 0; i < objectNumber; i++){
		hitInfo.hitDetected = false;
		Material material;
		int type;
		int index ;

		if(i < sphereNumber){
			index = i;
			material = spheres[index].material;
			type = TYPE_SPHERE;
			sphereIntersect(ray, index, hitInfo);
		}
		else{
			index = i - sphereNumber;
			material = triangles[index].material;
			type = TYPE_TRIANGLE;
			sphereIntersect(ray, index, hitInfo);
		}

		if((lightIndex != index || lightType != type) && hitInfo.hitDetected && hitInfo.distance < distance){
			if(length(material.transparency) > 0){
				transparency *= material.transparency;
				continue;
			}

			transparency = vec3(0.0);
			return true;
		}
	}
	return false;
}

vec3 calculateColor(HitInfo hitInfo){
	Material material;

	if(hitInfo.objectType == TYPE_SPHERE)
		material = spheres[hitInfo.objectid].material;
	
	if(hitInfo.objectType == TYPE_TRIANGLE)
		material = triangles[hitInfo.objectid].material;

	vec3 hitPoint = hitInfo.hitPoint;
	vec3 surfaceNormal = hitInfo.surfaceNormal;

	if(length(material.emission) > 0.0)
		return material.emission + material.diffuse;
	
	vec3 resultColor = vec3(0);

	for(int i = 0; i < objectNumber; i++){
		Material lightMaterial;
		vec3 lightPosition;
		int lightType;
		int lightIndex = i;
		
		if(i < sphereNumber){
			lightIndex = i;
			lightMaterial = spheres[lightIndex].material;
			lightPosition = spheres[lightIndex].position;
			lightType = TYPE_SPHERE;
		}
		else{
			lightIndex = i - sphereNumber;
			lightMaterial = triangles[lightIndex].material;
			//lightPosition = triangles[lightIndex].center;
			lightPosition = (triangles[lightIndex].a + triangles[lightIndex].b + triangles[lightIndex].c) / 3;
			lightType = TYPE_TRIANGLE;
		}

		vec3 transparency;

		if((hitInfo.objectid != lightIndex || hitInfo.objectType != lightType) && length(lightMaterial.emission) > 0.0){
			vec3 currentColor = vec3(0);
			
			if(!isShadowed(hitPoint, lightIndex, lightType, transparency)){
				vec3 lightDir = lightPosition - hitPoint;
				float distance = length(lightDir);
				lightDir = normalize(lightDir);

				vec3 eyeDir = normalize(origin - hitPoint);
				vec3 reflectDir = vec3(0);
				if(dot(surfaceNormal, lightDir) > 0.0)
					reflectDir = normalize(reflect(surfaceNormal, -lightDir));
				
				currentColor += phongShading(material, lightMaterial, hitPoint, surfaceNormal, lightDir, reflectDir, eyeDir, distance) * transparency;
			}
			else{
				currentColor += lightMaterial.ambient * material.ambient;
			}
			resultColor += currentColor;
		}
	}
	return resultColor;
}

vec3 iterativeRayTrace(Ray ray){
	float cosa = 0.0f;
	float sina = 1.0f;
	HitInfo hitInfo;

	hitInfo.hitPoint = ray.origin;

	InitScene();

	int numberOfNodes = 1, currentNodeIndex = 0;
	
	rayNode[currentNodeIndex].ray = ray;
	rayNode[currentNodeIndex].depth = 0;
	//rayNode[currentNodeIndex].color = sphere.color;
	
	while(currentNodeIndex < numberOfNodes){
		vec3 rayVec = rayNode[currentNodeIndex].ray.direction;

		rayNode[currentNodeIndex].diffuseColor = vec3(0);
		rayNode[currentNodeIndex].reflectionColor = vec3(0);
		rayNode[currentNodeIndex].refractionColor = vec3(0);

		hitInfo.hitDetected = false;

		for(int i = 0; i < sphereNumber; i++){
			sphereIntersect(rayNode[currentNodeIndex].ray, i, hitInfo);
		}

		for(int i = 0; i < sphereNumber; i++){
			triangleIntersect(rayNode[currentNodeIndex].ray, i, hitInfo);
		}

		if(hitInfo.hitDetected){
			Material material;
			
			switch(hitInfo.objectType){
				case TYPE_SPHERE: material = spheres[hitInfo.objectid].material; break;
				//case TYPE_PLANE: material = planes[hitInfo.objectid].material; break;
				case TYPE_TRIANGLE: material = triangles[hitInfo.objectid].material; break;
			}
			
			//cosa = dot(hitInfo.surfaceNormal, rayVec) * dot(hitInfo.surfaceNormal, rayVec) / (sqrt(dot(hitInfo.surfaceNormal, hitInfo.surfaceNormal)) * sqrt(dot(rayVec, rayVec)));
			//sina = sqrt(1 - cosa * cosa);

			rayNode[currentNodeIndex].specular = material.specular;
			rayNode[currentNodeIndex].reflection = material.reflection;
			rayNode[currentNodeIndex].refraction = material.transparency;

			if(length(material.reflection) > 0.0f && rayNode[currentNodeIndex].depth < Max_Depth){
				vec3 reflectionDir = normalize(reflect(rayNode[currentNodeIndex].ray.direction, hitInfo.surfaceNormal));
				vec3 offset = reflectionDir * 0.01;

				rayNode[numberOfNodes].ray = Ray(hitInfo.hitPoint + offset, reflectionDir, TYPE_REFLECTION);
				rayNode[numberOfNodes].parentIndex = currentNodeIndex;
				rayNode[numberOfNodes].depth = rayNode[currentNodeIndex].depth + 1;
				numberOfNodes++;

			}

			if(length(material.transparency) > 0.0f && rayNode[currentNodeIndex].depth < Max_Depth){
				vec3 refractionDir = normalize(refract(rayNode[currentNodeIndex].ray.direction, hitInfo.surfaceNormal, material.refractionCoef));
				vec3 offset = refractionDir * 0.01;
				
				rayNode[numberOfNodes].ray = Ray(hitInfo.hitPoint + offset, refractionDir, TYPE_TRANSPARENCY);
				rayNode[numberOfNodes].parentIndex = currentNodeIndex;
				rayNode[numberOfNodes].depth = rayNode[currentNodeIndex].depth + 1;
				numberOfNodes++;
			}

			if(length(material.ambient) > 0.0 ||
				length(material.diffuse) > 0.0 || 
				length(material.specular) > 0.0 ||
				rayNode[currentNodeIndex].depth >= Max_Depth
				){

				rayNode[currentNodeIndex].diffuseColor = calculateColor(hitInfo);				
				//rayNode[currentNodeIndex].diffuseColor = vec3(0.9, 0.5, 0.7);
			}
			else{
				rayNode[currentNodeIndex].diffuseColor = vec3(0.0, 0.0, 0.0);
			}
			currentNodeIndex++;

			/*rayNode[currentNodeIndex].color = hitInfo.color * cosa;
			if(currentNodeIndex < Max_Nodes){
				rayNode[currentNodeIndex].ray = Ray(ray.direction * sina, hitInfo.hitPoint);
			}
			else break;
			currentNodeIndex++;*/
		}
		else break;
	}
	//if(currentNodeIndex == 0) return vec3(0.0, 0.0, 0.0);
	//else return rayNode[0].color;

	for(int i = currentNodeIndex - 1; i > 0; i--){
		vec3 nodeColor = rayNode[i].diffuseColor + rayNode[i].reflectionColor * rayNode[i].reflection + rayNode[i].refractionColor * rayNode[i].refraction;

		if(rayNode[i].ray.type == TYPE_REFLECTION)
			rayNode[rayNode[i].parentIndex].reflectionColor = nodeColor;
		else if(rayNode[i].ray.type == TYPE_TRANSPARENCY)
			rayNode[rayNode[i].parentIndex].refractionColor = nodeColor;
	}

	return clamp(rayNode[0].diffuseColor + rayNode[0].reflectionColor * rayNode[0].reflection + rayNode[0].refractionColor * rayNode[0].refraction, vec3(0), vec3(1));
	//return rayNode[0].diffuseColor;
}

void main(){
	Ray ray = Ray(origin, direction, 1);
	outputColor = vec4(iterativeRayTrace(ray), 1);
	//FragColor = outputColor;
}