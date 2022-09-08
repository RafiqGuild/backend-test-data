import { faker } from '@faker-js/faker';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import gaussian from 'gaussian';

/***** config *****/

const studentCount = 100000;
const gradeValues = [4, 3.7, 3.3, 3.0, 2.7, 2.3, 2.0, 1.7, 1.3, 1.0, 0.7, 0];
const earliestYear = 2002;
const grades = {
    4: 'A',
    3.7: 'A-',
    3.3: 'B+',
    3.0: 'B',
    2.7: 'B-',
    2.3: 'C+',
    2.0: 'C',
    1.7: 'C-',
    1.3: 'D+',
    1.0: 'D',
    0.7: 'D-',
    0: 'F',
};

/***** runtime *****/

// generate majors/course names
const majors = generateMajorsCsv();
generateCourses(majors);

// generate students/enrollments
const students = generateStudents(studentCount);
generateEnrollments(students, majors);

console.log('all done!');

/***** generator functions *****/

function generateEnrollments(students, majors) {
    // cycle through each student and randomly select major vs non major courses based on major credits / 120 ratio (with slight bias toward major)
    const enrollments = [];
    let count = 0;
    for (const [id, student] of Object.entries(students)) {
        count++;
        if (count % 1000 === 0) {
            console.log(`student ${count}`);
        }

        // determine major credit ratio
        const studentMajor = majors[student.major];
        const majorCreditRatio = studentMajor ? 0.15 + studentMajor.credits / 120 : 0;

        // randomize credit profile
        const baseCredits = randomRangeInt(1, 31);
        let multiplier;
        const multiplierRoll = Math.random();
        if (multiplierRoll >= 0.95) {
            // 5% - no enrollments
            multiplier = 0;
        } else if (multiplierRoll >= 0.65) {
            // 30% - 1-30 credits
            multiplier = 1;
        } else if (multiplierRoll >= 0.4) {
            // 25% - 31-60 credits
            multiplier = 2;
        } else if (multiplierRoll >= 0.2) {
            // 20% - 61-90 credits
            multiplier = 3;
        } else if (multiplierRoll >= 0.05) {
            // 15% - 91-120 credits
            multiplier = 4;
        } else {
            // 5% - 121-150 credits
            multiplier = 5;
        }
        const totalCredits = baseCredits * multiplier;

        // random grade profile
        const averageGrade = randomRange(2, 4);
        const gradeStdDev = randomRange(0.25, 1);
        const gradeDistribution = gaussian(averageGrade, gradeStdDev * gradeStdDev)

        // determine enrollment range
        const enrollmentRangeYears = randomRangeInt(1, 7);
        const startEnrollmentYear = earliestYear + randomRangeInt(0, 20 - enrollmentRangeYears);
        const endEnrollmentYear = startEnrollmentYear + enrollmentRangeYears;

        // debug student info
        // console.log('student', student);
        // console.log('major', studentMajor?.name, totalCredits);
        // console.log('target gpa', `${averageGrade} (std dev: ${gradeStdDev})`);
        // console.log('year range', enrollmentRangeYears, startEnrollmentYear, endEnrollmentYear);

        // pick randomized enrollments to satisfy credits/ratio
        let remainingCredits = totalCredits;
        const majorCourses = studentMajor ? JSON.parse(JSON.stringify(studentMajor.courses)) : [];
        const nonMajorIds = Object.keys(majors).filter(id => id !== student.major);
        while (remainingCredits > 0) {
            const subjectRoll = Math.random();
            let courseCredits = 0;
            let course;
            // decide if major or non-major course
            if (subjectRoll < majorCreditRatio && majorCourses.length > 0) {
                // pick random major course
                const randomElement = Math.floor(Math.random()*majorCourses.length);
                course = majorCourses[randomElement];
                courseCredits += course.credits;
                majorCourses.splice(randomElement, 1);
            } else {
                // pick random non-major course
                const randomMajor = majors[nonMajorIds[Math.floor(Math.random()*nonMajorIds.length)]].courses;
                const randomElement = Math.floor(Math.random()*randomMajor.length);
                course = randomMajor[randomElement];
                courseCredits += course.credits;
            }

            // course start/end dates
            const startDate = randomRangeDate(new Date(startEnrollmentYear, 1, 1), new Date(endEnrollmentYear, 12, 31));
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate()+randomRangeInt(45,150));

            // grade
            const courseGrade = gradeDistribution.ppf(Math.random());
            const gradeValue = gradeValues.reduce((prev, curr) => Math.abs(curr - courseGrade) < Math.abs(prev - courseGrade) ? curr : prev);
            let letterGrade = grades[gradeValue];
            letterGrade = letterGrade === 'A' && Math.random() > 0.8 ? 'A+' : letterGrade;

            // generate enrollment - student id,course name,credit hours,start date,end date,cost,letter grade
            enrollments.push([
                id,
                course.name,
                course.credits,
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0],
                course.cost,
                letterGrade,
            ]);

            remainingCredits -= courseCredits;
        }
    }

    console.log(`enrollments: ${enrollments.length}`);

    // randomize order & write to csv
    const enrollmentStream = fs.createWriteStream('enrollments.csv');
    enrollmentStream.write("student id,course name,credit hours,start date,end date,cost,letter grade\n");

    let enrollmentCount = 0;
    while (enrollments.length > 0) {
        enrollmentCount++;
        if (enrollmentCount % 1000 === 0) {
            console.log(`enrollment ${enrollmentCount}`);
        }

        const randomElement = Math.floor(Math.random()*enrollments.length);
        enrollmentStream.write(`${enrollments[randomElement].join(',')}\n`);
        enrollments.splice(randomElement, 1);
    }

    enrollmentStream.end();
}

