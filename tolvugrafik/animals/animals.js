/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Búum til bókstafinn H úr þremur teningum
//
//    Hjálmtýr Hafsteinsson, febrúar 2022
/////////////////////////////////////////////////////////////////
let canvas;
let gl;

let movement = false;     // Do we rotate?
let spinX = 0;
let spinY = 0;


let origX;
let origY;

let matrixLoc;

// User variables
let n = 10;

let simulationVel = 6;
let noSheeps = 10;
let noWolfs = 2;

let sheepBirthTime = 5;
let sheepsToNewWolf = 5;
let wolfHungerTime = 20;

//////////////////

let MV;

let sm;

let edges;

let lineBuffer;
let wolfBuffer;
let sheepBuffer;

let vPosition;
let vColor;

let border = 0.5;
let step = 0.1;
let from = -border+border/n;
let to = border-1/n + border/n;
let scaleAnimals = 1/n;
let err = 0.000000001;

let vertices = [
  vec3( -border, -border,  border ),
  vec3( -border,  border,  border ),
  vec3(  border,  border,  border ),
  vec3(  border, -border,  border ),
  vec3( -border, -border, -border ),
  vec3( -border,  border, -border ),
  vec3(  border,  border, -border ),
  vec3(  border, -border, -border )
];



class Edges {
  constructor() {
    this.mv = mat4();
    this.points = [];
    this.color = vec4(0.0, 0.0, 0.0, 1.0);
    lineCube(this.points);    
    gl.bindBuffer( gl.ARRAY_BUFFER, lineBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.DYNAMIC_DRAW );
  }
    
  render() {

    this.mv = MV;    
    gl.bindBuffer( gl.ARRAY_BUFFER, lineBuffer );
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(this.mv));
    gl.uniform4fv(vColor, flatten(this.color));
    gl.drawArrays( gl.LINES, 0, this.points.length );
  }
}

function randPos() {

  let x = Math.floor(Math.random()*9) * step;
  let y = Math.floor(Math.random()*9) * step;
  let z = Math.floor(Math.random()*9) * step;
  
  return vec3(from+x, from+y, from+z);
}

class Wolf {
  constructor() {
    this.mv = mat4();
    this.points = [];
    this.color = vec4(1.0, 0.0, 0.0, 1.0);
    cube(this.points);
    this.position = randPos();
    this.direction = Math.floor(Math.random()*6);
    gl.bindBuffer( gl.ARRAY_BUFFER, wolfBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );
  }
  
  update() {
    switch(this.direction) {
      case 0:
        if (this.position[0] + step > to+err+err) {
          this.position[0] = from;
        } else {
          this.position[0] += step;
        }
        break;
      case 1:
        if (this.position[1] + step > to+err) {
          this.position[1] = from;
        } else {
          this.position[1] += step;
        }
        break;
      case 2:
        if (this.position[2] + step > to+err) {
          this.position[2] = from;
        } else {
          this.position[2] += step;
        }
        break;
      case 3:
        if (this.position[0] - step < from-err) {
          this.position[0] = to;
        } else {
          this.position[0] -= step;
        }
        break;
      case 4:
        if (this.position[1] - step < from-err) {
          this.position[1] = to;
        } else {
          this.position[1] -= step;
        }
        break;
      case 5:
        if (this.position[2] - step < from-err) {
          this.position[2] = to;
        } else {
          this.position[2] -= step;
        }
        break;
    }
  
  }
  collide() {
    let nextX = this.position[0] + this.velX;
    let nextY = this.position[1] + this.velY;
    let nextZ = this.position[2] + this.velZ;

    //if (nextX > )
  }

  render() {

    this.mv = MV;
    this.mv = mult (this.mv, translate(this.position));
    this.mv = mult (this.mv, scalem(scaleAnimals, scaleAnimals, scaleAnimals));
    
    gl.bindBuffer( gl.ARRAY_BUFFER, wolfBuffer );
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(matrixLoc, false, flatten(this.mv));
    gl.uniform4fv(vColor, flatten(this.color));
    gl.drawArrays( gl.TRIANGLES, 0, this.points.length );
  }
}

class Sheep {
  constructor() {
    this.mv = mat4();
    this.points = [];
    this.color = vec4(0.0, 1.0, 0.0, 1.0);
    cube(this.points);
    this.position = randPos();
    this.direction = Math.floor(Math.random()*6);
    gl.bindBuffer( gl.ARRAY_BUFFER, wolfBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );
  }
  
