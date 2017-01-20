const OmxPlayer = require('..');
const path = require('path');

let omxplayer = new OmxPlayer();
omxplayer.open(path.join(__dirname, '..', '..', 'Timecoded_Big_bunny_1.mov'), {loop: true, adev: 'hdmi', pos: 0}).then(()=>{
  console.log('process started');
});

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
  omxplayer.pause().then(()=>{
    console.log('paused');
  }).catch((err)=>{
    console.log(`pause: ${err}`);
  })
}, 3000);

setTimeout(()=>{
  omxplayer.play().then(()=>{
    console.log('playing');
  }).catch((err)=>{
    console.log(`play: ${err}`);
  });
}, 5000);

function poll(){

  console.log('** poll **');


  omxplayer.setPosition(10).then((seconds)=>{
    console.log(`setPosition: ${seconds}`);
    return omxplayer.seek(5);
  }).then((seconds)=>{
    console.log(`seek: ${seconds}`);
    return omxplayer.mute();
  })
  .then(()=>{
    console.log('muted');
    return omxplayer.unmute();
  })
  .then(()=>{
    console.log('unmuted');
    return omxplayer.getCanSeek();
  })
  .then((canseek)=>{
    console.log(`canseek: ${canseek}`);
    return omxplayer.getCanPlay();
  })
  .then((canplay)=>{
    console.log(`canplay: ${canplay}`);
    return omxplayer.getCanPause();
  })
  .then((canpause)=>{
    console.log(`canpause: ${canpause}`);
    return omxplayer.getPlaying();
  })
  .then((playing)=>{
    console.log(`playing: ${playing}`);
    return omxplayer.getPaused();
  })
  .then((paused)=>{
    console.log(`paused: ${paused}`);
    return omxplayer.getVolume();
  })
  .then((volume)=>{
    console.log(`volume: ${volume}`);
    return omxplayer.setVolume(0.5);
  })
  .then((volume)=>{
    console.log(`set volume: ${volume}`);
    return omxplayer.getPosition();
  })
  .then((position)=>{
    console.log(`position: ${position}`);
    return omxplayer.getDuration();
  })
  .then((duration)=>{
    console.log(`duration: ${duration}`);
  })
  .catch((err)=>{
    console.log(`error: ${err}`);
  });

}
