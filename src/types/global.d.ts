export {};

declare global {
  var eskie: Record<string, any>;
  var Sequencer: any;
  var Sequence: any;
  var Tagger: any;
  var socketlib: any;
  var dnd5e: any;
  var FXMASTER: any;
  var foundrySummons: any;

  interface ModuleConfig {
    [key: string]: any;
  }

  interface FlagConfig {
    [key: string]: any;
  }

  interface SettingConfig {
    "eskie-macros.autorecTarget": string;
    "eskie-macros.enableSounds": boolean;
    "eskie-macros.worldScriptsConfig": Record<string, any>;
    "eskie-macros.autorecVersion": string;
    "eskie-macros.blfxAutorecVersion": string;
    "eskie-macros.logVerbosity": string;
    "sequencer.user-effect-opacity": number;
    "autoanimations.aaAutorec": Record<string, any>;
    "boss-loot-fx.blfxCustomAutoRecUpdates": boolean;
    "boss-loot-fx.blfxAutoRec": Record<string, any>;
  }

  namespace Hooks {
    interface HookConfig {
      'aa.ready': () => void;
      'socketlib.ready': () => void;
      'blfx.register.CustomAutoRec': (...args: any[]) => void;
    }
  }

  interface CONFIG {
    DND5E?: any;
    PF1?: any;
    PF2E?: any;
  }

  type SoundConfig = import('./animation.js').SoundConfig;
  type Dependency = import('./animation.js').Dependency;
  type TrapConfig = import('./animation.js').TrapConfig;
  type ConcreteToken = import('./animation.js').ConcreteToken;
  type ConcreteTile = import('./animation.js').ConcreteTile;
  type CasterProxy = import('./animation.js').CasterProxy;
  type AnimationEffectModule<TConfig = Record<string, unknown>> = import('./animation.js').AnimationEffectModule<TConfig>;
  type TrapModule<TConfig extends TrapConfig = TrapConfig> = import('./animation.js').TrapModule<TConfig>;
  type SummonOptions = import('./animation.js').SummonOptions;
  type SummonConfig = import('./animation.js').SummonConfig;
  type SummonModule<TConfig extends SummonConfig = SummonConfig> = import('./animation.js').SummonModule<TConfig>;

  type Dnd5eSkill = import('./systems.js').Dnd5eSkill;
  type Dnd5eTool = import('./systems.js').Dnd5eTool;
  type Dnd5eActivity = import('./systems.js').Dnd5eActivity;
  type Dnd5eTraitData = import('./systems.js').Dnd5eTraitData;
  type Dnd5eSensesData = import('./systems.js').Dnd5eSensesData;
  type Actor5e = import('./systems.js').Actor5e;
  type Item5e = import('./systems.js').Item5e;
  type Pf1Skill = import('./systems.js').Pf1Skill;
  type Pf1TraitData = import('./systems.js').Pf1TraitData;
  type ActorPF = import('./systems.js').ActorPF;
  type ItemPF = import('./systems.js').ItemPF;
  type Pf2eStatistic = import('./systems.js').Pf2eStatistic;
  type ActorPF2e = import('./systems.js').ActorPF2e;
  type ItemPF2e = import('./systems.js').ItemPF2e;
}

declare module 'fvtt-types/configuration' {
  interface AssumeHookRan {
    ready: true;
  }

  interface SettingConfig {
    "eskie-macros.autorecTarget": string;
    "eskie-macros.enableSounds": boolean;
    "eskie-macros.worldScriptsConfig": Record<string, any>;
    "eskie-macros.autorecVersion": string;
    "eskie-macros.blfxAutorecVersion": string;
    "eskie-macros.logVerbosity": string;
    "sequencer.user-effect-opacity": number;
    "autoanimations.aaAutorec": Record<string, any>;
    "boss-loot-fx.blfxCustomAutoRecUpdates": boolean;
    "boss-loot-fx.blfxAutoRec": Record<string, any>;
  }

  namespace Hooks {
    interface HookConfig {
      'aa.ready': () => void;
      'socketlib.ready': () => void;
      'blfx.register.CustomAutoRec': (...args: any[]) => void;
    }
  }
}
