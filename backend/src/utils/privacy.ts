export class PrivacyHelper {
  /**
   * Mask Government ID e.g. "123456784821" -> "XXXX XXXX 4821"
   */
  static maskGovId(idNumber?: string | null): string {
    if (!idNumber) return '';
    const clean = idNumber.replace(/\s+/g, '');
    if (clean.length <= 4) return 'XXXX';
    const last4 = clean.slice(-4);
    return `XXXX XXXX ${last4}`;
  }

  /**
   * Sanitizes seller ticket view so buyer details are not revealed
   */
  static sanitizeForSeller<T extends Record<string, any>>(data: T): T {
    const copy = { ...data };
    if ('buyerGovIdNumber' in copy) {
      delete copy.buyerGovIdNumber;
    }
    return copy;
  }

  /**
   * Sanitizes buyer ticket view so seller details are not revealed
   */
  static sanitizeForBuyer<T extends Record<string, any>>(data: T): T {
    const copy = { ...data };
    if ('seller' in copy) {
      delete copy.seller;
    }
    return copy;
  }
}
