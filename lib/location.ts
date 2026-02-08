import { find } from 'geo-tz'

// Simple in-memory cache for geolocation results
// Key: "round(lat,2),round(lng,2)"
// Value: { city, timezone, country, expires }
const geoCache = new Map<string, { city: string, timezone: string, country: string, expires: number, isIp?: boolean }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export interface GeoResult {
    city: string;
    timezone: string;
    country: string;
    latitude: number;
    longitude: number;
    isIp?: boolean;
}

/**
 * Resolves location using GPS coordinates or IP fallback.
 * Uses offline timezone resolution and reverse geocoding with caching.
 */
export async function resolveLocation(
    lat?: number | null,
    lng?: number | null,
    ip?: string | null,
    vercelGeo?: { city?: string, country?: string, latitude?: string, longitude?: string }
): Promise<GeoResult | null> {
    let finalLat = lat;
    let finalLng = lng;

    let isIp = false;

    // 1. IP-Based Location Fallback
    if (finalLat === null || finalLat === undefined || finalLng === null || finalLng === undefined) {
        isIp = true;
        // 1a. Priority: Vercel Native Geolocation (Fastest & Free)
        if (vercelGeo?.latitude && vercelGeo?.longitude) {
            finalLat = parseFloat(vercelGeo.latitude);
            finalLng = parseFloat(vercelGeo.longitude);
            console.log(`[Location] Vercel Native Geolocation resolved: ${finalLat}, ${finalLng}`);
        }
        // 1b. Dev Fallback
        else if (ip === '::1' || ip === '127.0.0.1') {
            console.log(`[Location] Local IP detected (${ip}), using development fallback (Delhi).`);
            finalLat = 28.6139;
            finalLng = 77.2090;
        }
        // 1c. External IP Geolocation Fallback
        else if (ip && !ip.startsWith('192.168.') && !ip.startsWith('10.')) {
            try {
                const ipRes = await fetch(`https://ipapi.co/${ip}/json/`);
                if (ipRes.ok) {
                    const ipData = await ipRes.json();
                    if (ipData.latitude !== undefined && ipData.longitude !== undefined) {
                        finalLat = ipData.latitude;
                        finalLng = ipData.longitude;
                        console.log(`[Location] IP Fallback resolved: ${finalLat}, ${finalLng} for IP: ${ip}`);
                    }
                }
            } catch (err) {
                console.error('[Location] IP Geolocation error:', err);
            }
        }
    }

    // Still no coordinates
    if (finalLat === null || finalLat === undefined || finalLng === null || finalLng === undefined) {
        return null;
    }

    // 2. Round coordinates to 2 decimal places to increase cache hits and privacy (~1.1km precision)
    const roundedLat = Math.round(finalLat * 100) / 100;
    const roundedLng = Math.round(finalLng * 100) / 100;
    const cacheKey = `${roundedLat},${roundedLng}`;

    // 3. Check Cache
    const cached = geoCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
        console.log(`[Location] Cache HIT for key ${cacheKey}: ${cached.timezone}`);
        return {
            city: cached.city,
            timezone: cached.timezone,
            country: cached.country,
            latitude: finalLat,
            longitude: finalLng,
            isIp: cached.isIp
        };
    }
    console.log(`[Location] Cache MISS for key ${cacheKey}. Resolving...`);

    // 4. Offline Timezone Resolution
    let timezone = 'UTC';
    try {
        console.log(`[Location] Attempting timezone resolution for: ${finalLat}, ${finalLng}`);
        const tzs = find(finalLat, finalLng);
        if (tzs && tzs.length > 0) {
            timezone = tzs[0];
            console.log(`[Location] Resolved Timezone: ${timezone}`);
        } else {
            console.warn(`[Location] No timezone found, defaulting to UTC`);
        }
    } catch (err) {
        console.error('[Location] Timezone resolution error:', err);
    }

    // 5. Reverse Geocoding (City / Country Resolution)
    let city = '';
    let country = '';
    try {
        // Fallback order: city → town → village → state → country
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${finalLat}&lon=${finalLng}&zoom=10`, {
            headers: {
                'User-Agent': 'Orbit/1.0',
                'Accept-Language': 'en'
            }
        });

        if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address;

            // Fallback order: city → town → village → state → country
            city = addr.city || addr.town || addr.village || addr.suburb || addr.city_district || addr.hamlet || addr.municipality || addr.state_district || addr.state || '';
            country = addr.country || '';

            // If GPS geocoding failed to find a city, try IP for the name only
            if (!city && !country && ip && ip !== '::1' && ip !== '127.0.0.1') {
                try {
                    const ipRes = await fetch(`https://ipapi.co/${ip}/json/`);
                    if (ipRes.ok) {
                        const ipData = await ipRes.json();
                        city = ipData.city || '';
                        country = ipData.country_name || '';
                        if (city) {
                            console.log(`[Location] Reverse geocoding failed, recovered city from IP: ${city}`);
                        }
                    }
                } catch (e) {
                    // Ignore IP fallback error
                }
            }

            if (!city && !country) {
                city = 'Unknown';
            }
        }
    } catch (err) {
        console.error('[Location] Reverse geocoding error:', err);
    }

    const result: GeoResult = {
        city: city || country || 'Unknown',
        timezone,
        country: country || 'Unknown',
        latitude: finalLat,
        longitude: finalLng,
        isIp
    };

    // 6. Update Cache
    geoCache.set(cacheKey, {
        city: result.city,
        timezone: result.timezone,
        country: result.country,
        expires: Date.now() + CACHE_TTL,
        isIp
    });

    return result;
}
