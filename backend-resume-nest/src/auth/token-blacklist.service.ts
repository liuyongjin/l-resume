import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
  private blacklist: Set<string> = new Set();

  add(token: string): void {
    this.blacklist.add(token);
  }

  has(token: string): boolean {
    return this.blacklist.has(token);
  }

  remove(token: string): void {
    this.blacklist.delete(token);
  }

  clear(): void {
    this.blacklist.clear();
  }
}