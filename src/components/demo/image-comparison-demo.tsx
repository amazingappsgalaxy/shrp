import {
  ImageComparison,
  ImageComparisonImage,
  ImageComparisonSlider
} from "@/components/ui/image-comparison";

export default function ImageComparisonDemo() {
  return (
    <ImageComparison className="aspect-16/9 w-full rounded-lg glass" enableHover>
      <ImageComparisonImage
        src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg"
        alt="Original Image"
        position="left"
      />
      <ImageComparisonImage
        src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png"
        alt="AI Enhanced Image"
        position="right"
      />
      <ImageComparisonSlider className="w-1 bg-gradient-to-b from-accent-neon to-accent-blue shadow-neon">
        <div className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg border-2 border-accent-neon"></div>
      </ImageComparisonSlider>
    </ImageComparison>
  );
}