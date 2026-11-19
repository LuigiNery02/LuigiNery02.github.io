const SETTINGS = {
    areaPerParticle: 12000,
    maxParticles: 200,
    minSize: 0.8,
    maxSize: 2.4,
    minAlpha: 0.2,
    maxAlpha: 0.65,
    drift: 0.15,
    repelRadius: 130,
    repelForce: 5,
    spring: 0.015,
    friction: 0.9
};

const canvas = document.createElement("canvas");
canvas.className = "background-particles";
canvas.setAttribute("aria-hidden", "true");
document.body.prepend(canvas);

const context = canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let width = 0;
let height = 0;
let particles = [];
let animationId = null;
const pointer = { x: null, y: null };

function random(min, max) {
    return min + Math.random() * (max - min);
}

function createParticle() {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const angle = Math.random() * Math.PI * 2;
    const speed = random(0.3, 1) * SETTINGS.drift;

    return {
        baseX: x,
        baseY: y,
        x,
        y,
        vx: 0,
        vy: 0,
        driftX: Math.cos(angle) * speed,
        driftY: Math.sin(angle) * speed,
        size: random(SETTINGS.minSize, SETTINGS.maxSize),
        alpha: random(SETTINGS.minAlpha, SETTINGS.maxAlpha)
    };
}

function resize() {
    const previousWidth = width;
    const previousHeight = height;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    if (previousWidth > 0 && previousHeight > 0) {
        const scaleX = width / previousWidth;
        const scaleY = height / previousHeight;

        particles.forEach(particle => {
            particle.baseX *= scaleX;
            particle.baseY *= scaleY;
            particle.x *= scaleX;
            particle.y *= scaleY;
        });
    }

    const targetCount = Math.min(
        SETTINGS.maxParticles,
        Math.round((width * height) / SETTINGS.areaPerParticle)
    );

    while (particles.length < targetCount) {
        particles.push(createParticle());
    }

    particles.length = targetCount;

    if (reducedMotion.matches) {
        draw();
    }
}

function wrap(particle) {
    const margin = 10;
    let shiftX = 0;
    let shiftY = 0;

    if (particle.baseX < -margin) {
        shiftX = width + margin * 2;
    } else if (particle.baseX > width + margin) {
        shiftX = -(width + margin * 2);
    }

    if (particle.baseY < -margin) {
        shiftY = height + margin * 2;
    } else if (particle.baseY > height + margin) {
        shiftY = -(height + margin * 2);
    }

    particle.baseX += shiftX;
    particle.x += shiftX;
    particle.baseY += shiftY;
    particle.y += shiftY;
}

function update() {
    const radius = SETTINGS.repelRadius;

    particles.forEach(particle => {
        particle.baseX += particle.driftX;
        particle.baseY += particle.driftY;
        wrap(particle);

        particle.vx += (particle.baseX - particle.x) * SETTINGS.spring;
        particle.vy += (particle.baseY - particle.y) * SETTINGS.spring;

        if (pointer.x !== null) {
            const dx = particle.x - pointer.x;
            const dy = particle.y - pointer.y;
            const distance = Math.hypot(dx, dy);

            if (distance > 0 && distance < radius) {
                const force = (1 - distance / radius) * SETTINGS.repelForce;
                particle.vx += (dx / distance) * force;
                particle.vy += (dy / distance) * force;
            }
        }

        particle.vx *= SETTINGS.friction;
        particle.vy *= SETTINGS.friction;
        particle.x += particle.vx;
        particle.y += particle.vy;
    });
}

function draw() {
    context.clearRect(0, 0, width, height);

    particles.forEach(particle => {
        context.globalAlpha = particle.alpha;
        context.fillStyle = "#ffffff";
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
    });

    context.globalAlpha = 1;
}

function frame() {
    update();
    draw();
    animationId = requestAnimationFrame(frame);
}

function start() {
    if (animationId === null && !reducedMotion.matches) {
        animationId = requestAnimationFrame(frame);
    }
}

function stop() {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

window.addEventListener("resize", resize);

window.addEventListener("pointermove", event => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
});

document.addEventListener("pointerleave", () => {
    pointer.x = null;
    pointer.y = null;
});

window.addEventListener("blur", () => {
    pointer.x = null;
    pointer.y = null;
});

reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
        stop();
        draw();
    } else {
        start();
    }
});

resize();
start();
