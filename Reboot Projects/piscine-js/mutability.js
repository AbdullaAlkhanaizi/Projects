
const clone1 = { ...person };
const clone2 = { ...person };

person.age += 1;
person.country = 'FR';

const samePerson = person;

console.log(typeof samePerson === 'object')