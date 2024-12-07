import { Database } from '../../../lib/db/index';
import type { Contract, SyncStatus } from '../../../lib/types';
import { MONITORED_CONTRACTS } from '../types/contracts';

export class Storage {
  static async getContractData(address: string): Promise<Contract | null> {
    return Database.getContract(address);
  }

  static async getAllContractData(): Promise<Contract[]> {
    const contract = await Database.getContract('*');
    return contract ? [contract] : [];
  }

  static async updateContract(address: string, data: Partial<Contract>): Promise<void> {
    await Database.updateContract(address, data);
  }

  static async getSyncStatus(address: string): Promise<SyncStatus | null> {
    return Database.getSyncStatus(address);
  }

  static async getAllSyncStatus(): Promise<SyncStatus[]> {
    const addresses = Object.values(MONITORED_CONTRACTS).map(c => c.address);
    const statuses = await Promise.all(
      addresses.map(address => Database.getSyncStatus(address))
    );
    return statuses.filter((status): status is SyncStatus => status !== null);
  }

  static async updateSyncStatus(address: string, data: Partial<SyncStatus>): Promise<void> {
    await Database.updateSyncStatus(address, data);
  }
} 