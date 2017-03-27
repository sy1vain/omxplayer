"use strict";

const {spawn, exec} = require('child_process');
const EventEmitter = require('events');
const os = require('os');
const fs = require('fs');
const dbus = require('dbus-native');
const ps = require('ps-node');

const USER = os.userInfo().username;
const DBUS_ADDR = `/tmp/omxplayerdbus.${USER}`;
const DBUS_NAME = 'org.mpris.MediaPlayer2.omxplayer';
const DBUS_PATH = '/org/mpris/MediaPlayer2';
const DBUS_INTERFACE_PROPERTIES = 'org.freedesktop.DBus.Properties';
const DBUS_INTERFACE_PLAYER = 'org.mpris.MediaPlayer2.Player';
const DBUS_INTERFACE_ROOT = 'org.mpris.MediaPlayer2';

let INSTANCE_COUNT = 0;

class OmxPlayer extends EventEmitter {

  constructor(){
    super();
    this.process = null;
    this.instance = INSTANCE_COUNT++;
  }

  kill(cb){
    return this._stopProcess(cb);
  }

  open(file, options = {}, cb){
    this.file = file;
    this.options = options;

    return this._startProcess(this.options, cb);
  }

  isRunning(cb){
    cb && cb(!!this.process);
    if(this.process) return Promise.resolve();
    return Promise.reject('not running');
  }

  getChildPid(cb){
    return this.isRunning().then(()=>{
      if(this.child_process){
        cb && cb(this.child_process);
        return this.child_process;
      }

      return new Promise((resolve, reject)=>{
        ps.lookup({
          command: 'omxplayer.bin',
          psargs: '-le',
          ppid: this.process.pid
        }, (err, results)=>{
          if(results.length!=1) return reject('no matching process found');
          let result = results.shift();
          cb && cb(result.pid);
          resolve(result.pid);
        });
      });
    })
  }

  quit(cb){
    return this._invokeDBus('Quit', DBUS_INTERFACE_ROOT, null, null, cb);
  }

  next(cb){
    return this._invokeDBus('Next', DBUS_INTERFACE_PLAYER, null, null, cb);
  }

  previous(cb){
    return this._invokeDBus('Previous', DBUS_INTERFACE_PLAYER, null, null, cb);
  }

  play(cb){
    // this is described in the api, but does not seem to work
    // this._invokeDBus('Play', DBUS_INTERFACE_PLAYER, null, null, cb);
    return this.getPlaying((err, playing)=>{
      if(err) return cb && cb(err);
      if(playing) return cb && cb();
    }).then((playing)=>{
      if(playing) return Promise.resolve();
      return this.togglePlay(cb);
    });
  }

  pause(cb){
    return this._invokeDBus('Pause', DBUS_INTERFACE_PLAYER, null, null, cb);
  }

  togglePlay(cb){
    return this._invokeDBus('PlayPause', DBUS_INTERFACE_PLAYER, null, null, cb);
  }

  stop(cb){
    return this._invokeDBus('Stop', DBUS_INTERFACE_PLAYER, null, null, cb);
  }

  seek(seconds, cb){
    return this._invokeDBus('Seek', DBUS_INTERFACE_PLAYER, 'x', [ seconds*1000000 ], (err, offset)=>{
      if(err || offset==null) return cb && cb(err, null);
      return cb && cb(null, offset/1000000);
    }).then((offset)=>{
      if(offset==null) return Promise.reject();
      return offset/1000000;
    });
  }

  setPosition(seconds, cb){
    return this._invokeDBus('SetPosition', DBUS_INTERFACE_PLAYER, 'ox', [ '/not/used', seconds*1000000 ], (err, position)=>{
      if(err || position==null) return cb && cb(err, null);
      return cb && cb(null, position/1000000);
    }).then((position)=>{
      if(position==null) return Promise.reject();
      return position/1000000;
    });
  }

  mute(cb){
    return this._invokeDBus('Mute', DBUS_INTERFACE_PLAYER, null, null, cb);
  }

  unmute(cb){
    return this._invokeDBus('Unmute', DBUS_INTERFACE_PLAYER, null, null, cb);
  }

  getCanSeek(cb){
    return this._invokeDBus('CanSeek', DBUS_INTERFACE_PROPERTIES, null, null, cb);
  }

  getCanPlay(cb){
    return this._invokeDBus('CanPlay', DBUS_INTERFACE_PROPERTIES, null, null, cb);
  }

  getCanPause(cb){
    return this._invokeDBus('CanPause', DBUS_INTERFACE_PROPERTIES, null, null, cb);
  }

  getPlaybackStatus(cb){
    return this._invokeDBus('PlaybackStatus', DBUS_INTERFACE_PROPERTIES, null, null, cb);
  }

  getPlaying(cb){
    return this.getPlaybackStatus((err, status)=>{
      return cb && cb(err, status=='Playing');
    }).then((status)=>{
      return status=='Playing';
    });
  }

  getPaused(cb){
    return this.getPlaybackStatus((err, status)=>{
      return cb && cb(err, status=='Paused');
    }).then((status)=>{
      return status=='Paused';
    });
  }

