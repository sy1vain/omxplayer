"use strict";

const {spawn} = require('child_process');
const os = require('os');
const fs = require('fs');
const dbus = require('dbus-native');

const USER = os.userInfo().username;
const DBUS_ADDR = `/tmp/omxplayerdbus.${USER}`;
const DBUS_NAME = 'org.mpris.MediaPlayer2.omxplayer';
const DBUS_PATH = '/org/mpris/MediaPlayer2';
const DBUS_INTERFACE_PROPERTIES = 'org.freedesktop.DBus.Properties';
const DBUS_INTERFACE_PLAYER = 'org.mpris.MediaPlayer2.Player';
const DBUS_INTERFACE_ROOT = 'org.mpris.MediaPlayer2';

class OmxPlayer {

  constructor(){
    this.process = null;
    this.open('/home/pi/Timecoded_Big_bunny_1.mov');
  }

  open(file, options = {}){
    this.file = file;
    this.options = options;

    this._startProcess(this.options);
  }

  quit(cb){
    this._callDBusRoot('Quit', null, null, cb);
  }

  next(cb){
    this._callDBusPlayer('Next', null, null, cb);
  }

  previous(cb){
    this._callDBusPlayer('Previous', null, null, cb);
  }

  play(cb){
    this._callDBusPlayer('Play', null, null, cb);
  }

  pause(cb){
    this._callDBusPlayer('Pause', null, null, cb);
  }

  togglePlay(cb){
    this._callDBusPlayer('PlayPause', null, null, cb);
  }

  stop(cb){
    this._callDBusPlayer('Stop', null, null, cb);
  }

  seek(seconds, cb){
    this._callDBusPlayer('Seek', 'x', [ seconds*1000000 ], cb);
  }

  setPosition(seconds, cb){
    this._callDBusPlayer('SetPosition', 'ox', [ '/not/used', seconds*1000000 ], cb);
  }

  getPosition(cb){
    this._readDBusProperty('Position', (err, ...result)=>{
      if(err) return cb && cb(-1);
      return cb && cb(result / 1000000);
    });
  }


  _startProcess(options){
    if(this.process) this._stopProcess();

    let args = [];
    if(options.adev){
      args.push('--adev');
      args.push(options.adev);
    }

    if(options.blank) args.push(`--blank ${(options.blank!==true)?options.blank:''}`);
    if(options.loop) args.push('--loop');
    if(options.noOSD) args.push('--no-osd');
    if(options.noKeysD) args.push('--no-keys');
    if(options.pos){
      args.push('--pos');
      args.push(options.pos);
    }

    args.push('--dbus_name');
    args.push(DBUS_NAME);

    this.process = spawn('omxplayer', [...args, this.file], { stdio: 'pipe'});

    this.process.stdout.on('data', (data)=>{
      console.log(`omxplayer: ${data}`);
    });

    this.process.stderr.on('data', (data)=>{
      console.log(`omxplayer error: ${data}`);
    });

    this.process.on('close', (code)=>{
      console.log(`omxplayer process exited with code ${code}`);
      this.process = null;
    });
  }

  _stopProcess(){
    if(!this.process) return;
    this.process.kill();
    this.process = null;
  }

  _getDBus(cb){
    if(this.dbus) return cb && cb(this.dbus);
    fs.readFile(DBUS_ADDR, 'utf8', (err, data)=>{
      if(err) return cb && cb(null);
      if(!data.length) return cb && cb(null);
      this.dbus = dbus.sessionBus({
        busAddress: data.trim()
      });
      return cb && cb(this.dbus);
    });
  }

  _readDBusProperty(property, cb){
    this._invokeDBus(property, DBUS_INTERFACE_PROPERTIES, null, null, cb);
  }

  _callDBusPlayer(property, signature, body, cb){
    this._invokeDBus(property, DBUS_INTERFACE_PLAYER, signature, body, cb);
  }

  _callDBusRoot(property, signature, body, cb){
    this._invokeDBus(property, DBUS_INTERFACE_ROOT, signature, body, cb);
  }

  _invokeDBus(member, iface, signature, body, cb){
    this._getDBus((dbus)=>{
      if(!dbus) return cb && cb('dbus not initialized');
      dbus.invoke({
        path: DBUS_PATH,
        destination: DBUS_NAME,
        interface: iface,
        member,
        signature,
        body
      }, cb);
    });
  }
}

module.exports = OmxPlayer;
