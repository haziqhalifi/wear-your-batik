"""Compose authentic capture and supplied images into the requested 115-second MP4.
Run using the bundled Codex Python (Pillow and numpy), from the repository root.
No external assets, paid image calls, uploads, product source changes or mock screens.
"""
import json, math, subprocess, wave, textwrap, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'demo-video/submission-2026-10-11'
MEDIA = OUT / 'media'
MEDIA.mkdir(exist_ok=True)
SCENES = json.loads((Path(__file__).parent / 'submission-story.json').read_text())
CAPTURE = json.loads((OUT / 'capture.json').read_text())['markers']
EDITS = json.loads((OUT / 'recording-edits.json').read_text())
CREAM = '#f5eedc'
NAVY = '#101f36'
GOLD = '#dbc08b'
INK = '#20364b'
MUTED = '#6a766f'
SERIF = '/System/Library/Fonts/Supplemental/Georgia.ttf'
SANS = '/System/Library/Fonts/Supplemental/Arial.ttf'
BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
W, H = 1920, 1080

def run(args):
    p = subprocess.run([str(a) for a in args], capture_output=True, text=True)
    if p.returncode:
        raise RuntimeError(f'{args[0]} failed:\n{p.stderr[-4000:]}')
    return p.stdout

def probe(path):
    return json.loads(run(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,width,height,r_frame_rate','-of','json',path]))

def font(size, serif=False, bold=False):
    return ImageFont.truetype(SERIF if serif else BOLD if bold else SANS, size)

def text(im, xy, value, size=32, color=INK, serif=False, bold=False, anchor=None):
    ImageDraw.Draw(im).text(xy,value,font=font(size,serif,bold),fill=color,anchor=anchor,spacing=10)

def fit(im, path, box, crop=False):
    src = Image.open(path).convert('RGB')
    size=(box[2]-box[0],box[3]-box[1])
    src=ImageOps.fit(src,size,method=Image.Resampling.LANCZOS) if crop else ImageOps.contain(src,size,method=Image.Resampling.LANCZOS)
    im.paste(src,(box[0]+(size[0]-src.width)//2,box[1]+(size[1]-src.height)//2))

def leaf(im, x, y, scale=1, color=GOLD):
    # Restrained editorial botanical ornament; separate from the product design.
    d=ImageDraw.Draw(im)
    d.line([(x,y),(x+80*scale,y-110*scale)],fill=color,width=2)
    for i in range(4):
        a=x+i*19*scale; b=y-i*27*scale
        d.arc((a-31*scale,b-30*scale,a+18*scale,b+9*scale),15,210,fill=color,width=2)
        d.arc((a+8*scale,b-35*scale,a+52*scale,b+4*scale),170,355,fill=color,width=2)

def save(im, name):
    path=MEDIA / f'{name}.png'; im.save(path); return path

def title_card():
    im=Image.new('RGB',(W,H),CREAM)
    d=ImageDraw.Draw(im)
    d.rectangle((55,55,1865,920),outline=GOLD,width=2)
    text(im,(960,160),'A DIGITAL BATIK ATELIER',25,bold=True,anchor='mm')
    text(im,(960,360),'Wear Your Batik',112,serif=True,anchor='mm')
    text(im,(960,505),'Malaysian inspiration. Your own expression.',37,anchor='mm')
    text(im,(960,750),'Haziq Halifi  ·  Timothy Lee',30,anchor='mm')
    leaf(im,170,825,1.7); leaf(im,1570,280,1.7)
    return save(im,'invitation-title')

def cloth_closeup():
    im=Image.new('RGB',(W,H),NAVY)
    fit(im,OUT/'stills/hero-cloth.png',(0,60,1920,960),True)
    # Direct renderer output from the same recorded design.
    return save(im,'cloth-closeup')

def tryon_transition():
    im=Image.new('RGB',(W,H),CREAM)
    text(im,(960,320),'Recorded try-on example',86,serif=True,anchor='mm')
    text(im,(960,475),'An earlier integration test with a matching source shirt',32,anchor='mm')
    text(im,(960,650),'Separate from the design you just created',32,anchor='mm')
    leaf(im,160,820,1.6); leaf(im,1610,280,1.6)
    return save(im,'tryon-transition')

def tryon_comparison():
    im=Image.new('RGB',(W,H),CREAM)
    text(im,(85,113),'Imagine wearing it.',65,serif=True)
    items=[('Matching source shirt',ROOT/'artifacts/tryon/leaf/shirt.png'),
           ('Original synthetic person',ROOT/'public/sample-person.png'),
           ('Recorded AI result',ROOT/'artifacts/tryon/leaf/result.png')]
    for i,(label,path) in enumerate(items):
        x=85+i*605
        ImageDraw.Draw(im).rectangle((x,245,x+555,840),fill='#e7e4da')
        fit(im,path,(x,245,x+555,840))
        text(im,(x,195),label,28,bold=True)
    text(im,(85,888),'AI may change pattern details. Appearance approximation; fit is not guaranteed.',29)
    return save(im,'tryon-comparison')

def credits():
    im=Image.new('RGB',(W,H),CREAM)
    text(im,(115,135),'A shared creative process.',76,serif=True)
    entries=[('Haziq','Concept and development'),('Timothy','Ideation and testing'),('Codex','Workflow, rendering, integration and tests')]
    d=ImageDraw.Draw(im)
    for i,(name,role) in enumerate(entries):
        y=330+i*170
        d.line((115,y-28,1785,y-28),fill=GOLD,width=2)
        text(im,(115,y),name,51,serif=True)
        text(im,(545,y+8),role,36)
    text(im,(115,865),'What we learned: distinguish exact design from AI appearance.',29)
    leaf(im,1630,260,1.4)
    return save(im,'credits')

def learning_card():
    im=Image.new('RGB',(W,H),NAVY)
    text(im,(100,125),'What we learned',27,color=GOLD,bold=True)
    text(im,(100,225),'Two previews. Two purposes.',75,color=CREAM,serif=True)
    fit(im,OUT/'stills/hero-cloth.png',(100,390,530,820),True)
    text(im,(585,435),'Exact digital design',46,color=CREAM,serif=True)
    text(im,(585,510),'Shared pattern rendering preserves your choices.',31,color=CREAM)
    text(im,(585,650),'AI appearance approximation',46,color=CREAM,serif=True)
    text(im,(585,725),'Useful for imagining a look. Details may change.',31,color=CREAM)
    return save(im,'learning')

def credits_recording():
    # Keep product interactions on screen for most of the video. This is an
    # explicitly labelled replay of authentic 3D footage, beside clean credits.
    im=Image.new('RGB',(W,H),CREAM)
    text(im,(65,155),'How we',56,serif=True)
    text(im,(65,225),'built it.',56,serif=True)
    entries=[('Haziq',['Concept and','development']),('Timothy',['Ideation and testing']),
             ('Codex',['Workflow, rendering,','integration and tests'])]
    for i,(name,lines) in enumerate(entries):
        y=365+i*160
        text(im,(65,y),name,39,serif=True)
        for j,line in enumerate(lines): text(im,(65,y+55+j*38),line,28)
    text(im,(1215,885),'Local 3D prototype · Recording replay',26,anchor='mm')
    panel=save(im,'credits-with-recording')
    movie=MEDIA/'credits-recording.mp4'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-filter_complex_threads','2',
         '-ss','49.5','-t','11','-i',OUT/'raw/prototype.webm','-loop','1','-i',panel,
         '-filter_complex','[0:v]crop=1200:750:200:0,scale=1248:780:flags=lanczos,setpts=13/11*(PTS-STARTPTS),fps=30[v];[1:v][v]overlay=600:90:format=auto[o]',
         '-map','[o]','-t','13','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-threads','4',movie])
    learning=learning_card(); still=MEDIA/'learning-video.mp4'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-i',learning,'-t','7','-r','30',
         '-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-threads','4',still])
    join=MEDIA/'credit-visuals.txt';join.write_text(f"file '{movie}'\nfile '{still}'\n")
    output=MEDIA/'credit-visuals.mp4'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',join,'-c','copy',output])
    return output

