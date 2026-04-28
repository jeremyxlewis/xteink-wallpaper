import { EinkPreview } from './EinkPreview';

export function DevicePreview({ isLoading, screenTexture }) {
  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-[180px] sm:min-h-[250px] lg:min-h-[400px]">
      <EinkPreview screenTexture={screenTexture} isLoading={isLoading} />
    </div>
  );
}