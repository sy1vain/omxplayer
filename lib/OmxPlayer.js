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
    this._invokeDBus('Quit', DBUS_INTERFACE_ROOT, null, null, cb);
  }

  next(cb){
    this._invokeDBus('Next', DBUS_INTERFACE_PLAYER, null, null, cb);
  }

  previous(cb){
    this._invokeDBus('Previous', DBUS_INTERFACE_PLAYER, null, null, cb);
  }

  play(cb){
    this._invokeDBus('Play', DBUS_INTERFACE_PLAYER, null, null, cb);
  }

  pause(cb){
    this._invokeDBus('Pause', DBUS_INTERFACE_PLAYER, null, null, cb);
  }

  togglePlay(cb){
    this._invokeDBus('PlayPause', DBUS_INTERFACE_PLAYER, null, null, cb);
  }

  stop(cb){
    this._invokeDBus('Stop', DBUS_INTERFACE_PLAYER, null, null, cb);
  }

  seek(seconds, cb){
    this._invokeDBus('Seek', DBUS_INTERFACE_PLAYER, 'x', [ seconds*1000000 ], (err, offset)=>{
      if(err || offset==null) return cb && cb(err, null);
      return cb && cb(null, offset/1000000);
    });
  }

  setPosition(seconds, cb){
    this._invokeDBus('SetPosition', DBUS_INTERFACE_PLAYER, 'ox', [ '/not/used', seconds*1000000 ], (err, position)=>{
      if(err || position==null) return cb && cb(err, null);
      return cb && cb(null, position/1000000);
    });
  }

  mute(cb){
    this._invokeDBus('Mute', DBUS_INTERFACE_PLAYER, null, null, cb);
  }

  unmute(cb){
    this._invokeDBus('Unmute', DBUS_INTERFACE_PLAYER, null, null, cb);
  }

  getCanSeek(cb){
    this._invokeDBus('CanSeek', DBUS_INTERFACE_PROPERTIES, null, null, cb);
  }

  getCanPlay(cb){
    this._invokeDBus('CanPlay', DBUS_INTERFACE_PROPERTIES, null, null, cb);
  }

  getCanPause(cb){
    this._invokeDBus('CanPause', DBUS_INTERFACE_PROPERTIES, null, null, cb);
  }

  getPlaybackStatus(cb){
    this._invokeDBus('PlaybackStatus', DBUS_INTERFACE_PROPERTIES, null, null, cb);
  }

  getPlaying(cb){
    this.getPlaybackStatus((err, status)=>{
      return cb && cb(err, status=='Playing');
    });
  }

  getPaused(cb){
    this.getPlaybackStatus((err, status)=>{
      return cb && cb(err, status=='Paused');
    });
  }

  getVolume(cb){
    this._invokeDBus('Volume', DBUS_INTERFACE_PROPERTIES, null, null, cb);
  }

  setVolume(volume, cb){
    this._invokeDBus('Volume', DBUS_INTERFACE_PROPERTIES, 'd', [volume], cb);
  }

  getPosition(cb){
    this._invokeDBus('Position', DBUS_INTERFACE_PROPERTIES, null, null, (err, ...result)=>{
      if(err) return cb && cb(err, null);
      return cb && cb(null, result / 1000000);
    });
  }

  getDuration(cb){
    this._invokeDBus('Duration', DBUS_INTERFACE_PROPERTIES, null, null, (err, ...result)=>{
      if(err) return cb && cb(err, null);
      return cb && cb(null, result / 1000000);
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
