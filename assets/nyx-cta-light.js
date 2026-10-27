/*!
MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Adapted from NyxID SpecularButton; see vendor/react-bits/PROVENANCE.md.
*/
(() => {
    "use strict";
    const PAD = 24;
    const TAU = Math.PI * 2;
    const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;
    const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uRadius;
uniform float uPx;
uniform float uSpot;
uniform vec2 uEntry;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform vec2 uWindow;
uniform float uThickness;
uniform float uGlow;
out vec4 outColor;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float loopPosition(vec2 p, vec2 b, float r) {
  vec2 inner = b - r;
  float arc = 1.5707963 * r;
  float quarter = inner.x + inner.y + arc;
  vec2 a = abs(p);
  vec2 q = a - inner;
  float s = q.x > 0.0 && q.y > 0.0
    ? inner.y + atan(q.y, q.x) * r
    : (q.x > q.y ? min(a.y, inner.y) : inner.y + arc + inner.x - min(a.x, inner.x));
  if (p.x < 0.0) s = p.y >= 0.0 ? 2.0 * quarter - s : 2.0 * quarter + s;
  else if (p.y < 0.0) s = 4.0 * quarter - s;
  return s / max(4.0 * quarter, 0.0001);
}

float lobe(float position, float center) {
  float gap = abs(fract(position - center + 0.5) - 0.5);
  return 1.0 - smoothstep(uWindow.x, uWindow.x + uWindow.y, gap);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = roundedBox(p, uHalf, uRadius);
  float position = loopPosition(p, uHalf, uRadius);
  float key = lobe(position, uSpot);
  float back = lobe(position, uSpot + 0.5);
  float streak = key + back * 0.45;
  float width = max(uThickness * uPx * mix(1.0, max(key, back), 0.6), 0.35);
  float band = smoothstep(-width - 0.6, -width + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));
  float hair = smoothstep(-uPx - 0.6, -uPx + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));
  float inside = 1.0 - smoothstep(-0.6, 0.6, d);
  vec2 pool = (p - uEntry) / (uHalf.y * vec2(1.6, 1.1));
  float glow = streak * 0.2 * exp(-abs(d + width * 0.5) / (5.0 * uPx)) + inside * 0.08 * exp(-dot(pool, pool));
  float light = clamp((band * streak + glow * uGlow) * uIntensity, 0.0, 1.0);
  vec4 base = vec4(uBaseColor, 1.0) * hair * 0.6;
  outColor = vec4(uLineColor, 1.0) * light + base * (1.0 - light);
}`;
    const UNIFORMS = [
        "uCenter",
        "uHalf",
        "uRadius",
        "uPx",
        "uSpot",
        "uEntry",
        "uLineColor",
        "uBaseColor",
        "uIntensity",
        "uWindow",
        "uThickness",
        "uGlow",
    ];
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const wrap = (value) => value - Math.floor(value);
    const loopPosition = (x, y, halfX, halfY, r) => {
        const innerX = halfX - r;
        const innerY = halfY - r;
        const arc = (Math.PI / 2) * r;
        const quarter = innerX + innerY + arc;
        const ax = Math.abs(x);
        const ay = Math.abs(y);
        const qx = ax - innerX;
        const qy = ay - innerY;
        let s;
        if (qx > 0 && qy > 0)
            s = innerY + Math.atan2(qy, qx) * r;
        else if (qx > qy)
            s = Math.min(ay, innerY);
        else
            s = innerY + arc + innerX - Math.min(ax, innerX);
        if (x < 0)
            s = y >= 0 ? 2 * quarter - s : 2 * quarter + s;
        else if (y < 0)
            s = 4 * quarter - s;
        return wrap(s / Math.max(4 * quarter, 0.0001));
    };
    const rimPoint = (position, halfX, halfY, r) => {
        const innerX = halfX - r;
        const innerY = halfY - r;
        const arc = (Math.PI / 2) * r;
        const quarter = innerX + innerY + arc;
        let s = wrap(position) * 4 * quarter;
        let signX = 1;
        let signY = 1;
        if (s > 3 * quarter) {
            s = 4 * quarter - s;
            signY = -1;
        }
        else if (s > 2 * quarter) {
            s -= 2 * quarter;
            signX = -1;
            signY = -1;
        }
        else if (s > quarter) {
            s = 2 * quarter - s;
            signX = -1;
        }
        let x = innerX - (s - innerY - arc);
        let y = halfY;
        if (s <= innerY) {
            x = halfX;
            y = s;
        }
        else if (s <= innerY + arc) {
            const angle = (s - innerY) / Math.max(r, 0.0001);
            x = innerX + Math.cos(angle) * r;
            y = innerY + Math.sin(angle) * r;
        }
        return [x * signX, y * signY];
    };
    const compile = (gl, type, source) => {
        const shader = gl.createShader(type);
        if (!shader)
            return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            return shader;
        console.warn("[chrono-cta-light] Specular compile failed:", {
            log: gl.getShaderInfoLog?.(shader),
            contextLost: gl.isContextLost?.(),
        });
        gl.deleteShader(shader);
        return null;
    };
    const link = (gl) => {
        const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
        const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
        const program = gl.createProgram();
        if (!vertex || !fragment || !program) {
            if (vertex)
                gl.deleteShader(vertex);
            if (fragment)
                gl.deleteShader(fragment);
            if (program)
                gl.deleteProgram(program);
            return null;
        }
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.bindAttribLocation(program, 0, "aPosition");
        gl.linkProgram(program);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        if (gl.getProgramParameter(program, gl.LINK_STATUS))
            return program;
        console.warn("[chrono-cta-light] Specular link failed:", gl.getProgramInfoLog?.(program));
        gl.deleteProgram(program);
        return null;
    };
    function createRenderer(button, anchor) {
        const mount = button;
        const style = getComputedStyle(button);
        const settings = {
            radius: parseFloat(style.borderTopLeftRadius) || 7,
            lineColor: style.getPropertyValue('--nyx-cta-line').trim(),
            baseColor: style.getPropertyValue('--nyx-cta-edge').trim(),
            intensity: 1.2, idleIntensity: 0.45,
            shineSize: 10, shineFade: 34, thickness: 1.2, glow: 0.6,
            speed: 0.35, followMouse: true, proximity: 90,
            autoAnimate: false, disabled: false,
        };
        // Each active lifecycle owns its canvas and GPU resources.
        const canvas = document.createElement("canvas");
        canvas.className = "nyx-cta-light";
        canvas.setAttribute("aria-hidden", "true");
        mount.appendChild(canvas);
        const removeCanvas = () => canvas.remove();
        let gl;
        try {
            gl = canvas?.getContext("webgl2", {
                alpha: true,
                premultipliedAlpha: true,
                antialias: false,
                depth: false,
                stencil: false,
            });
        }
        catch {
            canvas.dataset.renderState = "fallback";
            console.warn("[chrono-cta-light] WebGL unavailable; native CTA retained.");
            removeCanvas();
            return null;
        }
        if (!gl) {
            canvas.dataset.renderState = "fallback";
            removeCanvas();
            return null;
        }
        const context = gl;
        const program = link(context);
        if (!program) {
            canvas.dataset.renderState = "fallback";
            console.warn("[chrono-cta-light] Specular shader unavailable; native CTA retained.");
            context.getExtension("WEBGL_lose_context")?.loseContext();
            removeCanvas();
            return null;
        }
        canvas.dataset.renderState = "ready";
        const uniforms = Object.fromEntries(UNIFORMS.map((name) => [name, context.getUniformLocation(program, name)]));
        const buffer = context.createBuffer();
        const vao = context.createVertexArray();
        if (!buffer || !vao) {
            canvas.dataset.renderState = "fallback";
            if (buffer)
                context.deleteBuffer(buffer);
            if (vao)
                context.deleteVertexArray(vao);
            context.deleteProgram(program);
            context.getExtension("WEBGL_lose_context")?.loseContext();
            console.warn("[chrono-cta-light] WebGL allocation failed; native CTA retained.");
            removeCanvas();
            return null;
        }
        context.bindVertexArray(vao);
        context.bindBuffer(context.ARRAY_BUFFER, buffer);
        context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), context.STATIC_DRAW);
        context.enableVertexAttribArray(0);
        context.vertexAttribPointer(0, 2, context.FLOAT, false, 0, 0);
        context.bindVertexArray(null);
        const probe = document
            .createElement("canvas")
            .getContext("2d", { willReadFrequently: true });
        const reduce = false; // Outer activity gate owns reduced-motion teardown.
        const colors = new Map();
        const view = { width: 1, height: 1, ratio: 1 };
        const pointer = { x: 0, y: 0, known: false };
        const state = { spot: 0, level: 0, press: 0, ready: false };
        let drawCount = 0;
        let raf = 0;
        let last = 0;
        let visible = true;
        let alive = true;
        const toRgb = (value) => {
            const cached = colors.get(value);
            if (cached)
                return cached;
            let rgb = [1, 1, 1];
            if (probe) {
                probe.clearRect(0, 0, 1, 1);
                probe.fillStyle = "#000000";
                probe.fillStyle = value;
                probe.fillRect(0, 0, 1, 1);
                const [r = 255, g = 255, b = 255] = probe.getImageData(0, 0, 1, 1).data;
                rgb = [r / 255, g / 255, b / 255];
            }
            colors.set(value, rgb);
            return rgb;
        };
        const cornerRadius = (s) => Math.min(s.radius, view.width / 2, view.height / 2);
        const restSpot = (s) => {
            const r = cornerRadius(s);
            const inset = r * (1 - Math.SQRT1_2);
            return loopPosition(inset - view.width / 2, view.height / 2 - inset, view.width / 2, view.height / 2, r);
        };
        const aim = (s) => {
            if (!s.followMouse || s.disabled || !pointer.known)
                return null;
            const rect = button.getBoundingClientRect();
            const scale = rect.width / view.width || 1;
            const halfX = view.width / 2;
            const halfY = view.height / 2;
            const x = (pointer.x - rect.left - rect.width / 2) / scale;
            const y = (rect.top + rect.height / 2 - pointer.y) / scale;
            const distance = Math.hypot(Math.max(Math.abs(x) - halfX, 0), Math.max(Math.abs(y) - halfY, 0));
            const t = clamp(1 - distance / s.proximity, 0, 1);
            const near = t * t * (3 - 2 * t);
            const nearest = loopPosition(x, y, halfX, halfY, cornerRadius(s));
            if (distance > 0)
                return { spot: nearest, near };
            const depth = clamp(Math.min(halfX - Math.abs(x), halfY - Math.abs(y)) / (halfY * 0.8), 0, 1);
            const sway = restSpot(s) - (x / halfX) * 0.06 - (y / halfY) * 0.02;
            const offset = sway - nearest - Math.round(sway - nearest);
            return {
                spot: wrap(nearest + offset * depth * depth * (3 - 2 * depth)),
                near,
            };
        };
        const draw = (s) => {
            const { width, height } = view;
            const scaleX = canvas.width / (width + PAD * 2);
            const scaleY = canvas.height / (height + PAD * 2);
            context.viewport(0, 0, canvas.width, canvas.height);
            context.clearColor(0, 0, 0, 0);
            context.clear(context.COLOR_BUFFER_BIT);
            context.useProgram(program);
            context.uniform2f(uniforms.uCenter, (PAD + width / 2) * scaleX, (PAD + height / 2) * scaleY);
            context.uniform2f(uniforms.uHalf, (width / 2) * scaleX, (height / 2) * scaleY);
            context.uniform1f(uniforms.uRadius, Math.min(s.radius, width / 2, height / 2) * scaleX);
            context.uniform1f(uniforms.uPx, view.ratio);
            const r = Math.min(s.radius, width / 2, height / 2);
            const [rimX, rimY] = rimPoint(state.spot, width / 2, height / 2, r);
            const pull = 1 -
                Math.min(0.35 * (height / 2), Math.hypot(rimX, rimY)) /
                    Math.max(Math.hypot(rimX, rimY), 0.0001);
            context.uniform1f(uniforms.uSpot, state.spot);
            context.uniform2f(uniforms.uEntry, rimX * pull * scaleX, rimY * pull * scaleY);
            context.uniform3fv(uniforms.uLineColor, toRgb(s.lineColor));
            context.uniform3fv(uniforms.uBaseColor, toRgb(s.baseColor));
            context.uniform1f(uniforms.uIntensity, s.intensity * (state.level + state.press * 0.8));
            context.uniform2f(uniforms.uWindow, s.shineSize / 360 + state.press * 0.06, s.shineFade / 360 + 0.0001);
            context.uniform1f(uniforms.uThickness, s.thickness);
            context.uniform1f(uniforms.uGlow, s.glow);
            context.bindVertexArray(vao);
            context.drawArrays(context.TRIANGLES, 0, 3);
            // Read-only diagnostics reflect the same values sent to the shader.
            canvas.dataset.drawCount = String(++drawCount);
            canvas.dataset.lightLevel = state.level.toFixed(3);
            canvas.dataset.lightPosition = state.spot.toFixed(3);
            context.bindVertexArray(null);
        };
        const frame = (now) => {
            raf = 0;
            if (!visible || !alive)
                return;
            const s = settings;
            const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
            last = now;
            const target = aim(s);
            const spinning = s.autoAnimate && !reduce;
            const steering = !!target && target.near > 0;
            if (!state.ready) {
                state.spot = restSpot(s);
                state.level = s.autoAnimate ? 1 : s.idleIntensity;
                state.ready = true;
            }
            let diff = 0;
            if (spinning && !steering)
                state.spot = wrap(state.spot + (s.speed / TAU) * dt);
            else {
                diff = (steering ? target.spot : restSpot(s)) - state.spot;
                diff -= Math.round(diff);
                state.spot = wrap(state.spot + diff * (1 - Math.exp(-dt * 8)));
            }
            const level = s.autoAnimate
                ? 1
                : s.idleIntensity + (1 - s.idleIntensity) * Math.max(target ? target.near : 0, anchor.matches(":focus-visible") ? 1 : 0);
            state.level += (level - state.level) * (1 - Math.exp(-dt * 7));
            state.press *= Math.exp(-dt * 5);
            draw(s);
            const settling = Math.abs(diff) > 0.0002 ||
                Math.abs(level - state.level) > 0.001 ||
                state.press > 0.002;
            if (settling || (spinning && !steering))
                raf = requestAnimationFrame(frame);
            else
                last = 0;
        };
        const wake = () => {
            if (!raf && visible && alive)
                raf = requestAnimationFrame(frame);
        };
        const measure = (entry) => {
            const box = entry?.borderBoxSize?.[0];
            view.width = Math.max(1, box ? box.inlineSize : button.offsetWidth);
            view.height = Math.max(1, box ? box.blockSize : button.offsetHeight);
            view.ratio = Math.min(window.devicePixelRatio || 1, 3);
            canvas.width = Math.max(1, Math.round((view.width + PAD * 2) * view.ratio));
            canvas.height = Math.max(1, Math.round((view.height + PAD * 2) * view.ratio));
            if (state.ready)
                draw(settings);
            wake();
        };
        const onPointerMove = (event) => {
            pointer.x = event.clientX;
            pointer.y = event.clientY;
            pointer.known = true;
            wake();
        };
        const onPointerDown = (event) => {
            pointer.x = event.clientX;
            pointer.y = event.clientY;
            pointer.known = true;
            if (!settings.disabled)
                state.press = 1;
            wake();
        };
        const onPointerEnd = (event) => {
            if (event.pointerType === "mouse")
                return;
            pointer.known = false;
            wake();
        };
        const onPointerLeave = () => {
            pointer.known = false;
            wake();
        };
        const onContextLost = () => {
            canvas.dataset.renderState = "lost";
            button.dataset.lightState = "lost";
            alive = false;
            cancelAnimationFrame(raf);
            canvas.style.visibility = "hidden";
            console.warn("[chrono-cta-light] WebGL context lost; native CTA retained.");
        };
        canvas.addEventListener("webglcontextlost", onContextLost);
        const resizeObserver = new ResizeObserver((entries) => measure(entries[entries.length - 1]));
        resizeObserver.observe(button);
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("pointerup", onPointerEnd, { passive: true });
        window.addEventListener("pointercancel", onPointerEnd, { passive: true });
        document.documentElement.addEventListener("pointerleave", onPointerLeave);
        button.addEventListener("pointerdown", onPointerDown);
        anchor.addEventListener("focus", wake);
        anchor.addEventListener("blur", wake);
        measure();
        return () => {
            alive = false;
            canvas.removeEventListener("webglcontextlost", onContextLost);
            cancelAnimationFrame(raf);
            resizeObserver.disconnect();
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerEnd);
            window.removeEventListener("pointercancel", onPointerEnd);
            document.documentElement.removeEventListener("pointerleave", onPointerLeave);
            button.removeEventListener("pointerdown", onPointerDown);
            anchor.removeEventListener("focus", wake);
            anchor.removeEventListener("blur", wake);
            context.deleteBuffer(buffer);
            context.deleteVertexArray(vao);
            context.deleteProgram(program);
            context.getExtension("WEBGL_lose_context")?.loseContext();
            removeCanvas();
        };
    }
    // Decoration only: the existing card remains the sole interactive element.
    function attachLight(button) {
        if (!(button instanceof HTMLElement))
            return;
        const anchor = button.closest('a');
        if (!anchor || !window.ResizeObserver || !window.IntersectionObserver)
            return;
        const controller = new AbortController();
        const { signal } = controller;
        const reduced = matchMedia('(prefers-reduced-motion: reduce)');
        let inView = false, suspended = false, failed = false, dispose = null;
        const stop = () => {
            if (dispose)
                dispose();
            dispose = null;
        };
        const reconcile = () => {
            if (failed)
                return;
            const active = inView && !suspended && !document.hidden && !reduced.matches;
            if (!active) {
                stop();
                button.dataset.lightState = reduced.matches ? 'reduced-motion' : 'inactive';
            }
            else if (!dispose) {
                try {
                    dispose = createRenderer(button, anchor);
                    button.dataset.lightState = dispose ? 'active' : 'fallback';
                    if (!dispose)
                        failed = true;
                }
                catch (error) {
                    stop();
                    button.querySelectorAll('.nyx-cta-light').forEach(canvas => {
                        const gl = canvas.getContext('webgl2');
                        gl?.getExtension('WEBGL_lose_context')?.loseContext();
                        canvas.remove();
                    });
                    failed = true;
                    button.dataset.lightState = 'fallback';
                    console.warn('[chrono-cta-light] Decoration unavailable; native link retained.', error);
                }
            }
        };
        const observer = new IntersectionObserver(entries => {
            inView = entries.some(entry => entry.isIntersecting);
            reconcile();
        }, { threshold: 0.01 });
        observer.observe(button);
        reduced.addEventListener('change', reconcile, { signal });
        document.addEventListener('visibilitychange', reconcile, { signal });
        window.addEventListener('pagehide', event => {
            suspended = true;
            stop();
            if (!event.persisted) {
                observer.disconnect();
                controller.abort();
            }
        }, { signal });
        window.addEventListener('pageshow', () => {
            suspended = false;
            reconcile();
        }, { signal });
    }
    attachLight(document.querySelector('.stack .bx-nyx .bxgo'));
})();
