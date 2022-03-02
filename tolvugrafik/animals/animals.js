let canvas;
let gl;

let movement = false;     // Do we rotate?
let spinX = 0;
let spinY = 0;

let id = 0;

let origX;
let origY;

let matrixLoc;

// User variables
let n = 10;

let simulationVel = 1;
let noSheep = 8;
let noWolfs = 3;

let sheepBirthTime = 5;
let sheepToNewWolf = 5;
let wolfStarveTime = 20;

let panicDur = 4;

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
let step = 1/n;
let from = -border+border/n;
let to = border-1/n + border/n;
let scaleAnimals = 1/n;
let err = 0.00001;

let wolfs = [];
let sheep = [];

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

let intervals = [];


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

  let x = Math.floor(Math.random()*n) * step;
  let y = Math.floor(Math.random()*n) * step;
  let z = Math.floor(Math.random()*n) * step;
  
  return vec3(from+x, from+y, from+z);
}
function randDir() {
  return Math.floor(Math.random()*6);
}

class Wolf {
  constructor(pos = false) {
    this.id = id++;
    this.noEaten = 0;
    this.mv = mat4();
    this.points = [];
    this.color = vec4(1.0, 0.0, 0.0, 1.0);
    cube(this.points);
    if (pos) {
      this.position = pos
    } else {
      this.position = randPos();
    }
    this.direction = randDir();
    gl.bindBuffer( gl.ARRAY_BUFFER, wolfBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );
    this.dead = false;
  }
  
