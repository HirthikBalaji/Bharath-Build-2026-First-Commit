export interface OperatorReissueRequest {
  original_ticket_id: string; // e.g. "SB-92831"
  new_passenger: {
    name: string;
    age: number;
    gender: string;
    phone?: string;
  };
}

export interface OperatorReissueResponse {
  success: boolean;
  new_ticket_id: string; // e.g. "SR-92831"
  original_ticket_status: 'INVALIDATED' | 'CANCELLED';
  new_ticket_status: 'CONFIRMED';
  operator_auth_code: string;
  reissued_at: string;
}

export class MockOperatorService {
  /**
   * Simulates real bus operator's passenger reissuance endpoint.
   * This is designed according to section 13 & 25 of the architecture:
   * It enforces operator-authorized reissue, returns new ticket IDs,
   * and can easily be swapped with RedBus, AbhiBus, or private operator GDS APIs.
   */
  static async requestReissue(
    operatorCode: string,
    req: OperatorReissueRequest
  ): Promise<OperatorReissueResponse> {
    // Simulate slight API latency to realistic operator GDS
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Generate operator ticket format e.g. "SR-92831" or "SR-<random5>"
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const newTicketId = `SR-${randomSuffix}`;
    const authCode = `AUTH-OP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    return {
      success: true,
      new_ticket_id: newTicketId,
      original_ticket_status: 'INVALIDATED',
      new_ticket_status: 'CONFIRMED',
      operator_auth_code: authCode,
      reissued_at: new Date().toISOString()
    };
  }

  /**
   * Check operator capability configuration (Section 25)
   */
  static getOperatorCapabilities(operatorCode: string) {
    return {
      operator_code: operatorCode,
      supports_resale: true,
      supports_passenger_reissue: true,
      minimum_resale_window_minutes: 60,
      maximum_resale_price: 'FACE_VALUE',
      reissue_fee_waived: true
    };
  }
}
