import { type UseCase, type InsertUseCase } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createUseCase(useCase: InsertUseCase): Promise<UseCase>;
  getUseCase(id: string): Promise<UseCase | undefined>;
  getUserUseCases(): Promise<UseCase[]>;
  updateUseCase(id: string, updates: Partial<InsertUseCase>): Promise<UseCase | undefined>;
  deleteUseCase(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private useCases: Map<string, UseCase>;

  constructor() {
    this.useCases = new Map();
  }

  async createUseCase(insertUseCase: InsertUseCase): Promise<UseCase> {
    const id = randomUUID();
    const now = new Date();
    const useCase: UseCase = {
      ...insertUseCase,
      id,
      searchFilters: insertUseCase.searchFilters || [],
      resultColumns: insertUseCase.resultColumns || [],
      entityFields: insertUseCase.entityFields || [],
      createdAt: now,
      updatedAt: now,
    };
    this.useCases.set(id, useCase);
    return useCase;
  }

  async getUseCase(id: string): Promise<UseCase | undefined> {
    return this.useCases.get(id);
  }

  async getUserUseCases(): Promise<UseCase[]> {
    return Array.from(this.useCases.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async updateUseCase(id: string, updates: Partial<InsertUseCase>): Promise<UseCase | undefined> {
    const existing = this.useCases.get(id);
    if (!existing) return undefined;

    const updated: UseCase = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.useCases.set(id, updated);
    return updated;
  }

  async deleteUseCase(id: string): Promise<boolean> {
    return this.useCases.delete(id);
  }
}

export const storage = new MemStorage();
