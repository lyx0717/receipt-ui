import { Vector3 } from 'three';

/**
 * Verlet integration particle.
 * Tracks current + previous position to derive implicit velocity.
 */
export default class Particle {
  constructor(x, y, z) {
    this.pos = new Vector3(x, y, z);
    this.old = new Vector3(x, y, z);
    this.acc = new Vector3();
    this.pin = false;
    this.u = 0; // texture coordinate u
    this.v = 0; // texture coordinate v
  }

  /** Accumulate a force vector */
  force(f) {
    this.acc.add(f);
  }

  /** Verlet integration step with damping */
  step(dt, damping) {
    if (this.pin) {
      this.acc.set(0, 0, 0);
      return;
    }

    const vx = (this.pos.x - this.old.x) * damping;
    const vy = (this.pos.y - this.old.y) * damping;
    const vz = (this.pos.z - this.old.z) * damping;

    this.old.copy(this.pos);

    this.pos.x += vx + this.acc.x * dt * dt;
    this.pos.y += vy + this.acc.y * dt * dt;
    this.pos.z += vz + this.acc.z * dt * dt;

    this.acc.set(0, 0, 0);
  }
}
