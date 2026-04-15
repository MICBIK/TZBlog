import * as migration_20260415_081612_init from './20260415_081612_init';

export const migrations = [
  {
    up: migration_20260415_081612_init.up,
    down: migration_20260415_081612_init.down,
    name: '20260415_081612_init'
  },
];
