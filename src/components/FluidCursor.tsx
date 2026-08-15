'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * FluidCursor Component
 * High-performance WebGL Fluid Simulation that reacts to mouse/touch.
 */
const FluidCursor: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        // --- Config ---
        const config = {
            TEXTURE_DOWNSAMPLE: 1,
            DENSITY_DISSIPATION: 0.98,
            VELOCITY_DISSIPATION: 0.99,
            PRESSURE_DISSIPATION: 0.8,
            PRESSURE_ITERATIONS: 25,
            CURL: 28,
            SPLAT_RADIUS: 0.004,
        };

        let pointers: any[] = [];
        let splatStack: any[] = [];

        // --- WebGL Context Initialization ---
        const params = { alpha: false, depth: false, stencil: false, antialias: false };
        let gl = canvas.getContext('webgl2', params) as WebGL2RenderingContext;
        const isWebGL2 = !!gl;
        if (!isWebGL2) {
            gl = (canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params)) as any;
        }

        if (!gl) {
            console.error('WebGL not supported');
            return;
        }

        let halfFloat: any;
        let supportLinearFiltering: any;
        if (isWebGL2) {
            gl.getExtension('EXT_color_buffer_float');
            supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
        } else {
            halfFloat = gl.getExtension('OES_texture_half_float');
            supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
        let formatRGBA: any;
        let formatRG: any;
        let formatR: any;

        const supportRenderTextureFormat = (gl: any, internalFormat: any, format: any, type: any) => {
            let texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

            let fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

            const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            return status === gl.FRAMEBUFFER_COMPLETE;
        };

        const getSupportedFormat = (gl: any, internalFormat: any, format: any, type: any): any => {
            if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
                switch (internalFormat) {
                    case gl.R16F:
                        return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
                    case gl.RG16F:
                        return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
                    default:
                        return null;
                }
            }
            return { internalFormat, format };
        };

        if (isWebGL2) {
            formatRGBA = getSupportedFormat(gl, (gl as any).RGBA16F, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, (gl as any).RG16F, (gl as any).RG, halfFloatTexType);
            formatR = getSupportedFormat(gl, (gl as any).R16F, (gl as any).RED, halfFloatTexType);
        } else {
            formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        }

        const ext = {
            formatRGBA,
            formatRG,
            formatR,
            halfFloatTexType,
            supportLinearFiltering
        };

        // --- Pointers ---
        const brandColors = [
            [0.51, 0.36, 0.69], // Brand Purple (#835BAF)
            [0.87, 0.32, 0.49], // Brand Pink (#DE517D)
            [0.38, 0.65, 0.98], // Brand Blue (#60A5FA)
        ];

        function PointerPrototype(this: any) {
            this.id = -1;
            this.x = 0;
            this.y = 0;
            this.dx = 0;
            this.dy = 0;
            this.down = false;
            this.moved = false;
            this.color = brandColors[Math.floor(Math.random() * brandColors.length)].map(c => c * 0.8);
        }

        pointers.push(new (PointerPrototype as any)());

        // --- Shaders ---
        class GLProgram {
            program: WebGLProgram;
            uniforms: { [key: string]: WebGLUniformLocation | null };

            constructor(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
                this.uniforms = {};
                this.program = gl.createProgram()!;
                gl.attachShader(this.program, vertexShader);
                gl.attachShader(this.program, fragmentShader);
                gl.linkProgram(this.program);

                if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
                    throw gl.getProgramInfoLog(this.program);

                const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
                for (let i = 0; i < uniformCount; i++) {
                    const uniformName = gl.getActiveUniform(this.program, i)!.name;
                    this.uniforms[uniformName] = gl.getUniformLocation(this.program, uniformName);
                }
            }
            bind() {
                gl.useProgram(this.program);
            }
        }

        function compileShader(type: number, source: string) {
            const shader = gl.createShader(type)!;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
                throw gl.getShaderInfoLog(shader);
            return shader;
        }

        const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
            precision highp float;
            attribute vec2 aPosition;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform vec2 texelSize;
            void main () {
                vUv = aPosition * 0.5 + 0.5;
                vL = vUv - vec2(texelSize.x, 0.0);
                vR = vUv + vec2(texelSize.x, 0.0);
                vT = vUv + vec2(0.0, texelSize.y);
                vB = vUv - vec2(0.0, texelSize.y);
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        `);

        const clearShader = compileShader(gl.FRAGMENT_SHADER, `
            precision highp float;
            varying vec2 vUv;
            uniform sampler2D uTexture;
            uniform float value;
            void main () {
                gl_FragColor = value * texture2D(uTexture, vUv);
            }
        `);

        const displayShader = compileShader(gl.FRAGMENT_SHADER, `
            precision highp float;
            varying vec2 vUv;
            uniform sampler2D uTexture;
            void main () {
                gl_FragColor = texture2D(uTexture, vUv);
            }
        `);

        const splatShader = compileShader(gl.FRAGMENT_SHADER, `
            precision highp float;
            varying vec2 vUv;
            uniform sampler2D uTarget;
            uniform float aspectRatio;
            uniform vec3 color;
            uniform vec2 point;
            uniform float radius;
            void main () {
                vec2 p = vUv - point.xy;
                p.x *= aspectRatio;
                vec3 splat = exp(-dot(p, p) / radius) * color;
                vec3 base = texture2D(uTarget, vUv).xyz;
                gl_FragColor = vec4(base + splat, 1.0);
            }
        `);

        const advectionManualFilteringShader = compileShader(gl.FRAGMENT_SHADER, `
            precision highp float;
            varying vec2 vUv;
            uniform sampler2D uVelocity;
            uniform sampler2D uSource;
            uniform vec2 texelSize;
            uniform float dt;
            uniform float dissipation;
            vec4 bilerp (in sampler2D sam, in vec2 p) {
                vec4 st;
                st.xy = floor(p - 0.5) + 0.5;
                st.zw = st.xy + 1.0;
                vec4 uv = st * texelSize.xyxy;
                vec4 a = texture2D(sam, uv.xy);
                vec4 b = texture2D(sam, uv.zy);
                vec4 c = texture2D(sam, uv.xw);
                vec4 d = texture2D(sam, uv.zw);
                vec2 f = p - st.xy;
                return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }
            void main () {
                vec2 coord = gl_FragCoord.xy - dt * texture2D(uVelocity, vUv).xy;
                gl_FragColor = dissipation * bilerp(uSource, coord);
                gl_FragColor.a = 1.0;
            }
        `);

        const advectionShader = compileShader(gl.FRAGMENT_SHADER, `
            precision highp float;
            varying vec2 vUv;
            uniform sampler2D uVelocity;
            uniform sampler2D uSource;
            uniform vec2 texelSize;
            uniform float dt;
            uniform float dissipation;
            void main () {
                vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
                gl_FragColor = dissipation * texture2D(uSource, coord);
                gl_FragColor.a = 1.0;
            }
        `);

        const divergenceShader = compileShader(gl.FRAGMENT_SHADER, `
            precision highp float;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;
            vec2 sampleVelocity (in vec2 uv) {
                vec2 multiplier = vec2(1.0, 1.0);
                if (uv.x < 0.0) { uv.x = 0.0; multiplier.x = -1.0; }
                if (uv.x > 1.0) { uv.x = 1.0; multiplier.x = -1.0; }
                if (uv.y < 0.0) { uv.y = 0.0; multiplier.y = -1.0; }
                if (uv.y > 1.0) { uv.y = 1.0; multiplier.y = -1.0; }
                return multiplier * texture2D(uVelocity, uv).xy;
            }
            void main () {
                float L = sampleVelocity(vL).x;
                float R = sampleVelocity(vR).x;
                float T = sampleVelocity(vT).y;
                float B = sampleVelocity(vB).y;
                float div = 0.5 * (R - L + T - B);
                gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
            }
        `);

        const curlShader = compileShader(gl.FRAGMENT_SHADER, `
            precision highp float;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;
            void main () {
                float L = texture2D(uVelocity, vL).y;
                float R = texture2D(uVelocity, vR).y;
                float T = texture2D(uVelocity, vT).x;
                float B = texture2D(uVelocity, vB).x;
                float vorticity = R - L - T + B;
                gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0);
            }
        `);

        const vorticityShader = compileShader(gl.FRAGMENT_SHADER, `
            precision highp float;
            varying vec2 vUv;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;
            uniform sampler2D uCurl;
            uniform float curl;
            uniform float dt;
            void main () {
                float T = texture2D(uCurl, vT).x;
                float B = texture2D(uCurl, vB).x;
                float C = texture2D(uCurl, vUv).x;
                vec2 force = vec2(abs(T) - abs(B), 0.0);
                force *= 1.0 / length(force + 0.00001) * curl * C;
                vec2 vel = texture2D(uVelocity, vUv).xy;
                gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
            }
        `);

        const pressureShader = compileShader(gl.FRAGMENT_SHADER, `
            precision highp float;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uPressure;
            uniform sampler2D uDivergence;
            vec2 boundary (in vec2 uv) {
                uv = min(max(uv, 0.0), 1.0);
                return uv;
            }
            void main () {
                float L = texture2D(uPressure, boundary(vL)).x;
                float R = texture2D(uPressure, boundary(vR)).x;
                float T = texture2D(uPressure, boundary(vT)).x;
                float B = texture2D(uPressure, boundary(vB)).x;
                float divergence = texture2D(uDivergence, vUv).x;
                float pressure = (L + R + B + T - divergence) * 0.25;
                gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
            }
        `);

        const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, `
            precision highp float;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uPressure;
            uniform sampler2D uVelocity;
            vec2 boundary (in vec2 uv) {
                uv = min(max(uv, 0.0), 1.0);
                return uv;
            }
            void main () {
                float L = texture2D(uPressure, boundary(vL)).x;
                float R = texture2D(uPressure, boundary(vR)).x;
                float T = texture2D(uPressure, boundary(vT)).x;
                float B = texture2D(uPressure, boundary(vB)).x;
                vec2 velocity = texture2D(uVelocity, vUv).xy;
                velocity.xy -= vec2(R - L, T - B);
                gl_FragColor = vec4(velocity, 0.0, 1.0);
            }
        `);

        // --- Framebuffer Helpers ---
        function createFBO(texId: number, w: number, h: number, internalFormat: number, format: number, type: number, param: number) {
            gl.activeTexture(gl.TEXTURE0 + texId);
            let texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

            let fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            gl.viewport(0, 0, w, h);
            gl.clear(gl.COLOR_BUFFER_BIT);

            return [texture, fbo, texId];
        }

        function createDoubleFBO(texId: number, w: number, h: number, internalFormat: number, format: number, type: number, param: number) {
            let fbo1 = createFBO(texId, w, h, internalFormat, format, type, param);
            let fbo2 = createFBO(texId + 1, w, h, internalFormat, format, type, param);

            return {
                get read() { return fbo1; },
                get write() { return fbo2; },
                swap() {
                    let temp = fbo1;
                    fbo1 = fbo2;
                    fbo2 = temp;
                }
            };
        }

        let textureWidth: number, textureHeight: number;
        let density: any, velocity: any, divergence: any, curl: any, pressure: any;

        function initFramebuffers() {
            if (!canvas) return;
            let width = window.innerWidth;
            let height = window.innerHeight;

            if (width < 64) width = 1024; // Better fallback
            if (height < 64) height = 1024;

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }

            // Ensure dimensions are always at least 4 for safe downsampling and WebGL alignment
            textureWidth = Math.max(4, width >> config.TEXTURE_DOWNSAMPLE);
            textureHeight = Math.max(4, height >> config.TEXTURE_DOWNSAMPLE);

            console.log(`FluidCursor: Resizing to ${width}x${height} (Simulation: ${textureWidth}x${textureHeight})`);

            const texType = ext.halfFloatTexType;
            const rgba = ext.formatRGBA;
            const rg = ext.formatRG;
            const r = ext.formatR;

            density = createDoubleFBO(2, textureWidth, textureHeight, rgba.internalFormat, rgba.format, texType, ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST);
            velocity = createDoubleFBO(0, textureWidth, textureHeight, rg.internalFormat, rg.format, texType, ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST);
            divergence = createFBO(4, textureWidth, textureHeight, r.internalFormat, r.format, texType, gl.NEAREST);
            curl = createFBO(5, textureWidth, textureHeight, r.internalFormat, r.format, texType, gl.NEAREST);
            pressure = createDoubleFBO(6, textureWidth, textureHeight, r.internalFormat, r.format, texType, gl.NEAREST);
        }

        initFramebuffers();

        const clearProgram = new GLProgram(baseVertexShader, clearShader);
        const displayProgram = new GLProgram(baseVertexShader, displayShader);
        const splatProgram = new GLProgram(baseVertexShader, splatShader);
        const advectionProgram = new GLProgram(baseVertexShader, ext.supportLinearFiltering ? advectionShader : advectionManualFilteringShader);
        const divergenceProgram = new GLProgram(baseVertexShader, divergenceShader);
        const curlProgram = new GLProgram(baseVertexShader, curlShader);
        const vorticityProgram = new GLProgram(baseVertexShader, vorticityShader);
        const pressureProgram = new GLProgram(baseVertexShader, pressureShader);
        const gradienSubtractProgram = new GLProgram(baseVertexShader, gradientSubtractShader);

        // --- Blit Wrapper ---
        const v_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, v_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
        const i_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, i_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);

        function blit(destination: any) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
            gl.bindBuffer(gl.ARRAY_BUFFER, v_buffer);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, i_buffer);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        }

        // --- Splatting ---
        function splat(x: number, y: number, dx: number, dy: number, color: any) {
            if (!canvas) return;
            splatProgram.bind();
            gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read[2]);
            gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
            gl.uniform2f(splatProgram.uniforms.point, x / canvas.width, 1.0 - y / canvas.height);
            gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 1.0);
            gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS);
            blit(velocity.write[1]);
            velocity.swap();

            gl.uniform1i(splatProgram.uniforms.uTarget, density.read[2]);
            gl.uniform3f(splatProgram.uniforms.color, color[0] * 0.3, color[1] * 0.3, color[2] * 0.3);
            blit(density.write[1]);
            density.swap();
        }

        function multipleSplats(amount: number) {
            if (!canvas) return;
            for (let i = 0; i < amount; i++) {
                const baseColor = brandColors[Math.floor(Math.random() * brandColors.length)];
                const color = baseColor.map(c => c * (Math.random() * 5 + 2)); // Brighter bursts for initial splats
                const x = canvas.width * Math.random();
                const y = canvas.height * Math.random();
                const dx = 1000 * (Math.random() - 0.5);
                const dy = 1000 * (Math.random() - 0.5);
                splat(x, y, dx, dy, color);
            }
        }

        // --- Update Loop ---
        let lastTime = Date.now();
        multipleSplats(Math.floor(Math.random() * 20) + 5);

        function update() {
            if (!canvas) return;
            try {
                const width = window.innerWidth;
                const height = window.innerHeight;

                if (width < 64 || height < 64) {
                    requestAnimationFrame(update);
                    return;
                }

                if (canvas.width != width || canvas.height != height) {
                    initFramebuffers();
                }

                const dt = Math.min((Date.now() - lastTime) / 1000, 0.016);
                lastTime = Date.now();

                gl.viewport(0, 0, textureWidth, textureHeight);

                if (splatStack.length > 0)
                    multipleSplats(splatStack.pop());

                advectionProgram.bind();
                gl.uniform2f(advectionProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);

                // Explicitly bind textures to their units before setting uniforms
                gl.activeTexture(gl.TEXTURE0 + velocity.read[2]);
                gl.bindTexture(gl.TEXTURE_2D, velocity.read[0]);
                gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read[2]);

                gl.uniform1i(advectionProgram.uniforms.uSource, velocity.read[2]);
                gl.uniform1f(advectionProgram.uniforms.dt, dt);
                gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
                blit(velocity.write[1]);
                velocity.swap();

                gl.activeTexture(gl.TEXTURE0 + velocity.read[2]);
                gl.bindTexture(gl.TEXTURE_2D, velocity.read[0]);
                gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read[2]);

                gl.activeTexture(gl.TEXTURE0 + density.read[2]);
                gl.bindTexture(gl.TEXTURE_2D, density.read[0]);
                gl.uniform1i(advectionProgram.uniforms.uSource, density.read[2]);

                gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
                blit(density.write[1]);
                density.swap();

                for (let i = 0; i < pointers.length; i++) {
                    const pointer = pointers[i];
                    if (pointer.moved) {
                        splat(pointer.x, pointer.y, pointer.dx, pointer.dy, pointer.color);
                        pointer.moved = false;
                    }
                }

                curlProgram.bind();
                gl.uniform2f(curlProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
                gl.activeTexture(gl.TEXTURE0 + velocity.read[2]);
                gl.bindTexture(gl.TEXTURE_2D, velocity.read[0]);
                gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read[2]);
                blit(curl[1]);

                vorticityProgram.bind();
                gl.uniform2f(vorticityProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
                gl.activeTexture(gl.TEXTURE0 + velocity.read[2]);
                gl.bindTexture(gl.TEXTURE_2D, velocity.read[0]);
                gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read[2]);
                gl.activeTexture(gl.TEXTURE0 + curl[2]);
                gl.bindTexture(gl.TEXTURE_2D, curl[0]);
                gl.uniform1i(vorticityProgram.uniforms.uCurl, curl[2]);
                gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
                gl.uniform1f(vorticityProgram.uniforms.dt, dt);
                blit(velocity.write[1]);
                velocity.swap();

                divergenceProgram.bind();
                gl.uniform2f(divergenceProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
                gl.activeTexture(gl.TEXTURE0 + velocity.read[2]);
                gl.bindTexture(gl.TEXTURE_2D, velocity.read[0]);
                gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read[2]);
                blit(divergence[1]);

                clearProgram.bind();
                let pressureTexId = pressure.read[2];
                gl.activeTexture(gl.TEXTURE0 + pressureTexId);
                gl.bindTexture(gl.TEXTURE_2D, pressure.read[0]);
                gl.uniform1i(clearProgram.uniforms.uTexture, pressureTexId);
                gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE_DISSIPATION);
                blit(pressure.write[1]);
                pressure.swap();

                pressureProgram.bind();
                gl.uniform2f(pressureProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
                gl.activeTexture(gl.TEXTURE0 + divergence[2]);
                gl.bindTexture(gl.TEXTURE_2D, divergence[0]);
                gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence[2]);

                pressureTexId = pressure.read[2];
                gl.activeTexture(gl.TEXTURE0 + pressureTexId);
                gl.bindTexture(gl.TEXTURE_2D, pressure.read[0]);
                gl.uniform1i(pressureProgram.uniforms.uPressure, pressureTexId);

                for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
                    gl.bindTexture(gl.TEXTURE_2D, pressure.read[0]);
                    blit(pressure.write[1]);
                    pressure.swap();
                }

                gradienSubtractProgram.bind();
                gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
                gl.activeTexture(gl.TEXTURE0 + pressure.read[2]);
                gl.bindTexture(gl.TEXTURE_2D, pressure.read[0]);
                gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read[2]);
                gl.activeTexture(gl.TEXTURE0 + velocity.read[2]);
                gl.bindTexture(gl.TEXTURE_2D, velocity.read[0]);
                gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read[2]);
                blit(velocity.write[1]);
                velocity.swap();

                gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                displayProgram.bind();
                gl.activeTexture(gl.TEXTURE0 + density.read[2]);
                gl.bindTexture(gl.TEXTURE_2D, density.read[0]);
                gl.uniform1i(displayProgram.uniforms.uTexture, density.read[2]);
                blit(null);
            } catch (e) {
                console.error("FluidCursor Error in Update Loop:", e);
            }

            requestAnimationFrame(update);
        }

        update();

        // --- Event Listeners ---
        const onMouseMove = (e: MouseEvent) => {
            let pointer = pointers[0];
            if (!pointer.down) {
                pointer.down = true;
                const baseColor = brandColors[Math.floor(Math.random() * brandColors.length)];
                pointer.color = baseColor.map(c => c * (Math.random() * 0.5 + 0.8));
            }
            pointer.moved = pointer.down;
            pointer.dx = (e.clientX - pointer.x) * 10.0;
            pointer.dy = (e.clientY - pointer.y) * 10.0;
            pointer.x = e.clientX;
            pointer.y = e.clientY;
        };

        const onTouchMove = (e: TouchEvent) => {
            const touches = e.targetTouches;
            for (let i = 0; i < touches.length; i++) {
                if (i >= pointers.length) pointers.push(new (PointerPrototype as any)());
                let pointer = pointers[i];
                pointer.moved = pointer.down;
                pointer.dx = (touches[i].pageX - pointer.x) * 10.0;
                pointer.dy = (touches[i].pageY - pointer.y) * 10.0;
                pointer.x = touches[i].pageX;
                pointer.y = touches[i].pageY;
            }
        };

        const onMouseDown = () => {
            pointers[0].down = true;
            pointers[0].color = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];
        };

        const onTouchStart = (e: TouchEvent) => {
            const touches = e.targetTouches;
            for (let i = 0; i < touches.length; i++) {
                if (i >= pointers.length) pointers.push(new (PointerPrototype as any)());
                pointers[i].id = touches[i].identifier;
                pointers[i].down = true;
                pointers[i].x = touches[i].pageX;
                pointers[i].y = touches[i].pageY;
                const baseColor = brandColors[Math.floor(Math.random() * brandColors.length)];
                pointers[i].color = baseColor.map(c => c * (Math.random() * 0.5 + 0.8));
            }
        };

        const onMouseUp = () => {
            pointers[0].down = false;
        };

        const onTouchEnd = (e: TouchEvent) => {
            const touches = e.changedTouches;
            for (let i = 0; i < touches.length; i++) {
                for (let j = 0; j < pointers.length; j++) {
                    if (touches[i].identifier == pointers[j].id) pointers[j].down = false;
                }
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchstart', onTouchStart);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('touchend', onTouchEnd);

        // Expose a global hook for external elements (like buttons) to trigger splats
        (window as any).triggerFluidSplat = (x: number, y: number, color?: number[]) => {
            const finalColor = color || brandColors[Math.floor(Math.random() * brandColors.length)];
            const dx = (Math.random() - 0.5) * 500;
            const dy = (Math.random() - 0.5) * 500;
            splat(x, y, dx, dy, finalColor);
        };

        return () => {
            (window as any).triggerFluidSplat = undefined;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [isMounted]);

    if (!isMounted) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-[9999] mix-blend-screen opacity-80"
            style={{ display: 'block' }}
        />
    );
};

export default FluidCursor;
