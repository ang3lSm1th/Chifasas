import * as crypto from 'crypto';

export class TimingSafeUtil {
  /**
   * Compara dos strings en tiempo constante para prevenir Timing Attacks.
   */
  static safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      // Comparar buffer ficticio de misma longitud para mantener tiempo constante
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }
}
