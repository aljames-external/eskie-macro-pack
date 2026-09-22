export interface MotionMoveOptions {
  duration: number;
  ease?: string;
  rotate?: boolean;
  offset?: { x?: number; y?: number };
  gridUnits?: boolean;
  [key: string]: any;
}

export interface MotionRotateOptions {
  duration: number;
  ease?: string;
  [key: string]: any;
}

export interface MotionRotateTowardsOptions {
  duration?: number;
  ease?: string;
  [key: string]: any;
}

export interface MotionScaleOptions {
  duration: number;
  ease?: string;
  [key: string]: any;
}

export interface MotionFadeOptions {
  duration: number;
  ease?: string;
  [key: string]: any;
}

export interface MotionTintOptions {
  duration: number;
  ease?: string;
  [key: string]: any;
}

export interface MotionOscillateOptions {
  period: number;
  amplitude?: number;
  [key: string]: any;
}

export interface MotionNoiseOptions {
  duration: number;
  strength?: number;
  frequency?: number;
  gridUnits?: boolean;
  [key: string]: any;
}

export interface MotionSection {
  name(name: string): MotionSection;
  moveTo(target: { x: number; y: number } | any, options: MotionMoveOptions): MotionSection;
  moveBy(offset: { x?: number; y?: number }, options: MotionMoveOptions): MotionSection;
  rotateTo(angle: number, options: MotionRotateOptions): MotionSection;
  rotateBy(angle: number, options: MotionRotateOptions): MotionSection;
  rotateTowards(target: { x: number; y: number } | any, options?: MotionRotateTowardsOptions): MotionSection;
  scaleTo(scale: number | { x: number; y: number }, options: MotionScaleOptions): MotionSection;
  fadeTo(opacity: number, options: MotionFadeOptions): MotionSection;
  tintTo(color: string | number, options: MotionTintOptions): MotionSection;
  oscillate(options: MotionOscillateOptions): MotionSection;
  noise(options: MotionNoiseOptions): MotionSection;

  // Root Sequence chaining extensions
  effect(file?: string | Function | null | undefined): EffectSection;
  motion(target: any): MotionSection;
  animation(target?: any): AnimationSection;
  sound(file?: string | null | undefined): SoundSection;
  wait(duration?: number): SequenceBuilder;
  thenDo(callback: () => void | Promise<void>): SequenceBuilder;
  canvasPan(options?: any): SequenceBuilder;
  shake(options?: any): SequenceBuilder;
  play(options?: { preload?: boolean }): Promise<void>;
  addSequence(sequence: any): SequenceBuilder;
  [key: string]: any;
}

export interface EffectSection {
  file(file?: string | Function | null | undefined): EffectSection;
  name(name?: string): EffectSection;
  atLocation(location?: any, options?: any): EffectSection;
  attachTo(target?: any, options?: any): EffectSection;
  stretchTo(target?: any, options?: any): EffectSection;
  scale(scale?: number | { x?: number; y?: number } | any): EffectSection;
  scaleToObject(scale?: number, options?: any): EffectSection;
  size(size?: number | { width?: number; height?: number } | any, options?: any): EffectSection;
  opacity(opacity?: number): EffectSection;
  fadeIn(duration?: number, options?: any): EffectSection;
  fadeOut(duration?: number, options?: any): EffectSection;
  scaleIn(scale?: number, duration?: number, options?: any): EffectSection;
  scaleOut(scale?: number, duration?: number, options?: any): EffectSection;
  rotate(angle?: number): EffectSection;
  rotateIn(angle?: number, duration?: number, options?: any): EffectSection;
  rotateOut(angle?: number, duration?: number, options?: any): EffectSection;
  rotateTowards(target?: any, options?: any): EffectSection;
  randomRotation(): EffectSection;
  randomizeMirrorX(): EffectSection;
  mirrorX(mirror?: boolean): EffectSection;
  mirrorY(mirror?: boolean): EffectSection;
  duration(duration?: number): EffectSection;
  delay(delay?: number | [number, number], maxDelay?: number): EffectSection;
  startTime(time?: number): EffectSection;
  endTime(time?: number): EffectSection;
  playbackRate(rate?: number): EffectSection;
  repeats(count?: number, delayMin?: number, delayMax?: number): EffectSection;
  filter(filterType?: string, options?: any): EffectSection;
  mask(target?: any): EffectSection;
  tint(color?: string | number): EffectSection;
  belowTokens(below?: boolean): EffectSection;
  aboveLighting(above?: boolean): EffectSection;
  zIndex(index?: number): EffectSection;
  persist(persist?: boolean, options?: any): EffectSection;
  private(isPrivate?: boolean): EffectSection;
  waitUntilFinished(delay?: number): EffectSection;
  copySprite(target?: any): EffectSection;
  shape(type?: string, options?: any): EffectSection;
  text(text?: string, options?: any): EffectSection;
  loopProperty(category?: string, property?: string, options?: any): EffectSection;
  animateProperty(category?: string, property?: string, options?: any): EffectSection;
  spriteOffset(offset?: { x?: number; y?: number }, options?: any): EffectSection;
  spriteAnchor(anchor?: { x?: number; y?: number }): EffectSection;
  spriteRotation(angle?: number): EffectSection;
  spriteScale(scale?: number | { x?: number; y?: number }, options?: any): EffectSection;
  extraEndDuration(duration?: number): EffectSection;
  setMustache(mustacheObj?: Record<string, any>): EffectSection;
  moveTowards(target?: any, options?: any): EffectSection;
  moveSpeed(speed?: number): EffectSection;
  anchor(anchor?: { x?: number; y?: number }): EffectSection;
  center(): EffectSection;

