var canvas;
var gl;

var g_keys = [];

let mario;
let position;

let colorLocation;
let positionLocation;

let cBuffer;
let vBuffer;

class Mario {
  right = true;
  jumping = false;
  constructor(x, y, velX, velY) {
    this.pos = vec2(x, y);
    this.velX = 0.00;
    this.velY = velY;
    this.vertices = new Float32Array([-0.05, -0.05, -0.05, 0.05, 0.05, 0.0]);
  }

  vertRight = new Float32Array([-0.05, -0.05, -0.05, 0.05, 0.05, 0.0]);
  vertLeft = new Float32Array([0.05, 0.05, 0.05, -0.05, -0.05, 0.0]);
  color = new Float32Array([0.0, 0.0, 1.0, 1.0,
                            0.0, 0.0, 1.0, 1.0,
                            0.0, 0.0, 1.0, 1.0
                          ] );
  
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


    if (!this.jumping && eatKey('W'.charCodeAt())||eatKey(' '.charCodeAt())) {
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
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);   
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW );
    gl.uniform2fv( position, flatten(this.pos) );
  }
}

class Ground {

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

    mario = new Mario(0, -0.9, 0.0, 0.0);
    
    // Gefa ferningnum slembistefnu � upphafi
    //dX = Math.random()*0.1-0.05;
    //dY = Math.random()*0.1-0.05;

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // uniform
    position = gl.getUniformLocation( program, "pos" );

    //attributes:
    // Associate out shader variables with our data buffer
    positionLocation = gl.getAttribLocation( program, "vPosition" );
    colorLocation = gl.getAttribLocation( program, "vColor" );

    // buffers:
    // position
    vBuffer = gl.createBuffer();
    // color
    cBuffer = gl.createBuffer();

    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(mario.vertices), gl.DYNAMIC_DRAW );

    gl.enableVertexAttribArray( positionLocation );
    gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );

    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(mario.color), gl.STATIC_DRAW );

    gl.enableVertexAttribArray( colorLocation );
    gl.vertexAttribPointer( colorLocation, 4, gl.FLOAT, false, 0, 0 );

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
  mario.render();
  gl.drawArrays( gl.TRIANGLES, 0, 3);
}