  getVolume(cb){
    return this._invokeDBus('Volume', DBUS_INTERFACE_PROPERTIES, null, null, cb);
  }

  setVolume(volume, cb){
    return this._invokeDBus('Volume', DBUS_INTERFACE_PROPERTIES, 'd', [volume], cb);
  }

  getPosition(cb){
    return this._invokeDBus('Position', DBUS_INTERFACE_PROPERTIES, null, null, (err, ...result)=>{
      if(err) return cb && cb(err, null);
      return cb && cb(null, result / 1000000);
    }).then((position)=>{
      return position/1000000;
    });
  }

  getDuration(cb){
    return this._invokeDBus('Duration', DBUS_INTERFACE_PROPERTIES, null, null, (err, ...result)=>{
      if(err) return cb && cb(err, null);
      return cb && cb(null, result / 1000000);
    }).then((result)=>{
      return result/1000000;
    });
  }

  //copied from dbuscontrol.sh
  setAlpha(alpha, cb){
    return this._invokeDBus('SetAlpha', DBUS_INTERFACE_PLAYER, 'ox', [ '/not/used', alpha], cb);
  }

  setVideoPos(x1, y1, x2, y2, cb){
    let unpack = function(result){
      result = result.split(' ');
      result.forEach((r, i, l)=>{
        l[i] = parseInt(r);
      });
      return result;
    }

    return this._invokeDBus('VideoPos', DBUS_INTERFACE_PLAYER, 'os', [ '/not/used', `${x1} ${y1} ${x2} ${y2}`], (err, ...result)=>{
      if(err) return cb && cb(err, null);
      return cb && cb(null, unpack(result));
    }).then((result)=>{
      return unpack(result);
    });
  }

  setVideoCropPos(x1, y1, x2, y2, cb){
    let unpack = function(result){
      result = result.split(' ');
      result.forEach((r, i, l)=>{
        l[i] = parseInt(r);
      });
      return result;
    }

    return this._invokeDBus('SetVideoCropPos', DBUS_INTERFACE_PLAYER, 'os', [ '/not/used', `${x1} ${y1} ${x2} ${y2}`], (err, ...result)=>{
      if(err) return cb && cb(err, null);
      return cb && cb(null, unpack(result));
    }).then((result)=>{
      return unpack(result);
    });
  }

  setAspectMode(mode, cb){
    return this._invokeDBus('SetAspectMode', DBUS_INTERFACE_PLAYER, 'os', [ '/not/used', mode], cb);
  }

  _startProcess(options, cb){
    return this._stopProcess().then(()=>{
      let args = [];
      for(let key of Object.keys(options)){
        let value = options[key];
        if(value===false) continue;
        args.push(`${(key.length==1)?'-':'--'}${key}`);
        if(value===true) continue;
        args.push(value);
      }

      args.push('--dbus_name');
      args.push(DBUS_NAME + this.instance);

      this.dbus = null;
      this.process = spawn('omxplayer', [...args, this.file], { stdio: 'pipe'});

      this.process.stdout.on('data', (data)=>{
        this.emit('stdout', data);
      });

      this.process.stderr.on('data', (data)=>{
        this.emit('stderr', data);
      });

      this.process.on('error', (err)=>{
        this.emit('error', err);
      });

      this.process.on('close', (code)=>{
        this.process = null;
        this.child_process = null;
        this.dbus = null;
        this.emit('close', code);
      });

      cb && cb();
      return Promise.resolve();
    });
  }

  _stopProcess(cb){
    return this.isRunning().then(()=>{
      return this.getChildPid();
    }).then((pid)=>{
      return new Promise((resolve, reject)=>{
        ps.kill(pid, resolve);
      });
    }).then(()=>{
      if(this.process){
        this.process.removeAllListeners();
      }
      this.process = null;
      this.child_process = null;
      this.dbus = null;

      cb && cb();
    }).catch(()=>{
      return Promise.resolve();
    });
  }

  _getDBus(){
    if(this.dbus) return Promise.resolve(this.dbus);
    return new Promise((resolve, reject)=>{
      fs.readFile(DBUS_ADDR, 'utf8', (err, data)=>{
        if(err) return reject(err);
        if(!data.length) return reject('no data in dbus file');
        this.dbus = dbus.sessionBus({
          busAddress: data.trim()
        });
        resolve(this.dbus);
      });
    });
  }

  _invokeDBus(member, iface, signature, body, cb){
    return this.getChildPid().then(()=>{
      return this._getDBus();
    }).then((dbus)=>{
      if(!dbus){
        cb && cb('dbus not initialized');
        return Promise.reject('dbus not initialized');
      }

      return new Promise((resolve, reject)=>{
        dbus.invoke({
          path: DBUS_PATH,
          destination: DBUS_NAME + this.instance,
          interface: iface,
          member,
          signature,
          body
        }, (err, ...results)=>{
          cb && cb(err, ...results);
          if(err) return reject(err);
          resolve(...results);
        });
      });
    });
  }
}

module.exports = OmxPlayer;