  // Root Sequence chaining extensions
  effect(file?: string | Function | null | undefined): EffectSection;
  motion(target: any): MotionSection;
  animation(target?: any): AnimationSection;
  sound(file?: string | null | undefined): SoundSection;
  wait(duration?: number): SequenceBuilder;
  thenDo(callback: () => void | Promise<void>): SequenceBuilder;
  canvasPan(options?: any): SequenceBuilder;
  shake(options?: any): SequenceBuilder;
  play(options?: { preload?: boolean }): Promise<void>;
  addSequence(sequence: any): SequenceBuilder;
  [key: string]: any;
}

export interface AnimationSection {
  on(target?: any): AnimationSection;
  teleportTo(location?: any, options?: any): AnimationSection;
  snapToGrid(snap?: boolean): AnimationSection;
  offset(offset?: { x?: number; y?: number }): AnimationSection;
  opacity(opacity?: number): AnimationSection;
  duration(duration?: number): AnimationSection;
  waitUntilFinished(delay?: number): AnimationSection;
  show(show?: boolean): AnimationSection;
  hide(hide?: boolean): AnimationSection;
  delay(delay?: number): AnimationSection;

  // Root Sequence chaining extensions
  effect(file?: string | Function | null | undefined): EffectSection;
  motion(target: any): MotionSection;
  animation(target?: any): AnimationSection;
  sound(file?: string | null | undefined): SoundSection;
  wait(duration?: number): SequenceBuilder;
  thenDo(callback: () => void | Promise<void>): SequenceBuilder;
  canvasPan(options?: any): SequenceBuilder;
  shake(options?: any): SequenceBuilder;
  play(options?: { preload?: boolean }): Promise<void>;
  addSequence(sequence: any): SequenceBuilder;
  [key: string]: any;
}

export interface SoundSection {
  file(file?: string | null | undefined): SoundSection;
  volume(vol?: number): SoundSection;
  fadeInAudio(duration?: number): SoundSection;
  fadeOutAudio(duration?: number): SoundSection;
  delay(delay?: number): SoundSection;
  startTime(time?: number): SoundSection;
  endTime(time?: number): SoundSection;
  duration(duration?: number): SoundSection;
  repeats(count?: number, delayMin?: number, delayMax?: number): SoundSection;

  // Root Sequence chaining extensions
  effect(file?: string | Function | null | undefined): EffectSection;
  motion(target: any): MotionSection;
  animation(target?: any): AnimationSection;
  sound(file?: string | null | undefined): SoundSection;
  wait(duration?: number): SequenceBuilder;
  thenDo(callback: () => void | Promise<void>): SequenceBuilder;
  canvasPan(options?: any): SequenceBuilder;
  shake(options?: any): SequenceBuilder;
  play(options?: { preload?: boolean }): Promise<void>;
  addSequence(sequence: any): SequenceBuilder;
  [key: string]: any;
}

export interface SequenceBuilder {
  effect(file?: string | Function | null | undefined): EffectSection;
  motion(target: any): MotionSection;
  animation(target?: any): AnimationSection;
  sound(file?: string | null | undefined): SoundSection;
  wait(duration?: number): SequenceBuilder;
  thenDo(callback: () => void | Promise<void>): SequenceBuilder;
  canvasPan(options?: any): SequenceBuilder;
  shake(options?: any): SequenceBuilder;
  preset(name: string, ...args: any[]): SequenceBuilder;
  addSequence(sequence: any): SequenceBuilder;
  play(options?: { preload?: boolean }): Promise<void>;
  [key: string]: any;
}

export interface SequenceConstructor {
  new (moduleName?: string): SequenceBuilder;
}
