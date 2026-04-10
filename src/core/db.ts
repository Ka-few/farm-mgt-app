import { v4 as uuidv4 } from 'uuid';

export const initDb = async () => {
  // Database is now handled by the Rust backend.
  console.log('Database initialization handled by backend');
};

export const generateId = () => uuidv4();

// getDb and other direct SQL calls are removed to ensure
// all data operations go through the Rust backend commands.
