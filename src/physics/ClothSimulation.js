import { Vector3 } from 'three';
import Particle from './Particle.js';
import Constraint from './Constraint.js';

/** Default simulation parameters */
const DEFAULTS = {
  gravity: -4.5,
  damping: 0.985,
  iterations: 10,
  windStrength: 0.08,
  groundY: -0.235,
};

/**
 * Verlet cloth/paper simulation.
 * Manages particles, constraints, and per-frame physics updates.
 */
export default class ClothSimulation {
  /**
   * @param {object} opts
   * @param {number} opts.width    - World-space width
   * @param {number} opts.height   - World-space height
   * @param {number} opts.cols     - Grid columns
   * @param {number} opts.rows     - Grid rows
   * @param {object} [opts.params] - Physics parameters override
   */
  constructor({ width, height, cols, rows, params = {} }) {
    this.width = width;
    this.height = height;
    this.cols = cols;
    this.rows = rows;
    this.sx = cols + 1;
    this.sy = rows + 1;
    this.cw = width / cols;
    this.ch = height / rows;
    this.params = { ...DEFAULTS, ...params };

    this.particles = [];
    this.constraints = [];

    this._initParticles();
    this._initConstraints();
  }

  /** Index helper */
  idx(x, y) {
    return y * this.sx + x;
  }

  /** Create particles bottom-to-top (matches Three.js PlaneGeometry vertex order) */
  _initParticles() {
    const { sx, sy, cw, ch, width, height } = this;

    for (let gy = 0; gy < sy; gy++) {
      for (let gx = 0; gx < sx; gx++) {
        const visRow = (sy - 1) - gy;
        const x = gx * cw - width / 2;
        const y = -visRow * ch;
        const p = new Particle(x, y, 0);
        p.u = gx / (sx - 1);
        p.v = visRow / (sy - 1);
        this.particles.push(p);
      }
    }

    // Pin top edge (gy = sy-1)
    for (let gx = 0; gx < sx; gx++) {
      this.particles[this.idx(gx, sy - 1)].pin = true;
    }
  }

  /** Build structural, shear, and bend constraints */
  _initConstraints() {
    const { sx, sy } = this;

    for (let y = 0; y < sy; y++) {
      for (let x = 0; x < sx; x++) {
        // Structural (adjacent)
        if (x < sx - 1) this._addConstraint(x, y, x + 1, y);
        if (y < sy - 1) this._addConstraint(x, y, x, y + 1);

        // Shear (diagonal)
        if (x < sx - 1 && y < sy - 1) {
          this._addConstraint(x, y, x + 1, y + 1);
          this._addConstraint(x + 1, y, x, y + 1);
        }

        // Bend (skip-one)
        if (x < sx - 2) this._addConstraint(x, y, x + 2, y);
        if (y < sy - 2) this._addConstraint(x, y, x, y + 2);
      }
    }
  }

  _addConstraint(x1, y1, x2, y2) {
    this.constraints.push(
      new Constraint(this.particles[this.idx(x1, y1)], this.particles[this.idx(x2, y2)])
    );
  }

  /** Advance one physics frame */
  step(dt) {
    const { gravity, damping, iterations, windStrength, groundY } = this.params;
    const now = performance.now();
    const grav = new Vector3(0, gravity, 0);

    // 1. Apply forces
    for (const p of this.particles) {
      if (p.pin) continue;
      p.force(grav);

      // Subtle wind flutter
      const w = (Math.sin(now * 0.0018 + p.pos.y * 25)
               + Math.sin(now * 0.0031 + p.pos.x * 40)) * 0.5;
      p.force(new Vector3(w * windStrength, 0, w * windStrength * 0.25));
    }

    // 2. Verlet integration
    for (const p of this.particles) {
      p.step(dt, damping);
    }

    // 3. Iterative constraint solving
    for (let i = 0; i < iterations; i++) {
      for (const c of this.constraints) {
        c.solve();
      }
    }

    // 4. Ground collision
    for (const p of this.particles) {
      if (!p.pin && p.pos.y < groundY) {
        p.pos.y = groundY;
        p.old.x = p.pos.x;
        p.old.z = p.pos.z;
      }
    }
  }
}
