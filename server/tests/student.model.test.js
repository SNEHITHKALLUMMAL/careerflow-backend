import mongoose from 'mongoose';
import { Student } from '../models/Student.model.js';

const fakeUserId = new mongoose.Types.ObjectId();

describe('Student model schema validation', () => {
  it('requires a userId', () => {
    const student = new Student({});
    const err = student.validateSync();
    expect(err.errors.userId).toBeDefined();
  });

  it('is valid with just a userId', () => {
    const student = new Student({ userId: fakeUserId });
    const err = student.validateSync();
    expect(err).toBeUndefined();
  });

  it('rejects an education entry missing required fields', () => {
    const student = new Student({
      userId: fakeUserId,
      education: [{ degree: 'B.Tech' }], // missing institution + startYear
    });
    const err = student.validateSync();
    expect(err.errors['education.0.institution']).toBeDefined();
    expect(err.errors['education.0.startYear']).toBeDefined();
  });

  it('rejects a skill with an invalid proficiency enum value', () => {
    const student = new Student({
      userId: fakeUserId,
      skills: [{ name: 'JavaScript', proficiency: 'guru' }],
    });
    const err = student.validateSync();
    expect(err.errors['skills.0.proficiency']).toBeDefined();
  });

  it('defaults skill.verified to false', () => {
    const student = new Student({
      userId: fakeUserId,
      skills: [{ name: 'JavaScript' }],
    });
    expect(student.skills[0].verified).toBe(false);
  });

  it('rejects a cgpa outside the 0-10 range', () => {
    const student = new Student({
      userId: fakeUserId,
      education: [{ degree: 'B.Tech', institution: 'MIT', startYear: 2020, cgpa: 11 }],
    });
    const err = student.validateSync();
    expect(err.errors['education.0.cgpa']).toBeDefined();
  });

  it('accepts a fully valid nested document', () => {
    const student = new Student({
      userId: fakeUserId,
      education: [
        { degree: 'B.Tech', institution: 'MIT', startYear: 2020, endYear: 2024, cgpa: 8.5 },
      ],
      skills: [{ name: 'JavaScript', proficiency: 'advanced' }],
      projects: [{ title: 'CareerFlow', techStack: ['React', 'Node'] }],
    });
    const err = student.validateSync();
    expect(err).toBeUndefined();
  });
});