  update() {
    switch(this.direction) {
      case 0:
        if (this.position[0] + step > to+err+err) {
          this.position[0] = from;
        } else {
          this.position[0] += step;
        }
        break;
      case 1:
        if (this.position[1] + step > to+err) {
          this.position[1] = from;
        } else {
          this.position[1] += step;
        }
        break;
      case 2:
        if (this.position[2] + step > to+err) {
          this.position[2] = from;
        } else {
          this.position[2] += step;
        }
        break;
      case 3:
        if (this.position[0] - step < from-err) {
          this.position[0] = to;
        } else {
          this.position[0] -= step;
        }
        break;
      case 4:
        if (this.position[1] - step < from-err) {
          this.position[1] = to;
        } else {
          this.position[1] -= step;
        }
        break;
      case 5:
        if (this.position[2] - step < from-err) {
          this.position[2] = to;
        } else {
          this.position[2] -= step;
        }
        break;
    }
  
  }
  collide() {
    let nextX = this.position[0] + this.velX;
    let nextY = this.position[1] + this.velY;
    let nextZ = this.position[2] + this.velZ;

    //if (nextX > )
  }

  render() {

    this.mv = MV;
    this.mv = mult (this.mv, translate(this.position));
    this.mv = mult (this.mv, scalem(scaleAnimals, scaleAnimals, scaleAnimals));
    
    gl.bindBuffer( gl.ARRAY_BUFFER, wolfBuffer );
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(matrixLoc, false, flatten(this.mv));
    gl.uniform4fv(vColor, flatten(this.color));
    gl.drawArrays( gl.TRIANGLES, 0, this.points.length );
  }
}

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    let program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    //let cBuffer = gl.createBuffer();
    //gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    vColor = gl.getUniformLocation(program, "vColor");
    
    lineBuffer = gl.createBuffer();
    wolfBuffer = gl.createBuffer();
    createBuffer = gl.createBuffer();
    
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation( program, "mv" );

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (e.offsetX - origX) ) % 360;
          spinX = ( spinX + (e.offsetY - origY) ) % 360;
          origX = e.offsetX;
          origY = e.offsetY;
        }
    } );

    sm = new SpatialManager();
    
    edges = new Edges();

    sm.birthSheep();
    sm.birthSheep();
    sm.birthSheep();
    
    // dummy wolf
    //wolf = new Wolf();

    
    render();
}


function cube(points)
{
    quad( 1, 0, 3, 2, points );
    quad( 2, 3, 7, 6, points );
    quad( 3, 0, 4, 7, points );
    quad( 6, 5, 1, 2, points );
    quad( 4, 5, 6, 7, points );
    quad( 5, 4, 0, 1, points );
}

function quad(a, b, c, d, points) 
{
    

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    //vertex color assigned by the index of the vertex
    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );        
    }
}

function lineCube(points)
{
  lineQuad( 5, 4, 0, 1, points );
  lineQuad( 4, 5, 6, 7, points );
  lineQuad( 6, 5, 1, 2, points );
  lineQuad( 3, 0, 4, 7, points );
  lineQuad( 2, 3, 7, 6, points );
  lineQuad( 0, 1, 2, 3, points );
}

function lineQuad(a, b, c, d, points) 
{
    

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    //vertex color assigned by the index of the vertex
    
    let indices = [ a, b, b, c, c, d, d, a ];
    //let indices = [ a, d, d, c, c, b, b, a ];

    for ( let i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );        
    }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    
    MV = mat4();
    MV = mult( MV, rotateX(-spinX) );
    MV = mult( MV, rotateY(-spinY) ) ;
    
    edges.render();

    for (w of sm.wolfs) {
      w.render();
    }

    for (s of sm.sheep) {
      s.render();
    }
    
    requestAnimFrame( render );
}

class SpatialManager {
  
  constructor() {
    this.wolfs = []
    this.sheep = [];

    if (simulationVel === 0) simulationVel += err;
    setInterval( () => { this.update()}, 1000 / simulationVel);
    setInterval( () => { this.birthWolf()}, 1000 * sheepBirthTime);
    setInterval( () => { this.birthSheep()}, 1000 * sheepBirthTime);
  }

  update() {
    for (let w of this.wolfs) {
      w.update();
    }
    for (let s of this.sheep) {
      s.update();
    }
    
  }

  birthSheep() {
    this.sheep.push(new Sheep());
  }

  birthWolf() {
    this.wolfs.push(new Wolf());
  }
}










