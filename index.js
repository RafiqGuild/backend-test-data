import { faker } from '@faker-js/faker';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

// 1 - generate majors
const majors = generateMajorsCsv();
console.log(majors);

// 8 levels per course (no csv):
// Intro to {x}, {x} 1000/2000/3000/4000/5000, Special Topics in {x}, Graduate Thesis in {x}

// generate 50k students (id], name)

// generate 1M enrollments

// id, name, major credits, min gpa
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
        majors[id] = major[0];
        majorStream.write(csvLine);
    });

    majorStream.end();

    return majors;
}
