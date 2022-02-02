var canvas;
var gl;

var g_keys = [];

let mario;
let ground;
let gold = [];
let obsticles = [];
let monsters = [];

let position;
let colorLocation;
let positionLocation;

let groundBuffer;
let marioBuffer;
let goldBuffer;
let obsticleBuffer;
let scoreBarBuffer;
let monsterBuffer;

let score = 0;
let scoreBars = [];

let running = true;

class Mario {
  right = true;
  jumping = false;
  constructor(x, y, velX = 0, velY = 0) {
    this.pos = vec2(x, y);
    this.velX = 0.0;
    this.velY = velY;
    this.vertices = new Float32Array([-0.05, -0.05, 
                                      -0.05, 0.05, 
                                       0.05, 0.0]);
    gl.bindBuffer( gl.ARRAY_BUFFER, marioBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW );

  }

  vertRight = new Float32Array([-0.1, -0.1, -0.1, 0.1, 0.1, 0.0]);
  vertLeft = new Float32Array([0.1, 0.1, 0.1, -0.1, -0.1, 0.0]);
  //color = new Float32Array([0.0, 0.0, 1.0, 1.0,
  //                          0.0, 0.0, 1.0, 1.0,
  //                          0.0, 0.0, 1.0, 1.0,
  //                        ] );
  color = vec4(0.0, 0.0, 1.0, 1.0);
  dead = false;
  
  init() {
    // Load the data into the GPU
    
  }

  collide() {
    // collide with ground
    let nextX = this.pos[0] + this.velX;
    let nextY = this.pos[1] + this.velY;
    if (nextY <  -0.8) { 
      this.jumping = false;
      this.velY = 0;
    }

    // collide with walls
    if (Math.abs(nextX) >= 0.9) {
      if (this.jumping) {
        this.velX *= -1;
        this.right = !this.right;
      } else {
        this.velX = 0;
      }
    }
    
    // collide with obsticles
    for (let dude of obsticles) {
      //x
      if (nextY-0.1 < dude.upperY) {
        //collide from left to right
        if (this.pos[0]+0.1 < dude.leftX && nextX+0.1 > dude.leftX ) {
          this.velX = 0;
        }
        // collide from right to left
        if (this.pos[0]-0.1 > dude.rightX && nextX-0.1 < dude.rightX) {
          this.velX = 0;
        }
      }

      // y
      // collide with obsticle from above
      if (dude.leftX < nextX+0.1 && dude.rightX > nextX-0.1)
        if (this.pos[1]-0.1 > dude.upperY && nextY-0.1 < dude.upperY) {
          this.velY = 0;
          this.jumping = false;
        }
    }

    // get the gold
    for (let i = gold.length-1; i>=0; i--) {
      let dude = gold[i];
      if (dude.dead) {
        gold.splice(i,1);
      } else {
        //x og y
        if (this.pos[0]+0.1 > dude.leftX && this.pos[0]-0.1 < dude.rightX
            && this.pos[1]-0.1 < dude.upperY && this.pos[1]+0.1 > dude.lowerY) {
              score++;
              gold.splice(i, 1)
              scoreBars.push(new ScoreBar(score));
        }
      }
    }
    // collide with monsters
    for (let i = monsters.length-1; i>=0; i--) {
      let dude = monsters[i];
      if (dude.dead) {
        monsters.splice(i,1);
      } else {
        //x og y
        console.log(dude.leftX, dude.rightX, dude.upperY, dude.lowerY);
        if (this.pos[0]+0.1 > dude.leftX && this.pos[0]-0.1 < dude.rightX
            && this.pos[1]-0.1 < dude.upperY && this.pos[1]+0.1 > dude.lowerY) {
              this.dead = true;   
              console.log("xogy");         
        }
      }
    }
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
      this.velX = -0.015;
      this.right = false;
    }
    else if (!this.jumping && g_keys['D'.charCodeAt()]) {      
      if (this.velX < 0) this.velX *= -1;     
      this.velX = 0.015;
      this.right = true;
    } else if (!this.jumping) {
      this.velX = 0;
    }


    if (running && !this.jumping && (eatKey('W'.charCodeAt())||eatKey(' '.charCodeAt()))) {
       this.jumping = true;
       this.velY = 0.08;
    }

