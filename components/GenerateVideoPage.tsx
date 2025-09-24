/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useRef, useState} from 'react';
import {PhotoIcon, XMarkIcon} from './icons';

interface GenerateVideoPageProps {
  onGenerate: (
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    image: {base64: string; mimeType: string} | null,
  ) => void;
  onCancel: () => void;
}

type AspectRatio = '16:9' | '9:16';

/**
 * A page that allows the user to generate a new video from a text prompt and
 * select an aspect ratio.
 */
export const GenerateVideoPage: React.FC<GenerateVideoPageProps> = ({
  onGenerate,
  onCancel,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [image, setImage] = useState<{
    base64: string;
    mimeType: string;
    dataUrl: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        setImage({base64, mimeType: file.type, dataUrl});
      };
      reader.readAsDataURL(file);
    }
    // Reset file input value to allow re-selecting the same file
    event.target.value = '';
  };

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate(prompt, aspectRatio, image ? {base64: image.base64, mimeType: image.mimeType} : null);
    }
  };

  const AspectRatioButton = ({
    value,
    label,
  }: {
    value: AspectRatio;
    label: string;
  }) => (
    <button
      onClick={() => setAspectRatio(value)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        aspectRatio === value
          ? 'bg-cyan-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
      aria-pressed={aspectRatio === value}>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen text-gray-100 font-sans flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-gray-900 p-6 md:p-8 rounded-lg shadow-2xl">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Generate a New Video
          </h1>
        </header>

        <main>
          <div className="mb-6">
            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-gray-300 mb-2">
              Describe your video
            </label>
            <textarea
              id="prompt"
              rows={5}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-shadow duration-200"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A cinematic shot of a futuristic city at night, with flying cars and neon signs."
              aria-label="Describe the video you want to generate"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Add an image (optional)
            </label>
            {image ? (
              <div className="relative w-40 h-24 rounded-lg overflow-hidden">
                <img
                  src={image.dataUrl}
                  alt="Image preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setImage(null)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  aria-label="Remove image">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                  aria-label="Upload an image"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600"
                  aria-label="Select an image to upload">
                  <PhotoIcon className="w-5 h-5" />
                  Upload Image
                </button>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Aspect Ratio
            </label>
            <div className="flex gap-4">
              <AspectRatioButton value="16:9" label="16:9 (Landscape)" />
              <AspectRatioButton value="9:16" label="9:16 (Portrait)" />
            </div>
          </div>
        </main>

        <footer className="flex justify-end gap-4 mt-8">
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
            Generate Video
          </button>
        </footer>
      </div>
    </div>
  );
};