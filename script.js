import * as THREE from "https://esm.sh/three@0.136.0";
import { GLTFLoader } from "https://esm.sh/three@0.136.0/examples/jsm/loaders/GLTFLoader";
import { gsap } from "https://esm.sh/gsap@3.12.5";
import { ScrollTrigger } from "https://esm.sh/gsap@3.12.5/ScrollTrigger";
import { SplitText } from "https://esm.sh/gsap/SplitText";

import { EffectComposer } from "https://esm.sh/three@0.136.0/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "https://esm.sh/three@0.136.0/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "https://esm.sh/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Global variables
let scene, camera, renderer, lamp, spotlight, groundMesh;
let isFlickering = false;
let flickerTimeline;
let lenis;
let isZoomedIn = false;
let raycaster, mouse;
let autoZoomOutTimer;

// Initialize the application
function init() {
  // Initialize Lenis smooth scrolling
  initSmoothScroll();

  // Initialize Three.js scene
  initThreeJS();

  // Create the street lamp
  createStreetLamp();

  // Create the ground
  createGround();

  // Setup lighting
  setupLighting();

  // Add event listeners
  addEventListeners();

  // Start render loop
  animate();
}

// Initialize immediate scrolling (no smooth scrolling)
function initSmoothScroll() {
  // Disable Lenis completely for instant scroll response
  // Just add a regular scroll listener for any scroll-based effects
  window.addEventListener("scroll", onScroll);
}

// Initialize Three.js scene
function initThreeJS() {
  // Create scene
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x222222, 10, 25);

  // Create camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(1, 3, 8);
  camera.lookAt(4, 2, 0);

  // Initialize raycaster for mouse interactions
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Create renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("three-canvas"),
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
}

// Create street lamp (procedural since GLB files are restricted)
function createStreetLamp() {
  const lampGroup = new THREE.Group();

  // Lamp post
  const postGeometry = new THREE.CylinderGeometry(0.1, 0.15, 6, 8);
  const postMaterial = new THREE.MeshLambertMaterial({
    color: 0xd6d6d6,
  });
  const post = new THREE.Mesh(postGeometry, postMaterial);
  post.position.y = 3;
  post.position.x = -2.5;
  post.castShadow = true;
  lampGroup.add(post);

  // Lamp arm
  const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 6);
  const armMaterial = new THREE.MeshLambertMaterial({ color: 0xd6d6d6 });
  const arm = new THREE.Mesh(armGeometry, armMaterial);
  arm.position.set(-1.5, 5.5, 0);
  arm.rotation.z = Math.PI / 2;

  arm.castShadow = true;
  lampGroup.add(arm);

  // Lamp head
  const headGeometry = new THREE.SphereGeometry(
    0.5,
    16,
    8,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  const headMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 5.3, 0);
  head.position.x = -0.5;
  head.castShadow = true;
  lampGroup.add(head);

  // Light bulb (emissive sphere) - brighter and more visible
  const bulbGeometry = new THREE.SphereGeometry(0.25, 15, 8);
  const bulbMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 1.0,
  });
  const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
  bulb.position.set(-0.5, 5.3, 0);
  lampGroup.add(bulb);

  // Store reference to bulb for flickering
  lampGroup.bulb = bulb;

  scene.add(lampGroup);
  lamp = lampGroup;
}