    if (!this.jumping && (eatKey('R'.charCodeAt()))) {
      // reset position
      this.resetPosition();
    }

    // apply gravity
    this.velY -= 0.002;

    // collide
    this.collide();
      
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

  reset() {
    this.resetPosition();
    this.velX = 0;
    this.velY = 0;
    this.dead = false;
  }

  resetPosition() {
    this.pos[0] = 0.0;
    this.pos[1] = 0.0;
  }
}

class ScoreBar {
  constructor(s) {
    let x = -0.9+0.1*s;
    let y = 0.8
    this.pos = vec2(x, y);
    gl.bindBuffer( gl.ARRAY_BUFFER, scoreBarBuffer);   
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW );
  }
  vertices = new Float32Array([
    -0.01, -0.05, 
    -0.01, 0.05, 
    0.01, 0.05,
    0.01, 0.05,
    -0.01, -0.05, 
    0.01, -0.05,
  ]);
  color = vec4(1.0, 0.2, 0.9, 1.0);
  render() {
    gl.bindBuffer( gl.ARRAY_BUFFER, scoreBarBuffer);   
    gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );
    gl.uniform2fv( position, flatten(this.pos) );
    gl.uniform4fv( colorLocation, flatten(this.color) );
    gl.drawArrays( gl.TRIANGLES, 0, 6);
  }
}

class Ground {
  constructor(x, y) {
    this.pos = vec2(x, y);  
    gl.bindBuffer( gl.ARRAY_BUFFER, groundBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW );
  }
  vertices = new Float32Array([-1.0, -0.05, 
    -1.0, 0.05, 
    1.0, 0.05,
    1.0, 0.05,
    -1.0, -0.05, 
    1.0, -0.05,
  ]);
  color = vec4(0.0, 0.8, 0.0, 1.0);
  render() {
    gl.bindBuffer( gl.ARRAY_BUFFER, groundBuffer);   
    gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );
    gl.uniform2fv( position, flatten(this.pos) );
    gl.uniform4fv( colorLocation, flatten(this.color) );
    gl.drawArrays( gl.TRIANGLES, 0, 6);
  }
}

class Gold {
  constructor() {
    let x = Math.random()*2-1;
    let y = Math.random()*0.5;
    this.pos = vec2(x, y);
    gl.bindBuffer( gl.ARRAY_BUFFER, goldBuffer);   
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW );
    this.leftX = -0.05 + x;
    this.rightX = 0.05 + x;
    this.lowerY = -0.05 + y;
    this.upperY = 0.05 + y;

    this.time = 0;
    this.dead = false;
  }
  vertices = new Float32Array([
    -0.05, -0.05, 
    -0.05, 0.05, 
    0.05, 0.05,
    0.05, 0.05,
    -0.05, -0.05, 
    0.05, -0.05,
  ]);
  color = vec4(1.0, 1.0, 0.0, 1.0);
  update() {
    this.time+=0.01;
  
  }
  render() {
    if (this.time < 3) {
      gl.bindBuffer( gl.ARRAY_BUFFER, goldBuffer);   
      gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );
      gl.uniform2fv( position, flatten(this.pos) );
      gl.uniform4fv( colorLocation, flatten(this.color) );
      gl.drawArrays( gl.TRIANGLES, 0, 6);
    } else {
      this.dead = true;
    }
  }
}

class Obsticle {
  constructor() {
    this.factorX = 0.1*Math.random();
    this.factorY = 0.5*Math.random();
    this.vertices = new Float32Array([
      -0.1-this.factorX, -0.1-this.factorY, 
      -0.1-this.factorX, 0.1+this.factorY, 
      0.1+this.factorX, 0.1+this.factorY,
      0.1+this.factorX, 0.1+this.factorY,
      -0.1-this.factorX, -0.1-this.factorY, 
      0.1+this.factorX, -0.1-this.factorY,
    ]);
    let x = Math.random()*2-1;
    while(Math.abs(x)<0.3 || Math.abs(x)>0.9) {
      x = Math.random()*2-1;
    }
    let y = -0.8;
    this.pos = vec2(x, y);
    gl.bindBuffer( gl.ARRAY_BUFFER, obsticleBuffer);   
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW );
    this.leftX = -0.1 - this.factorX + x;
    this.rightX = 0.1 + this.factorX + x;
    this.upperY = 0.1 + this.factorY + y;
  }

  color = vec4(0.0, 0.8, 0.0, 1.0);
  render() {
    gl.bindBuffer( gl.ARRAY_BUFFER, obsticleBuffer); 
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW );  
    gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );
    gl.uniform2fv( position, flatten(this.pos) );
    gl.uniform4fv( colorLocation, flatten(this.color) );
    gl.drawArrays( gl.TRIANGLES, 0, 6);
  }
}

