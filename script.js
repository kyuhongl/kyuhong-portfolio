document.addEventListener('DOMContentLoaded', () => {
    const FORWARD_SRC = 'img/background.mp4';
    const REVERSE_SRC = 'img/background-reversed.mp4';
    const FORWARD = 'forward';
    const REVERSE = 'reverse';
    const HANDOFF_EPSILON = 1 / 120;

    const forwardVideo = document.getElementById('bg-video-forward');
    const reverseVideo = document.getElementById('bg-video-reverse');

    if (!forwardVideo || !reverseVideo) return;

    const videos = {
        [FORWARD]: forwardVideo,
        [REVERSE]: reverseVideo
    };

    let activeDirection = FORWARD;
    let started = false;
    let isSwitching = false;
    let monitorRafId = null;

    function setupVideo(video, src) {
        video.src = src;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.loop = false;
        video.load();
    }

    function whenReady(video) {
        return new Promise((resolve) => {
            if (video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0) {
                resolve();
                return;
            }
            video.addEventListener('loadedmetadata', resolve, { once: true });
        });
    }

    function setActiveVisual(activeVideo, inactiveVideo) {
        activeVideo.classList.add('is-active');
        inactiveVideo.classList.remove('is-active');
    }

    function swapDirection() {
        if (isSwitching) return;
        isSwitching = true;

        const nextDirection = activeDirection === FORWARD ? REVERSE : FORWARD;
        const currentVideo = videos[activeDirection];
        const nextVideo = videos[nextDirection];

        nextVideo.pause();
        nextVideo.currentTime = 0;
        nextVideo.play().then(() => {
            setActiveVisual(nextVideo, currentVideo);
            currentVideo.pause();
            activeDirection = nextDirection;
            isSwitching = false;
        }).catch(() => {
            isSwitching = false;
        });
    }

    function monitorBoundary() {
        if (!started) {
            monitorRafId = requestAnimationFrame(monitorBoundary);
            return;
        }

        if (!isSwitching && document.visibilityState === 'visible') {
            const activeVideo = videos[activeDirection];
            const duration = activeVideo.duration;
            if (Number.isFinite(duration) && duration > 0) {
                const remaining = duration - activeVideo.currentTime;
                if (remaining <= HANDOFF_EPSILON) {
                    swapDirection();
                }
            }
        }

        monitorRafId = requestAnimationFrame(monitorBoundary);
    }

    document.addEventListener('visibilitychange', () => {
        if (!started) return;

        const activeVideo = videos[activeDirection];
        if (document.visibilityState === 'visible') {
            activeVideo.play().catch(() => {});
        } else {
            activeVideo.pause();
        }
    });

    setupVideo(forwardVideo, FORWARD_SRC);
    setupVideo(reverseVideo, REVERSE_SRC);

    Promise.all([whenReady(forwardVideo), whenReady(reverseVideo)]).then(() => {
        const startTime = forwardVideo.duration / 2;
        forwardVideo.currentTime = startTime;
        reverseVideo.currentTime = 0;
        setActiveVisual(forwardVideo, reverseVideo);
        started = true;
        forwardVideo.play().catch(() => {});
    });

    monitorRafId = requestAnimationFrame(monitorBoundary);
});

