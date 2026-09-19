import { createDatabase } from '../shared/db.js';
import { seedMenu } from './seed.js';

const db = createDatabase();
seedMenu(db);
console.log('Seed Platanópolis listo (upsert por nombre).');
db.close();
