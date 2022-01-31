
class Mario {
  right = true;
  jumping = false;
  constructor(x, y, velX = 0, velY = 0) {
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

  render(gl) {
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);   
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.DYNAMIC_DRAW );
    gl.uniform2fv( position, flatten(this.pos) );
  }
}