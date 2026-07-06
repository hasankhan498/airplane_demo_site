gsap.registerPlugin(ScrollTrigger);

    /* ---------------- Navbar ---------------- */
    const nav = document.getElementById('navbar');
    ScrollTrigger.create({ start: 60, onUpdate: self => nav.classList.toggle('scrolled', self.scroll() > 60) });

    /* ---------------- Route path progress ---------------- */
    const routeProgress = document.getElementById('route-progress');
    const routePlane = document.getElementById('route-plane');
    const pathEl = document.getElementById('route-line');
    const pathLen = pathEl.getTotalLength();
    routeProgress.style.strokeDasharray = pathLen;
    routeProgress.style.strokeDashoffset = pathLen;

    gsap.to({}, {
      scrollTrigger: {
        trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.4,
        onUpdate: self => {
          const p = self.progress;
          routeProgress.style.strokeDashoffset = pathLen * (1 - p);
          const pt = pathEl.getPointAtLength(pathLen * p);
          const pt2 = pathEl.getPointAtLength(Math.min(pathLen, pathLen * p + 1));
          const angle = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI + 90;
          routePlane.setAttribute('transform', `translate(${pt.x},${pt.y}) rotate(${angle})`);
        }
      }
    });

    /* ---------------- Hero text reveal on load ---------------- */
    gsap.set('[data-line]', { yPercent: 120 });
    gsap.timeline({ delay: 0.3 })
      .to('[data-line]', { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.12 })
      .to('.hero-sub, .hero-actions, .eyebrow', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 }, '-=0.6')
      .to('.booking-card', { opacity: 1, y: '-50%', duration: 1, ease: 'power3.out' }, '-=0.7');

    gsap.set('.hero-sub, .hero-actions, #hero .eyebrow', { opacity: 0, y: 24 });
    gsap.set('.booking-card', { opacity: 0 });




    /* ---------------- Generic scroll reveals ---------------- */
    document.querySelectorAll('.reveal, [data-reveal]').forEach(el => {
      if (el.closest('.hero')) return; // hero handled by its own timeline
      gsap.fromTo(el, { opacity: 0, y: 60 }, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    /* stagger dest cards / fleet cards / cabin cards */
    [['.dest-grid', '.dest-card'], ['.fleet-grid', '.fleet-card'], ['.cabin-grid', '.cabin-card']].forEach(([wrap, item]) => {
      const w = document.querySelector(wrap);
      if (!w) return;
      gsap.fromTo(w.querySelectorAll(item), { opacity: 0, y: 70, scale: 0.96 }, {
        opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: w, start: 'top 82%' }
      });
    });

    /* section headers parallax-in */
    document.querySelectorAll('.section-head h2').forEach(h => {
      gsap.fromTo(h, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: h, start: 'top 90%' }
      });
    });

    /* ---------------- Counters ---------------- */
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = +el.dataset.count;
      ScrollTrigger.create({
        trigger: el, start: 'top 85%', once: true,
        onEnter: () => gsap.to(el, { innerText: target, duration: 2, ease: 'power2.out', snap: { innerText: 1 } })
      });
    });

    /* ---------------- Card tilt (destinations + fleet) ---------------- */
    function attachTilt(selector, strength = 10) {
      document.querySelectorAll(selector).forEach(card => {
        card.addEventListener('mousemove', e => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(card, { rotateY: x * strength, rotateX: -y * strength, duration: 0.5, ease: 'power2.out', transformPerspective: 900 });
        });
        card.addEventListener('mouseleave', () => gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' }));
      });
    }
    attachTilt('.dest-card', 8);
    attachTilt('.fleet-card', 6);
    attachTilt('.testi-card', 5);

    /* ---------------- FAQ accordion ---------------- */
    document.querySelectorAll('.faq-item').forEach(item => {
      const a = item.querySelector('.faq-a');
      item.querySelector('.faq-q').addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(o => { o.classList.remove('open'); o.querySelector('.faq-a').style.maxHeight = null; });
        if (!isOpen) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
      });
    });

    /* ================= THREE.js HERO SCENE ================= */
    (function heroScene() {
      const canvas = document.getElementById('hero-canvas');
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 0, 22);

      function resize() {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      window.addEventListener('resize', resize);
      resize();

      // lights
      scene.add(new THREE.AmbientLight(0x5fd4ff, 0.5));
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(6, 8, 10); scene.add(key);
      const rim = new THREE.PointLight(0x5fd4ff, 2, 60);
      rim.position.set(-10, -4, -6); scene.add(rim);

      // starfield / particles
      const starGeo = new THREE.BufferGeometry();
      const starCount = 900;
      const starPos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        starPos[i * 3] = (Math.random() - 0.5) * 90;
        starPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
        starPos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const starMat = new THREE.PointsMaterial({ color: 0x9fe3ff, size: 0.14, transparent: true, opacity: 0.8 });
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);

      // simple low-poly plane group made of primitives
      const plane = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf4f7fb, metalness: 0.7, roughness: 0.25, envMapIntensity: 1 });
      const accentMat = new THREE.MeshStandardMaterial({ color: 0x5fd4ff, metalness: 0.6, roughness: 0.3, emissive: 0x1a4a66, emissiveIntensity: 0.4 });

      const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 6.2, 20), bodyMat);
      fuselage.rotation.z = Math.PI / 2;
      plane.add(fuselage);

      const noseCap = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 14), bodyMat);
      noseCap.position.x = 3.1;
      plane.add(noseCap);

      const tailCap = new THREE.Mesh(new THREE.SphereGeometry(0.52, 20, 14), bodyMat);
      tailCap.position.x = -3.1;
      plane.add(tailCap);

      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.3, 20), bodyMat);
      nose.rotation.z = -Math.PI / 2;
      nose.position.x = 4.0;
      plane.add(nose);

      const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.8), new THREE.MeshStandardMaterial({ color: 0x8fe3ff, metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.85 }));
      cockpit.rotation.x = Math.PI;
      cockpit.position.set(3.3, 0.22, 0);
      plane.add(cockpit);

      const wingGeo = new THREE.BoxGeometry(2.2, 0.08, 7.6);
      const wing = new THREE.Mesh(wingGeo, accentMat);
      wing.position.set(-0.2, -0.15, 0);
      wing.rotation.y = 0.05;
      plane.add(wing);

      const tailWingGeo = new THREE.BoxGeometry(1.1, 0.06, 2.6);
      const tailWing = new THREE.Mesh(tailWingGeo, accentMat);
      tailWing.position.set(-2.9, 0.1, 0);
      plane.add(tailWing);

      const finGeo = new THREE.BoxGeometry(1.3, 1.6, 0.08);
      const fin = new THREE.Mesh(finGeo, accentMat);
      fin.position.set(-2.9, 0.9, 0);
      plane.add(fin);

      // soft radial glow texture (used for bloom-like sprites: engines, rays, clouds)
      function makeGlowTexture(hex) {
        const c = document.createElement('canvas'); c.width = c.height = 128;
        const ctx = c.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, hex + 'ff');
        grad.addColorStop(0.4, hex + '66');
        grad.addColorStop(1, hex + '00');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
      }
      const cyanGlowTex = makeGlowTexture('#5fd4ff');
      const whiteGlowTex = makeGlowTexture('#ffffff');

      // engines with bloom-sprite glow
      const engineGlows = [];
      [-2.2, 2.2].forEach(z => {
        const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 16), new THREE.MeshStandardMaterial({ color: 0x0d2a52, metalness: 0.8, roughness: 0.2 }));
        eng.rotation.z = Math.PI / 2;
        eng.position.set(-0.3, -0.7, z);
        plane.add(eng);
        const glow = new THREE.PointLight(0x5fd4ff, 1.2, 4);
        glow.position.set(-1.0, -0.7, z);
        plane.add(glow);
        const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: cyanGlowTex, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
        glowSprite.scale.set(1.6, 1.6, 1.6);
        glowSprite.position.set(-1.05, -0.7, z);
        plane.add(glowSprite);
        engineGlows.push(glowSprite);
      });

      // wide volumetric light ray behind/above the plane
      const rayMat = new THREE.SpriteMaterial({ map: whiteGlowTex, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
      const lightRay = new THREE.Sprite(rayMat);
      lightRay.scale.set(40, 26, 1);
      lightRay.position.set(-6, 10, -20);
      scene.add(lightRay);

      // drifting cloud particle field the plane appears to fly through
      const cloudCount = 46;
      const cloudMat = new THREE.SpriteMaterial({ map: whiteGlowTex, transparent: true, opacity: 0.22, depthWrite: false });
      const clouds = [];
      for (let i = 0; i < cloudCount; i++) {
        const s = new THREE.Sprite(cloudMat.clone());
        const scale = 4 + Math.random() * 7;
        s.scale.set(scale, scale * 0.55, 1);
        s.position.set((Math.random() - 0.3) * 60, -8 + Math.random() * 14, -20 + Math.random() * 30);
        s.material.opacity = 0.08 + Math.random() * 0.18;
        scene.add(s);
        clouds.push(s);
      }

      const planeRig = new THREE.Group();
      planeRig.position.set(2, 1, 0);
      planeRig.rotation.set(0.05, -0.5, 0.08);
      planeRig.scale.setScalar(1.15);
      planeRig.add(plane);
      scene.add(planeRig);

      // subtle contrail particles trailing plane
      const trailCount = 200;
      const trailGeo = new THREE.BufferGeometry();
      const trailPos = new Float32Array(trailCount * 3);
      for (let i = 0; i < trailCount; i++) {
        trailPos[i * 3] = planeRig.position.x - Math.random() * 10 - 3;
        trailPos[i * 3 + 1] = planeRig.position.y + (Math.random() - 0.5) * 0.6;
        trailPos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
      }
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
      const trailMat = new THREE.PointsMaterial({ color: 0xdfeff8, size: 0.12, transparent: true, opacity: 0.35 });
      const trail = new THREE.Points(trailGeo, trailMat);
      scene.add(trail);

      // mouse parallax
      let mx = 0, my = 0, tmx = 0, tmy = 0;
      window.addEventListener('mousemove', e => {
        tmx = (e.clientX / window.innerWidth - 0.5);
        tmy = (e.clientY / window.innerHeight - 0.5);
      });

      // scroll-driven camera / rig motion through hero (the overall flight path)
      gsap.to(planeRig.rotation, {
        y: -0.05, x: -0.15, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
      gsap.to(planeRig.position, {
        x: 6, y: 3.5, z: -6, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
      gsap.to(camera.position, {
        z: 16, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });

      // ---- organic random wander: the plane meanders on its own within the rig ----
      let wanderTarget = new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2.4);
      let nextWanderChange = 2;
      const prevLocalPos = new THREE.Vector3();

      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        mx += (tmx - mx) * 0.03; my += (tmy - my) * 0.03;

        // pick a new random destination point every few seconds for unscripted, wandering flight
        if (t > nextWanderChange) {
          wanderTarget.set(
            (Math.random() - 0.5) * 3.6,
            (Math.random() - 0.5) * 2.4,
            (Math.random() - 0.5) * 2.8
          );
          nextWanderChange = t + 2.2 + Math.random() * 3.2;
        }
        prevLocalPos.copy(plane.position);
        plane.position.lerp(wanderTarget, 0.012);
        plane.position.y += Math.sin(t * 0.6) * 0.0025;

        // bank and pitch naturally in the direction it's turning
        const vel = plane.position.clone().sub(prevLocalPos);
        const bankTarget = 0.08 + Math.sin(t * 0.5) * 0.03 - my * 0.2 - vel.z * 26;
        const pitchTarget = 0.05 + my * 0.15 + vel.y * 14;
        plane.rotation.z += (bankTarget - plane.rotation.z) * 0.06;
        plane.rotation.x += (pitchTarget - plane.rotation.x) * 0.06;
        const yawTarget = -vel.x * 9;
        plane.rotation.y += (yawTarget - plane.rotation.y) * 0.05;

        camera.position.x = mx * 1.5;
        camera.position.y = -my * 1.0;
        camera.lookAt(planeRig.position);
        stars.rotation.y = t * 0.005;

        // drifting clouds — loop past the camera for a continuous "flying through" feel
        clouds.forEach((c, i) => {
          c.position.x += 0.045 + (i % 5) * 0.01;
          c.position.y += Math.sin(t * 0.2 + i) * 0.002;
          if (c.position.x > 34) c.position.x = -34;
        });

        // pulsing engine glow
        const pulse = 1.3 + Math.sin(t * 4) * 0.25;
        engineGlows.forEach(g => g.scale.set(pulse, pulse, pulse));

        // flickering light ray
        lightRay.material.opacity = 0.12 + Math.sin(t * 0.6) * 0.05;

        renderer.render(scene, camera);
      }
      animate();
    })();

    /* ================= THREE.js MINI FLEET AIRCRAFT ================= */
    (function fleetPlanes() {
      document.querySelectorAll('.mini-plane').forEach(canvas => {
        const card = canvas.closest('.fleet-card');
        const accent = parseInt(canvas.dataset.accent, 16) || 0x5fd4ff;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
        camera.position.set(0, 0.6, 7);

        scene.add(new THREE.AmbientLight(0x9fe3ff, 0.6));
        const key = new THREE.DirectionalLight(0xffffff, 1.4);
        key.position.set(4, 5, 6); scene.add(key);
        const rim = new THREE.PointLight(accent, 1.6, 12);
        rim.position.set(-4, -2, -3); scene.add(rim);

        const body = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf4f7fb, metalness: 0.75, roughness: 0.2 });
        const accentMat = new THREE.MeshStandardMaterial({ color: accent, metalness: 0.6, roughness: 0.25, emissive: accent, emissiveIntensity: 0.25 });

        const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3.4, 18), bodyMat);
        fuselage.rotation.z = Math.PI / 2; body.add(fuselage);
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 12), bodyMat);
        nose.position.x = 1.7; body.add(nose);
        const tailCap = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 12), bodyMat);
        tailCap.position.x = -1.7; body.add(tailCap);
        const wing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 4.2), accentMat);
        wing.position.set(-0.1, -0.1, 0); body.add(wing);
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.06), accentMat);
        fin.position.set(-1.55, 0.55, 0); body.add(fin);
        const tailWing = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 1.5), accentMat);
        tailWing.position.set(-1.55, 0.05, 0); body.add(tailWing);
        [-1.2, 1.2].forEach(z => {
          const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.8, 14), new THREE.MeshStandardMaterial({ color: 0x0d2a52, metalness: 0.8, roughness: 0.2 }));
          eng.rotation.z = Math.PI / 2; eng.position.set(-0.15, -0.42, z); body.add(eng);
        });
        body.rotation.set(0.1, -0.6, 0.1);
        scene.add(body);

        function size() {
          const w = canvas.clientWidth || card.clientWidth, h = canvas.clientHeight || 150;
          renderer.setSize(w, h, false);
          camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix();
        }
        let tx = 0, ty = 0;
        card.addEventListener('mousemove', e => {
          const r = card.getBoundingClientRect();
          tx = ((e.clientX - r.left) / r.width - 0.5) * 0.8;
          ty = ((e.clientY - r.top) / r.height - 0.5) * 0.5;
        });
        card.addEventListener('mouseleave', () => { tx = 0; ty = 0; });

        let visible = false;
        new IntersectionObserver(entries => visible = entries[0].isIntersecting, { threshold: 0.05 }).observe(canvas);

        const clock = new THREE.Clock();
        function animate() {
          requestAnimationFrame(animate);
          if (!visible) return;
          size();
          const t = clock.getElapsedTime();
          body.rotation.y = -0.6 + t * 0.25 + tx;
          body.rotation.x = 0.1 + Math.sin(t * 0.6) * 0.03 - ty;
          body.position.y = Math.sin(t * 0.8) * 0.08;
          renderer.render(scene, camera);
        }
        animate();
        window.addEventListener('resize', size);
      });
    })();

    /* ================= THREE.js GLOBE ================= */
    (function globeScene() {
      const wrap = document.getElementById('globe-canvas-wrap');
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      wrap.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 8);

      function resize() {
        const w = wrap.clientWidth, h = wrap.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
      }

      scene.add(new THREE.AmbientLight(0x5fd4ff, 0.6));
      const gLight = new THREE.DirectionalLight(0xffffff, 1.2);
      gLight.position.set(5, 4, 6); scene.add(gLight);

      // wireframe globe
      const globeGeo = new THREE.SphereGeometry(2.4, 28, 22);
      const globeMat = new THREE.MeshBasicMaterial({ color: 0x2f6ea8, wireframe: true, transparent: true, opacity: 0.35 });
      const globe = new THREE.Mesh(globeGeo, globeMat);
      scene.add(globe);

      // solid inner sphere for depth
      const innerMat = new THREE.MeshStandardMaterial({ color: 0x0a2144, roughness: 0.9, metalness: 0.1 });
      const inner = new THREE.Mesh(new THREE.SphereGeometry(2.36, 28, 22), innerMat);
      scene.add(inner);

      // atmosphere glow
      const atmoMat = new THREE.MeshBasicMaterial({ color: 0x5fd4ff, transparent: true, opacity: 0.08, side: THREE.BackSide });
      const atmo = new THREE.Mesh(new THREE.SphereGeometry(2.7, 28, 22), atmoMat);
      scene.add(atmo);

      // city pins
      const pinPositions = [];
      function latLonToVec3(lat, lon, r) {
        const phi = (90 - lat) * Math.PI / 180, theta = (lon + 180) * Math.PI / 180;
        return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
      }
      const cities = [[31.5, 74.3], [47.4, 8.5], [35.7, 139.7], [25.2, 55.3], [51.5, -0.1], [40.7, -74.0], [-33.9, 151.2], [31.6, -8.0]];
      const pinMat = new THREE.MeshBasicMaterial({ color: 0x5fd4ff });
      cities.forEach(([lat, lon]) => {
        const pos = latLonToVec3(lat, lon, 2.42);
        const pin = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), pinMat);
        pin.position.copy(pos);
        globe.add(pin);
        pinPositions.push(pos);
      });

      // arcs between a few city pairs
      function makeArc(p1, p2) {
        const mid = p1.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(3.1);
        const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
        const points = curve.getPoints(40);
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: 0xd9b26a, transparent: true, opacity: 0.55 });
        return new THREE.Line(geo, mat);
      }
      for (let i = 0; i < pinPositions.length - 1; i++) {
        globe.add(makeArc(pinPositions[i], pinPositions[i + 1]));
      }
      globe.add(makeArc(pinPositions[0], pinPositions[3]));

      const clock2 = new THREE.Clock();
      let visible = false;
      const io = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: 0.1 });
      io.observe(wrap);

      function animate() {
        requestAnimationFrame(animate);
        if (!visible) return;
        resize();
        const t = clock2.getElapsedTime();
        globe.rotation.y = t * 0.12;
        inner.rotation.y = t * 0.12;
        atmo.rotation.y = t * 0.06;
        renderer.render(scene, camera);
      }
      animate();
      window.addEventListener('resize', resize);
    })();