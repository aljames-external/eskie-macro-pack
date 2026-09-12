export interface SoundConfig {
    enable: boolean;
    file?: string;
    delay?: number;
    volume?: number;
    fadeIn?: number;
    fadeOut?: number;
    startTime?: number | null;
    endTime?: number | null;
    timeRange?: [number, number];
    repeats?: number | [number, number, number];
}

export interface Dependency {
    id: string;
    min?: string;
    max?: string;
    ref?: string;
    description?: string;
    url?: string;
}

export interface TrapConfig {
    fadeTime?: number;
    sound?: SoundConfig;
    targetLocation?: { x: number; y: number } | string | null;
    pushDistance?: number;
    textureSrc?: string;
    playbackRate?: number;
    [key: string]: unknown;
}

export type ConcreteToken = Token;
export type ConcreteTile = Tile;

export interface AnimationEffectModule<TConfig = Record<string, unknown>> {
    create: (target: Token, config?: TConfig) => Promise<any>;
    play: (target: Token, config?: TConfig) => Promise<any>;
    stop?: (target: Token, config?: TConfig) => Promise<void>;
    default_config: TConfig;
}

export interface TrapModule<TConfig extends TrapConfig = TrapConfig> {
    create: (tile: Tile, targets?: Token[], config?: TConfig) => Promise<any>;
    play: (tile: Tile, targets?: Token[], config?: TConfig) => Promise<any>;
    stop?: (tile: Tile, config?: TConfig) => Promise<void>;
    setup?: (config?: Record<string, unknown>) => Promise<any>;
    default_config: TConfig;
}

export interface SummonOptions {
    actor?: Actor | string | null;
    uuid?: string | null;
    crosshairParameters?: Record<string, unknown>;
    crosshairCallbacks?: Record<string, unknown>;
    tokenData?: Record<string, unknown>;
    location?: { x: number; y: number } | null;
    drawPing?: boolean;
    [key: string]: unknown;
}

export interface SummonConfig {
    id?: string;
    summonConfig?: SummonOptions;
    sound?: SoundConfig | Record<string, any>;
    [key: string]: unknown;
}

export interface SummonModule<TConfig extends SummonConfig = SummonConfig> {
    create: (token: Token, summonTarget?: Token | Actor, config?: TConfig) => Promise<any>;
    play: (token: Token, summonTarget: Token | Actor, config?: TConfig) => Promise<any>;
    stop?: (token: Token, summonTarget?: Token | Actor, config?: TConfig) => Promise<void>;
    default_config: TConfig;
}

