import fs from 'fs';
import path from 'path';
const [, , guestsDir, outputFile] = process.argv;
const outputPath = path.resolve(process.cwd(), outputFile);
let shopping = {};
if (fs.existsSync(outputPath)) {
    try { shopping = JSON.parse(fs.readFileSync(outputPath, 'utf-8')); } catch { }
}
let files = [];
try { files = fs.readdirSync(guestsDir).filter(f => f.endsWith('.json')); } catch { process.exit(1); }
const vipGuests = files.map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(guestsDir, f), 'utf-8')); } catch { return null; }
}).filter(g => g && g.answer === 'yes');
if (vipGuests.length === 0) {
    console.log('No one is coming.');
    process.exit(0);
}
let drinks = { 'iced tea': 0, water: 0, 'sparkling water': 0, softs: 0 };
let foodCats = { veg: 0, carnivore: 0, fish: 0, omnivore: 0 };
vipGuests.forEach(g => {
    const d = (g.drink || '').toLowerCase();
    if (d === 'iced tea' || d === 'iced-tea') drinks['iced tea']++;
    else if (d === 'water') drinks.water++;
    else if (d === 'sparkling water' || d === 'sparkling-water') drinks['sparkling water']++;
    else if (d === 'softs' || d === 'soft') drinks.softs++;
    const f = (g.food || '').toLowerCase();
    if (['veg', 'vegan', 'vegetarian', 'veggie'].includes(f)) foodCats.veg++;
    else if (f === 'carnivore') foodCats.carnivore++;
    else if (f === 'fish' || f === 'fish lover') foodCats.fish++;
    else if (f === 'omnivore' || f === 'everything') foodCats.omnivore++;
});
const vipCount = vipGuests.length;
const newList = {};
if (drinks['iced tea'] > 0) newList['iced-tea-bottles'] = Math.ceil(drinks['iced tea'] / 6);
if (drinks.water > 0) newList['water-bottles'] = Math.ceil(drinks.water / 4);
if (drinks['sparkling water'] > 0) newList['sparkling-water-bottles'] = Math.ceil(drinks['sparkling water'] / 4);
if (drinks.softs > 0) newList['soft-bottles'] = Math.ceil(drinks.softs / 4);
if (foodCats.veg > 0) {
    const packs = Math.ceil(foodCats.veg / 3);
    newList.eggplants = packs;
    newList.courgettes = packs;
    newList.mushrooms = foodCats.veg;
    newList.hummus = packs;
}
if (foodCats.carnivore > 0) newList.burgers = foodCats.carnivore;
if (foodCats.fish > 0) newList.sardines = foodCats.fish;
if (foodCats.omnivore > 0) newList.kebabs = foodCats.omnivore;
newList.potatoes = vipCount;
Object.assign(shopping, newList);
fs.writeFileSync(outputPath, JSON.stringify(shopping, null, 2));