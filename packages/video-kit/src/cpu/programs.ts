import type {ToyProgram} from './cpu-types';

/**
 * Program 1: compute 5 + 3 and store the result in cell 14.
 *
 * @example
 * memoryImage(ADD_PROGRAM); // [0,0,0,0,0x1c,0x2d,0x4e,0,0,0,0,0,5,3,0,0]
 */
export const ADD_PROGRAM: ToyProgram = {
  name: 'add',
  base: 4,
  entry: 4,
  code: ['LOAD 12', 'ADD 13', 'STORE 14', 'HALT'],
  data: {12: 5, 13: 3, 14: 0},
};

/**
 * Program 2: count n down to zero in a loop, starting with n = 3.
 *
 * @example
 * memoryImage(COUNTDOWN_PROGRAM)[13]; // 3
 */
export const COUNTDOWN_PROGRAM: ToyProgram = {
  name: 'countdown',
  base: 4,
  entry: 4,
  code: ['LOAD 13', 'JZ 9', 'SUB 14', 'STORE 13', 'JUMP 4', 'HALT'],
  data: {13: 3, 14: 1},
};