class Monster {
  constructor() {
    let x;
    let y = -0.8;
    if (Math.random()<0.5) {
      x = -1.5;
      this.velX = 0.01;
    } else {
      x = 1.5;
      this.velX = -0.01;
    }
    this.pos = vec2(x, y);
    gl.bindBuffer( gl.ARRAY_BUFFER, monsterBuffer);   
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW );
    this.leftX = -0.1 + x;
    this.rightX = 0.1 + x;
    this.lowerY = -0.1 + y;
    this.upperY = 0.1 + y;
    this.dead = false;
  }
  vertices = new Float32Array([
    -0.1, -0.1, 
    -0.1, 0.1, 
    0.1, 0.1,
    0.1, 0.1,
    -0.1, -0.1, 
    0.1, -0.1,
  ]);
  color = vec4(1.0, 0.0, 0.0, 1.0);
  update() {
    this.pos[0] += this.velX;
    this.leftX = -0.1 + this.pos[0];
    this.rightX = 0.1 + this.pos[0];
    if (Math.abs(this.pos[0]) > 1.6) {
      this.dead = true;
    }    
  }
  render() {
    if (!this.dead) {
      gl.bindBuffer( gl.ARRAY_BUFFER, monsterBuffer);   
      gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );
      gl.uniform2fv( position, flatten(this.pos) );
      gl.uniform4fv( colorLocation, flatten(this.color) );
      gl.drawArrays( gl.TRIANGLES, 0, 6);
    }
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
    goldBuffer = gl.createBuffer();
    obsticleBuffer = gl.createBuffer();
    scoreBarBuffer = gl.createBuffer();
    monsterBuffer = gl.createBuffer();

    ground = new Ground(0.0, -0.95);
    mario = new Mario(0, 0.0, 0.0, 0.0);

    gl.enableVertexAttribArray( positionLocation );
    gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );

    let n = Math.round(Math.random()*5)+1;

    for (let i = 0; i < n; i+=1) {
      obsticles.push(new Obsticle());
    }
    

    // Meðhöndlun lykla
    window.addEventListener("keydown", function(e){
        g_keys[e.keyCode] = true;
    });

    window.addEventListener("keyup", function(e){
        g_keys[e.keyCode] = false;
    });

    updateSimulation();
}

setInterval(()=> {
  if (gold.length < 4) {
    if (Math.random() < 0.02) { 
      gold.push(new Gold());
    }
  }

  if (monsters.length < 2) {
    if (Math.random() < 0.02) {
      monsters.push(new Monster());
    }
  }
}, 50);
function updateSimulation() {
    
    if(running) {
      update();
      render();
    }

    if (score >= 10) {
      finalText("You Won! Press Space Bar to play again.");
      running = false;
    }
    if (mario.dead) {
      console.log("asdf");
      finalText("You Lost! Press Space Bar to Play again.");
      running = false;
    }

    if (!running) {
      if (eatKey(' '.charCodeAt())) {
        running = true;
        resetSimulation();
      }
    }
    
    window.requestAnimFrame(updateSimulation);
}

function resetSimulation() {
  mario.reset();
  score = 0;
  scoreBars = [];
  gold = [];
  monsters = [];
}

function finalText(str) {
  document.getElementById("output").innerHTML = str;
}

function update() {
  
  mario.update();
  for (let g of gold) {
    g.update();
  }
  for (let m of monsters) {
    m.update();
  }
  document.getElementById("output").innerHTML = "Your Score: " + score;
  
}

function render() {
  gl.clear( gl.COLOR_BUFFER_BIT );  
  ground.render();
  for (let g of gold) {
    g.render();
  }
  for (let o of obsticles) {
    o.render();
  }
  for (let s of scoreBars) {
    s.render();
  }
  for (let m of monsters) {
    m.render();
  }

  mario.render();
}