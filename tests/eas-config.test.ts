import easConfig from '../eas.json';

const LOCAL_HOST_PATTERN = /localhost|127\.0\.0\.1/i;

describe('eas.json — Android device build must never target a loopback API', () => {
  it('preview profile points EXPO_PUBLIC_API_URL at a remote https URL', () => {
    const url = easConfig.build.preview.env?.EXPO_PUBLIC_API_URL;
    expect(url).toBeTruthy();
    expect(url).toMatch(/^https:\/\//);
    expect(url).not.toMatch(LOCAL_HOST_PATTERN);
  });

  it('production profile points EXPO_PUBLIC_API_URL at a remote https URL', () => {
    const url = easConfig.build.production.env?.EXPO_PUBLIC_API_URL;
    expect(url).toBeTruthy();
    expect(url).toMatch(/^https:\/\//);
    expect(url).not.toMatch(LOCAL_HOST_PATTERN);
  });

  it('preview build produces an installable internal-distribution APK', () => {
    expect(easConfig.build.preview.distribution).toBe('internal');
    expect(easConfig.build.preview.android?.buildType).toBe('apk');
  });

  it('preview profile sets a schoolSlug alongside the API URL — /api/mobile/login cannot resolve a tenant without one', () => {
    expect(easConfig.build.preview.env?.EXPO_PUBLIC_SCHOOL_SLUG).toBe('royal-public-school');
  });
});
