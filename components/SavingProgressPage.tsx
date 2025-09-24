/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface SavingProgressPageProps {
  message: string;
}

/**
 * A fullscreen overlay that displays a loading animation and text indicating that
 * a video remix is being created.
 */
export const SavingProgressPage: React.FC<SavingProgressPageProps> = ({
  message,
}) => {
  return (
    <div
      className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in"
      aria-live="polite"
      aria-busy="true">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-500"></div>
      <h2 className="text-2xl font-bold text-white mt-8">{message}</h2>
      <p className="text-gray-400 mt-2">
        Please wait while we bring your vision to life.
      </p>
    </div>
  );
};