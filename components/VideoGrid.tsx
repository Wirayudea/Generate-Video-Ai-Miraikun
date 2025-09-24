/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {Video} from '../types';
import {VideoCard} from './VideoCard';
import {VideoCameraIcon} from './icons';

interface VideoGridProps {
  videos: Video[];
  onPlayVideo: (video: Video) => void;
}

/**
 * A component that renders a grid of video cards.
 */
export const VideoGrid: React.FC<VideoGridProps> = ({videos, onPlayVideo}) => {
  if (videos.length === 0) {
    return (
      <div className="text-center py-20 px-6 rounded-lg border-2 border-dashed border-gray-700 mt-8">
        <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-500" />
        <h3 className="mt-4 text-xl font-semibold text-gray-300">
          No videos yet
        </h3>
        <p className="mt-1 text-gray-500">
          Your generated videos will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} onPlay={onPlayVideo} />
      ))}
    </div>
  );
};