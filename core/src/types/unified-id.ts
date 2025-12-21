/**
 * Represents a MongoDB ObjectId that is safe to use between client and server.
 */
export type UnifiedId =
  | string
  | { toString(): string; equals?: (other: any) => boolean };

// A lightweight mock that simulates MongoDB ObjectId behavior
export class MockUnifiedId {
  private value: string;

  constructor(value?: string) {
    // Generate a random string if none provided, mimicking a unique ID
    this.value = value || Math.random().toString(36).substring(2, 15);
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  // Optional: Add 'equals' if your application code uses it
  equals(other: MockUnifiedId | string): boolean {
    return this.toString() === other.toString();
  }
}
