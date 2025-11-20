import { FlatService } from './FlatService';

// Export các types
export * from './types';

// Export các service con
export * from './services/auth.service';
export * from './services/room.service';
export * from './services/user.service';


export { FlatService };

// Export singleton instance
export const flatService = new FlatService();
