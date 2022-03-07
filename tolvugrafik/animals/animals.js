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
let noSheep = 14;
let noWolfs = 6;

let sheepBirthTime = 30;
let sheepToNewWolf = 3;
let wolfStarveTime = 40;

let panicDur = 4;

let zDist = -2;

//////////////////

let MV;

let sm;

let edges;
let wolfs = [];
let sheep = [];

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

// stats
let birthsSheep = 0;
let birthsWolfs = 0;
let eaten = 0;
let wolfsStarved = 0;


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
  constructor(pos = false, color = false) {
    this.dead = false;
    this.eatCool = wolfStarveTime;
    this.id = id++;
    this.noEaten = 0;
    this.mv = mat4();
    this.points = [];
    
    this.color = vec4(0.2, 0.2, 0.4, 1.0);
    
    cube(this.points);
    this.position;
    if (pos) {
      this.position = pos;
      this.color = vec4(0.2, 0.2, 0.6, 1.0);
    } else {
      this.position = randPos();
    }
    this.direction = randDir();
    //this.direction = 56;
    this.nextX = 10000; // fyrsta gildi a ekki að hafa áhrif 
    this.nextY = 10000; // fyrsta gildi a ekki að hafa áhrif
    this.nextZ = 10000; // fyrsta gildi a ekki að hafa áhrif
    this.velX;
    this.velY;
    this.velZ;
    this.updateVel();

    gl.bindBuffer( gl.ARRAY_BUFFER, wolfBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );
    
  
  }
  updateNext() {
    this.nextX = this.position[0] + this.velX;
    this.nextY = this.position[1] + this.velY;
    this.nextZ = this.position[2] + this.velZ;
  }
  updateVel(dir) {
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
      default:
        // stop
        this.velX = 0.0;
        this.velY = 0.0;
        this.velZ = 0.0;
        break;
    }
  }
  
  update() {
    this.birthCheck();
    
    this.updateVel(this.direction);
    this.eat();
    this.eatCool--;
    this.deathCheck();
    
    this.scan();
    this.updateVel(this.direction);

    this.collide(); // with wolfs and walls (wrap)


    this.position[0] += this.velX;
    this.position[1] += this.velY;
    this.position[2] += this.velZ;
  
    
  }
  collide() {
    this.nextX = this.position[0] + this.velX;
    this.nextY = this.position[1] + this.velY;
    this.nextZ = this.position[2] + this.velZ;

    // // console.log("next: ", this.nextX, this.nextY, this.nextZ)

    // wrap
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
    
    // collide with wolfs

    //for (w of wolfs) { (use i to be able to restart loop)
    for (let i = 0; i < wolfs.length; i++) {
      if (w.id === this.id) continue;
      if (Math.abs(this.nextX - w.nextX) < err
      &&  Math.abs(this.nextY - w.nextY) < err
      &&  Math.abs(this.nextZ - w.nextZ) < err) {
        // console.log("collision wolf");
        this.direction = -1; // give other wolfs right of way
        this.updateVel();
        this.updateNext();
        i = -1; // check again for all wolfs with this wolf's new next pos.
      }
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
        this.eatCool = wolfStarveTime;
        let index = sheep.map(x => {
          return x.id;
        }).indexOf(s.id);
        sheep.splice(index, 1);

        // delete both intervals initialized in sheep constructor
        index = intervals.map(x => {
          return x.id;
        }).indexOf(s.id);
        clearInterval(intervals[index].interval)
        intervals.splice(index, 1);
        index = intervals.map(x => {
          return x.id;
        }).indexOf(s.id);
        clearInterval(intervals[index].interval)
        intervals.splice(index, 1);

        this.noEaten += 1;
        eaten += 1;
        
        // console.log("get eaten: ", s.id);
        // noSheep--;
        //this.birthCheck();

      }
    }
  }

  scan() {
    let position = this.position;
    for (s of sheep) {
      let pos = s.position;
      if (Math.abs(pos[0] - position[0]) < err && Math.abs(pos[1] - position[1]) < err) {
        // i linu vid z
        if (pos[2] > position[2]) {
          // upp
          this.direction = 2;
        } else {
          // nidur
          this.direction = 5;
        }
        this.updateVel();
        return;
      }
      if (Math.abs(pos[0] - position[0]) < err && Math.abs(pos[2] - position[2]) < err) {
        // i linu vid y
        if (pos[1] > position[1]) {
          // jakv y
          this.direction = 1;
        } else {
          this.direction = 4;
        }
        this.updateVel();
        return;
      }
      if (Math.abs(pos[2] - position[2]) < err && Math.abs(pos[1] - position[1]) < err) {
        // i linu vid x
        if (pos[0] > position[0]) {
          // jakv x
          this.direction = 0;
        } else {
          this.direction = 3;
        }
        this.updateVel();
        return;
      }
      
    }
  }

  birthCheck() {
    if (this.noEaten >= sheepToNewWolf) {
      this.noEaten = 0;
      this.birthWolf();
    }
  }

  deathCheck() {
    if (this.eatCool <= 0) {
      // console.log("die");
      // suicide
      wolfsStarved+=1;
      let index = wolfs.map(x => {
        return x.id;
      }).indexOf(this.id);
      wolfs.splice(index, 1);
    }
  }

  birthWolf() {
    if (sheep.length + wolfs.length >= n*n*n) return;
    // console.log("birth wolf");
    birthsWolfs+=1;
    
    let pos = vec3();    
    pos[0] = this.nextX;
    pos[1] = this.nextY;
    pos[2] = this.nextZ;
    pos = wrap(pos);
    // stop this one, child will take next square
    this.direction = 6;
    this.updateVel();
    
    if (!sm.isWolf(pos, this.id)) {
      wolfs.push(new Wolf(pos));
      birthsWolfs++;
      this.birthCool = 1;
    }

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
  constructor(pos = false) {
    this.panic = 0;
    this.birthCool = 0;
    this.id = id++;
    this.mv = mat4();
    this.points = [];
    
    this.color = vec4(0.0, 0.8, 0.4, 1.0);
  
    cube(this.points);
    this.position;
    if (pos) {
      this.position = pos;
    } else {
      this.position = randPos();
    }
    this.defaultColor = this.color;
    this.direction = randDir();
    this.nextX = 10000; // fyrsta gildi a ekki að hafa áhrif 
    this.nextY = 10000; // fyrsta gildi a ekki að hafa áhrif
    this.nextZ = 10000; // fyrsta gildi a ekki að hafa áhrif
    this.velX = 0.0;
    this.velY = 0.0;
    this.velZ = 0.0;
    this.updateVel();
    
    gl.bindBuffer( gl.ARRAY_BUFFER, sheepBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );
    intervals.push({
      id: this.id,
      interval: setInterval(() => {
          // sometimes change direction
          if (this.panic > 0) this.panic--;
          if (!this.panic===0)
            this.direction = randDir();
        }, 1000 / simulationVel)
    });

    intervals.push({
      id: this.id,
      interval: setInterval(() => {
            this.birthSheep();
          }, 1000 * sheepBirthTime)
    });

    //intervals.push(setInterval(() => {
    //  this.birthSheep();
    //}, 1000 * sheepBirthTime));

  }
  updateNext() {
    this.nextX = this.position[0] + this.velX;
    this.nextY = this.position[1] + this.velY;
    this.nextZ = this.position[2] + this.velZ;
  }
  updateVel(dir) {
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
      default:
        // stop
        this.velX = 0.0;
        this.velY = 0.0;
        this.velZ = 0.0;
        break;
    }
  }
  update() {
    if (this.birthCool !== 0) this.birthCool -= 1;
    if (this.birthCool > 0) return;
    
    if (this.panic > 0) {
      this.panic -= 1;
      this.color = vec4(0.6, 0.8, 0.0, 1.0);
    }
    
    if (this.panic === 0) {
      this.direction = randDir();
      this.updateVel(this.direction);
      this.color = this.defaultColor;
    }
    
    this.collide(); // with sheep and walls (wrap)
    

    this.position[0] += this.velX;
    this.position[1] += this.velY;
    this.position[2] += this.velZ;

    this.wolfWatch();   
  }
  collide() {
    this.nextX = this.position[0] + this.velX;
    this.nextY = this.position[1] + this.velY;
    this.nextZ = this.position[2] + this.velZ;

    // // console.log("next: ", this.nextX, this.nextY, this.nextZ)

    // wrap
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

    //for (s of sheep) { (use i to be able to restart loop)
    for (let i = 0; i < sheep.length; i++) {
      if (s.id === this.id) continue;
      if (Math.abs(this.nextX - s.nextX) < err
      &&  Math.abs(this.nextY - s.nextY) < err
      &&  Math.abs(this.nextZ - s.nextZ) < err) {
        // console.log("collision sheep");
        this.direction = -1; // give other sheep right of way
        this.updateVel();
        this.updateNext();
        i = -1; // check again for all sheep with this sheep's new next pos.
      }
    }

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
    if (sheep.length + wolfs.length >= n*n*n) return;
    // console.log("birth sheep");
    
    let pos = vec3();    
    pos[0] = this.nextX;
    pos[1] = this.nextY;
    pos[2] = this.nextZ;
    pos = wrap(pos);
    // stop this one, child will take next square
    this.direction = 6;
    this.updateVel();
    
    if (!sm.isSheep(pos, this.id)) {
      
      sheep.push(new Sheep(pos));
      birthsSheep++;
      this.birthCool = 1;
    }
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

function wrap(pos) {
  if (pos[0] < from - err) {
    pos[0] = to;
  }

  if (pos[0] > to + err) {
    pos[0] = from;
  }

  if (pos[1] < from - err) {
    pos[1] = to;
  }

  if (pos[1] > to + err) {
    pos[1] = from;
  }

  if (pos[2] < from - err) {
    pos[2] = to;
  }

  if (pos[2] > to + err) {
    pos[2] = from;
  }
  return pos;
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
    
    vColor = gl.getUniformLocation(program, "vColor");
    
    lineBuffer = gl.createBuffer();
    wolfBuffer = gl.createBuffer();
    sheepBuffer = gl.createBuffer();
    
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation( program, "mv" );
    proLoc = gl.getUniformLocation( program, "projection" );
    

    let proj = perspective( 50.0, 1.0, 0.2, 100.0 );
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));

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
      document.getElementById("wolfStarveTimeOut").innerHTML = "Ticks until wolf death by starvation: ".concat(wolfStarveTime);  
      sm.updateValues();    
      sm = new SpatialManager();
    }

    document.getElementById("panicSlider").onchange = function(event) {
      panicDur = event.target.value;
      document.getElementById("panicOut").innerHTML = "Sheep panic duration: ".concat(panicDur);  
      sm.updateValues();    
      sm = new SpatialManager();
    }

    // Event listener for keyboard
    window.addEventListener("keydown", function(e){
      switch( e.keyCode ) {
         case 38:	// upp ör
             zDist += 0.1;
             break;
         case 40:	// niður ör
             zDist -= 0.1;
             break;
      }
  }  );  

    

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
    
    
    ///MV = mat4();
    let eyesep = 0.2
    
    MV = lookAt( vec3(0.0-eyesep/2.0, 0.0, zDist),
    vec3(0.0, 0.0, zDist+2.0),
    vec3(0.0, 1.0, 0.0) );
  
    MV = mult( MV, rotateX(-spinX) );
    MV = mult( MV, rotateY(spinY) ) ;
    
    edges.render();

    for (w of wolfs) {
      w.render();
    }

    for (s of sheep) {
      s.render();
    }
    
    updateStats();

    requestAnimFrame( render );
}