def closing_preview():
    im=Image.new('RGB',(W,H),CREAM)
    text(im,(100,115),'Your cloth. Your expression.',70,serif=True)
    fit(im,OUT/'stills/hero-cloth.png',(100,255,820,850),True)
    fit(im,OUT/'stills/hero-garment.png',(950,255,1730,850))
    text(im,(100,885),'Next: artisan feedback and stronger real-device testing.',29)
    return save(im,'closing-preview')

def end_card():
    im=Image.new('RGB',(W,H),NAVY)
    text(im,(960,295),'Wear Your Batik',100,color=CREAM,serif=True,anchor='mm')
    text(im,(960,455),'From appreciation to participation.',47,color=CREAM,anchor='mm')
    text(im,(960,690),'Haziq Halifi  ·  Timothy Lee',30,color=GOLD,anchor='mm')
    leaf(im,180,830,1.9); leaf(im,1550,270,1.9)
    return save(im,'end-card')

def chrome(scene, i):
    im=Image.new('RGBA',(W,H),(0,0,0,0))
    d=ImageDraw.Draw(im)
    d.rectangle((0,0,1920,60),fill=NAVY)
    d.rectangle((0,960,1920,1080),fill=NAVY)
    text(im,(35,17),f'{i+1:02d}  /  {scene["title"]}',26,color=CREAM)
    label=''
    if scene['kind'] in ['create','stamp']: label='LOCAL PROTOTYPE · ACTUAL RECORDING'
    if scene['kind']=='three': label='3D concept preview · Local prototype'
    if scene['kind']=='tryon': label='Recorded AI try-on · Synthetic demo person'
    if scene['kind']=='credits': label='Haziq Halifi + Timothy Lee'
    if label: text(im,(1885,30),label,25,color=GOLD,anchor='rm')
    return save(im,f'chrome-{i}')

