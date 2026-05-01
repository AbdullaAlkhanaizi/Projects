import fs from 'fs';
import path from 'path';

const [, , filename, command, elem, countArg] = process.argv;
const filePath = filename && path.resolve(process.cwd(), filename);

function printHelp() {
    console.log(`Commands:
- create: takes a filename as argument and create it (should have \`.json\` extension specified)
- delete: takes a filename as argument and delete it
- add: add a new element or increase quantity; usage: add <elem> [count]
- rm: remove or decrease quantity; usage: rm <elem> [count]
- ls: list all elements
- help: print this help message`);
}

if (!filename || !command || command === 'help') {
    printHelp();
    process.exit(0);
}

switch (command) {
    case 'create':
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
        break;

    case 'delete':
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        break;

    case 'add': {
        if (!elem) {
            console.error('No elem specified.');
            break;
        }
        let list = {};
        if (fs.existsSync(filePath)) {
            try { list = JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch { };
        }
        let count = parseInt(countArg, 10);
        if (isNaN(count)) count = 1;
        if (count < 0) {
            // negative add acts as rm
            const rmCount = -count;
            const cur = list[elem] || 0;
            const newVal = cur - rmCount;
            if (newVal > 0) list[elem] = newVal;
            else delete list[elem];
        } else {
            list[elem] = (list[elem] || 0) + count;
        }
        fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
        break;
    }

    case 'rm': {
        if (!elem) {
            console.error('No elem specified.');
            break;
        }
        let list = {};
        if (fs.existsSync(filePath)) {
            try { list = JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch { };
        }
        if (!countArg) {
            delete list[elem];
        } else {
            const count = parseInt(countArg, 10);
            if (isNaN(count)) {
                console.error('Unexpected request: nothing has been removed.');
                break;
            }
            if (count < 0) {
                // negative rm acts as add
                const addCount = -count;
                list[elem] = (list[elem] || 0) + addCount;
            } else {
                const cur = list[elem] || 0;
                const newVal = cur - count;
                if (newVal > 0) list[elem] = newVal;
                else delete list[elem];
            }
        }
        fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
        break;
    }

    case 'ls':
    default: {
        let list = {};
        if (fs.existsSync(filePath)) {
            try { list = JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch { };
        }
        const entries = Object.entries(list);
        if (entries.length === 0) console.log('Empty list.');
        else entries.forEach(([key, val]) => console.log(`- ${key} (${val})`));
        break;
    }
}
