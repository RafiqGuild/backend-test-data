import { faker } from '@faker-js/faker';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

// generate majors/course names
const majors = generateMajorsCsv();
generateCourses(majors);

// generate students
const students = generateStudents(50000);

// 4 - TODO generate 1M enrollments

function generateMajorsCsv() {
    const majorStream = fs.createWriteStream('majors.csv');
    majorStream.write("id,name,credits_required,min_gpa\n");
    const majors = {};
    [
        ['Communications', 30, 3.1],
        ['Mathematics', 30, 3.2],
        ['Applied Mathematics', 35, 3.5],
        ['Computer Science', 35, 3.2],
        ['Physics', 45, 3.8],
        ['Marketing', 45, 3.1],
        ['Anatomy', 40, 3.7],
        ['Fine Art', 60, 3.2],
        ['Journalism', 30, 3.7],
        ['Psychology', 45, 3.3]
    ].forEach(major => {
        const id = uuid();
        const csvLine = `${id},${major[0]},${major[1]},${major[2]}\n`;
        majors[id] = {
            id,
            name: major[0],
            courses: [],
        }
        majorStream.write(csvLine);
    });

    majorStream.end();

    return majors;
}

function generateCourses(majors) {
    const courseLevels = [
        'Intro to {major}',
        '{major} 1000',
        '{major} 2000',
        '{major} 3000',
        '{major} 4000',
        '{major} 5000',
        'Special Topics in {major}',
        'Thesis in {major}',
    ];
    for (const [_, major] of Object.entries(majors)) {
        courseLevels.forEach(course => {
            major.courses.push(course.replace('{major}', major.name));
        })
    }
}

function generateStudents(number) {
    const studentStream = fs.createWriteStream('students.csv');
    studentStream.write("id,name\n");
    const students = {};
    for (let i = 0; i < number; i ++) {
        const id = uuid();
        const name = faker.name.fullName()
        students[id] = name;
        studentStream.write(`${id},${name}\n`);
    }
    studentStream.end();

    return students;
}
