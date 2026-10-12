#!/bin/zsh
# Final mix: narration (cleaned, levelled) over the ducked score, two-pass loudness normalisation to
# −14 LUFS integrated / −1 dBTP, exactly 60.000 s at 48 kHz stereo.
# Usage: demo-video/brand-film/scripts/mix.sh [voiceDir=voice]
set -euo pipefail
cd "$(dirname "$0")/.."
V=${1:-voice}
A=out/audio
mkdir -p $A
# Voice: rumble filter, gentle compression, a touch of presence, levelled to −17 LUFS.
VCHAIN="highpass=f=75,acompressor=threshold=-22dB:ratio=2.2:attack=6:release=140:makeup=2,equalizer=f=3000:t=q:w=1.1:g=1.6,equalizer=f=220:t=q:w=1:g=0.8"
M=$(ffmpeg -hide_banner -i assets/$V/narration.wav -af "$VCHAIN,loudnorm=I=-17:TP=-2:LRA=7:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
mi=$(echo $M | python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -hide_banner -loglevel error -y -i assets/$V/narration.wav -af "$VCHAIN,loudnorm=I=-17:TP=-2:LRA=7:${mi}:linear=true,aresample=48000" -ac 2 -c:a pcm_f32le $A/voice-$V.wav
# Mix and master.
PRE="[0:a][1:a]amix=inputs=2:normalize=0:duration=longest,atrim=0:60,asetpts=N/SR/TB"
M2=$(ffmpeg -hide_banner -i $A/voice-$V.wav -i $A/score.wav -filter_complex "$PRE,loudnorm=I=-14:TP=-1:LRA=9:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
mi2=$(echo $M2 | python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -hide_banner -loglevel error -y -i $A/voice-$V.wav -i $A/score.wav -filter_complex "$PRE,loudnorm=I=-14:TP=-1:LRA=9:${mi2}:linear=true,aresample=48000,atrim=0:60" -c:a pcm_s24le $A/mix-$V.wav
ffmpeg -hide_banner -i $A/mix-$V.wav -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p' | grep -E 'I:|Peak:|LRA:' | tr -s ' '
ffprobe -v error -show_entries format=duration -of csv=p=0 $A/mix-$V.wav