def caption_image(value, name):
    im=Image.new('RGBA',(1920,120),NAVY)
    f=font(34)
    words=value.split(); lines=['']; draw=ImageDraw.Draw(im)
    for word in words:
        candidate=(lines[-1]+' '+word).strip()
        if draw.textlength(candidate,font=f)>1740: lines.append(word)
        else: lines[-1]=candidate
    assert len(lines)<=2, (value,lines)
    for j,line in enumerate(lines):
        text(im,(960,60+(j-(len(lines)-1)/2)*43),line,34,color=CREAM,anchor='mm')
    return save(im,name)

def timestamp(t):
    ms=round(t*1000); h,ms=divmod(ms,3600000); m,ms=divmod(ms,60000); s,ms=divmod(ms,1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'

def generate_music():
    sr=48000; total=int(115*sr); signal=np.zeros(total,dtype=np.float32)
    # Original quiet ambient instrumental, synthesized locally: soft pads and bells.
    chords=[(146.83,185.0,220.0,293.66),(130.81,164.81,196.0,261.63),
            (110.0,146.83,174.61,220.0),(98.0,146.83,196.0,246.94)]
    for bar,start in enumerate(np.arange(0,115,4.8)):
        length=min(6.0,115-start); n=int(length*sr); t=np.arange(n)/sr
        env=np.minimum(t/1.3,1)*np.minimum((length-t)/1.7,1)
        snd=np.zeros(n)
        for hz in chords[bar%4]:
            snd += (np.sin(2*np.pi*hz*t)+.16*np.sin(4*np.pi*hz*t))*.045*env
        i=int(start*sr); end=min(i+n,total); signal[i:end]+=snd[:end-i]
        for beat,note in [(0,chords[bar%4][2]*2),(2.4,chords[bar%4][3]*2)]:
            at=start+beat
            if at>=115: continue
            nt=min(int(3.0*sr),total-int(at*sr)); tt=np.arange(nt)/sr
            bell=(np.sin(2*np.pi*note*tt)+.25*np.sin(2*np.pi*note*2*tt))*np.exp(-tt*2.5)*np.minimum(tt/.03,1)*.028
            signal[int(at*sr):int(at*sr)+nt]+=bell
    signal*=np.minimum(np.arange(total)/sr/2,1)*np.minimum((115-np.arange(total)/sr)/3,1)
    # Stereo, with a small spatial difference. Mix is attenuated beneath narration.
    stereo=np.stack([signal,np.roll(signal,240)],axis=1)
    pcm=(np.clip(stereo,-1,1)*32767).astype('<i2')
    with wave.open(str(MEDIA/'original-instrumental.wav'),'wb') as wav:
        wav.setnchannels(2); wav.setsampwidth(2); wav.setframerate(sr); wav.writeframes(pcm.tobytes())

def render():
    stills={
      'invitation':[(title_card(),3),(cloth_closeup(),7)],
      'tryon':[(tryon_transition(),2),(tryon_comparison(),23)],
      'credits':[(credits(),13),(learning_card(),7)],
      'close':[(closing_preview(),5),(end_card(),5)]
    }
    generate_music()
    offset=0; srt=[]; audio_records=[]; outputs=[]
    for i,scene in enumerate(SCENES):
        print(f'Preparing scene {i+1}: {scene["title"]}',flush=True)
        d=scene['duration']; kind=scene['kind']
        # Narrate each subtitle phrase separately, giving accurate subtitle timing.
        raw=[]; lengths=[]
        for j,cue in enumerate(scene['captions']):
            path=MEDIA/f'voice-{i}-{j}.aiff'
            if not path.exists() or float(probe(path)['format'].get('duration',0))<=0:
                inp=MEDIA/f'voice-{i}-{j}.txt'; inp.write_text(cue)
                run(['say','-v','Daniel','-r','160','-f',inp,'-o',path])
            raw.append(path); lengths.append(float(probe(path)['format']['duration']))
        gaps=.12*(len(raw)-1)
        tempo=max(1,sum(lengths)/(d-.8-gaps))
        at=.35; cues=[]; wavs=[]
        for j,(path,length,value) in enumerate(zip(raw,lengths,scene['captions'])):
            actual=length/tempo
            wav=MEDIA/f'voice-{i}-{j}.wav'
            run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',path,'-af',f'atempo={tempo:.6f},loudnorm=I=-18:TP=-2:LRA=7','-ar','48000','-ac','2',wav])
            # ffmpeg atempo has a small sample-length discrepancy: use measured result.
            actual=float(probe(wav)['format']['duration'])
            end=min(d-.05,at+actual)
            png=caption_image(value,f'caption-{i}-{j}')
            cues.append((png,at,end))
            srt += [str(len(srt)//4+1),f'{timestamp(offset+at)} --> {timestamp(offset+end)}',value,'']
            wavs.append((wav,at)); at=end+.12
        audio_records.append({'scene':i+1,'duration':d,'voiceTempo':tempo,'voiceEnd':at-.12})
        # Build a silent padded scene voice track, with cue-specific delays.
        args=['ffmpeg','-hide_banner','-loglevel','error','-y']
        for wav,_ in wavs: args+=['-i',wav]
        af=[]
        for j,(_,start) in enumerate(wavs): af.append(f'[{j}:a]adelay={round(start*1000)}|{round(start*1000)}[a{j}]')
        af.append(''.join(f'[a{j}]' for j in range(len(wavs)))+f'amix=inputs={len(wavs)}:normalize=0,apad,atrim=0:{d}[mix]')
        voice=MEDIA/f'scene-voice-{i}.wav'
        args+=['-filter_complex',';'.join(af),'-map','[mix]','-ar','48000','-ac','2',voice]
        run(args)

        output=MEDIA/f'scene-{i+1:02d}.mp4'
        if '--credits-only' in sys.argv and kind!='credits' and output.exists() or '--refine-recordings' in sys.argv and kind not in ['create','stamp','three'] and output.exists():
            print(f'Using verified existing scene {i+1}',flush=True)
            outputs.append(output); offset+=d; continue
        args=['ffmpeg','-hide_banner','-loglevel','error','-y','-filter_complex_threads','2']
        if kind in ['create','stamp','three']:
            trim=EDITS[kind]; source_duration=trim['end']-trim['start']
            args+=['-ss',str(trim['start']),'-t',str(source_duration),'-i',OUT/'raw/prototype.webm']
            speed=d/source_duration
            base=f'[0:v]setpts={speed:.8f}*(PTS-STARTPTS),scale=1920:900:flags=lanczos,fps=30,pad=1920:1080:0:60:color=0x101f36,setsar=1[v0]'
        elif kind=='credits':
            args+=['-i',credits_recording()]
            base='[0:v]fps=30,setsar=1[v0]'
        else:
            file=MEDIA/f'visuals-{i}.txt'
            file.write_text(''.join(f"file '{path}'\nduration {duration}\n" for path,duration in stills[kind])+f"file '{stills[kind][-1][0]}'\n")
            args+=['-f','concat','-safe','0','-i',file]
            base='[0:v]fps=30,setsar=1[v0]'
        overlay=chrome(scene,i)
        args+=['-loop','1','-i',overlay]
        filters=[base,'[v0][1:v]overlay=0:0:format=auto[v1]']
        prev='v1'
        for j,(png,start,end) in enumerate(cues):
            idx=j+2
            args+=['-loop','1','-i',png]
            nxt=f'v{idx}'
            filters.append(f"[{prev}][{idx}:v]overlay=0:960:enable='between(t,{start:.5f},{end:.5f})':format=auto[{nxt}]")
            prev=nxt
        voice_idx=len(cues)+2
        args+=['-i',voice,'-filter_complex',';'.join(filters),'-map',f'[{prev}]','-map',f'{voice_idx}:a',
               '-t',str(d),'-r','30','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',
               '-threads','4','-c:a','aac','-b:a','192k','-movflags','+faststart']
        args+=[output];run(args); outputs.append(output)
        print(f'Finished scene {i+1}',flush=True)
        offset+=d
    assert offset==115
    (OUT/'wear-your-batik-subtitles.srt').write_text('\n'.join(srt))
    (OUT/'narration-timing.json').write_text(json.dumps(audio_records,indent=2))
    join=MEDIA/'join.txt'; join.write_text(''.join(f"file '{path}'\n" for path in outputs))
    combined=MEDIA/'combined.mp4'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',join,'-c','copy',combined])
    final=OUT/'wear-your-batik-demo.mp4'
    video_start=float(run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=start_time','-of','csv=p=0',combined]).strip())
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-itsoffset',str(-video_start),'-i',combined,'-i',MEDIA/'original-instrumental.wav',
         '-filter_complex','[0:a]asetpts=PTS-STARTPTS[voice];[1:a]volume=0.11[m];[voice][m]amix=inputs=2:normalize=0,alimiter=limit=0.89:level=0[a]',
         '-map','0:v','-map','[a]','-t','115','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',final])
    (OUT/'export-metadata.json').write_text(json.dumps(probe(final),indent=2))
    print(f'Exported {final}',flush=True)

if __name__=='__main__': render()
