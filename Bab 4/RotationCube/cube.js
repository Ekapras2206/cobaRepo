function main() {
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.log('WebGL unavailable');
        return;
    }

    // Vertex positions
    const vertices = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
        
        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
        
        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
        
        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
        
        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
        
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];

    // Colors for each face
    const faceColors = [
        [1.0,  0.0,  0.0,  1.0],    // Front: red
        [0.0,  1.0,  0.0,  1.0],    // Back: green
        [0.0,  0.0,  1.0,  1.0],    // Top: blue
        [1.0,  1.0,  0.0,  1.0],    // Bottom: yellow
        [1.0,  0.0,  1.0,  1.0],    // Right: purple
        [0.0,  1.0,  1.0,  1.0],    // Left: cyan
    ];

    let colors = [];
    for (let j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        colors = colors.concat(c, c, c, c);
    }

    // Element indices
    const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ];

    // Vertex buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Color buffer
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Vertex shader
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        varying lowp vec4 vColor;
        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vColor = aVertexColor;
        }
    `;
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);

    // Fragment shader
    const fsSource = `
        varying lowp vec4 vColor;
        void main(void) {
            gl_FragColor = vColor;
        }
    `;
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Shader program
    const shaderProgram = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(shaderProgram);

    // Locations
    const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosition);

    const vertexColor = gl.getAttribLocation(shaderProgram, 'aVertexColor');
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(vertexColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexColor);

    const uProjectionMatrix = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
    const uModelViewMatrix = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, canvas.clientWidth / canvas.clientHeight, 0.1, 100.0);

    let modelViewMatrix = mat4.create();
    let cubeRotationY = 0.0;  // Rotasi di sumbu Y
    let cubeRotationX = 0.0;  // Rotasi di sumbu X

    let zPos = -10.0;          // Posisi awal kubus di sumbu Z
    let zSpeed = 0.01;       // Kecepatan maju-mundur di sumbu Z (dinaikkan menjadi 0.025)

    let xPos = 0.01;
    let xSpeed = 0.01;

    function render() {
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Reset modelViewMatrix
        modelViewMatrix = mat4.create();

        // Update posisi maju-mundur di sumbu Z
        zPos += zSpeed;
        if (zPos > -4.0 || zPos < -10.0) {
            zSpeed = -zSpeed;  // Balik arah jika mencapai batas
        }
            xPos += xSpeed;
        if (xPos > 3.0 || xPos < -3.0) {
        xSpeed = -xSpeed;
        }

        // Posisikan kubus di posisi Z yang dinamis
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, 0.0]);
        mat4.translate(modelViewMatrix, modelViewMatrix, [xPos, 0.0, zPos]);
        // Tambahkan rotasi di sumbu X dan Y
        mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotationX, [0, 1, 0]);  // Rotasi di sumbu X
        mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotationY, [0, 1, 0]);  // Rotasi di sumbu Y

        // Perbesar nilai rotasi di setiap frame
        cubeRotationY += 0.0025;  // Rotasi di sumbu Y ditingkatkan
        cubeRotationX += 0.0125;  // Rotasi di sumbu X ditingkatkan

        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(render);
    }

    render();
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

window.onload = main;