import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenDenylistService {
  // In-memory set — simple and sufficient for this assignment
  private readonly revokedTokens = new Set<string>();

  revoke(token: string): void {
    this.revokedTokens.add(token);
  }

  isRevoked(token: string): boolean {
    return this.revokedTokens.has(token);
  }
}