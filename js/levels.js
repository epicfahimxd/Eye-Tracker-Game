/**
 * Level definitions for Where's Waldo — Eye Tracker Edition.
 *
 * waldoX / waldoY   – Waldo's position as a fraction [0,1] of canvas dimensions.
 * waldoScale        – Height of Waldo in canvas pixels (at reference 1200×700 canvas).
 *                     Scales proportionally at runtime.
 * detectRadius      – Gaze must land within this fraction of canvas width to count.
 * crowdCount        – Number of background people to fill the scene.
 * hintRegion        – Text hint shown when the player asks for help.
 */
const LEVELS = [
  {
    id:           1,
    name:         'Beach Day',
    icon:         '🏖️',
    timeLimit:    60,
    difficulty:   'Easy',
    diffClass:    'easy',
    theme:        'beach',
    waldoX:       0.66,
    waldoY:       0.61,
    waldoScale:   30,
    detectRadius: 0.042,
    crowdCount:   70,
    hintRegion:   'right side, middle height',
  },
  {
    id:           2,
    name:         'County Fair',
    icon:         '🎡',
    timeLimit:    45,
    difficulty:   'Medium',
    diffClass:    'medium',
    theme:        'fair',
    waldoX:       0.23,
    waldoY:       0.67,
    waldoScale:   25,
    detectRadius: 0.034,
    crowdCount:   105,
    hintRegion:   'left side, lower area',
  },
  {
    id:           3,
    name:         'City Parade',
    icon:         '🎊',
    timeLimit:    30,
    difficulty:   'Hard',
    diffClass:    'hard',
    theme:        'parade',
    waldoX:       0.79,
    waldoY:       0.41,
    waldoScale:   21,
    detectRadius: 0.028,
    crowdCount:   155,
    hintRegion:   'right side, upper area',
  },
];
