import "./src/mario.js";
var canvas;
var gl;

var g_keys = [];

let mario;
let ground;


let position;

let colorLocation;
let positionLocation;

let colorBuffer;
let groundBuffer;
let marioBuffer;

class Mario {
  right = true;
  jumping = false;
  constructor(x, y, velX = 0, velY = 0) {
    this.pos = vec2(x, y);
    this.velX = 0.0;
    this.velY = velY;
    this.vertices = new Float32Array([-0.05, -0.05, -0.05, 0.05, 0.05, 0.0]);
  }

  vertRight = new Float32Array([-0.05, -0.05, -0.05, 0.05, 0.05, 0.0]);
  vertLeft = new Float32Array([0.05, 0.05, 0.05, -0.05, -0.05, 0.0]);
  //color = new Float32Array([0.0, 0.0, 1.0, 1.0,
  //                          0.0, 0.0, 1.0, 1.0,
  //                          0.0, 0.0, 1.0, 1.0,
  //                        ] );
  color = vec4(0.0, 0.0, 1.0, 1.0);
  
  init() {
    // Load the data into the GPU
    
  }

  update() {
    // flip
    if (!this.right) {
      this.vertices = this.vertLeft;
    } else {
      this.vertices = this.vertRight;
    }

    // keys
    if (!this.jumping && g_keys['A'.charCodeAt()]) {
      if (this.velX > 0) this.velX *= -1;     
      this.velX = -0.01;
      this.right = false;
    }
    else if (!this.jumping && g_keys['D'.charCodeAt()]) {      
      if (this.velX < 0) this.velX *= -1;     
      this.velX = 0.01;
      this.right = true;
    } else if (!this.jumping) {
      this.velX = 0;
    }


    if (!this.jumping && (eatKey('W'.charCodeAt())||eatKey(' '.charCodeAt()))) {
       this.jumping = true;
       this.velY = 0.03;
    }

    // gravity
    if (this.jumping) this.velY -= 0.001;

    // collide
    if (this.pos[1] <  -0.9) { 
      this.jumping = false;
      this.velY = 0;
      this.pos[1] = -0.9;
    }

  
    // finally update the position
    this.pos[0] += this.velX;
    this.pos[1] += this.velY;
  }

  render() {
    gl.bindBuffer( gl.ARRAY_BUFFER, marioBuffer);   
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW );
    gl.uniform2fv( position, flatten(this.pos) );
    gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );
    gl.uniform4fv( colorLocation, flatten(this.color) );
    gl.drawArrays( gl.TRIANGLES, 0, 3);

  }
}

class Box  {
  constructor(x, y) {
    this.pos = vec2(x, y)
    this.vertices = new Float32Array([-1.0, -0.05, 
                                      -1.0, 0.05, 
                                      1.0, 0.05,
                                      1.0, 0.05,
                                      -1.0, -0.05, 
                                      1.0, -0.05,
                                    ]);
  }
  color = vec4(0.0, 0.8, 0.0, 1.0);
  render() {
    gl.bindBuffer( gl.ARRAY_BUFFER, groundBuffer);   
    gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );
    gl.uniform2fv( position, flatten(this.pos) );
    gl.uniform4fv( colorLocation, flatten(this.color) );
    gl.drawArrays( gl.TRIANGLES, 0, 6);
  }
}

class Ground  {
  constructor() {
    this.pos = vec2(0.0, -1.0)
    this.vertices = new Float32Array([-1.0, -0.05, 
                                      -1.0, 0.05, 
                                      1.0, 0.05,
                                      1.0, 0.05,
                                      -1.0, -0.05, 
                                      1.0, -0.05,
                                    ]);
  }
  color = vec4(0.0, 0.8, 0.0, 1.0);
  render() {
    gl.bindBuffer( gl.ARRAY_BUFFER, groundBuffer);   
    gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );
    gl.uniform2fv( position, flatten(this.pos) );
    gl.uniform4fv( colorLocation, flatten(this.color) );
    gl.drawArrays( gl.TRIANGLES, 0, 6);
  }
}

// keypress has effect only once
function eatKey(key) {
  if(g_keys[key]) {
    g_keys[key] = false;
    return true;
  } else {
    return false;
  }
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 1.0, 1.0, 1.0 );

    ground = new Ground();
    mario = new Mario(0, -0.9, 0.0, 0.0);
    
    
    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // uniform
    position = gl.getUniformLocation( program, "pos" );
    colorLocation = gl.getUniformLocation( program, "vColor" );

    //attributes:
    positionLocation = gl.getAttribLocation( program, "vPosition" );

    // buffers:
    marioBuffer = gl.createBuffer();
    groundBuffer = gl.createBuffer();
    //colorBuffer = gl.createBuffer();

    gl.bindBuffer( gl.ARRAY_BUFFER, marioBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(mario.vertices), gl.DYNAMIC_DRAW );

    gl.enableVertexAttribArray( positionLocation );
    gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );

    gl.bindBuffer( gl.ARRAY_BUFFER, groundBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(ground.vertices), gl.DYNAMIC_DRAW );
    
//
    //gl.enableVertexAttribArray( positionLocation );
    //gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );

    //gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(mario.color), gl.STATIC_DRAW );
//
    // gl.enableVertexAttribArray( colorLocation );
    // gl.vertexAttribPointer( colorLocation, 4, gl.FLOAT, false, 0, 0 );

    // Meðhöndlun lykla
    window.addEventListener("keydown", function(e){
        g_keys[e.keyCode] = true;
    });

    window.addEventListener("keyup", function(e){
        g_keys[e.keyCode] = false;
    });

    updateSimulation();
}


function updateSimulation() {
    
    update();
    render();
    
    window.requestAnimFrame(updateSimulation);
}

function update() {
  
  mario.update();

}

function render() {
  gl.clear( gl.COLOR_BUFFER_BIT );  
  ground.render();
  mario.render();
}