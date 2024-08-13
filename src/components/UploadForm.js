'use client';
import UploadIcon from "@/components/UploadIcon";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UploadForm() {

  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();

  async function upload(ev) {
    ev.preventDefault();
    const files = ev.target.files;
    if (files.length > 0) {
      try {
        const file = files[0];
        setIsUploading(true);
        setUploadProgress(0);
        
        const fileName = file.name;
        const fileType = file.type;

        // Step 1: Initiate Multipart Upload
        const { data: { uploadId, newName } } = await axios.post('/api/upload/initiate', { fileName, fileType }, {
          headers: { 'Content-Type': 'application/json' },
        });

        const chunkSize = 3 * 1024 * 1024; // 5MB chunks
        const fileChunks = [];
        let currentPartNumber = 1;

        for (let start = 0; start < file.size; start += chunkSize) {
          const chunk = file.slice(start, start + chunkSize);
          fileChunks.push({ chunk, partNumber: currentPartNumber });
          currentPartNumber += 1;
        }

        // Step 2: Upload Each Part
        const uploadParts = fileChunks.map(async ({ chunk, partNumber }) => {
          const formData = new FormData();
          formData.append('fileName', newName);
          formData.append('uploadId', uploadId);
          formData.append('partNumber', partNumber);
          formData.append('fileChunk', chunk); // Add chunk directly

          const { data: { ETag } } = await axios.post('/api/upload/part', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          // Update Progress
          setUploadProgress((prev) => prev + (1 / fileChunks.length) * 100);

          return { ETag, PartNumber: partNumber };
        });

        const parts = await Promise.all(uploadParts);

        // Step 3: Complete Multipart Upload
        await axios.post('/api/upload/complete', { fileName: newName, uploadId, parts });

        setIsUploading(false);
        router.push('/' + newName);
      }
      catch (error) {
        setIsUploading(false);
        setUploadError(error.message);
      }
    }
  }

  return (
    <>
      {isUploading && (
        <div className="bg-black/90 text-white fixed inset-0 flex items-center">
          <div className="w-full text-center">
            <h2 className="text-4xl mb-4">Uploading</h2>
            <h3 className="text-xl">Please wait...</h3>
            <progress value={uploadProgress} max="100" className="w-1/2 mx-auto"></progress>
          </div>
        </div>
      )}
      {uploadError && (
        <div className="bg-red-500 text-white p-4">
          <p>Error: {uploadError}</p>
        </div>
      )}
      <label className="bg-green-600 py-2 px-6 rounded-full inline-flex gap-2 border-2 border-purple-700/50 cursor-pointer">
        <UploadIcon />
        <span>Choose file</span>
        <input onChange={upload} type="file" className="hidden"/>
      </label>
    </>
  );
}
