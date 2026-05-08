import type { Profile } from './store';

export const PROFILES: Profile[] = [
  {
    id: 'p1',
    name: 'Main Account',
    handle: '@user_one',
    mode: 'regular',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'p2',
    name: 'Kids Mode',
    handle: 'Kids Safe',
    mode: 'kids',
    avatar: require('../assets/kids-mode.png'),
  },
];

export function getProfileHomeRoute(profile: Profile) {
  return profile.mode === 'kids' ? '/kids-home' : '/(tabs)';
}

