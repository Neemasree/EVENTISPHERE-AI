import DigitalTwinVenue from '../components/venue/DigitalTwinVenue';
import CrowdStats from '../components/crowd/CrowdStats';

export default function VenuePage() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="page-header">Digital Twin Venue</h1>
        <p className="page-sub">Interactive real-time venue map — click any zone for details</p>
      </div>
      <DigitalTwinVenue />
      <CrowdStats />
    </div>
  );
}
