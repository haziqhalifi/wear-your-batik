import { MathUtils, PerspectiveCamera, Spherical, Vector3 } from 'three';

/** Orbit around the garment, never through it when changing to the back view. */
export class CameraMotion {
  private transition: {
    from: Spherical; to: Spherical; fromTarget: Vector3; toTarget: Vector3;
    started: number; duration: number;
  } | null = null;

  constructor(private camera: PerspectiveCamera, private target: Vector3) {}

  get active() { return this.transition !== null; }
  get destination() {
    return this.transition?.to.clone() ?? new Spherical().setFromVector3(this.camera.position.clone().sub(this.target));
  }

  move(to: Spherical, target: Vector3, now: number, duration = 620) {
    const from = new Spherical().setFromVector3(this.camera.position.clone().sub(this.target));
    const destination = to.clone();
    destination.theta = from.theta + Math.atan2(Math.sin(to.theta - from.theta), Math.cos(to.theta - from.theta));
    this.transition = { from, to: destination, fromTarget: this.target.clone(), toTarget: target.clone(), started: now, duration };
    if (duration === 0) this.finish();
  }

  update(now: number) {
    const motion = this.transition;
    if (!motion) return false;
    const t = MathUtils.clamp((now - motion.started) / motion.duration, 0, 1);
    const eased = t * t * t * (t * (t * 6 - 15) + 10);
    const orbit = new Spherical(
      MathUtils.lerp(motion.from.radius, motion.to.radius, eased),
      MathUtils.lerp(motion.from.phi, motion.to.phi, eased),
      MathUtils.lerp(motion.from.theta, motion.to.theta, eased),
    );
    this.target.lerpVectors(motion.fromTarget, motion.toTarget, eased);
    this.camera.position.copy(this.target).add(new Vector3().setFromSpherical(orbit));
    this.camera.lookAt(this.target);
    if (t === 1) this.transition = null;
    return true;
  }

  finish() {
    if (this.transition) this.update(this.transition.started + Math.max(this.transition.duration, 1));
  }

  cancel() { this.transition = null; }
}