/* ─── CV Panel: Center-Scaled Sidebar with Hover L-Line ─── */
(function () {
    const NS = 'http://www.w3.org/2000/svg';
    const MIN_SCALE = 0.6;
    const MAX_SCALE = 1.0;
    const MIN_OPACITY = 0.4;
    const MAX_OPACITY = 1.0;
    const MAX_BLUR = 0.0;
    const BLUR_DEAD_ZONE = 40;
    const FALLOFF_PX = 200;
    const ANIM_DURATION_S = 2 / 1.5;
    const CIRCLE_PAUSE_S = 0.35;
    const CIRCLE_CYCLE_S = ANIM_DURATION_S + CIRCLE_PAUSE_S;
    const DETAIL_BORDER_COLOR = 'rgba(0, 0, 0, 0.1)';
    const LINE_INTO_CARD_PX = 8;

    const cvList = document.getElementById('cv-list');
    const svgEl = document.getElementById('cv-hover-svg');
    const detailsRoot = document.getElementById('cv-details');
    if (!cvList || !svgEl || !detailsRoot) return;

    const items = cvList.querySelectorAll('.cv-item');
    const details = detailsRoot.querySelectorAll('.cv-detail');

    let pathEl = null;
    let circleEl = null;
    let hoveredItem = null;
    let rafId = null;
    let cursorX = 0;
    let cursorY = 0;
    let circleAnimId = null;
    let circleStartTime = 0;

    function lerp(a, b, t) {
        return a + (b - a) * Math.max(0, Math.min(1, t));
    }

    function updateScales() {
        const listRect = cvList.getBoundingClientRect();
        const centerY = listRect.top + listRect.height / 2;

        items.forEach((item) => {
            const rect = item.getBoundingClientRect();
            const itemCenterY = rect.top + rect.height / 2;
            const dist = Math.abs(itemCenterY - centerY);
            const t = Math.min(dist / FALLOFF_PX, 1);

            const scale = lerp(MAX_SCALE, MIN_SCALE, t);
            const opacity = lerp(MAX_OPACITY, MIN_OPACITY, t);
            const blurT = Math.max(0, (dist - BLUR_DEAD_ZONE) / (FALLOFF_PX - BLUR_DEAD_ZONE));
            const blur = lerp(0, MAX_BLUR, Math.min(blurT, 1));

            if (scale > 0.99) {
                item.style.transform = 'none';
                item.style.willChange = 'auto';
            } else {
                item.style.transform = `scale(${scale})`;
                item.style.willChange = 'transform, opacity, filter';
            }
            item.style.opacity = opacity;
            item.style.filter = blur < 0.05 ? 'none' : `blur(${blur.toFixed(1)}px)`;
        });
    }

    function showDetail(key) {
        details.forEach((d) => {
            d.classList.toggle('is-active', d.getAttribute('data-for') === key);
        });
    }

    function hideDetail() {
        details.forEach((d) => d.classList.remove('is-active'));
    }

    function ensureSVGElements() {
        if (pathEl) return;

        pathEl = document.createElementNS(NS, 'path');
        pathEl.setAttribute('fill', 'none');
        pathEl.setAttribute('stroke', DETAIL_BORDER_COLOR);
        pathEl.setAttribute('stroke-width', '1');

        circleEl = document.createElementNS(NS, 'circle');
        circleEl.setAttribute('r', '5');
        circleEl.setAttribute('fill', DETAIL_BORDER_COLOR);

        svgEl.appendChild(pathEl);
        svgEl.appendChild(circleEl);

        circleStartTime = performance.now();
        startCircleAnimation();
    }

    function destroySVGElements() {
        if (circleAnimId) { cancelAnimationFrame(circleAnimId); circleAnimId = null; }
        if (pathEl) { pathEl.remove(); pathEl = null; }
        if (circleEl) { circleEl.remove(); circleEl = null; }
    }

    function getPointOnLLine(t, startX, startY, turnY, endX) {
        const seg1Len = Math.abs(turnY - startY);
        const seg2Len = Math.abs(endX - startX);
        const totalLen = seg1Len + seg2Len;
        if (totalLen === 0) return [startX, startY];

        const dist = t * totalLen;
        if (dist <= seg1Len) {
            if (seg1Len === 0) return [startX, turnY];
            const u = dist / seg1Len;
            return [startX, startY + u * (turnY - startY)];
        }
        if (seg2Len === 0) return [endX, turnY];
        const u = (dist - seg1Len) / seg2Len;
        return [startX + u * (endX - startX), turnY];
    }

    function startCircleAnimation() {
        function tick(now) {
            if (!circleEl || !pathEl) return;

            const elapsed = (now - circleStartTime) / 1000;
            const phase = elapsed % CIRCLE_CYCLE_S;
            const traveling = phase < ANIM_DURATION_S;
            const t = traveling ? phase / ANIM_DURATION_S : 0;

            const d = pathEl.getAttribute('d');
            if (d) {
                const nums = d.match(/-?[\d.]+/g);
                if (nums && nums.length >= 6) {
                    const startX = +nums[0], startY = +nums[1];
                    const turnY = +nums[3];
                    const endX = +nums[4];
                    const [cx, cy] = getPointOnLLine(t, startX, startY, turnY, endX);
                    circleEl.setAttribute('cx', cx);
                    circleEl.setAttribute('cy', cy);
                }
            }

            circleEl.setAttribute('opacity', traveling ? '1' : '0');

            circleAnimId = requestAnimationFrame(tick);
        }
        circleAnimId = requestAnimationFrame(tick);
    }

    function updateLLine() {
        if (!hoveredItem) return;

        const panelRect = svgEl.closest('.cv-panel').getBoundingClientRect();
        const detailsRect = detailsRoot.getBoundingClientRect();
        const activeDetail = detailsRoot.querySelector('.cv-detail.is-active');

        const localX = cursorX - panelRect.left;
        const localY = cursorY - panelRect.top;

        let lineY = localY - 40;

        if (activeDetail) {
            const topInDetails = panelRect.top + lineY - detailsRect.top;
            activeDetail.style.top = `${topInDetails}px`;
        }

        let endX = detailsRect.right - panelRect.left;
        if (activeDetail) {
            const cardRect = activeDetail.getBoundingClientRect();
            endX = cardRect.right - panelRect.left - LINE_INTO_CARD_PX;
            const yTop = cardRect.top - panelRect.top;
            const yBot = cardRect.bottom - panelRect.top;
            lineY = Math.min(Math.max(lineY, yTop), yBot);
        }

        const d = `M${localX},${localY} L${localX},${lineY} L${endX},${lineY}`;

        pathEl.setAttribute('d', d);

        if (activeDetail) {
            const topInDetails = panelRect.top + lineY - detailsRect.top;
            activeDetail.style.top = `${topInDetails}px`;
        }
    }

    function onItemMouseMove(e) {
        cursorX = e.clientX;
        cursorY = e.clientY;
        if (!rafId) {
            rafId = requestAnimationFrame(() => {
                updateLLine();
                rafId = null;
            });
        }
    }

    function onItemMouseEnter(e) {
        const item = e.currentTarget;
        hoveredItem = item;
        cursorX = e.clientX;
        cursorY = e.clientY;

        const key = item.getAttribute('data-detail');
        showDetail(key);
        ensureSVGElements();
        updateLLine();
        requestAnimationFrame(() => {
            requestAnimationFrame(() => scheduleDetailGlassRebuild());
        });
    }

    function onItemMouseLeave() {
        clearDetailGlass();
        hoveredItem = null;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        destroySVGElements();
        hideDetail();
    }

    items.forEach((item) => {
        item.addEventListener('mouseenter', onItemMouseEnter);
        item.addEventListener('mousemove', onItemMouseMove);
        item.addEventListener('mouseleave', onItemMouseLeave);
    });

    cvList.addEventListener('scroll', updateScales, { passive: true });
    updateScales();

    /* ─── CV detail panel: subtle liquid glass (SVG displacement + backdrop-filter) ─── */
    const GLASS_SURFACES = {
        convex_squircle: (x) => Math.pow(1 - Math.pow(1 - x, 4), 0.25),
    };

    function glassRefractionProfile(glassThickness, bezelWidth, heightFn, ior, samples) {
        const eta = 1 / ior;
        function refract(nx, ny) {
            const dot = ny;
            const k = 1 - eta * eta * (1 - dot * dot);
            if (k < 0) return null;
            const sq = Math.sqrt(k);
            return [-(eta * dot + sq) * nx, eta - (eta * dot + sq) * ny];
        }
        const profile = new Float64Array(samples);
        for (let i = 0; i < samples; i++) {
            const x = i / samples;
            const y = heightFn(x);
            const dx = x < 1 ? 0.0001 : -0.0001;
            const y2 = heightFn(x + dx);
            const deriv = (y2 - y) / dx;
            const mag = Math.sqrt(deriv * deriv + 1);
            const ref = refract(-deriv / mag, -1 / mag);
            if (!ref) { profile[i] = 0; continue; }
            profile[i] = ref[0] * ((y * bezelWidth + glassThickness) / ref[1]);
        }
        return profile;
    }

    function glassDisplacementMap(w, h, radius, bezelWidth, profile, maxDisp) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        const img = ctx.createImageData(w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
            d[i] = 128;
            d[i + 1] = 128;
            d[i + 2] = 0;
            d[i + 3] = 255;
        }
        const r = radius;
        const rSq = r * r;
        const r1Sq = (r + 1) ** 2;
        const rBSq = Math.max(r - bezelWidth, 0) ** 2;
        const wB = w - r * 2;
        const hB = h - r * 2;
        const S = profile.length;
        for (let y1 = 0; y1 < h; y1++) {
            for (let x1 = 0; x1 < w; x1++) {
                const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0;
                const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0;
                const dSq = x * x + y * y;
                if (dSq > r1Sq || dSq < rBSq) continue;
                const dist = Math.sqrt(dSq);
                const fromSide = r - dist;
                const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
                if (op <= 0 || dist === 0) continue;
                const cos = x / dist;
                const sin = y / dist;
                const bi = Math.min(((fromSide / bezelWidth) * S) | 0, S - 1);
                const disp = profile[bi] || 0;
                const dX = (-cos * disp) / maxDisp;
                const dY = (-sin * disp) / maxDisp;
                const idx = (y1 * w + x1) * 4;
                d[idx] = (128 + dX * 127 * op + 0.5) | 0;
                d[idx + 1] = (128 + dY * 127 * op + 0.5) | 0;
            }
        }
        ctx.putImageData(img, 0, 0);
        return c.toDataURL();
    }

    function glassSpecularMap(w, h, radius, bezelWidth, angle) {
        angle = angle != null ? angle : Math.PI / 3;
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        const img = ctx.createImageData(w, h);
        const d = img.data;
        d.fill(0);
        const r = radius;
        const rSq = r * r;
        const r1Sq = (r + 1) ** 2;
        const rBSq = Math.max(r - bezelWidth, 0) ** 2;
        const wB = w - r * 2;
        const hB = h - r * 2;
        const sv = [Math.cos(angle), Math.sin(angle)];
        for (let y1 = 0; y1 < h; y1++) {
            for (let x1 = 0; x1 < w; x1++) {
                const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0;
                const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0;
                const dSq = x * x + y * y;
                if (dSq > r1Sq || dSq < rBSq) continue;
                const dist = Math.sqrt(dSq);
                const fromSide = r - dist;
                const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
                if (op <= 0 || dist === 0) continue;
                const cos = x / dist;
                const sin = -y / dist;
                const dot = Math.abs(cos * sv[0] + sin * sv[1]);
                const edge = Math.sqrt(Math.max(0, 1 - (1 - fromSide) ** 2));
                const coeff = dot * edge;
                const col = (255 * coeff) | 0;
                const alpha = (col * coeff * op) | 0;
                const idx = (y1 * w + x1) * 4;
                d[idx] = col;
                d[idx + 1] = col;
                d[idx + 2] = col;
                d[idx + 3] = alpha;
            }
        }
        ctx.putImageData(img, 0, 0);
        return c.toDataURL();
    }

    let detailGlassTimer = null;
    let detailGlassRo = null;

    function clearDetailGlass() {
        const defs = document.getElementById('cv-glass-defs');
        if (defs) defs.innerHTML = '';
        if (detailGlassRo) {
            detailGlassRo.disconnect();
            detailGlassRo = null;
        }
    }

    function buildDetailGlass() {
        const defs = document.getElementById('cv-glass-defs');
        const active = detailsRoot.querySelector('.cv-detail.is-active');
        if (!defs || !active) return;

        const w = Math.round(active.offsetWidth);
        const h = Math.round(active.offsetHeight);
        if (w < 2 || h < 2) return;

        const radius = 10;
        const glassThick = 5;
        const bezelW = Math.min(20, radius - 1, Math.min(w, h) / 2 - 1);
        const ior = 2.35;
        const scaleRatio = 0.56;
        const blurAmt = 0.48;
        const specOpacity = 0.2;
        const specSat = 2.2;
        const samples = 72;

        const heightFn = GLASS_SURFACES.convex_squircle;
        const profile = glassRefractionProfile(glassThick, bezelW, heightFn, ior, samples);
        const maxDisp = Math.max(...Array.from(profile).map(Math.abs)) || 1;
        const dispUrl = glassDisplacementMap(w, h, radius, bezelW, profile, maxDisp);
        const specUrl = glassSpecularMap(w, h, radius, bezelW * 2.2);
        const scale = maxDisp * scaleRatio;

        defs.innerHTML = `
            <filter id="cv-detail-glass-filter" x="0%" y="0%" width="100%" height="100%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="${blurAmt}" result="blurred_source" />
                <feImage href="${dispUrl}" x="0" y="0" width="${w}" height="${h}" result="disp_map" />
                <feDisplacementMap in="blurred_source" in2="disp_map"
                    scale="${scale}" xChannelSelector="R" yChannelSelector="G"
                    result="displaced" />
                <feColorMatrix in="displaced" type="saturate" values="${specSat}" result="displaced_sat" />
                <feImage href="${specUrl}" x="0" y="0" width="${w}" height="${h}" result="spec_layer" />
                <feComposite in="displaced_sat" in2="spec_layer" operator="in" result="spec_masked" />
                <feComponentTransfer in="spec_layer" result="spec_faded">
                    <feFuncA type="linear" slope="${specOpacity}" />
                </feComponentTransfer>
                <feBlend in="spec_masked" in2="displaced" mode="normal" result="with_sat" />
                <feBlend in="spec_faded" in2="with_sat" mode="normal" />
            </filter>
        `;
    }

    function scheduleDetailGlassRebuild() {
        clearTimeout(detailGlassTimer);
        detailGlassTimer = setTimeout(() => {
            requestAnimationFrame(() => {
                buildDetailGlass();
                const active = detailsRoot.querySelector('.cv-detail.is-active');
                if (active) {
                    if (detailGlassRo) detailGlassRo.disconnect();
                    detailGlassRo = new ResizeObserver(() => scheduleDetailGlassRebuild());
                    detailGlassRo.observe(active);
                }
            });
        }, 40);
    }

    let glassWinTimer;
    window.addEventListener('resize', () => {
        clearTimeout(glassWinTimer);
        glassWinTimer = setTimeout(() => {
            if (detailsRoot.querySelector('.cv-detail.is-active')) scheduleDetailGlassRebuild();
        }, 120);
    });
})();
