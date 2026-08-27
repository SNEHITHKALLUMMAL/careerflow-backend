import { jest } from '@jest/globals';

// Mock the Notification model so we can force a write failure without a real DB.
jest.unstable_mockModule('../models/Notification.model.js', () => ({
  Notification: {
    create: jest.fn(),
    insertMany: jest.fn(),
  },
}));
jest.unstable_mockModule('../models/User.model.js', () => ({ User: { find: jest.fn() } }));
jest.unstable_mockModule('../models/Student.model.js', () => ({ Student: { find: jest.fn() } }));

const { Notification } = await import('../models/Notification.model.js');
const { User } = await import('../models/User.model.js');
const { Student } = await import('../models/Student.model.js');
const {
  notifyUser,
  notifyUsers,
  notifyUserSafely,
  notifyUsersSafely,
  sendManualNotification,
} = await import('../services/notification.service.js');

describe('notification.service — failure isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Silence the expected console.error from the swallowed-failure cases.
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('the raw notifyUser rethrows a failure — used where sending IS the primary action', async () => {
    Notification.create.mockRejectedValue(new Error('DB write failed'));
    await expect(notifyUser('user1', { type: 'system', title: 't', message: 'm' })).rejects.toThrow(
      'DB write failed'
    );
  });

  it('the raw notifyUsers rethrows a failure', async () => {
    Notification.insertMany.mockRejectedValue(new Error('DB write failed'));
    await expect(notifyUsers(['user1'], { type: 'system', title: 't', message: 'm' })).rejects.toThrow(
      'DB write failed'
    );
  });

  it('notifyUserSafely swallows a failure instead of throwing — used as a side effect of another action', async () => {
    Notification.create.mockRejectedValue(new Error('DB write failed'));
    await expect(
      notifyUserSafely('user1', { type: 'system', title: 't', message: 'm' })
    ).resolves.toBeNull();
  });

  it('notifyUsersSafely swallows a failure and returns an empty array', async () => {
    Notification.insertMany.mockRejectedValue(new Error('DB write failed'));
    await expect(
      notifyUsersSafely(['user1'], { type: 'system', title: 't', message: 'm' })
    ).resolves.toEqual([]);
  });

  it('notifyUserSafely still returns the created notification on success', async () => {
    Notification.create.mockResolvedValue({ _id: 'n1' });
    await expect(
      notifyUserSafely('user1', { type: 'system', title: 't', message: 'm' })
    ).resolves.toEqual({ _id: 'n1' });
  });
});

describe('notification.service — sendManualNotification (college-scoping guard)', () => {
  const COLLEGE_A = 'collegeA';
  const COLLEGE_B = 'collegeB';

  beforeEach(() => {
    jest.clearAllMocks();
    Notification.insertMany.mockResolvedValue([{ _id: 'n1' }]);
  });

  it('a non-superAdmin sender is forced to their own collegeId, even if they request another', async () => {
    User.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: 'student1' }]) });
    Student.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });

    await sendManualNotification(
      { role: 'placementOfficer', collegeId: COLLEGE_A },
      { collegeId: COLLEGE_B, title: 't', message: 'm' }
    );

    expect(User.find).toHaveBeenCalledWith(
      expect.objectContaining({ collegeId: COLLEGE_A, role: 'student' })
    );
  });

  it('a non-superAdmin sender cannot target arbitrary userIds outside their own college', async () => {
    Student.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ userId: 'legit-student' }]) });

    await sendManualNotification(
      { role: 'mentor', collegeId: COLLEGE_A },
      { userIds: ['legit-student', 'someone-elses-student'], title: 't', message: 'm' }
    );

    // The service must have filtered candidate userIds down to students within its own college.
    expect(Student.find).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: { $in: ['legit-student', 'someone-elses-student'] },
        collegeId: COLLEGE_A,
      })
    );
  });

  it('rejects a non-superAdmin sender with no college on file', async () => {
    await expect(
      sendManualNotification({ role: 'mentor', collegeId: null }, { title: 't', message: 'm' })
    ).rejects.toThrow('not linked to a college');
  });

  it('superAdmin retains unrestricted targeting — any collegeId, any userIds', async () => {
    User.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });

    await sendManualNotification(
      { role: 'superAdmin', collegeId: null },
      { collegeId: COLLEGE_B, userIds: ['anyone'], title: 't', message: 'm' }
    );

    expect(User.find).toHaveBeenCalledWith(expect.objectContaining({ collegeId: COLLEGE_B }));
    expect(Student.find).not.toHaveBeenCalled(); // superAdmin's userIds aren't filtered
  });
});
