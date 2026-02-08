import { find } from 'geo-tz';

const lat = 28.6139; // Delhi
const lng = 77.2090;

try {
    const tzs = find(lat, lng);
    console.log(`Delhi (${lat}, ${lng}) timezone:`, tzs);

    const nyLat = 40.7128;
    const nyLng = -74.0060;
    const nyTzs = find(nyLat, nyLng);
    console.log(`New York (${nyLat}, ${nyLng}) timezone:`, nyTzs);
} catch (e) {
    console.error('Error finding timezone:', e);
}