  update() {
    this.birthCheck();
    // this.eat();
    this.scan();

    switch(this.direction) {
      case 0:
        if (this.position[0] + step > to+err) {
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
  eat() {
    for (s of sheep) {
      let xs = s.position[0];
      let ys = s.position[1];
      let zs = s.position[2];

      let x = this.position[0];
      let y = this.position[1];
      let z = this.position[2];

      if (Math.abs(x-xs) < err && Math.abs(y-ys) < err
          && Math.abs(z-zs) < err) {
        // consume
        s.dead = true; // til oryggis
        sheep.splice(s);
        this.noEaten += 1;

        this.birthCheck();

      }
    }
  }

  scan() {

  }

  birthCheck() {
    if (this.noEaten >= sheepToNewWolf) {
      this.noEaten = 0;
      this.birthWolf()
    }
  }

  birthWolf() {
    let pos = this.position;
    let rand = Math.random();
    
    if (rand < 0.25) {
      pos[0] += step;
    } else if (rand < 0.50) {
      pos[1] += step;

    } else if (rand < 0.75) {
      pos[0] -= step
    } else {
      pos[2] += step;
    }
    
    wolfs.push(new Wolf(pos))
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
  constructor(pos) {
    this.id = id++;
    this.mv = mat4();
    this.points = [];
    this.color = vec4(0.0, 1.0, 0.0, 1.0);
    cube(this.points);
    if (pos) {
      this.position = pos
    } else {
      this.position = randPos();
    }
    this.direction = randDir();
    this.nextX = 10000; // fyrsta gildi a ekki að hafa áhrif 
    this.nextY = 10000; // fyrsta gildi a ekki að hafa áhrif
    this.nextZ = 10000; // fyrsta gildi a ekki að hafa áhrif
    gl.bindBuffer( gl.ARRAY_BUFFER, sheepBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );
    intervals.push(setInterval(() => {
      // sometimes change direction
      if (this.panic > 0) this.panic--;
      if (Math.random() < 0.8 && !this.panic===0)
        this.direction = randDir();
    }, 1000 / simulationVel));

    // setInterval(() => {
    //   this.birthSheep();
    // }, 1000 * sheepBirthTime);

    this.dead = false;
  }
  updateNext() {
    this.nextX = this.position[0] + this.velX;
    this.nextY = this.position[1] + this.velY;
    this.nextZ = this.position[2] + this.velZ;
  }
  updateDir(dir) {
    switch(dir) {
      case 0:
        // x jakv
        this.velX = step;
        this.velY = 0.0;
        this.velZ = 0.0;
        break;
      case 1:
        // y jakv
        this.velX = 0.0;
        this.velY = step;
        this.velZ = 0.0;
        break;
      case 2:
        // z jakv
        this.velX = 0.0;
        this.velY = 0.0;
        this.velZ = step;
        break;
      case 3:
        // x neikv
        this.velX = -step;
        this.velY = 0.0;
        this.velZ = 0.0;
        break;
      case 4:
        // y neikv
        this.velX = 0.0;
        this.velY = -step;
        this.velZ = 0.0;
        break;
      case 5:
        // z neikv
        this.velX = 0.0;
        this.velY = 0.0;
        this.velZ = -step;
        break;
    }
  }
  update() {
    this.updateDir(this.direction);


    this.collide(); // with sheep and walls

    this.position[0] += this.velX;
    this.position[1] += this.velY;
    this.position[2] += this.velZ;

    this.wolfWatch();   
  }
  collide() {
    this.nextX = this.position[0] + this.velX;
    this.nextY = this.position[1] + this.velY;
    this.nextZ = this.position[2] + this.velZ;

    if (this.nextX < from - err) {
      this.position[0] = to + step;
    }

    if (this.nextX > to + err) {
      this.position[0] = from - step;
    }

    if (this.nextY < from - err) {
      this.position[1] = to + step;
    }

    if (this.nextY > to + err) {
      this.position[1] = from - step;
    }

    if (this.nextZ < from - err) {
      this.position[2] = to + step;
    }

    if (this.nextZ > to + err) {
      this.position[2] = from - step;
    }
    
    // collide with sheep
    // for (s in sheep) {
    //   if (s.id === this.id) continue;
    //   if (Math.abs(this.nextX < s.nextX) < err
    //   &&  Math.abs(this.nextY < s.nextY) < err
    //   &&  Math.abs(this.nextZ < s.nextZ) < err) {
    //     // console.log("collision");
    //     this.direction = (this.direction + 1) % 6;
    //     this.updateDir();
    //     this.updateNext();
    //     // now checking against new nextPos for remaining sheep
    //   }
    // }

  }

  wolfWatch() {
    let x = this.position[0];
    let y = this.position[1];
    let z = this.position[2];

    for (w of wolfs) {
      let xw = w.position[0];
      let yw = w.position[1];
      let zw = w.position[2];

      if (Math.abs(x-xw) < step + err && Math.abs(y-yw) < step + err
          && Math.abs(z-zw) < step + err) {
        this.panic = panicDur;
        if (x - xw > err ) {
          // fara til hægri, úlfsi er til vinstri
          this.direction = 0;
        } else if (xw - x > err ) {
          // fara til vinstri, úlfsi er til hægri
          this.direction = 3;
        } else if (y - yw > err ) {
          // fara upp, úlfsi er niðri
          this.direction = 1;
        } else if (yw - y > err ) {
          // fara niður, úlfsi er uppi
          this.direction = 4;
        } else if (z - zw > err ) {
          // fara að, úlfsi er frá
          this.direction = 2;
        } else {
          // fara frá, úlfsi er að
          this.direction = 5;
        }
      }
    }
  }

  birthSheep() {
    let pos = this.position;
    let rand = Math.random();
    
    if (rand < 0.25) {
      pos[0] += step;
    } else if (rand < 0.50) {
      pos[1] += step;

    } else if (rand < 0.75) {
      pos[0] -= step
    } else {
      pos[2] += step;
    }
    
    sheep.push(new Sheep(pos));
  }

  render() {

    this.mv = MV;
    this.mv = mult (this.mv, translate(this.position));
    this.mv = mult (this.mv, scalem(scaleAnimals, scaleAnimals, scaleAnimals));
    
    gl.bindBuffer( gl.ARRAY_BUFFER, sheepBuffer );
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
    sheepBuffer = gl.createBuffer();
    
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation( program, "mv" );

    sm = new SpatialManager();
    edges = new Edges();

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

    document.getElementById("nSlider").onchange = function(event) {
      n = event.target.value;
      document.getElementById("nOut").innerHTML = "n: ".concat(n);   
      sm.updateValues();   
      sm = new SpatialManager();
    }

    document.getElementById("velSlider").onchange = function(event) {
      simulationVel = event.target.value;
      document.getElementById("speedOut").innerHTML = "Simulation speed: ".concat(simulationVel);  
      sm.updateValues();    
      sm = new SpatialManager();
    }

    document.getElementById("sheepSlider").onchange = function(event) {
      noSheep = event.target.value;
      document.getElementById("sheepOut").innerHTML = "Number of sheep: ".concat(noSheep);  
      sm.updateValues();    
      sm = new SpatialManager();
    }

    document.getElementById("wolfSlider").onchange = function(event) {
      noWolfs = event.target.value;
      document.getElementById("wolfsOut").innerHTML = "Number of wolfs: ".concat(noWolfs);  
      sm.updateValues();    
      sm = new SpatialManager();
    }

    document.getElementById("birthSlider").onchange = function(event) {
      sheepBirthTime = event.target.value;
      document.getElementById("birthOut").innerHTML = "Time between sheep births (sec): ".concat(sheepBirthTime);  
      sm.updateValues();    
      sm = new SpatialManager();
    }

    document.getElementById("sheepToWolfSlider").onchange = function(event) {
      sheepToNewWolf = event.target.value;
      document.getElementById("sheepToWolfOut").innerHTML = "Number of sheep eaten for new wolf: ".concat(sheepToNewWolf);  
      sm.updateValues();    
      sm = new SpatialManager();
    }

    document.getElementById("wolfStarveTimeSlider").onchange = function(event) {
      wolfStarveTime = event.target.value;
      document.getElementById("wolfStarveTimeOut").innerHTML = "Time until wolf death by starvation: ".concat(wolfStarveTime);  
      sm.updateValues();    
      sm = new SpatialManager();
    }

    document.getElementById("panicSlider").onchange = function(event) {
      panicDur = event.target.value;
      document.getElementById("panicOut").innerHTML = "Sheep panic duration: ".concat(panicDur);  
      sm.updateValues();    
      sm = new SpatialManager();
    }

    

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

    for (w of wolfs) {
      w.render();
    }

    for (s of sheep) {
      s.render();
    }
    
    requestAnimFrame( render );
}

class SpatialManager {
  
  constructor() {
    intervals.forEach(clearInterval);
    intervals = [];
    sheep = [];
    wolfs = [];
    
    for (let i = 0; i < noSheep; i+=1) {
      this.birthSheep();
    }
    for (let i = 0; i < noWolfs; i+=1) {
      this.birthWolf();
    }

    if (simulationVel === 0) simulationVel += err;
    intervals.push(setInterval( () => { this.update()}, 1000 / simulationVel));
    //setInterval( () => { this.birthSheep()}, 1000 * sheepBirthTime);
  }

  update() {
    for (let w of wolfs) {
      if (w.dead) {
        wolfs.splice(w)
      } else {
        w.update();
      }
    }
    for (let s of sheep) {
      if (s.dead) {
        sheep.splice(s);
      } else {
        s.update();
      }
    }    
  }

  birthSheep() {
    sheep.push(new Sheep());
  }

  birthWolf() {
    wolfs.push(new Wolf());
  }

  updateValues() {
    step = 1/n;
    from = -border+border/n;
    to = border-1/n + border/n;
    scaleAnimals = 1/n;
  }
}