function updateStats() {
  document.getElementById("birthsSheep").innerHTML = "Sheep births: ".concat(birthsSheep);
  document.getElementById("birthsWolfs").innerHTML = "Wolf births: ".concat(birthsWolfs);
  document.getElementById("eaten").innerHTML = "Sheep eaten: ".concat(eaten);
  document.getElementById("starved").innerHTML = "Wolfs starved: ".concat(wolfsStarved);
  document.getElementById("sheepLeft").innerHTML = "Sheep left: ".concat(sheep.length);
  document.getElementById("wolfsLeft").innerHTML = "Wolfs left: ".concat(wolfs.length);
}

class SpatialManager {
  
  constructor() {
    this.resetAll();
  }

  resetAll() {
    intervals.forEach((dude) => {clearInterval(dude.interval)});
    intervals = [];
    sheep = [];
    wolfs = [];
    birthsSheep = 0;
    birthsWolfs = 0;
    eaten = 0;
    wolfsStarved = 0;

    for (let i = 0; i < noSheep; i+=1) {
      this.birthSheep();
    }
    for (let i = 0; i < noWolfs; i+=1) {
      this.birthWolf();
    }

    this.resetTime();
  }

  resetTime() {
    if (simulationVel === 0) simulationVel += err;
    intervals.push({
      interval: setInterval( () => { this.update()}, 1000 / simulationVel)
    });
  }

  update() {
    for (let w of wolfs) {
      w.update();
    }
    for (let s of sheep) {
      s.update();
    }    
  }

  birthSheep() {
    if (sheep.length + wolfs.length >= n*n*n) return;
    sheep.push(new Sheep());
  }

  birthWolf() {
    if (sheep.length + wolfs.length >= n*n*n) return;
    wolfs.push(new Wolf());
  }

  isSheep(position, idAsker) {
    for (let s of sheep) {
      if (s.id === idAsker) continue;
      let pos = s.position;
      if (Math.abs(pos[0] - position[0]) < err
      &&  Math.abs(pos[1] - position[1]) < err
      &&  Math.abs(pos[2] - position[2]) < err) {
        return true;
      }
    }
    return false;
  }
  isWolf(position, idAsker) {
    for (let w of wolfs) {
      if (w.id === idAsker) continue;
      let pos = w.position;
      if (Math.abs(pos[0] - position[0]) < err
      &&  Math.abs(pos[1] - position[1]) < err
      &&  Math.abs(pos[2] - position[2]) < err) {
        return true;
      }
    }
    return false;
  }

  updateValues() {
    step = 1/n;
    from = -border+border/n;
    to = border-1/n + border/n;
    scaleAnimals = 1/n;
  }
}
