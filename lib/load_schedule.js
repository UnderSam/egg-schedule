'use strict';

const fs = require('fs');
const read = require('fs-readdir-recursive');
const path = require('path');
const assert = require('assert');
const is = require('is-type-of');
const co = require('co');

module.exports = function(app) {
  const dirs = app.loader.loadDirs();
  const baseDir = app.config.baseDir;

  const schedules = {};
  for (const dir of dirs) {
    const schedulePath = path.join(dir, 'app/schedule');
    if (!fs.existsSync(schedulePath)) {
      continue;
    }
    if (!fs.lstatSync(schedulePath).isDirectory()) {
      continue;
    }

    read(schedulePath).forEach(s => {
      s = path.join(schedulePath, s);
      let schedule = require(s);

      // support dynamic schedule
      if (typeof schedule === 'function') {
        schedule = schedule(app);
      }
      assert(schedule.schedule, `schedule(${s}): must have schedule and task properties`);
      assert(is.generatorFunction(schedule.task), `schedule(${s}: task must be generator function`);

      s = path.relative(baseDir, s);
      schedules[s] = {
        schedule: schedule.schedule,
        task: co.wrap(schedule.task),
        key: `egg-schedule:${s}`,
      };
    });
  }
  return schedules;
};