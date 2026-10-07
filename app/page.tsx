import Hero from '@/components/home/Hero';
import ScrollStory from '@/components/home/ScrollStory';
import FeatureWall from '@/components/home/FeatureWall';
import PricingTeaser from '@/components/home/PricingTeaser';
import FinalCta from '@/components/home/FinalCta';

export default function HomePage() {
  return (
    <>
      <Hero />
      <ScrollStory />
      <FeatureWall />
      <PricingTeaser />
      <FinalCta />
    </>
  );
}
