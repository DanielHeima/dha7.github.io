export default class Mario {
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
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertRight), gl.DYNAMIC_DRAW );
  }

  update() {

    if (!right) {
      this.vertices = this.vertLeft;
    } else {
      this.vertices = this.vertRight
    }
    this.pos[0] += this.velX;
    this.pos[1] += this.velY;
  }

  render() {
    gl.clear( gl.COLOR_BUFFER_BIT );    
    gl.uniform2fv( locBox, flatten(this.pos) );
    gl.drawArrays( gl.TRIANGLES, 0, 3 );
  }
}