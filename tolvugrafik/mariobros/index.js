var canvas;
var gl;

// N�verandi sta�setning mi�ju ferningsins
//var box = vec2( 0.0, 0.0 );

// Stefna
// var dX;
// var dY;

var maxX = 1.0;
var maxY = 1.0;

var boxRad = 0.05;

var gl_keys = [];

let mario;
let locBox;

class Mario {
  right = true;
  constructor(x, y, velX, velY) {
    this.pos = vec2(x, y);
    this.velX = velX;
    this.velY = velY;
    this.vertices = new Float32Array([-0.05, -0.05, -0.05, 0.05, 0.05, 0.0]);
  }

  vertRight = new Float32Array([-0.05, -0.05, -0.05, 0.05, 0.05, 0.0]);
  vertLeft = new Float32Array([0.05, 0.05, 0.05, -0.05, -0.05, 0.0]);
  
  init() {
    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW );
  }

  update() {

    if (gl_keys['A'.charCodeAt()]) {      
      this.pos[0] -= this.velX;
      this.right = false;
    }
    if (gl_keys['D'.charCodeAt()]) {      
      this.pos[0] += this.velX;
      this.right = true;
    }
    if (eatKey(' '.charCodeAt())) {
      this.velY = 0.05;
    }

    if (!this.right) {
      this.vertices = this.vertLeft;
    } else {
      this.vertices = this.vertRight
    }
    //this.pos[0] += this.velX;
    this.pos[1] += this.velY;
  }

  render() {
    gl.clear( gl.COLOR_BUFFER_BIT );    
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW );
    gl.uniform2fv( locBox, flatten(this.pos) );
    gl.drawArrays( gl.TRIANGLES, 0, 3 );
  }
}

function eatKey(key) {
  if(gl_keys[key]) {
    gl_keys[key] = false;
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
    gl.clearColor( 1.0, 0.9, 1.0, 1.0 );

    mario = new Mario(0, -0.8, 0.01, 0.0);
    
    // Gefa ferningnum slembistefnu � upphafi
    //dX = Math.random()*0.1-0.05;
    //dY = Math.random()*0.1-0.05;

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    mario.init();

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    locBox = gl.getUniformLocation( program, "boxPos" );

    // Meðhöndlun lykla
    window.addEventListener("keydown", function(e){
        gl_keys[e.keyCode] = true;
    });

    window.addEventListener("keyup", function(e){
        gl_keys[e.keyCode] = false;
    });

    updateSimulation();
}


function updateSimulation() {
    
    update();
    render();
    
    window.requestAnimFrame(updateSimulation);
}

function update() {
  // L�t ferninginn skoppa af veggjunum
  //if (Math.abs(box[0] + dX) > maxX - boxRad) dX = -dX;
  //if (Math.abs(box[1] + dY) > maxY - boxRad) dY = -dY;

  // Uppf�ra sta�setningu
  //box[0] += dX;
  //box[1] += dY;
  mario.update();

}

function render() {
  mario.render();
}