// Create ground plane
function createGround() {
  const groundGeometry = new THREE.PlaneGeometry(50, 50);

  // Create a simple texture pattern since image textures are restricted
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Create a dark road-like texture
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, 512, 512);

  // Add some lines for road effect
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  // Add some texture noise
  for (let i = 0; i < 1000; i++) {
    ctx.fillStyle = `rgba(${Math.random() * 50 + 30}, ${
      Math.random() * 50 + 30
    }, ${Math.random() * 50 + 30}, 0.3)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
  }

  const groundTexture = new THREE.CanvasTexture(canvas);
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(4, 4);

  const groundMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
  });

  groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);
}

// Setup lighting
function setupLighting() {
  // Ambient light - increased for better visibility
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
  scene.add(ambientLight);

  // Spotlight from the lamp - much brighter and wider spread
  spotlight = new THREE.SpotLight(0xffd700, 3, 25, Math.PI / 4, 0.3, 1.5);
  spotlight.position.set(5, 3, 0);
  spotlight.target.position.set(2, 0, 0);
  spotlight.castShadow = true;
  spotlight.shadow.mapSize.width = 2048;
  spotlight.shadow.mapSize.height = 2048;
  spotlight.shadow.camera.near = 0.5;
  spotlight.shadow.camera.far = 25;
  spotlight.shadow.bias = -0.0001;

  scene.add(spotlight);
  scene.add(spotlight.target);

  // Additional fill light to brighten the scene
  const fillLight = new THREE.DirectionalLight(0x404040, 0.5);
  fillLight.position.set(2, 1, 5);
  scene.add(fillLight);
}

// Add event listeners
function addEventListeners() {
  // Window resize
  window.addEventListener("resize", onWindowResize, false);

  // Hover events for navigation links
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("mouseenter", triggerFlicker);
  });

  // Hover event for CTA button
  const ctaButton = document.getElementById("lightButton");
  ctaButton.addEventListener("mouseenter", triggerFlicker);
  ctaButton.addEventListener("click", () => {
    triggerFlicker();
    // Instant scroll to intro section
    document.getElementById("intro").scrollIntoView({ behavior: "smooth" });
  });

  // Mouse movement for subtle camera effects
  document.addEventListener("mousemove", onMouseMove);

  // Click events for 3D interactions
  document.addEventListener("click", onCanvasClick);

  // Note: Scroll listener is already added in initSmoothScroll()
}

// Generate flicker sound using Web Audio API
function playFlickerSound() {
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    // Create oscillator for electrical buzz sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set frequency for electrical buzz (around 60Hz with harmonics)
    oscillator.frequency.setValueAtTime(60, audioContext.currentTime);
    oscillator.type = "sawtooth";

    // Create flickering volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(
      0.02,
      audioContext.currentTime + 0.05
    );
    gainNode.gain.linearRampToValueAtTime(
      0.08,
      audioContext.currentTime + 0.08
    );
    gainNode.gain.linearRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.12
    );
    gainNode.gain.linearRampToValueAtTime(
      0.06,
      audioContext.currentTime + 0.18
    );
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log("Audio context not available:", e);
  }
}

// Trigger flicker animation
function triggerFlicker() {
  if (isFlickering) return;

  isFlickering = true;

  // Play generated flicker sound
  playFlickerSound();

  // Create flicker timeline with GSAP
  flickerTimeline = gsap.timeline({
    onComplete: () => {
      isFlickering = false;
    },
  });

  // Flicker the spotlight intensity
  flickerTimeline
    .to(spotlight, { intensity: 1, duration: 0.05 })
    .to(spotlight, { intensity: 4, duration: 0.08 })
    .to(spotlight, { intensity: 0.8, duration: 0.03 })
    .to(spotlight, { intensity: 5, duration: 0.1 })
    .to(spotlight, { intensity: 1.5, duration: 0.04 })
    .to(spotlight, { intensity: 3, duration: 0.15 });

  // Flicker the bulb material
  if (lamp && lamp.bulb) {
    flickerTimeline
      .to(lamp.bulb.material, { opacity: 0.3, duration: 0.05 }, 0)
      .to(lamp.bulb.material, { opacity: 1, duration: 0.08 }, 0.05)
      .to(lamp.bulb.material, { opacity: 0.2, duration: 0.03 }, 0.13)
      .to(lamp.bulb.material, { opacity: 1, duration: 0.1 }, 0.16)
      .to(lamp.bulb.material, { opacity: 0.4, duration: 0.04 }, 0.26)
      .to(lamp.bulb.material, { opacity: 0.8, duration: 0.15 }, 0.3);
  }
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle mouse movement for camera effects
function onMouseMove(event) {
  if (isZoomedIn) return; // Disable mouse movement when zoomed in

  const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update mouse coordinates for raycasting
  mouse.x = mouseX;
  mouse.y = mouseY;

  // Subtle camera movement - adjusted for closer position
  gsap.to(camera.position, {
    x: mouseX * 0.3,
    y: 3 + mouseY * 0.2,
    duration: 2,
    ease: "power2.out",
  });
}

// Handle canvas clicks for lamp interaction
function onCanvasClick(event) {
  // Only process clicks on the canvas
  if (event.target.id !== "three-canvas") return;

  // Calculate mouse position in normalized device coordinates
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObject(lamp, true);

  if (intersects.length > 0 && !isZoomedIn) {
    zoomIntoLamp();
  } else if (isZoomedIn) {
    zoomOutFromLamp();
  }
}

// Zoom into the lamp
function zoomIntoLamp() {
  isZoomedIn = true;

  // Hide hero content
  gsap.to(".hero-content", {
    opacity: 0,
    duration: 0.5,
    ease: "power2.out",
  });

  // Zoom camera closer to the lamp
  gsap.to(camera.position, {
    x: 3,
    y: 5,
    z: 4,
    duration: 2,
    ease: "power2.inOut",
  });

  gsap.to(camera.rotation, {
    x: -0.2,
    y: 0.3,
    z: 0,
    duration: 2,
    ease: "power2.inOut",
  });

  // Show the special message after zoom completes
  setTimeout(() => {
    showSpecialMessage();
  }, 2000);

  // Auto zoom out after 4 seconds
  autoZoomOutTimer = setTimeout(() => {
    if (isZoomedIn) {
      zoomOutFromLamp();
    }
  }, 4000);

  // Trigger a flicker effect
  triggerFlicker();
}

// Zoom out from the lamp
function zoomOutFromLamp() {
  isZoomedIn = false;

  // Clear the auto zoom out timer if it exists
  if (autoZoomOutTimer) {
    clearTimeout(autoZoomOutTimer);
    autoZoomOutTimer = null;
  }

  // Hide special message
  hideSpecialMessage();

  // Restore original camera position
  gsap.to(camera.position, {
    x: 0,
    y: 3,
    z: 8,
    duration: 2,
    ease: "power2.inOut",
  });

  gsap.to(camera.rotation, {
    x: 0,
    y: 0,
    z: 0,
    duration: 2,
    ease: "power2.inOut",
  });

  // Show hero content again
  setTimeout(() => {
    gsap.to(".hero-content", {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
    });
  }, 1500);
}

// Show special message
function showSpecialMessage() {
  const message = document.createElement("div");
  message.id = "special-message";
  message.className = "special-message";
  message.innerHTML =
    '"If light flickers in a place,<br>now you know where to go"';
  document.body.appendChild(message);

  gsap.fromTo(
    message,
    {
      opacity: 0,
      scale: 0.8,
      y: 25,
      x: 200,
    },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 1,
      ease: "back.out(1.7)",
    }
  );
}

// Hide special message
function hideSpecialMessage() {
  const message = document.getElementById("special-message");
  if (message) {
    gsap.to(message, {
      opacity: 0,
      scale: 0.8,
      y: -50,
      duration: 0.5,
      ease: "power2.in",
      onComplete: () => {
        message.remove();
      },
    });
  }
}

// Handle scroll events
function onScroll() {
  const scrollY = window.pageYOffset;
  const windowHeight = window.innerHeight;

  // Subtle lamp rotation based on scroll
  if (lamp) {
    lamp.rotation.y = scrollY * 0.005;
  }

  // Adjust fog density based on scroll
  if (scene.fog) {
    scene.fog.near = 10 + scrollY * 0.01;
    scene.fog.far = 50 + scrollY * 0.02;
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Idle camera drift
  const time = Date.now() * 0.0005;
  camera.position.x += Math.sin(time * 0.5) * 0.002;
  camera.position.z += Math.cos(time * 0.3) * 0.001;

  // Subtle lamp sway
  if (lamp) {
    lamp.rotation.x = Math.sin(time) * 0.01;
    lamp.rotation.z = Math.cos(time * 0.7) * 0.005;
  }

  // Render the scene
  renderer.render(scene, camera);
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", init);

// GSAP animations for scroll-triggered elements
gsap.registerPlugin(ScrollTrigger);

// Animate sections on scroll
gsap.utils.toArray(".section-title").forEach((title) => {
  gsap.fromTo(
    title,
    {
      opacity: 0,
      y: 50,
    },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: title,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none reverse",
      },
    }
  );
});

gsap.utils.toArray(".section-text").forEach((text) => {
  gsap.fromTo(
    text,
    {
      opacity: 0,
      y: 30,
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: text,
        start: "top 85%",
        end: "bottom 15%",
        toggleActions: "play none none reverse",
      },
    }
  );
});

gsap.utils.toArray(".feature").forEach((feature, index) => {
  gsap.fromTo(
    feature,
    {
      opacity: 0,
      y: 40,
      scale: 0.9,
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      delay: index * 0.1,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: feature,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none reverse",
      },
    }
  );
});

// Navbar background on scroll
gsap.to(".navbar", {
  backgroundColor: "rgba(10, 10, 10, 0.95)",
  duration: 0.3,
  scrollTrigger: {
    trigger: "body",
    start: "100px top",
    end: "200px top",
    toggleActions: "play none none reverse",
  },
});

// Add some console logging for debugging
console.log("StreetLamp app initialized");
console.log("Three.js version:", THREE.REVISION);

// Initialize audio context on first user interaction
let audioContextInitialized = false;
document.addEventListener(
  "click",
  () => {
    if (!audioContextInitialized) {
      audioContextInitialized = true;
      console.log("Audio context ready for sound generation");
    }
  },
  { once: true }
);

let scene2, camera2, renderer2, bulb2;

function settingscene2() {
  scene2 = new THREE.Scene();
  camera2 = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera2.position.set(0, 3, 8);

  renderer2 = new THREE.WebGLRenderer({
    canvas: document.getElementById("three-canvas2"),
    antialias: true,
    alpha: true,
  });
  renderer2.setSize(window.innerWidth, window.innerHeight);
  renderer2.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer2.shadowMap.enabled = true;
  renderer2.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer2.outputEncoding = THREE.sRGBEncoding;
  renderer2.toneMapping = THREE.ACESFilmicToneMapping;
  renderer2.toneMappingExposure = 0.8;

  // Create bulb
  const bulbGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const bulbMaterial = new THREE.MeshPhysicalMaterial({
    metalness: 0.5,
    roughness: 0.4,
    emissive: new THREE.Color(0xffcc00), // soft yellow glow
    emissiveIntensity: 10.0,
  });
  bulb2 = new THREE.Mesh(bulbGeometry, bulbMaterial);
  bulb2.position.set(0, 1, 0);
  bulb2.castShadow = true;
  bulb2.receiveShadow = true;
  bulb2.scale.set(0.5, 0.5, 0.5);

  scene2.add(bulb2);
  animate2();
}
const loader = new GLTFLoader();
let model;

loader.load(
  "assets/thelightcube.glb",
  function (gltf) {
    model = gltf.scene;

    model.traverse((node) => {
      if (node.isMesh && node.material) {
        Object.assign(node.material, {
          metalness: 0.5,
          roughness: 0.4,
          emissive: new THREE.Color(0xffcc66), // soft yellow glow
          emissiveIntensity: 10.0,
        });
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const modelSize = size;
    model.position.set(0, 1, 0);
    model.scale.set(1, 1, 1);
    scene2.add(model);

    // we call our setup model function to position it correctly
  },
  function (xhr) {},
  function (error) {
    console.log(error);
  }
);



   let mainTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: '#intro',
            start: 'top top',
            end: `+=${window.innerHeight * 6}`,
            scrub: 1, // Smooth scrubbing
            pin: true,
            anticipatePin: 1,
            onUpdate: function(self) {
                // Rotate bulb based on scroll progress (5 full rotations)
                if (bulb2 && model) {
                    bulb2.rotation.y = self.progress * Math.PI * 2 * 5;
                    
                    // Add some dynamic scaling for extra visual interest
                    const scale = 2 + Math.sin(self.progress * Math.PI * 10) * 0.2;
                    const scale1 = 2 + Math.sin(self.progress * Math.PI * 10) * 0.1;
                    const scale2 = 2 + Math.sin(self.progress * Math.PI * 10) * 0.3;
                    bulb2.scale.set(scale, scale1, scale2);
                    model.scale.set(scale, scale1, scale2);
                    model.rotation.y = self.progress * Math.PI * 2 * 5;
                    
                    
                    // Adjust emissive intensity based on rotation
                    const intensity = 0.3 + Math.sin(self.progress * Math.PI * 5) * 0.2;
                    bulb2.material.emissiveIntensity = intensity;
                }
            }
        }
    });
    mainTimeline.fromTo('.container2', 
        { 
            x: '10vw',
            opacity: 1
        },
        { 
            x: '-450vw',
            opacity: 1,
            duration: 1,
            ease: 'none'
        }
    );




let clock = new THREE.Clock();

function onWindowResize2() {
  camera2.aspect = window.innerWidth / window.innerHeight;
  camera2.updateProjectionMatrix();
  renderer2.setSize(window.innerWidth, window.innerHeight);
}
function animate2() {
  requestAnimationFrame(animate2);

  // Rotate the bulb
  const elapsed = clock.getElapsedTime();
  if (bulb2 && model) {

    model.rotation.y += 0.01;
    model.rotation.x += 0.005;
    model.rotation.z += 0.003;
    bulb2.rotation.x += 0.005;
    bulb2.rotation.z += 0.003;
    model.position.y = 1 + Math.sin(elapsed * 2) * 0.5;
    bulb2.position.y = 1 + Math.sin(elapsed * 2) * 0.5;
    // Smooth scale pulse between 0.45 and 0.55
    const scaleFactor = 1 + Math.sin(elapsed * 2) * 0.5;
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);
    bulb2.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
  }

  // Render the scene
  renderer2.render(scene2, camera2);
}
settingscene2();
