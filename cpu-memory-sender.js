const osu = require("node-os-utils");
const cpu = osu.cpu;

cpu.usage().then(cpuPercentage => {
  console.log(cpuPercentage); // 10.38
});

const osCmd = osu.osCmd;

osCmd.whoami().then(userName => {
  console.log(userName); // admin
});
