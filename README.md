**UP Suryoday - Illuminate Your Path
**
An interactive web experience showcasing the importance of light and introducing the "UP Suryoday" initiative, which focuses on the maintenance and repair of solar street lights in Uttar Pradesh, India. This project combines immersive 3D graphics with smooth animations to create an engaging user journey.
Preview - https://ashermustafa7.github.io/Suryodaya-Website/
🌟 Features
Interactive 3D Street Lamp: A dynamically rendered 3D street lamp in the hero section that responds to user interaction (hover and click) with realistic flickering effects.

Immersive Intro Section: A unique horizontal scrolling experience within the "Intro" section, featuring a rotating 3D light cube (thelightcube.glb) synchronized with scroll.

Dynamic Lighting & Effects: Utilizes Three.js for 3D rendering, including spotlights, ambient light, and fog, creating a moody and atmospheric environment.

Smooth Animations: Powered by GSAP (GreenSock Animation Platform) for fluid transitions, scroll-triggered animations for content sections, and camera movements.

Custom Flicker Sound: Generates an electrical flicker sound using the Web Audio API, enhancing the immersive experience.

Responsive Design: Adapts the layout and 3D canvas to provide an optimal viewing experience across various devices (desktop, tablet, mobile).

Clear Navigation: A sticky navigation bar for easy access to different sections of the website.

Informative Sections: Dedicated sections for "Intro," "About Us," and "Contact Us" providing details about the "UP Suryoday" app and the project's vision.

🛠️ Technologies Used
HTML5: For the basic structure and content of the web page.

CSS3: For styling, layout, and responsive design, utilizing CSS custom properties for maintainability.

JavaScript (ES6+): For all interactive functionalities and logic.

Three.js (r136): A JavaScript 3D library used for rendering and animating the 3D street lamp and the light cube model.

GLTFLoader: For loading 3D models in GLTF/GLB format.

EffectComposer, RenderPass, UnrealBloomPass: For post-processing effects, specifically bloom, to enhance the light glow.

GSAP (GreenSock Animation Platform): A robust JavaScript animation library for creating high-performance, smooth animations.

ScrollTrigger: A GSAP plugin for creating scroll-based animations.

SplitText: A GSAP plugin (though not explicitly used in the provided code, it's imported).

Web Audio API: For programmatic generation of sound effects.

🚀 Getting Started
To run this project locally, follow these steps:

Clone the repository:

git clone [your-repo-url]
cd up-suryoday

Open index.html:
Simply open the index.html file in your web browser. No local server is strictly required for basic functionality, but for development, using a simple local server (e.g., Live Server VS Code extension, python -m http.server) is recommended, especially if you encounter issues with GLB loading due to CORS policies.

💡 Usage
Navigation: Use the navigation links in the header to jump to different sections.

Hero Section:

Hover over the navigation links or the "Light the Way" button to see the street lamp flicker.

Click the "Light the Way" button to scroll to the Intro section and trigger a flicker.

Click on the 3D street lamp itself to zoom in and out, revealing a special message.

Intro Section: Scroll through this section to see the content slide horizontally and the 3D light cube rotate and pulse.

📁 Project Structure
.
├── index.html
├── style.css
├── script.js
└── assets/
    ├── flicker.mp3
    ├── flicker.ogg
    ├── street-lamp.png
    ├── complaint.png
    ├── service-center.png
    ├── location.png
    └── thelightcube.glb

🤝 Credits
Three.js: For the powerful 3D rendering capabilities.

GSAP: For the flexible and high-performance animation engine.

thelightcube.glb: (If this is a custom model, you might want to credit the creator here. If it's a placeholder, mention that.)

📄 License
This project is open-source and available under the MIT License.
