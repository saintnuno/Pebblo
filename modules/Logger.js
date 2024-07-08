const log = require('js-logs');
const fs = require('fs');

class Logger {
  static error(...error) {
    console.log(log.red(`[ERROR] ${error.toString()}`));
    let content = fs.readFileSync('./error/log.txt');
    fs.writeFileSync('./error/log.txt', `${content}\n[ERROR] ${error.toString()}`);
  }

  static info(...info) {
    console.log(log.cyan(`[INFO] ${info.toString()}`));
    let content = fs.readFileSync('./error/log.txt');
    fs.writeFileSync('./error/log.txt', `${content}\n[INFO] ${info.toString()}`);
  }

  static warn(...warn) {
    console.log(log.yellow(`[WARN] ${warn.toString()}`));
    let content = fs.readFileSync('./error/log.txt');
    fs.writeFileSync('./error/log.txt', `${content}\n[WARN] ${warn.toString()}`);
  }
  
  static db(...db) {
    console.log(log.magenta(`[DATABASE] ${db.toString()}`));
    let content = fs.readFileSync('./error/log.txt');
    fs.writeFileSync('./error/log.txt', `${content}\n[DATABASE] ${db.toString()}`);
  }

  static log(...log) {
    console.log(`${log.toString()}`);
    let content = fs.readFileSync('./error/log.txt');
    fs.writeFileSync('./error/log.txt', `${content}\n${log.toString()}`);
  }
}

module.exports = Logger;