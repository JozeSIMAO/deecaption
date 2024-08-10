'use client';
import ResultVideo from "@/components/ResultVideo";
import TranscriptionEditor from "@/components/TranscriptionEditor";
import {clearTranscriptionItems} from "@/libs/awsTranscriptionHelpers";
import axios from "axios";
import {useEffect, useState} from "react";

export default function FilePage({params}) {
  const filename = params.filename;
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [awsTranscriptionItems, setAwsTranscriptionItems] = useState([]);
  const [transcriptionError, setTranscriptionError] = useState(null);

  useEffect(() => {
    getTranscription();
  }, [filename]);

  async function getTranscription() {
    setIsFetchingInfo(true);
    try {
      const response = await axios.get('/api/transcribe?filename='+filename);
      setIsFetchingInfo(false);
      const status = response.data?.status;
      const transcription = response.data?.transcription;
      if (status === 'IN_PROGRESS') {
        setIsTranscribing(true);
        setTimeout(getTranscription, 3000);
      } else {
        setIsTranscribing(false);
        if (transcription && transcription.results) {
          if (transcription.reults === null) {
            setTranscriptionError('The transcription file is empty, or the audio in the video is not clear.');
          }
          else {
            setAwsTranscriptionItems(
              clearTranscriptionItems(transcription.results.items)
            );
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }


  if (transcriptionError)
  {
    return (
      <div className="text-red-500">{transcriptionError}</div>
    );
  }

  if (isTranscribing) {
    return (
      <div>Transcribing your video...</div>
    );
  }

  if (isFetchingInfo) {
    return (
      <div>Fetching information...</div>
    );
  }

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-8 sm:gap-16">
        <div className="">
          <h2 className="text-2xl mb-4 text-white/60">Transcription</h2>
          <TranscriptionEditor
            awsTranscriptionItems={awsTranscriptionItems}
            setAwsTranscriptionItems={setAwsTranscriptionItems} />
        </div>
        <div>
          <h2 className="text-2xl mb-4 text-white/60">Result</h2>
          <ResultVideo
            filename={filename}
            transcriptionItems={awsTranscriptionItems} />
        </div>
      </div>
    </div>
  );
}