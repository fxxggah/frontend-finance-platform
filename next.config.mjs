/** @type {import('next').NextConfig} */
import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';
import { validateReleaseEnvironment } from './lib/release-environment.mjs';

const nextConfig = {
  images: {
    unoptimized: true,
  },
}

export default function config(phase) {
  if (phase === PHASE_PRODUCTION_BUILD) validateReleaseEnvironment(process.env);
  return nextConfig;
}
