/**
 * Distance constraint between two Verlet particles.
 * Maintains a rest length, solved iteratively per frame.
 */
export default class Constraint {
  constructor(a, b) {
    this.a = a;
    this.b = b;
    this.rest = a.pos.distanceTo(b.pos);
  }

  /** Project both endpoints toward/away from rest length */
  solve() {
    const dx = this.b.pos.x - this.a.pos.x;
    const dy = this.b.pos.y - this.a.pos.y;
    const dz = this.b.pos.z - this.a.pos.z;

    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq < 1e-10) return;

    const dist = Math.sqrt(distSq);
    const correction = (dist - this.rest) / dist * 0.5;

    if (!this.a.pin) {
      this.a.pos.x += dx * correction;
      this.a.pos.y += dy * correction;
      this.a.pos.z += dz * correction;
    }
    if (!this.b.pin) {
      this.b.pos.x -= dx * correction;
      this.b.pos.y -= dy * correction;
      this.b.pos.z -= dz * correction;
    }
  }
}
