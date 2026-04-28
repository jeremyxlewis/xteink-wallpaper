import { EinkPreview } from './EinkPreview';

export function DevicePreview({ isLoading, screenTexture }) {
  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-[300px] lg:min-h-[400px]">
      <EinkPreview screenTexture={screenTexture} isLoading={isLoading} />
    </div>
  );
}