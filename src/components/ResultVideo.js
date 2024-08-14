import SparklesIcon from "@/components/SparklesIcon";
import { transcriptionItemsToSrt } from "@/libs/awsTranscriptionHelpers";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { useEffect, useState, useRef } from "react";
import roboto from './../fonts/Roboto-Regular.ttf';
import robotoBold from './../fonts/Roboto-Bold.ttf';

export default function ResultVideo({ filename, transcriptionItems }) {
  const videoUrl = "https://deecaptionbucket.s3.amazonaws.com/" + filename;
  const [loaded, setLoaded] = useState(false);
  const [isCaptioning, setIsCaptioning] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#FFFFFF');
  const [outlineColor, setOutlineColor] = useState('#000000');
  const [isClicked, setIsClicked] = useState(false);
  const [progress, setProgress] = useState(0); // Start at 0
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const initializeFFmpeg = async () => {
        const ffmpeg = ffmpegRef.current;
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        await ffmpeg.writeFile('/tmp/roboto.ttf', await fetchFile(roboto));
        await ffmpeg.writeFile('/tmp/roboto-bold.ttf', await fetchFile(robotoBold));
        setLoaded(true);
      };
  
      initializeFFmpeg();
    }
  }, []);  

  function toFFmpegColor(rgb) {
    const bgr = rgb.slice(5, 7) + rgb.slice(3, 5) + rgb.slice(1, 3);
    return '&H' + bgr + '&';
  }

  const transcode = async () => {
    setIsCaptioning(true);
    setIsClicked(true);

    const ffmpeg = ffmpegRef.current;
    const srt = transcriptionItemsToSrt(transcriptionItems);
    await ffmpeg.writeFile(filename, await fetchFile(videoUrl));
    await ffmpeg.writeFile('subs.srt', srt);
    
    videoRef.current.src = videoUrl;
    await new Promise((resolve) => {
      videoRef.current.onloadedmetadata = resolve;
    });

    const duration = videoRef.current.duration;
    ffmpeg.on('log', ({ message }) => {
      const regexResult = /time=([0-9:.]+)/.exec(message);
      if (regexResult && regexResult[1]) {
        const [hours, minutes, seconds] = regexResult[1].split(':');
        const doneTotalSeconds = parseFloat(hours) * 3600 + parseFloat(minutes) * 60 + parseFloat(seconds);
        const videoProgress = doneTotalSeconds / duration;
        setProgress(Math.min(videoProgress, 1)); // Ensure progress doesn't exceed 100%
      }
    });

    try {
      await ffmpeg.exec([
        '-i', filename,
        '-preset', 'ultrafast',
        '-vf', `subtitles=subs.srt:fontsdir=/tmp:force_style='Fontname=Roboto Bold,FontSize=30,MarginV=70,PrimaryColour=${toFFmpegColor(primaryColor)},OutlineColour=${toFFmpegColor(outlineColor)}'`,
        'output.mp4'
      ]);
      const data = await ffmpeg.readFile('output.mp4');
      videoRef.current.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    } catch (error) {
      console.error('Error during transcoding:', error);
      setProgress(0); // Reset progress on error
    } finally {
      setIsCaptioning(false);
      setIsClicked(false);
      setProgress(1); // Ensure progress is set to 100% when done
    }
  };

  return (
    <>
      <div className="mb-4">
        <button
          onClick={transcode}
          className={`bg-green-600 hover:bg-green-700 py-2 px-6 rounded-full inline-flex gap-2 border-2 border-purple-700/50 cursor-pointer ${isClicked ? 'clicked-class' : ''}`}
          disabled={isCaptioning}
        >
          <SparklesIcon />
          <span>Apply captions</span>
        </button>
        {isCaptioning && <p>Captioning has begun. Please wait...</p>}
      </div>
      <div>
        primary color:
        <input
          type="color"
          value={primaryColor}
          onChange={ev => setPrimaryColor(ev.target.value)}
        />
        <br />
        outline color:
        <input
          type="color"
          value={outlineColor}
          onChange={ev => setOutlineColor(ev.target.value)}
        />
      </div>
      <div className="rounded-xl overflow-hidden relative">
        {progress < 1 && (
          <div className="absolute inset-0 bg-black/80 flex items-center">
            <div className="w-full text-center">
              <div className="bg-bg-gradient-from/50 mx-8 rounded-lg overflow-hidden relative">
                <div className="bg-bg-gradient-from h-8"
                     style={{ width: progress * 100 + '%' }}>
                  <h3 className="text-white text-xl absolute inset-0 py-1">
                    {parseInt(progress * 100)}%
                  </h3>
                </div>
              </div>
            </div>
          </div>
        )}
        <video
          data-video={0}
          ref={videoRef}
          controls
          preload="auto"
        />
      </div>
    </>
  );
}
