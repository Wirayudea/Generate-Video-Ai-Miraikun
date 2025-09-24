/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useState} from 'react';
import {EditVideoPage} from './components/EditVideoPage';
import {ErrorModal} from './components/ErrorModal';
import {GenerateVideoPage} from './components/GenerateVideoPage';
import {PlusIcon, VideoCameraIcon} from './components/icons';
import {SavingProgressPage} from './components/SavingProgressPage';
import {VideoGrid} from './components/VideoGrid';
import {VideoPlayer} from './components/VideoPlayer';
import {Video} from './types';

import {GeneratedVideo, GoogleGenAI} from '@google/genai';

const VEO_MODEL_NAME = 'veo-2.0-generate-001';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

// ---

function bloblToBase64(blob: Blob) {
  return new Promise<string>(async (resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      resolve(url.split(',')[1]);
    };
    // FIX: Corrected typo from readDataURL to readAsDataURL.
    reader.readAsDataURL(blob);
  });
}

// ---

async function generateVideo(
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  image: {base64: string; mimeType: string} | null,
  numberOfVideos = 1,
): Promise<string[]> {
  let operation = await ai.models.generateVideos({
    model: VEO_MODEL_NAME,
    prompt,
    ...(image && {
      image: {
        imageBytes: image.base64,
        mimeType: image.mimeType,
      },
    }),
    config: {
      numberOfVideos,
      aspectRatio,
    },
  });

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('...Generating...');
    operation = await ai.operations.getVideosOperation({operation});
  }

  if (operation?.response) {
    const videos = operation.response?.generatedVideos;
    if (videos === undefined || videos.length === 0) {
      throw new Error('No videos generated');
    }

    return await Promise.all(
      videos.map(async (generatedVideo: GeneratedVideo) => {
        const url = decodeURIComponent(generatedVideo.video.uri);
        const res = await fetch(`${url}&key=${process.env.API_KEY}`);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch video: ${res.status} ${res.statusText}`,
          );
        }
        const blob = await res.blob();
        return bloblToBase64(blob);
      }),
    );
  } else {
    throw new Error('No videos generated');
  }
}

/**
 * Main component for the Veo Gallery app.
 * It manages the state of videos, playing videos, editing videos and error handling.
 */
export const App: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isGeneratingNewVideo, setIsGeneratingNewVideo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState('Creating your video...');
  const [generationError, setGenerationError] = useState<string[] | null>(
    null,
  );

  const handlePlayVideo = (video: Video) => {
    setPlayingVideo(video);
  };

  const handleClosePlayer = () => {
    setPlayingVideo(null);
  };

  const handleStartEdit = (video: Video) => {
    setPlayingVideo(null); // Close player
    setEditingVideo(video); // Open edit page
  };

  const handleCancelEdit = () => {
    setEditingVideo(null); // Close edit page, return to grid
  };

  const handleStartGenerate = () => {
    setPlayingVideo(null);
    setEditingVideo(null);
    setIsGeneratingNewVideo(true);
  };

  const handleCancelGenerate = () => {
    setIsGeneratingNewVideo(false);
  };

  const handleGenerateNewVideo = async (
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    image: {base64: string; mimeType: string} | null,
  ) => {
    setIsGeneratingNewVideo(false);
    setSavingMessage('Creating your video...');
    setIsSaving(true);
    setGenerationError(null);

    try {
      console.log('Generating video...', prompt, aspectRatio, !!image);
      const videoObjects = await generateVideo(prompt, aspectRatio, image);

      if (!videoObjects || videoObjects.length === 0) {
        throw new Error('Video generation returned no data.');
      }

      console.log('Generated video data received.');

      const mimeType = 'video/mp4';
      const videoSrc = videoObjects[0];
      const src = `data:${mimeType};base64,${videoSrc}`;

      const newVideo: Video = {
        id: self.crypto.randomUUID(),
        title: `Generated: ${prompt.substring(0, 30)}${
          prompt.length > 30 ? '...' : ''
        }`,
        description: prompt,
        videoUrl: src,
      };

      setVideos((currentVideos) => [newVideo, ...currentVideos]);
      setPlayingVideo(newVideo);
    } catch (error) {
      console.error('Video generation failed:', error);
      setGenerationError([
        'Video generation failed.',
        'This may be due to a billing issue. Please ensure your Cloud Project is on a paid tier to use this feature.',
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async (originalVideo: Video) => {
    setEditingVideo(null);
    setSavingMessage('Creating your remix...');
    setIsSaving(true);
    setGenerationError(null);

    try {
      const promptText = originalVideo.description;
      console.log('Generating video...', promptText);
      const videoObjects = await generateVideo(promptText, '16:9', null);

      if (!videoObjects || videoObjects.length === 0) {
        throw new Error('Video generation returned no data.');
      }

      console.log('Generated video data received.');

      const mimeType = 'video/mp4';
      const videoSrc = videoObjects[0];
      const src = `data:${mimeType};base64,${videoSrc}`;

      const newVideo: Video = {
        id: self.crypto.randomUUID(),
        title: `Remix of "${originalVideo.title}"`,
        description: originalVideo.description,
        videoUrl: src,
      };

      setVideos((currentVideos) => [newVideo, ...currentVideos]);
      setPlayingVideo(newVideo); // Go to the new video
    } catch (error) {
      console.error('Video generation failed:', error);
      setGenerationError([
        'Video generation failed.',
        'This may be due to a billing issue. Please ensure your Cloud Project is on a paid tier to use this feature.',
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  if (isSaving) {
    return <SavingProgressPage message={savingMessage} />;
  }

  return (
    <div className="min-h-screen text-gray-100 font-sans">
      {isGeneratingNewVideo ? (
        <GenerateVideoPage
          onGenerate={handleGenerateNewVideo}
          onCancel={handleCancelGenerate}
        />
      ) : editingVideo ? (
        <EditVideoPage
          video={editingVideo}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      ) : (
        <div className="mx-auto max-w-[1080px]">
          <header className="p-6 md:p-8 text-center">
            <div className="flex justify-center items-center gap-4">
              <VideoCameraIcon className="w-10 h-10 md:w-12 md:h-12 text-cyan-400" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-transparent bg-clip-text">
                MIRAIKUN
              </h1>
            </div>
            <p className="text-gray-300 mt-2 text-lg">
              Generate a new video to get started.
            </p>
            <div className="mt-6">
              <button
                onClick={handleStartGenerate}
                className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition-all inline-flex items-center gap-2 transform hover:scale-105 duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40">
                <PlusIcon className="w-5 h-5" />
                <span>Generate New Video</span>
              </button>
            </div>
          </header>
          <main className="px-4 md:px-8 pb-8">
            <VideoGrid videos={videos} onPlayVideo={handlePlayVideo} />
          </main>
        </div>
      )}

      {playingVideo && (
        <VideoPlayer
          video={playingVideo}
          onClose={handleClosePlayer}
          onEdit={handleStartEdit}
        />
      )}

      {generationError && (
        <ErrorModal
          message={generationError}
          onClose={() => setGenerationError(null)}
          onSelectKey={async () => await window.aistudio?.openSelectKey()}
        />
      )}
    </div>
  );
};