function generateMajorsCsv() {
    const majorStream = fs.createWriteStream('majors.csv');
    majorStream.write("id,name,credits required,minimum gpa\n");
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
        ['Fine Art', 40, 3.2],
        ['Journalism', 30, 3.7],
        ['Psychology', 45, 3.3]
    ].forEach(major => {
        const id = uuid();
        const csvLine = `${id},${major[0]},${major[1]},${major[2]}\n`;
        majors[id] = {
            id,
            name: major[0],
            credits: major[1],
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
        ['Intro to {major}',3,6,150,500],
        ['{major} 1000',3,6,200,650],
        ['{major} 2000',3,6,250,650],
        ['{major} 3000',3,6,300,650],
        ['{major} 4000',3,6,350,650],
        ['{major} 5000',3,6,400,750],
        ['{major} 6000',3,6,400,750],
        ['{major} 7000',3,6,400,750],
        ['{major} 8000',3,6,400,750],
        ['Seminar in {major}',3,6,400,800],
        ['Readings in {major}',3,6,400,800],
        ['Special Topics in {major}',3,8,300,800],
        ['Thesis in {major}',3,8,500,700],
        ['{major} in the Real-World',3,8,500,700],
        ['{major} for non-Majors',3,8,500,700],
    ];
    for (const [_, major] of Object.entries(majors)) {
        courseLevels.forEach(course => {
            const courseData = {
                name: course[0].replace('{major}', major.name),
                credits: randomRangeInt(course[1], course[2]),
                cost: randomRangeInt(course[3], course[4]),
            }
            major.courses.push(courseData);
        })
    }
}

function generateStudents(number) {
    const studentStream = fs.createWriteStream('students.csv');
    studentStream.write("id,name,major\n");
    const students = {};
    for (let i = 0; i < number; i ++) {
        const id = uuid();
        const name = faker.name.fullName()
        // give 80% of students a major
        let major = Math.random() < 0.8 ? randomProperty(majors).id : null;
        studentStream.write(`${id},${name},${major}\n`);
        students[id] = {
            id,
            name,
            major
        }
    }
    studentStream.end();

    return students;
}

/***** utility functions *****/

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}
function randomRangeInt(min, max) {
    return parseInt(randomRange(min, max));
}
function randomRangeDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function randomProperty(obj) {
    const keys = Object.keys(obj);
    return obj[keys[ keys.length * Math.random() << 0]];
}
