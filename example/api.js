const OmxPlayer = require('..');
const path = require('path');

let omxplayer = new OmxPlayer();
omxplayer.open(path.join(__dirname, '..', '..', 'Timecoded_Big_bunny_1.mov'), {loop: true, adev: 'hdmi', pos: 0});

omxplayer.on('close', (exitCode)=>{
  console.log(`player closed with exitCode ${exitCode}`);
});

omxplayer.on('error', (error)=>{
  console.log(`player return error: ${error}`);
});

setTimeout(poll, 1000);
setTimeout(poll, 4000);
setTimeout(poll, 6000);

setTimeout(()=>{
  omxplayer.pause((err)=>{
    console.log(`pause: ${err}`);
  });
}, 3000);

setTimeout(()=>{
  omxplayer.play((err)=>{
    console.log(`play: ${err}`);
  });
}, 5000);

function poll(){

  console.log('** poll **');

  omxplayer.setPosition(10, (err, seconds)=>{
    console.log(`setPosition: ${err||seconds}`);
  });

  omxplayer.seek(5, (err, seconds)=>{
    console.log(`seek: ${err||seconds}`);
  });

  omxplayer.mute((err)=>{
    console.log(`mute: ${err}`);
  });

  omxplayer.unmute((err)=>{
    console.log(`mute: ${err}`);
  });

  omxplayer.getCanSeek((err, can)=>{
    console.log(`can seek: ${err||can}`);
  });

  omxplayer.getCanPlay((err, can)=>{
    console.log(`can play: ${err||can}`);
  });

  omxplayer.getCanPause((err, can)=>{
    console.log(`can pause: ${err||can}`);
  });

  omxplayer.getPlaybackStatus((err, state)=>{
    console.log(`playback state: ${err||state}`);
  });

  omxplayer.getPlaying((err, state)=>{
    console.log(`playing: ${err||state}`);
  });

  omxplayer.getPaused((err, state)=>{
    console.log(`paused: ${err||state}`);
  });

  omxplayer.getVolume((err, volume)=>{
    console.log(`volume: ${err||volume}`);
  });

  omxplayer.setVolume(0.5, (err, volume)=>{
    console.log(`volume: ${err||volume}`);
  });

  omxplayer.getPosition((err, seconds)=>{
    console.log(`position: ${err||seconds}`);
  });

  omxplayer.getDuration((err, duration)=>{
    console.log(`duration: ${err||duration}`);
  });

}
