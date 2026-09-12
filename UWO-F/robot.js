
class RobotAssistant {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(32, this.width / this.height, 0.1, 1000);
        this.camera.position.set(0, 0.5, 5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        this.mouse = { x: 0, y: 0 };
        this.hovered = false;
        this.clock = new THREE.Clock();

        this.initLights();
        this.initRobot();
        this.initEvents();
        this.animate();
    }

    initLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
        keyLight.position.set(5, 10, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        this.scene.add(keyLight);

        const rimLight1 = new THREE.PointLight(0xffffff, 3);
        rimLight1.position.set(-10, 5, -5);
        this.scene.add(rimLight1);

        const rimLight2 = new THREE.PointLight(0xffffff, 3);
        rimLight2.position.set(10, 5, -5);
        this.scene.add(rimLight2);

        const spotLight = new THREE.SpotLight(0xffffff, 1.5);
        spotLight.position.set(0, 10, -5);
        this.scene.add(spotLight);
        
        // Add a subtle glow light for the visor
        this.visorGlow = new THREE.PointLight(0x00f2ff, 1, 2);
        this.visorGlow.position.set(0, 1.48, 0.3);
        this.scene.add(this.visorGlow);
    }

    createRoundedBox(w, h, d, r, material) {
        // Simplified rounded box using a box geometry
        // In a real app we'd use a custom geometry, but for now let's use a box
        // and add a small subdivision to make it look less sharp if possible.
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, material);
        return mesh;
    }

    initRobot() {
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.torsoGroup = new THREE.Group();
        this.group.add(this.torsoGroup);

        this.primaryMaterial = new THREE.MeshStandardMaterial({
            color: '#1a1a1a',
            roughness: 0.65,
            metalness: 0.25,
        });

        // Torso Upper
        const torsoUpper = this.createRoundedBox(0.85, 0.65, 0.55, 0.2, this.primaryMaterial);
        torsoUpper.position.y = 0.8;
        this.torsoGroup.add(torsoUpper);

        // Torso Lower
        const torsoLower = this.createRoundedBox(0.65, 0.45, 0.48, 0.15, this.primaryMaterial);
        torsoLower.position.y = 0.35;
        torsoLower.scale.set(0.9, 1, 0.9);
        this.torsoGroup.add(torsoLower);

        // Neck
        const neckGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.1);
        const neck = new THREE.Mesh(neckGeo, this.primaryMaterial);
        neck.position.y = 1.1;
        this.torsoGroup.add(neck);

        // Head
        this.headGroup = new THREE.Group();
        this.headGroup.position.set(0, 1.48, 0);
        this.torsoGroup.add(this.headGroup);

        const headBox = this.createRoundedBox(0.65, 0.6, 0.52, 0.28, this.primaryMaterial);
        this.headGroup.add(headBox);

        // Visor
        const visorGeo = new THREE.BoxGeometry(0.6, 0.6, 0.1);
        const visorMat = new THREE.MeshStandardMaterial({
            color: "#000000",
            roughness: 0.015,
            metalness: 1,
            emissive: "#00f2ff",
            emissiveIntensity: 0.2
        });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 0, 0.22); // Slightly forward
        visor.scale.set(0.82, 0.78, 1);
        this.headGroup.add(visor);

        // Shoulders
        const shoulderGeo = new THREE.SphereGeometry(0.13, 32, 32);
        const shoulderLeft = new THREE.Mesh(shoulderGeo, this.primaryMaterial);
        shoulderLeft.position.set(-0.52, 0.98, 0);
        this.torsoGroup.add(shoulderLeft);

        const shoulderRight = new THREE.Mesh(shoulderGeo, this.primaryMaterial);
        shoulderRight.position.set(0.52, 0.98, 0);
        this.torsoGroup.add(shoulderRight);

        // Arms
        this.leftArm = this.createArm(-0.65, 0.98);
        this.rightArm = this.createArm(0.65, 0.98, true);
        this.torsoGroup.add(this.leftArm);
        this.torsoGroup.add(this.rightArm);

        // Legs
        const legGeo = new THREE.CapsuleGeometry(0.15, 0.55, 8, 16);
        const legLeft = new THREE.Mesh(legGeo, this.primaryMaterial);
        legLeft.position.set(-0.24, -0.2, 0);
        this.group.add(legLeft);

        const legRight = new THREE.Mesh(legGeo, this.primaryMaterial);
        legRight.position.set(0.24, -0.2, 0);
        this.group.add(legRight);
    }

    createArm(x, y, isRight = false) {
        const armGroup = new THREE.Group();
        armGroup.position.set(x, y, 0);

        const upperArmGeo = new THREE.CapsuleGeometry(0.085, 0.4, 8, 16);
        const upperArm = new THREE.Mesh(upperArmGeo, this.primaryMaterial);
        upperArm.position.y = -0.3;
        armGroup.add(upperArm);

        const elbowGeo = new THREE.SphereGeometry(0.07, 16, 16);
        const elbow = new THREE.Mesh(elbowGeo, this.primaryMaterial);
        elbow.position.y = -0.6;
        armGroup.add(elbow);

        const lowerArmGeo = new THREE.CapsuleGeometry(0.08, 0.38, 8, 16);
        const lowerArm = new THREE.Mesh(lowerArmGeo, this.primaryMaterial);
        lowerArm.position.set(isRight ? -0.05 : 0.05, -0.9, 0.12);
        lowerArm.rotation.x = 0.4;
        armGroup.add(lowerArm);

        const handGeo = new THREE.BoxGeometry(0.18, 0.24, 0.15);
        const hand = new THREE.Mesh(handGeo, this.primaryMaterial);
        hand.position.set(isRight ? -0.07 : 0.07, -1.2, 0.26);
        hand.rotation.set(0.3, isRight ? -0.2 : 0.2, isRight ? -0.3 : 0.3);
        armGroup.add(hand);

        return armGroup;
    }

    initEvents() {
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        this.container.addEventListener('mouseenter', () => this.hovered = true);
        this.container.addEventListener('mouseleave', () => this.hovered = false);

        window.addEventListener('resize', () => {
            this.width = this.container.clientWidth;
            this.height = this.container.clientHeight;
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.width, this.height);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const t = this.clock.getElapsedTime();
        const stabilization = this.hovered ? 0.35 : 1;

        // Floating Motion
        if (this.group) {
            this.group.position.y = -0.6 + Math.sin(t * 0.75) * 0.15 * stabilization;
        }

        // Torso Motion
        if (this.torsoGroup) {
            this.torsoGroup.rotation.x = -0.05 + Math.sin(t * 0.75) * 0.05 * stabilization;
        }

        // Arm Motion
        if (this.leftArm && this.rightArm) {
            const hoverLift = this.hovered ? -0.35 : 0;
            
            this.leftArm.rotation.z = -0.4 + Math.sin(t * 0.75 + 0.6) * 0.12 * stabilization + hoverLift;
            this.leftArm.rotation.y = 0.2 + Math.sin(t * 0.75 + 1.2) * 0.08 * stabilization;
            this.leftArm.rotation.x = -0.2 + Math.sin(t * 0.75 + 0.3) * 0.05 * stabilization;

            this.rightArm.rotation.z = 0.4 + Math.sin(t * 0.75 + 0.6) * -0.12 * stabilization - hoverLift;
            this.rightArm.rotation.y = -0.2 + Math.sin(t * 0.75 + 1.2) * -0.08 * stabilization;
            this.rightArm.rotation.x = -0.2 + Math.sin(t * 0.75 + 0.3) * 0.05 * stabilization;
        }

        // Head Motion
        if (this.headGroup) {
            this.headGroup.rotation.y = Math.sin(t * 0.75 + 0.5) * 0.15 * stabilization;
            this.headGroup.rotation.x = Math.sin(t * 0.75 + 0.2) * 0.06 * stabilization;
        }

        // Mouse Interaction
        if (this.group) {
            const targetRotationY = (this.mouse.x * 0.14);
            const targetRotationX = (-this.mouse.y * 0.12);
            
            this.group.rotation.y += (targetRotationY - this.group.rotation.y) * 0.08;
            this.group.rotation.x += (targetRotationX - this.group.rotation.x) * 0.08;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize on window load
window.addEventListener('DOMContentLoaded', () => {
    new RobotAssistant('robot-canvas-container');
});
