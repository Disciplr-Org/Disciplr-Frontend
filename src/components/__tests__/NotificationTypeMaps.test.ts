import { describe, it, expect } from 'vitest';
import {
  notificationTypeIcons,
  notificationTypeColors,
  getNotifications,
} from '../Notification/exampleNotification/example';

const TYPES = [
  'vault_created_successfully',
  'milestone_validated',
  'vault_deadline_approaching',
  'funds_released',
  'funds_redirected',
  'verification_requested',
  'system_announcement',
];

describe('notificationTypeIcons', () => {
  it.each(TYPES)('%s resolves to a non-null icon', (type) => {
    expect(notificationTypeIcons[type]).toBeTruthy();
  });

  it('unknown type returns undefined without throwing', () => {
    expect(() => notificationTypeIcons['unknown_type']).not.toThrow();
    expect(notificationTypeIcons['unknown_type']).toBeUndefined();
  });
});

describe('notificationTypeColors', () => {
  it.each(TYPES)('%s resolves to a non-empty color string', (type) => {
    expect(typeof notificationTypeColors[type]).toBe('string');
    expect(notificationTypeColors[type].length).toBeGreaterThan(0);
  });

  it('unknown type returns undefined without throwing', () => {
    expect(() => notificationTypeColors['unknown_type']).not.toThrow();
    expect(notificationTypeColors['unknown_type']).toBeUndefined();
  });
});

describe('getNotifications', () => {
  it('every notification type has a matching icon and color', () => {
    const notifications = getNotifications();
    for (const n of notifications) {
      expect(notificationTypeIcons[n.type]).toBeTruthy();
      expect(notificationTypeColors[n.type]).toBeTruthy();
    }
  });
});
