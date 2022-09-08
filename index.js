import { faker } from '@faker-js/faker';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

// generate majors/course names
const majors = generateMajorsCsv();
generateCourses(majors);

// generate students
const students = generateStudents(50000);

// 4 - TODO generate 1M enrollments (approx)
// cycle through each student and randomly select major vs non major courses based on major credits / 120 ratio (with slight bias toward major)
// don't allow duplicates (except some small percentage of time)
// bucket into credit/grade profiles and generate enrollments based on that until total credits satisfied
// make some small amount of A into A+ just to mix things up
// course start/end dates - should be 60-120 days apart, students total date range for all enrollments should be within 0.5-6 years

// credit profiles
// 5% - no enrollments
// 30% - 1-30 credits
// 25% - 31-60 credits
// 20% - 61-90 credits
// 15% - 91-120 credits
// 5% - 121-150 credits

// grade profiles
// 10% - completely random
// 10% - all A/A+
// 15% - A- average
// 25% - B+ average
// 20% - B average
// 20% - C average

function generateMajorsCsv() {
    const majorStream = fs.createWriteStream('majors.csv');
    majorStream.write("id,name,credits_required,min_gpa\n");
    const majors = {};
    // name, credits, gpa
    [
        ['Communications', 30, 3.1],
        ['Mathematics', 30, 3.2],
        ['Applied Mathematics', 35, 3.5],
        ['Computer Science', 35, 3.2],
        ['Physics', 45, 3.8],
        ['Marketing', 45, 3.1],
        ['Anatomy', 40, 3.7],
        ['Fine Art', 50, 3.2],
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
        // name, credits min/max, cost min/max
        ['Intro to {major}',1,4,150,500],
        ['{major} 1000',2,5,200,550],
        ['{major} 2000',2,5,250,650],
        ['{major} 3000',3,6,300,650],
        ['{major} 4000',3,6,350,700],
        ['{major} 5000',3,5,400,700],
        ['Special Topics in {major}',1,6,300,600],
        ['Thesis in {major}',1,6,500,700],
    ];
    for (const [_, major] of Object.entries(majors)) {
        courseLevels.forEach(course => {
            const courseData = {
                name: course[0].replace('{major}', major.name),
                credits: randomRange(course[1], course[2]),
                cost: randomRange(course[3], course[4]),
            }
            major.courses.push(courseData);
        })
    }
}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function randomRange(min, max) {
    return parseInt(Math.random() * (max - min) + min);
}

function generateStudents(number) {
    const studentStream = fs.createWriteStream('students.csv');
    studentStream.write("id,name,major\n");
    const students = {};
    for (let i = 0; i < number; i ++) {
        const id = uuid();
        const name = faker.name.fullName()
        students[id] = name;
        // give 80% of students a major
        let major = Math.random() < 0.8 ? randomProperty(majors).id :'';
        studentStream.write(`${id},${name},${major}\n`);
    }
    studentStream.end();

    return students;
}

function randomProperty(obj) {
    const keys = Object.keys(obj);
    return obj[keys[ keys.length * Math.random() << 0]];
}
